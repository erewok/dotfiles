(function() {
  var Range, SuggestionBuilder, filter,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Range = require('atom').Range;

  filter = require('fuzzaldrin').filter;

  module.exports = SuggestionBuilder = (function() {
    SuggestionBuilder.prototype.typeScope = ['meta.type-signature.haskell'];

    SuggestionBuilder.prototype.sourceScope = ['source.haskell'];

    SuggestionBuilder.prototype.moduleScope = ['meta.import.haskell', 'support.other.module.haskell'];

    SuggestionBuilder.prototype.preprocessorScope = ['meta.preprocessor.haskell'];

    SuggestionBuilder.prototype.instancePreprocessorScope = ['meta.declaration.instance.haskell', 'meta.preprocessor.haskell'];

    SuggestionBuilder.prototype.exportsScope = ['meta.import.haskell', 'meta.declaration.exports.haskell'];

    SuggestionBuilder.prototype.pragmaWords = ['LANGUAGE', 'OPTIONS_GHC', 'INCLUDE', 'WARNING', 'DEPRECATED', 'INLINE', 'NOINLINE', 'ANN', 'LINE', 'RULES', 'SPECIALIZE', 'UNPACK', 'SOURCE'];

    SuggestionBuilder.prototype.instancePragmaWords = ['INCOHERENT', 'OVERLAPPABLE', 'OVERLAPPING', 'OVERLAPS'];

    function SuggestionBuilder(options, backend) {
      this.options = options;
      this.backend = backend;
      this.getSuggestions = __bind(this.getSuggestions, this);
      this.preprocessorSuggestions = __bind(this.preprocessorSuggestions, this);
      this.moduleSuggestions = __bind(this.moduleSuggestions, this);
      this.symbolSuggestions = __bind(this.symbolSuggestions, this);
      this.processSuggestions = __bind(this.processSuggestions, this);
      this.getPrefix = __bind(this.getPrefix, this);
      this.lineSearch = __bind(this.lineSearch, this);
      this.buffer = this.options.editor.getBuffer();
      this.lineRange = new Range([this.options.bufferPosition.row, 0], this.options.bufferPosition);
      this.line = this.buffer.getTextInRange(this.lineRange);
      this.mwl = this.options.activatedManually ? 0 : atom.config.get('autocomplete-plus.minimumWordLength');
    }

    SuggestionBuilder.prototype.lineSearch = function(rx, idx) {
      var _ref;
      if (idx == null) {
        idx = 0;
      }
      return ((_ref = this.line.match(rx)) != null ? _ref[0] : void 0) || '';
    };

    SuggestionBuilder.prototype.isIn = function(scope) {
      return scope.every((function(_this) {
        return function(s1) {
          return __indexOf.call(_this.options.scopeDescriptor.scopes, s1) >= 0;
        };
      })(this));
    };

    SuggestionBuilder.prototype.getPrefix = function(rx) {
      if (rx == null) {
        rx = /[\w.']+$/;
      }
      return this.lineSearch(rx);
    };

    SuggestionBuilder.prototype.buildSymbolSuggestion = function(s, prefix) {
      var _ref, _ref1;
      return {
        text: (_ref = s.qname) != null ? _ref : s.name,
        rightLabel: (_ref1 = s.module) != null ? _ref1.name : void 0,
        type: s.symbolType,
        replacementPrefix: prefix,
        description: s.name + " :: " + s.typeSignature
      };
    };

    SuggestionBuilder.prototype.buildSimpleSuggestion = function(type, text, prefix, label) {
      return {
        text: text,
        type: type,
        replacementPrefix: prefix,
        rightLabel: label
      };
    };

    SuggestionBuilder.prototype.processSuggestions = function(f, rx, p) {
      var prefix;
      if (typeof rx === 'function') {
        p = rx;
        rx = void 0;
      }
      prefix = this.getPrefix(rx);
      if (prefix.length < this.mwl) {
        return [];
      }
      return f(this.buffer, prefix, this.options.bufferPosition).then(function(symbols) {
        return symbols.map(function(s) {
          return p(s, prefix);
        });
      });
    };

    SuggestionBuilder.prototype.symbolSuggestions = function(f) {
      return this.processSuggestions(f, this.buildSymbolSuggestion);
    };

    SuggestionBuilder.prototype.moduleSuggestions = function() {
      return this.processSuggestions(this.backend.getCompletionsForModule, (function(_this) {
        return function(s, prefix) {
          return _this.buildSimpleSuggestion('import', s, prefix);
        };
      })(this));
    };

    SuggestionBuilder.prototype.preprocessorSuggestions = function(pragmaList) {
      var f, kw, kwrx, label, rx;
      kwrx = new RegExp("\\b(" + (pragmaList.join('|')) + ")\\b");
      kw = this.lineSearch(kwrx);
      label = '';
      rx = void 0;
      switch (false) {
        case kw !== 'OPTIONS_GHC':
          rx = /[\w-]+$/;
          label = 'GHC Flag';
          f = this.backend.getCompletionsForCompilerOptions;
          break;
        case kw !== 'LANGUAGE':
          label = 'Language';
          f = this.backend.getCompletionsForLanguagePragmas;
          break;
        case !!kw:
          label = 'Pragma';
          f = function(b, p) {
            return Promise.resolve(filter(pragmaList, p));
          };
          break;
        default:
          return [];
      }
      return this.processSuggestions(f, rx, (function(_this) {
        return function(s, prefix) {
          return _this.buildSimpleSuggestion('keyword', s, prefix, label);
        };
      })(this));
    };

    SuggestionBuilder.prototype.getSuggestions = function() {
      if (this.isIn(this.instancePreprocessorScope)) {
        return this.preprocessorSuggestions(this.instancePragmaWords);
      } else if (this.isIn(this.typeScope)) {
        return this.symbolSuggestions(this.backend.getCompletionsForType);
      } else if (this.isIn(this.moduleScope)) {
        return this.moduleSuggestions();
      } else if (this.isIn(this.exportsScope)) {
        return this.symbolSuggestions(this.backend.getCompletionsForSymbolInModule);
      } else if (this.isIn(this.preprocessorScope)) {
        return this.preprocessorSuggestions(this.pragmaWords);
      } else if (this.isIn(this.sourceScope)) {
        if (this.getPrefix().startsWith('_')) {
          if (atom.config.get('autocomplete-haskell.ingoreMinimumWordLengthForHoleCompletions')) {
            this.mwl = 1;
          }
          return this.symbolSuggestions(this.backend.getCompletionsForHole);
        } else {
          return this.symbolSuggestions(this.backend.getCompletionsForSymbol);
        }
      } else {
        return [];
      }
    };

    return SuggestionBuilder;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9hdXRvY29tcGxldGUtaGFza2VsbC9saWIvc3VnZ2VzdGlvbi1idWlsZGVyLmNvZmZlZSIKICBdLAogICJuYW1lcyI6IFtdLAogICJtYXBwaW5ncyI6ICJBQUFBO0FBQUEsTUFBQSxnQ0FBQTtJQUFBO3lKQUFBOztBQUFBLEVBQUMsUUFBUyxPQUFBLENBQVEsTUFBUixFQUFULEtBQUQsQ0FBQTs7QUFBQSxFQUNDLFNBQVUsT0FBQSxDQUFRLFlBQVIsRUFBVixNQURELENBQUE7O0FBQUEsRUFHQSxNQUFNLENBQUMsT0FBUCxHQUNNO0FBQ0osZ0NBQUEsU0FBQSxHQUFXLENBQUMsNkJBQUQsQ0FBWCxDQUFBOztBQUFBLGdDQUNBLFdBQUEsR0FBYSxDQUFDLGdCQUFELENBRGIsQ0FBQTs7QUFBQSxnQ0FFQSxXQUFBLEdBQWEsQ0FBQyxxQkFBRCxFQUF3Qiw4QkFBeEIsQ0FGYixDQUFBOztBQUFBLGdDQUdBLGlCQUFBLEdBQW1CLENBQUMsMkJBQUQsQ0FIbkIsQ0FBQTs7QUFBQSxnQ0FJQSx5QkFBQSxHQUEyQixDQUFDLG1DQUFELEVBQXNDLDJCQUF0QyxDQUozQixDQUFBOztBQUFBLGdDQUtBLFlBQUEsR0FBYyxDQUFDLHFCQUFELEVBQXdCLGtDQUF4QixDQUxkLENBQUE7O0FBQUEsZ0NBT0EsV0FBQSxHQUFhLENBQ1gsVUFEVyxFQUNDLGFBREQsRUFDZ0IsU0FEaEIsRUFDMkIsU0FEM0IsRUFDc0MsWUFEdEMsRUFDb0QsUUFEcEQsRUFFWCxVQUZXLEVBRUMsS0FGRCxFQUVRLE1BRlIsRUFFZ0IsT0FGaEIsRUFFeUIsWUFGekIsRUFFdUMsUUFGdkMsRUFFaUQsUUFGakQsQ0FQYixDQUFBOztBQUFBLGdDQVlBLG1CQUFBLEdBQXFCLENBQ25CLFlBRG1CLEVBRW5CLGNBRm1CLEVBR25CLGFBSG1CLEVBSW5CLFVBSm1CLENBWnJC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

//# sourceURL=/Users/erewok/.atom/packages/autocomplete-haskell/lib/suggestion-builder.coffee

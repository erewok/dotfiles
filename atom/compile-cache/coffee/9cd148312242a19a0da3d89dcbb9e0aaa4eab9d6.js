(function() {
  var AutocompleteHaskell, BackendHelper, CompositeDisposable, LastSuggestionView, SuggestionBuilder;

  CompositeDisposable = require('atom').CompositeDisposable;

  SuggestionBuilder = require('./suggestion-builder');

  BackendHelper = require('atom-backend-helper');

  LastSuggestionView = require('./last-suggestion-view');

  module.exports = AutocompleteHaskell = {
    config: {
      completionBackendInfo: {
        type: "boolean",
        "default": true,
        description: "Show info message about haskell-completion-backend service on activation"
      },
      useBackend: {
        type: "string",
        "default": '',
        description: 'Name of backend to use. Leave empty for any. Consult backend provider documentation for name.'
      },
      ingoreMinimumWordLengthForHoleCompletions: {
        type: 'boolean',
        "default": 'true',
        description: 'If enabled, hole completions will be shown on \'_\' keystroke. Otherwise, only when there is a prefix, e.g. \'_something\''
      }
    },
    backend: null,
    disposables: null,
    backendHelperDisp: null,
    activate: function(state) {
      this.backendHelper = new BackendHelper('autocomplete-haskell', {
        main: AutocompleteHaskell,
        backendInfo: 'completionBackendInfo',
        backendName: 'haskell-completion-backend'
      });
      this.backendHelper.init();
      this.disposables = new CompositeDisposable;
      this.globalDisposables = new CompositeDisposable;
      this.globalDisposables.add(this.disposables);
      this.globalDisposables.add(atom.packages.onDidActivatePackage((function(_this) {
        return function(p) {
          if (p.name !== 'autocomplete-haskell') {
            return;
          }
          return _this.panel = atom.workspace.addBottomPanel({
            item: _this.view = new LastSuggestionView,
            visible: state.panelVisible,
            priority: 200
          });
        };
      })(this)));
      this.globalDisposables.add(atom.commands.add('atom-workspace', {
        'autocomplete-haskell:toggle-completion-hint': (function(_this) {
          return function() {
            if (_this.panel.isVisible()) {
              return _this.panel.hide();
            } else {
              return _this.panel.show();
            }
          };
        })(this)
      }));
      return this.globalDisposables.add(atom.menu.add([
        {
          'label': 'Haskell IDE',
          'submenu': [
            {
              'label': 'Toggle Completion Hint Panel',
              'command': 'autocomplete-haskell:toggle-completion-hint'
            }
          ]
        }
      ]));
    },
    serialize: function() {
      return {
        panelVisible: this.panel.isVisible()
      };
    },
    deactivate: function() {
      var _ref;
      if ((_ref = this.backendHelperDisp) != null) {
        _ref.dispose();
      }
      this.globalDisposables.dispose();
      this.disposables = null;
      this.globalDisposables = null;
      this.backendHelper = null;
      this.panel.destroy();
      return this.panel = null;
    },
    autocompleteProvider_2_0_0: function() {
      return {
        selector: '.source.haskell',
        disableForSelector: '.source.haskell .comment',
        inclusionPriority: 0,
        getSuggestions: (function(_this) {
          return function(options) {
            if (_this.backend == null) {
              return [];
            }
            return (new SuggestionBuilder(options, _this.backend)).getSuggestions();
          };
        })(this),
        onDidInsertSuggestion: (function(_this) {
          return function(_arg) {
            var editor, suggestion, triggerPosition;
            editor = _arg.editor, triggerPosition = _arg.triggerPosition, suggestion = _arg.suggestion;
            return _this.view.setText("" + suggestion.description);
          };
        })(this)
      };
    },
    consumeCompBack: function(service) {
      return this.backendHelperDisp = this.backendHelper.consume(service, {
        success: (function(_this) {
          return function() {
            return _this.disposables.add(atom.workspace.observeTextEditors(function(editor) {
              if (editor.getGrammar().scopeName !== "source.haskell") {
                return;
              }
              return _this.disposables.add(service.registerCompletionBuffer(editor.getBuffer()));
            }));
          };
        })(this),
        dispose: (function(_this) {
          return function() {
            _this.disposables.dispose();
            return _this.disposables = new CompositeDisposable;
          };
        })(this)
      });
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9hdXRvY29tcGxldGUtaGFza2VsbC9saWIvYXV0b2NvbXBsZXRlLWhhc2tlbGwuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFBQSxNQUFBLDhGQUFBOztBQUFBLEVBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSLEVBQXZCLG1CQUFELENBQUE7O0FBQUEsRUFDQSxpQkFBQSxHQUFvQixPQUFBLENBQVEsc0JBQVIsQ0FEcEIsQ0FBQTs7QUFBQSxFQUVBLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLHFCQUFSLENBRmhCLENBQUE7O0FBQUEsRUFHQSxrQkFBQSxHQUFxQixPQUFBLENBQVEsd0JBQVIsQ0FIckIsQ0FBQTs7QUFBQSxFQUtBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLG1CQUFBLEdBQ2Y7QUFBQSxJQUFBLE1BQUEsRUFDRTtBQUFBLE1BQUEscUJBQUEsRUFDRTtBQUFBLFFBQUEsSUFBQSxFQUFNLFNBQU47QUFBQSxRQUNBLFNBQUEsRUFBUyxJQURUO0FBQUEsUUFFQSxXQUFBLEVBQWEsMEVBRmI7T0FERjtBQUFBLE1BS0EsVUFBQSxFQUNFO0FBQUEsUUFBQSxJQUFBLEVBQU0sUUFBTjtBQUFBLFFBQ0EsU0FBQSxFQUFTLEVBRFQ7QUFBQSxRQUVBLFdBQUEsRUFBYSwrRkFGYjtPQU5GO0FBQUEsTUFVQSx5Q0FBQSxFQUNFO0FBQUEsUUFBQSxJQUFBLEVBQU0sU0FBTjtBQUFBLFFBQ0EsU0FBQSxFQUFTLE1BRFQ7QUFBQSxRQUVBLFdBQUEsRUFBYSw0SEFGYjtPQVhGO0tBREY7QUFBQSxJQWlCQSxPQUFBLEVBQVMsSUFqQlQ7QUFBQSxJQWtCQSxXQUFBLEVBQWEsSUFsQmI7QUFBQSxJQW1CQSxpQkFBQSxFQUFtQixJQW5CbkI7QUFBQSxJQXFCQSxRQUFBLEVBQVUsU0FBQyxLQUFELEdB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

//# sourceURL=/Users/erewok/.atom/packages/autocomplete-haskell/lib/autocomplete-haskell.coffee

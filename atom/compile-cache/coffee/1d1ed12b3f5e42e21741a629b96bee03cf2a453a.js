(function() {
  var BufferInfo, CompositeDisposable, Emitter, parseHsModuleImports, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ref = require('atom'), CompositeDisposable = _ref.CompositeDisposable, Emitter = _ref.Emitter;

  parseHsModuleImports = require('atom-haskell-utils').parseHsModuleImports;

  module.exports = BufferInfo = (function() {
    BufferInfo.prototype.buffer = null;

    BufferInfo.prototype.emitter = null;

    BufferInfo.prototype.disposables = null;

    function BufferInfo(buffer) {
      this.buffer = buffer;
      this.getModuleName = __bind(this.getModuleName, this);
      this.getImports = __bind(this.getImports, this);
      this.onDidSave = __bind(this.onDidSave, this);
      this.onDidDestroy = __bind(this.onDidDestroy, this);
      this.destroy = __bind(this.destroy, this);
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.emitter = new Emitter);
      this.disposables.add(this.buffer.onDidDestroy((function(_this) {
        return function() {
          return _this.destroy();
        };
      })(this)));
    }

    BufferInfo.prototype.destroy = function() {
      if (this.buffer == null) {
        return;
      }
      this.buffer = null;
      this.disposables.dispose();
      this.disposables = null;
      this.emitter.emit('did-destroy');
      return this.emitter = null;
    };

    BufferInfo.prototype.onDidDestroy = function(callback) {
      if (this.emitter == null) {
        return new Disposable(function() {});
      }
      return this.emitter.on('did-destroy', callback);
    };

    BufferInfo.prototype.onDidSave = function(callback) {
      if (this.buffer == null) {
        return new Disposable(function() {});
      }
      return this.buffer.onDidSave(callback);
    };

    BufferInfo.prototype.parse = function() {
      return new Promise((function(_this) {
        return function(resolve) {
          var newText;
          newText = _this.buffer.getText();
          if (_this.oldText === newText) {
            return resolve(_this.oldImports);
          } else {
            return parseHsModuleImports(_this.buffer.getText(), function(imports) {
              _this.oldText = newText;
              if (imports.error != null) {
                console.error("Parse error: " + imports.error);
                return resolve(_this.oldImports = {
                  name: void 0,
                  imports: []
                });
              } else {
                return resolve(_this.oldImports = imports);
              }
            });
          }
        };
      })(this));
    };

    BufferInfo.prototype.getImports = function() {
      if (this.buffer == null) {
        return Promise.resolve([]);
      }
      return this.parse().then(function(_arg) {
        var imports;
        imports = _arg.imports;
        if (!(imports.some(function(_arg1) {
          var name;
          name = _arg1.name;
          return name === 'Prelude';
        }))) {
          imports.push({
            qualified: false,
            hiding: false,
            name: 'Prelude'
          });
        }
        return imports;
      });
    };

    BufferInfo.prototype.getModuleName = function() {
      if (this.buffer == null) {
        return Promise.resolve();
      }
      return this.parse().then(function(res) {
        return res.name;
      });
    };

    return BufferInfo;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL2NvbXBsZXRpb24tYmFja2VuZC9idWZmZXItaW5mby5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLE1BQUEsb0VBQUE7SUFBQSxrRkFBQTs7QUFBQSxFQUFBLE9BQWlDLE9BQUEsQ0FBUSxNQUFSLENBQWpDLEVBQUMsMkJBQUEsbUJBQUQsRUFBc0IsZUFBQSxPQUF0QixDQUFBOztBQUFBLEVBQ0MsdUJBQXdCLE9BQUEsQ0FBUSxvQkFBUixFQUF4QixvQkFERCxDQUFBOztBQUFBLEVBR0EsTUFBTSxDQUFDLE9BQVAsR0FDUTtBQUNKLHlCQUFBLE1BQUEsR0FBUSxJQUFSLENBQUE7O0FBQUEseUJBQ0EsT0FBQSxHQUFTLElBRFQsQ0FBQTs7QUFBQSx5QkFFQSxXQUFBLEdBQWEsSUFGYixDQUFBOztBQUlhLElBQUEsb0JBQUUsTUFBRixHQUFBO0FBQ1gsTUFEWSxJQUFDLENBQUEsU0FBQSxNQUNiLENBQUE7QUFBQSwyREFBQSxDQUFBO0FBQUEscURBQUEsQ0FBQTtBQUFBLG1EQUFBLENBQUE7QUFBQSx5REFBQSxDQUFBO0FBQUEsK0NBQUEsQ0FBQTtBQUFBLE1BQUEsSUFBQyxDQUFBLFdBQUQsR0FBZSxHQUFBLENBQUEsbUJBQWYsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxPQUFELEdBQVcsR0FBQSxDQUFBLE9BQTVCLENBREEsQ0FBQTtBQUFBLE1BR0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixDQUFxQixDQUFBLFNBQUEsS0FBQSxHQUFBO2VBQUEsU0FBQSxHQUFBO2lCQUNwQyxLQUFDLENBQUEsT0FBRCxDQUFBLEVBRG9D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

//# sourceURL=/Users/erewok/.atom/packages/haskell-ghc-mod/lib/completion-backend/buffer-info.coffee

(function() {
  var CompositeDisposable, Emitter, ModuleInfo, Util, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ref = require('atom'), CompositeDisposable = _ref.CompositeDisposable, Emitter = _ref.Emitter;

  Util = require('../util');

  module.exports = ModuleInfo = (function() {
    ModuleInfo.prototype.symbols = null;

    ModuleInfo.prototype.process = null;

    ModuleInfo.prototype.name = "";

    ModuleInfo.prototype.disposables = null;

    ModuleInfo.prototype.emitter = null;

    ModuleInfo.prototype.timeout = null;

    ModuleInfo.prototype.invalidateInterval = 30 * 60 * 1000;

    function ModuleInfo(name, process, rootDir, done) {
      this.name = name;
      this.process = process;
      this.select = __bind(this.select, this);
      this.unsetBuffer = __bind(this.unsetBuffer, this);
      this.setBuffer = __bind(this.setBuffer, this);
      this.update = __bind(this.update, this);
      this.onDidDestroy = __bind(this.onDidDestroy, this);
      this.destroy = __bind(this.destroy, this);
      if (this.name == null) {
        throw new Error("No name set");
      }
      Util.debug("" + this.name + " created");
      this.symbols = [];
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.emitter = new Emitter);
      this.update(rootDir, done);
      this.timeout = setTimeout(((function(_this) {
        return function() {
          return _this.destroy();
        };
      })(this)), this.invalidateInterval);
      this.disposables.add(this.process.onDidDestroy((function(_this) {
        return function() {
          return _this.destroy();
        };
      })(this)));
    }

    ModuleInfo.prototype.destroy = function() {
      if (this.symbols == null) {
        return;
      }
      Util.debug("" + this.name + " destroyed");
      clearTimeout(this.timeout);
      this.timeout = null;
      this.emitter.emit('did-destroy');
      this.disposables.dispose();
      this.disposables = null;
      this.symbols = null;
      this.process = null;
      this.name = "";
      return this.emitter = null;
    };

    ModuleInfo.prototype.onDidDestroy = function(callback) {
      if (this.emitter == null) {
        return new Disposable(function() {});
      }
      return this.emitter.on('did-destroy', callback);
    };

    ModuleInfo.prototype.update = function(rootDir, done) {
      if (this.process == null) {
        return;
      }
      Util.debug("" + this.name + " updating");
      return this.process.runBrowse(rootDir, [this.name]).then((function(_this) {
        return function(symbols) {
          _this.symbols = symbols;
          Util.debug("" + _this.name + " updated");
          return typeof done === "function" ? done() : void 0;
        };
      })(this));
    };

    ModuleInfo.prototype.setBuffer = function(bufferInfo, rootDir) {
      var bufferRootDir, _ref1, _ref2;
      if (this.disposables == null) {
        return;
      }
      bufferRootDir = (_ref1 = (_ref2 = this.process) != null ? typeof _ref2.getRootDir === "function" ? _ref2.getRootDir(bufferInfo.buffer) : void 0 : void 0) != null ? _ref1 : Util.getRootDir(bufferInfo.buffer);
      if (rootDir.getPath() !== bufferRootDir.getPath()) {
        return;
      }
      return bufferInfo.getModuleName().then((function(_this) {
        return function(name) {
          if (name !== _this.name) {
            Util.debug("" + _this.name + " moduleName mismatch: " + name + " != " + _this.name);
            return;
          }
          Util.debug("" + _this.name + " buffer is set");
          _this.disposables.add(bufferInfo.onDidSave(function() {
            Util.debug("" + _this.name + " did-save triggered");
            return _this.update(rootDir);
          }));
          return _this.disposables.add(bufferInfo.onDidDestroy(function() {
            return _this.unsetBuffer();
          }));
        };
      })(this));
    };

    ModuleInfo.prototype.unsetBuffer = function() {
      if (this.disposables == null) {
        return;
      }
      this.disposables.dispose();
      return this.disposables = new CompositeDisposable;
    };

    ModuleInfo.prototype.select = function(importDesc, symbolTypes) {
      var si, symbols;
      if (this.symbols == null) {
        return [];
      }
      clearTimeout(this.timeout);
      this.timeout = setTimeout(this.destroy, this.invalidateInterval);
      symbols = importDesc.importList != null ? this.symbols.filter(function(s) {
        var _ref1;
        return importDesc.hiding !== ((_ref1 = s.name, __indexOf.call(importDesc.importList, _ref1) >= 0) || (importDesc.importList.some(function(_arg) {
          var parent;
          parent = _arg.parent;
          return (parent != null) && s.parent === parent;
        })));
      }) : this.symbols;
      si = symbols.map(function(s) {
        var _ref1;
        return {
          name: s.name,
          typeSignature: s.typeSignature,
          symbolType: s.symbolType,
          module: importDesc,
          qname: importDesc.qualified ? ((_ref1 = importDesc.alias) != null ? _ref1 : importDesc.name) + '.' + s.name : s.name
        };
      });
      if (symbolTypes != null) {
        si = si.filter(function(_arg) {
          var symbolType;
          symbolType = _arg.symbolType;
          return __indexOf.call(symbolTypes, symbolType) >= 0;
        });
      }
      return si;
    };

    return ModuleInfo;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL2NvbXBsZXRpb24tYmFja2VuZC9tb2R1bGUtaW5mby5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLE1BQUEsb0RBQUE7SUFBQTt5SkFBQTs7QUFBQSxFQUFBLE9BQWlDLE9BQUEsQ0FBUSxNQUFSLENBQWpDLEVBQUMsMkJBQUEsbUJBQUQsRUFBc0IsZUFBQSxPQUF0QixDQUFBOztBQUFBLEVBQ0EsSUFBQSxHQUFPLE9BQUEsQ0FBUSxTQUFSLENBRFAsQ0FBQTs7QUFBQSxFQUdBLE1BQU0sQ0FBQyxPQUFQLEdBQ1E7QUFDSix5QkFBQSxPQUFBLEdBQVMsSUFBVCxDQUFBOztBQUFBLHlCQUNBLE9BQUEsR0FBUyxJQURULENBQUE7O0FBQUEseUJBRUEsSUFBQSxHQUFNLEVBRk4sQ0FBQTs7QUFBQSx5QkFHQSxXQUFBLEdBQWEsSUFIYixDQUFBOztBQUFBLHlCQUlBLE9BQUEsR0FBUyxJQUpULENBQUE7O0FBQUEseUJBS0EsT0FBQSxHQUFTLElBTFQsQ0FBQTs7QUFBQSx5QkFNQSxrQkFBQSxHQUFvQixFQUFBLEdBQUssRUFBTCxHQUFVLElBTjlCLENBQUE7O0FBUWEsSUFBQSxvQkFBRSxJQUFGLEVBQVMsT0FBVCxFQUFrQixPQUFsQixFQUEyQixJQUEzQixHQUFBO0FBQ1gsTUFEWSxJQUFDLENBQUEsT0FBQSxJQUNiLENBQUE7QUFBQSxNQURtQixJQUFDLENBQUEsVUFBQSxPQUNwQixDQUFBO0FBQUEsNkNBQUEsQ0FBQTtBQUFBLHVEQUFBLENBQUE7QUFBQSxtREFBQSxDQUFBO0FBQUEsNkNBQUEsQ0FBQTtBQUFBLHlEQUFBLENBQUE7QUFBQSwrQ0FBQSxDQUFBO0FBQUEsTUFBQSxJQUFPLGlCQUFQO0FBQ0UsY0FBVSxJQUFBLEtBQUEsQ0FB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

//# sourceURL=/Users/erewok/.atom/packages/haskell-ghc-mod/lib/completion-backend/module-info.coffee

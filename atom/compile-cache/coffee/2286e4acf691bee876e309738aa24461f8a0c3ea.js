(function() {
  var CompositeDisposable, Emitter, ModuleInfo, Util, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Emitter = ref.Emitter;

  Util = require('../util');

  module.exports = ModuleInfo = (function() {
    ModuleInfo.prototype.symbols = null;

    ModuleInfo.prototype.process = null;

    ModuleInfo.prototype.name = "";

    ModuleInfo.prototype.disposables = null;

    ModuleInfo.prototype.emitter = null;

    ModuleInfo.prototype.timeout = null;

    ModuleInfo.prototype.invalidateInterval = 30 * 60 * 1000;

    function ModuleInfo(name1, process, rootDir, done) {
      this.name = name1;
      this.process = process;
      this.select = bind(this.select, this);
      this.unsetBuffer = bind(this.unsetBuffer, this);
      this.setBuffer = bind(this.setBuffer, this);
      this.update = bind(this.update, this);
      this.onDidDestroy = bind(this.onDidDestroy, this);
      this.destroy = bind(this.destroy, this);
      if (this.name == null) {
        throw new Error("No name set");
      }
      Util.debug(this.name + " created");
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
      Util.debug(this.name + " destroyed");
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
      Util.debug(this.name + " updating");
      return this.process.runBrowse(rootDir, [this.name]).then((function(_this) {
        return function(symbols1) {
          _this.symbols = symbols1;
          Util.debug(_this.name + " updated");
          return typeof done === "function" ? done() : void 0;
        };
      })(this));
    };

    ModuleInfo.prototype.setBuffer = function(bufferInfo, rootDir) {
      var bufferRootDir, ref1, ref2;
      if (this.disposables == null) {
        return;
      }
      bufferRootDir = (ref1 = (ref2 = this.process) != null ? typeof ref2.getRootDir === "function" ? ref2.getRootDir(bufferInfo.buffer) : void 0 : void 0) != null ? ref1 : Util.getRootDir(bufferInfo.buffer);
      if (rootDir.getPath() !== bufferRootDir.getPath()) {
        return;
      }
      return bufferInfo.getModuleName().then((function(_this) {
        return function(name) {
          if (name !== _this.name) {
            Util.debug(_this.name + " moduleName mismatch: " + name + " != " + _this.name);
            return;
          }
          Util.debug(_this.name + " buffer is set");
          _this.disposables.add(bufferInfo.onDidSave(function() {
            Util.debug(_this.name + " did-save triggered");
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
        var ref1;
        return importDesc.hiding !== ((ref1 = s.name, indexOf.call(importDesc.importList, ref1) >= 0) || (importDesc.importList.some(function(arg) {
          var parent;
          parent = arg.parent;
          return (parent != null) && s.parent === parent;
        })));
      }) : this.symbols;
      si = Array.prototype.concat.apply([], symbols.map(function(s) {
        var qns;
        qns = [
          function(n) {
            var ref1;
            if (importDesc.qualified) {
              return ((ref1 = importDesc.alias) != null ? ref1 : importDesc.name) + '.' + n;
            } else {
              return n;
            }
          }
        ];
        if (!importDesc.skipQualified) {
          qns.push(function(n) {
            return importDesc.name + '.' + n;
          });
          if (importDesc.alias) {
            qns.push(function(n) {
              return importDesc.alias + '.' + n;
            });
          }
        }
        return qns.map(function(qn) {
          return {
            name: s.name,
            typeSignature: s.typeSignature,
            symbolType: s.symbolType === 'function' && s.name[0].toUpperCase() === s.name[0] ? 'tag' : s.symbolType,
            qparent: s.parent ? qn(s.parent) : void 0,
            module: importDesc,
            qname: qn(s.name)
          };
        });
      }));
      if (symbolTypes != null) {
        si = si.filter(function(arg) {
          var symbolType;
          symbolType = arg.symbolType;
          return indexOf.call(symbolTypes, symbolType) >= 0;
        });
      }
      return si;
    };

    return ModuleInfo;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL2NvbXBsZXRpb24tYmFja2VuZC9tb2R1bGUtaW5mby5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLG1EQUFBO0lBQUE7OztFQUFBLE1BQWlDLE9BQUEsQ0FBUSxNQUFSLENBQWpDLEVBQUMsNkNBQUQsRUFBc0I7O0VBQ3RCLElBQUEsR0FBTyxPQUFBLENBQVEsU0FBUjs7RUFFUCxNQUFNLENBQUMsT0FBUCxHQUNRO3lCQUNKLE9BQUEsR0FBUzs7eUJBQ1QsT0FBQSxHQUFTOzt5QkFDVCxJQUFBLEdBQU07O3lCQUNOLFdBQUEsR0FBYTs7eUJBQ2IsT0FBQSxHQUFTOzt5QkFDVCxPQUFBLEdBQVM7O3lCQUNULGtCQUFBLEdBQW9CLEVBQUEsR0FBSyxFQUFMLEdBQVU7O0lBRWpCLG9CQUFDLEtBQUQsRUFBUSxPQUFSLEVBQWtCLE9BQWxCLEVBQTJCLElBQTNCO01BQUMsSUFBQyxDQUFBLE9BQUQ7TUFBTyxJQUFDLENBQUEsVUFBRDs7Ozs7OztNQUNuQixJQUFPLGlCQUFQO0FBQ0UsY0FBVSxJQUFBLEtBQUEsQ0FBTSxhQUFOLEVBRFo7O01BRUEsSUFBSSxDQUFDLEtBQUwsQ0FBYyxJQUFDLENBQUEsSUFBRixHQUFPLFVBQXBCO01BQ0EsSUFBQyxDQUFBLE9BQUQsR0FBVztNQUNYLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBSTtNQUNuQixJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJLE9BQWhDO01BQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBUSxPQUFSLEVBQWlCLElBQWpCO01BQ0EsSUFBQyxDQUFBLE9BQUQsR0FBVyxVQUFBLENBQVcsQ0FBQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLE9BQUQsQ0FBQTtRQUFI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ekVaIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGUsIEVtaXR0ZXJ9ID0gcmVxdWlyZSAnYXRvbSdcblV0aWwgPSByZXF1aXJlICcuLi91dGlsJ1xuXG5tb2R1bGUuZXhwb3J0cz1cbiAgY2xhc3MgTW9kdWxlSW5mb1xuICAgIHN5bWJvbHM6IG51bGwgI21vZHVsZSBzeW1ib2xzXG4gICAgcHJvY2VzczogbnVsbFxuICAgIG5hbWU6IFwiXCJcbiAgICBkaXNwb3NhYmxlczogbnVsbFxuICAgIGVtaXR0ZXI6IG51bGxcbiAgICB0aW1lb3V0OiBudWxsXG4gICAgaW52YWxpZGF0ZUludGVydmFsOiAzMCAqIDYwICogMTAwMCAjaWYgbW9kdWxlIHVudXNlZCBmb3IgMzAgbWludXRlcywgcmVtb3ZlIGl0XG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBAcHJvY2Vzcywgcm9vdERpciwgZG9uZSkgLT5cbiAgICAgIHVubGVzcyBAbmFtZT9cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gbmFtZSBzZXRcIilcbiAgICAgIFV0aWwuZGVidWcgXCIje0BuYW1lfSBjcmVhdGVkXCJcbiAgICAgIEBzeW1ib2xzID0gW11cbiAgICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgICBAZGlzcG9zYWJsZXMuYWRkIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICAgIEB1cGRhdGUgcm9vdERpciwgZG9uZVxuICAgICAgQHRpbWVvdXQgPSBzZXRUaW1lb3V0ICg9PiBAZGVzdHJveSgpKSwgQGludmFsaWRhdGVJbnRlcnZhbFxuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBAcHJvY2Vzcy5vbkRpZERlc3Ryb3kgPT4gQGRlc3Ryb3koKVxuXG4gICAgZGVzdHJveTogPT5cbiAgICAgIHJldHVybiB1bmxlc3MgQHN5bWJvbHM/XG4gICAgICBVdGlsLmRlYnVnIFwiI3tAbmFtZX0gZGVzdHJveWVkXCJcbiAgICAgIGNsZWFyVGltZW91dCBAdGltZW91dFxuICAgICAgQHRpbWVvdXQgPSBudWxsXG4gICAgICBAZW1pdHRlci5lbWl0ICdkaWQtZGVzdHJveSdcbiAgICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICAgIEBkaXNwb3NhYmxlcyA9IG51bGxcbiAgICAgIEBzeW1ib2xzID0gbnVsbFxuICAgICAgQHByb2Nlc3MgPSBudWxsXG4gICAgICBAbmFtZSA9IFwiXCJcbiAgICAgIEBlbWl0dGVyID0gbnVsbFxuXG4gICAgb25EaWREZXN0cm95OiAoY2FsbGJhY2spID0+XG4gICAgICB1bmxlc3MgQGVtaXR0ZXI/XG4gICAgICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZSAtPlxuICAgICAgQGVtaXR0ZXIub24gJ2RpZC1kZXN0cm95JywgY2FsbGJhY2tcblxuICAgIHVwZGF0ZTogKHJvb3REaXIsIGRvbmUpID0+XG4gICAgICByZXR1cm4gdW5sZXNzIEBwcm9jZXNzP1xuICAgICAgVXRpbC5kZWJ1ZyBcIiN7QG5hbWV9IHVwZGF0aW5nXCJcbiAgICAgIEBwcm9jZXNzLnJ1bkJyb3dzZSByb290RGlyLCBbQG5hbWVdXG4gICAgICAudGhlbiAoQHN5bWJvbHMpID0+XG4gICAgICAgIFV0aWwuZGVidWcgXCIje0BuYW1lfSB1cGRhdGVkXCJcbiAgICAgICAgZG9uZT8oKVxuXG4gICAgc2V0QnVmZmVyOiAoYnVmZmVySW5mbywgcm9vdERpcikgPT5cbiAgICAgIHJldHVybiB1bmxlc3MgQGRpc3Bvc2FibGVzP1xuICAgICAgYnVmZmVyUm9vdERpciA9IEBwcm9jZXNzPy5nZXRSb290RGlyPyhidWZmZXJJbmZvLmJ1ZmZlcikgPyBVdGlsLmdldFJvb3REaXIoYnVmZmVySW5mby5idWZmZXIpXG4gICAgICB1bmxlc3Mgcm9vdERpci5nZXRQYXRoKCkgPT0gYnVmZmVyUm9vdERpci5nZXRQYXRoKClcbiAgICAgICAgcmV0dXJuXG4gICAgICBidWZmZXJJbmZvLmdldE1vZHVsZU5hbWUoKVxuICAgICAgLnRoZW4gKG5hbWUpID0+XG4gICAgICAgIHVubGVzcyBuYW1lID09IEBuYW1lXG4gICAgICAgICAgVXRpbC5kZWJ1ZyBcIiN7QG5hbWV9IG1vZHVsZU5hbWUgbWlzbWF0Y2g6XG4gICAgICAgICAgICAje25hbWV9ICE9ICN7QG5hbWV9XCJcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgVXRpbC5kZWJ1ZyBcIiN7QG5hbWV9IGJ1ZmZlciBpcyBzZXRcIlxuICAgICAgICBAZGlzcG9zYWJsZXMuYWRkIGJ1ZmZlckluZm8ub25EaWRTYXZlID0+XG4gICAgICAgICAgVXRpbC5kZWJ1ZyBcIiN7QG5hbWV9IGRpZC1zYXZlIHRyaWdnZXJlZFwiXG4gICAgICAgICAgQHVwZGF0ZShyb290RGlyKVxuICAgICAgICBAZGlzcG9zYWJsZXMuYWRkIGJ1ZmZlckluZm8ub25EaWREZXN0cm95ID0+XG4gICAgICAgICAgQHVuc2V0QnVmZmVyKClcblxuICAgIHVuc2V0QnVmZmVyOiA9PlxuICAgICAgcmV0dXJuIHVubGVzcyBAZGlzcG9zYWJsZXM/XG4gICAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gICAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgc2VsZWN0OiAoaW1wb3J0RGVzYywgc3ltYm9sVHlwZXMpID0+XG4gICAgICByZXR1cm4gW10gdW5sZXNzIEBzeW1ib2xzP1xuICAgICAgY2xlYXJUaW1lb3V0IEB0aW1lb3V0XG4gICAgICBAdGltZW91dCA9IHNldFRpbWVvdXQgQGRlc3Ryb3ksIEBpbnZhbGlkYXRlSW50ZXJ2YWxcbiAgICAgIHN5bWJvbHMgPVxuICAgICAgICBpZiBpbXBvcnREZXNjLmltcG9ydExpc3Q/XG4gICAgICAgICAgQHN5bWJvbHMuZmlsdGVyIChzKSAtPlxuICAgICAgICAgICAgaW1wb3J0RGVzYy5oaWRpbmcgIT0gKFxuICAgICAgICAgICAgICAocy5uYW1lIGluIGltcG9ydERlc2MuaW1wb3J0TGlzdCkgb3JcbiAgICAgICAgICAgICAgKGltcG9ydERlc2MuaW1wb3J0TGlzdC5zb21lICh7cGFyZW50fSkgLT4gcGFyZW50PyBhbmQgcy5wYXJlbnQgaXMgcGFyZW50KVxuICAgICAgICAgICAgICApXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAc3ltYm9sc1xuICAgICAgc2kgPSBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5IFtdLCBzeW1ib2xzLm1hcCAocykgLT5cbiAgICAgICAgcW5zID1cbiAgICAgICAgICBbXG4gICAgICAgICAgICAobikgLT5cbiAgICAgICAgICAgICAgaWYgaW1wb3J0RGVzYy5xdWFsaWZpZWRcbiAgICAgICAgICAgICAgICAoaW1wb3J0RGVzYy5hbGlhcyA/IGltcG9ydERlc2MubmFtZSkgKyAnLicgKyBuXG4gICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBuXG4gICAgICAgICAgXVxuICAgICAgICB1bmxlc3MgaW1wb3J0RGVzYy5za2lwUXVhbGlmaWVkXG4gICAgICAgICAgcW5zLnB1c2goKG4pIC0+IGltcG9ydERlc2MubmFtZSArICcuJyArIG4pXG4gICAgICAgICAgaWYgaW1wb3J0RGVzYy5hbGlhc1xuICAgICAgICAgICAgcW5zLnB1c2goKG4pIC0+IGltcG9ydERlc2MuYWxpYXMgKyAnLicgKyBuKVxuICAgICAgICBxbnMubWFwIChxbikgLT5cbiAgICAgICAgICBuYW1lOiBzLm5hbWVcbiAgICAgICAgICB0eXBlU2lnbmF0dXJlOiBzLnR5cGVTaWduYXR1cmVcbiAgICAgICAgICBzeW1ib2xUeXBlOlxuICAgICAgICAgICAgaWYgcy5zeW1ib2xUeXBlID09ICdmdW5jdGlvbicgYW5kIHMubmFtZVswXS50b1VwcGVyQ2FzZSgpID09IHMubmFtZVswXVxuICAgICAgICAgICAgICAndGFnJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICBzLnN5bWJvbFR5cGVcbiAgICAgICAgICBxcGFyZW50OiBxbiBzLnBhcmVudCBpZiBzLnBhcmVudFxuICAgICAgICAgIG1vZHVsZTogaW1wb3J0RGVzY1xuICAgICAgICAgIHFuYW1lOiBxbiBzLm5hbWVcbiAgICAgIGlmIHN5bWJvbFR5cGVzP1xuICAgICAgICBzaSA9IHNpLmZpbHRlciAoe3N5bWJvbFR5cGV9KSAtPiBzeW1ib2xUeXBlIGluIHN5bWJvbFR5cGVzXG4gICAgICBzaVxuIl19

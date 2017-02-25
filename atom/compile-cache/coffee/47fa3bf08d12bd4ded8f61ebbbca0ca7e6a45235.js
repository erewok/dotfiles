(function() {
  var BufferInfo, CompletionBackend, Disposable, FZ, ModuleInfo, Range, Util, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  FZ = require('fuzzaldrin');

  _ref = require('atom'), Disposable = _ref.Disposable, Range = _ref.Range;

  BufferInfo = require('./buffer-info');

  ModuleInfo = require('./module-info');

  Util = require('../util');

  module.exports = CompletionBackend = (function() {
    CompletionBackend.prototype.process = null;

    CompletionBackend.prototype.bufferMap = null;

    CompletionBackend.prototype.dirMap = null;

    CompletionBackend.prototype.modListMap = null;

    CompletionBackend.prototype.languagePragmas = null;

    CompletionBackend.prototype.compilerOptions = null;

    function CompletionBackend(proc) {
      this.getCompletionsForHole = __bind(this.getCompletionsForHole, this);
      this.getCompletionsForCompilerOptions = __bind(this.getCompletionsForCompilerOptions, this);
      this.getCompletionsForLanguagePragmas = __bind(this.getCompletionsForLanguagePragmas, this);
      this.getCompletionsForSymbolInModule = __bind(this.getCompletionsForSymbolInModule, this);
      this.getCompletionsForModule = __bind(this.getCompletionsForModule, this);
      this.getCompletionsForClass = __bind(this.getCompletionsForClass, this);
      this.getCompletionsForType = __bind(this.getCompletionsForType, this);
      this.getCompletionsForSymbol = __bind(this.getCompletionsForSymbol, this);
      this.unregisterCompletionBuffer = __bind(this.unregisterCompletionBuffer, this);
      this.registerCompletionBuffer = __bind(this.registerCompletionBuffer, this);
      this.onDidDestroy = __bind(this.onDidDestroy, this);
      this.getModuleInfo = __bind(this.getModuleInfo, this);
      this.getModuleMap = __bind(this.getModuleMap, this);
      this.getBufferInfo = __bind(this.getBufferInfo, this);
      this.getSymbolsForBuffer = __bind(this.getSymbolsForBuffer, this);
      this.isActive = __bind(this.isActive, this);
      this.bufferMap = new WeakMap;
      this.dirMap = new WeakMap;
      this.modListMap = new WeakMap;
      this.languagePragmas = new WeakMap;
      this.compilerOptions = new WeakMap;
      this.setProcess(proc);
    }

    CompletionBackend.prototype.setProcess = function(process) {
      var _ref1;
      this.process = process;
      return (_ref1 = this.process) != null ? _ref1.onDidDestroy((function(_this) {
        return function() {
          return _this.process = null;
        };
      })(this)) : void 0;
    };

    CompletionBackend.prototype.isActive = function() {
      if (this.process == null) {
        atom.notifications.addWarning("Haskell Completion Backend " + (this.name()) + " is inactive");
      }
      return this.process != null;
    };

    CompletionBackend.prototype.getSymbolsForBuffer = function(buffer, symbolTypes) {
      var bufferInfo, moduleMap, rootDir, _ref1;
      bufferInfo = this.getBufferInfo({
        buffer: buffer
      }).bufferInfo;
      _ref1 = this.getModuleMap({
        bufferInfo: bufferInfo
      }), rootDir = _ref1.rootDir, moduleMap = _ref1.moduleMap;
      if ((bufferInfo != null) && (moduleMap != null)) {
        return bufferInfo.getImports().then((function(_this) {
          return function(imports) {
            return Promise.all(imports.map(function(imp) {
              return _this.getModuleInfo({
                moduleName: imp.name,
                rootDir: rootDir,
                moduleMap: moduleMap
              }).then(function(_arg) {
                var moduleInfo;
                moduleInfo = _arg.moduleInfo;
                return moduleInfo.select(imp, symbolTypes);
              });
            }));
          };
        })(this)).then(function(promises) {
          var _ref2;
          return (_ref2 = []).concat.apply(_ref2, promises);
        });
      } else {
        return Promise.resolve([]);
      }
    };

    CompletionBackend.prototype.getBufferInfo = function(_arg) {
      var bi, buffer;
      buffer = _arg.buffer;
      if (buffer == null) {
        throw new Error("Null buffer in getBufferInfo!");
      }
      if (this.bufferMap.has(buffer)) {
        bi = this.bufferMap.get(buffer);
      }
      if ((bi != null ? bi.buffer : void 0) == null) {
        this.bufferMap.set(buffer, bi = new BufferInfo(buffer));
      }
      return {
        bufferInfo: bi
      };
    };

    CompletionBackend.prototype.getModuleMap = function(_arg) {
      var bufferInfo, mm, rootDir, _ref1, _ref2;
      bufferInfo = _arg.bufferInfo, rootDir = _arg.rootDir;
      if (!((bufferInfo != null) || (rootDir != null))) {
        throw new Error("Neither bufferInfo nor rootDir specified");
      }
      if (rootDir == null) {
        rootDir = (_ref1 = (_ref2 = this.process) != null ? typeof _ref2.getRootDir === "function" ? _ref2.getRootDir(bufferInfo.buffer) : void 0 : void 0) != null ? _ref1 : Util.getRootDir(bufferInfo.buffer);
      }
      if (!this.dirMap.has(rootDir)) {
        this.dirMap.set(rootDir, mm = new Map);
      } else {
        mm = this.dirMap.get(rootDir);
      }
      return {
        rootDir: rootDir,
        moduleMap: mm
      };
    };

    CompletionBackend.prototype.getModuleInfo = function(_arg) {
      var bufferInfo, moduleMap, moduleName, rootDir;
      moduleName = _arg.moduleName, bufferInfo = _arg.bufferInfo, rootDir = _arg.rootDir, moduleMap = _arg.moduleMap;
      if (!((moduleName != null) || (bufferInfo != null))) {
        throw new Error("No moduleName or bufferInfo specified");
      }
      return Promise.resolve(moduleName || bufferInfo.getModuleName()).then((function(_this) {
        return function(moduleName) {
          var moduleInfo, _ref1;
          if (!moduleName) {
            Util.debug("warn: nameless module in " + (bufferInfo.buffer.getUri()));
            return;
          }
          if (!((moduleMap != null) && (rootDir != null))) {
            if (bufferInfo == null) {
              throw new Error("No bufferInfo specified and no moduleMap+rootDir");
            }
            _ref1 = _this.getModuleMap({
              bufferInfo: bufferInfo,
              rootDir: rootDir
            }), rootDir = _ref1.rootDir, moduleMap = _ref1.moduleMap;
          }
          moduleInfo = moduleMap.get(moduleName);
          if ((moduleInfo != null ? moduleInfo.symbols : void 0) == null) {
            return new Promise(function(resolve) {
              moduleMap.set(moduleName, moduleInfo = new ModuleInfo(moduleName, _this.process, rootDir, function() {
                return resolve({
                  bufferInfo: bufferInfo,
                  rootDir: rootDir,
                  moduleMap: moduleMap,
                  moduleInfo: moduleInfo
                });
              }));
              if (bufferInfo != null) {
                moduleInfo.setBuffer(bufferInfo, rootDir);
              } else {
                atom.workspace.getTextEditors().forEach(function(editor) {
                  bufferInfo = _this.getBufferInfo({
                    buffer: editor.getBuffer()
                  }).bufferInfo;
                  return moduleInfo.setBuffer(bufferInfo, rootDir);
                });
              }
              return moduleInfo.onDidDestroy(function() {
                moduleMap["delete"](moduleName);
                return Util.debug("" + moduleName + " removed from map");
              });
            });
          } else {
            return Promise.resolve({
              bufferInfo: bufferInfo,
              rootDir: rootDir,
              moduleMap: moduleMap,
              moduleInfo: moduleInfo
            });
          }
        };
      })(this));
    };


    /* Public interface below */


    /*
    name()
    Get backend name
    
    Returns String, unique string describing a given backend
     */

    CompletionBackend.prototype.name = function() {
      return "haskell-ghc-mod";
    };


    /*
    onDidDestroy(callback)
    Destruction event subscription. Usually should be called only on
    package deactivation.
    callback: () ->
     */

    CompletionBackend.prototype.onDidDestroy = function(callback) {
      if (this.isActive) {
        return this.process.onDidDestroy(callback);
      }
    };


    /*
    registerCompletionBuffer(buffer)
    Every buffer that would be used with autocompletion functions has to
    be registered with this function.
    
    buffer: TextBuffer, buffer to be used in autocompletion
    
    Returns: Disposable, which will remove buffer from autocompletion
     */

    CompletionBackend.prototype.registerCompletionBuffer = function(buffer) {
      if (this.bufferMap.has(buffer)) {
        return new Disposable(function() {});
      }
      setImmediate((function(_this) {
        return function() {
          var bufferInfo, moduleMap, rootDir, _ref1;
          bufferInfo = _this.getBufferInfo({
            buffer: buffer
          }).bufferInfo;
          _ref1 = _this.getModuleMap({
            bufferInfo: bufferInfo
          }), rootDir = _ref1.rootDir, moduleMap = _ref1.moduleMap;
          _this.getModuleInfo({
            bufferInfo: bufferInfo,
            rootDir: rootDir,
            moduleMap: moduleMap
          });
          return bufferInfo.getImports().then(function(imports) {
            return imports.forEach(function(_arg) {
              var name;
              name = _arg.name;
              return _this.getModuleInfo({
                moduleName: name,
                rootDir: rootDir,
                moduleMap: moduleMap
              });
            });
          });
        };
      })(this));
      return new Disposable((function(_this) {
        return function() {
          return _this.unregisterCompletionBuffer(buffer);
        };
      })(this));
    };


    /*
    unregisterCompletionBuffer(buffer)
    buffer: TextBuffer, buffer to be removed from autocompletion
     */

    CompletionBackend.prototype.unregisterCompletionBuffer = function(buffer) {
      var _ref1;
      return (_ref1 = this.bufferMap.get(buffer)) != null ? _ref1.destroy() : void 0;
    };


    /*
    getCompletionsForSymbol(buffer,prefix,position)
    buffer: TextBuffer, current buffer
    prefix: String, completion prefix
    position: Point, current cursor position
    
    Returns: Promise([symbol])
    symbol: Object, a completion symbol
      name: String, symbol name
      qname: String, qualified name, if module is qualified.
             Otherwise, same as name
      typeSignature: String, type signature
      symbolType: String, one of ['type', 'class', 'function']
      module: Object, symbol module information
        qualified: Boolean, true if module is imported as qualified
        name: String, module name
        alias: String, module alias
        hiding: Boolean, true if module is imported with hiding clause
        importList: [String], array of explicit imports/hidden imports
     */

    CompletionBackend.prototype.getCompletionsForSymbol = function(buffer, prefix, position) {
      if (!this.isActive()) {
        return Promise.reject("Backend inactive");
      }
      return this.getSymbolsForBuffer(buffer).then(function(symbols) {
        return FZ.filter(symbols, prefix, {
          key: 'qname'
        });
      });
    };


    /*
    getCompletionsForType(buffer,prefix,position)
    buffer: TextBuffer, current buffer
    prefix: String, completion prefix
    position: Point, current cursor position
    
    Returns: Promise([symbol])
    symbol: Same as getCompletionsForSymbol, except
            symbolType is one of ['type', 'class']
     */

    CompletionBackend.prototype.getCompletionsForType = function(buffer, prefix, position) {
      if (!this.isActive()) {
        return Promise.reject("Backend inactive");
      }
      return this.getSymbolsForBuffer(buffer, ['type', 'class']).then(function(symbols) {
        return FZ.filter(symbols, prefix, {
          key: 'qname'
        });
      });
    };


    /*
    getCompletionsForClass(buffer,prefix,position)
    buffer: TextBuffer, current buffer
    prefix: String, completion prefix
    position: Point, current cursor position
    
    Returns: Promise([symbol])
    symbol: Same as getCompletionsForSymbol, except
            symbolType is one of ['class']
     */

    CompletionBackend.prototype.getCompletionsForClass = function(buffer, prefix, position) {
      if (!this.isActive()) {
        return Promise.reject("Backend inactive");
      }
      return this.getSymbolsForBuffer(buffer, ['class']).then(function(symbols) {
        return FZ.filter(symbols, prefix, {
          key: 'qname'
        });
      });
    };


    /*
    getCompletionsForModule(buffer,prefix,position)
    buffer: TextBuffer, current buffer
    prefix: String, completion prefix
    position: Point, current cursor position
    
    Returns: Promise([module])
    module: String, module name
     */

    CompletionBackend.prototype.getCompletionsForModule = function(buffer, prefix, position) {
      var m, rootDir, _ref1, _ref2;
      if (!this.isActive()) {
        return Promise.reject("Backend inactive");
      }
      rootDir = (_ref1 = (_ref2 = this.process) != null ? typeof _ref2.getRootDir === "function" ? _ref2.getRootDir(buffer) : void 0 : void 0) != null ? _ref1 : Util.getRootDir(buffer);
      m = this.modListMap.get(rootDir);
      if (m != null) {
        return Promise.resolve(FZ.filter(m, prefix));
      } else {
        return this.process.runList(buffer).then((function(_this) {
          return function(modules) {
            _this.modListMap.set(rootDir, modules);
            setTimeout((function() {
              return _this.modListMap["delete"](rootDir);
            }), 60 * 1000);
            return FZ.filter(modules, prefix);
          };
        })(this));
      }
    };


    /*
    getCompletionsForSymbolInModule(buffer,prefix,position,{module})
    Used in import hiding/list completions
    
    buffer: TextBuffer, current buffer
    prefix: String, completion prefix
    position: Point, current cursor position
    module: String, module name (optional). If undefined, function
            will attempt to infer module name from position and buffer.
    
    Returns: Promise([symbol])
    symbol: Object, symbol in given module
      name: String, symbol name
      typeSignature: String, type signature
      symbolType: String, one of ['type', 'class', 'function']
     */

    CompletionBackend.prototype.getCompletionsForSymbolInModule = function(buffer, prefix, position, opts) {
      var bufferInfo, lineRange, moduleName;
      if (!this.isActive()) {
        return Promise.reject("Backend inactive");
      }
      moduleName = opts != null ? opts.module : void 0;
      if (moduleName == null) {
        lineRange = new Range([0, position.row], position);
        buffer.backwardsScanInRange(/^import\s+([\w.]+)/, lineRange, function(_arg) {
          var match;
          match = _arg.match;
          return moduleName = match[1];
        });
      }
      bufferInfo = this.getBufferInfo({
        buffer: buffer
      }).bufferInfo;
      return this.getModuleInfo({
        bufferInfo: bufferInfo,
        moduleName: moduleName
      }).then(function(_arg) {
        var moduleInfo, symbols;
        moduleInfo = _arg.moduleInfo;
        symbols = moduleInfo.select({
          qualified: false,
          hiding: false,
          name: moduleName
        });
        return FZ.filter(symbols, prefix, {
          key: 'name'
        });
      });
    };


    /*
    getCompletionsForLanguagePragmas(buffer,prefix,position)
    buffer: TextBuffer, current buffer
    prefix: String, completion prefix
    position: Point, current cursor position
    
    Returns: Promise([pragma])
    pragma: String, language option
     */

    CompletionBackend.prototype.getCompletionsForLanguagePragmas = function(buffer, prefix, position) {
      var dir, p, promise, _ref1, _ref2;
      if (!this.isActive()) {
        return Promise.reject("Backend inactive");
      }
      dir = (_ref1 = (_ref2 = this.process) != null ? typeof _ref2.getRootDir === "function" ? _ref2.getRootDir(buffer) : void 0 : void 0) != null ? _ref1 : Util.getRootDir(buffer);
      p = this.languagePragmas.has(dir) ? this.languagePragmas.get(dir) : (promise = this.process.runLang(dir), this.languagePragmas.set(dir, promise), promise);
      return p.then(function(pragmas) {
        return FZ.filter(pragmas, prefix);
      });
    };


    /*
    getCompletionsForCompilerOptions(buffer,prefix,position)
    buffer: TextBuffer, current buffer
    prefix: String, completion prefix
    position: Point, current cursor position
    
    Returns: Promise([ghcopt])
    ghcopt: String, compiler option (starts with '-f')
     */

    CompletionBackend.prototype.getCompletionsForCompilerOptions = function(buffer, prefix, position) {
      var dir, p, promise, _ref1, _ref2;
      if (!this.isActive()) {
        return Promise.reject("Backend inactive");
      }
      dir = (_ref1 = (_ref2 = this.process) != null ? typeof _ref2.getRootDir === "function" ? _ref2.getRootDir(buffer) : void 0 : void 0) != null ? _ref1 : Util.getRootDir(buffer);
      p = this.compilerOptions.has(dir) ? this.compilerOptions.get(dir) : (promise = this.process.runFlag(dir), this.compilerOptions.set(dir, promise), promise);
      return p.then(function(options) {
        return FZ.filter(options, prefix);
      });
    };


    /*
    getCompletionsForHole(buffer,prefix,position)
    Get completions based on expression type.
    It is assumed that `prefix` starts with '_'
    
    buffer: TextBuffer, current buffer
    prefix: String, completion prefix
    position: Point, current cursor position
    
    Returns: Promise([symbol])
    symbol: Same as getCompletionsForSymbol
     */

    CompletionBackend.prototype.getCompletionsForHole = function(buffer, prefix, position) {
      if (!this.isActive()) {
        return Promise.reject("Backend inactive");
      }
      if (position != null) {
        position = Range.fromPointWithDelta(position, 0, 0);
      }
      if (prefix.startsWith('_')) {
        prefix = prefix.slice(1);
      }
      return this.process.getTypeInBuffer(buffer, position).then((function(_this) {
        return function(_arg) {
          var type;
          type = _arg.type;
          return _this.getSymbolsForBuffer(buffer).then(function(symbols) {
            var ts;
            ts = symbols.filter(function(s) {
              var rx, tl;
              if (s.typeSignature == null) {
                return false;
              }
              tl = s.typeSignature.split(' -> ').slice(-1)[0];
              if (tl.match(/^[a-z]$/)) {
                return false;
              }
              ts = tl.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
              rx = RegExp(ts.replace(/\b[a-z]\b/g, '.+'), '');
              return rx.test(type);
            });
            if (prefix.length === 0) {
              return ts.sort(function(a, b) {
                return FZ.score(b.typeSignature, type) - FZ.score(a.typeSignature, type);
              });
            } else {
              return FZ.filter(ts, prefix, {
                key: 'qname'
              });
            }
          });
        };
      })(this));
    };

    return CompletionBackend;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL2NvbXBsZXRpb24tYmFja2VuZC9jb21wbGV0aW9uLWJhY2tlbmQuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFBQSxNQUFBLDRFQUFBO0lBQUEsa0ZBQUE7O0FBQUEsRUFBQSxFQUFBLEdBQUssT0FBQSxDQUFRLFlBQVIsQ0FBTCxDQUFBOztBQUFBLEVBQ0EsT0FBc0IsT0FBQSxDQUFRLE1BQVIsQ0FBdEIsRUFBQyxrQkFBQSxVQUFELEVBQWEsYUFBQSxLQURiLENBQUE7O0FBQUEsRUFFQSxVQUFBLEdBQWEsT0FBQSxDQUFRLGVBQVIsQ0FGYixDQUFBOztBQUFBLEVBR0EsVUFBQSxHQUFhLE9BQUEsQ0FBUSxlQUFSLENBSGIsQ0FBQTs7QUFBQSxFQUlBLElBQUEsR0FBTyxPQUFBLENBQVEsU0FBUixDQUpQLENBQUE7O0FBQUEsRUFNQSxNQUFNLENBQUMsT0FBUCxHQUNNO0FBQ0osZ0NBQUEsT0FBQSxHQUFTLElBQVQsQ0FBQTs7QUFBQSxnQ0FDQSxTQUFBLEdBQVcsSUFEWCxDQUFBOztBQUFBLGdDQUVBLE1BQUEsR0FBUSxJQUZSLENBQUE7O0FBQUEsZ0NBR0EsVUFBQSxHQUFZLElBSFosQ0FBQTs7QUFBQSxnQ0FJQSxlQUFBLEdBQWlCLElBSmpCLENBQUE7O0FBQUEsZ0NBS0EsZUFBQSxHQUFpQixJQUxqQixDQUFBOztBQU9hLElBQUEsMkJBQUMsSUFBRCxHQUFBO0FBQ1gsMkVBQUEsQ0FBQTtBQUFBLGlHQUFBLENBQUE7QUFBQSxpR0FBQSxDQUFBO0FBQUEsK0ZBQUEsQ0FBQTtBQUFBLCtFQUFBLENBQUE7QUFBQSw2RUFBQSxDQUFBO0FBQUEsMkVBQUEsQ0FBQTtBQUFBLCtFQUFBLENBQUE7QUFBQSxxRkFBQSxDQUFBO0FBQUEsaUZBQUEs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

//# sourceURL=/Users/erewok/.atom/packages/haskell-ghc-mod/lib/completion-backend/completion-backend.coffee

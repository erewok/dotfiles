(function() {
  var BufferInfo, CompletionBackend, Disposable, FZ, ModuleInfo, Range, Util, _, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  FZ = require('fuzzaldrin');

  ref = require('atom'), Disposable = ref.Disposable, Range = ref.Range;

  BufferInfo = require('./buffer-info');

  ModuleInfo = require('./module-info');

  Util = require('../util');

  _ = require('underscore-plus');

  module.exports = CompletionBackend = (function() {
    CompletionBackend.prototype.process = null;

    CompletionBackend.prototype.bufferMap = null;

    CompletionBackend.prototype.dirMap = null;

    CompletionBackend.prototype.modListMap = null;

    CompletionBackend.prototype.languagePragmas = null;

    CompletionBackend.prototype.compilerOptions = null;

    function CompletionBackend(proc) {
      this.getCompletionsForHole = bind(this.getCompletionsForHole, this);
      this.getCompletionsForCompilerOptions = bind(this.getCompletionsForCompilerOptions, this);
      this.getCompletionsForLanguagePragmas = bind(this.getCompletionsForLanguagePragmas, this);
      this.getCompletionsForSymbolInModule = bind(this.getCompletionsForSymbolInModule, this);
      this.getCompletionsForModule = bind(this.getCompletionsForModule, this);
      this.getCompletionsForClass = bind(this.getCompletionsForClass, this);
      this.getCompletionsForType = bind(this.getCompletionsForType, this);
      this.getCompletionsForSymbol = bind(this.getCompletionsForSymbol, this);
      this.unregisterCompletionBuffer = bind(this.unregisterCompletionBuffer, this);
      this.registerCompletionBuffer = bind(this.registerCompletionBuffer, this);
      this.onDidDestroy = bind(this.onDidDestroy, this);
      this.getModuleInfo = bind(this.getModuleInfo, this);
      this.getModuleMap = bind(this.getModuleMap, this);
      this.getBufferInfo = bind(this.getBufferInfo, this);
      this.getSymbolsForBuffer = bind(this.getSymbolsForBuffer, this);
      this.isActive = bind(this.isActive, this);
      this.bufferMap = new WeakMap;
      this.dirMap = new WeakMap;
      this.modListMap = new WeakMap;
      this.languagePragmas = new WeakMap;
      this.compilerOptions = new WeakMap;
      this.setProcess(proc);
    }

    CompletionBackend.prototype.setProcess = function(process) {
      var ref1;
      this.process = process;
      return (ref1 = this.process) != null ? ref1.onDidDestroy((function(_this) {
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
      var bufferInfo, moduleMap, ref1, rootDir;
      bufferInfo = this.getBufferInfo({
        buffer: buffer
      }).bufferInfo;
      ref1 = this.getModuleMap({
        bufferInfo: bufferInfo
      }), rootDir = ref1.rootDir, moduleMap = ref1.moduleMap;
      if ((bufferInfo != null) && (moduleMap != null)) {
        return bufferInfo.getImports().then((function(_this) {
          return function(imports) {
            return Promise.all(imports.map(function(imp) {
              return _this.getModuleInfo({
                moduleName: imp.name,
                rootDir: rootDir,
                moduleMap: moduleMap
              }).then(function(arg) {
                var moduleInfo;
                moduleInfo = arg.moduleInfo;
                return moduleInfo.select(imp, symbolTypes);
              });
            }));
          };
        })(this)).then(function(promises) {
          var ref2;
          return (ref2 = []).concat.apply(ref2, promises);
        });
      } else {
        return Promise.resolve([]);
      }
    };

    CompletionBackend.prototype.getBufferInfo = function(arg) {
      var bi, buffer;
      buffer = arg.buffer;
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

    CompletionBackend.prototype.getModuleMap = function(arg) {
      var bufferInfo, mm, ref1, ref2, rootDir;
      bufferInfo = arg.bufferInfo, rootDir = arg.rootDir;
      if (!((bufferInfo != null) || (rootDir != null))) {
        throw new Error("Neither bufferInfo nor rootDir specified");
      }
      if (rootDir == null) {
        rootDir = (ref1 = (ref2 = this.process) != null ? typeof ref2.getRootDir === "function" ? ref2.getRootDir(bufferInfo.buffer) : void 0 : void 0) != null ? ref1 : Util.getRootDir(bufferInfo.buffer);
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

    CompletionBackend.prototype.getModuleInfo = function(arg) {
      var bufferInfo, moduleMap, moduleName, rootDir;
      moduleName = arg.moduleName, bufferInfo = arg.bufferInfo, rootDir = arg.rootDir, moduleMap = arg.moduleMap;
      if (!((moduleName != null) || (bufferInfo != null))) {
        throw new Error("No moduleName or bufferInfo specified");
      }
      return Promise.resolve(moduleName || bufferInfo.getModuleName()).then((function(_this) {
        return function(moduleName) {
          var moduleInfo, ref1;
          if (!moduleName) {
            Util.debug("warn: nameless module in " + (bufferInfo.buffer.getUri()));
            return;
          }
          if (!((moduleMap != null) && (rootDir != null))) {
            if (bufferInfo == null) {
              throw new Error("No bufferInfo specified and no moduleMap+rootDir");
            }
            ref1 = _this.getModuleMap({
              bufferInfo: bufferInfo,
              rootDir: rootDir
            }), rootDir = ref1.rootDir, moduleMap = ref1.moduleMap;
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
                return Util.debug(moduleName + " removed from map");
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

    CompletionBackend.prototype.filter = function(candidates, prefix, keys) {
      if (!prefix) {
        return candidates;
      }
      return candidates.map(function(c) {
        var c1, scores;
        c1 = _.clone(c);
        scores = keys.map(function(key) {
          return FZ.score(c1[key], prefix);
        });
        c1.score = Math.max.apply(Math, scores);
        c1.scoreN = scores.indexOf(c1.score);
        return c1;
      }).filter(function(c) {
        return c.score > 0;
      }).sort(function(a, b) {
        var s;
        s = b.score - a.score;
        if (s === 0) {
          s = a.scoreN - b.scoreN;
        }
        return s;
      });
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
          var bufferInfo, moduleMap, ref1, rootDir;
          bufferInfo = _this.getBufferInfo({
            buffer: buffer
          }).bufferInfo;
          ref1 = _this.getModuleMap({
            bufferInfo: bufferInfo
          }), rootDir = ref1.rootDir, moduleMap = ref1.moduleMap;
          _this.getModuleInfo({
            bufferInfo: bufferInfo,
            rootDir: rootDir,
            moduleMap: moduleMap
          });
          return bufferInfo.getImports().then(function(imports) {
            return imports.forEach(function(arg) {
              var name;
              name = arg.name;
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
      var ref1;
      return (ref1 = this.bufferMap.get(buffer)) != null ? ref1.destroy() : void 0;
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
      return this.getSymbolsForBuffer(buffer).then((function(_this) {
        return function(symbols) {
          return _this.filter(symbols, prefix, ['qname', 'qparent']);
        };
      })(this));
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
      var m, ref1, ref2, rootDir;
      if (!this.isActive()) {
        return Promise.reject("Backend inactive");
      }
      rootDir = (ref1 = (ref2 = this.process) != null ? typeof ref2.getRootDir === "function" ? ref2.getRootDir(buffer) : void 0 : void 0) != null ? ref1 : Util.getRootDir(buffer);
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
        buffer.backwardsScanInRange(/^import\s+([\w.]+)/, lineRange, function(arg) {
          var match;
          match = arg.match;
          return moduleName = match[1];
        });
      }
      bufferInfo = this.getBufferInfo({
        buffer: buffer
      }).bufferInfo;
      return this.getModuleInfo({
        bufferInfo: bufferInfo,
        moduleName: moduleName
      }).then(function(arg) {
        var moduleInfo, symbols;
        moduleInfo = arg.moduleInfo;
        symbols = moduleInfo.select({
          qualified: false,
          skipQualified: true,
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
      var dir, p, promise, ref1, ref2;
      if (!this.isActive()) {
        return Promise.reject("Backend inactive");
      }
      dir = (ref1 = (ref2 = this.process) != null ? typeof ref2.getRootDir === "function" ? ref2.getRootDir(buffer) : void 0 : void 0) != null ? ref1 : Util.getRootDir(buffer);
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
      var dir, p, promise, ref1, ref2;
      if (!this.isActive()) {
        return Promise.reject("Backend inactive");
      }
      dir = (ref1 = (ref2 = this.process) != null ? typeof ref2.getRootDir === "function" ? ref2.getRootDir(buffer) : void 0 : void 0) != null ? ref1 : Util.getRootDir(buffer);
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
        return function(arg) {
          var type;
          type = arg.type;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL2NvbXBsZXRpb24tYmFja2VuZC9jb21wbGV0aW9uLWJhY2tlbmQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw4RUFBQTtJQUFBOztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsWUFBUjs7RUFDTCxNQUFzQixPQUFBLENBQVEsTUFBUixDQUF0QixFQUFDLDJCQUFELEVBQWE7O0VBQ2IsVUFBQSxHQUFhLE9BQUEsQ0FBUSxlQUFSOztFQUNiLFVBQUEsR0FBYSxPQUFBLENBQVEsZUFBUjs7RUFDYixJQUFBLEdBQU8sT0FBQSxDQUFRLFNBQVI7O0VBQ1AsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFFSixNQUFNLENBQUMsT0FBUCxHQUNNO2dDQUNKLE9BQUEsR0FBUzs7Z0NBQ1QsU0FBQSxHQUFXOztnQ0FDWCxNQUFBLEdBQVE7O2dDQUNSLFVBQUEsR0FBWTs7Z0NBQ1osZUFBQSxHQUFpQjs7Z0NBQ2pCLGVBQUEsR0FBaUI7O0lBRUosMkJBQUMsSUFBRDs7Ozs7Ozs7Ozs7Ozs7Ozs7TUFDWCxJQUFDLENBQUEsU0FBRCxHQUFhLElBQUk7TUFDakIsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFJO01BQ2QsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFJO01BQ2xCLElBQUMsQ0FBQSxlQUFELEdBQW1CLElBQUk7TUFDdkIsSUFBQyxDQUFBLGVBQUQsR0FBbUIsSUFBSTtNQUV2QixJQUFDLENBQUEsVUFBRCxDQUFZLElBQVo7SUFQVzs7Z0NBU2IsVUFBQSxHQUFZLFNBQUMsT0FBRDtBQUNWLFVBQUE7TUFEVyxJQUFDLENBQUEsVUFBRDtpREFDSCxDQUFFLFlBQVYsQ0FBdUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUNyQixLQUFDLENBQUEsT0FBRCxHQUFXO1FBRFU7TUFBQSxDQUFB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bmdlfSA9IHJlcXVpcmUgJ2F0b20nXG5CdWZmZXJJbmZvID0gcmVxdWlyZSAnLi9idWZmZXItaW5mbydcbk1vZHVsZUluZm8gPSByZXF1aXJlICcuL21vZHVsZS1pbmZvJ1xuVXRpbCA9IHJlcXVpcmUgJy4uL3V0aWwnXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBDb21wbGV0aW9uQmFja2VuZFxuICBwcm9jZXNzOiBudWxsXG4gIGJ1ZmZlck1hcDogbnVsbFxuICBkaXJNYXA6IG51bGxcbiAgbW9kTGlzdE1hcDogbnVsbFxuICBsYW5ndWFnZVByYWdtYXM6IG51bGxcbiAgY29tcGlsZXJPcHRpb25zOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChwcm9jKSAtPlxuICAgIEBidWZmZXJNYXAgPSBuZXcgV2Vha01hcCAjIGJ1ZmZlciA9PiBCdWZmZXJJbmZvXG4gICAgQGRpck1hcCA9IG5ldyBXZWFrTWFwICMgZGlyID0+IE1hcCBNb2R1bGVOYW1lIE1vZHVsZUluZm9cbiAgICBAbW9kTGlzdE1hcCA9IG5ldyBXZWFrTWFwICMgZGlyID0+IFtNb2R1bGVOYW1lXVxuICAgIEBsYW5ndWFnZVByYWdtYXMgPSBuZXcgV2Vha01hcCAjIGRpciA9PiBwcmFnbWFzXG4gICAgQGNvbXBpbGVyT3B0aW9ucyA9IG5ldyBXZWFrTWFwICMgZGlyID0+IG9wdGlvbnNcblxuICAgIEBzZXRQcm9jZXNzIHByb2NcblxuICBzZXRQcm9jZXNzOiAoQHByb2Nlc3MpIC0+XG4gICAgQHByb2Nlc3M/Lm9uRGlkRGVzdHJveSA9PlxuICAgICAgQHByb2Nlc3MgPSBudWxsXG5cbiAgaXNBY3RpdmU6ID0+XG4gICAgdW5sZXNzIEBwcm9jZXNzP1xuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcgXCJIYXNrZWxsIENvbXBsZXRpb24gQmFja2VuZCAje0BuYW1lKCl9XG4gICAgICAgIGlzIGluYWN0aXZlXCJcbiAgICBAcHJvY2Vzcz9cblxuICBnZXRTeW1ib2xzRm9yQnVmZmVyOiAoYnVmZmVyLCBzeW1ib2xUeXBlcykgPT5cbiAgICB7YnVmZmVySW5mb30gPSBAZ2V0QnVmZmVySW5mbyB7YnVmZmVyfVxuICAgIHtyb290RGlyLCBtb2R1bGVNYXB9ID0gQGdldE1vZHVsZU1hcCB7YnVmZmVySW5mb31cbiAgICBpZiBidWZmZXJJbmZvPyBhbmQgbW9kdWxlTWFwP1xuICAgICAgYnVmZmVySW5mby5nZXRJbXBvcnRzKClcbiAgICAgIC50aGVuIChpbXBvcnRzKSA9PlxuICAgICAgICBQcm9taXNlLmFsbCBpbXBvcnRzLm1hcCAoaW1wKSA9PlxuICAgICAgICAgIEBnZXRNb2R1bGVJbmZvXG4gICAgICAgICAgICBtb2R1bGVOYW1lOiBpbXAubmFtZVxuICAgICAgICAgICAgcm9vdERpcjogcm9vdERpclxuICAgICAgICAgICAgbW9kdWxlTWFwOiBtb2R1bGVNYXBcbiAgICAgICAgICAudGhlbiAoe21vZHVsZUluZm99KSAtPlxuICAgICAgICAgICAgbW9kdWxlSW5mby5zZWxlY3QoaW1wLCBzeW1ib2xUeXBlcylcbiAgICAgIC50aGVuIChwcm9taXNlcykgLT5cbiAgICAgICAgW10uY29uY2F0IHByb21pc2VzLi4uXG4gICAgZWxzZVxuICAgICAgUHJvbWlzZS5yZXNvbHZlIFtdXG5cbiAgZ2V0QnVmZmVySW5mbzogKHtidWZmZXJ9KSA9PlxuICAgIHVubGVzcyBidWZmZXI/XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOdWxsIGJ1ZmZlciBpbiBnZXRCdWZmZXJJbmZvIVwiKVxuICAgIGlmIEBidWZmZXJNYXAuaGFzIGJ1ZmZlclxuICAgICAgYmkgPSBAYnVmZmVyTWFwLmdldCBidWZmZXJcbiAgICB1bmxlc3MgYmk/LmJ1ZmZlcj9cbiAgICAgIEBidWZmZXJNYXAuc2V0IGJ1ZmZlciwgYmkgPSBuZXcgQnVmZmVySW5mbyhidWZmZXIpXG4gICAgICAjIGJpLm9uRGlkRGVzdHJveSA9PlxuICAgICAgIyAgIEBidWZmZXJNYXAuZGVsZXRlIGJ1ZmZlclxuICAgIGJ1ZmZlckluZm86IGJpXG5cbiAgZ2V0TW9kdWxlTWFwOiAoe2J1ZmZlckluZm8sIHJvb3REaXJ9KSA9PlxuICAgIHVubGVzcyBidWZmZXJJbmZvPyBvciByb290RGlyP1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTmVpdGhlciBidWZmZXJJbmZvIG5vciByb290RGlyIHNwZWNpZmllZFwiKVxuICAgIHJvb3REaXIgPz0gQHByb2Nlc3M/LmdldFJvb3REaXI/KGJ1ZmZlckluZm8uYnVmZmVyKSA/IFV0aWwuZ2V0Um9vdERpcihidWZmZXJJbmZvLmJ1ZmZlcilcbiAgICB1bmxlc3MgQGRpck1hcC5oYXMocm9vdERpcilcbiAgICAgIEBkaXJNYXAuc2V0IHJvb3REaXIsIG1tID0gbmV3IE1hcFxuICAgIGVsc2VcbiAgICAgIG1tID0gQGRpck1hcC5nZXQgcm9vdERpclxuXG4gICAgcm9vdERpcjogcm9vdERpclxuICAgIG1vZHVsZU1hcDogbW1cblxuICBnZXRNb2R1bGVJbmZvOiAoe21vZHVsZU5hbWUsIGJ1ZmZlckluZm8sIHJvb3REaXIsIG1vZHVsZU1hcH0pID0+XG4gICAgdW5sZXNzIG1vZHVsZU5hbWU/IG9yIGJ1ZmZlckluZm8/XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBtb2R1bGVOYW1lIG9yIGJ1ZmZlckluZm8gc3BlY2lmaWVkXCIpXG4gICAgIyBtb2R1bGVOYW1lID89IGJ1ZmZlckluZm8uZ2V0TW9kdWxlTmFtZSgpXG4gICAgUHJvbWlzZS5yZXNvbHZlIChtb2R1bGVOYW1lIG9yIGJ1ZmZlckluZm8uZ2V0TW9kdWxlTmFtZSgpKVxuICAgIC50aGVuIChtb2R1bGVOYW1lKSA9PlxuICAgICAgdW5sZXNzIG1vZHVsZU5hbWVcbiAgICAgICAgVXRpbC5kZWJ1ZyBcIndhcm46IG5hbWVsZXNzIG1vZHVsZSBpblxuICAgICAgICAgICN7YnVmZmVySW5mby5idWZmZXIuZ2V0VXJpKCl9XCJcbiAgICAgICAgcmV0dXJuXG4gICAgICB1bmxlc3MgbW9kdWxlTWFwPyBhbmQgcm9vdERpcj9cbiAgICAgICAgdW5sZXNzIGJ1ZmZlckluZm8/XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gYnVmZmVySW5mbyBzcGVjaWZpZWQgYW5kIG5vIG1vZHVsZU1hcCtyb290RGlyXCIpXG4gICAgICAgIHtyb290RGlyLCBtb2R1bGVNYXB9ID0gQGdldE1vZHVsZU1hcCh7YnVmZmVySW5mbywgcm9vdERpcn0pXG5cbiAgICAgIG1vZHVsZUluZm8gPSBtb2R1bGVNYXAuZ2V0IG1vZHVsZU5hbWVcbiAgICAgIHVubGVzcyBtb2R1bGVJbmZvPy5zeW1ib2xzPyAjaGFjayB0byBoZWxwIHdpdGggIzIwLCAjMjFcbiAgICAgICAgbmV3IFByb21pc2UgKHJlc29sdmUpID0+XG4gICAgICAgICAgbW9kdWxlTWFwLnNldCBtb2R1bGVOYW1lLFxuICAgICAgICAgICAgbW9kdWxlSW5mbyA9IG5ldyBNb2R1bGVJbmZvIG1vZHVsZU5hbWUsIEBwcm9jZXNzLCByb290RGlyLCAtPlxuICAgICAgICAgICAgICByZXNvbHZlIHtidWZmZXJJbmZvLCByb290RGlyLCBtb2R1bGVNYXAsIG1vZHVsZUluZm99XG5cbiAgICAgICAgICBpZiBidWZmZXJJbmZvP1xuICAgICAgICAgICAgbW9kdWxlSW5mby5zZXRCdWZmZXIgYnVmZmVySW5mbywgcm9vdERpclxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCkuZm9yRWFjaCAoZWRpdG9yKSA9PlxuICAgICAgICAgICAgICB7YnVmZmVySW5mb30gPSBAZ2V0QnVmZmVySW5mbyB7YnVmZmVyOiBlZGl0b3IuZ2V0QnVmZmVyKCl9XG4gICAgICAgICAgICAgIG1vZHVsZUluZm8uc2V0QnVmZmVyIGJ1ZmZlckluZm8sIHJvb3REaXJcblxuICAgICAgICAgIG1vZHVsZUluZm8ub25EaWREZXN0cm95IC0+XG4gICAgICAgICAgICBtb2R1bGVNYXAuZGVsZXRlIG1vZHVsZU5hbWVcbiAgICAgICAgICAgIFV0aWwuZGVidWcgXCIje21vZHVsZU5hbWV9IHJlbW92ZWQgZnJvbSBtYXBcIlxuICAgICAgZWxzZVxuICAgICAgICBQcm9taXNlLnJlc29sdmUge2J1ZmZlckluZm8sIHJvb3REaXIsIG1vZHVsZU1hcCwgbW9kdWxlSW5mb31cblxuICBmaWx0ZXI6IChjYW5kaWRhdGVzLCBwcmVmaXgsIGtleXMpIC0+XG4gICAgdW5sZXNzIHByZWZpeFxuICAgICAgcmV0dXJuIGNhbmRpZGF0ZXNcbiAgICBjYW5kaWRhdGVzXG4gICAgLm1hcCAoYykgLT5cbiAgICAgIGMxID0gXy5jbG9uZShjKVxuICAgICAgc2NvcmVzID0ga2V5cy5tYXAgKGtleSkgLT4gRlouc2NvcmUoYzFba2V5XSwgcHJlZml4KVxuICAgICAgYzEuc2NvcmUgPSBNYXRoLm1heChzY29yZXMuLi4pXG4gICAgICBjMS5zY29yZU4gPSBzY29yZXMuaW5kZXhPZihjMS5zY29yZSlcbiAgICAgIHJldHVybiBjMVxuICAgIC5maWx0ZXIgKGMpIC0+IGMuc2NvcmUgPiAwXG4gICAgLnNvcnQgKGEsIGIpIC0+XG4gICAgICBzID0gYi5zY29yZSAtIGEuc2NvcmVcbiAgICAgIGlmIHMgPT0gMFxuICAgICAgICBzID0gYS5zY29yZU4gLSBiLnNjb3JlTlxuICAgICAgcmV0dXJuIHNcblxuICAjIyMgUHVibGljIGludGVyZmFjZSBiZWxvdyAjIyNcblxuICAjIyNcbiAgbmFtZSgpXG4gIEdldCBiYWNrZW5kIG5hbWVcblxuICBSZXR1cm5zIFN0cmluZywgdW5pcXVlIHN0cmluZyBkZXNjcmliaW5nIGEgZ2l2ZW4gYmFja2VuZFxuICAjIyNcbiAgbmFtZTogLT4gXCJoYXNrZWxsLWdoYy1tb2RcIlxuXG4gICMjI1xuICBvbkRpZERlc3Ryb3koY2FsbGJhY2spXG4gIERlc3RydWN0aW9uIGV2ZW50IHN1YnNjcmlwdGlvbi4gVXN1YWxseSBzaG91bGQgYmUgY2FsbGVkIG9ubHkgb25cbiAgcGFja2FnZSBkZWFjdGl2YXRpb24uXG4gIGNhbGxiYWNrOiAoKSAtPlxuICAjIyNcbiAgb25EaWREZXN0cm95OiAoY2FsbGJhY2spID0+XG4gICAgQHByb2Nlc3Mub25EaWREZXN0cm95IGNhbGxiYWNrIGlmIEBpc0FjdGl2ZVxuXG4gICMjI1xuICByZWdpc3RlckNvbXBsZXRpb25CdWZmZXIoYnVmZmVyKVxuICBFdmVyeSBidWZmZXIgdGhhdCB3b3VsZCBiZSB1c2VkIHdpdGggYXV0b2NvbXBsZXRpb24gZnVuY3Rpb25zIGhhcyB0b1xuICBiZSByZWdpc3RlcmVkIHdpdGggdGhpcyBmdW5jdGlvbi5cblxuICBidWZmZXI6IFRleHRCdWZmZXIsIGJ1ZmZlciB0byBiZSB1c2VkIGluIGF1dG9jb21wbGV0aW9uXG5cbiAgUmV0dXJuczogRGlzcG9zYWJsZSwgd2hpY2ggd2lsbCByZW1vdmUgYnVmZmVyIGZyb20gYXV0b2NvbXBsZXRpb25cbiAgIyMjXG4gIHJlZ2lzdGVyQ29tcGxldGlvbkJ1ZmZlcjogKGJ1ZmZlcikgPT5cbiAgICBpZiBAYnVmZmVyTWFwLmhhcyBidWZmZXJcbiAgICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZSAtPlxuXG4gICAgc2V0SW1tZWRpYXRlID0+XG4gICAgICB7YnVmZmVySW5mb30gPSBAZ2V0QnVmZmVySW5mbyB7YnVmZmVyfVxuXG4gICAgICB7cm9vdERpciwgbW9kdWxlTWFwfSA9IEBnZXRNb2R1bGVNYXAge2J1ZmZlckluZm99XG5cbiAgICAgIEBnZXRNb2R1bGVJbmZvIHtidWZmZXJJbmZvLCByb290RGlyLCBtb2R1bGVNYXB9XG5cbiAgICAgIGJ1ZmZlckluZm8uZ2V0SW1wb3J0cygpXG4gICAgICAudGhlbiAoaW1wb3J0cykgPT5cbiAgICAgICAgaW1wb3J0cy5mb3JFYWNoICh7bmFtZX0pID0+XG4gICAgICAgICAgQGdldE1vZHVsZUluZm8ge21vZHVsZU5hbWU6IG5hbWUsIHJvb3REaXIsIG1vZHVsZU1hcH1cblxuICAgIG5ldyBEaXNwb3NhYmxlID0+XG4gICAgICBAdW5yZWdpc3RlckNvbXBsZXRpb25CdWZmZXIgYnVmZmVyXG5cbiAgIyMjXG4gIHVucmVnaXN0ZXJDb21wbGV0aW9uQnVmZmVyKGJ1ZmZlcilcbiAgYnVmZmVyOiBUZXh0QnVmZmVyLCBidWZmZXIgdG8gYmUgcmVtb3ZlZCBmcm9tIGF1dG9jb21wbGV0aW9uXG4gICMjI1xuICB1bnJlZ2lzdGVyQ29tcGxldGlvbkJ1ZmZlcjogKGJ1ZmZlcikgPT5cbiAgICBAYnVmZmVyTWFwLmdldChidWZmZXIpPy5kZXN0cm95KClcblxuICAjIyNcbiAgZ2V0Q29tcGxldGlvbnNGb3JTeW1ib2woYnVmZmVyLHByZWZpeCxwb3NpdGlvbilcbiAgYnVmZmVyOiBUZXh0QnVmZmVyLCBjdXJyZW50IGJ1ZmZlclxuICBwcmVmaXg6IFN0cmluZywgY29tcGxldGlvbiBwcmVmaXhcbiAgcG9zaXRpb246IFBvaW50LCBjdXJyZW50IGN1cnNvciBwb3NpdGlvblxuXG4gIFJldHVybnM6IFByb21pc2UoW3N5bWJvbF0pXG4gIHN5bWJvbDogT2JqZWN0LCBhIGNvbXBsZXRpb24gc3ltYm9sXG4gICAgbmFtZTogU3RyaW5nLCBzeW1ib2wgbmFtZVxuICAgIHFuYW1lOiBTdHJpbmcsIHF1YWxpZmllZCBuYW1lLCBpZiBtb2R1bGUgaXMgcXVhbGlmaWVkLlxuICAgICAgICAgICBPdGhlcndpc2UsIHNhbWUgYXMgbmFtZVxuICAgIHR5cGVTaWduYXR1cmU6IFN0cmluZywgdHlwZSBzaWduYXR1cmVcbiAgICBzeW1ib2xUeXBlOiBTdHJpbmcsIG9uZSBvZiBbJ3R5cGUnLCAnY2xhc3MnLCAnZnVuY3Rpb24nXVxuICAgIG1vZHVsZTogT2JqZWN0LCBzeW1ib2wgbW9kdWxlIGluZm9ybWF0aW9uXG4gICAgICBxdWFsaWZpZWQ6IEJvb2xlYW4sIHRydWUgaWYgbW9kdWxlIGlzIGltcG9ydGVkIGFzIHF1YWxpZmllZFxuICAgICAgbmFtZTogU3RyaW5nLCBtb2R1bGUgbmFtZVxuICAgICAgYWxpYXM6IFN0cmluZywgbW9kdWxlIGFsaWFzXG4gICAgICBoaWRpbmc6IEJvb2xlYW4sIHRydWUgaWYgbW9kdWxlIGlzIGltcG9ydGVkIHdpdGggaGlkaW5nIGNsYXVzZVxuICAgICAgaW1wb3J0TGlzdDogW1N0cmluZ10sIGFycmF5IG9mIGV4cGxpY2l0IGltcG9ydHMvaGlkZGVuIGltcG9ydHNcbiAgIyMjXG4gIGdldENvbXBsZXRpb25zRm9yU3ltYm9sOiAoYnVmZmVyLCBwcmVmaXgsIHBvc2l0aW9uKSA9PlxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcIkJhY2tlbmQgaW5hY3RpdmVcIikgdW5sZXNzIEBpc0FjdGl2ZSgpXG5cbiAgICBAZ2V0U3ltYm9sc0ZvckJ1ZmZlcihidWZmZXIpLnRoZW4gKHN5bWJvbHMpID0+XG4gICAgICBAZmlsdGVyIHN5bWJvbHMsIHByZWZpeCwgWydxbmFtZScsICdxcGFyZW50J11cbiAgICAgICMgLmNvbmNhdCBGWi5maWx0ZXIgc3ltYm9scywgcHJlZml4LCBrZXk6ICdwYXJlbnQnXG5cbiAgIyMjXG4gIGdldENvbXBsZXRpb25zRm9yVHlwZShidWZmZXIscHJlZml4LHBvc2l0aW9uKVxuICBidWZmZXI6IFRleHRCdWZmZXIsIGN1cnJlbnQgYnVmZmVyXG4gIHByZWZpeDogU3RyaW5nLCBjb21wbGV0aW9uIHByZWZpeFxuICBwb3NpdGlvbjogUG9pbnQsIGN1cnJlbnQgY3Vyc29yIHBvc2l0aW9uXG5cbiAgUmV0dXJuczogUHJvbWlzZShbc3ltYm9sXSlcbiAgc3ltYm9sOiBTYW1lIGFzIGdldENvbXBsZXRpb25zRm9yU3ltYm9sLCBleGNlcHRcbiAgICAgICAgICBzeW1ib2xUeXBlIGlzIG9uZSBvZiBbJ3R5cGUnLCAnY2xhc3MnXVxuICAjIyNcbiAgZ2V0Q29tcGxldGlvbnNGb3JUeXBlOiAoYnVmZmVyLCBwcmVmaXgsIHBvc2l0aW9uKSA9PlxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcIkJhY2tlbmQgaW5hY3RpdmVcIikgdW5sZXNzIEBpc0FjdGl2ZSgpXG5cbiAgICBAZ2V0U3ltYm9sc0ZvckJ1ZmZlcihidWZmZXIsIFsndHlwZScsICdjbGFzcyddKS50aGVuIChzeW1ib2xzKSAtPlxuICAgICAgRlouZmlsdGVyIHN5bWJvbHMsIHByZWZpeCwga2V5OiAncW5hbWUnXG5cbiAgIyMjXG4gIGdldENvbXBsZXRpb25zRm9yQ2xhc3MoYnVmZmVyLHByZWZpeCxwb3NpdGlvbilcbiAgYnVmZmVyOiBUZXh0QnVmZmVyLCBjdXJyZW50IGJ1ZmZlclxuICBwcmVmaXg6IFN0cmluZywgY29tcGxldGlvbiBwcmVmaXhcbiAgcG9zaXRpb246IFBvaW50LCBjdXJyZW50IGN1cnNvciBwb3NpdGlvblxuXG4gIFJldHVybnM6IFByb21pc2UoW3N5bWJvbF0pXG4gIHN5bWJvbDogU2FtZSBhcyBnZXRDb21wbGV0aW9uc0ZvclN5bWJvbCwgZXhjZXB0XG4gICAgICAgICAgc3ltYm9sVHlwZSBpcyBvbmUgb2YgWydjbGFzcyddXG4gICMjI1xuICBnZXRDb21wbGV0aW9uc0ZvckNsYXNzOiAoYnVmZmVyLCBwcmVmaXgsIHBvc2l0aW9uKSA9PlxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcIkJhY2tlbmQgaW5hY3RpdmVcIikgdW5sZXNzIEBpc0FjdGl2ZSgpXG5cbiAgICBAZ2V0U3ltYm9sc0ZvckJ1ZmZlcihidWZmZXIsIFsnY2xhc3MnXSkudGhlbiAoc3ltYm9scykgLT5cbiAgICAgIEZaLmZpbHRlciBzeW1ib2xzLCBwcmVmaXgsIGtleTogJ3FuYW1lJ1xuXG4gICMjI1xuICBnZXRDb21wbGV0aW9uc0Zvck1vZHVsZShidWZmZXIscHJlZml4LHBvc2l0aW9uKVxuICBidWZmZXI6IFRleHRCdWZmZXIsIGN1cnJlbnQgYnVmZmVyXG4gIHByZWZpeDogU3RyaW5nLCBjb21wbGV0aW9uIHByZWZpeFxuICBwb3NpdGlvbjogUG9pbnQsIGN1cnJlbnQgY3Vyc29yIHBvc2l0aW9uXG5cbiAgUmV0dXJuczogUHJvbWlzZShbbW9kdWxlXSlcbiAgbW9kdWxlOiBTdHJpbmcsIG1vZHVsZSBuYW1lXG4gICMjI1xuICBnZXRDb21wbGV0aW9uc0Zvck1vZHVsZTogKGJ1ZmZlciwgcHJlZml4LCBwb3NpdGlvbikgPT5cbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXCJCYWNrZW5kIGluYWN0aXZlXCIpIHVubGVzcyBAaXNBY3RpdmUoKVxuICAgIHJvb3REaXIgPSBAcHJvY2Vzcz8uZ2V0Um9vdERpcj8oYnVmZmVyKSA/IFV0aWwuZ2V0Um9vdERpcihidWZmZXIpXG4gICAgbSA9IEBtb2RMaXN0TWFwLmdldChyb290RGlyKVxuICAgIGlmIG0/XG4gICAgICBQcm9taXNlLnJlc29sdmUgKEZaLmZpbHRlciBtLCBwcmVmaXgpXG4gICAgZWxzZVxuICAgICAgQHByb2Nlc3MucnVuTGlzdChidWZmZXIpLnRoZW4gKG1vZHVsZXMpID0+XG4gICAgICAgIEBtb2RMaXN0TWFwLnNldCByb290RGlyLCBtb2R1bGVzXG4gICAgICAgICNyZWZyZXNoIGV2ZXJ5IG1pbnV0ZVxuICAgICAgICBzZXRUaW1lb3V0ICg9PiBAbW9kTGlzdE1hcC5kZWxldGUgcm9vdERpciksIDYwICogMTAwMFxuICAgICAgICBGWi5maWx0ZXIgbW9kdWxlcywgcHJlZml4XG5cbiAgIyMjXG4gIGdldENvbXBsZXRpb25zRm9yU3ltYm9sSW5Nb2R1bGUoYnVmZmVyLHByZWZpeCxwb3NpdGlvbix7bW9kdWxlfSlcbiAgVXNlZCBpbiBpbXBvcnQgaGlkaW5nL2xpc3QgY29tcGxldGlvbnNcblxuICBidWZmZXI6IFRleHRCdWZmZXIsIGN1cnJlbnQgYnVmZmVyXG4gIHByZWZpeDogU3RyaW5nLCBjb21wbGV0aW9uIHByZWZpeFxuICBwb3NpdGlvbjogUG9pbnQsIGN1cnJlbnQgY3Vyc29yIHBvc2l0aW9uXG4gIG1vZHVsZTogU3RyaW5nLCBtb2R1bGUgbmFtZSAob3B0aW9uYWwpLiBJZiB1bmRlZmluZWQsIGZ1bmN0aW9uXG4gICAgICAgICAgd2lsbCBhdHRlbXB0IHRvIGluZmVyIG1vZHVsZSBuYW1lIGZyb20gcG9zaXRpb24gYW5kIGJ1ZmZlci5cblxuICBSZXR1cm5zOiBQcm9taXNlKFtzeW1ib2xdKVxuICBzeW1ib2w6IE9iamVjdCwgc3ltYm9sIGluIGdpdmVuIG1vZHVsZVxuICAgIG5hbWU6IFN0cmluZywgc3ltYm9sIG5hbWVcbiAgICB0eXBlU2lnbmF0dXJlOiBTdHJpbmcsIHR5cGUgc2lnbmF0dXJlXG4gICAgc3ltYm9sVHlwZTogU3RyaW5nLCBvbmUgb2YgWyd0eXBlJywgJ2NsYXNzJywgJ2Z1bmN0aW9uJ11cbiAgIyMjXG4gIGdldENvbXBsZXRpb25zRm9yU3ltYm9sSW5Nb2R1bGU6IChidWZmZXIsIHByZWZpeCwgcG9zaXRpb24sIG9wdHMpID0+XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFwiQmFja2VuZCBpbmFjdGl2ZVwiKSB1bmxlc3MgQGlzQWN0aXZlKClcbiAgICBtb2R1bGVOYW1lID0gb3B0cz8ubW9kdWxlXG4gICAgdW5sZXNzIG1vZHVsZU5hbWU/XG4gICAgICBsaW5lUmFuZ2UgPSBuZXcgUmFuZ2UgWzAsIHBvc2l0aW9uLnJvd10sIHBvc2l0aW9uXG4gICAgICBidWZmZXIuYmFja3dhcmRzU2NhbkluUmFuZ2UgL15pbXBvcnRcXHMrKFtcXHcuXSspLyxcbiAgICAgICAgbGluZVJhbmdlLCAoe21hdGNofSkgLT5cbiAgICAgICAgICBtb2R1bGVOYW1lID0gbWF0Y2hbMV1cblxuICAgIHtidWZmZXJJbmZvfSA9IEBnZXRCdWZmZXJJbmZvIHtidWZmZXJ9XG4gICAgQGdldE1vZHVsZUluZm9cbiAgICAgIGJ1ZmZlckluZm86IGJ1ZmZlckluZm9cbiAgICAgIG1vZHVsZU5hbWU6IG1vZHVsZU5hbWVcbiAgICAudGhlbiAoe21vZHVsZUluZm99KSAtPlxuICAgICAgc3ltYm9scyA9IG1vZHVsZUluZm8uc2VsZWN0XG4gICAgICAgIHF1YWxpZmllZDogZmFsc2VcbiAgICAgICAgc2tpcFF1YWxpZmllZDogdHJ1ZVxuICAgICAgICBoaWRpbmc6IGZhbHNlXG4gICAgICAgIG5hbWU6IG1vZHVsZU5hbWVcbiAgICAgIEZaLmZpbHRlciBzeW1ib2xzLCBwcmVmaXgsIGtleTogJ25hbWUnXG5cbiAgIyMjXG4gIGdldENvbXBsZXRpb25zRm9yTGFuZ3VhZ2VQcmFnbWFzKGJ1ZmZlcixwcmVmaXgscG9zaXRpb24pXG4gIGJ1ZmZlcjogVGV4dEJ1ZmZlciwgY3VycmVudCBidWZmZXJcbiAgcHJlZml4OiBTdHJpbmcsIGNvbXBsZXRpb24gcHJlZml4XG4gIHBvc2l0aW9uOiBQb2ludCwgY3VycmVudCBjdXJzb3IgcG9zaXRpb25cblxuICBSZXR1cm5zOiBQcm9taXNlKFtwcmFnbWFdKVxuICBwcmFnbWE6IFN0cmluZywgbGFuZ3VhZ2Ugb3B0aW9uXG4gICMjI1xuICBnZXRDb21wbGV0aW9uc0Zvckxhbmd1YWdlUHJhZ21hczogKGJ1ZmZlciwgcHJlZml4LCBwb3NpdGlvbikgPT5cbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXCJCYWNrZW5kIGluYWN0aXZlXCIpIHVubGVzcyBAaXNBY3RpdmUoKVxuXG4gICAgZGlyID0gQHByb2Nlc3M/LmdldFJvb3REaXI/KGJ1ZmZlcikgPyBVdGlsLmdldFJvb3REaXIoYnVmZmVyKVxuXG4gICAgcCA9XG4gICAgICBpZiBAbGFuZ3VhZ2VQcmFnbWFzLmhhcyhkaXIpXG4gICAgICAgIEBsYW5ndWFnZVByYWdtYXMuZ2V0KGRpcilcbiAgICAgIGVsc2VcbiAgICAgICAgcHJvbWlzZSA9IEBwcm9jZXNzLnJ1bkxhbmcoZGlyKVxuICAgICAgICBAbGFuZ3VhZ2VQcmFnbWFzLnNldChkaXIsIHByb21pc2UpXG4gICAgICAgIHByb21pc2VcbiAgICBwLnRoZW4gKHByYWdtYXMpIC0+XG4gICAgICBGWi5maWx0ZXIgcHJhZ21hcywgcHJlZml4XG5cbiAgIyMjXG4gIGdldENvbXBsZXRpb25zRm9yQ29tcGlsZXJPcHRpb25zKGJ1ZmZlcixwcmVmaXgscG9zaXRpb24pXG4gIGJ1ZmZlcjogVGV4dEJ1ZmZlciwgY3VycmVudCBidWZmZXJcbiAgcHJlZml4OiBTdHJpbmcsIGNvbXBsZXRpb24gcHJlZml4XG4gIHBvc2l0aW9uOiBQb2ludCwgY3VycmVudCBjdXJzb3IgcG9zaXRpb25cblxuICBSZXR1cm5zOiBQcm9taXNlKFtnaGNvcHRdKVxuICBnaGNvcHQ6IFN0cmluZywgY29tcGlsZXIgb3B0aW9uIChzdGFydHMgd2l0aCAnLWYnKVxuICAjIyNcbiAgZ2V0Q29tcGxldGlvbnNGb3JDb21waWxlck9wdGlvbnM6IChidWZmZXIsIHByZWZpeCwgcG9zaXRpb24pID0+XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFwiQmFja2VuZCBpbmFjdGl2ZVwiKSB1bmxlc3MgQGlzQWN0aXZlKClcblxuICAgIGRpciA9IEBwcm9jZXNzPy5nZXRSb290RGlyPyhidWZmZXIpID8gVXRpbC5nZXRSb290RGlyKGJ1ZmZlcilcblxuICAgIHAgPVxuICAgICAgaWYgQGNvbXBpbGVyT3B0aW9ucy5oYXMoZGlyKVxuICAgICAgICBAY29tcGlsZXJPcHRpb25zLmdldChkaXIpXG4gICAgICBlbHNlXG4gICAgICAgIHByb21pc2UgPSBAcHJvY2Vzcy5ydW5GbGFnKGRpcilcbiAgICAgICAgQGNvbXBpbGVyT3B0aW9ucy5zZXQoZGlyLCBwcm9taXNlKVxuICAgICAgICBwcm9taXNlXG4gICAgcC50aGVuIChvcHRpb25zKSAtPlxuICAgICAgRlouZmlsdGVyIG9wdGlvbnMsIHByZWZpeFxuXG4gICMjI1xuICBnZXRDb21wbGV0aW9uc0ZvckhvbGUoYnVmZmVyLHByZWZpeCxwb3NpdGlvbilcbiAgR2V0IGNvbXBsZXRpb25zIGJhc2VkIG9uIGV4cHJlc3Npb24gdHlwZS5cbiAgSXQgaXMgYXNzdW1lZCB0aGF0IGBwcmVmaXhgIHN0YXJ0cyB3aXRoICdfJ1xuXG4gIGJ1ZmZlcjogVGV4dEJ1ZmZlciwgY3VycmVudCBidWZmZXJcbiAgcHJlZml4OiBTdHJpbmcsIGNvbXBsZXRpb24gcHJlZml4XG4gIHBvc2l0aW9uOiBQb2ludCwgY3VycmVudCBjdXJzb3IgcG9zaXRpb25cblxuICBSZXR1cm5zOiBQcm9taXNlKFtzeW1ib2xdKVxuICBzeW1ib2w6IFNhbWUgYXMgZ2V0Q29tcGxldGlvbnNGb3JTeW1ib2xcbiAgIyMjXG4gIGdldENvbXBsZXRpb25zRm9ySG9sZTogKGJ1ZmZlciwgcHJlZml4LCBwb3NpdGlvbikgPT5cbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXCJCYWNrZW5kIGluYWN0aXZlXCIpIHVubGVzcyBAaXNBY3RpdmUoKVxuICAgIHBvc2l0aW9uID0gUmFuZ2UuZnJvbVBvaW50V2l0aERlbHRhKHBvc2l0aW9uLCAwLCAwKSBpZiBwb3NpdGlvbj9cbiAgICBwcmVmaXggPSBwcmVmaXguc2xpY2UgMSBpZiBwcmVmaXguc3RhcnRzV2l0aCAnXydcbiAgICBAcHJvY2Vzcy5nZXRUeXBlSW5CdWZmZXIoYnVmZmVyLCBwb3NpdGlvbikudGhlbiAoe3R5cGV9KSA9PlxuICAgICAgQGdldFN5bWJvbHNGb3JCdWZmZXIoYnVmZmVyKS50aGVuIChzeW1ib2xzKSAtPlxuICAgICAgICB0cyA9IHN5bWJvbHMuZmlsdGVyIChzKSAtPlxuICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3Mgcy50eXBlU2lnbmF0dXJlP1xuICAgICAgICAgIHRsID0gcy50eXBlU2lnbmF0dXJlLnNwbGl0KCcgLT4gJykuc2xpY2UoLTEpWzBdXG4gICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIHRsLm1hdGNoKC9eW2Etel0kLylcbiAgICAgICAgICB0cyA9IHRsLnJlcGxhY2UoL1suPyorXiRbXFxdXFxcXCgpe318LV0vZywgXCJcXFxcJCZcIilcbiAgICAgICAgICByeCA9IFJlZ0V4cCB0cy5yZXBsYWNlKC9cXGJbYS16XVxcYi9nLCAnLisnKSwgJydcbiAgICAgICAgICByeC50ZXN0KHR5cGUpXG4gICAgICAgIGlmIHByZWZpeC5sZW5ndGggaXMgMFxuICAgICAgICAgIHRzLnNvcnQgKGEsIGIpIC0+XG4gICAgICAgICAgICBGWi5zY29yZShiLnR5cGVTaWduYXR1cmUsIHR5cGUpIC0gRlouc2NvcmUoYS50eXBlU2lnbmF0dXJlLCB0eXBlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgRlouZmlsdGVyIHRzLCBwcmVmaXgsIGtleTogJ3FuYW1lJ1xuIl19

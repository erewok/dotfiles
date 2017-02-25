(function() {
  var CompositeDisposable, Directory, Emitter, GhcModiProcess, GhcModiProcessReal, Point, Queue, Range, Util, _, extname, ref, unlitSync,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice;

  ref = require('atom'), Range = ref.Range, Point = ref.Point, Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable, Directory = ref.Directory;

  Util = require('../util');

  extname = require('path').extname;

  Queue = require('promise-queue');

  unlitSync = require('atom-haskell-utils').unlitSync;

  _ = require('underscore-plus');

  GhcModiProcessReal = require('./ghc-modi-process-real.coffee');

  _ = require('underscore-plus');

  module.exports = GhcModiProcess = (function() {
    GhcModiProcess.prototype.backend = null;

    GhcModiProcess.prototype.commandQueues = null;

    function GhcModiProcess() {
      this.doCheckAndLint = bind(this.doCheckAndLint, this);
      this.doLintBuffer = bind(this.doLintBuffer, this);
      this.doCheckBuffer = bind(this.doCheckBuffer, this);
      this.doCheckOrLintBuffer = bind(this.doCheckOrLintBuffer, this);
      this.findSymbolProvidersInBuffer = bind(this.findSymbolProvidersInBuffer, this);
      this.getInfoInBuffer = bind(this.getInfoInBuffer, this);
      this.doSigFill = bind(this.doSigFill, this);
      this.doCaseSplit = bind(this.doCaseSplit, this);
      this.getTypeInBuffer = bind(this.getTypeInBuffer, this);
      this.runBrowse = bind(this.runBrowse, this);
      this.runFlag = bind(this.runFlag, this);
      this.runLang = bind(this.runLang, this);
      this.runList = bind(this.runList, this);
      this.queueCmd = bind(this.queueCmd, this);
      this.onQueueIdle = bind(this.onQueueIdle, this);
      this.onBackendIdle = bind(this.onBackendIdle, this);
      this.onBackendActive = bind(this.onBackendActive, this);
      this.onDidDestroy = bind(this.onDidDestroy, this);
      this.destroy = bind(this.destroy, this);
      this.killProcess = bind(this.killProcess, this);
      this.createQueues = bind(this.createQueues, this);
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.emitter = new Emitter);
      this.bufferDirMap = new WeakMap;
      this.backend = new Map;
      if ((process.env.GHC_PACKAGE_PATH != null) && !atom.config.get('haskell-ghc-mod.suppressGhcPackagePathWarning')) {
        atom.notifications.addWarning("haskell-ghc-mod: You have GHC_PACKAGE_PATH environment variable set!", {
          dismissable: true,
          detail: "This configuration is not supported, and can break arbitrarily. You can try to band-aid it by adding\n \ndelete process.env.GHC_PACKAGE_PATH\n \nto your Atom init script (Edit → Init Script...)\n \nYou can suppress this warning in haskell-ghc-mod settings."
        });
      }
      this.createQueues();
    }

    GhcModiProcess.prototype.getRootDir = function(buffer) {
      var dir;
      dir = this.bufferDirMap.get(buffer);
      if (dir != null) {
        return dir;
      }
      dir = Util.getRootDir(buffer);
      this.bufferDirMap.set(buffer, dir);
      return dir;
    };

    GhcModiProcess.prototype.initBackend = function(rootDir) {
      var backend, procopts, rootPath, vers;
      rootPath = rootDir.getPath();
      if (this.backend.has(rootPath)) {
        return this.backend.get(rootPath);
      }
      procopts = Util.getProcessOptions(rootPath);
      vers = procopts.then((function(_this) {
        return function(opts) {
          return _this.getVersion(opts);
        };
      })(this));
      vers.then((function(_this) {
        return function(v) {
          return procopts.then(function(opts) {
            return _this.checkComp(opts, v);
          });
        };
      })(this));
      backend = vers.then(this.getCaps).then((function(_this) {
        return function(caps1) {
          _this.caps = caps1;
          return procopts.then(function(opts) {
            return new GhcModiProcessReal(_this.caps, rootDir, opts);
          });
        };
      })(this))["catch"](function(err) {
        atom.notifications.addFatalError("Haskell-ghc-mod: ghc-mod failed to launch. It is probably missing or misconfigured. " + err.code, {
          detail: err + "\nPATH: " + process.env.PATH + "\npath: " + process.env.path + "\nPath: " + process.env.Path,
          stack: err.stack,
          dismissable: true
        });
        return null;
      });
      this.backend.set(rootPath, backend);
      return backend;
    };

    GhcModiProcess.prototype.createQueues = function() {
      this.commandQueues = {
        checklint: new Queue(2),
        browse: null,
        typeinfo: new Queue(1),
        find: new Queue(1),
        init: new Queue(4),
        list: new Queue(1),
        lowmem: new Queue(1)
      };
      return this.disposables.add(atom.config.observe('haskell-ghc-mod.maxBrowseProcesses', (function(_this) {
        return function(value) {
          return _this.commandQueues.browse = new Queue(value);
        };
      })(this)));
    };

    GhcModiProcess.prototype.getVersion = function(opts) {
      var cmd, timeout;
      timeout = atom.config.get('haskell-ghc-mod.initTimeout') * 1000;
      cmd = atom.config.get('haskell-ghc-mod.ghcModPath');
      return Util.execPromise(cmd, ['version'], _.extend({
        timeout: timeout
      }, opts)).then(function(stdout) {
        var comp, vers;
        vers = /^ghc-mod version (\d+)\.(\d+)\.(\d+)(?:\.(\d+))?/.exec(stdout).slice(1, 5).map(function(i) {
          return parseInt(i);
        });
        comp = /GHC (.+)$/.exec(stdout.trim())[1];
        Util.debug("Ghc-mod " + vers + " built with " + comp);
        return {
          vers: vers,
          comp: comp
        };
      });
    };

    GhcModiProcess.prototype.checkComp = function(opts, arg) {
      var comp, pathghc, stackghc, timeout;
      comp = arg.comp;
      timeout = atom.config.get('haskell-ghc-mod.initTimeout') * 1000;
      stackghc = Util.execPromise('stack', ['ghc', '--', '--numeric-version'], _.extend({
        timeout: timeout
      }, opts)).then(function(stdout) {
        return stdout.trim();
      })["catch"](function(error) {
        Util.warn(error);
        return null;
      });
      pathghc = Util.execPromise('ghc', ['--numeric-version'], _.extend({
        timeout: timeout
      }, opts)).then(function(stdout) {
        return stdout.trim();
      })["catch"](function(error) {
        Util.warn(error);
        return null;
      });
      return Promise.all([stackghc, pathghc]).then(function(arg1) {
        var pathghc, stackghc, warn;
        stackghc = arg1[0], pathghc = arg1[1];
        Util.debug("Stack GHC version " + stackghc);
        Util.debug("Path GHC version " + pathghc);
        if ((stackghc != null) && stackghc !== comp) {
          warn = "GHC version in your Stack '" + stackghc + "' doesn't match with GHC version used to build ghc-mod '" + comp + "'. This can lead to problems when using Stack projects";
          atom.notifications.addWarning(warn);
          Util.warn(warn);
        }
        if ((pathghc != null) && pathghc !== comp) {
          warn = "GHC version in your PATH '" + pathghc + "' doesn't match with GHC version used to build ghc-mod '" + comp + "'. This can lead to problems when using Cabal or Plain projects";
          atom.notifications.addWarning(warn);
          return Util.warn(warn);
        }
      });
    };

    GhcModiProcess.prototype.getCaps = function(arg) {
      var atLeast, caps, exact, vers;
      vers = arg.vers;
      caps = {
        version: vers,
        fileMap: false,
        quoteArgs: false,
        optparse: false,
        typeConstraints: false,
        browseParents: false,
        interactiveCaseSplit: false,
        importedFrom: false
      };
      atLeast = function(b) {
        var i, j, len, v;
        for (i = j = 0, len = b.length; j < len; i = ++j) {
          v = b[i];
          if (vers[i] > v) {
            return true;
          } else if (vers[i] < v) {
            return false;
          }
        }
        return true;
      };
      exact = function(b) {
        var i, j, len, v;
        for (i = j = 0, len = b.length; j < len; i = ++j) {
          v = b[i];
          if (vers[i] !== v) {
            return false;
          }
        }
        return true;
      };
      if (!atLeast([5, 4])) {
        atom.notifications.addError("Haskell-ghc-mod: ghc-mod < 5.4 is not supported. Use at your own risk or update your ghc-mod installation", {
          dismissable: true
        });
      }
      if (exact([5, 4])) {
        atom.notifications.addWarning("Haskell-ghc-mod: ghc-mod 5.4.* is deprecated. Use at your own risk or update your ghc-mod installation", {
          dismissable: true
        });
      }
      if (atLeast([5, 4])) {
        caps.fileMap = true;
      }
      if (atLeast([5, 5])) {
        caps.quoteArgs = true;
        caps.optparse = true;
      }
      if (atLeast([5, 6])) {
        caps.typeConstraints = true;
        caps.browseParents = true;
        caps.interactiveCaseSplit = true;
      }
      if (atLeast([5, 7]) || atom.config.get('haskell-ghc-mod.experimental')) {
        caps.importedFrom = true;
      }
      Util.debug(JSON.stringify(caps));
      return caps;
    };

    GhcModiProcess.prototype.killProcess = function() {
      this.backend.forEach(function(v) {
        return v.then(function(backend) {
          return backend != null ? typeof backend.killProcess === "function" ? backend.killProcess() : void 0 : void 0;
        });
      });
      return this.backend.clear();
    };

    GhcModiProcess.prototype.destroy = function() {
      this.backend.forEach(function(v) {
        return v.then(function(backend) {
          return backend != null ? typeof backend.destroy === "function" ? backend.destroy() : void 0 : void 0;
        });
      });
      this.backend.clear();
      this.emitter.emit('did-destroy');
      this.disposables.dispose();
      this.commandQueues = null;
      return this.backend = null;
    };

    GhcModiProcess.prototype.onDidDestroy = function(callback) {
      return this.emitter.on('did-destroy', callback);
    };

    GhcModiProcess.prototype.onBackendActive = function(callback) {
      return this.emitter.on('backend-active', callback);
    };

    GhcModiProcess.prototype.onBackendIdle = function(callback) {
      return this.emitter.on('backend-idle', callback);
    };

    GhcModiProcess.prototype.onQueueIdle = function(callback) {
      return this.emitter.on('queue-idle', callback);
    };

    GhcModiProcess.prototype.queueCmd = function(queueName, runArgs, backend) {
      var promise, qe;
      if (!((runArgs.buffer != null) || (runArgs.dir != null))) {
        throw new Error("Neither dir nor buffer is set in queueCmd invocation");
      }
      if (atom.config.get('haskell-ghc-mod.lowMemorySystem')) {
        queueName = 'lowmem';
      }
      if (runArgs.buffer != null) {
        if (runArgs.dir == null) {
          runArgs.dir = this.getRootDir(runArgs.buffer);
        }
      }
      if (backend == null) {
        return this.initBackend(runArgs.dir).then((function(_this) {
          return function(backend) {
            if (backend != null) {
              return _this.queueCmd(queueName, runArgs, backend);
            } else {
              return [];
            }
          };
        })(this));
      }
      qe = (function(_this) {
        return function(qn) {
          var q;
          q = _this.commandQueues[qn];
          return q.getQueueLength() + q.getPendingLength() === 0;
        };
      })(this);
      promise = this.commandQueues[queueName].add((function(_this) {
        return function() {
          var globalSettings, localSettings, rd;
          _this.emitter.emit('backend-active');
          rd = runArgs.dir || Util.getRootDir(runArgs.options.cwd);
          localSettings = new Promise(function(resolve, reject) {
            var file;
            file = rd.getFile('.haskell-ghc-mod.json');
            return file.exists().then(function(ex) {
              if (ex) {
                return file.read().then(function(contents) {
                  var err;
                  try {
                    return resolve(JSON.parse(contents));
                  } catch (error1) {
                    err = error1;
                    atom.notifications.addError('Failed to parse .haskell-ghc-mod.json', {
                      detail: err,
                      dismissable: true
                    });
                    return reject(err);
                  }
                });
              } else {
                return reject();
              }
            });
          })["catch"](function(error) {
            if (error != null) {
              Util.warn(error);
            }
            return {};
          });
          globalSettings = new Promise(function(resolve, reject) {
            var configDir, file;
            configDir = new Directory(atom.getConfigDirPath());
            file = configDir.getFile('haskell-ghc-mod.json');
            return file.exists().then(function(ex) {
              if (ex) {
                return file.read().then(function(contents) {
                  var err;
                  try {
                    return resolve(JSON.parse(contents));
                  } catch (error1) {
                    err = error1;
                    atom.notifications.addError('Failed to parse haskell-ghc-mod.json', {
                      detail: err,
                      dismissable: true
                    });
                    return reject(err);
                  }
                });
              } else {
                return reject();
              }
            });
          })["catch"](function(error) {
            if (error != null) {
              Util.warn(error);
            }
            return {};
          });
          return Promise.all([globalSettings, localSettings]).then(function(arg) {
            var glob, loc;
            glob = arg[0], loc = arg[1];
            return _.extend(glob, loc);
          }).then(function(settings) {
            if (settings.disable) {
              throw new Error("Ghc-mod disabled in settings");
            }
            runArgs.suppressErrors = settings.suppressErrors;
            runArgs.ghcOptions = settings.ghcOptions;
            return runArgs.ghcModOptions = settings.ghcModOptions;
          }).then(function() {
            return backend.run(runArgs);
          })["catch"](function(err) {
            Util.warn(err);
            return [];
          });
        };
      })(this));
      promise.then((function(_this) {
        return function(res) {
          var k;
          if (qe(queueName)) {
            _this.emitter.emit('queue-idle', {
              queue: queueName
            });
            if (((function() {
              var results;
              results = [];
              for (k in this.commandQueues) {
                results.push(k);
              }
              return results;
            }).call(_this)).every(qe)) {
              return _this.emitter.emit('backend-idle');
            }
          }
        };
      })(this));
      return promise;
    };

    GhcModiProcess.prototype.runList = function(buffer) {
      return this.queueCmd('list', {
        buffer: buffer,
        command: 'list'
      });
    };

    GhcModiProcess.prototype.runLang = function(dir) {
      return this.queueCmd('init', {
        command: 'lang',
        dir: dir
      });
    };

    GhcModiProcess.prototype.runFlag = function(dir) {
      return this.queueCmd('init', {
        command: 'flag',
        dir: dir
      });
    };

    GhcModiProcess.prototype.runBrowse = function(rootDir, modules) {
      return this.queueCmd('browse', {
        dir: rootDir,
        command: 'browse',
        dashArgs: function(caps) {
          var args;
          args = ['-d'];
          if (caps.browseParents) {
            args.push('-p');
          }
          return args;
        },
        args: modules
      }).then((function(_this) {
        return function(lines) {
          return lines.map(function(s) {
            var name, parent, ref1, ref2, symbolType, typeSignature;
            ref1 = s.split(' :: '), name = ref1[0], typeSignature = 2 <= ref1.length ? slice.call(ref1, 1) : [];
            typeSignature = typeSignature.join(' :: ').trim();
            if (_this.caps.browseParents) {
              ref2 = typeSignature.split(' -- from:').map(function(v) {
                return v.trim();
              }), typeSignature = ref2[0], parent = ref2[1];
            }
            name = name.trim();
            if (/^(?:type|data|newtype)/.test(typeSignature)) {
              symbolType = 'type';
            } else if (/^(?:class)/.test(typeSignature)) {
              symbolType = 'class';
            } else {
              symbolType = 'function';
            }
            return {
              name: name,
              typeSignature: typeSignature,
              symbolType: symbolType,
              parent: parent
            };
          });
        };
      })(this));
    };

    GhcModiProcess.prototype.getTypeInBuffer = function(buffer, crange) {
      if (buffer.getUri() == null) {
        return Promise.resolve(null);
      }
      crange = Util.tabShiftForRange(buffer, crange);
      return this.queueCmd('typeinfo', {
        interactive: true,
        buffer: buffer,
        command: 'type',
        uri: buffer.getUri(),
        text: buffer.isModified() ? buffer.getText() : void 0,
        dashArgs: function(caps) {
          var args;
          args = [];
          if (caps.typeConstraints) {
            args.push('-c');
          }
          return args;
        },
        args: [crange.start.row + 1, crange.start.column + 1]
      }).then(function(lines) {
        var range, ref1, type;
        ref1 = lines.reduce((function(acc, line) {
          var colend, colstart, line_, myrange, ref1, rowend, rowstart, rx, text, type;
          if (acc !== '') {
            return acc;
          }
          rx = /^(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+"([^]*)"$/;
          ref1 = line.match(rx), line_ = ref1[0], rowstart = ref1[1], colstart = ref1[2], rowend = ref1[3], colend = ref1[4], text = ref1[5];
          type = text.replace(/\\"/g, '"');
          myrange = Range.fromObject([[parseInt(rowstart) - 1, parseInt(colstart) - 1], [parseInt(rowend) - 1, parseInt(colend) - 1]]);
          if (myrange.isEmpty()) {
            return acc;
          }
          if (!myrange.containsRange(crange)) {
            return acc;
          }
          myrange = Util.tabUnshiftForRange(buffer, myrange);
          return [myrange, type];
        }), ''), range = ref1[0], type = ref1[1];
        if (!range) {
          range = crange;
        }
        if (type) {
          return {
            range: range,
            type: type
          };
        } else {
          throw new Error("No type");
        }
      });
    };

    GhcModiProcess.prototype.doCaseSplit = function(buffer, crange) {
      var ref1, ref2;
      if (buffer.getUri() == null) {
        return Promise.resolve([]);
      }
      crange = Util.tabShiftForRange(buffer, crange);
      return this.queueCmd('typeinfo', {
        interactive: (ref1 = (ref2 = this.caps) != null ? ref2.interactiveCaseSplit : void 0) != null ? ref1 : false,
        buffer: buffer,
        command: 'split',
        uri: buffer.getUri(),
        text: buffer.isModified() ? buffer.getText() : void 0,
        args: [crange.start.row + 1, crange.start.column + 1]
      }).then(function(lines) {
        var rx;
        rx = /^(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+"([^]*)"$/;
        return lines.filter(function(line) {
          if (line.match(rx) == null) {
            Util.warn("ghc-mod says: " + line);
            return false;
          }
          return true;
        }).map(function(line) {
          var colend, colstart, line_, ref1, rowend, rowstart, text;
          ref1 = line.match(rx), line_ = ref1[0], rowstart = ref1[1], colstart = ref1[2], rowend = ref1[3], colend = ref1[4], text = ref1[5];
          return {
            range: Range.fromObject([[parseInt(rowstart) - 1, parseInt(colstart) - 1], [parseInt(rowend) - 1, parseInt(colend) - 1]]),
            replacement: text
          };
        });
      });
    };

    GhcModiProcess.prototype.doSigFill = function(buffer, crange) {
      var ref1, ref2;
      if (buffer.getUri() == null) {
        return Promise.resolve([]);
      }
      crange = Util.tabShiftForRange(buffer, crange);
      return this.queueCmd('typeinfo', {
        interactive: (ref1 = (ref2 = this.caps) != null ? ref2.interactiveCaseSplit : void 0) != null ? ref1 : false,
        buffer: buffer,
        command: 'sig',
        uri: buffer.getUri(),
        text: buffer.isModified() ? buffer.getText() : void 0,
        args: [crange.start.row + 1, crange.start.column + 1]
      }).then(function(lines) {
        var colend, colstart, line_, range, ref1, rowend, rowstart, rx;
        if (lines[0] == null) {
          return [];
        }
        rx = /^(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/;
        ref1 = lines[1].match(rx), line_ = ref1[0], rowstart = ref1[1], colstart = ref1[2], rowend = ref1[3], colend = ref1[4];
        range = Range.fromObject([[parseInt(rowstart) - 1, parseInt(colstart) - 1], [parseInt(rowend) - 1, parseInt(colend) - 1]]);
        return [
          {
            type: lines[0],
            range: range,
            body: lines.slice(2).join('\n')
          }
        ];
      });
    };

    GhcModiProcess.prototype.getInfoInBuffer = function(editor, crange) {
      var buffer, range, ref1, symbol;
      buffer = editor.getBuffer();
      if (buffer.getUri() == null) {
        return Promise.resolve(null);
      }
      ref1 = Util.getSymbolInRange(editor, crange), symbol = ref1.symbol, range = ref1.range;
      return this.queueCmd('typeinfo', {
        interactive: true,
        buffer: buffer,
        command: 'info',
        uri: buffer.getUri(),
        text: buffer.isModified() ? buffer.getText() : void 0,
        args: [symbol]
      }).then(function(lines) {
        var info;
        info = lines.join('\n');
        if (info === 'Cannot show info' || !info) {
          throw new Error("No info");
        } else {
          return {
            range: range,
            info: info
          };
        }
      });
    };

    GhcModiProcess.prototype.findSymbolProvidersInBuffer = function(editor, crange) {
      var buffer, symbol;
      buffer = editor.getBuffer();
      symbol = Util.getSymbolInRange(editor, crange).symbol;
      return this.queueCmd('find', {
        interactive: true,
        buffer: buffer,
        command: 'find',
        args: [symbol]
      });
    };

    GhcModiProcess.prototype.doCheckOrLintBuffer = function(cmd, buffer, fast) {
      var args, line, m, mess, olduri, ref1, ref2, text, uri;
      if (buffer.isEmpty()) {
        return Promise.resolve([]);
      }
      if (buffer.getUri() == null) {
        return Promise.resolve([]);
      }
      olduri = uri = buffer.getUri();
      text = cmd === 'lint' && extname(uri) === '.lhs' ? (uri = uri.slice(0, -1), unlitSync(olduri, buffer.getText())) : buffer.isModified() ? buffer.getText() : void 0;
      if ((text != null ? text.error : void 0) != null) {
        ref1 = text.error.match(/^(.*?):([0-9]+): *(.*) *$/), m = ref1[0], uri = ref1[1], line = ref1[2], mess = ref1[3];
        return Promise.resolve([
          {
            uri: uri,
            position: new Point(line - 1, 0),
            message: mess,
            severity: 'lint'
          }
        ]);
      }
      if (cmd === 'lint') {
        args = (ref2 = []).concat.apply(ref2, atom.config.get('haskell-ghc-mod.hlintOptions').map(function(v) {
          return ['--hlintOpt', v];
        }));
      }
      return this.queueCmd('checklint', {
        interactive: fast,
        buffer: buffer,
        command: cmd,
        uri: uri,
        text: text,
        args: args
      }).then((function(_this) {
        return function(lines) {
          var rootDir, rx;
          rootDir = _this.getRootDir(buffer);
          rx = /^(.*?):([0-9\s]+):([0-9\s]+): *(?:(Warning|Error): *)?/;
          return lines.filter(function(line) {
            switch (false) {
              case !line.startsWith('Dummy:0:0:Error:'):
                atom.notifications.addError(line.slice(16));
                break;
              case !line.startsWith('Dummy:0:0:Warning:'):
                atom.notifications.addWarning(line.slice(18));
                break;
              case line.match(rx) == null:
                return true;
              case !(line.trim().length > 0):
                Util.warn("ghc-mod says: " + line);
            }
            return false;
          }).map(function(line) {
            var col, file, match, messPos, ref3, row, severity, warning;
            match = line.match(rx);
            m = match[0], file = match[1], row = match[2], col = match[3], warning = match[4];
            if (uri.endsWith(file)) {
              file = olduri;
            }
            severity = cmd === 'lint' ? 'lint' : warning === 'Warning' ? 'warning' : 'error';
            messPos = new Point(row - 1, col - 1);
            messPos = Util.tabUnshiftForPoint(buffer, messPos);
            return {
              uri: (ref3 = ((function() {
                try {
                  return rootDir.getFile(rootDir.relativize(file)).getPath();
                } catch (error1) {}
              })())) != null ? ref3 : file,
              position: messPos,
              message: line.replace(m, ''),
              severity: severity
            };
          });
        };
      })(this));
    };

    GhcModiProcess.prototype.doCheckBuffer = function(buffer, fast) {
      return this.doCheckOrLintBuffer("check", buffer, fast);
    };

    GhcModiProcess.prototype.doLintBuffer = function(buffer, fast) {
      return this.doCheckOrLintBuffer("lint", buffer, fast);
    };

    GhcModiProcess.prototype.doCheckAndLint = function(buffer, fast) {
      return Promise.all([this.doCheckBuffer(buffer, fast), this.doLintBuffer(buffer, fast)]).then(function(resArr) {
        var ref1;
        return (ref1 = []).concat.apply(ref1, resArr);
      });
    };

    return GhcModiProcess;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL2doYy1tb2QvZ2hjLW1vZGktcHJvY2Vzcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGtJQUFBO0lBQUE7OztFQUFBLE1BQTBELE9BQUEsQ0FBUSxNQUFSLENBQTFELEVBQUMsaUJBQUQsRUFBUSxpQkFBUixFQUFlLHFCQUFmLEVBQXdCLDZDQUF4QixFQUE2Qzs7RUFDN0MsSUFBQSxHQUFPLE9BQUEsQ0FBUSxTQUFSOztFQUNOLFVBQVcsT0FBQSxDQUFRLE1BQVI7O0VBQ1osS0FBQSxHQUFRLE9BQUEsQ0FBUSxlQUFSOztFQUNQLFlBQWEsT0FBQSxDQUFRLG9CQUFSOztFQUNkLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBRUosa0JBQUEsR0FBcUIsT0FBQSxDQUFRLGdDQUFSOztFQUNyQixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUVKLE1BQU0sQ0FBQyxPQUFQLEdBQ007NkJBQ0osT0FBQSxHQUFTOzs2QkFDVCxhQUFBLEdBQWU7O0lBRUYsd0JBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7TUFDWCxJQUFDLENBQUEsV0FBRCxHQUFlLElBQUk7TUFDbkIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSSxPQUFoQztNQUNBLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUk7TUFDcEIsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO01BRWYsSUFBRyxzQ0FBQSxJQUFrQyxDQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiwrQ0FBaEIsQ0FBekM7UUFDRSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQW5CLENBQThCLHNFQUE5QixFQUdFO1VBQUEsV0FBQSxFQUFhLElBQWI7VUFDQSxNQUFBLEVBQVEsa1FBRFI7U0FI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LENBQUMsTUFBSCxhQUFVLE1BQVY7TUFBWixDQUROO0lBRGM7Ozs7O0FBaGdCbEIiLCJzb3VyY2VzQ29udGVudCI6WyJ7UmFuZ2UsIFBvaW50LCBFbWl0dGVyLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXJlY3Rvcnl9ID0gcmVxdWlyZSAnYXRvbSdcblV0aWwgPSByZXF1aXJlICcuLi91dGlsJ1xue2V4dG5hbWV9ID0gcmVxdWlyZSgncGF0aCcpXG5RdWV1ZSA9IHJlcXVpcmUgJ3Byb21pc2UtcXVldWUnXG57dW5saXRTeW5jfSA9IHJlcXVpcmUgJ2F0b20taGFza2VsbC11dGlscydcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5cbkdoY01vZGlQcm9jZXNzUmVhbCA9IHJlcXVpcmUgJy4vZ2hjLW1vZGktcHJvY2Vzcy1yZWFsLmNvZmZlZSdcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEdoY01vZGlQcm9jZXNzXG4gIGJhY2tlbmQ6IG51bGxcbiAgY29tbWFuZFF1ZXVlczogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQGJ1ZmZlckRpck1hcCA9IG5ldyBXZWFrTWFwICNUZXh0QnVmZmVyIC0+IERpcmVjdG9yeVxuICAgIEBiYWNrZW5kID0gbmV3IE1hcCAjIEZpbGVQYXRoIC0+IEJhY2tlbmRcblxuICAgIGlmIHByb2Nlc3MuZW52LkdIQ19QQUNLQUdFX1BBVEg/IGFuZCBub3QgYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWdoYy1tb2Quc3VwcHJlc3NHaGNQYWNrYWdlUGF0aFdhcm5pbmcnKVxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcgXCJcIlwiXG4gICAgICAgIGhhc2tlbGwtZ2hjLW1vZDogWW91IGhhdmUgR0hDX1BBQ0tBR0VfUEFUSCBlbnZpcm9ubWVudCB2YXJpYWJsZSBzZXQhXG4gICAgICAgIFwiXCJcIixcbiAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgZGV0YWlsOiBcIlwiXCJcbiAgICAgICAgICBUaGlzIGNvbmZpZ3VyYXRpb24gaXMgbm90IHN1cHBvcnRlZCwgYW5kIGNhbiBicmVhayBhcmJpdHJhcmlseS4gWW91IGNhbiB0cnkgdG8gYmFuZC1haWQgaXQgYnkgYWRkaW5nXG4gICAgICAgICAgwqBcbiAgICAgICAgICBkZWxldGUgcHJvY2Vzcy5lbnYuR0hDX1BBQ0tBR0VfUEFUSFxuICAgICAgICAgIMKgXG4gICAgICAgICAgdG8geW91ciBBdG9tIGluaXQgc2NyaXB0IChFZGl0IOKGkiBJbml0IFNjcmlwdC4uLilcbiAgICAgICAgICDCoFxuICAgICAgICAgIFlvdSBjYW4gc3VwcHJlc3MgdGhpcyB3YXJuaW5nIGluIGhhc2tlbGwtZ2hjLW1vZCBzZXR0aW5ncy5cbiAgICAgICAgICBcIlwiXCJcblxuICAgIEBjcmVhdGVRdWV1ZXMoKVxuXG4gIGdldFJvb3REaXI6IChidWZmZXIpIC0+XG4gICAgZGlyID0gQGJ1ZmZlckRpck1hcC5nZXQgYnVmZmVyXG4gICAgaWYgZGlyP1xuICAgICAgcmV0dXJuIGRpclxuICAgIGRpciA9IFV0aWwuZ2V0Um9vdERpciBidWZmZXJcbiAgICBAYnVmZmVyRGlyTWFwLnNldCBidWZmZXIsIGRpclxuICAgIGRpclxuXG4gIGluaXRCYWNrZW5kOiAocm9vdERpcikgLT5cbiAgICByb290UGF0aCA9IHJvb3REaXIuZ2V0UGF0aCgpXG4gICAgcmV0dXJuIEBiYWNrZW5kLmdldChyb290UGF0aCkgaWYgQGJhY2tlbmQuaGFzKHJvb3RQYXRoKVxuICAgIHByb2NvcHRzID0gVXRpbC5nZXRQcm9jZXNzT3B0aW9ucyhyb290UGF0aClcbiAgICB2ZXJzID0gcHJvY29wdHMudGhlbiAob3B0cykgPT4gQGdldFZlcnNpb24ob3B0cylcbiAgICB2ZXJzLnRoZW4gKHYpID0+IHByb2NvcHRzLnRoZW4gKG9wdHMpID0+IEBjaGVja0NvbXAob3B0cywgdilcblxuICAgIGJhY2tlbmQgPVxuICAgICAgdmVyc1xuICAgICAgLnRoZW4gQGdldENhcHNcbiAgICAgIC50aGVuIChAY2FwcykgPT5cbiAgICAgICAgcHJvY29wdHMudGhlbiAob3B0cykgPT5cbiAgICAgICAgICBuZXcgR2hjTW9kaVByb2Nlc3NSZWFsIEBjYXBzLCByb290RGlyLCBvcHRzXG4gICAgICAuY2F0Y2ggKGVycikgLT5cbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEZhdGFsRXJyb3IgXCJcbiAgICAgICAgICBIYXNrZWxsLWdoYy1tb2Q6IGdoYy1tb2QgZmFpbGVkIHRvIGxhdW5jaC5cbiAgICAgICAgICBJdCBpcyBwcm9iYWJseSBtaXNzaW5nIG9yIG1pc2NvbmZpZ3VyZWQuICN7ZXJyLmNvZGV9XCIsXG4gICAgICAgICAgZGV0YWlsOiBcIlwiXCJcbiAgICAgICAgICAgICN7ZXJyfVxuICAgICAgICAgICAgUEFUSDogI3twcm9jZXNzLmVudi5QQVRIfVxuICAgICAgICAgICAgcGF0aDogI3twcm9jZXNzLmVudi5wYXRofVxuICAgICAgICAgICAgUGF0aDogI3twcm9jZXNzLmVudi5QYXRofVxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgc3RhY2s6IGVyci5zdGFja1xuICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgIG51bGxcbiAgICBAYmFja2VuZC5zZXQocm9vdFBhdGgsIGJhY2tlbmQpXG4gICAgcmV0dXJuIGJhY2tlbmRcblxuICBjcmVhdGVRdWV1ZXM6ID0+XG4gICAgQGNvbW1hbmRRdWV1ZXMgPVxuICAgICAgY2hlY2tsaW50OiBuZXcgUXVldWUoMilcbiAgICAgIGJyb3dzZTogbnVsbFxuICAgICAgdHlwZWluZm86IG5ldyBRdWV1ZSgxKVxuICAgICAgZmluZDogbmV3IFF1ZXVlKDEpXG4gICAgICBpbml0OiBuZXcgUXVldWUoNClcbiAgICAgIGxpc3Q6IG5ldyBRdWV1ZSgxKVxuICAgICAgbG93bWVtOiBuZXcgUXVldWUoMSlcbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ2hhc2tlbGwtZ2hjLW1vZC5tYXhCcm93c2VQcm9jZXNzZXMnLCAodmFsdWUpID0+XG4gICAgICBAY29tbWFuZFF1ZXVlcy5icm93c2UgPSBuZXcgUXVldWUodmFsdWUpXG5cbiAgZ2V0VmVyc2lvbjogKG9wdHMpIC0+XG4gICAgdGltZW91dCA9IGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1naGMtbW9kLmluaXRUaW1lb3V0JykgKiAxMDAwXG4gICAgY21kID0gYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWdoYy1tb2QuZ2hjTW9kUGF0aCcpXG4gICAgVXRpbC5leGVjUHJvbWlzZSBjbWQsIFsndmVyc2lvbiddLCBfLmV4dGVuZCh7dGltZW91dH0sIG9wdHMpXG4gICAgLnRoZW4gKHN0ZG91dCkgLT5cbiAgICAgIHZlcnMgPSAvXmdoYy1tb2QgdmVyc2lvbiAoXFxkKylcXC4oXFxkKylcXC4oXFxkKykoPzpcXC4oXFxkKykpPy8uZXhlYyhzdGRvdXQpLnNsaWNlKDEsIDUpLm1hcCAoaSkgLT4gcGFyc2VJbnQgaVxuICAgICAgY29tcCA9IC9HSEMgKC4rKSQvLmV4ZWMoc3Rkb3V0LnRyaW0oKSlbMV1cbiAgICAgIFV0aWwuZGVidWcgXCJHaGMtbW9kICN7dmVyc30gYnVpbHQgd2l0aCAje2NvbXB9XCJcbiAgICAgIHJldHVybiB7dmVycywgY29tcH1cblxuICBjaGVja0NvbXA6IChvcHRzLCB7Y29tcH0pIC0+XG4gICAgdGltZW91dCA9IGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1naGMtbW9kLmluaXRUaW1lb3V0JykgKiAxMDAwXG4gICAgc3RhY2tnaGMgPVxuICAgICAgVXRpbC5leGVjUHJvbWlzZSAnc3RhY2snLCBbJ2doYycsICctLScsICctLW51bWVyaWMtdmVyc2lvbiddLCBfLmV4dGVuZCh7dGltZW91dH0sIG9wdHMpXG4gICAgICAudGhlbiAoc3Rkb3V0KSAtPiBzdGRvdXQudHJpbSgpXG4gICAgICAuY2F0Y2ggKGVycm9yKSAtPlxuICAgICAgICBVdGlsLndhcm4gZXJyb3JcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICBwYXRoZ2hjID1cbiAgICAgIFV0aWwuZXhlY1Byb21pc2UgJ2doYycsIFsnLS1udW1lcmljLXZlcnNpb24nXSwgXy5leHRlbmQoe3RpbWVvdXR9LCBvcHRzKVxuICAgICAgLnRoZW4gKHN0ZG91dCkgLT4gc3Rkb3V0LnRyaW0oKVxuICAgICAgLmNhdGNoIChlcnJvcikgLT5cbiAgICAgICAgVXRpbC53YXJuIGVycm9yXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgUHJvbWlzZS5hbGwgW3N0YWNrZ2hjLCBwYXRoZ2hjXVxuICAgIC50aGVuIChbc3RhY2tnaGMsIHBhdGhnaGNdKSAtPlxuICAgICAgVXRpbC5kZWJ1ZyBcIlN0YWNrIEdIQyB2ZXJzaW9uICN7c3RhY2tnaGN9XCJcbiAgICAgIFV0aWwuZGVidWcgXCJQYXRoIEdIQyB2ZXJzaW9uICN7cGF0aGdoY31cIlxuICAgICAgaWYgc3RhY2tnaGM/IGFuZCBzdGFja2doYyBpc250IGNvbXBcbiAgICAgICAgd2FybiA9IFwiXG4gICAgICAgICAgR0hDIHZlcnNpb24gaW4geW91ciBTdGFjayAnI3tzdGFja2doY30nIGRvZXNuJ3QgbWF0Y2ggd2l0aFxuICAgICAgICAgIEdIQyB2ZXJzaW9uIHVzZWQgdG8gYnVpbGQgZ2hjLW1vZCAnI3tjb21wfScuIFRoaXMgY2FuIGxlYWQgdG9cbiAgICAgICAgICBwcm9ibGVtcyB3aGVuIHVzaW5nIFN0YWNrIHByb2plY3RzXCJcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcgd2FyblxuICAgICAgICBVdGlsLndhcm4gd2FyblxuICAgICAgaWYgcGF0aGdoYz8gYW5kIHBhdGhnaGMgaXNudCBjb21wXG4gICAgICAgIHdhcm4gPSBcIlxuICAgICAgICAgIEdIQyB2ZXJzaW9uIGluIHlvdXIgUEFUSCAnI3twYXRoZ2hjfScgZG9lc24ndCBtYXRjaCB3aXRoXG4gICAgICAgICAgR0hDIHZlcnNpb24gdXNlZCB0byBidWlsZCBnaGMtbW9kICcje2NvbXB9Jy4gVGhpcyBjYW4gbGVhZCB0b1xuICAgICAgICAgIHByb2JsZW1zIHdoZW4gdXNpbmcgQ2FiYWwgb3IgUGxhaW4gcHJvamVjdHNcIlxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyB3YXJuXG4gICAgICAgIFV0aWwud2FybiB3YXJuXG5cbiAgZ2V0Q2FwczogKHt2ZXJzfSkgLT5cbiAgICBjYXBzID1cbiAgICAgIHZlcnNpb246IHZlcnNcbiAgICAgIGZpbGVNYXA6IGZhbHNlXG4gICAgICBxdW90ZUFyZ3M6IGZhbHNlXG4gICAgICBvcHRwYXJzZTogZmFsc2VcbiAgICAgIHR5cGVDb25zdHJhaW50czogZmFsc2VcbiAgICAgIGJyb3dzZVBhcmVudHM6IGZhbHNlXG4gICAgICBpbnRlcmFjdGl2ZUNhc2VTcGxpdDogZmFsc2VcbiAgICAgIGltcG9ydGVkRnJvbTogZmFsc2VcblxuICAgIGF0TGVhc3QgPSAoYikgLT5cbiAgICAgIGZvciB2LCBpIGluIGJcbiAgICAgICAgaWYgdmVyc1tpXSA+IHZcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlIGlmIHZlcnNbaV0gPCB2XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgZXhhY3QgPSAoYikgLT5cbiAgICAgIGZvciB2LCBpIGluIGJcbiAgICAgICAgaWYgdmVyc1tpXSBpc250IHZcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIHJldHVybiB0cnVlXG5cbiAgICBpZiBub3QgYXRMZWFzdCBbNSwgNF1cbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBcIlxuICAgICAgICBIYXNrZWxsLWdoYy1tb2Q6IGdoYy1tb2QgPCA1LjQgaXMgbm90IHN1cHBvcnRlZC5cbiAgICAgICAgVXNlIGF0IHlvdXIgb3duIHJpc2sgb3IgdXBkYXRlIHlvdXIgZ2hjLW1vZCBpbnN0YWxsYXRpb25cIixcbiAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICBpZiBleGFjdCBbNSwgNF1cbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nIFwiXG4gICAgICAgIEhhc2tlbGwtZ2hjLW1vZDogZ2hjLW1vZCA1LjQuKiBpcyBkZXByZWNhdGVkLlxuICAgICAgICBVc2UgYXQgeW91ciBvd24gcmlzayBvciB1cGRhdGUgeW91ciBnaGMtbW9kIGluc3RhbGxhdGlvblwiLFxuICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgIGlmIGF0TGVhc3QgWzUsIDRdXG4gICAgICBjYXBzLmZpbGVNYXAgPSB0cnVlXG4gICAgaWYgYXRMZWFzdCBbNSwgNV1cbiAgICAgIGNhcHMucXVvdGVBcmdzID0gdHJ1ZVxuICAgICAgY2Fwcy5vcHRwYXJzZSA9IHRydWVcbiAgICBpZiBhdExlYXN0KFs1LCA2XSlcbiAgICAgIGNhcHMudHlwZUNvbnN0cmFpbnRzID0gdHJ1ZVxuICAgICAgY2Fwcy5icm93c2VQYXJlbnRzID0gdHJ1ZVxuICAgICAgY2Fwcy5pbnRlcmFjdGl2ZUNhc2VTcGxpdCA9IHRydWVcbiAgICBpZiBhdExlYXN0KFs1LCA3XSkgb3IgYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWdoYy1tb2QuZXhwZXJpbWVudGFsJylcbiAgICAgIGNhcHMuaW1wb3J0ZWRGcm9tID0gdHJ1ZVxuICAgIFV0aWwuZGVidWcgSlNPTi5zdHJpbmdpZnkoY2FwcylcbiAgICByZXR1cm4gY2Fwc1xuXG4gIGtpbGxQcm9jZXNzOiA9PlxuICAgIEBiYWNrZW5kLmZvckVhY2ggKHYpIC0+XG4gICAgICB2LnRoZW4gKGJhY2tlbmQpIC0+IGJhY2tlbmQ/LmtpbGxQcm9jZXNzPygpXG4gICAgQGJhY2tlbmQuY2xlYXIoKVxuXG4gICMgVGVhciBkb3duIGFueSBzdGF0ZSBhbmQgZGV0YWNoXG4gIGRlc3Ryb3k6ID0+XG4gICAgQGJhY2tlbmQuZm9yRWFjaCAodikgLT5cbiAgICAgIHYudGhlbiAoYmFja2VuZCkgLT4gYmFja2VuZD8uZGVzdHJveT8oKVxuICAgIEBiYWNrZW5kLmNsZWFyKClcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtZGVzdHJveSdcbiAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gICAgQGNvbW1hbmRRdWV1ZXMgPSBudWxsXG4gICAgQGJhY2tlbmQgPSBudWxsXG5cbiAgb25EaWREZXN0cm95OiAoY2FsbGJhY2spID0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1kZXN0cm95JywgY2FsbGJhY2tcblxuICBvbkJhY2tlbmRBY3RpdmU6IChjYWxsYmFjaykgPT5cbiAgICBAZW1pdHRlci5vbiAnYmFja2VuZC1hY3RpdmUnLCBjYWxsYmFja1xuXG4gIG9uQmFja2VuZElkbGU6IChjYWxsYmFjaykgPT5cbiAgICBAZW1pdHRlci5vbiAnYmFja2VuZC1pZGxlJywgY2FsbGJhY2tcblxuICBvblF1ZXVlSWRsZTogKGNhbGxiYWNrKSA9PlxuICAgIEBlbWl0dGVyLm9uICdxdWV1ZS1pZGxlJywgY2FsbGJhY2tcblxuICBxdWV1ZUNtZDogKHF1ZXVlTmFtZSwgcnVuQXJncywgYmFja2VuZCkgPT5cbiAgICB1bmxlc3MgcnVuQXJncy5idWZmZXI/IG9yIHJ1bkFyZ3MuZGlyP1xuICAgICAgdGhyb3cgbmV3IEVycm9yIChcIk5laXRoZXIgZGlyIG5vciBidWZmZXIgaXMgc2V0IGluIHF1ZXVlQ21kIGludm9jYXRpb25cIilcbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZ2hjLW1vZC5sb3dNZW1vcnlTeXN0ZW0nKVxuICAgICAgcXVldWVOYW1lID0gJ2xvd21lbSdcbiAgICBydW5BcmdzLmRpciA/PSBAZ2V0Um9vdERpcihydW5BcmdzLmJ1ZmZlcikgaWYgcnVuQXJncy5idWZmZXI/XG4gICAgdW5sZXNzIGJhY2tlbmQ/XG4gICAgICByZXR1cm4gQGluaXRCYWNrZW5kKHJ1bkFyZ3MuZGlyKS50aGVuIChiYWNrZW5kKSA9PlxuICAgICAgICBpZiBiYWNrZW5kP1xuICAgICAgICAgIEBxdWV1ZUNtZChxdWV1ZU5hbWUsIHJ1bkFyZ3MsIGJhY2tlbmQpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBbXVxuICAgIHFlID0gKHFuKSA9PlxuICAgICAgcSA9IEBjb21tYW5kUXVldWVzW3FuXVxuICAgICAgcS5nZXRRdWV1ZUxlbmd0aCgpICsgcS5nZXRQZW5kaW5nTGVuZ3RoKCkgaXMgMFxuICAgIHByb21pc2UgPSBAY29tbWFuZFF1ZXVlc1txdWV1ZU5hbWVdLmFkZCA9PlxuICAgICAgQGVtaXR0ZXIuZW1pdCAnYmFja2VuZC1hY3RpdmUnXG4gICAgICByZCA9IHJ1bkFyZ3MuZGlyIG9yIFV0aWwuZ2V0Um9vdERpcihydW5BcmdzLm9wdGlvbnMuY3dkKVxuICAgICAgbG9jYWxTZXR0aW5ncyA9IG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgICAgIGZpbGUgPSByZC5nZXRGaWxlKCcuaGFza2VsbC1naGMtbW9kLmpzb24nKVxuICAgICAgICBmaWxlLmV4aXN0cygpXG4gICAgICAgIC50aGVuIChleCkgLT5cbiAgICAgICAgICBpZiBleFxuICAgICAgICAgICAgZmlsZS5yZWFkKCkudGhlbiAoY29udGVudHMpIC0+XG4gICAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICAgIHJlc29sdmUgSlNPTi5wYXJzZShjb250ZW50cylcbiAgICAgICAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yICdGYWlsZWQgdG8gcGFyc2UgLmhhc2tlbGwtZ2hjLW1vZC5qc29uJyxcbiAgICAgICAgICAgICAgICAgIGRldGFpbDogZXJyXG4gICAgICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgICAgICAgICAgIHJlamVjdCBlcnJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZWplY3QoKVxuICAgICAgLmNhdGNoIChlcnJvcikgLT5cbiAgICAgICAgVXRpbC53YXJuIGVycm9yIGlmIGVycm9yP1xuICAgICAgICByZXR1cm4ge31cbiAgICAgIGdsb2JhbFNldHRpbmdzID0gbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICAgICAgY29uZmlnRGlyID0gbmV3IERpcmVjdG9yeShhdG9tLmdldENvbmZpZ0RpclBhdGgoKSlcbiAgICAgICAgZmlsZSA9IGNvbmZpZ0Rpci5nZXRGaWxlKCdoYXNrZWxsLWdoYy1tb2QuanNvbicpXG4gICAgICAgIGZpbGUuZXhpc3RzKClcbiAgICAgICAgLnRoZW4gKGV4KSAtPlxuICAgICAgICAgIGlmIGV4XG4gICAgICAgICAgICBmaWxlLnJlYWQoKS50aGVuIChjb250ZW50cykgLT5cbiAgICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSBKU09OLnBhcnNlKGNvbnRlbnRzKVxuICAgICAgICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgJ0ZhaWxlZCB0byBwYXJzZSBoYXNrZWxsLWdoYy1tb2QuanNvbicsXG4gICAgICAgICAgICAgICAgICBkZXRhaWw6IGVyclxuICAgICAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICAgICAgICByZWplY3QgZXJyXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVqZWN0KClcbiAgICAgIC5jYXRjaCAoZXJyb3IpIC0+XG4gICAgICAgIFV0aWwud2FybiBlcnJvciBpZiBlcnJvcj9cbiAgICAgICAgcmV0dXJuIHt9XG4gICAgICBQcm9taXNlLmFsbCBbZ2xvYmFsU2V0dGluZ3MsIGxvY2FsU2V0dGluZ3NdXG4gICAgICAudGhlbiAoW2dsb2IsIGxvY10pIC0+XG4gICAgICAgIF8uZXh0ZW5kKGdsb2IsIGxvYylcbiAgICAgIC50aGVuIChzZXR0aW5ncykgLT5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2hjLW1vZCBkaXNhYmxlZCBpbiBzZXR0aW5nc1wiKSBpZiBzZXR0aW5ncy5kaXNhYmxlXG4gICAgICAgIHJ1bkFyZ3Muc3VwcHJlc3NFcnJvcnMgPSBzZXR0aW5ncy5zdXBwcmVzc0Vycm9yc1xuICAgICAgICBydW5BcmdzLmdoY09wdGlvbnMgPSBzZXR0aW5ncy5naGNPcHRpb25zXG4gICAgICAgIHJ1bkFyZ3MuZ2hjTW9kT3B0aW9ucyA9IHNldHRpbmdzLmdoY01vZE9wdGlvbnNcbiAgICAgIC50aGVuIC0+XG4gICAgICAgIGJhY2tlbmQucnVuIHJ1bkFyZ3NcbiAgICAgIC5jYXRjaCAoZXJyKSAtPlxuICAgICAgICBVdGlsLndhcm4gZXJyXG4gICAgICAgIHJldHVybiBbXVxuICAgIHByb21pc2UudGhlbiAocmVzKSA9PlxuICAgICAgaWYgcWUocXVldWVOYW1lKVxuICAgICAgICBAZW1pdHRlci5lbWl0ICdxdWV1ZS1pZGxlJywge3F1ZXVlOiBxdWV1ZU5hbWV9XG4gICAgICAgIGlmIChrIGZvciBrIG9mIEBjb21tYW5kUXVldWVzKS5ldmVyeShxZSlcbiAgICAgICAgICBAZW1pdHRlci5lbWl0ICdiYWNrZW5kLWlkbGUnXG4gICAgcmV0dXJuIHByb21pc2VcblxuICBydW5MaXN0OiAoYnVmZmVyKSA9PlxuICAgIEBxdWV1ZUNtZCAnbGlzdCcsXG4gICAgICBidWZmZXI6IGJ1ZmZlclxuICAgICAgY29tbWFuZDogJ2xpc3QnXG5cbiAgcnVuTGFuZzogKGRpcikgPT5cbiAgICBAcXVldWVDbWQgJ2luaXQnLFxuICAgICAgY29tbWFuZDogJ2xhbmcnXG4gICAgICBkaXI6IGRpclxuXG4gIHJ1bkZsYWc6IChkaXIpID0+XG4gICAgQHF1ZXVlQ21kICdpbml0JyxcbiAgICAgIGNvbW1hbmQ6ICdmbGFnJ1xuICAgICAgZGlyOiBkaXJcblxuICBydW5Ccm93c2U6IChyb290RGlyLCBtb2R1bGVzKSA9PlxuICAgIEBxdWV1ZUNtZCAnYnJvd3NlJyxcbiAgICAgIGRpcjogcm9vdERpclxuICAgICAgY29tbWFuZDogJ2Jyb3dzZSdcbiAgICAgIGRhc2hBcmdzOiAoY2FwcykgLT5cbiAgICAgICAgYXJncyA9IFsnLWQnXVxuICAgICAgICBhcmdzLnB1c2ggJy1wJyBpZiBjYXBzLmJyb3dzZVBhcmVudHNcbiAgICAgICAgYXJnc1xuICAgICAgYXJnczogbW9kdWxlc1xuICAgIC50aGVuIChsaW5lcykgPT5cbiAgICAgIGxpbmVzLm1hcCAocykgPT5cbiAgICAgICAgW25hbWUsIHR5cGVTaWduYXR1cmUuLi5dID0gcy5zcGxpdCgnIDo6ICcpXG4gICAgICAgIHR5cGVTaWduYXR1cmUgPSB0eXBlU2lnbmF0dXJlLmpvaW4oJyA6OiAnKS50cmltKClcbiAgICAgICAgaWYgQGNhcHMuYnJvd3NlUGFyZW50c1xuICAgICAgICAgIFt0eXBlU2lnbmF0dXJlLCBwYXJlbnRdID0gdHlwZVNpZ25hdHVyZS5zcGxpdCgnIC0tIGZyb206JykubWFwICh2KSAtPiB2LnRyaW0oKVxuICAgICAgICBuYW1lID0gbmFtZS50cmltKClcbiAgICAgICAgaWYgL14oPzp0eXBlfGRhdGF8bmV3dHlwZSkvLnRlc3QodHlwZVNpZ25hdHVyZSlcbiAgICAgICAgICBzeW1ib2xUeXBlID0gJ3R5cGUnXG4gICAgICAgIGVsc2UgaWYgL14oPzpjbGFzcykvLnRlc3QodHlwZVNpZ25hdHVyZSlcbiAgICAgICAgICBzeW1ib2xUeXBlID0gJ2NsYXNzJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgc3ltYm9sVHlwZSA9ICdmdW5jdGlvbidcbiAgICAgICAge25hbWUsIHR5cGVTaWduYXR1cmUsIHN5bWJvbFR5cGUsIHBhcmVudH1cblxuICBnZXRUeXBlSW5CdWZmZXI6IChidWZmZXIsIGNyYW5nZSkgPT5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlIG51bGwgdW5sZXNzIGJ1ZmZlci5nZXRVcmkoKT9cbiAgICBjcmFuZ2UgPSBVdGlsLnRhYlNoaWZ0Rm9yUmFuZ2UoYnVmZmVyLCBjcmFuZ2UpXG4gICAgQHF1ZXVlQ21kICd0eXBlaW5mbycsXG4gICAgICBpbnRlcmFjdGl2ZTogdHJ1ZVxuICAgICAgYnVmZmVyOiBidWZmZXJcbiAgICAgIGNvbW1hbmQ6ICd0eXBlJyxcbiAgICAgIHVyaTogYnVmZmVyLmdldFVyaSgpXG4gICAgICB0ZXh0OiBidWZmZXIuZ2V0VGV4dCgpIGlmIGJ1ZmZlci5pc01vZGlmaWVkKClcbiAgICAgIGRhc2hBcmdzOiAoY2FwcykgLT5cbiAgICAgICAgYXJncyA9IFtdXG4gICAgICAgIGFyZ3MucHVzaCAnLWMnIGlmIGNhcHMudHlwZUNvbnN0cmFpbnRzXG4gICAgICAgIGFyZ3NcbiAgICAgIGFyZ3M6IFtjcmFuZ2Uuc3RhcnQucm93ICsgMSwgY3JhbmdlLnN0YXJ0LmNvbHVtbiArIDFdXG4gICAgLnRoZW4gKGxpbmVzKSAtPlxuICAgICAgW3JhbmdlLCB0eXBlXSA9IGxpbmVzLnJlZHVjZSAoKGFjYywgbGluZSkgLT5cbiAgICAgICAgcmV0dXJuIGFjYyBpZiBhY2MgIT0gJydcbiAgICAgICAgcnggPSAvXihcXGQrKVxccysoXFxkKylcXHMrKFxcZCspXFxzKyhcXGQrKVxccytcIihbXl0qKVwiJC8gIyBbXl0gYmFzaWNhbGx5IG1lYW5zIFwiYW55dGhpbmdcIiwgaW5jbC4gbmV3bGluZXNcbiAgICAgICAgW2xpbmVfLCByb3dzdGFydCwgY29sc3RhcnQsIHJvd2VuZCwgY29sZW5kLCB0ZXh0XSA9IGxpbmUubWF0Y2gocngpXG4gICAgICAgIHR5cGUgPSB0ZXh0LnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICBteXJhbmdlID1cbiAgICAgICAgICBSYW5nZS5mcm9tT2JqZWN0IFtcbiAgICAgICAgICAgIFtwYXJzZUludChyb3dzdGFydCkgLSAxLCBwYXJzZUludChjb2xzdGFydCkgLSAxXSxcbiAgICAgICAgICAgIFtwYXJzZUludChyb3dlbmQpIC0gMSwgcGFyc2VJbnQoY29sZW5kKSAtIDFdXG4gICAgICAgICAgXVxuICAgICAgICByZXR1cm4gYWNjIGlmIG15cmFuZ2UuaXNFbXB0eSgpXG4gICAgICAgIHJldHVybiBhY2MgdW5sZXNzIG15cmFuZ2UuY29udGFpbnNSYW5nZShjcmFuZ2UpXG4gICAgICAgIG15cmFuZ2UgPSBVdGlsLnRhYlVuc2hpZnRGb3JSYW5nZShidWZmZXIsIG15cmFuZ2UpXG4gICAgICAgIHJldHVybiBbbXlyYW5nZSwgdHlwZV0pLFxuICAgICAgICAnJ1xuICAgICAgcmFuZ2UgPSBjcmFuZ2UgdW5sZXNzIHJhbmdlXG4gICAgICBpZiB0eXBlXG4gICAgICAgIHJldHVybiB7cmFuZ2UsIHR5cGV9XG4gICAgICBlbHNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIk5vIHR5cGVcIlxuXG4gIGRvQ2FzZVNwbGl0OiAoYnVmZmVyLCBjcmFuZ2UpID0+XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSBbXSB1bmxlc3MgYnVmZmVyLmdldFVyaSgpP1xuICAgIGNyYW5nZSA9IFV0aWwudGFiU2hpZnRGb3JSYW5nZShidWZmZXIsIGNyYW5nZSlcbiAgICBAcXVldWVDbWQgJ3R5cGVpbmZvJyxcbiAgICAgIGludGVyYWN0aXZlOiBAY2Fwcz8uaW50ZXJhY3RpdmVDYXNlU3BsaXQgPyBmYWxzZVxuICAgICAgYnVmZmVyOiBidWZmZXJcbiAgICAgIGNvbW1hbmQ6ICdzcGxpdCcsXG4gICAgICB1cmk6IGJ1ZmZlci5nZXRVcmkoKVxuICAgICAgdGV4dDogYnVmZmVyLmdldFRleHQoKSBpZiBidWZmZXIuaXNNb2RpZmllZCgpXG4gICAgICBhcmdzOiBbY3JhbmdlLnN0YXJ0LnJvdyArIDEsIGNyYW5nZS5zdGFydC5jb2x1bW4gKyAxXVxuICAgIC50aGVuIChsaW5lcykgLT5cbiAgICAgIHJ4ID0gL14oXFxkKylcXHMrKFxcZCspXFxzKyhcXGQrKVxccysoXFxkKylcXHMrXCIoW15dKilcIiQvICMgW15dIGJhc2ljYWxseSBtZWFucyBcImFueXRoaW5nXCIsIGluY2wuIG5ld2xpbmVzXG4gICAgICBsaW5lc1xuICAgICAgLmZpbHRlciAobGluZSkgLT5cbiAgICAgICAgdW5sZXNzIGxpbmUubWF0Y2gocngpP1xuICAgICAgICAgIFV0aWwud2FybiBcImdoYy1tb2Qgc2F5czogI3tsaW5lfVwiXG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICAubWFwIChsaW5lKSAtPlxuICAgICAgICBbbGluZV8sIHJvd3N0YXJ0LCBjb2xzdGFydCwgcm93ZW5kLCBjb2xlbmQsIHRleHRdID0gbGluZS5tYXRjaChyeClcbiAgICAgICAgcmFuZ2U6XG4gICAgICAgICAgUmFuZ2UuZnJvbU9iamVjdCBbXG4gICAgICAgICAgICBbcGFyc2VJbnQocm93c3RhcnQpIC0gMSwgcGFyc2VJbnQoY29sc3RhcnQpIC0gMV0sXG4gICAgICAgICAgICBbcGFyc2VJbnQocm93ZW5kKSAtIDEsIHBhcnNlSW50KGNvbGVuZCkgLSAxXVxuICAgICAgICAgIF1cbiAgICAgICAgcmVwbGFjZW1lbnQ6IHRleHRcblxuICBkb1NpZ0ZpbGw6IChidWZmZXIsIGNyYW5nZSkgPT5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlIFtdIHVubGVzcyBidWZmZXIuZ2V0VXJpKCk/XG4gICAgY3JhbmdlID0gVXRpbC50YWJTaGlmdEZvclJhbmdlKGJ1ZmZlciwgY3JhbmdlKVxuICAgIEBxdWV1ZUNtZCAndHlwZWluZm8nLFxuICAgICAgaW50ZXJhY3RpdmU6IEBjYXBzPy5pbnRlcmFjdGl2ZUNhc2VTcGxpdCA/IGZhbHNlXG4gICAgICBidWZmZXI6IGJ1ZmZlclxuICAgICAgY29tbWFuZDogJ3NpZycsXG4gICAgICB1cmk6IGJ1ZmZlci5nZXRVcmkoKVxuICAgICAgdGV4dDogYnVmZmVyLmdldFRleHQoKSBpZiBidWZmZXIuaXNNb2RpZmllZCgpXG4gICAgICBhcmdzOiBbY3JhbmdlLnN0YXJ0LnJvdyArIDEsIGNyYW5nZS5zdGFydC5jb2x1bW4gKyAxXVxuICAgIC50aGVuIChsaW5lcykgLT5cbiAgICAgIHJldHVybiBbXSB1bmxlc3MgbGluZXNbMF0/XG4gICAgICByeCA9IC9eKFxcZCspXFxzKyhcXGQrKVxccysoXFxkKylcXHMrKFxcZCspJC8gIyBwb3NpdGlvbiByeFxuICAgICAgW2xpbmVfLCByb3dzdGFydCwgY29sc3RhcnQsIHJvd2VuZCwgY29sZW5kXSA9IGxpbmVzWzFdLm1hdGNoKHJ4KVxuICAgICAgcmFuZ2UgPVxuICAgICAgICBSYW5nZS5mcm9tT2JqZWN0IFtcbiAgICAgICAgICBbcGFyc2VJbnQocm93c3RhcnQpIC0gMSwgcGFyc2VJbnQoY29sc3RhcnQpIC0gMV0sXG4gICAgICAgICAgW3BhcnNlSW50KHJvd2VuZCkgLSAxLCBwYXJzZUludChjb2xlbmQpIC0gMV1cbiAgICAgICAgXVxuICAgICAgcmV0dXJuIFtcbiAgICAgICAgdHlwZTogbGluZXNbMF1cbiAgICAgICAgcmFuZ2U6IHJhbmdlXG4gICAgICAgIGJvZHk6IGxpbmVzLnNsaWNlKDIpLmpvaW4oJ1xcbicpXG4gICAgICBdXG5cbiAgZ2V0SW5mb0luQnVmZmVyOiAoZWRpdG9yLCBjcmFuZ2UpID0+XG4gICAgYnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSBudWxsIHVubGVzcyBidWZmZXIuZ2V0VXJpKCk/XG4gICAge3N5bWJvbCwgcmFuZ2V9ID0gVXRpbC5nZXRTeW1ib2xJblJhbmdlKGVkaXRvciwgY3JhbmdlKVxuXG4gICAgQHF1ZXVlQ21kICd0eXBlaW5mbycsXG4gICAgICBpbnRlcmFjdGl2ZTogdHJ1ZVxuICAgICAgYnVmZmVyOiBidWZmZXJcbiAgICAgIGNvbW1hbmQ6ICdpbmZvJ1xuICAgICAgdXJpOiBidWZmZXIuZ2V0VXJpKClcbiAgICAgIHRleHQ6IGJ1ZmZlci5nZXRUZXh0KCkgaWYgYnVmZmVyLmlzTW9kaWZpZWQoKVxuICAgICAgYXJnczogW3N5bWJvbF1cbiAgICAudGhlbiAobGluZXMpIC0+XG4gICAgICBpbmZvID0gbGluZXMuam9pbignXFxuJylcbiAgICAgIGlmIGluZm8gaXMgJ0Nhbm5vdCBzaG93IGluZm8nIG9yIG5vdCBpbmZvXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIk5vIGluZm9cIlxuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4ge3JhbmdlLCBpbmZvfVxuXG4gIGZpbmRTeW1ib2xQcm92aWRlcnNJbkJ1ZmZlcjogKGVkaXRvciwgY3JhbmdlKSA9PlxuICAgIGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKVxuICAgIHtzeW1ib2x9ID0gVXRpbC5nZXRTeW1ib2xJblJhbmdlKGVkaXRvciwgY3JhbmdlKVxuXG4gICAgQHF1ZXVlQ21kICdmaW5kJyxcbiAgICAgIGludGVyYWN0aXZlOiB0cnVlXG4gICAgICBidWZmZXI6IGJ1ZmZlclxuICAgICAgY29tbWFuZDogJ2ZpbmQnXG4gICAgICBhcmdzOiBbc3ltYm9sXVxuXG4gIGRvQ2hlY2tPckxpbnRCdWZmZXI6IChjbWQsIGJ1ZmZlciwgZmFzdCkgPT5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlIFtdIGlmIGJ1ZmZlci5pc0VtcHR5KClcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlIFtdIHVubGVzcyBidWZmZXIuZ2V0VXJpKCk/XG5cbiAgICAjIEEgZGlydHkgaGFjayB0byBtYWtlIGxpbnQgd29yayB3aXRoIGxoc1xuICAgIG9sZHVyaSA9IHVyaSA9IGJ1ZmZlci5nZXRVcmkoKVxuICAgIHRleHQgPVxuICAgICAgaWYgY21kIGlzICdsaW50JyBhbmQgZXh0bmFtZSh1cmkpIGlzICcubGhzJ1xuICAgICAgICB1cmkgPSB1cmkuc2xpY2UgMCwgLTFcbiAgICAgICAgdW5saXRTeW5jIG9sZHVyaSwgYnVmZmVyLmdldFRleHQoKVxuICAgICAgZWxzZSBpZiBidWZmZXIuaXNNb2RpZmllZCgpXG4gICAgICAgIGJ1ZmZlci5nZXRUZXh0KClcbiAgICBpZiB0ZXh0Py5lcnJvcj9cbiAgICAgICMgVE9ETzogUmVqZWN0XG4gICAgICBbbSwgdXJpLCBsaW5lLCBtZXNzXSA9IHRleHQuZXJyb3IubWF0Y2goL14oLio/KTooWzAtOV0rKTogKiguKikgKiQvKVxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSBbXG4gICAgICAgIHVyaTogdXJpXG4gICAgICAgIHBvc2l0aW9uOiBuZXcgUG9pbnQobGluZSAtIDEsIDApXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NcbiAgICAgICAgc2V2ZXJpdHk6ICdsaW50J1xuICAgICAgXVxuICAgICMgZW5kIG9mIGRpcnR5IGhhY2tcblxuICAgIGlmIGNtZCBpcyAnbGludCdcbiAgICAgIGFyZ3MgPSBbXS5jb25jYXQgYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWdoYy1tb2QuaGxpbnRPcHRpb25zJykubWFwKCh2KSAtPiBbJy0taGxpbnRPcHQnLCB2XSkuLi5cblxuICAgIEBxdWV1ZUNtZCAnY2hlY2tsaW50JyxcbiAgICAgIGludGVyYWN0aXZlOiBmYXN0XG4gICAgICBidWZmZXI6IGJ1ZmZlclxuICAgICAgY29tbWFuZDogY21kXG4gICAgICB1cmk6IHVyaVxuICAgICAgdGV4dDogdGV4dFxuICAgICAgYXJnczogYXJnc1xuICAgIC50aGVuIChsaW5lcykgPT5cbiAgICAgIHJvb3REaXIgPSBAZ2V0Um9vdERpciBidWZmZXJcbiAgICAgIHJ4ID0gL14oLio/KTooWzAtOVxcc10rKTooWzAtOVxcc10rKTogKig/OihXYXJuaW5nfEVycm9yKTogKik/L1xuICAgICAgbGluZXNcbiAgICAgIC5maWx0ZXIgKGxpbmUpIC0+XG4gICAgICAgIHN3aXRjaFxuICAgICAgICAgIHdoZW4gbGluZS5zdGFydHNXaXRoICdEdW1teTowOjA6RXJyb3I6J1xuICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIGxpbmUuc2xpY2UoMTYpXG4gICAgICAgICAgd2hlbiBsaW5lLnN0YXJ0c1dpdGggJ0R1bW15OjA6MDpXYXJuaW5nOidcbiAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nIGxpbmUuc2xpY2UoMTgpXG4gICAgICAgICAgd2hlbiBsaW5lLm1hdGNoKHJ4KT9cbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgd2hlbiBsaW5lLnRyaW0oKS5sZW5ndGggPiAwXG4gICAgICAgICAgICBVdGlsLndhcm4gXCJnaGMtbW9kIHNheXM6ICN7bGluZX1cIlxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIC5tYXAgKGxpbmUpIC0+XG4gICAgICAgIG1hdGNoID0gbGluZS5tYXRjaChyeClcbiAgICAgICAgW20sIGZpbGUsIHJvdywgY29sLCB3YXJuaW5nXSA9IG1hdGNoXG4gICAgICAgIGZpbGUgPSBvbGR1cmkgaWYgdXJpLmVuZHNXaXRoKGZpbGUpXG4gICAgICAgIHNldmVyaXR5ID1cbiAgICAgICAgICBpZiBjbWQgPT0gJ2xpbnQnXG4gICAgICAgICAgICAnbGludCdcbiAgICAgICAgICBlbHNlIGlmIHdhcm5pbmcgPT0gJ1dhcm5pbmcnXG4gICAgICAgICAgICAnd2FybmluZydcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAnZXJyb3InXG4gICAgICAgIG1lc3NQb3MgPSBuZXcgUG9pbnQocm93IC0gMSwgY29sIC0gMSlcbiAgICAgICAgbWVzc1BvcyA9IFV0aWwudGFiVW5zaGlmdEZvclBvaW50KGJ1ZmZlciwgbWVzc1BvcylcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHVyaTogKHRyeSByb290RGlyLmdldEZpbGUocm9vdERpci5yZWxhdGl2aXplKGZpbGUpKS5nZXRQYXRoKCkpID8gZmlsZVxuICAgICAgICAgIHBvc2l0aW9uOiBtZXNzUG9zXG4gICAgICAgICAgbWVzc2FnZTogbGluZS5yZXBsYWNlIG0sICcnXG4gICAgICAgICAgc2V2ZXJpdHk6IHNldmVyaXR5XG4gICAgICAgIH1cblxuICBkb0NoZWNrQnVmZmVyOiAoYnVmZmVyLCBmYXN0KSA9PlxuICAgIEBkb0NoZWNrT3JMaW50QnVmZmVyIFwiY2hlY2tcIiwgYnVmZmVyLCBmYXN0XG5cbiAgZG9MaW50QnVmZmVyOiAoYnVmZmVyLCBmYXN0KSA9PlxuICAgIEBkb0NoZWNrT3JMaW50QnVmZmVyIFwibGludFwiLCBidWZmZXIsIGZhc3RcblxuICBkb0NoZWNrQW5kTGludDogKGJ1ZmZlciwgZmFzdCkgPT5cbiAgICBQcm9taXNlLmFsbCBbIEBkb0NoZWNrQnVmZmVyKGJ1ZmZlciwgZmFzdCksIEBkb0xpbnRCdWZmZXIoYnVmZmVyLCBmYXN0KSBdXG4gICAgLnRoZW4gKHJlc0FycikgLT4gW10uY29uY2F0IHJlc0Fyci4uLlxuIl19

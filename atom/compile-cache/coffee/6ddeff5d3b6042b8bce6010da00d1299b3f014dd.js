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
      if (atom.config.get('haskell-ghc-mod.experimental')) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL2doYy1tb2QvZ2hjLW1vZGktcHJvY2Vzcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGtJQUFBO0lBQUE7OztFQUFBLE1BQTBELE9BQUEsQ0FBUSxNQUFSLENBQTFELEVBQUMsaUJBQUQsRUFBUSxpQkFBUixFQUFlLHFCQUFmLEVBQXdCLDZDQUF4QixFQUE2Qzs7RUFDN0MsSUFBQSxHQUFPLE9BQUEsQ0FBUSxTQUFSOztFQUNOLFVBQVcsT0FBQSxDQUFRLE1BQVI7O0VBQ1osS0FBQSxHQUFRLE9BQUEsQ0FBUSxlQUFSOztFQUNQLFlBQWEsT0FBQSxDQUFRLG9CQUFSOztFQUNkLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBRUosa0JBQUEsR0FBcUIsT0FBQSxDQUFRLGdDQUFSOztFQUNyQixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUVKLE1BQU0sQ0FBQyxPQUFQLEdBQ007NkJBQ0osT0FBQSxHQUFTOzs2QkFDVCxhQUFBLEdBQWU7O0lBRUYsd0JBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7TUFDWCxJQUFDLENBQUEsV0FBRCxHQUFlLElBQUk7TUFDbkIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSSxPQUFoQztNQUNBLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUk7TUFDcEIsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO01BRWYsSUFBRyxzQ0FBQSxJQUFrQyxDQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiwrQ0FBaEIsQ0FBekM7UUFDRSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQW5CLENBQThCLHNFQUE5QixFQUdFO1VBQUEsV0FBQSxFQUFhLElBQWI7VUFDQSxNQUFBLEVBQVEsa1FBRFI7U0FI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Iiwic291cmNlc0NvbnRlbnQiOlsie1JhbmdlLCBQb2ludCwgRW1pdHRlciwgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlyZWN0b3J5fSA9IHJlcXVpcmUgJ2F0b20nXG5VdGlsID0gcmVxdWlyZSAnLi4vdXRpbCdcbntleHRuYW1lfSA9IHJlcXVpcmUoJ3BhdGgnKVxuUXVldWUgPSByZXF1aXJlICdwcm9taXNlLXF1ZXVlJ1xue3VubGl0U3luY30gPSByZXF1aXJlICdhdG9tLWhhc2tlbGwtdXRpbHMnXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuXG5HaGNNb2RpUHJvY2Vzc1JlYWwgPSByZXF1aXJlICcuL2doYy1tb2RpLXByb2Nlc3MtcmVhbC5jb2ZmZWUnXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBHaGNNb2RpUHJvY2Vzc1xuICBiYWNrZW5kOiBudWxsXG4gIGNvbW1hbmRRdWV1ZXM6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuICAgIEBidWZmZXJEaXJNYXAgPSBuZXcgV2Vha01hcCAjVGV4dEJ1ZmZlciAtPiBEaXJlY3RvcnlcbiAgICBAYmFja2VuZCA9IG5ldyBNYXAgIyBGaWxlUGF0aCAtPiBCYWNrZW5kXG5cbiAgICBpZiBwcm9jZXNzLmVudi5HSENfUEFDS0FHRV9QQVRIPyBhbmQgbm90IGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1naGMtbW9kLnN1cHByZXNzR2hjUGFja2FnZVBhdGhXYXJuaW5nJylcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nIFwiXCJcIlxuICAgICAgICBoYXNrZWxsLWdoYy1tb2Q6IFlvdSBoYXZlIEdIQ19QQUNLQUdFX1BBVEggZW52aXJvbm1lbnQgdmFyaWFibGUgc2V0IVxuICAgICAgICBcIlwiXCIsXG4gICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgIGRldGFpbDogXCJcIlwiXG4gICAgICAgICAgVGhpcyBjb25maWd1cmF0aW9uIGlzIG5vdCBzdXBwb3J0ZWQsIGFuZCBjYW4gYnJlYWsgYXJiaXRyYXJpbHkuIFlvdSBjYW4gdHJ5IHRvIGJhbmQtYWlkIGl0IGJ5IGFkZGluZ1xuICAgICAgICAgIMKgXG4gICAgICAgICAgZGVsZXRlIHByb2Nlc3MuZW52LkdIQ19QQUNLQUdFX1BBVEhcbiAgICAgICAgICDCoFxuICAgICAgICAgIHRvIHlvdXIgQXRvbSBpbml0IHNjcmlwdCAoRWRpdCDihpIgSW5pdCBTY3JpcHQuLi4pXG4gICAgICAgICAgwqBcbiAgICAgICAgICBZb3UgY2FuIHN1cHByZXNzIHRoaXMgd2FybmluZyBpbiBoYXNrZWxsLWdoYy1tb2Qgc2V0dGluZ3MuXG4gICAgICAgICAgXCJcIlwiXG5cbiAgICBAY3JlYXRlUXVldWVzKClcblxuICBnZXRSb290RGlyOiAoYnVmZmVyKSAtPlxuICAgIGRpciA9IEBidWZmZXJEaXJNYXAuZ2V0IGJ1ZmZlclxuICAgIGlmIGRpcj9cbiAgICAgIHJldHVybiBkaXJcbiAgICBkaXIgPSBVdGlsLmdldFJvb3REaXIgYnVmZmVyXG4gICAgQGJ1ZmZlckRpck1hcC5zZXQgYnVmZmVyLCBkaXJcbiAgICBkaXJcblxuICBpbml0QmFja2VuZDogKHJvb3REaXIpIC0+XG4gICAgcm9vdFBhdGggPSByb290RGlyLmdldFBhdGgoKVxuICAgIHJldHVybiBAYmFja2VuZC5nZXQocm9vdFBhdGgpIGlmIEBiYWNrZW5kLmhhcyhyb290UGF0aClcbiAgICBwcm9jb3B0cyA9IFV0aWwuZ2V0UHJvY2Vzc09wdGlvbnMocm9vdFBhdGgpXG4gICAgdmVycyA9IHByb2NvcHRzLnRoZW4gKG9wdHMpID0+IEBnZXRWZXJzaW9uKG9wdHMpXG4gICAgdmVycy50aGVuICh2KSA9PiBwcm9jb3B0cy50aGVuIChvcHRzKSA9PiBAY2hlY2tDb21wKG9wdHMsIHYpXG5cbiAgICBiYWNrZW5kID1cbiAgICAgIHZlcnNcbiAgICAgIC50aGVuIEBnZXRDYXBzXG4gICAgICAudGhlbiAoQGNhcHMpID0+XG4gICAgICAgIHByb2NvcHRzLnRoZW4gKG9wdHMpID0+XG4gICAgICAgICAgbmV3IEdoY01vZGlQcm9jZXNzUmVhbCBAY2Fwcywgcm9vdERpciwgb3B0c1xuICAgICAgLmNhdGNoIChlcnIpIC0+XG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRGYXRhbEVycm9yIFwiXG4gICAgICAgICAgSGFza2VsbC1naGMtbW9kOiBnaGMtbW9kIGZhaWxlZCB0byBsYXVuY2guXG4gICAgICAgICAgSXQgaXMgcHJvYmFibHkgbWlzc2luZyBvciBtaXNjb25maWd1cmVkLiAje2Vyci5jb2RlfVwiLFxuICAgICAgICAgIGRldGFpbDogXCJcIlwiXG4gICAgICAgICAgICAje2Vycn1cbiAgICAgICAgICAgIFBBVEg6ICN7cHJvY2Vzcy5lbnYuUEFUSH1cbiAgICAgICAgICAgIHBhdGg6ICN7cHJvY2Vzcy5lbnYucGF0aH1cbiAgICAgICAgICAgIFBhdGg6ICN7cHJvY2Vzcy5lbnYuUGF0aH1cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIHN0YWNrOiBlcnIuc3RhY2tcbiAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgICBudWxsXG4gICAgQGJhY2tlbmQuc2V0KHJvb3RQYXRoLCBiYWNrZW5kKVxuICAgIHJldHVybiBiYWNrZW5kXG5cbiAgY3JlYXRlUXVldWVzOiA9PlxuICAgIEBjb21tYW5kUXVldWVzID1cbiAgICAgIGNoZWNrbGludDogbmV3IFF1ZXVlKDIpXG4gICAgICBicm93c2U6IG51bGxcbiAgICAgIHR5cGVpbmZvOiBuZXcgUXVldWUoMSlcbiAgICAgIGZpbmQ6IG5ldyBRdWV1ZSgxKVxuICAgICAgaW5pdDogbmV3IFF1ZXVlKDQpXG4gICAgICBsaXN0OiBuZXcgUXVldWUoMSlcbiAgICAgIGxvd21lbTogbmV3IFF1ZXVlKDEpXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdoYXNrZWxsLWdoYy1tb2QubWF4QnJvd3NlUHJvY2Vzc2VzJywgKHZhbHVlKSA9PlxuICAgICAgQGNvbW1hbmRRdWV1ZXMuYnJvd3NlID0gbmV3IFF1ZXVlKHZhbHVlKVxuXG4gIGdldFZlcnNpb246IChvcHRzKSAtPlxuICAgIHRpbWVvdXQgPSBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZ2hjLW1vZC5pbml0VGltZW91dCcpICogMTAwMFxuICAgIGNtZCA9IGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1naGMtbW9kLmdoY01vZFBhdGgnKVxuICAgIFV0aWwuZXhlY1Byb21pc2UgY21kLCBbJ3ZlcnNpb24nXSwgXy5leHRlbmQoe3RpbWVvdXR9LCBvcHRzKVxuICAgIC50aGVuIChzdGRvdXQpIC0+XG4gICAgICB2ZXJzID0gL15naGMtbW9kIHZlcnNpb24gKFxcZCspXFwuKFxcZCspXFwuKFxcZCspKD86XFwuKFxcZCspKT8vLmV4ZWMoc3Rkb3V0KS5zbGljZSgxLCA1KS5tYXAgKGkpIC0+IHBhcnNlSW50IGlcbiAgICAgIGNvbXAgPSAvR0hDICguKykkLy5leGVjKHN0ZG91dC50cmltKCkpWzFdXG4gICAgICBVdGlsLmRlYnVnIFwiR2hjLW1vZCAje3ZlcnN9IGJ1aWx0IHdpdGggI3tjb21wfVwiXG4gICAgICByZXR1cm4ge3ZlcnMsIGNvbXB9XG5cbiAgY2hlY2tDb21wOiAob3B0cywge2NvbXB9KSAtPlxuICAgIHRpbWVvdXQgPSBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZ2hjLW1vZC5pbml0VGltZW91dCcpICogMTAwMFxuICAgIHN0YWNrZ2hjID1cbiAgICAgIFV0aWwuZXhlY1Byb21pc2UgJ3N0YWNrJywgWydnaGMnLCAnLS0nLCAnLS1udW1lcmljLXZlcnNpb24nXSwgXy5leHRlbmQoe3RpbWVvdXR9LCBvcHRzKVxuICAgICAgLnRoZW4gKHN0ZG91dCkgLT4gc3Rkb3V0LnRyaW0oKVxuICAgICAgLmNhdGNoIChlcnJvcikgLT5cbiAgICAgICAgVXRpbC53YXJuIGVycm9yXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgcGF0aGdoYyA9XG4gICAgICBVdGlsLmV4ZWNQcm9taXNlICdnaGMnLCBbJy0tbnVtZXJpYy12ZXJzaW9uJ10sIF8uZXh0ZW5kKHt0aW1lb3V0fSwgb3B0cylcbiAgICAgIC50aGVuIChzdGRvdXQpIC0+IHN0ZG91dC50cmltKClcbiAgICAgIC5jYXRjaCAoZXJyb3IpIC0+XG4gICAgICAgIFV0aWwud2FybiBlcnJvclxuICAgICAgICByZXR1cm4gbnVsbFxuICAgIFByb21pc2UuYWxsIFtzdGFja2doYywgcGF0aGdoY11cbiAgICAudGhlbiAoW3N0YWNrZ2hjLCBwYXRoZ2hjXSkgLT5cbiAgICAgIFV0aWwuZGVidWcgXCJTdGFjayBHSEMgdmVyc2lvbiAje3N0YWNrZ2hjfVwiXG4gICAgICBVdGlsLmRlYnVnIFwiUGF0aCBHSEMgdmVyc2lvbiAje3BhdGhnaGN9XCJcbiAgICAgIGlmIHN0YWNrZ2hjPyBhbmQgc3RhY2tnaGMgaXNudCBjb21wXG4gICAgICAgIHdhcm4gPSBcIlxuICAgICAgICAgIEdIQyB2ZXJzaW9uIGluIHlvdXIgU3RhY2sgJyN7c3RhY2tnaGN9JyBkb2Vzbid0IG1hdGNoIHdpdGhcbiAgICAgICAgICBHSEMgdmVyc2lvbiB1c2VkIHRvIGJ1aWxkIGdoYy1tb2QgJyN7Y29tcH0nLiBUaGlzIGNhbiBsZWFkIHRvXG4gICAgICAgICAgcHJvYmxlbXMgd2hlbiB1c2luZyBTdGFjayBwcm9qZWN0c1wiXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nIHdhcm5cbiAgICAgICAgVXRpbC53YXJuIHdhcm5cbiAgICAgIGlmIHBhdGhnaGM/IGFuZCBwYXRoZ2hjIGlzbnQgY29tcFxuICAgICAgICB3YXJuID0gXCJcbiAgICAgICAgICBHSEMgdmVyc2lvbiBpbiB5b3VyIFBBVEggJyN7cGF0aGdoY30nIGRvZXNuJ3QgbWF0Y2ggd2l0aFxuICAgICAgICAgIEdIQyB2ZXJzaW9uIHVzZWQgdG8gYnVpbGQgZ2hjLW1vZCAnI3tjb21wfScuIFRoaXMgY2FuIGxlYWQgdG9cbiAgICAgICAgICBwcm9ibGVtcyB3aGVuIHVzaW5nIENhYmFsIG9yIFBsYWluIHByb2plY3RzXCJcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcgd2FyblxuICAgICAgICBVdGlsLndhcm4gd2FyblxuXG4gIGdldENhcHM6ICh7dmVyc30pIC0+XG4gICAgY2FwcyA9XG4gICAgICB2ZXJzaW9uOiB2ZXJzXG4gICAgICBmaWxlTWFwOiBmYWxzZVxuICAgICAgcXVvdGVBcmdzOiBmYWxzZVxuICAgICAgb3B0cGFyc2U6IGZhbHNlXG4gICAgICB0eXBlQ29uc3RyYWludHM6IGZhbHNlXG4gICAgICBicm93c2VQYXJlbnRzOiBmYWxzZVxuICAgICAgaW50ZXJhY3RpdmVDYXNlU3BsaXQ6IGZhbHNlXG4gICAgICBpbXBvcnRlZEZyb206IGZhbHNlXG5cbiAgICBhdExlYXN0ID0gKGIpIC0+XG4gICAgICBmb3IgdiwgaSBpbiBiXG4gICAgICAgIGlmIHZlcnNbaV0gPiB2XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZWxzZSBpZiB2ZXJzW2ldIDwgdlxuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgcmV0dXJuIHRydWVcblxuICAgIGV4YWN0ID0gKGIpIC0+XG4gICAgICBmb3IgdiwgaSBpbiBiXG4gICAgICAgIGlmIHZlcnNbaV0gaXNudCB2XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgaWYgbm90IGF0TGVhc3QgWzUsIDRdXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJcbiAgICAgICAgSGFza2VsbC1naGMtbW9kOiBnaGMtbW9kIDwgNS40IGlzIG5vdCBzdXBwb3J0ZWQuXG4gICAgICAgIFVzZSBhdCB5b3VyIG93biByaXNrIG9yIHVwZGF0ZSB5b3VyIGdoYy1tb2QgaW5zdGFsbGF0aW9uXCIsXG4gICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgaWYgZXhhY3QgWzUsIDRdXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyBcIlxuICAgICAgICBIYXNrZWxsLWdoYy1tb2Q6IGdoYy1tb2QgNS40LiogaXMgZGVwcmVjYXRlZC5cbiAgICAgICAgVXNlIGF0IHlvdXIgb3duIHJpc2sgb3IgdXBkYXRlIHlvdXIgZ2hjLW1vZCBpbnN0YWxsYXRpb25cIixcbiAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICBpZiBhdExlYXN0IFs1LCA0XVxuICAgICAgY2Fwcy5maWxlTWFwID0gdHJ1ZVxuICAgIGlmIGF0TGVhc3QgWzUsIDVdXG4gICAgICBjYXBzLnF1b3RlQXJncyA9IHRydWVcbiAgICAgIGNhcHMub3B0cGFyc2UgPSB0cnVlXG4gICAgaWYgYXRMZWFzdChbNSwgNl0pXG4gICAgICBjYXBzLnR5cGVDb25zdHJhaW50cyA9IHRydWVcbiAgICAgIGNhcHMuYnJvd3NlUGFyZW50cyA9IHRydWVcbiAgICAgIGNhcHMuaW50ZXJhY3RpdmVDYXNlU3BsaXQgPSB0cnVlXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWdoYy1tb2QuZXhwZXJpbWVudGFsJylcbiAgICAgIGNhcHMuaW1wb3J0ZWRGcm9tID0gdHJ1ZVxuICAgIFV0aWwuZGVidWcgSlNPTi5zdHJpbmdpZnkoY2FwcylcbiAgICByZXR1cm4gY2Fwc1xuXG4gIGtpbGxQcm9jZXNzOiA9PlxuICAgIEBiYWNrZW5kLmZvckVhY2ggKHYpIC0+XG4gICAgICB2LnRoZW4gKGJhY2tlbmQpIC0+IGJhY2tlbmQ/LmtpbGxQcm9jZXNzPygpXG4gICAgQGJhY2tlbmQuY2xlYXIoKVxuXG4gICMgVGVhciBkb3duIGFueSBzdGF0ZSBhbmQgZGV0YWNoXG4gIGRlc3Ryb3k6ID0+XG4gICAgQGJhY2tlbmQuZm9yRWFjaCAodikgLT5cbiAgICAgIHYudGhlbiAoYmFja2VuZCkgLT4gYmFja2VuZD8uZGVzdHJveT8oKVxuICAgIEBiYWNrZW5kLmNsZWFyKClcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtZGVzdHJveSdcbiAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gICAgQGNvbW1hbmRRdWV1ZXMgPSBudWxsXG4gICAgQGJhY2tlbmQgPSBudWxsXG5cbiAgb25EaWREZXN0cm95OiAoY2FsbGJhY2spID0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1kZXN0cm95JywgY2FsbGJhY2tcblxuICBvbkJhY2tlbmRBY3RpdmU6IChjYWxsYmFjaykgPT5cbiAgICBAZW1pdHRlci5vbiAnYmFja2VuZC1hY3RpdmUnLCBjYWxsYmFja1xuXG4gIG9uQmFja2VuZElkbGU6IChjYWxsYmFjaykgPT5cbiAgICBAZW1pdHRlci5vbiAnYmFja2VuZC1pZGxlJywgY2FsbGJhY2tcblxuICBvblF1ZXVlSWRsZTogKGNhbGxiYWNrKSA9PlxuICAgIEBlbWl0dGVyLm9uICdxdWV1ZS1pZGxlJywgY2FsbGJhY2tcblxuICBxdWV1ZUNtZDogKHF1ZXVlTmFtZSwgcnVuQXJncywgYmFja2VuZCkgPT5cbiAgICB1bmxlc3MgcnVuQXJncy5idWZmZXI/IG9yIHJ1bkFyZ3MuZGlyP1xuICAgICAgdGhyb3cgbmV3IEVycm9yIChcIk5laXRoZXIgZGlyIG5vciBidWZmZXIgaXMgc2V0IGluIHF1ZXVlQ21kIGludm9jYXRpb25cIilcbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZ2hjLW1vZC5sb3dNZW1vcnlTeXN0ZW0nKVxuICAgICAgcXVldWVOYW1lID0gJ2xvd21lbSdcbiAgICBydW5BcmdzLmRpciA/PSBAZ2V0Um9vdERpcihydW5BcmdzLmJ1ZmZlcikgaWYgcnVuQXJncy5idWZmZXI/XG4gICAgdW5sZXNzIGJhY2tlbmQ/XG4gICAgICByZXR1cm4gQGluaXRCYWNrZW5kKHJ1bkFyZ3MuZGlyKS50aGVuIChiYWNrZW5kKSA9PlxuICAgICAgICBpZiBiYWNrZW5kP1xuICAgICAgICAgIEBxdWV1ZUNtZChxdWV1ZU5hbWUsIHJ1bkFyZ3MsIGJhY2tlbmQpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBbXVxuICAgIHFlID0gKHFuKSA9PlxuICAgICAgcSA9IEBjb21tYW5kUXVldWVzW3FuXVxuICAgICAgcS5nZXRRdWV1ZUxlbmd0aCgpICsgcS5nZXRQZW5kaW5nTGVuZ3RoKCkgaXMgMFxuICAgIHByb21pc2UgPSBAY29tbWFuZFF1ZXVlc1txdWV1ZU5hbWVdLmFkZCA9PlxuICAgICAgQGVtaXR0ZXIuZW1pdCAnYmFja2VuZC1hY3RpdmUnXG4gICAgICByZCA9IHJ1bkFyZ3MuZGlyIG9yIFV0aWwuZ2V0Um9vdERpcihydW5BcmdzLm9wdGlvbnMuY3dkKVxuICAgICAgbG9jYWxTZXR0aW5ncyA9IG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgICAgIGZpbGUgPSByZC5nZXRGaWxlKCcuaGFza2VsbC1naGMtbW9kLmpzb24nKVxuICAgICAgICBmaWxlLmV4aXN0cygpXG4gICAgICAgIC50aGVuIChleCkgLT5cbiAgICAgICAgICBpZiBleFxuICAgICAgICAgICAgZmlsZS5yZWFkKCkudGhlbiAoY29udGVudHMpIC0+XG4gICAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICAgIHJlc29sdmUgSlNPTi5wYXJzZShjb250ZW50cylcbiAgICAgICAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yICdGYWlsZWQgdG8gcGFyc2UgLmhhc2tlbGwtZ2hjLW1vZC5qc29uJyxcbiAgICAgICAgICAgICAgICAgIGRldGFpbDogZXJyXG4gICAgICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgICAgICAgICAgIHJlamVjdCBlcnJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZWplY3QoKVxuICAgICAgLmNhdGNoIChlcnJvcikgLT5cbiAgICAgICAgVXRpbC53YXJuIGVycm9yIGlmIGVycm9yP1xuICAgICAgICByZXR1cm4ge31cbiAgICAgIGdsb2JhbFNldHRpbmdzID0gbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICAgICAgY29uZmlnRGlyID0gbmV3IERpcmVjdG9yeShhdG9tLmdldENvbmZpZ0RpclBhdGgoKSlcbiAgICAgICAgZmlsZSA9IGNvbmZpZ0Rpci5nZXRGaWxlKCdoYXNrZWxsLWdoYy1tb2QuanNvbicpXG4gICAgICAgIGZpbGUuZXhpc3RzKClcbiAgICAgICAgLnRoZW4gKGV4KSAtPlxuICAgICAgICAgIGlmIGV4XG4gICAgICAgICAgICBmaWxlLnJlYWQoKS50aGVuIChjb250ZW50cykgLT5cbiAgICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSBKU09OLnBhcnNlKGNvbnRlbnRzKVxuICAgICAgICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgJ0ZhaWxlZCB0byBwYXJzZSBoYXNrZWxsLWdoYy1tb2QuanNvbicsXG4gICAgICAgICAgICAgICAgICBkZXRhaWw6IGVyclxuICAgICAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICAgICAgICByZWplY3QgZXJyXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVqZWN0KClcbiAgICAgIC5jYXRjaCAoZXJyb3IpIC0+XG4gICAgICAgIFV0aWwud2FybiBlcnJvciBpZiBlcnJvcj9cbiAgICAgICAgcmV0dXJuIHt9XG4gICAgICBQcm9taXNlLmFsbCBbZ2xvYmFsU2V0dGluZ3MsIGxvY2FsU2V0dGluZ3NdXG4gICAgICAudGhlbiAoW2dsb2IsIGxvY10pIC0+XG4gICAgICAgIF8uZXh0ZW5kKGdsb2IsIGxvYylcbiAgICAgIC50aGVuIChzZXR0aW5ncykgLT5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2hjLW1vZCBkaXNhYmxlZCBpbiBzZXR0aW5nc1wiKSBpZiBzZXR0aW5ncy5kaXNhYmxlXG4gICAgICAgIHJ1bkFyZ3Muc3VwcHJlc3NFcnJvcnMgPSBzZXR0aW5ncy5zdXBwcmVzc0Vycm9yc1xuICAgICAgICBydW5BcmdzLmdoY09wdGlvbnMgPSBzZXR0aW5ncy5naGNPcHRpb25zXG4gICAgICAgIHJ1bkFyZ3MuZ2hjTW9kT3B0aW9ucyA9IHNldHRpbmdzLmdoY01vZE9wdGlvbnNcbiAgICAgIC50aGVuIC0+XG4gICAgICAgIGJhY2tlbmQucnVuIHJ1bkFyZ3NcbiAgICAgIC5jYXRjaCAoZXJyKSAtPlxuICAgICAgICBVdGlsLndhcm4gZXJyXG4gICAgICAgIHJldHVybiBbXVxuICAgIHByb21pc2UudGhlbiAocmVzKSA9PlxuICAgICAgaWYgcWUocXVldWVOYW1lKVxuICAgICAgICBAZW1pdHRlci5lbWl0ICdxdWV1ZS1pZGxlJywge3F1ZXVlOiBxdWV1ZU5hbWV9XG4gICAgICAgIGlmIChrIGZvciBrIG9mIEBjb21tYW5kUXVldWVzKS5ldmVyeShxZSlcbiAgICAgICAgICBAZW1pdHRlci5lbWl0ICdiYWNrZW5kLWlkbGUnXG4gICAgcmV0dXJuIHByb21pc2VcblxuICBydW5MaXN0OiAoYnVmZmVyKSA9PlxuICAgIEBxdWV1ZUNtZCAnbGlzdCcsXG4gICAgICBidWZmZXI6IGJ1ZmZlclxuICAgICAgY29tbWFuZDogJ2xpc3QnXG5cbiAgcnVuTGFuZzogKGRpcikgPT5cbiAgICBAcXVldWVDbWQgJ2luaXQnLFxuICAgICAgY29tbWFuZDogJ2xhbmcnXG4gICAgICBkaXI6IGRpclxuXG4gIHJ1bkZsYWc6IChkaXIpID0+XG4gICAgQHF1ZXVlQ21kICdpbml0JyxcbiAgICAgIGNvbW1hbmQ6ICdmbGFnJ1xuICAgICAgZGlyOiBkaXJcblxuICBydW5Ccm93c2U6IChyb290RGlyLCBtb2R1bGVzKSA9PlxuICAgIEBxdWV1ZUNtZCAnYnJvd3NlJyxcbiAgICAgIGRpcjogcm9vdERpclxuICAgICAgY29tbWFuZDogJ2Jyb3dzZSdcbiAgICAgIGRhc2hBcmdzOiAoY2FwcykgLT5cbiAgICAgICAgYXJncyA9IFsnLWQnXVxuICAgICAgICBhcmdzLnB1c2ggJy1wJyBpZiBjYXBzLmJyb3dzZVBhcmVudHNcbiAgICAgICAgYXJnc1xuICAgICAgYXJnczogbW9kdWxlc1xuICAgIC50aGVuIChsaW5lcykgPT5cbiAgICAgIGxpbmVzLm1hcCAocykgPT5cbiAgICAgICAgW25hbWUsIHR5cGVTaWduYXR1cmUuLi5dID0gcy5zcGxpdCgnIDo6ICcpXG4gICAgICAgIHR5cGVTaWduYXR1cmUgPSB0eXBlU2lnbmF0dXJlLmpvaW4oJyA6OiAnKS50cmltKClcbiAgICAgICAgaWYgQGNhcHMuYnJvd3NlUGFyZW50c1xuICAgICAgICAgIFt0eXBlU2lnbmF0dXJlLCBwYXJlbnRdID0gdHlwZVNpZ25hdHVyZS5zcGxpdCgnIC0tIGZyb206JykubWFwICh2KSAtPiB2LnRyaW0oKVxuICAgICAgICBuYW1lID0gbmFtZS50cmltKClcbiAgICAgICAgaWYgL14oPzp0eXBlfGRhdGF8bmV3dHlwZSkvLnRlc3QodHlwZVNpZ25hdHVyZSlcbiAgICAgICAgICBzeW1ib2xUeXBlID0gJ3R5cGUnXG4gICAgICAgIGVsc2UgaWYgL14oPzpjbGFzcykvLnRlc3QodHlwZVNpZ25hdHVyZSlcbiAgICAgICAgICBzeW1ib2xUeXBlID0gJ2NsYXNzJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgc3ltYm9sVHlwZSA9ICdmdW5jdGlvbidcbiAgICAgICAge25hbWUsIHR5cGVTaWduYXR1cmUsIHN5bWJvbFR5cGUsIHBhcmVudH1cblxuICBnZXRUeXBlSW5CdWZmZXI6IChidWZmZXIsIGNyYW5nZSkgPT5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlIG51bGwgdW5sZXNzIGJ1ZmZlci5nZXRVcmkoKT9cbiAgICBjcmFuZ2UgPSBVdGlsLnRhYlNoaWZ0Rm9yUmFuZ2UoYnVmZmVyLCBjcmFuZ2UpXG4gICAgQHF1ZXVlQ21kICd0eXBlaW5mbycsXG4gICAgICBpbnRlcmFjdGl2ZTogdHJ1ZVxuICAgICAgYnVmZmVyOiBidWZmZXJcbiAgICAgIGNvbW1hbmQ6ICd0eXBlJyxcbiAgICAgIHVyaTogYnVmZmVyLmdldFVyaSgpXG4gICAgICB0ZXh0OiBidWZmZXIuZ2V0VGV4dCgpIGlmIGJ1ZmZlci5pc01vZGlmaWVkKClcbiAgICAgIGRhc2hBcmdzOiAoY2FwcykgLT5cbiAgICAgICAgYXJncyA9IFtdXG4gICAgICAgIGFyZ3MucHVzaCAnLWMnIGlmIGNhcHMudHlwZUNvbnN0cmFpbnRzXG4gICAgICAgIGFyZ3NcbiAgICAgIGFyZ3M6IFtjcmFuZ2Uuc3RhcnQucm93ICsgMSwgY3JhbmdlLnN0YXJ0LmNvbHVtbiArIDFdXG4gICAgLnRoZW4gKGxpbmVzKSAtPlxuICAgICAgW3JhbmdlLCB0eXBlXSA9IGxpbmVzLnJlZHVjZSAoKGFjYywgbGluZSkgLT5cbiAgICAgICAgcmV0dXJuIGFjYyBpZiBhY2MgIT0gJydcbiAgICAgICAgcnggPSAvXihcXGQrKVxccysoXFxkKylcXHMrKFxcZCspXFxzKyhcXGQrKVxccytcIihbXl0qKVwiJC8gIyBbXl0gYmFzaWNhbGx5IG1lYW5zIFwiYW55dGhpbmdcIiwgaW5jbC4gbmV3bGluZXNcbiAgICAgICAgW2xpbmVfLCByb3dzdGFydCwgY29sc3RhcnQsIHJvd2VuZCwgY29sZW5kLCB0ZXh0XSA9IGxpbmUubWF0Y2gocngpXG4gICAgICAgIHR5cGUgPSB0ZXh0LnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICBteXJhbmdlID1cbiAgICAgICAgICBSYW5nZS5mcm9tT2JqZWN0IFtcbiAgICAgICAgICAgIFtwYXJzZUludChyb3dzdGFydCkgLSAxLCBwYXJzZUludChjb2xzdGFydCkgLSAxXSxcbiAgICAgICAgICAgIFtwYXJzZUludChyb3dlbmQpIC0gMSwgcGFyc2VJbnQoY29sZW5kKSAtIDFdXG4gICAgICAgICAgXVxuICAgICAgICByZXR1cm4gYWNjIGlmIG15cmFuZ2UuaXNFbXB0eSgpXG4gICAgICAgIHJldHVybiBhY2MgdW5sZXNzIG15cmFuZ2UuY29udGFpbnNSYW5nZShjcmFuZ2UpXG4gICAgICAgIG15cmFuZ2UgPSBVdGlsLnRhYlVuc2hpZnRGb3JSYW5nZShidWZmZXIsIG15cmFuZ2UpXG4gICAgICAgIHJldHVybiBbbXlyYW5nZSwgdHlwZV0pLFxuICAgICAgICAnJ1xuICAgICAgcmFuZ2UgPSBjcmFuZ2UgdW5sZXNzIHJhbmdlXG4gICAgICBpZiB0eXBlXG4gICAgICAgIHJldHVybiB7cmFuZ2UsIHR5cGV9XG4gICAgICBlbHNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIk5vIHR5cGVcIlxuXG4gIGRvQ2FzZVNwbGl0OiAoYnVmZmVyLCBjcmFuZ2UpID0+XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSBbXSB1bmxlc3MgYnVmZmVyLmdldFVyaSgpP1xuICAgIGNyYW5nZSA9IFV0aWwudGFiU2hpZnRGb3JSYW5nZShidWZmZXIsIGNyYW5nZSlcbiAgICBAcXVldWVDbWQgJ3R5cGVpbmZvJyxcbiAgICAgIGludGVyYWN0aXZlOiBAY2Fwcz8uaW50ZXJhY3RpdmVDYXNlU3BsaXQgPyBmYWxzZVxuICAgICAgYnVmZmVyOiBidWZmZXJcbiAgICAgIGNvbW1hbmQ6ICdzcGxpdCcsXG4gICAgICB1cmk6IGJ1ZmZlci5nZXRVcmkoKVxuICAgICAgdGV4dDogYnVmZmVyLmdldFRleHQoKSBpZiBidWZmZXIuaXNNb2RpZmllZCgpXG4gICAgICBhcmdzOiBbY3JhbmdlLnN0YXJ0LnJvdyArIDEsIGNyYW5nZS5zdGFydC5jb2x1bW4gKyAxXVxuICAgIC50aGVuIChsaW5lcykgLT5cbiAgICAgIHJ4ID0gL14oXFxkKylcXHMrKFxcZCspXFxzKyhcXGQrKVxccysoXFxkKylcXHMrXCIoW15dKilcIiQvICMgW15dIGJhc2ljYWxseSBtZWFucyBcImFueXRoaW5nXCIsIGluY2wuIG5ld2xpbmVzXG4gICAgICBsaW5lc1xuICAgICAgLmZpbHRlciAobGluZSkgLT5cbiAgICAgICAgdW5sZXNzIGxpbmUubWF0Y2gocngpP1xuICAgICAgICAgIFV0aWwud2FybiBcImdoYy1tb2Qgc2F5czogI3tsaW5lfVwiXG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICAubWFwIChsaW5lKSAtPlxuICAgICAgICBbbGluZV8sIHJvd3N0YXJ0LCBjb2xzdGFydCwgcm93ZW5kLCBjb2xlbmQsIHRleHRdID0gbGluZS5tYXRjaChyeClcbiAgICAgICAgcmFuZ2U6XG4gICAgICAgICAgUmFuZ2UuZnJvbU9iamVjdCBbXG4gICAgICAgICAgICBbcGFyc2VJbnQocm93c3RhcnQpIC0gMSwgcGFyc2VJbnQoY29sc3RhcnQpIC0gMV0sXG4gICAgICAgICAgICBbcGFyc2VJbnQocm93ZW5kKSAtIDEsIHBhcnNlSW50KGNvbGVuZCkgLSAxXVxuICAgICAgICAgIF1cbiAgICAgICAgcmVwbGFjZW1lbnQ6IHRleHRcblxuICBkb1NpZ0ZpbGw6IChidWZmZXIsIGNyYW5nZSkgPT5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlIFtdIHVubGVzcyBidWZmZXIuZ2V0VXJpKCk/XG4gICAgY3JhbmdlID0gVXRpbC50YWJTaGlmdEZvclJhbmdlKGJ1ZmZlciwgY3JhbmdlKVxuICAgIEBxdWV1ZUNtZCAndHlwZWluZm8nLFxuICAgICAgaW50ZXJhY3RpdmU6IEBjYXBzPy5pbnRlcmFjdGl2ZUNhc2VTcGxpdCA/IGZhbHNlXG4gICAgICBidWZmZXI6IGJ1ZmZlclxuICAgICAgY29tbWFuZDogJ3NpZycsXG4gICAgICB1cmk6IGJ1ZmZlci5nZXRVcmkoKVxuICAgICAgdGV4dDogYnVmZmVyLmdldFRleHQoKSBpZiBidWZmZXIuaXNNb2RpZmllZCgpXG4gICAgICBhcmdzOiBbY3JhbmdlLnN0YXJ0LnJvdyArIDEsIGNyYW5nZS5zdGFydC5jb2x1bW4gKyAxXVxuICAgIC50aGVuIChsaW5lcykgLT5cbiAgICAgIHJldHVybiBbXSB1bmxlc3MgbGluZXNbMF0/XG4gICAgICByeCA9IC9eKFxcZCspXFxzKyhcXGQrKVxccysoXFxkKylcXHMrKFxcZCspJC8gIyBwb3NpdGlvbiByeFxuICAgICAgW2xpbmVfLCByb3dzdGFydCwgY29sc3RhcnQsIHJvd2VuZCwgY29sZW5kXSA9IGxpbmVzWzFdLm1hdGNoKHJ4KVxuICAgICAgcmFuZ2UgPVxuICAgICAgICBSYW5nZS5mcm9tT2JqZWN0IFtcbiAgICAgICAgICBbcGFyc2VJbnQocm93c3RhcnQpIC0gMSwgcGFyc2VJbnQoY29sc3RhcnQpIC0gMV0sXG4gICAgICAgICAgW3BhcnNlSW50KHJvd2VuZCkgLSAxLCBwYXJzZUludChjb2xlbmQpIC0gMV1cbiAgICAgICAgXVxuICAgICAgcmV0dXJuIFtcbiAgICAgICAgdHlwZTogbGluZXNbMF1cbiAgICAgICAgcmFuZ2U6IHJhbmdlXG4gICAgICAgIGJvZHk6IGxpbmVzLnNsaWNlKDIpLmpvaW4oJ1xcbicpXG4gICAgICBdXG5cbiAgZ2V0SW5mb0luQnVmZmVyOiAoZWRpdG9yLCBjcmFuZ2UpID0+XG4gICAgYnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSBudWxsIHVubGVzcyBidWZmZXIuZ2V0VXJpKCk/XG4gICAge3N5bWJvbCwgcmFuZ2V9ID0gVXRpbC5nZXRTeW1ib2xJblJhbmdlKGVkaXRvciwgY3JhbmdlKVxuXG4gICAgQHF1ZXVlQ21kICd0eXBlaW5mbycsXG4gICAgICBpbnRlcmFjdGl2ZTogdHJ1ZVxuICAgICAgYnVmZmVyOiBidWZmZXJcbiAgICAgIGNvbW1hbmQ6ICdpbmZvJ1xuICAgICAgdXJpOiBidWZmZXIuZ2V0VXJpKClcbiAgICAgIHRleHQ6IGJ1ZmZlci5nZXRUZXh0KCkgaWYgYnVmZmVyLmlzTW9kaWZpZWQoKVxuICAgICAgYXJnczogW3N5bWJvbF1cbiAgICAudGhlbiAobGluZXMpIC0+XG4gICAgICBpbmZvID0gbGluZXMuam9pbignXFxuJylcbiAgICAgIGlmIGluZm8gaXMgJ0Nhbm5vdCBzaG93IGluZm8nIG9yIG5vdCBpbmZvXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIk5vIGluZm9cIlxuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4ge3JhbmdlLCBpbmZvfVxuXG4gIGZpbmRTeW1ib2xQcm92aWRlcnNJbkJ1ZmZlcjogKGVkaXRvciwgY3JhbmdlKSA9PlxuICAgIGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKVxuICAgIHtzeW1ib2x9ID0gVXRpbC5nZXRTeW1ib2xJblJhbmdlKGVkaXRvciwgY3JhbmdlKVxuXG4gICAgQHF1ZXVlQ21kICdmaW5kJyxcbiAgICAgIGludGVyYWN0aXZlOiB0cnVlXG4gICAgICBidWZmZXI6IGJ1ZmZlclxuICAgICAgY29tbWFuZDogJ2ZpbmQnXG4gICAgICBhcmdzOiBbc3ltYm9sXVxuXG4gIGRvQ2hlY2tPckxpbnRCdWZmZXI6IChjbWQsIGJ1ZmZlciwgZmFzdCkgPT5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlIFtdIGlmIGJ1ZmZlci5pc0VtcHR5KClcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlIFtdIHVubGVzcyBidWZmZXIuZ2V0VXJpKCk/XG5cbiAgICAjIEEgZGlydHkgaGFjayB0byBtYWtlIGxpbnQgd29yayB3aXRoIGxoc1xuICAgIG9sZHVyaSA9IHVyaSA9IGJ1ZmZlci5nZXRVcmkoKVxuICAgIHRleHQgPVxuICAgICAgaWYgY21kIGlzICdsaW50JyBhbmQgZXh0bmFtZSh1cmkpIGlzICcubGhzJ1xuICAgICAgICB1cmkgPSB1cmkuc2xpY2UgMCwgLTFcbiAgICAgICAgdW5saXRTeW5jIG9sZHVyaSwgYnVmZmVyLmdldFRleHQoKVxuICAgICAgZWxzZSBpZiBidWZmZXIuaXNNb2RpZmllZCgpXG4gICAgICAgIGJ1ZmZlci5nZXRUZXh0KClcbiAgICBpZiB0ZXh0Py5lcnJvcj9cbiAgICAgICMgVE9ETzogUmVqZWN0XG4gICAgICBbbSwgdXJpLCBsaW5lLCBtZXNzXSA9IHRleHQuZXJyb3IubWF0Y2goL14oLio/KTooWzAtOV0rKTogKiguKikgKiQvKVxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSBbXG4gICAgICAgIHVyaTogdXJpXG4gICAgICAgIHBvc2l0aW9uOiBuZXcgUG9pbnQobGluZSAtIDEsIDApXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NcbiAgICAgICAgc2V2ZXJpdHk6ICdsaW50J1xuICAgICAgXVxuICAgICMgZW5kIG9mIGRpcnR5IGhhY2tcblxuICAgIGlmIGNtZCBpcyAnbGludCdcbiAgICAgIGFyZ3MgPSBbXS5jb25jYXQgYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWdoYy1tb2QuaGxpbnRPcHRpb25zJykubWFwKCh2KSAtPiBbJy0taGxpbnRPcHQnLCB2XSkuLi5cblxuICAgIEBxdWV1ZUNtZCAnY2hlY2tsaW50JyxcbiAgICAgIGludGVyYWN0aXZlOiBmYXN0XG4gICAgICBidWZmZXI6IGJ1ZmZlclxuICAgICAgY29tbWFuZDogY21kXG4gICAgICB1cmk6IHVyaVxuICAgICAgdGV4dDogdGV4dFxuICAgICAgYXJnczogYXJnc1xuICAgIC50aGVuIChsaW5lcykgPT5cbiAgICAgIHJvb3REaXIgPSBAZ2V0Um9vdERpciBidWZmZXJcbiAgICAgIHJ4ID0gL14oLio/KTooWzAtOVxcc10rKTooWzAtOVxcc10rKTogKig/OihXYXJuaW5nfEVycm9yKTogKik/L1xuICAgICAgbGluZXNcbiAgICAgIC5maWx0ZXIgKGxpbmUpIC0+XG4gICAgICAgIHN3aXRjaFxuICAgICAgICAgIHdoZW4gbGluZS5zdGFydHNXaXRoICdEdW1teTowOjA6RXJyb3I6J1xuICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIGxpbmUuc2xpY2UoMTYpXG4gICAgICAgICAgd2hlbiBsaW5lLnN0YXJ0c1dpdGggJ0R1bW15OjA6MDpXYXJuaW5nOidcbiAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nIGxpbmUuc2xpY2UoMTgpXG4gICAgICAgICAgd2hlbiBsaW5lLm1hdGNoKHJ4KT9cbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgd2hlbiBsaW5lLnRyaW0oKS5sZW5ndGggPiAwXG4gICAgICAgICAgICBVdGlsLndhcm4gXCJnaGMtbW9kIHNheXM6ICN7bGluZX1cIlxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIC5tYXAgKGxpbmUpIC0+XG4gICAgICAgIG1hdGNoID0gbGluZS5tYXRjaChyeClcbiAgICAgICAgW20sIGZpbGUsIHJvdywgY29sLCB3YXJuaW5nXSA9IG1hdGNoXG4gICAgICAgIGZpbGUgPSBvbGR1cmkgaWYgdXJpLmVuZHNXaXRoKGZpbGUpXG4gICAgICAgIHNldmVyaXR5ID1cbiAgICAgICAgICBpZiBjbWQgPT0gJ2xpbnQnXG4gICAgICAgICAgICAnbGludCdcbiAgICAgICAgICBlbHNlIGlmIHdhcm5pbmcgPT0gJ1dhcm5pbmcnXG4gICAgICAgICAgICAnd2FybmluZydcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAnZXJyb3InXG4gICAgICAgIG1lc3NQb3MgPSBuZXcgUG9pbnQocm93IC0gMSwgY29sIC0gMSlcbiAgICAgICAgbWVzc1BvcyA9IFV0aWwudGFiVW5zaGlmdEZvclBvaW50KGJ1ZmZlciwgbWVzc1BvcylcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHVyaTogKHRyeSByb290RGlyLmdldEZpbGUocm9vdERpci5yZWxhdGl2aXplKGZpbGUpKS5nZXRQYXRoKCkpID8gZmlsZVxuICAgICAgICAgIHBvc2l0aW9uOiBtZXNzUG9zXG4gICAgICAgICAgbWVzc2FnZTogbGluZS5yZXBsYWNlIG0sICcnXG4gICAgICAgICAgc2V2ZXJpdHk6IHNldmVyaXR5XG4gICAgICAgIH1cblxuICBkb0NoZWNrQnVmZmVyOiAoYnVmZmVyLCBmYXN0KSA9PlxuICAgIEBkb0NoZWNrT3JMaW50QnVmZmVyIFwiY2hlY2tcIiwgYnVmZmVyLCBmYXN0XG5cbiAgZG9MaW50QnVmZmVyOiAoYnVmZmVyLCBmYXN0KSA9PlxuICAgIEBkb0NoZWNrT3JMaW50QnVmZmVyIFwibGludFwiLCBidWZmZXIsIGZhc3RcblxuICBkb0NoZWNrQW5kTGludDogKGJ1ZmZlciwgZmFzdCkgPT5cbiAgICBQcm9taXNlLmFsbCBbIEBkb0NoZWNrQnVmZmVyKGJ1ZmZlciwgZmFzdCksIEBkb0xpbnRCdWZmZXIoYnVmZmVyLCBmYXN0KSBdXG4gICAgLnRoZW4gKHJlc0FycikgLT4gW10uY29uY2F0IHJlc0Fyci4uLlxuIl19

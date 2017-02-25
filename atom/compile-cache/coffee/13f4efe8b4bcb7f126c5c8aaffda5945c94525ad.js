(function() {
  var CP, Directory, EOL, FS, HsUtil, Point, Range, Temp, Util, debuglog, delimiter, extname, joinPath, logKeep, objclone, savelog, sep, _ref, _ref1,
    __slice = [].slice;

  _ref = require('atom'), Range = _ref.Range, Point = _ref.Point, Directory = _ref.Directory;

  _ref1 = require('path'), delimiter = _ref1.delimiter, sep = _ref1.sep, extname = _ref1.extname;

  Temp = require('temp');

  FS = require('fs');

  CP = require('child_process');

  EOL = require('os').EOL;

  HsUtil = require('atom-haskell-utils');

  objclone = require('clone');

  debuglog = [];

  logKeep = 30000;

  savelog = function() {
    var messages, ts;
    messages = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    ts = Date.now();
    debuglog.push({
      timestamp: ts,
      messages: messages
    });
    debuglog = debuglog.filter(function(_arg) {
      var timestamp;
      timestamp = _arg.timestamp;
      return (ts - timestamp) < logKeep;
    });
  };

  joinPath = function(ds) {
    var res, set;
    set = new Set(ds);
    res = [];
    set.forEach(function(d) {
      return res.push(d);
    });
    return res.join(delimiter);
  };

  module.exports = Util = {
    EOT: "" + EOL + "\x04" + EOL,
    debug: function() {
      var messages;
      messages = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (atom.config.get('haskell-ghc-mod.debug')) {
        console.log.apply(console, ["haskell-ghc-mod debug:"].concat(__slice.call(messages)));
      }
      return savelog.apply(null, messages.map(JSON.stringify));
    },
    warn: function() {
      var messages;
      messages = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      console.warn.apply(console, ["haskell-ghc-mod warning:"].concat(__slice.call(messages)));
      return savelog.apply(null, messages.map(JSON.stringify));
    },
    getDebugLog: function() {
      var ts;
      ts = Date.now();
      debuglog = debuglog.filter(function(_arg) {
        var timestamp;
        timestamp = _arg.timestamp;
        return (ts - timestamp) < logKeep;
      });
      return debuglog.map(function(_arg) {
        var messages, timestamp;
        timestamp = _arg.timestamp, messages = _arg.messages;
        return "" + ((timestamp - ts) / 1000) + "s: " + (messages.join(','));
      }).join(EOL);
    },
    getRootDirFallback: HsUtil.getRootDirFallback,
    getRootDir: HsUtil.getRootDir,
    isDirectory: HsUtil.isDirectory,
    execPromise: function(cmd, args, opts, stdin) {
      return new Promise(function(resolve, reject) {
        var child;
        Util.debug("Running " + cmd + " " + args + " with opts = ", opts);
        child = CP.execFile(cmd, args, opts, function(error, stdout, stderr) {
          if (stderr) {
            Util.warn(stderr);
          }
          if (error != null) {
            Util.warn("Running " + cmd + " " + args + " failed with ", error);
            if (stdout) {
              Util.warn(stdout);
            }
            error.stack = (new Error).stack;
            return reject(error);
          } else {
            Util.debug("Got response from " + cmd + " " + args, {
              stdout: stdout,
              stderr: stderr
            });
            return resolve(stdout);
          }
        });
        if (stdin != null) {
          Util.debug("sending stdin text to " + cmd + " " + args);
          return child.stdin.write(stdin);
        }
      });
    },
    getCabalSandbox: function(rootPath) {
      Util.debug("Looking for cabal sandbox...");
      return Util.parseSandboxConfig("" + rootPath + sep + "cabal.sandbox.config").then(function(sbc) {
        var sandbox, _ref2;
        if ((sbc != null ? (_ref2 = sbc['install-dirs']) != null ? _ref2['bindir'] : void 0 : void 0) != null) {
          sandbox = sbc['install-dirs']['bindir'];
          Util.debug("Found cabal sandbox: ", sandbox);
          if (Util.isDirectory(sandbox)) {
            return sandbox;
          } else {
            return Util.warn("Cabal sandbox ", sandbox, " is not a directory");
          }
        } else {
          return Util.warn("No cabal sandbox found");
        }
      });
    },
    getStackSandbox: function(rootPath, apd, env) {
      Util.debug("Looking for stack sandbox...");
      env.PATH = joinPath(apd);
      Util.debug("Running stack with PATH ", env.PATH);
      return Util.execPromise('stack', ['path', '--snapshot-install-root', '--local-install-root'], {
        encoding: 'utf-8',
        stdio: 'pipe',
        cwd: rootPath,
        env: env,
        timeout: atom.config.get('haskell-ghc-mod.initTimeout') * 1000
      }).then(function(out) {
        var lines, lir, sir;
        lines = out.split(EOL);
        sir = lines.filter(function(l) {
          return l.startsWith('snapshot-install-root: ');
        })[0].slice(23) + ("" + sep + "bin");
        lir = lines.filter(function(l) {
          return l.startsWith('local-install-root: ');
        })[0].slice(20) + ("" + sep + "bin");
        Util.debug("Found stack sandbox ", lir, sir);
        return [lir, sir];
      })["catch"](function(err) {
        return Util.warn("No stack sandbox found because ", err);
      });
    },
    getProcessOptions: (function(_this) {
      return function(rootPath) {
        var PATH, apd, cabalSandbox, capMask, env, m, res, sbd, stackSandbox, vn, _i;
        if (rootPath == null) {
          rootPath = Util.getRootDirFallback().getPath();
        }
        if (_this.processOptionsCache == null) {
          _this.processOptionsCache = new Map();
        }
        if (_this.processOptionsCache.has(rootPath)) {
          return _this.processOptionsCache.get(rootPath);
        }
        Util.debug("getProcessOptions(" + rootPath + ")");
        env = objclone(process.env);
        if (process.platform === 'win32') {
          PATH = [];
          capMask = function(str, mask) {
            var a, c, i, _i, _len;
            a = str.split('');
            for (i = _i = 0, _len = a.length; _i < _len; i = ++_i) {
              c = a[i];
              if (mask & Math.pow(2, i)) {
                a[i] = a[i].toUpperCase();
              }
            }
            return a.join('');
          };
          for (m = _i = 0xf; _i >= 0; m = --_i) {
            vn = capMask("path", m);
            if (env[vn] != null) {
              PATH.push(env[vn]);
            }
          }
          env.PATH = PATH.join(delimiter);
        }
        if (env.PATH == null) {
          env.PATH = "";
        }
        apd = atom.config.get('haskell-ghc-mod.additionalPathDirectories').concat(env.PATH.split(delimiter));
        sbd = false;
        cabalSandbox = atom.config.get('haskell-ghc-mod.cabalSandbox') ? Util.getCabalSandbox(rootPath) : Promise.resolve();
        stackSandbox = atom.config.get('haskell-ghc-mod.stackSandbox') ? Util.getStackSandbox(rootPath, apd, objclone(env)) : Promise.resolve();
        res = Promise.all([cabalSandbox, stackSandbox]).then(function(_arg) {
          var cabalSandboxDir, newp, stackSandboxDirs;
          cabalSandboxDir = _arg[0], stackSandboxDirs = _arg[1];
          newp = [];
          if (cabalSandboxDir != null) {
            newp.push(cabalSandboxDir);
          }
          if (stackSandboxDirs != null) {
            newp.push.apply(newp, stackSandboxDirs);
          }
          newp.push.apply(newp, apd);
          env.PATH = joinPath(newp);
          Util.debug("PATH = " + env.PATH);
          return {
            cwd: rootPath,
            env: env,
            encoding: 'utf-8',
            maxBuffer: Infinity
          };
        });
        _this.processOptionsCache.set(rootPath, res);
        return res;
      };
    })(this),
    getSymbolAtPoint: function(editor, point) {
      var find, inScope, line, range, regex, scope, scopes, symbol, tb, _i, _len;
      inScope = function(scope, point) {
        return editor.scopeDescriptorForBufferPosition(point).getScopesArray().some(function(v) {
          return v === scope;
        });
      };
      tb = editor.getBuffer();
      line = tb.rangeForRow(point.row);
      find = function(test) {
        var end, start, start_;
        start = end = point;
        start_ = start.translate([0, -1]);
        while (test(start_) && start_.isGreaterThanOrEqual(line.start)) {
          start = start_;
          start_ = start.translate([0, -1]);
        }
        while (test(end) && end.isLessThan(line.end)) {
          end = end.translate([0, 1]);
        }
        return new Range(start, end);
      };
      regex = /[\w'.]/;
      scopes = ['keyword.operator.haskell', 'entity.name.function.infix.haskell'];
      for (_i = 0, _len = scopes.length; _i < _len; _i++) {
        scope = scopes[_i];
        range = find(function(p) {
          return inScope(scope, p);
        });
        if (!range.isEmpty()) {
          symbol = tb.getTextInRange(range);
          return {
            scope: scope,
            range: range,
            symbol: symbol
          };
        }
      }
      range = find((function(p) {
        return tb.getTextInRange([p, p.translate([0, 1])]).match(regex) != null;
      }));
      symbol = tb.getTextInRange(range);
      return {
        range: range,
        symbol: symbol
      };
    },
    getSymbolInRange: function(editor, crange) {
      var buffer;
      buffer = editor.getBuffer();
      if (crange.isEmpty()) {
        return Util.getSymbolAtPoint(editor, crange.start);
      } else {
        return {
          symbol: buffer.getTextInRange(crange),
          range: crange
        };
      }
    },
    withTempFile: function(contents, uri, gen) {
      return new Promise(function(resolve, reject) {
        return Temp.open({
          prefix: 'haskell-ghc-mod',
          suffix: extname(uri || ".hs")
        }, function(err, info) {
          if (err) {
            return reject(err);
          } else {
            return resolve(info);
          }
        });
      }).then(function(info) {
        return new Promise(function(resolve, reject) {
          return FS.write(info.fd, contents, function(err) {
            if (err) {
              return reject(err);
            } else {
              return gen(info.path).then(function(res) {
                FS.close(info.fd, function() {
                  return FS.unlink(info.path);
                });
                return resolve(res.map(function(line) {
                  return line.split(info.path).join(uri);
                }));
              });
            }
          });
        });
      });
    },
    mkError: function(name, message) {
      var err;
      err = new Error(message);
      err.name = name;
      return err;
    },
    parseSandboxConfig: function(file) {
      return new Promise(function(resolve, reject) {
        return FS.readFile(file, {
          encoding: 'utf-8'
        }, function(err, sbc) {
          if (err != null) {
            return reject(err);
          } else {
            return resolve(sbc);
          }
        });
      }).then(function(sbc) {
        var rv, scope, vars;
        vars = {};
        scope = vars;
        rv = function(v) {
          var k1, v1;
          for (k1 in scope) {
            v1 = scope[k1];
            v = v.split("$" + k1).join(v1);
          }
          return v;
        };
        sbc.split(/\r?\n|\r/).forEach(function(line) {
          var l, m, name, newscope, val, _;
          if (!(line.match(/^\s*--/) || line.match(/^\s*$/))) {
            l = line.split(/--/)[0];
            if (m = line.match(/^\s*([\w-]+):\s*(.*)\s*$/)) {
              _ = m[0], name = m[1], val = m[2];
              return scope[name] = rv(val);
            } else {
              newscope = {};
              scope[line] = newscope;
              return scope = newscope;
            }
          }
        });
        return vars;
      })["catch"](function(err) {
        return Util.warn("Reading cabal sandbox config failed with ", err);
      });
    },
    tabShiftForPoint: function(buffer, point) {
      var columnShift, _ref2;
      columnShift = 7 * (((_ref2 = buffer.lineForRow(point.row).slice(0, point.column).match(/\t/g)) != null ? _ref2.length : void 0) || 0);
      return new Point(point.row, point.column + columnShift);
    },
    tabShiftForRange: function(buffer, range) {
      var end, start;
      start = Util.tabShiftForPoint(buffer, range.start);
      end = Util.tabShiftForPoint(buffer, range.end);
      return new Range(start, end);
    },
    tabUnshiftForPoint: function(buffer, point) {
      var columnl, columnr, line;
      line = buffer.lineForRow(point.row);
      columnl = 0;
      columnr = point.column;
      while (columnl < columnr) {
        if (!((line != null) && (line[columnl] != null))) {
          break;
        }
        if (line[columnl] === '\t') {
          columnr -= 7;
        }
        columnl += 1;
      }
      return new Point(point.row, columnr);
    },
    tabUnshiftForRange: function(buffer, range) {
      var end, start;
      start = Util.tabUnshiftForPoint(buffer, range.start);
      end = Util.tabUnshiftForPoint(buffer, range.end);
      return new Range(start, end);
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL3V0aWwuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFBQSxNQUFBLDhJQUFBO0lBQUEsa0JBQUE7O0FBQUEsRUFBQSxPQUE0QixPQUFBLENBQVEsTUFBUixDQUE1QixFQUFDLGFBQUEsS0FBRCxFQUFRLGFBQUEsS0FBUixFQUFlLGlCQUFBLFNBQWYsQ0FBQTs7QUFBQSxFQUNBLFFBQTRCLE9BQUEsQ0FBUSxNQUFSLENBQTVCLEVBQUMsa0JBQUEsU0FBRCxFQUFZLFlBQUEsR0FBWixFQUFpQixnQkFBQSxPQURqQixDQUFBOztBQUFBLEVBRUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSLENBRlAsQ0FBQTs7QUFBQSxFQUdBLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUixDQUhMLENBQUE7O0FBQUEsRUFJQSxFQUFBLEdBQUssT0FBQSxDQUFRLGVBQVIsQ0FKTCxDQUFBOztBQUFBLEVBS0MsTUFBTyxPQUFBLENBQVEsSUFBUixFQUFQLEdBTEQsQ0FBQTs7QUFBQSxFQU1BLE1BQUEsR0FBUyxPQUFBLENBQVEsb0JBQVIsQ0FOVCxDQUFBOztBQUFBLEVBT0EsUUFBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSLENBUFgsQ0FBQTs7QUFBQSxFQVNBLFFBQUEsR0FBVyxFQVRYLENBQUE7O0FBQUEsRUFVQSxPQUFBLEdBQVUsS0FWVixDQUFBOztBQUFBLEVBWUEsT0FBQSxHQUFVLFNBQUEsR0FBQTtBQUNSLFFBQUEsWUFBQTtBQUFBLElBRFMsa0VBQ1QsQ0FBQTtBQUFBLElBQUEsRUFBQSxHQUFLLElBQUksQ0FBQyxHQUFMLENBQUEsQ0FBTCxDQUFBO0FBQUEsSUFDQSxRQUFRLENBQUMsSUFBVCxDQUNFO0FBQUEsTUFBQSxTQUFBLEVBQVcsRUFBWDtBQUFBLE1B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

//# sourceURL=/Users/erewok/.atom/packages/haskell-ghc-mod/lib/util.coffee

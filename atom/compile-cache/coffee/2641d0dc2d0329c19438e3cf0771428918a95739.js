(function() {
  var CP, Directory, EOL, FS, HsUtil, Point, Range, Temp, Util, debuglog, delimiter, extname, joinPath, logKeep, objclone, ref, ref1, savelog, sep,
    slice = [].slice,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), Range = ref.Range, Point = ref.Point, Directory = ref.Directory;

  ref1 = require('path'), delimiter = ref1.delimiter, sep = ref1.sep, extname = ref1.extname;

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
    messages = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    ts = Date.now();
    debuglog.push({
      timestamp: ts,
      messages: messages
    });
    debuglog = debuglog.filter(function(arg) {
      var timestamp;
      timestamp = arg.timestamp;
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
    EOT: EOL + "\x04" + EOL,
    debug: function() {
      var messages;
      messages = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (atom.config.get('haskell-ghc-mod.debug')) {
        console.log.apply(console, ["haskell-ghc-mod debug:"].concat(slice.call(messages)));
      }
      return savelog.apply(null, messages.map(JSON.stringify));
    },
    warn: function() {
      var messages;
      messages = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      console.warn.apply(console, ["haskell-ghc-mod warning:"].concat(slice.call(messages)));
      return savelog.apply(null, messages.map(JSON.stringify));
    },
    getDebugLog: function() {
      var ts;
      ts = Date.now();
      debuglog = debuglog.filter(function(arg) {
        var timestamp;
        timestamp = arg.timestamp;
        return (ts - timestamp) < logKeep;
      });
      return debuglog.map(function(arg) {
        var messages, timestamp;
        timestamp = arg.timestamp, messages = arg.messages;
        return ((timestamp - ts) / 1000) + "s: " + (messages.join(','));
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
        var ref2, sandbox;
        if ((sbc != null ? (ref2 = sbc['install-dirs']) != null ? ref2['bindir'] : void 0 : void 0) != null) {
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
      return Util.execPromise('stack', ['path', '--snapshot-install-root', '--local-install-root', '--bin-path'], {
        encoding: 'utf-8',
        stdio: 'pipe',
        cwd: rootPath,
        env: env,
        timeout: atom.config.get('haskell-ghc-mod.initTimeout') * 1000
      }).then(function(out) {
        var bp, lines, lir, sir;
        lines = out.split(EOL);
        sir = lines.filter(function(l) {
          return l.startsWith('snapshot-install-root: ');
        })[0].slice(23) + (sep + "bin");
        lir = lines.filter(function(l) {
          return l.startsWith('local-install-root: ');
        })[0].slice(20) + (sep + "bin");
        bp = lines.filter(function(l) {
          return l.startsWith('bin-path: ');
        })[0].slice(10).split(delimiter).filter(function(p) {
          return !((p === sir) || (p === lir) || (indexOf.call(apd, p) >= 0));
        });
        Util.debug.apply(Util, ["Found stack sandbox ", lir, sir].concat(slice.call(bp)));
        return [lir, sir].concat(slice.call(bp));
      })["catch"](function(err) {
        return Util.warn("No stack sandbox found because ", err);
      });
    },
    getProcessOptions: (function(_this) {
      return function(rootPath) {
        var PATH, apd, cabalSandbox, capMask, env, j, m, res, sbd, stackSandbox, vn;
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
            var a, c, i, j, len;
            a = str.split('');
            for (i = j = 0, len = a.length; j < len; i = ++j) {
              c = a[i];
              if (mask & Math.pow(2, i)) {
                a[i] = a[i].toUpperCase();
              }
            }
            return a.join('');
          };
          for (m = j = 0xf; j >= 0; m = --j) {
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
        res = Promise.all([cabalSandbox, stackSandbox]).then(function(arg) {
          var cabalSandboxDir, newp, stackSandboxDirs;
          cabalSandboxDir = arg[0], stackSandboxDirs = arg[1];
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
            maxBuffer: 2e308
          };
        });
        _this.processOptionsCache.set(rootPath, res);
        return res;
      };
    })(this),
    getSymbolAtPoint: function(editor, point) {
      var find, inScope, j, len, line, range, regex, scope, scopes, symbol, tb;
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
      for (j = 0, len = scopes.length; j < len; j++) {
        scope = scopes[j];
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
          var _, l, m, name, newscope, val;
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
      var columnShift, ref2;
      columnShift = 7 * (((ref2 = buffer.lineForRow(point.row).slice(0, point.column).match(/\t/g)) != null ? ref2.length : void 0) || 0);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL3V0aWwuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw0SUFBQTtJQUFBOzs7RUFBQSxNQUE0QixPQUFBLENBQVEsTUFBUixDQUE1QixFQUFDLGlCQUFELEVBQVEsaUJBQVIsRUFBZTs7RUFDZixPQUE0QixPQUFBLENBQVEsTUFBUixDQUE1QixFQUFDLDBCQUFELEVBQVksY0FBWixFQUFpQjs7RUFDakIsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDTCxFQUFBLEdBQUssT0FBQSxDQUFRLGVBQVI7O0VBQ0osTUFBTyxPQUFBLENBQVEsSUFBUjs7RUFDUixNQUFBLEdBQVMsT0FBQSxDQUFRLG9CQUFSOztFQUNULFFBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7RUFFWCxRQUFBLEdBQVc7O0VBQ1gsT0FBQSxHQUFVOztFQUVWLE9BQUEsR0FBVSxTQUFBO0FBQ1IsUUFBQTtJQURTO0lBQ1QsRUFBQSxHQUFLLElBQUksQ0FBQyxHQUFMLENBQUE7SUFDTCxRQUFRLENBQUMsSUFBVCxDQUNFO01BQUEsU0FBQSxFQUFXLEVBQVg7TUFDQSxRQUFBLEVBQVUsUUFEVjtLQURGO0lBR0EsUUFBQSxHQUFXLFFBQVEsQ0FBQyxNQUFULENBQWdCLFNBQUMsR0FBRDtBQUFpQixVQUFBO01BQWYsWUFBRDthQUFnQixDQUFDLEVBQUEsR0FBSyxTQUFOLENBQUEsR0FBbUI7SUFBcEMsQ0FBaEI7RUFMSDs7RUFRVixRQUFBLEdBQVcsU0FBQyxFQUFEO0FBQ1QsUUFBQTtJQUFBLEdBQUEsR0FBVSxJQUFBLEdBQUEsQ0FBSSxFQUFKO0lBQ1YsR0FBQSxHQUFNO0lBQ04sR0FBRyxDQUFDLE9BQUosQ0FBWSxTQUFDLENBQUQ7YUFBTyxHQUFHLENBQUMsSUFB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LEtBQUssQ0FBQyxHQUFaLEVBQWlCLE9BQWpCO0lBVGMsQ0FsUHBCO0lBNlBBLGtCQUFBLEVBQW9CLFNBQUMsTUFBRCxFQUFTLEtBQVQ7QUFDbEIsVUFBQTtNQUFBLEtBQUEsR0FBUSxJQUFJLENBQUMsa0JBQUwsQ0FBd0IsTUFBeEIsRUFBZ0MsS0FBSyxDQUFDLEtBQXRDO01BQ1IsR0FBQSxHQUFNLElBQUksQ0FBQyxrQkFBTCxDQUF3QixNQUF4QixFQUFnQyxLQUFLLENBQUMsR0FBdEM7YUFDRixJQUFBLEtBQUEsQ0FBTSxLQUFOLEVBQWEsR0FBYjtJQUhjLENBN1BwQjs7QUEzQkYiLCJzb3VyY2VzQ29udGVudCI6WyJ7UmFuZ2UsIFBvaW50LCBEaXJlY3Rvcnl9ID0gcmVxdWlyZSAnYXRvbSdcbntkZWxpbWl0ZXIsIHNlcCwgZXh0bmFtZX0gPSByZXF1aXJlICdwYXRoJ1xuVGVtcCA9IHJlcXVpcmUoJ3RlbXAnKVxuRlMgPSByZXF1aXJlKCdmcycpXG5DUCA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKVxue0VPTH0gPSByZXF1aXJlKCdvcycpXG5Ic1V0aWwgPSByZXF1aXJlICdhdG9tLWhhc2tlbGwtdXRpbHMnXG5vYmpjbG9uZSA9IHJlcXVpcmUgJ2Nsb25lJ1xuXG5kZWJ1Z2xvZyA9IFtdXG5sb2dLZWVwID0gMzAwMDAgI21zXG5cbnNhdmVsb2cgPSAobWVzc2FnZXMuLi4pIC0+XG4gIHRzID0gRGF0ZS5ub3coKVxuICBkZWJ1Z2xvZy5wdXNoXG4gICAgdGltZXN0YW1wOiB0c1xuICAgIG1lc3NhZ2VzOiBtZXNzYWdlc1xuICBkZWJ1Z2xvZyA9IGRlYnVnbG9nLmZpbHRlciAoe3RpbWVzdGFtcH0pIC0+ICh0cyAtIHRpbWVzdGFtcCkgPCBsb2dLZWVwXG4gIHJldHVyblxuXG5qb2luUGF0aCA9IChkcykgLT5cbiAgc2V0ID0gbmV3IFNldChkcylcbiAgcmVzID0gW11cbiAgc2V0LmZvckVhY2ggKGQpIC0+IHJlcy5wdXNoIGRcbiAgcmV0dXJuIHJlcy5qb2luKGRlbGltaXRlcilcblxubW9kdWxlLmV4cG9ydHMgPSBVdGlsID1cbiAgRU9UOiBcIiN7RU9MfVxceDA0I3tFT0x9XCJcblxuICBkZWJ1ZzogKG1lc3NhZ2VzLi4uKSAtPlxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1naGMtbW9kLmRlYnVnJylcbiAgICAgIGNvbnNvbGUubG9nIFwiaGFza2VsbC1naGMtbW9kIGRlYnVnOlwiLCBtZXNzYWdlcy4uLlxuICAgIHNhdmVsb2cgbWVzc2FnZXMubWFwKEpTT04uc3RyaW5naWZ5KS4uLlxuXG4gIHdhcm46IChtZXNzYWdlcy4uLikgLT5cbiAgICBjb25zb2xlLndhcm4gXCJoYXNrZWxsLWdoYy1tb2Qgd2FybmluZzpcIiwgbWVzc2FnZXMuLi5cbiAgICBzYXZlbG9nIG1lc3NhZ2VzLm1hcChKU09OLnN0cmluZ2lmeSkuLi5cblxuICBnZXREZWJ1Z0xvZzogLT5cbiAgICB0cyA9IERhdGUubm93KClcbiAgICBkZWJ1Z2xvZyA9IGRlYnVnbG9nLmZpbHRlciAoe3RpbWVzdGFtcH0pIC0+ICh0cyAtIHRpbWVzdGFtcCkgPCBsb2dLZWVwXG4gICAgZGVidWdsb2cubWFwICh7dGltZXN0YW1wLCBtZXNzYWdlc30pIC0+XG4gICAgICBcIiN7KHRpbWVzdGFtcCAtIHRzKSAvIDEwMDB9czogI3ttZXNzYWdlcy5qb2luICcsJ31cIlxuICAgIC5qb2luIEVPTFxuXG4gIGdldFJvb3REaXJGYWxsYmFjazogSHNVdGlsLmdldFJvb3REaXJGYWxsYmFja1xuXG4gIGdldFJvb3REaXI6IEhzVXRpbC5nZXRSb290RGlyXG5cbiAgaXNEaXJlY3Rvcnk6IEhzVXRpbC5pc0RpcmVjdG9yeVxuXG4gIGV4ZWNQcm9taXNlOiAoY21kLCBhcmdzLCBvcHRzLCBzdGRpbikgLT5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSAtPlxuICAgICAgVXRpbC5kZWJ1ZyBcIlJ1bm5pbmcgI3tjbWR9ICN7YXJnc30gd2l0aCBvcHRzID0gXCIsIG9wdHNcbiAgICAgIGNoaWxkID0gQ1AuZXhlY0ZpbGUgY21kLCBhcmdzLCBvcHRzLCAoZXJyb3IsIHN0ZG91dCwgc3RkZXJyKSAtPlxuICAgICAgICBVdGlsLndhcm4gc3RkZXJyIGlmIHN0ZGVyclxuICAgICAgICBpZiBlcnJvcj9cbiAgICAgICAgICBVdGlsLndhcm4oXCJSdW5uaW5nICN7Y21kfSAje2FyZ3N9IGZhaWxlZCB3aXRoIFwiLCBlcnJvcilcbiAgICAgICAgICBVdGlsLndhcm4gc3Rkb3V0IGlmIHN0ZG91dFxuICAgICAgICAgIGVycm9yLnN0YWNrID0gKG5ldyBFcnJvcikuc3RhY2tcbiAgICAgICAgICByZWplY3QgZXJyb3JcbiAgICAgICAgZWxzZVxuICAgICAgICAgIFV0aWwuZGVidWcgXCJHb3QgcmVzcG9uc2UgZnJvbSAje2NtZH0gI3thcmdzfVwiLCBzdGRvdXQ6IHN0ZG91dCwgc3RkZXJyOiBzdGRlcnJcbiAgICAgICAgICByZXNvbHZlIHN0ZG91dFxuICAgICAgaWYgc3RkaW4/XG4gICAgICAgIFV0aWwuZGVidWcgXCJzZW5kaW5nIHN0ZGluIHRleHQgdG8gI3tjbWR9ICN7YXJnc31cIlxuICAgICAgICBjaGlsZC5zdGRpbi53cml0ZSBzdGRpblxuXG4gIGdldENhYmFsU2FuZGJveDogKHJvb3RQYXRoKSAtPlxuICAgIFV0aWwuZGVidWcoXCJMb29raW5nIGZvciBjYWJhbCBzYW5kYm94Li4uXCIpXG4gICAgVXRpbC5wYXJzZVNhbmRib3hDb25maWcoXCIje3Jvb3RQYXRofSN7c2VwfWNhYmFsLnNhbmRib3guY29uZmlnXCIpXG4gICAgLnRoZW4gKHNiYykgLT5cbiAgICAgIGlmIHNiYz9bJ2luc3RhbGwtZGlycyddP1snYmluZGlyJ10/XG4gICAgICAgIHNhbmRib3ggPSBzYmNbJ2luc3RhbGwtZGlycyddWydiaW5kaXInXVxuICAgICAgICBVdGlsLmRlYnVnKFwiRm91bmQgY2FiYWwgc2FuZGJveDogXCIsIHNhbmRib3gpXG4gICAgICAgIGlmIFV0aWwuaXNEaXJlY3Rvcnkoc2FuZGJveClcbiAgICAgICAgICBzYW5kYm94XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBVdGlsLndhcm4oXCJDYWJhbCBzYW5kYm94IFwiLCBzYW5kYm94LCBcIiBpcyBub3QgYSBkaXJlY3RvcnlcIilcbiAgICAgIGVsc2VcbiAgICAgICAgVXRpbC53YXJuKFwiTm8gY2FiYWwgc2FuZGJveCBmb3VuZFwiKVxuXG4gIGdldFN0YWNrU2FuZGJveDogKHJvb3RQYXRoLCBhcGQsIGVudikgLT5cbiAgICBVdGlsLmRlYnVnKFwiTG9va2luZyBmb3Igc3RhY2sgc2FuZGJveC4uLlwiKVxuICAgIGVudi5QQVRIID0gam9pblBhdGgoYXBkKVxuICAgIFV0aWwuZGVidWcoXCJSdW5uaW5nIHN0YWNrIHdpdGggUEFUSCBcIiwgZW52LlBBVEgpXG4gICAgVXRpbC5leGVjUHJvbWlzZSAnc3RhY2snLCBbJ3BhdGgnLCAnLS1zbmFwc2hvdC1pbnN0YWxsLXJvb3QnLCAnLS1sb2NhbC1pbnN0YWxsLXJvb3QnLCAnLS1iaW4tcGF0aCddLFxuICAgICAgZW5jb2Rpbmc6ICd1dGYtOCdcbiAgICAgIHN0ZGlvOiAncGlwZSdcbiAgICAgIGN3ZDogcm9vdFBhdGhcbiAgICAgIGVudjogZW52XG4gICAgICB0aW1lb3V0OiBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZ2hjLW1vZC5pbml0VGltZW91dCcpICogMTAwMFxuICAgIC50aGVuIChvdXQpIC0+XG4gICAgICBsaW5lcyA9IG91dC5zcGxpdChFT0wpXG4gICAgICBzaXIgPSBsaW5lcy5maWx0ZXIoKGwpIC0+IGwuc3RhcnRzV2l0aCgnc25hcHNob3QtaW5zdGFsbC1yb290OiAnKSlbMF0uc2xpY2UoMjMpICsgXCIje3NlcH1iaW5cIlxuICAgICAgbGlyID0gbGluZXMuZmlsdGVyKChsKSAtPiBsLnN0YXJ0c1dpdGgoJ2xvY2FsLWluc3RhbGwtcm9vdDogJykpWzBdLnNsaWNlKDIwKSArIFwiI3tzZXB9YmluXCJcbiAgICAgIGJwID1cbiAgICAgICAgIGxpbmVzLmZpbHRlcigobCkgLT4gbC5zdGFydHNXaXRoKCdiaW4tcGF0aDogJykpWzBdLnNsaWNlKDEwKS5zcGxpdChkZWxpbWl0ZXIpLmZpbHRlciAocCkgLT5cbiAgICAgICAgICAgbm90ICgocCBpcyBzaXIpIG9yIChwIGlzIGxpcikgb3IgKHAgaW4gYXBkKSlcbiAgICAgIFV0aWwuZGVidWcoXCJGb3VuZCBzdGFjayBzYW5kYm94IFwiLCBsaXIsIHNpciwgYnAuLi4pXG4gICAgICByZXR1cm4gW2xpciwgc2lyLCBicC4uLl1cbiAgICAuY2F0Y2ggKGVycikgLT5cbiAgICAgIFV0aWwud2FybihcIk5vIHN0YWNrIHNhbmRib3ggZm91bmQgYmVjYXVzZSBcIiwgZXJyKVxuXG4gIGdldFByb2Nlc3NPcHRpb25zOiAocm9vdFBhdGgpID0+XG4gICAgcm9vdFBhdGggPz0gVXRpbC5nZXRSb290RGlyRmFsbGJhY2soKS5nZXRQYXRoKClcbiAgICAjY2FjaGVcbiAgICBAcHJvY2Vzc09wdGlvbnNDYWNoZSA/PSBuZXcgTWFwKClcbiAgICBpZiBAcHJvY2Vzc09wdGlvbnNDYWNoZS5oYXMocm9vdFBhdGgpXG4gICAgICByZXR1cm4gQHByb2Nlc3NPcHRpb25zQ2FjaGUuZ2V0KHJvb3RQYXRoKVxuXG4gICAgVXRpbC5kZWJ1ZyBcImdldFByb2Nlc3NPcHRpb25zKCN7cm9vdFBhdGh9KVwiXG4gICAgZW52ID0gb2JqY2xvbmUocHJvY2Vzcy5lbnYpXG5cbiAgICBpZiBwcm9jZXNzLnBsYXRmb3JtIGlzICd3aW4zMidcbiAgICAgIFBBVEggPSBbXVxuICAgICAgY2FwTWFzayA9IChzdHIsIG1hc2spIC0+XG4gICAgICAgIGEgPSBzdHIuc3BsaXQgJydcbiAgICAgICAgZm9yIGMsIGkgaW4gYVxuICAgICAgICAgIGlmIG1hc2sgJiBNYXRoLnBvdygyLCBpKVxuICAgICAgICAgICAgYVtpXSA9IGFbaV0udG9VcHBlckNhc2UoKVxuICAgICAgICByZXR1cm4gYS5qb2luICcnXG4gICAgICBmb3IgbSBpbiBbMGIxMTExLi4wXVxuICAgICAgICB2biA9IGNhcE1hc2soXCJwYXRoXCIsIG0pXG4gICAgICAgIGlmIGVudlt2bl0/XG4gICAgICAgICAgUEFUSC5wdXNoIGVudlt2bl1cbiAgICAgIGVudi5QQVRIID0gUEFUSC5qb2luIGRlbGltaXRlclxuXG4gICAgZW52LlBBVEggPz0gXCJcIlxuXG4gICAgYXBkID0gYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWdoYy1tb2QuYWRkaXRpb25hbFBhdGhEaXJlY3RvcmllcycpXG4gICAgICAgICAgLmNvbmNhdCBlbnYuUEFUSC5zcGxpdCBkZWxpbWl0ZXJcbiAgICBzYmQgPSBmYWxzZVxuICAgIGNhYmFsU2FuZGJveCA9XG4gICAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZ2hjLW1vZC5jYWJhbFNhbmRib3gnKVxuICAgICAgICBVdGlsLmdldENhYmFsU2FuZGJveChyb290UGF0aClcbiAgICAgIGVsc2VcbiAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkgIyB1bmRlZmluZWRcbiAgICBzdGFja1NhbmRib3ggPVxuICAgICAgaWYgYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWdoYy1tb2Quc3RhY2tTYW5kYm94JylcbiAgICAgICAgVXRpbC5nZXRTdGFja1NhbmRib3gocm9vdFBhdGgsIGFwZCwgb2JqY2xvbmUoZW52KSlcbiAgICAgIGVsc2VcbiAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkgIyB1bmRlZmluZWRcbiAgICByZXMgPVxuICAgICAgUHJvbWlzZS5hbGwoW2NhYmFsU2FuZGJveCwgc3RhY2tTYW5kYm94XSlcbiAgICAgIC50aGVuIChbY2FiYWxTYW5kYm94RGlyLCBzdGFja1NhbmRib3hEaXJzXSkgLT5cbiAgICAgICAgbmV3cCA9IFtdXG4gICAgICAgIGlmIGNhYmFsU2FuZGJveERpcj9cbiAgICAgICAgICBuZXdwLnB1c2ggY2FiYWxTYW5kYm94RGlyXG4gICAgICAgIGlmIHN0YWNrU2FuZGJveERpcnM/XG4gICAgICAgICAgbmV3cC5wdXNoIHN0YWNrU2FuZGJveERpcnMuLi5cbiAgICAgICAgbmV3cC5wdXNoIGFwZC4uLlxuICAgICAgICBlbnYuUEFUSCA9IGpvaW5QYXRoKG5ld3ApXG4gICAgICAgIFV0aWwuZGVidWcgXCJQQVRIID0gI3tlbnYuUEFUSH1cIlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGN3ZDogcm9vdFBhdGhcbiAgICAgICAgICBlbnY6IGVudlxuICAgICAgICAgIGVuY29kaW5nOiAndXRmLTgnXG4gICAgICAgICAgbWF4QnVmZmVyOiBJbmZpbml0eVxuICAgICAgICB9XG4gICAgQHByb2Nlc3NPcHRpb25zQ2FjaGUuc2V0KHJvb3RQYXRoLCByZXMpXG4gICAgcmV0dXJuIHJlc1xuXG4gIGdldFN5bWJvbEF0UG9pbnQ6IChlZGl0b3IsIHBvaW50KSAtPlxuICAgIGluU2NvcGUgPSAoc2NvcGUsIHBvaW50KSAtPlxuICAgICAgZWRpdG9yXG4gICAgICAuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24ocG9pbnQpXG4gICAgICAuZ2V0U2NvcGVzQXJyYXkoKVxuICAgICAgLnNvbWUgKHYpIC0+IHYgaXMgc2NvcGVcblxuICAgIHRiID0gZWRpdG9yLmdldEJ1ZmZlcigpXG4gICAgbGluZSA9IHRiLnJhbmdlRm9yUm93IHBvaW50LnJvd1xuICAgIGZpbmQgPSAodGVzdCkgLT5cbiAgICAgIHN0YXJ0ID0gZW5kID0gcG9pbnRcbiAgICAgIHN0YXJ0XyA9IHN0YXJ0LnRyYW5zbGF0ZSBbMCwgLTFdXG4gICAgICB3aGlsZSB0ZXN0KHN0YXJ0XykgYW5kIHN0YXJ0Xy5pc0dyZWF0ZXJUaGFuT3JFcXVhbChsaW5lLnN0YXJ0KVxuICAgICAgICBzdGFydCA9IHN0YXJ0X1xuICAgICAgICBzdGFydF8gPSBzdGFydC50cmFuc2xhdGUgWzAsIC0xXVxuICAgICAgd2hpbGUgdGVzdChlbmQpIGFuZCBlbmQuaXNMZXNzVGhhbihsaW5lLmVuZClcbiAgICAgICAgZW5kID0gZW5kLnRyYW5zbGF0ZSBbMCwgMV1cbiAgICAgIHJldHVybiBuZXcgUmFuZ2Ugc3RhcnQsIGVuZFxuXG4gICAgcmVnZXggPSAvW1xcdycuXS9cbiAgICBzY29wZXMgPSBbXG4gICAgICAna2V5d29yZC5vcGVyYXRvci5oYXNrZWxsJ1xuICAgICAgJ2VudGl0eS5uYW1lLmZ1bmN0aW9uLmluZml4Lmhhc2tlbGwnXG4gICAgXVxuICAgIGZvciBzY29wZSBpbiBzY29wZXNcbiAgICAgIHJhbmdlID0gZmluZCAocCkgLT4gaW5TY29wZShzY29wZSwgcClcbiAgICAgIGlmIG5vdCByYW5nZS5pc0VtcHR5KClcbiAgICAgICAgc3ltYm9sID0gdGIuZ2V0VGV4dEluUmFuZ2UgcmFuZ2VcbiAgICAgICAgcmV0dXJuIHtzY29wZSwgcmFuZ2UsIHN5bWJvbH1cblxuICAgICMgZWxzZVxuICAgIHJhbmdlID0gZmluZCAoKHApIC0+IHRiLmdldFRleHRJblJhbmdlKFtwLCBwLnRyYW5zbGF0ZShbMCwgMV0pXSkubWF0Y2gocmVnZXgpPylcbiAgICBzeW1ib2wgPSB0Yi5nZXRUZXh0SW5SYW5nZSByYW5nZVxuICAgIHJldHVybiB7cmFuZ2UsIHN5bWJvbH1cblxuICBnZXRTeW1ib2xJblJhbmdlOiAoZWRpdG9yLCBjcmFuZ2UpIC0+XG4gICAgYnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpXG4gICAgaWYgY3JhbmdlLmlzRW1wdHkoKVxuICAgICAgVXRpbC5nZXRTeW1ib2xBdFBvaW50IGVkaXRvciwgY3JhbmdlLnN0YXJ0XG4gICAgZWxzZVxuICAgICAgc3ltYm9sOiBidWZmZXIuZ2V0VGV4dEluUmFuZ2UgY3JhbmdlXG4gICAgICByYW5nZTogY3JhbmdlXG5cblxuICB3aXRoVGVtcEZpbGU6IChjb250ZW50cywgdXJpLCBnZW4pIC0+XG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICAgIFRlbXAub3BlbiB7cHJlZml4OiAnaGFza2VsbC1naGMtbW9kJywgc3VmZml4OiBleHRuYW1lIHVyaSBvciBcIi5oc1wifSxcbiAgICAgICAgKGVyciwgaW5mbykgLT5cbiAgICAgICAgICBpZiBlcnJcbiAgICAgICAgICAgIHJlamVjdCBlcnJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXNvbHZlIGluZm9cbiAgICAudGhlbiAoaW5mbykgLT5cbiAgICAgIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgICAgIEZTLndyaXRlIGluZm8uZmQsIGNvbnRlbnRzLCAoZXJyKSAtPlxuICAgICAgICAgIGlmIGVyclxuICAgICAgICAgICAgcmVqZWN0IGVyclxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGdlbihpbmZvLnBhdGgpLnRoZW4gKHJlcykgLT5cbiAgICAgICAgICAgICAgRlMuY2xvc2UgaW5mby5mZCwgLT4gRlMudW5saW5rIGluZm8ucGF0aFxuICAgICAgICAgICAgICByZXNvbHZlIHJlcy5tYXAgKGxpbmUpIC0+XG4gICAgICAgICAgICAgICAgbGluZS5zcGxpdChpbmZvLnBhdGgpLmpvaW4odXJpKVxuXG4gIG1rRXJyb3I6IChuYW1lLCBtZXNzYWdlKSAtPlxuICAgIGVyciA9IG5ldyBFcnJvciBtZXNzYWdlXG4gICAgZXJyLm5hbWUgPSBuYW1lXG4gICAgcmV0dXJuIGVyclxuXG4gIHBhcnNlU2FuZGJveENvbmZpZzogKGZpbGUpIC0+XG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICAgIEZTLnJlYWRGaWxlIGZpbGUsIGVuY29kaW5nOiAndXRmLTgnLCAoZXJyLCBzYmMpIC0+XG4gICAgICAgIGlmIGVycj9cbiAgICAgICAgICByZWplY3QgZXJyXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXNvbHZlIHNiY1xuICAgIC50aGVuIChzYmMpIC0+XG4gICAgICB2YXJzID0ge31cbiAgICAgIHNjb3BlID0gdmFyc1xuICAgICAgcnYgPSAodikgLT5cbiAgICAgICAgZm9yIGsxLCB2MSBvZiBzY29wZVxuICAgICAgICAgIHYgPSB2LnNwbGl0KFwiJCN7azF9XCIpLmpvaW4odjEpXG4gICAgICAgIHJldHVybiB2XG4gICAgICBzYmMuc3BsaXQoL1xccj9cXG58XFxyLykuZm9yRWFjaCAobGluZSkgLT5cbiAgICAgICAgdW5sZXNzIGxpbmUubWF0Y2goL15cXHMqLS0vKSBvciBsaW5lLm1hdGNoKC9eXFxzKiQvKVxuICAgICAgICAgIFtsXSA9IGxpbmUuc3BsaXQgLy0tL1xuICAgICAgICAgIGlmIG0gPSBsaW5lLm1hdGNoIC9eXFxzKihbXFx3LV0rKTpcXHMqKC4qKVxccyokL1xuICAgICAgICAgICAgW18sIG5hbWUsIHZhbF0gPSBtXG4gICAgICAgICAgICBzY29wZVtuYW1lXSA9IHJ2KHZhbClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBuZXdzY29wZSA9IHt9XG4gICAgICAgICAgICBzY29wZVtsaW5lXSA9IG5ld3Njb3BlXG4gICAgICAgICAgICBzY29wZSA9IG5ld3Njb3BlXG4gICAgICByZXR1cm4gdmFyc1xuICAgIC5jYXRjaCAoZXJyKSAtPlxuICAgICAgVXRpbC53YXJuIFwiUmVhZGluZyBjYWJhbCBzYW5kYm94IGNvbmZpZyBmYWlsZWQgd2l0aCBcIiwgZXJyXG5cbiAgIyBBIGRpcnR5IGhhY2sgdG8gd29yayB3aXRoIHRhYnNcbiAgdGFiU2hpZnRGb3JQb2ludDogKGJ1ZmZlciwgcG9pbnQpIC0+XG4gICAgY29sdW1uU2hpZnQgPSA3ICogKGJ1ZmZlci5saW5lRm9yUm93KHBvaW50LnJvdykuc2xpY2UoMCwgcG9pbnQuY29sdW1uKS5tYXRjaCgvXFx0L2cpPy5sZW5ndGggb3IgMClcbiAgICBuZXcgUG9pbnQocG9pbnQucm93LCBwb2ludC5jb2x1bW4gKyBjb2x1bW5TaGlmdClcblxuICB0YWJTaGlmdEZvclJhbmdlOiAoYnVmZmVyLCByYW5nZSkgLT5cbiAgICBzdGFydCA9IFV0aWwudGFiU2hpZnRGb3JQb2ludChidWZmZXIsIHJhbmdlLnN0YXJ0KVxuICAgIGVuZCA9IFV0aWwudGFiU2hpZnRGb3JQb2ludChidWZmZXIsIHJhbmdlLmVuZClcbiAgICBuZXcgUmFuZ2Uoc3RhcnQsIGVuZClcblxuICB0YWJVbnNoaWZ0Rm9yUG9pbnQ6IChidWZmZXIsIHBvaW50KSAtPlxuICAgIGxpbmUgPSBidWZmZXIubGluZUZvclJvdyhwb2ludC5yb3cpXG4gICAgY29sdW1ubCA9IDBcbiAgICBjb2x1bW5yID0gcG9pbnQuY29sdW1uXG4gICAgd2hpbGUoY29sdW1ubCA8IGNvbHVtbnIpXG4gICAgICBicmVhayB1bmxlc3MgbGluZT8gYW5kIGxpbmVbY29sdW1ubF0/XG4gICAgICBpZiBsaW5lW2NvbHVtbmxdIGlzICdcXHQnXG4gICAgICAgIGNvbHVtbnIgLT0gN1xuICAgICAgY29sdW1ubCArPSAxXG4gICAgbmV3IFBvaW50KHBvaW50LnJvdywgY29sdW1ucilcblxuICB0YWJVbnNoaWZ0Rm9yUmFuZ2U6IChidWZmZXIsIHJhbmdlKSAtPlxuICAgIHN0YXJ0ID0gVXRpbC50YWJVbnNoaWZ0Rm9yUG9pbnQoYnVmZmVyLCByYW5nZS5zdGFydClcbiAgICBlbmQgPSBVdGlsLnRhYlVuc2hpZnRGb3JQb2ludChidWZmZXIsIHJhbmdlLmVuZClcbiAgICBuZXcgUmFuZ2Uoc3RhcnQsIGVuZClcbiJdfQ==

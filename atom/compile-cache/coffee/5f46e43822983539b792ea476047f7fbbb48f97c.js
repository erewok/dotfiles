(function() {
  var CP, CompositeDisposable, Directory, EOL, EOT, Emitter, GhcModiProcessReal, InteractiveProcess, Util, debug, mkError, warn, withTempFile, _ref, _ref1,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ref = require('atom'), Emitter = _ref.Emitter, CompositeDisposable = _ref.CompositeDisposable, Directory = _ref.Directory;

  CP = require('child_process');

  InteractiveProcess = require('./interactive-process');

  _ref1 = Util = require('../util'), debug = _ref1.debug, warn = _ref1.warn, mkError = _ref1.mkError, withTempFile = _ref1.withTempFile, EOT = _ref1.EOT;

  EOL = require('os').EOL;

  module.exports = GhcModiProcessReal = (function() {
    function GhcModiProcessReal(caps, rootDir, options) {
      this.caps = caps;
      this.rootDir = rootDir;
      this.options = options;
      this.runModiCmd = __bind(this.runModiCmd, this);
      this.runModCmd = __bind(this.runModCmd, this);
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.emitter = new Emitter);
    }

    GhcModiProcessReal.prototype.run = function(_arg) {
      var P, args, command, dashArgs, fun, interactive, suppressErrors, text, uri;
      interactive = _arg.interactive, command = _arg.command, text = _arg.text, uri = _arg.uri, dashArgs = _arg.dashArgs, args = _arg.args, suppressErrors = _arg.suppressErrors;
      if (args == null) {
        args = [];
      }
      if (dashArgs == null) {
        dashArgs = [];
      }
      if (atom.config.get('haskell-ghc-mod.lowMemorySystem')) {
        interactive = atom.config.get('haskell-ghc-mod.enableGhcModi');
      }
      if (typeof dashArgs === 'function') {
        dashArgs = dashArgs(this.caps);
      }
      if (this.caps.optparse) {
        args = dashArgs.concat(['--']).concat(args);
      } else {
        args = dashArgs.concat(args);
      }
      fun = interactive ? this.runModiCmd : this.runModCmd;
      P = (text != null) && !this.caps.fileMap ? withTempFile(text, uri, function(tempuri) {
        return fun({
          command: command,
          uri: tempuri,
          args: args
        });
      }) : fun({
        command: command,
        text: text,
        uri: uri,
        args: args
      });
      return P["catch"]((function(_this) {
        return function(err) {
          debug(err);
          if (err.name === 'InteractiveActionTimeout') {
            atom.notifications.addError("Haskell-ghc-mod: ghc-mod " + (interactive != null ? 'interactive ' : '') + "command " + command + " timed out. You can try to fix it by raising 'Interactive Action Timeout' setting in haskell-ghc-mod settings.", {
              detail: "caps: " + (JSON.stringify(_this.caps)) + "\nURI: " + uri + "\nArgs: " + args + "\nmessage: " + err.message,
              stack: err.stack,
              dismissable: true
            });
          } else if (!suppressErrors) {
            atom.notifications.addFatalError("Haskell-ghc-mod: ghc-mod " + (interactive != null ? 'interactive ' : '') + "command " + command + " failed with error " + err.name, {
              detail: "caps: " + (JSON.stringify(_this.caps)) + "\nURI: " + uri + "\nArgs: " + args + "\nmessage: " + err.message + "\nlog:\n" + (Util.getDebugLog()),
              stack: err.stack,
              dismissable: true
            });
          } else {
            console.error(err);
          }
          return [];
        };
      })(this));
    };

    GhcModiProcessReal.prototype.spawnProcess = function() {
      var modPath;
      if (!atom.config.get('haskell-ghc-mod.enableGhcModi')) {
        return;
      }
      debug("Checking for ghc-modi in " + (this.rootDir.getPath()));
      if (this.proc != null) {
        debug("Found running ghc-modi instance for " + (this.rootDir.getPath()));
        return this.proc;
      }
      debug("Spawning new ghc-modi instance for " + (this.rootDir.getPath()) + " with", this.options);
      modPath = atom.config.get('haskell-ghc-mod.ghcModPath');
      this.proc = new InteractiveProcess(modPath, ['legacy-interactive'], this.options, this.caps);
      this.proc.onExit((function(_this) {
        return function(code) {
          debug("ghc-modi for " + (_this.rootDir.getPath()) + " ended with " + code);
          return _this.proc = null;
        };
      })(this));
      return this.proc;
    };

    GhcModiProcessReal.prototype.runModCmd = function(_arg) {
      var args, cmd, command, err, modPath, result, stdin, text, uri;
      command = _arg.command, text = _arg.text, uri = _arg.uri, args = _arg.args;
      modPath = atom.config.get('haskell-ghc-mod.ghcModPath');
      result = [];
      err = [];
      if (uri != null) {
        cmd = [command, uri].concat(args);
      } else {
        cmd = [command].concat(args);
      }
      if (text != null) {
        cmd = ['--map-file', uri].concat(cmd);
      }
      if (text != null) {
        stdin = "" + text + EOT;
      }
      return Util.execPromise(modPath, cmd, this.options, stdin).then(function(stdout) {
        return stdout.split(EOL).slice(0, -1).map(function(line) {
          return line.replace(/\0/g, '\n');
        });
      });
    };

    GhcModiProcessReal.prototype.runModiCmd = function(o) {
      var args, command, proc, text, uri;
      command = o.command, text = o.text, uri = o.uri, args = o.args;
      debug("Trying to run ghc-modi in " + (this.rootDir.getPath()));
      proc = this.spawnProcess();
      if (!proc) {
        debug("Failed. Falling back to ghc-mod");
        return this.runModCmd(o);
      }
      if ((uri != null) && !this.caps.quoteArgs) {
        uri = this.rootDir.relativize(uri);
      }
      return proc["do"](function(interact) {
        return Promise.resolve().then(function() {
          if (text != null) {
            return interact("map-file", [uri], text);
          }
        }).then(function() {
          return interact(command, uri != null ? [uri].concat(args) : args);
        }).then(function(res) {
          if (text != null) {
            return interact("unmap-file", [uri]).then(function() {
              return res;
            });
          } else {
            return res;
          }
        })["catch"](function(err) {
          try {
            interact("unmap-file", [uri]);
          } catch (_error) {}
          throw err;
        });
      });
    };

    GhcModiProcessReal.prototype.killProcess = function() {
      if (this.proc == null) {
        return;
      }
      debug("Killing ghc-modi process for " + (this.rootDir.getPath()));
      this.proc.kill();
      return this.proc = null;
    };

    GhcModiProcessReal.prototype.destroy = function() {
      if (this.emitter == null) {
        return;
      }
      debug("GhcModiProcessBase destroying");
      this.killProcess();
      this.emitter.emit('did-destroy');
      this.emitter = null;
      return this.disposables.dispose();
    };

    GhcModiProcessReal.prototype.onDidDestroy = function(callback) {
      if (this.emitter == null) {
        return;
      }
      return this.emitter.on('did-destroy', callback);
    };

    return GhcModiProcessReal;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL2doYy1tb2QvZ2hjLW1vZGktcHJvY2Vzcy1yZWFsLmNvZmZlZSIKICBdLAogICJuYW1lcyI6IFtdLAogICJtYXBwaW5ncyI6ICJBQUFBO0FBQUEsTUFBQSxvSkFBQTtJQUFBLGtGQUFBOztBQUFBLEVBQUEsT0FBNEMsT0FBQSxDQUFRLE1BQVIsQ0FBNUMsRUFBQyxlQUFBLE9BQUQsRUFBVSwyQkFBQSxtQkFBVixFQUErQixpQkFBQSxTQUEvQixDQUFBOztBQUFBLEVBQ0EsRUFBQSxHQUFLLE9BQUEsQ0FBUSxlQUFSLENBREwsQ0FBQTs7QUFBQSxFQUVBLGtCQUFBLEdBQXFCLE9BQUEsQ0FBUSx1QkFBUixDQUZyQixDQUFBOztBQUFBLEVBR0EsUUFBNEMsSUFBQSxHQUFPLE9BQUEsQ0FBUSxTQUFSLENBQW5ELEVBQUMsY0FBQSxLQUFELEVBQVEsYUFBQSxJQUFSLEVBQWMsZ0JBQUEsT0FBZCxFQUF1QixxQkFBQSxZQUF2QixFQUFxQyxZQUFBLEdBSHJDLENBQUE7O0FBQUEsRUFJQyxNQUFPLE9BQUEsQ0FBUSxJQUFSLEVBQVAsR0FKRCxDQUFBOztBQUFBLEVBTUEsTUFBTSxDQUFDLE9BQVAsR0FDTTtBQUNTLElBQUEsNEJBQUUsSUFBRixFQUFTLE9BQVQsRUFBbUIsT0FBbkIsR0FBQTtBQUNYLE1BRFksSUFBQyxDQUFBLE9BQUEsSUFDYixDQUFBO0FBQUEsTUFEbUIsSUFBQyxDQUFBLFVBQUEsT0FDcEIsQ0FBQTtBQUFBLE1BRDZCLElBQUMsQ0FBQSxVQUFBLE9BQzlCLENBQUE7QUFBQSxxREFBQSxDQUFBO0FBQUEsbURBQUEsQ0FBQTtBQUFBLE1BQUEsSUFBQyxDQUFBLFdBQUQsR0FBZSxHQUFBLENBQUEsbUJBQWYsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFi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

//# sourceURL=/Users/erewok/.atom/packages/haskell-ghc-mod/lib/ghc-mod/ghc-modi-process-real.coffee

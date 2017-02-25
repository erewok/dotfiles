(function() {
  var CP, CompositeDisposable, Directory, EOL, EOT, Emitter, GhcModiProcessReal, InteractiveProcess, Util, _, debug, mkError, ref, ref1, warn, withTempFile,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ref = require('atom'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable, Directory = ref.Directory;

  CP = require('child_process');

  InteractiveProcess = require('./interactive-process');

  ref1 = Util = require('../util'), debug = ref1.debug, warn = ref1.warn, mkError = ref1.mkError, withTempFile = ref1.withTempFile, EOT = ref1.EOT;

  EOL = require('os').EOL;

  _ = require('underscore-plus');

  module.exports = GhcModiProcessReal = (function() {
    function GhcModiProcessReal(caps, rootDir, options) {
      this.caps = caps;
      this.rootDir = rootDir;
      this.options = options;
      this.runModiCmd = bind(this.runModiCmd, this);
      this.runModCmd = bind(this.runModCmd, this);
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.emitter = new Emitter);
    }

    GhcModiProcessReal.prototype.run = function(arg) {
      var P, args, command, dashArgs, fun, ghcModOptions, ghcOptions, interactive, suppressErrors, text, uri;
      interactive = arg.interactive, command = arg.command, text = arg.text, uri = arg.uri, dashArgs = arg.dashArgs, args = arg.args, suppressErrors = arg.suppressErrors, ghcOptions = arg.ghcOptions, ghcModOptions = arg.ghcModOptions;
      if (args == null) {
        args = [];
      }
      if (dashArgs == null) {
        dashArgs = [];
      }
      if (suppressErrors == null) {
        suppressErrors = false;
      }
      if (ghcOptions == null) {
        ghcOptions = [];
      }
      if (ghcModOptions == null) {
        ghcModOptions = [];
      }
      ghcModOptions = ghcModOptions.concat.apply(ghcModOptions, ghcOptions.map(function(opt) {
        return ['--ghc-option', opt];
      }));
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
          ghcModOptions: ghcModOptions,
          command: command,
          uri: tempuri,
          args: args
        });
      }) : fun({
        ghcModOptions: ghcModOptions,
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

    GhcModiProcessReal.prototype.spawnProcess = function(ghcModOptions) {
      var modPath;
      if (!atom.config.get('haskell-ghc-mod.enableGhcModi')) {
        return Promise.resolve(null);
      }
      debug("Checking for ghc-modi in " + (this.rootDir.getPath()));
      if (this.proc != null) {
        if (!_.isEqual(this.ghcModOptions, ghcModOptions)) {
          debug("Found running ghc-modi instance for " + (this.rootDir.getPath()) + ", but ghcModOptions don't match. Old: ", this.ghcModOptions, ' new: ', ghcModOptions);
          this.proc.kill();
          return new Promise((function(_this) {
            return function(resolve) {
              return _this.proc.onExit(function() {
                return resolve(_this.spawnProcess(ghcModOptions));
              });
            };
          })(this));
        }
        debug("Found running ghc-modi instance for " + (this.rootDir.getPath()));
        return Promise.resolve(this.proc);
      }
      debug("Spawning new ghc-modi instance for " + (this.rootDir.getPath()) + " with", this.options);
      modPath = atom.config.get('haskell-ghc-mod.ghcModPath');
      this.ghcModOptions = ghcModOptions;
      this.proc = new InteractiveProcess(modPath, ghcModOptions.concat(['legacy-interactive']), this.options, this.caps);
      this.proc.disposables.add(this.proc.onExit((function(_this) {
        return function(code) {
          debug("ghc-modi for " + (_this.rootDir.getPath()) + " ended with " + code);
          return _this.proc = null;
        };
      })(this)));
      return Promise.resolve(this.proc);
    };

    GhcModiProcessReal.prototype.runModCmd = function(arg) {
      var args, cmd, command, err, ghcModOptions, modPath, result, stdin, text, uri;
      ghcModOptions = arg.ghcModOptions, command = arg.command, text = arg.text, uri = arg.uri, args = arg.args;
      modPath = atom.config.get('haskell-ghc-mod.ghcModPath');
      result = [];
      err = [];
      if (uri != null) {
        cmd = ghcModOptions.concat([command, uri], args);
      } else {
        cmd = ghcModOptions.concat([command], args);
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
      var args, command, ghcModOptions, text, uri;
      ghcModOptions = o.ghcModOptions, command = o.command, text = o.text, uri = o.uri, args = o.args;
      debug("Trying to run ghc-modi in " + (this.rootDir.getPath()));
      return this.spawnProcess(ghcModOptions).then((function(_this) {
        return function(proc) {
          if (!proc) {
            debug("Failed. Falling back to ghc-mod");
            return _this.runModCmd(o);
          }
          if ((uri != null) && !_this.caps.quoteArgs) {
            uri = _this.rootDir.relativize(uri);
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
              } catch (error) {}
              throw err;
            });
          });
        };
      })(this));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL2doYy1tb2QvZ2hjLW1vZGktcHJvY2Vzcy1yZWFsLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEscUpBQUE7SUFBQTs7RUFBQSxNQUE0QyxPQUFBLENBQVEsTUFBUixDQUE1QyxFQUFDLHFCQUFELEVBQVUsNkNBQVYsRUFBK0I7O0VBQy9CLEVBQUEsR0FBSyxPQUFBLENBQVEsZUFBUjs7RUFDTCxrQkFBQSxHQUFxQixPQUFBLENBQVEsdUJBQVI7O0VBQ3JCLE9BQTRDLElBQUEsR0FBTyxPQUFBLENBQVEsU0FBUixDQUFuRCxFQUFDLGtCQUFELEVBQVEsZ0JBQVIsRUFBYyxzQkFBZCxFQUF1QixnQ0FBdkIsRUFBcUM7O0VBQ3BDLE1BQU8sT0FBQSxDQUFRLElBQVI7O0VBQ1IsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFFSixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1MsNEJBQUMsSUFBRCxFQUFRLE9BQVIsRUFBa0IsT0FBbEI7TUFBQyxJQUFDLENBQUEsT0FBRDtNQUFPLElBQUMsQ0FBQSxVQUFEO01BQVUsSUFBQyxDQUFBLFVBQUQ7OztNQUM3QixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUk7TUFDbkIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSSxPQUFoQztJQUZXOztpQ0FJYixHQUFBLEdBQUssU0FBQyxHQUFEO0FBQ0gsVUFBQTtNQURLLCtCQUFhLHVCQUFTLGlCQUFNLGVBQUsseUJBQVUsaUJBQU0scUNBQWdCLDZCQUFZOztRQUNsRixPQUFROzs7UUFDUixXQUFZOzs7UUFDWixpQkFBa0I7OztRQUNsQixhQUFjOzs7UUFDZCxnQkFBaUI7O01BQ2pCLGFBQUEsR0FBZ0IsYUFBYSxDQUFDLE1BQWQsc0JBQXNCLFVBQVUs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SUFBQyxDQUFBLE9BQUQsR0FBVzthQUNYLElBQUMsQ0FBQSxXQUFXLENBQUMsT0FBYixDQUFBO0lBTk87O2lDQVFULFlBQUEsR0FBYyxTQUFDLFFBQUQ7TUFDWixJQUFjLG9CQUFkO0FBQUEsZUFBQTs7YUFDQSxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxhQUFaLEVBQTJCLFFBQTNCO0lBRlk7Ozs7O0FBdkpoQiIsInNvdXJjZXNDb250ZW50IjpbIntFbWl0dGVyLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXJlY3Rvcnl9ID0gcmVxdWlyZSgnYXRvbScpXG5DUCA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKVxuSW50ZXJhY3RpdmVQcm9jZXNzID0gcmVxdWlyZSAnLi9pbnRlcmFjdGl2ZS1wcm9jZXNzJ1xue2RlYnVnLCB3YXJuLCBta0Vycm9yLCB3aXRoVGVtcEZpbGUsIEVPVH0gPSBVdGlsID0gcmVxdWlyZSAnLi4vdXRpbCdcbntFT0x9ID0gcmVxdWlyZSgnb3MnKVxuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgR2hjTW9kaVByb2Nlc3NSZWFsXG4gIGNvbnN0cnVjdG9yOiAoQGNhcHMsIEByb290RGlyLCBAb3B0aW9ucykgLT5cbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuXG4gIHJ1bjogKHtpbnRlcmFjdGl2ZSwgY29tbWFuZCwgdGV4dCwgdXJpLCBkYXNoQXJncywgYXJncywgc3VwcHJlc3NFcnJvcnMsIGdoY09wdGlvbnMsIGdoY01vZE9wdGlvbnN9KSAtPlxuICAgIGFyZ3MgPz0gW11cbiAgICBkYXNoQXJncyA/PSBbXVxuICAgIHN1cHByZXNzRXJyb3JzID89IGZhbHNlXG4gICAgZ2hjT3B0aW9ucyA/PSBbXVxuICAgIGdoY01vZE9wdGlvbnMgPz0gW11cbiAgICBnaGNNb2RPcHRpb25zID0gZ2hjTW9kT3B0aW9ucy5jb25jYXQgKGdoY09wdGlvbnMubWFwIChvcHQpIC0+IFsnLS1naGMtb3B0aW9uJywgb3B0XSkuLi5cbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZ2hjLW1vZC5sb3dNZW1vcnlTeXN0ZW0nKVxuICAgICAgaW50ZXJhY3RpdmUgPSBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZ2hjLW1vZC5lbmFibGVHaGNNb2RpJylcbiAgICBpZiB0eXBlb2YoZGFzaEFyZ3MpIGlzICdmdW5jdGlvbidcbiAgICAgIGRhc2hBcmdzID0gZGFzaEFyZ3MoQGNhcHMpXG4gICAgaWYgQGNhcHMub3B0cGFyc2VcbiAgICAgIGFyZ3MgPSBkYXNoQXJncy5jb25jYXQoWyctLSddKS5jb25jYXQoYXJncylcbiAgICBlbHNlXG4gICAgICBhcmdzID0gZGFzaEFyZ3MuY29uY2F0KGFyZ3MpXG4gICAgZnVuID0gaWYgaW50ZXJhY3RpdmUgdGhlbiBAcnVuTW9kaUNtZCBlbHNlIEBydW5Nb2RDbWRcbiAgICBQID1cbiAgICAgIGlmIHRleHQ/IGFuZCBub3QgQGNhcHMuZmlsZU1hcFxuICAgICAgICB3aXRoVGVtcEZpbGUgdGV4dCwgdXJpLCAodGVtcHVyaSkgLT5cbiAgICAgICAgICBmdW4ge2doY01vZE9wdGlvbnMsIGNvbW1hbmQsIHVyaTogdGVtcHVyaSwgYXJnc31cbiAgICAgIGVsc2VcbiAgICAgICAgZnVuIHtnaGNNb2RPcHRpb25zLCBjb21tYW5kLCB0ZXh0LCB1cmksIGFyZ3N9XG4gICAgUC5jYXRjaCAoZXJyKSA9PlxuICAgICAgZGVidWcgZXJyXG4gICAgICBpZiBlcnIubmFtZSBpcyAnSW50ZXJhY3RpdmVBY3Rpb25UaW1lb3V0J1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJcbiAgICAgICAgICBIYXNrZWxsLWdoYy1tb2Q6IGdoYy1tb2RcbiAgICAgICAgICAje2lmIGludGVyYWN0aXZlPyB0aGVuICdpbnRlcmFjdGl2ZSAnIGVsc2UgJyd9Y29tbWFuZCAje2NvbW1hbmR9XG4gICAgICAgICAgdGltZWQgb3V0LiBZb3UgY2FuIHRyeSB0byBmaXggaXQgYnkgcmFpc2luZyAnSW50ZXJhY3RpdmUgQWN0aW9uXG4gICAgICAgICAgVGltZW91dCcgc2V0dGluZyBpbiBoYXNrZWxsLWdoYy1tb2Qgc2V0dGluZ3MuXCIsXG4gICAgICAgICAgZGV0YWlsOiBcIlwiXCJcbiAgICAgICAgICAgIGNhcHM6ICN7SlNPTi5zdHJpbmdpZnkoQGNhcHMpfVxuICAgICAgICAgICAgVVJJOiAje3VyaX1cbiAgICAgICAgICAgIEFyZ3M6ICN7YXJnc31cbiAgICAgICAgICAgIG1lc3NhZ2U6ICN7ZXJyLm1lc3NhZ2V9XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBzdGFjazogZXJyLnN0YWNrXG4gICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgIGVsc2UgaWYgbm90IHN1cHByZXNzRXJyb3JzXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRGYXRhbEVycm9yIFwiXG4gICAgICAgICAgSGFza2VsbC1naGMtbW9kOiBnaGMtbW9kXG4gICAgICAgICAgI3tpZiBpbnRlcmFjdGl2ZT8gdGhlbiAnaW50ZXJhY3RpdmUgJyBlbHNlICcnfWNvbW1hbmQgI3tjb21tYW5kfVxuICAgICAgICAgIGZhaWxlZCB3aXRoIGVycm9yICN7ZXJyLm5hbWV9XCIsXG4gICAgICAgICAgZGV0YWlsOiBcIlwiXCJcbiAgICAgICAgICAgIGNhcHM6ICN7SlNPTi5zdHJpbmdpZnkoQGNhcHMpfVxuICAgICAgICAgICAgVVJJOiAje3VyaX1cbiAgICAgICAgICAgIEFyZ3M6ICN7YXJnc31cbiAgICAgICAgICAgIG1lc3NhZ2U6ICN7ZXJyLm1lc3NhZ2V9XG4gICAgICAgICAgICBsb2c6XG4gICAgICAgICAgICAje1V0aWwuZ2V0RGVidWdMb2coKX1cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIHN0YWNrOiBlcnIuc3RhY2tcbiAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgZWxzZVxuICAgICAgICBjb25zb2xlLmVycm9yIGVyclxuICAgICAgcmV0dXJuIFtdXG5cbiAgc3Bhd25Qcm9jZXNzOiAoZ2hjTW9kT3B0aW9ucykgLT5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpIHVubGVzcyBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZ2hjLW1vZC5lbmFibGVHaGNNb2RpJylcbiAgICBkZWJ1ZyBcIkNoZWNraW5nIGZvciBnaGMtbW9kaSBpbiAje0Byb290RGlyLmdldFBhdGgoKX1cIlxuICAgIGlmIEBwcm9jP1xuICAgICAgdW5sZXNzIF8uaXNFcXVhbChAZ2hjTW9kT3B0aW9ucywgZ2hjTW9kT3B0aW9ucylcbiAgICAgICAgZGVidWcgXCJGb3VuZCBydW5uaW5nIGdoYy1tb2RpIGluc3RhbmNlIGZvciAje0Byb290RGlyLmdldFBhdGgoKX0sIGJ1dCBnaGNNb2RPcHRpb25zIGRvbid0IG1hdGNoLiBPbGQ6IFwiLFxuICAgICAgICAgIEBnaGNNb2RPcHRpb25zLCAnIG5ldzogJywgZ2hjTW9kT3B0aW9uc1xuICAgICAgICBAcHJvYy5raWxsKClcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlIChyZXNvbHZlKSA9PlxuICAgICAgICAgIEBwcm9jLm9uRXhpdCA9PlxuICAgICAgICAgICAgcmVzb2x2ZSBAc3Bhd25Qcm9jZXNzKGdoY01vZE9wdGlvbnMpXG4gICAgICBkZWJ1ZyBcIkZvdW5kIHJ1bm5pbmcgZ2hjLW1vZGkgaW5zdGFuY2UgZm9yICN7QHJvb3REaXIuZ2V0UGF0aCgpfVwiXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKEBwcm9jKVxuICAgIGRlYnVnIFwiU3Bhd25pbmcgbmV3IGdoYy1tb2RpIGluc3RhbmNlIGZvciAje0Byb290RGlyLmdldFBhdGgoKX0gd2l0aFwiLCBAb3B0aW9uc1xuICAgIG1vZFBhdGggPSBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZ2hjLW1vZC5naGNNb2RQYXRoJylcbiAgICBAZ2hjTW9kT3B0aW9ucyA9IGdoY01vZE9wdGlvbnNcbiAgICBAcHJvYyA9IG5ldyBJbnRlcmFjdGl2ZVByb2Nlc3MobW9kUGF0aCwgZ2hjTW9kT3B0aW9ucy5jb25jYXQoWydsZWdhY3ktaW50ZXJhY3RpdmUnXSksIEBvcHRpb25zLCBAY2FwcylcbiAgICBAcHJvYy5kaXNwb3NhYmxlcy5hZGQgQHByb2Mub25FeGl0IChjb2RlKSA9PlxuICAgICAgZGVidWcgXCJnaGMtbW9kaSBmb3IgI3tAcm9vdERpci5nZXRQYXRoKCl9IGVuZGVkIHdpdGggI3tjb2RlfVwiXG4gICAgICBAcHJvYyA9IG51bGxcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKEBwcm9jKVxuXG4gIHJ1bk1vZENtZDogKHtnaGNNb2RPcHRpb25zLCBjb21tYW5kLCB0ZXh0LCB1cmksIGFyZ3N9KSA9PlxuICAgIG1vZFBhdGggPSBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZ2hjLW1vZC5naGNNb2RQYXRoJylcbiAgICByZXN1bHQgPSBbXVxuICAgIGVyciA9IFtdXG4gICAgaWYgdXJpP1xuICAgICAgY21kID0gZ2hjTW9kT3B0aW9ucy5jb25jYXQoW2NvbW1hbmQsIHVyaV0sIGFyZ3MpXG4gICAgZWxzZVxuICAgICAgY21kID0gZ2hjTW9kT3B0aW9ucy5jb25jYXQoW2NvbW1hbmRdLCBhcmdzKVxuICAgIGlmIHRleHQ/XG4gICAgICBjbWQgPSBbJy0tbWFwLWZpbGUnLCB1cmldLmNvbmNhdCBjbWRcbiAgICBzdGRpbiA9IFwiI3t0ZXh0fSN7RU9UfVwiIGlmIHRleHQ/XG4gICAgVXRpbC5leGVjUHJvbWlzZSBtb2RQYXRoLCBjbWQsIEBvcHRpb25zLCBzdGRpblxuICAgIC50aGVuIChzdGRvdXQpIC0+XG4gICAgICBzdGRvdXQuc3BsaXQoRU9MKS5zbGljZSgwLCAtMSkubWFwIChsaW5lKSAtPiBsaW5lLnJlcGxhY2UgL1xcMC9nLCAnXFxuJ1xuXG4gIHJ1bk1vZGlDbWQ6IChvKSA9PlxuICAgIHtnaGNNb2RPcHRpb25zLCBjb21tYW5kLCB0ZXh0LCB1cmksIGFyZ3N9ID0gb1xuICAgIGRlYnVnIFwiVHJ5aW5nIHRvIHJ1biBnaGMtbW9kaSBpbiAje0Byb290RGlyLmdldFBhdGgoKX1cIlxuICAgIEBzcGF3blByb2Nlc3MoZ2hjTW9kT3B0aW9ucylcbiAgICAudGhlbiAocHJvYykgPT5cbiAgICAgIHVubGVzcyBwcm9jXG4gICAgICAgIGRlYnVnIFwiRmFpbGVkLiBGYWxsaW5nIGJhY2sgdG8gZ2hjLW1vZFwiXG4gICAgICAgIHJldHVybiBAcnVuTW9kQ21kIG9cbiAgICAgIHVyaSA9IEByb290RGlyLnJlbGF0aXZpemUodXJpKSBpZiB1cmk/IGFuZCBub3QgQGNhcHMucXVvdGVBcmdzXG4gICAgICBwcm9jLmRvIChpbnRlcmFjdCkgLT5cbiAgICAgICAgUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgLnRoZW4gLT5cbiAgICAgICAgICBpZiB0ZXh0P1xuICAgICAgICAgICAgaW50ZXJhY3QgXCJtYXAtZmlsZVwiLCBbdXJpXSwgdGV4dFxuICAgICAgICAudGhlbiAtPlxuICAgICAgICAgIGludGVyYWN0IGNvbW1hbmQsXG4gICAgICAgICAgICBpZiB1cmk/XG4gICAgICAgICAgICAgIFt1cmldLmNvbmNhdChhcmdzKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICBhcmdzXG4gICAgICAgIC50aGVuIChyZXMpIC0+XG4gICAgICAgICAgaWYgdGV4dD9cbiAgICAgICAgICAgIGludGVyYWN0IFwidW5tYXAtZmlsZVwiLCBbdXJpXVxuICAgICAgICAgICAgLnRoZW4gLT4gcmVzXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzXG4gICAgICAgIC5jYXRjaCAoZXJyKSAtPlxuICAgICAgICAgIHRyeSBpbnRlcmFjdCBcInVubWFwLWZpbGVcIiwgW3VyaV1cbiAgICAgICAgICB0aHJvdyBlcnJcblxuICBraWxsUHJvY2VzczogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBwcm9jP1xuICAgIGRlYnVnIFwiS2lsbGluZyBnaGMtbW9kaSBwcm9jZXNzIGZvciAje0Byb290RGlyLmdldFBhdGgoKX1cIlxuICAgIEBwcm9jLmtpbGwoKVxuICAgIEBwcm9jID0gbnVsbFxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZW1pdHRlcj9cbiAgICBkZWJ1ZyBcIkdoY01vZGlQcm9jZXNzQmFzZSBkZXN0cm95aW5nXCJcbiAgICBAa2lsbFByb2Nlc3MoKVxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1kZXN0cm95J1xuICAgIEBlbWl0dGVyID0gbnVsbFxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcblxuICBvbkRpZERlc3Ryb3k6IChjYWxsYmFjaykgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBlbWl0dGVyP1xuICAgIEBlbWl0dGVyLm9uICdkaWQtZGVzdHJveScsIGNhbGxiYWNrXG4iXX0=

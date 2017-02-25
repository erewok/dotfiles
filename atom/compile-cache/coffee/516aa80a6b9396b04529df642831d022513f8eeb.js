(function() {
  var CP, CompositeDisposable, EOL, EOT, Emitter, InteractiveProcess, debug, mkError, warn, _ref, _ref1,
    __slice = [].slice;

  _ref = require('atom'), Emitter = _ref.Emitter, CompositeDisposable = _ref.CompositeDisposable;

  CP = require('child_process');

  _ref1 = require('../util'), debug = _ref1.debug, warn = _ref1.warn, mkError = _ref1.mkError, EOT = _ref1.EOT;

  EOL = require('os').EOL;

  module.exports = InteractiveProcess = (function() {
    function InteractiveProcess(path, cmd, options, caps) {
      var lastLine;
      this.caps = caps;
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.emitter = new Emitter);
      this.interactiveAction = Promise.resolve();
      this.cwd = options.cwd;
      debug("Spawning new ghc-modi instance for " + options.cwd + " with options = ", options);
      this.proc = CP.spawn(path, cmd, options);
      this.proc.stdout.setEncoding('utf-8');
      this.proc.stderr.setEncoding('utf-8');
      lastLine = "";
      this.proc.stderr.on('data', function(data) {
        var first, last, rest, _i, _ref2;
        _ref2 = data.split(EOL), first = _ref2[0], rest = 3 <= _ref2.length ? __slice.call(_ref2, 1, _i = _ref2.length - 1) : (_i = 1, []), last = _ref2[_i++];
        if (last != null) {
          warn("ghc-modi said: " + (lastLine + first));
          lastLine = last;
        } else {
          lastLine = lastLine + first;
        }
        return rest.forEach(function(line) {
          return warn("ghc-modi said: " + line);
        });
      });
      this.resetTimer();
      this.proc.on('exit', (function(_this) {
        return function(code) {
          clearTimeout(_this.timer);
          debug("ghc-modi for " + options.cwd + " ended with " + code);
          _this.emitter.emit('did-exit', code);
          return _this.disposables.dispose();
        };
      })(this));
    }

    InteractiveProcess.prototype.onExit = function(action) {
      return this.emitter.on('did-exit', action);
    };

    InteractiveProcess.prototype.resetTimer = function() {
      var tml;
      if (this.timer != null) {
        clearTimeout(this.timer);
      }
      if (tml = atom.config.get('haskell-ghc-mod.interactiveInactivityTimeout')) {
        return this.timer = setTimeout(((function(_this) {
          return function() {
            return _this.kill();
          };
        })(this)), tml * 60 * 1000);
      }
    };

    InteractiveProcess.prototype.kill = function() {
      var _base, _ref2;
      if (this.timer != null) {
        clearTimeout(this.timer);
      }
      if ((_ref2 = this.proc.stdin) != null) {
        if (typeof _ref2.end === "function") {
          _ref2.end();
        }
      }
      return typeof (_base = this.proc).kill === "function" ? _base.kill() : void 0;
    };

    InteractiveProcess.prototype["do"] = function(action) {
      var interact;
      this.resetTimer();
      interact = (function(_this) {
        return function(command, args, data) {
          var args_, resultP;
          resultP = new Promise(function(resolve, reject) {
            var cleanup, exitCallback, parseData, savedLines, timer, tml;
            savedLines = [];
            exitCallback = null;
            parseData = null;
            timer = null;
            cleanup = function() {
              _this.proc.stdout.removeListener('data', parseData);
              _this.proc.removeListener('exit', exitCallback);
              if (timer != null) {
                return clearTimeout(timer);
              }
            };
            parseData = function(data) {
              var lines, result;
              debug("Got response from ghc-modi:" + EOL + data);
              lines = data.split(EOL);
              savedLines = savedLines.concat(lines);
              result = savedLines[savedLines.length - 2];
              if (result === 'OK') {
                cleanup();
                lines = savedLines.slice(0, -2);
                return resolve(lines.map(function(line) {
                  return line.replace(/\0/g, '\n');
                }));
              }
            };
            exitCallback = function() {
              cleanup();
              console.error("" + savedLines);
              return reject(mkError("ghc-modi crashed", "" + savedLines));
            };
            _this.proc.stdout.on('data', parseData);
            _this.proc.on('exit', exitCallback);
            if (tml = atom.config.get('haskell-ghc-mod.interactiveActionTimeout')) {
              return timer = setTimeout((function() {
                cleanup();
                console.error("" + savedLines);
                _this.kill();
                return reject(mkError("InteractiveActionTimeout", "" + savedLines));
              }), tml * 1000);
            }
          });
          args_ = _this.caps.quoteArgs ? ['ascii-escape', command].concat(args.map(function(x) {
            return "\x02" + x + "\x03";
          })) : [command].concat(__slice.call(args));
          debug.apply(null, ["Running ghc-modi command " + command].concat(__slice.call(args)));
          _this.proc.stdin.write("" + (args_.join(' ').replace(/(?:\r?\n|\r)/g, ' ')) + EOL);
          if (data != null) {
            debug("Writing data to stdin...");
            _this.proc.stdin.write("" + data + EOT);
          }
          return resultP;
        };
      })(this);
      return this.interactiveAction = this.interactiveAction.then((function(_this) {
        return function() {
          debug("Started interactive action block in " + _this.cwd);
          return action(interact).then(function(res) {
            debug("Ended interactive action block in " + _this.cwd);
            return res;
          });
        };
      })(this));
    };

    return InteractiveProcess;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL2doYy1tb2QvaW50ZXJhY3RpdmUtcHJvY2Vzcy5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLE1BQUEsaUdBQUE7SUFBQSxrQkFBQTs7QUFBQSxFQUFBLE9BQWlDLE9BQUEsQ0FBUSxNQUFSLENBQWpDLEVBQUMsZUFBQSxPQUFELEVBQVUsMkJBQUEsbUJBQVYsQ0FBQTs7QUFBQSxFQUNBLEVBQUEsR0FBSyxPQUFBLENBQVEsZUFBUixDQURMLENBQUE7O0FBQUEsRUFFQSxRQUE4QixPQUFBLENBQVEsU0FBUixDQUE5QixFQUFDLGNBQUEsS0FBRCxFQUFRLGFBQUEsSUFBUixFQUFjLGdCQUFBLE9BQWQsRUFBdUIsWUFBQSxHQUZ2QixDQUFBOztBQUFBLEVBR0MsTUFBTyxPQUFBLENBQVEsSUFBUixFQUFQLEdBSEQsQ0FBQTs7QUFBQSxFQUtBLE1BQU0sQ0FBQyxPQUFQLEdBQ007QUFDUyxJQUFBLDRCQUFDLElBQUQsRUFBTyxHQUFQLEVBQVksT0FBWixFQUFzQixJQUF0QixHQUFBO0FBQ1gsVUFBQSxRQUFBO0FBQUEsTUFEZ0MsSUFBQyxDQUFBLE9BQUEsSUFDakMsQ0FBQTtBQUFBLE1BQUEsSUFBQyxDQUFBLFdBQUQsR0FBZSxHQUFBLENBQUEsbUJBQWYsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxPQUFELEdBQVcsR0FBQSxDQUFBLE9BQTVCLENBREEsQ0FBQTtBQUFBLE1BRUEsSUFBQyxDQUFBLGlCQUFELEdBQXFCLE9BQU8sQ0FBQyxPQUFSLENBQUEsQ0FGckIsQ0FBQTtBQUFBLE1BR0EsSUFBQyxDQUFBLEdBQUQsR0FBTyxPQUFPLENBQUMsR0FIZixDQUFBO0FBQUEsTUFLQSxL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

//# sourceURL=/Users/erewok/.atom/packages/haskell-ghc-mod/lib/ghc-mod/interactive-process.coffee

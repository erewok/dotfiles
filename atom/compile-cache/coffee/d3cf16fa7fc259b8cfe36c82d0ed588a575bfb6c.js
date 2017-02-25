(function() {
  var CP, CompositeDisposable, EOL, EOT, Emitter, InteractiveProcess, debug, mkError, ref, ref1, warn,
    slice = [].slice;

  ref = require('atom'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  CP = require('child_process');

  ref1 = require('../util'), debug = ref1.debug, warn = ref1.warn, mkError = ref1.mkError, EOT = ref1.EOT;

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
        var first, i, last, ref2, rest;
        ref2 = data.split(EOL), first = ref2[0], rest = 3 <= ref2.length ? slice.call(ref2, 1, i = ref2.length - 1) : (i = 1, []), last = ref2[i++];
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
      var base, ref2;
      if (this.timer != null) {
        clearTimeout(this.timer);
      }
      if ((ref2 = this.proc.stdin) != null) {
        if (typeof ref2.end === "function") {
          ref2.end();
        }
      }
      return typeof (base = this.proc).kill === "function" ? base.kill() : void 0;
    };

    InteractiveProcess.prototype["do"] = function(action) {
      var interact;
      this.resetTimer();
      interact = (function(_this) {
        return function(command, args, data) {
          var args_, resultP;
          resultP = new Promise(function(resolve, reject) {
            var chunks, cleanup, exitCallback, parseData, savedLines, timer, tml;
            savedLines = [];
            chunks = [];
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
              chunks.push(data);
              savedLines = chunks.join('').split(EOL);
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
          })) : [command].concat(slice.call(args));
          debug.apply(null, ["Running ghc-modi command " + command].concat(slice.call(args)));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL2doYy1tb2QvaW50ZXJhY3RpdmUtcHJvY2Vzcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLCtGQUFBO0lBQUE7O0VBQUEsTUFBaUMsT0FBQSxDQUFRLE1BQVIsQ0FBakMsRUFBQyxxQkFBRCxFQUFVOztFQUNWLEVBQUEsR0FBSyxPQUFBLENBQVEsZUFBUjs7RUFDTCxPQUE4QixPQUFBLENBQVEsU0FBUixDQUE5QixFQUFDLGtCQUFELEVBQVEsZ0JBQVIsRUFBYyxzQkFBZCxFQUF1Qjs7RUFDdEIsTUFBTyxPQUFBLENBQVEsSUFBUjs7RUFFUixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1MsNEJBQUMsSUFBRCxFQUFPLEdBQVAsRUFBWSxPQUFaLEVBQXFCLElBQXJCO0FBQ1gsVUFBQTtNQURnQyxJQUFDLENBQUEsT0FBRDtNQUNoQyxJQUFDLENBQUEsV0FBRCxHQUFlLElBQUk7TUFDbkIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSSxPQUFoQztNQUNBLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixPQUFPLENBQUMsT0FBUixDQUFBO01BQ3JCLElBQUMsQ0FBQSxHQUFELEdBQU8sT0FBTyxDQUFDO01BRWYsS0FBQSxDQUFNLHFDQUFBLEdBQXNDLE9BQU8sQ0FBQyxHQUE5QyxHQUFrRCxrQkFBeEQsRUFDbUIsT0FEbkI7TUFFQSxJQUFDLENBQUEsSUFBRCxHQUFRLEVBQUUsQ0FBQyxLQUFILENBQVMsSUFBVCxFQUFlLEdBQWYsRUFBb0IsT0FBcEI7TUFDUixJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFiLENBQXlCLE9BQXpCO01BQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBYixDQUF5QixPQUF6QjtNQUNB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Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlKCdhdG9tJylcbkNQID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpXG57ZGVidWcsIHdhcm4sIG1rRXJyb3IsIEVPVH0gPSByZXF1aXJlICcuLi91dGlsJ1xue0VPTH0gPSByZXF1aXJlKCdvcycpXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEludGVyYWN0aXZlUHJvY2Vzc1xuICBjb25zdHJ1Y3RvcjogKHBhdGgsIGNtZCwgb3B0aW9ucywgQGNhcHMpIC0+XG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAaW50ZXJhY3RpdmVBY3Rpb24gPSBQcm9taXNlLnJlc29sdmUoKVxuICAgIEBjd2QgPSBvcHRpb25zLmN3ZFxuXG4gICAgZGVidWcgXCJTcGF3bmluZyBuZXcgZ2hjLW1vZGkgaW5zdGFuY2UgZm9yICN7b3B0aW9ucy5jd2R9IHdpdGhcbiAgICAgICAgICBvcHRpb25zID0gXCIsIG9wdGlvbnNcbiAgICBAcHJvYyA9IENQLnNwYXduKHBhdGgsIGNtZCwgb3B0aW9ucylcbiAgICBAcHJvYy5zdGRvdXQuc2V0RW5jb2RpbmcgJ3V0Zi04J1xuICAgIEBwcm9jLnN0ZGVyci5zZXRFbmNvZGluZyAndXRmLTgnXG4gICAgbGFzdExpbmUgPSBcIlwiXG4gICAgQHByb2Muc3RkZXJyLm9uICdkYXRhJywgKGRhdGEpIC0+XG4gICAgICBbZmlyc3QsIHJlc3QuLi4sIGxhc3RdID0gZGF0YS5zcGxpdChFT0wpXG4gICAgICBpZiBsYXN0P1xuICAgICAgICB3YXJuIFwiZ2hjLW1vZGkgc2FpZDogI3tsYXN0TGluZSArIGZpcnN0fVwiXG4gICAgICAgIGxhc3RMaW5lID0gbGFzdFxuICAgICAgZWxzZVxuICAgICAgICBsYXN0TGluZSA9IGxhc3RMaW5lICsgZmlyc3RcbiAgICAgIHJlc3QuZm9yRWFjaCAobGluZSkgLT5cbiAgICAgICAgd2FybiBcImdoYy1tb2RpIHNhaWQ6ICN7bGluZX1cIlxuICAgIEByZXNldFRpbWVyKClcbiAgICBAcHJvYy5vbiAnZXhpdCcsIChjb2RlKSA9PlxuICAgICAgY2xlYXJUaW1lb3V0IEB0aW1lclxuICAgICAgZGVidWcgXCJnaGMtbW9kaSBmb3IgI3tvcHRpb25zLmN3ZH0gZW5kZWQgd2l0aCAje2NvZGV9XCJcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1leGl0JywgY29kZVxuICAgICAgQGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuXG4gIG9uRXhpdDogKGFjdGlvbikgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWV4aXQnLCBhY3Rpb25cblxuICByZXNldFRpbWVyOiAtPlxuICAgIGlmIEB0aW1lcj9cbiAgICAgIGNsZWFyVGltZW91dCBAdGltZXJcbiAgICBpZiB0bWwgPSBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZ2hjLW1vZC5pbnRlcmFjdGl2ZUluYWN0aXZpdHlUaW1lb3V0JylcbiAgICAgIEB0aW1lciA9IHNldFRpbWVvdXQgKD0+IEBraWxsKCkpLCB0bWwgKiA2MCAqIDEwMDBcblxuICBraWxsOiAtPlxuICAgIGlmIEB0aW1lcj9cbiAgICAgIGNsZWFyVGltZW91dCBAdGltZXJcbiAgICBAcHJvYy5zdGRpbj8uZW5kPygpXG4gICAgQHByb2Mua2lsbD8oKVxuXG4gIGRvOiAoYWN0aW9uKSAtPlxuICAgIEByZXNldFRpbWVyKClcbiAgICBpbnRlcmFjdCA9IChjb21tYW5kLCBhcmdzLCBkYXRhKSA9PlxuICAgICAgcmVzdWx0UCA9XG4gICAgICAgIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICAgICAgc2F2ZWRMaW5lcyA9IFtdXG4gICAgICAgICAgY2h1bmtzID0gW11cbiAgICAgICAgICBleGl0Q2FsbGJhY2sgPSBudWxsXG4gICAgICAgICAgcGFyc2VEYXRhID0gbnVsbFxuICAgICAgICAgIHRpbWVyID0gbnVsbFxuICAgICAgICAgIGNsZWFudXAgPSA9PlxuICAgICAgICAgICAgQHByb2Muc3Rkb3V0LnJlbW92ZUxpc3RlbmVyICdkYXRhJywgcGFyc2VEYXRhXG4gICAgICAgICAgICBAcHJvYy5yZW1vdmVMaXN0ZW5lciAnZXhpdCcsIGV4aXRDYWxsYmFja1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0IHRpbWVyIGlmIHRpbWVyP1xuICAgICAgICAgIHBhcnNlRGF0YSA9IChkYXRhKSAtPlxuICAgICAgICAgICAgZGVidWcgXCJHb3QgcmVzcG9uc2UgZnJvbSBnaGMtbW9kaToje0VPTH0je2RhdGF9XCJcbiAgICAgICAgICAgIGNodW5rcy5wdXNoIGRhdGFcbiAgICAgICAgICAgIHNhdmVkTGluZXMgPSBjaHVua3Muam9pbignJykuc3BsaXQoRU9MKVxuICAgICAgICAgICAgcmVzdWx0ID0gc2F2ZWRMaW5lc1tzYXZlZExpbmVzLmxlbmd0aCAtIDJdXG4gICAgICAgICAgICBpZiByZXN1bHQgaXMgJ09LJ1xuICAgICAgICAgICAgICBjbGVhbnVwKClcbiAgICAgICAgICAgICAgbGluZXMgPSBzYXZlZExpbmVzLnNsaWNlKDAsIC0yKVxuICAgICAgICAgICAgICByZXNvbHZlIGxpbmVzLm1hcCAobGluZSkgLT5cbiAgICAgICAgICAgICAgICBsaW5lLnJlcGxhY2UgL1xcMC9nLCAnXFxuJ1xuICAgICAgICAgIGV4aXRDYWxsYmFjayA9IC0+XG4gICAgICAgICAgICBjbGVhbnVwKClcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IgXCIje3NhdmVkTGluZXN9XCJcbiAgICAgICAgICAgIHJlamVjdCBta0Vycm9yIFwiZ2hjLW1vZGkgY3Jhc2hlZFwiLCBcIiN7c2F2ZWRMaW5lc31cIlxuICAgICAgICAgIEBwcm9jLnN0ZG91dC5vbiAnZGF0YScsIHBhcnNlRGF0YVxuICAgICAgICAgIEBwcm9jLm9uICdleGl0JywgZXhpdENhbGxiYWNrXG4gICAgICAgICAgaWYgdG1sID0gYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWdoYy1tb2QuaW50ZXJhY3RpdmVBY3Rpb25UaW1lb3V0JylcbiAgICAgICAgICAgIHRpbWVyID0gc2V0VGltZW91dCAoPT5cbiAgICAgICAgICAgICAgY2xlYW51cCgpXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IgXCIje3NhdmVkTGluZXN9XCJcbiAgICAgICAgICAgICAgQGtpbGwoKVxuICAgICAgICAgICAgICByZWplY3QgbWtFcnJvciBcIkludGVyYWN0aXZlQWN0aW9uVGltZW91dFwiLCBcIiN7c2F2ZWRMaW5lc31cIlxuICAgICAgICAgICAgICApLCB0bWwgKiAxMDAwXG4gICAgICBhcmdzXyA9XG4gICAgICAgIGlmIEBjYXBzLnF1b3RlQXJnc1xuICAgICAgICAgIFsnYXNjaWktZXNjYXBlJywgY29tbWFuZF0uY29uY2F0IGFyZ3MubWFwICh4KSAtPiBcIlxceDAyI3t4fVxceDAzXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIFtjb21tYW5kLCBhcmdzLi4uXVxuICAgICAgZGVidWcgXCJSdW5uaW5nIGdoYy1tb2RpIGNvbW1hbmQgI3tjb21tYW5kfVwiLCBhcmdzLi4uXG4gICAgICBAcHJvYy5zdGRpbi53cml0ZSBcIiN7YXJnc18uam9pbignICcpLnJlcGxhY2UoLyg/Olxccj9cXG58XFxyKS9nLCAnICcpfSN7RU9MfVwiXG4gICAgICBpZiBkYXRhP1xuICAgICAgICBkZWJ1ZyBcIldyaXRpbmcgZGF0YSB0byBzdGRpbi4uLlwiXG4gICAgICAgIEBwcm9jLnN0ZGluLndyaXRlIFwiI3tkYXRhfSN7RU9UfVwiXG4gICAgICByZXR1cm4gcmVzdWx0UFxuICAgIEBpbnRlcmFjdGl2ZUFjdGlvbiA9IEBpbnRlcmFjdGl2ZUFjdGlvbi50aGVuID0+XG4gICAgICBkZWJ1ZyBcIlN0YXJ0ZWQgaW50ZXJhY3RpdmUgYWN0aW9uIGJsb2NrIGluICN7QGN3ZH1cIlxuICAgICAgYWN0aW9uKGludGVyYWN0KS50aGVuIChyZXMpID0+XG4gICAgICAgIGRlYnVnIFwiRW5kZWQgaW50ZXJhY3RpdmUgYWN0aW9uIGJsb2NrIGluICN7QGN3ZH1cIlxuICAgICAgICByZXR1cm4gcmVzXG4iXX0=

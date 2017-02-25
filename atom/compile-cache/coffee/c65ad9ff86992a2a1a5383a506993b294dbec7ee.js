(function() {
  var prettify;

  module.exports = prettify = function(text, workingDirectory, _arg) {
    var BufferedProcess, lines, onComplete, onFailure, proc, shpath;
    onComplete = _arg.onComplete, onFailure = _arg.onFailure;
    lines = [];
    shpath = atom.config.get('ide-haskell.stylishHaskellPath');
    BufferedProcess = require('atom').BufferedProcess;
    proc = new BufferedProcess({
      command: shpath,
      args: atom.config.get('ide-haskell.stylishHaskellArguments'),
      options: {
        cwd: workingDirectory
      },
      stdout: function(line) {
        return lines.push(line);
      },
      exit: function(code) {
        if (code === 0) {
          return typeof onComplete === "function" ? onComplete(lines.join('')) : void 0;
        } else {
          return typeof onFailure === "function" ? onFailure({
            message: "Failed to prettify",
            detail: "Prettifier exited with non-zero exit status " + code
          }) : void 0;
        }
      }
    });
    proc.onWillThrowError(function(_arg1) {
      var error, handle;
      error = _arg1.error, handle = _arg1.handle;
      console.error(error);
      if (typeof onFailure === "function") {
        onFailure({
          message: "Ide-haskell could not spawn " + shpath,
          detail: "" + error
        });
      }
      return handle();
    });
    proc.process.stdin.write(text);
    return proc.process.stdin.end();
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvYmludXRpbHMvdXRpbC1zdHlsaXNoLWhhc2tlbGwuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFBQSxNQUFBLFFBQUE7O0FBQUEsRUFBQSxNQUFNLENBQUMsT0FBUCxHQUNBLFFBQUEsR0FBVyxTQUFDLElBQUQsRUFBTyxnQkFBUCxFQUF5QixJQUF6QixHQUFBO0FBRVQsUUFBQSwyREFBQTtBQUFBLElBRm1DLGtCQUFBLFlBQVksaUJBQUEsU0FFL0MsQ0FBQTtBQUFBLElBQUEsS0FBQSxHQUFRLEVBQVIsQ0FBQTtBQUFBLElBRUEsTUFBQSxHQUFTLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixnQ0FBaEIsQ0FGVCxDQUFBO0FBQUEsSUFJQyxrQkFBbUIsT0FBQSxDQUFRLE1BQVIsRUFBbkIsZUFKRCxDQUFBO0FBQUEsSUFLQSxJQUFBLEdBQVcsSUFBQSxlQUFBLENBQ1Q7QUFBQSxNQUFBLE9BQUEsRUFBUyxNQUFUO0FBQUEsTUFDQSxJQUFBLEVBQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHFDQUFoQixDQUROO0FBQUEsTUFFQSxPQUFBLEVBQ0U7QUFBQSxRQUFBLEdBQUEsRUFBSyxnQkFBTDtPQUhGO0FBQUEsTUFJQSxNQUFBLEVBQVEsU0FBQyxJQUFELEdBQUE7ZUFDTixLQUFLLENBQUMsSUFBTixDQUFXLElBQVgsRUFETTtNQUFBLENBSlI7QUFBQSxNQU1BLElBQUEsRUFBTSxTQUFDLElBQUQsR0FBQTtBQUNKLFFBQUEsSUFBRyxJQUFBLEtBQVEsQ0FBWDtvREFDRSxXQUFZLEtBQUssQ0FBQyxJQUFOLENBQVcsRUFBWCxZQURkO1NBQUEsTUFBQTttREFHRSxVQUFXO0FBQUEsWUFDVCxPQUFBLEVBQVMsb0JBREE7QUFBQSxZQUVULE1BQUEsRUFBUyw4Q0FBQSxHQUE4QyxJQUY5QztzQkFIYjtTQURJO01BQUEsQ0FOTjtLQURTLENBTFgsQ0FBQTtBQUFBLElBcUJBLElBQUksQ0FBQyxnQkFBTCxDQUFzQixTQUFDLEtBQUQsR0FBQTtBQUNwQixVQUFBLGFBQUE7QUFBQSxNQURzQixjQUFBLE9BQU8sZUFBQSxNQUM3QixDQUFBO0FBQUEsTUFBQSxPQUFPLENBQUMsS0FBUixDQUFjLEtBQWQsQ0FBQSxDQUFBOztRQUNBLFVBQVc7QUFBQSxVQUFDLE9BQUEsRUFBVSw4QkFBQSxHQUE4QixNQUF6QztBQUFBLFVBQW1ELE1BQUEsRUFBUSxFQUFBLEdBQUcsS0FBOUQ7O09BRFg7YUFFQSxNQUFBLENBQUEsRUFIb0I7SUFBQSxDQUF0QixDQXJCQSxDQUFBO0FBQUEsSUEwQkEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBbkIsQ0FBeUIsSUFBekIsQ0ExQkEsQ0FBQTtXQTJCQSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFuQixDQUFBLEVBN0JTO0VBQUEsQ0FEWCxDQUFBO0FBQUEiCn0=

//# sourceURL=/Users/erewok/.atom/packages/ide-haskell/lib/binutils/util-stylish-haskell.coffee

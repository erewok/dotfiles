(function() {
  var Prettify,
    __slice = [].slice;

  module.exports = Prettify = {
    prettifyFile: function(editor, format) {
      var cursors, firstCursor, getRootDir, prettify, workDir, _ref;
      if (format == null) {
        format = 'haskell';
      }
      _ref = editor.getCursors().map(function(cursor) {
        return cursor.getBufferPosition();
      }), firstCursor = _ref[0], cursors = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
      prettify = (function() {
        switch (format) {
          case 'haskell':
            return require('./util-stylish-haskell');
          case 'cabal':
            return require('./util-cabal-format');
          default:
            throw new Error("Unknown format " + format);
        }
      })();
      getRootDir = require('atom-haskell-utils').getRootDir;
      workDir = getRootDir(editor.getBuffer()).getPath();
      return prettify(editor.getText(), workDir, {
        onComplete: function(text) {
          editor.setText(text);
          if (editor.getLastCursor() != null) {
            editor.getLastCursor().setBufferPosition(firstCursor, {
              autoscroll: false
            });
            return cursors.forEach(function(cursor) {
              return editor.addCursorAtBufferPosition(cursor, {
                autoscroll: false
              });
            });
          }
        },
        onFailure: function(_arg) {
          var detail, message;
          message = _arg.message, detail = _arg.detail;
          return atom.notifications.addError(message, {
            detail: detail
          });
        }
      });
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvYmludXRpbHMvcHJldHRpZnkuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFBQSxNQUFBLFFBQUE7SUFBQSxrQkFBQTs7QUFBQSxFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFFBQUEsR0FDZjtBQUFBLElBQUEsWUFBQSxFQUFjLFNBQUMsTUFBRCxFQUFTLE1BQVQsR0FBQTtBQUNaLFVBQUEseURBQUE7O1FBRHFCLFNBQVM7T0FDOUI7QUFBQSxNQUFBLE9BQTRCLE1BQU0sQ0FBQyxVQUFQLENBQUEsQ0FBbUIsQ0FBQyxHQUFwQixDQUF3QixTQUFDLE1BQUQsR0FBQTtlQUNsRCxNQUFNLENBQUMsaUJBQVAsQ0FBQSxFQURrRDtNQUFBLENBQXhCLENBQTVCLEVBQUMscUJBQUQsRUFBYyx1REFBZCxDQUFBO0FBQUEsTUFFQSxRQUFBO0FBQVcsZ0JBQU8sTUFBUDtBQUFBLGVBQ0osU0FESTttQkFDVyxPQUFBLENBQVEsd0JBQVIsRUFEWDtBQUFBLGVBRUosT0FGSTttQkFFUyxPQUFBLENBQVEscUJBQVIsRUFGVDtBQUFBO0FBR0osa0JBQVUsSUFBQSxLQUFBLENBQU8saUJBQUEsR0FBaUIsTUFBeEIsQ0FBVixDQUhJO0FBQUE7VUFGWCxDQUFBO0FBQUEsTUFNQyxhQUFjLE9BQUEsQ0FBUSxvQkFBUixFQUFkLFVBTkQsQ0FBQTtBQUFBLE1BT0EsT0FBQSxHQUFVLFVBQUEsQ0FBVyxNQUFNLENBQUMsU0FBUCxDQUFBLENBQVgsQ0FBOEIsQ0FBQyxPQUEvQixDQUFBLENBUFYsQ0FBQTthQVFBLFFBQUEsQ0FBUyxNQUFNLENBQUMsT0FBUCxDQUFBLENBQVQsRUFBMkIsT0FBM0IsRUFDRTtBQUFBLFFBQUEsVUFBQSxFQUFZLFNBQUMsSUFBRCxHQUFBO0FBQ1YsVUFBQSxNQUFNLENBQUMsT0FBUCxDQUFlLElBQWYsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxJQUFHLDhCQUFIO0FBQ0UsWUFBQSxNQUFNLENBQUMsYUFBUCxDQUFBLENBQXNCLENBQUMsaUJBQXZCLENBQXlDLFdBQXpDLEVBQ0U7QUFBQSxjQUFBLFVBQUEsRUFBWSxLQUFaO2FBREYsQ0FBQSxDQUFBO21CQUVBLE9BQU8sQ0FBQyxPQUFSLENBQWdCLFNBQUMsTUFBRCxHQUFBO3FCQUNkLE1BQU0sQ0FBQyx5QkFBUCxDQUFpQyxNQUFqQyxFQUNFO0FBQUEsZ0JBQUEsVUFBQSxFQUFZLEtBQVo7ZUFERixFQURjO1lBQUEsQ0FBaEIsRUFIRjtXQUZVO1FBQUEsQ0FBWjtBQUFBLFFBUUEsU0FBQSxFQUFXLFNBQUMsSUFBRCxHQUFBO0FBQ1QsY0FBQSxlQUFBO0FBQUEsVUFEVyxlQUFBLFNBQVMsY0FBQSxNQUNwQixDQUFBO2lCQUFBLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBbkIsQ0FBNEIsT0FBNUIsRUFBcUM7QUFBQSxZQUFDLFFBQUEsTUFBRDtXQUFyQyxFQURTO1FBQUEsQ0FSWDtPQURGLEVBVFk7SUFBQSxDQUFkO0dBREYsQ0FBQTtBQUFBIgp9

//# sourceURL=/Users/erewok/.atom/packages/ide-haskell/lib/binutils/prettify.coffee

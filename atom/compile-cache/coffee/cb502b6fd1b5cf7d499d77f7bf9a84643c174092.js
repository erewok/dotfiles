(function() {
  var Helpers, Range, child_process, minimatch, path,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Range = require('atom').Range;

  path = require('path');

  child_process = require('child_process');

  minimatch = require('minimatch');

  Helpers = module.exports = {
    messageKey: function(message) {
      return (message.text || message.html) + '$' + message.type + '$' + (message["class"] || '') + '$' + (message.name || '') + '$' + message.filePath + '$' + (message.range ? message.range.start.column + ':' + message.range.start.row + ':' + message.range.end.column + ':' + message.range.end.row : '');
    },
    error: function(e) {
      return atom.notifications.addError(e.toString(), {
        detail: e.stack || '',
        dismissable: true
      });
    },
    shouldTriggerLinter: function(linter, onChange, scopes) {
      if (onChange && !linter.lintOnFly) {
        return false;
      }
      if (!scopes.some(function(entry) {
        return indexOf.call(linter.grammarScopes, entry) >= 0;
      })) {
        return false;
      }
      return true;
    },
    requestUpdateFrame: function(callback) {
      return setTimeout(callback, 100);
    },
    debounce: function(callback, delay) {
      var timeout;
      timeout = null;
      return function(arg) {
        clearTimeout(timeout);
        return timeout = setTimeout((function(_this) {
          return function() {
            return callback.call(_this, arg);
          };
        })(this), delay);
      };
    },
    isPathIgnored: function(filePath) {
      var i, j, len, projectPath, ref, repo;
      repo = null;
      ref = atom.project.getPaths();
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        projectPath = ref[i];
        if (filePath.indexOf(projectPath + path.sep) === 0) {
          repo = atom.project.getRepositories()[i];
          break;
        }
      }
      if (repo && repo.isProjectAtRoot() && repo.isPathIgnored(filePath)) {
        return true;
      }
      return minimatch(filePath, atom.config.get('linter.ignoreMatchedFiles'));
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9saW50ZXIvbGliL2hlbHBlcnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw4Q0FBQTtJQUFBOztFQUFDLFFBQVMsT0FBQSxDQUFRLE1BQVI7O0VBQ1YsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLGVBQVI7O0VBQ2hCLFNBQUEsR0FBWSxPQUFBLENBQVEsV0FBUjs7RUFFWixPQUFBLEdBQVUsTUFBTSxDQUFDLE9BQVAsR0FDUjtJQUFBLFVBQUEsRUFBWSxTQUFDLE9BQUQ7YUFDVixDQUFDLE9BQU8sQ0FBQyxJQUFSLElBQWdCLE9BQU8sQ0FBQyxJQUF6QixDQUFBLEdBQWlDLEdBQWpDLEdBQXVDLE9BQU8sQ0FBQyxJQUEvQyxHQUFzRCxHQUF0RCxHQUE0RCxDQUFDLE9BQU8sRUFBQyxLQUFELEVBQVAsSUFBaUIsRUFBbEIsQ0FBNUQsR0FBb0YsR0FBcEYsR0FBMEYsQ0FBQyxPQUFPLENBQUMsSUFBUixJQUFnQixFQUFqQixDQUExRixHQUFpSCxHQUFqSCxHQUF1SCxPQUFPLENBQUMsUUFBL0gsR0FBMEksR0FBMUksR0FBZ0osQ0FBSSxPQUFPLENBQUMsS0FBWCxHQUFzQixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFwQixHQUE2QixHQUE3QixHQUFtQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUF2RCxHQUE2RCxHQUE3RCxHQUFtRSxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFyRixHQUE4RixHQUE5RixHQUFvRyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUE1SSxHQUFxSixFQUF0SjtJQUR0SSxDQUFaO0lBRUEsS0FBQSxFQUFPLFNBQUMsQ0FBRDthQUNMLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBbkIsQ0FBNEIsQ0FBQyxDQUFDLFFBQUYsQ0FBQSxDQUE1QixFQUEwQztRQUFDLE1BQUEsRUFBUSxDQUFDLENBQUMsS0FBRixJQUFXLEVBQXBCO1FBQXdCLFdBQUEsRUFBYSxJQUFyQztPQUExQztJQURLLENBRlA7SUFJQSxtQkFBQSxFQUFxQixTQUFDLE1BQUQsRUFBUyxRQUFULEVBQW1CLE1BQW5CO01BSW5CLElBQWdCLFFBQUEsSUFBYSxDQUFJLE1BQU0sQ0FBQyxTQUF4QztBQUFBLGVBQU8sTUFBUDs7TUFDQSxJQUFBLENBQW9CLE1BQU0sQ0FBQyxJQUFQLENBQVksU0FBQyxLQUFEO2VBQVcsYUFBUyxNQUFNLENBQUMsYUFBaEIsRUFBQSxLQUFBO01BQVgsQ0FBWixDQUFwQjtBQUFBLGVBQU8sTUFBUDs7QUFDQSxhQUFPO0lBTlksQ0FKckI7SUFXQSxrQkFBQSxFQUFvQixTQUFDLFFBQUQ7YUFDbEIsVUFBQSxDQUFXLFFBQVgsRUFBcUIsR0FBckI7SUFEa0IsQ0FYcEI7SUFhQSxRQUFBLEVBQVUsU0FBQyxRQUFELEVBQVcsS0FBWDtBQUNSLFVBQUE7TUFBQSxPQUFBLEdBQVU7QUFDVixhQUFPLFNBQUMsR0FBRDtRQUNMLFlBQUEsQ0FBYSxPQUFiO2VBQ0EsT0FBQSxHQUFVLFVBQUEsQ0FBVyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUNuQixRQUFRLENBQUMsSUFBVCxDQUFjLEtBQWQsRUFBb0IsR0FBcEI7VUFEbUI7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVgsRUFFUixLQUZRO01BRkw7SUFGQyxDQWJWO0lBb0JBLGFBQUEsRUFBZSxTQUFDLFFBQUQ7QUFDYixVQUFBO01BQUEsSUFBQSxHQUFPO0FBQ1A7QUFBQSxXQUFBLDZDQUFBOztRQUNFLElBQUcsUUFBUSxDQUFDLE9BQVQsQ0FBaUIsV0FBQSxHQUFjLElBQUksQ0FBQyxHQUFwQyxDQUFBLEtBQTRDLENBQS9DO1VBQ0UsSUFBQSxHQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBYixDQUFBLENBQStCLENBQUEsQ0FBQTtBQUN0QyxnQkFGRjs7QUFERjtNQUlBLElBQWUsSUFBQSxJQUFTLElBQUksQ0FBQyxlQUFMLENBQUEsQ0FBVCxJQUFvQyxJQUFJLENBQUMsYUFBTCxDQUFtQixRQUFuQixDQUFuRDtBQUFBLGVBQU8sS0FBUDs7QUFDQSxhQUFPLFNBQUEsQ0FBVSxRQUFWLEVBQW9CLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiwyQkFBaEIsQ0FBcEI7SUFQTSxDQXBCZjs7QUFORiIsInNvdXJjZXNDb250ZW50IjpbIntSYW5nZX0gPSByZXF1aXJlKCdhdG9tJylcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuY2hpbGRfcHJvY2VzcyA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKVxubWluaW1hdGNoID0gcmVxdWlyZSgnbWluaW1hdGNoJylcblxuSGVscGVycyA9IG1vZHVsZS5leHBvcnRzID1cbiAgbWVzc2FnZUtleTogKG1lc3NhZ2UpIC0+XG4gICAgKG1lc3NhZ2UudGV4dCBvciBtZXNzYWdlLmh0bWwpICsgJyQnICsgbWVzc2FnZS50eXBlICsgJyQnICsgKG1lc3NhZ2UuY2xhc3Mgb3IgJycpICsgJyQnICsgKG1lc3NhZ2UubmFtZSBvciAnJykgKyAnJCcgKyBtZXNzYWdlLmZpbGVQYXRoICsgJyQnICsgKGlmIG1lc3NhZ2UucmFuZ2UgdGhlbiBtZXNzYWdlLnJhbmdlLnN0YXJ0LmNvbHVtbiArICc6JyArIG1lc3NhZ2UucmFuZ2Uuc3RhcnQucm93ICsgJzonICsgbWVzc2FnZS5yYW5nZS5lbmQuY29sdW1uICsgJzonICsgbWVzc2FnZS5yYW5nZS5lbmQucm93IGVsc2UgJycpXG4gIGVycm9yOiAoZSkgLT5cbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoZS50b1N0cmluZygpLCB7ZGV0YWlsOiBlLnN0YWNrIG9yICcnLCBkaXNtaXNzYWJsZTogdHJ1ZX0pXG4gIHNob3VsZFRyaWdnZXJMaW50ZXI6IChsaW50ZXIsIG9uQ2hhbmdlLCBzY29wZXMpIC0+XG4gICAgIyBUcmlnZ2VyIGxpbnQtb24tRmx5IGxpbnRlcnMgb24gYm90aCBldmVudHMgYnV0IG9uLXNhdmUgbGludGVycyBvbmx5IG9uIHNhdmVcbiAgICAjIEJlY2F1c2Ugd2Ugd2FudCB0byB0cmlnZ2VyIG9uRmx5IGxpbnRlcnMgb24gc2F2ZSB3aGVuIHRoZVxuICAgICMgdXNlciBoYXMgZGlzYWJsZWQgbGludE9uRmx5IGZyb20gY29uZmlnXG4gICAgcmV0dXJuIGZhbHNlIGlmIG9uQ2hhbmdlIGFuZCBub3QgbGludGVyLmxpbnRPbkZseVxuICAgIHJldHVybiBmYWxzZSB1bmxlc3Mgc2NvcGVzLnNvbWUgKGVudHJ5KSAtPiBlbnRyeSBpbiBsaW50ZXIuZ3JhbW1hclNjb3Blc1xuICAgIHJldHVybiB0cnVlXG4gIHJlcXVlc3RVcGRhdGVGcmFtZTogKGNhbGxiYWNrKSAtPlxuICAgIHNldFRpbWVvdXQoY2FsbGJhY2ssIDEwMClcbiAgZGVib3VuY2U6IChjYWxsYmFjaywgZGVsYXkpIC0+XG4gICAgdGltZW91dCA9IG51bGxcbiAgICByZXR1cm4gKGFyZykgLT5cbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KVxuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT5cbiAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzLCBhcmcpXG4gICAgICAsIGRlbGF5KVxuICBpc1BhdGhJZ25vcmVkOiAoZmlsZVBhdGgpIC0+XG4gICAgcmVwbyA9IG51bGxcbiAgICBmb3IgcHJvamVjdFBhdGgsIGkgaW4gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClcbiAgICAgIGlmIGZpbGVQYXRoLmluZGV4T2YocHJvamVjdFBhdGggKyBwYXRoLnNlcCkgaXMgMFxuICAgICAgICByZXBvID0gYXRvbS5wcm9qZWN0LmdldFJlcG9zaXRvcmllcygpW2ldXG4gICAgICAgIGJyZWFrXG4gICAgcmV0dXJuIHRydWUgaWYgcmVwbyBhbmQgcmVwby5pc1Byb2plY3RBdFJvb3QoKSBhbmQgcmVwby5pc1BhdGhJZ25vcmVkKGZpbGVQYXRoKVxuICAgIHJldHVybiBtaW5pbWF0Y2goZmlsZVBhdGgsIGF0b20uY29uZmlnLmdldCgnbGludGVyLmlnbm9yZU1hdGNoZWRGaWxlcycpKVxuIl19

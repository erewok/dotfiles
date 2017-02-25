(function() {
  var Commands, CompositeDisposable,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

  CompositeDisposable = require('atom').CompositeDisposable;

  Commands = (function() {
    function Commands(linter) {
      this.linter = linter;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'linter:next-error': (function(_this) {
          return function() {
            return _this.nextError();
          };
        })(this),
        'linter:previous-error': (function(_this) {
          return function() {
            return _this.previousError();
          };
        })(this),
        'linter:toggle': (function(_this) {
          return function() {
            return _this.toggleLinter();
          };
        })(this),
        'linter:togglePanel': (function(_this) {
          return function() {
            return _this.togglePanel();
          };
        })(this),
        'linter:set-bubble-transparent': (function(_this) {
          return function() {
            return _this.setBubbleTransparent();
          };
        })(this),
        'linter:expand-multiline-messages': (function(_this) {
          return function() {
            return _this.expandMultilineMessages();
          };
        })(this),
        'linter:lint': (function(_this) {
          return function() {
            return _this.lint();
          };
        })(this)
      }));
      this.index = null;
    }

    Commands.prototype.togglePanel = function() {
      return atom.config.set('linter.showErrorPanel', !atom.config.get('linter.showErrorPanel'));
    };

    Commands.prototype.toggleLinter = function() {
      var activeEditor, editorLinter;
      activeEditor = atom.workspace.getActiveTextEditor();
      if (!activeEditor) {
        return;
      }
      editorLinter = this.linter.getEditorLinter(activeEditor);
      if (editorLinter) {
        return editorLinter.dispose();
      } else {
        this.linter.createEditorLinter(activeEditor);
        return this.lint();
      }
    };

    Commands.prototype.setBubbleTransparent = function() {
      var bubble;
      bubble = document.getElementById('linter-inline');
      if (bubble) {
        bubble.classList.add('transparent');
        document.addEventListener('keyup', this.setBubbleOpaque);
        return window.addEventListener('blur', this.setBubbleOpaque);
      }
    };

    Commands.prototype.setBubbleOpaque = function() {
      var bubble;
      bubble = document.getElementById('linter-inline');
      if (bubble) {
        bubble.classList.remove('transparent');
      }
      document.removeEventListener('keyup', this.setBubbleOpaque);
      return window.removeEventListener('blur', this.setBubbleOpaque);
    };

    Commands.prototype.expandMultilineMessages = function() {
      var elem, i, len, ref;
      ref = document.getElementsByTagName('linter-multiline-message');
      for (i = 0, len = ref.length; i < len; i++) {
        elem = ref[i];
        elem.classList.add('expanded');
      }
      document.addEventListener('keyup', this.collapseMultilineMessages);
      return window.addEventListener('blur', this.collapseMultilineMessages);
    };

    Commands.prototype.collapseMultilineMessages = function() {
      var elem, i, len, ref;
      ref = document.getElementsByTagName('linter-multiline-message');
      for (i = 0, len = ref.length; i < len; i++) {
        elem = ref[i];
        elem.classList.remove('expanded');
      }
      document.removeEventListener('keyup', this.collapseMultilineMessages);
      return window.removeEventListener('blur', this.collapseMultilineMessages);
    };

    Commands.prototype.lint = function() {
      var error, ref;
      try {
        return (ref = this.linter.getActiveEditorLinter()) != null ? ref.lint(false) : void 0;
      } catch (error1) {
        error = error1;
        return atom.notifications.addError(error.message, {
          detail: error.stack,
          dismissable: true
        });
      }
    };

    Commands.prototype.getMessage = function(index) {
      var messages;
      messages = this.linter.views.messages;
      return messages[modulo(index, messages.length)];
    };

    Commands.prototype.nextError = function() {
      var message;
      if (this.index != null) {
        this.index++;
      } else {
        this.index = 0;
      }
      message = this.getMessage(this.index);
      if (!(message != null ? message.filePath : void 0)) {
        return;
      }
      if (!(message != null ? message.range : void 0)) {
        return;
      }
      return atom.workspace.open(message.filePath).then(function() {
        return atom.workspace.getActiveTextEditor().setCursorBufferPosition(message.range.start);
      });
    };

    Commands.prototype.previousError = function() {
      var message;
      if (this.index != null) {
        this.index--;
      } else {
        this.index = 0;
      }
      message = this.getMessage(this.index);
      if (!(message != null ? message.filePath : void 0)) {
        return;
      }
      if (!(message != null ? message.range : void 0)) {
        return;
      }
      return atom.workspace.open(message.filePath).then(function() {
        return atom.workspace.getActiveTextEditor().setCursorBufferPosition(message.range.start);
      });
    };

    Commands.prototype.dispose = function() {
      this.messages = null;
      return this.subscriptions.dispose();
    };

    return Commands;

  })();

  module.exports = Commands;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9saW50ZXIvbGliL2NvbW1hbmRzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNkJBQUE7SUFBQTs7RUFBQyxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBRWxCO0lBQ1Msa0JBQUMsTUFBRDtNQUFDLElBQUMsQ0FBQSxTQUFEO01BQ1osSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUNyQixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUNqQjtRQUFBLG1CQUFBLEVBQXFCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLFNBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFyQjtRQUNBLHVCQUFBLEVBQXlCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLGFBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUR6QjtRQUVBLGVBQUEsRUFBaUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsWUFBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRmpCO1FBR0Esb0JBQUEsRUFBc0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsV0FBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBSHRCO1FBSUEsK0JBQUEsRUFBaUMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsb0JBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUpqQztRQUtBLGtDQUFBLEVBQW9DLENBQUEsU0FBQSxLQUFBO2lC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ZUFDekMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBLENBQW9DLENBQUMsdUJBQXJDLENBQTZELE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBM0U7TUFEeUMsQ0FBM0M7SUFSYTs7dUJBV2YsT0FBQSxHQUFTLFNBQUE7TUFDUCxJQUFDLENBQUEsUUFBRCxHQUFZO2FBQ1osSUFBQyxDQUFBLGFBQWEsQ0FBQyxPQUFmLENBQUE7SUFGTzs7Ozs7O0VBSVgsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUFoR2pCIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblxuY2xhc3MgQ29tbWFuZHNcbiAgY29uc3RydWN0b3I6IChAbGludGVyKSAtPlxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJyxcbiAgICAgICdsaW50ZXI6bmV4dC1lcnJvcic6ID0+IEBuZXh0RXJyb3IoKVxuICAgICAgJ2xpbnRlcjpwcmV2aW91cy1lcnJvcic6ID0+IEBwcmV2aW91c0Vycm9yKClcbiAgICAgICdsaW50ZXI6dG9nZ2xlJzogPT4gQHRvZ2dsZUxpbnRlcigpXG4gICAgICAnbGludGVyOnRvZ2dsZVBhbmVsJzogPT4gQHRvZ2dsZVBhbmVsKClcbiAgICAgICdsaW50ZXI6c2V0LWJ1YmJsZS10cmFuc3BhcmVudCc6ID0+IEBzZXRCdWJibGVUcmFuc3BhcmVudCgpXG4gICAgICAnbGludGVyOmV4cGFuZC1tdWx0aWxpbmUtbWVzc2FnZXMnOiA9PiBAZXhwYW5kTXVsdGlsaW5lTWVzc2FnZXMoKVxuICAgICAgJ2xpbnRlcjpsaW50JzogPT4gQGxpbnQoKVxuXG4gICAgIyBEZWZhdWx0IHZhbHVlc1xuICAgIEBpbmRleCA9IG51bGxcblxuICB0b2dnbGVQYW5lbDogLT5cbiAgICBhdG9tLmNvbmZpZy5zZXQoJ2xpbnRlci5zaG93RXJyb3JQYW5lbCcsIG5vdCBhdG9tLmNvbmZpZy5nZXQoJ2xpbnRlci5zaG93RXJyb3JQYW5lbCcpKVxuXG4gIHRvZ2dsZUxpbnRlcjogLT5cbiAgICBhY3RpdmVFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICByZXR1cm4gdW5sZXNzIGFjdGl2ZUVkaXRvclxuICAgIGVkaXRvckxpbnRlciA9IEBsaW50ZXIuZ2V0RWRpdG9yTGludGVyKGFjdGl2ZUVkaXRvcilcbiAgICBpZiBlZGl0b3JMaW50ZXJcbiAgICAgIGVkaXRvckxpbnRlci5kaXNwb3NlKClcbiAgICBlbHNlXG4gICAgICBAbGludGVyLmNyZWF0ZUVkaXRvckxpbnRlcihhY3RpdmVFZGl0b3IpXG4gICAgICBAbGludCgpXG5cblxuICBzZXRCdWJibGVUcmFuc3BhcmVudDogLT5cbiAgICBidWJibGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGludGVyLWlubGluZScpXG4gICAgaWYgYnViYmxlXG4gICAgICBidWJibGUuY2xhc3NMaXN0LmFkZCAndHJhbnNwYXJlbnQnXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyICdrZXl1cCcsIEBzZXRCdWJibGVPcGFxdWVcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICdibHVyJywgQHNldEJ1YmJsZU9wYXF1ZVxuXG4gIHNldEJ1YmJsZU9wYXF1ZTogLT5cbiAgICBidWJibGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGludGVyLWlubGluZScpXG4gICAgaWYgYnViYmxlXG4gICAgICBidWJibGUuY2xhc3NMaXN0LnJlbW92ZSAndHJhbnNwYXJlbnQnXG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciAna2V5dXAnLCBAc2V0QnViYmxlT3BhcXVlXG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2JsdXInLCBAc2V0QnViYmxlT3BhcXVlXG5cbiAgZXhwYW5kTXVsdGlsaW5lTWVzc2FnZXM6IC0+XG4gICAgZm9yIGVsZW0gaW4gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUgJ2xpbnRlci1tdWx0aWxpbmUtbWVzc2FnZSdcbiAgICAgIGVsZW0uY2xhc3NMaXN0LmFkZCAnZXhwYW5kZWQnXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciAna2V5dXAnLCBAY29sbGFwc2VNdWx0aWxpbmVNZXNzYWdlc1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICdibHVyJywgQGNvbGxhcHNlTXVsdGlsaW5lTWVzc2FnZXNcblxuICBjb2xsYXBzZU11bHRpbGluZU1lc3NhZ2VzOiAtPlxuICAgIGZvciBlbGVtIGluIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lICdsaW50ZXItbXVsdGlsaW5lLW1lc3NhZ2UnXG4gICAgICBlbGVtLmNsYXNzTGlzdC5yZW1vdmUgJ2V4cGFuZGVkJ1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2tleXVwJywgQGNvbGxhcHNlTXVsdGlsaW5lTWVzc2FnZXNcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciAnYmx1cicsIEBjb2xsYXBzZU11bHRpbGluZU1lc3NhZ2VzXG5cbiAgbGludDogLT5cbiAgICB0cnlcbiAgICAgIEBsaW50ZXIuZ2V0QWN0aXZlRWRpdG9yTGludGVyKCk/LmxpbnQoZmFsc2UpXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBlcnJvci5tZXNzYWdlLCB7ZGV0YWlsOiBlcnJvci5zdGFjaywgZGlzbWlzc2FibGU6IHRydWV9XG5cbiAgZ2V0TWVzc2FnZTogKGluZGV4KSAtPlxuICAgIG1lc3NhZ2VzID0gQGxpbnRlci52aWV3cy5tZXNzYWdlc1xuICAgICMgVXNlIHRoZSBkaXZpZGVuZCBpbmRlcGVuZGVudCBtb2R1bG8gc28gdGhhdCB0aGUgaW5kZXggc3RheXMgaW5zaWRlIHRoZVxuICAgICMgYXJyYXkncyBib3VuZHMsIGV2ZW4gd2hlbiBuZWdhdGl2ZS5cbiAgICAjIFRoYXQgd2F5IHRoZSBpbmRleCBjYW4gYmUgKysgYW4gLS0gd2l0aG91dCBjYXJpbmcgYWJvdXQgdGhlIGFycmF5IGJvdW5kcy5cbiAgICBtZXNzYWdlc1tpbmRleCAlJSBtZXNzYWdlcy5sZW5ndGhdXG5cbiAgbmV4dEVycm9yOiAtPlxuICAgIGlmIEBpbmRleD9cbiAgICAgIEBpbmRleCsrXG4gICAgZWxzZVxuICAgICAgQGluZGV4ID0gMFxuICAgIG1lc3NhZ2UgPSBAZ2V0TWVzc2FnZShAaW5kZXgpXG4gICAgcmV0dXJuIHVubGVzcyBtZXNzYWdlPy5maWxlUGF0aFxuICAgIHJldHVybiB1bmxlc3MgbWVzc2FnZT8ucmFuZ2VcbiAgICBhdG9tLndvcmtzcGFjZS5vcGVuKG1lc3NhZ2UuZmlsZVBhdGgpLnRoZW4gLT5cbiAgICAgIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKS5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbihtZXNzYWdlLnJhbmdlLnN0YXJ0KVxuXG4gIHByZXZpb3VzRXJyb3I6IC0+XG4gICAgaWYgQGluZGV4P1xuICAgICAgQGluZGV4LS1cbiAgICBlbHNlXG4gICAgICBAaW5kZXggPSAwXG4gICAgbWVzc2FnZSA9IEBnZXRNZXNzYWdlKEBpbmRleClcbiAgICByZXR1cm4gdW5sZXNzIG1lc3NhZ2U/LmZpbGVQYXRoXG4gICAgcmV0dXJuIHVubGVzcyBtZXNzYWdlPy5yYW5nZVxuICAgIGF0b20ud29ya3NwYWNlLm9wZW4obWVzc2FnZS5maWxlUGF0aCkudGhlbiAtPlxuICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKG1lc3NhZ2UucmFuZ2Uuc3RhcnQpXG5cbiAgZGlzcG9zZTogLT5cbiAgICBAbWVzc2FnZXMgPSBudWxsXG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG5cbm1vZHVsZS5leHBvcnRzID0gQ29tbWFuZHNcbiJdfQ==

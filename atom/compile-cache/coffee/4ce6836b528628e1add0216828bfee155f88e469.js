(function() {
  var LastSuggestionView;

  module.exports = LastSuggestionView = (function() {
    function LastSuggestionView() {
      var CompositeDisposable;
      this[0] = this.element = document.createElement('div');
      CompositeDisposable = require('atom').CompositeDisposable;
      this.disposables = new CompositeDisposable;
      this.disposables.add(atom.config.observe('editor.fontFamily', (function(_this) {
        return function(val) {
          return _this.element.style.fontFamily = val != null ? val : '';
        };
      })(this)));
      this.disposables.add(atom.config.observe('editor.fontSize', (function(_this) {
        return function(val) {
          var ref;
          return _this.element.style.fontSize = (ref = val + "px") != null ? ref : '';
        };
      })(this)));
    }

    LastSuggestionView.prototype.destroy = function() {
      return this.element.remove();
    };

    LastSuggestionView.prototype.setText = function(text) {
      return this.element.innerHTML = require('atom-highlight')({
        fileContents: text,
        scopeName: 'hint.haskell',
        nbsp: false,
        editorDiv: true,
        editorDivTag: 'autocomplete-haskell-hint'
      });
    };

    LastSuggestionView.prototype.getText = function() {
      return this.element.innerText;
    };

    return LastSuggestionView;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9hdXRvY29tcGxldGUtaGFza2VsbC9saWIvbGFzdC1zdWdnZXN0aW9uLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1MsNEJBQUE7QUFDWCxVQUFBO01BQUEsSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLElBQUMsQ0FBQSxPQUFELEdBQVcsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsS0FBdkI7TUFDakIsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSO01BQ3hCLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBSTtNQUNuQixJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFaLENBQW9CLG1CQUFwQixFQUF5QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsR0FBRDtpQkFDeEQsS0FBQyxDQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBZixpQkFBNEIsTUFBTTtRQURzQjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekMsQ0FBakI7TUFFQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFaLENBQW9CLGlCQUFwQixFQUF1QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsR0FBRDtBQUN0RCxjQUFBO2lCQUFBLEtBQUMsQ0FBQSxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQWYsc0NBQXVDO1FBRGU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXZDLENBQWpCO0lBTlc7O2lDQVNiLE9BQUEsR0FBUyxTQUFBO2FBQ1AsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULENBQUE7SUFETzs7aUNBR1QsT0FBQSxHQUFTLFNBQUMsSUFBRDthQUNQLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBVCxHQUFxQixPQUFBLENBQVEsZ0JBQVIsQ0FBQSxDQUNuQjtRQUFBLFlBQUEsRUFBYyxJQUFkO1FBQ0EsU0FBQSxFQUFXLGNBRFg7UUFFQSxJQUFBLEVBQU0sS0FGTjtRQUdBLFNBQUEsRUFBVyxJQUhYO1FBSUEsWUFBQSxFQUFjLDJCQUpkO09BRG1CO0lBRGQ7O2lDQVFULE9BQUEsR0FBUyxTQUFBO2FBQ1AsSUFBQyxDQUFBLE9BQU8sQ0FBQztJQURGOzs7OztBQXRCWCIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIExhc3RTdWdnZXN0aW9uVmlld1xuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAWzBdID0gQGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG4gICAge0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnZWRpdG9yLmZvbnRGYW1pbHknLCAodmFsKSA9PlxuICAgICAgQGVsZW1lbnQuc3R5bGUuZm9udEZhbWlseSA9IHZhbCA/ICcnXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdlZGl0b3IuZm9udFNpemUnLCAodmFsKSA9PlxuICAgICAgQGVsZW1lbnQuc3R5bGUuZm9udFNpemUgPSBcIiN7dmFsfXB4XCIgPyAnJ1xuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQGVsZW1lbnQucmVtb3ZlKClcblxuICBzZXRUZXh0OiAodGV4dCkgLT5cbiAgICBAZWxlbWVudC5pbm5lckhUTUwgPSByZXF1aXJlKCdhdG9tLWhpZ2hsaWdodCcpXG4gICAgICBmaWxlQ29udGVudHM6IHRleHRcbiAgICAgIHNjb3BlTmFtZTogJ2hpbnQuaGFza2VsbCdcbiAgICAgIG5ic3A6IGZhbHNlXG4gICAgICBlZGl0b3JEaXY6IHRydWVcbiAgICAgIGVkaXRvckRpdlRhZzogJ2F1dG9jb21wbGV0ZS1oYXNrZWxsLWhpbnQnXG5cbiAgZ2V0VGV4dDogLT5cbiAgICBAZWxlbWVudC5pbm5lclRleHRcbiJdfQ==

(function() {
  var LastSuggestionView;

  module.exports = LastSuggestionView = (function() {
    function LastSuggestionView() {
      this[0] = this.element = document.createElement('atom-text-editor');
      this.element.setAttribute('mini', true);
      this.element.removeAttribute('tabindex');
      this.editor = this.element.getModel();
    }

    LastSuggestionView.prototype.destroy = function() {
      return this.element.remove();
    };

    LastSuggestionView.prototype.setText = function(text) {
      var _ref;
      if (((_ref = this.editor.getGrammar()) != null ? _ref.scopeName : void 0) !== 'hint.haskell') {
        this.editor.setGrammar(atom.grammars.grammarForScopeName('hint.haskell'));
      }
      return this.editor.setText(text);
    };

    return LastSuggestionView;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9hdXRvY29tcGxldGUtaGFza2VsbC9saWIvbGFzdC1zdWdnZXN0aW9uLXZpZXcuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFBQSxNQUFBLGtCQUFBOztBQUFBLEVBQUEsTUFBTSxDQUFDLE9BQVAsR0FDTTtBQUNTLElBQUEsNEJBQUEsR0FBQTtBQUNYLE1BQUEsSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLElBQUMsQ0FBQSxPQUFELEdBQVcsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsa0JBQXZCLENBQWxCLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsWUFBVCxDQUFzQixNQUF0QixFQUE4QixJQUE5QixDQURBLENBQUE7QUFBQSxNQUVBLElBQUMsQ0FBQSxPQUFPLENBQUMsZUFBVCxDQUF5QixVQUF6QixDQUZBLENBQUE7QUFBQSxNQUdBLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBQyxDQUFBLE9BQU8sQ0FBQyxRQUFULENBQUEsQ0FIVixDQURXO0lBQUEsQ0FBYjs7QUFBQSxpQ0FNQSxPQUFBLEdBQVMsU0FBQSxHQUFBO2FBQ1AsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULENBQUEsRUFETztJQUFBLENBTlQsQ0FBQTs7QUFBQSxpQ0FTQSxPQUFBLEdBQVMsU0FBQyxJQUFELEdBQUE7QUFDUCxVQUFBLElBQUE7QUFBQSxNQUFBLHFEQUEyQixDQUFFLG1CQUF0QixLQUFtQyxjQUExQztBQUNFLFFBQUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQW1CLElBQUksQ0FBQyxRQUFRLENBQUMsbUJBQWQsQ0FBa0MsY0FBbEMsQ0FBbkIsQ0FBQSxDQURGO09BQUE7YUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBZ0IsSUFBaEIsRUFITztJQUFBLENBVFQsQ0FBQTs7OEJBQUE7O01BRkYsQ0FBQTtBQUFBIgp9

//# sourceURL=/Users/erewok/.atom/packages/autocomplete-haskell/lib/last-suggestion-view.coffee

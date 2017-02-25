(function() {
  var Utils;

  module.exports = Utils = {
    MainMenuLabel: 'Haskell IDE',
    getEventType: function(detail) {
      var _ref;
      if (((detail != null ? detail.contextCommand : void 0) != null) || ((detail != null ? (_ref = detail[0]) != null ? _ref.contextCommand : void 0 : void 0) != null)) {
        return 'context';
      } else {
        return 'keyboard';
      }
    },
    bufferPositionFromMouseEvent: function(editor, event) {
      return editor.bufferPositionForScreenPosition(atom.views.getView(editor).component.screenPositionForMouseEvent(event));
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvdXRpbHMuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFBQSxNQUFBLEtBQUE7O0FBQUEsRUFBQSxNQUFNLENBQUMsT0FBUCxHQUFpQixLQUFBLEdBQ2Y7QUFBQSxJQUFBLGFBQUEsRUFBZSxhQUFmO0FBQUEsSUFFQSxZQUFBLEVBQWMsU0FBQyxNQUFELEdBQUE7QUFDWixVQUFBLElBQUE7QUFBQSxNQUFBLElBQUcsMkRBQUEsSUFBMkIsK0ZBQTlCO2VBQ0UsVUFERjtPQUFBLE1BQUE7ZUFHRSxXQUhGO09BRFk7SUFBQSxDQUZkO0FBQUEsSUFTQSw0QkFBQSxFQUE4QixTQUFDLE1BQUQsRUFBUyxLQUFULEdBQUE7YUFDNUIsTUFBTSxDQUFDLCtCQUFQLENBQ0UsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFYLENBQW1CLE1BQW5CLENBQTBCLENBQUMsU0FBUyxDQUFDLDJCQUFyQyxDQUFpRSxLQUFqRSxDQURGLEVBRDRCO0lBQUEsQ0FUOUI7R0FERixDQUFBO0FBQUEiCn0=

//# sourceURL=/Users/erewok/.atom/packages/ide-haskell/lib/utils.coffee

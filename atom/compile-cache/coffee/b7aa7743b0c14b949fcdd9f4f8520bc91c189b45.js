(function() {
  var OutputPanelItemElement, OutputPanelItemView,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  OutputPanelItemView = (function(_super) {
    __extends(OutputPanelItemView, _super);

    function OutputPanelItemView() {
      return OutputPanelItemView.__super__.constructor.apply(this, arguments);
    }

    OutputPanelItemView.prototype.setModel = function(model) {
      var MessageObject;
      this.model = model;
      this.innerHTML = '';
      if ((this.model.uri != null) && (this.model.position != null)) {
        this.appendChild(this.position = document.createElement('ide-haskell-item-position'));
        this.position.innerText = "" + this.model.uri + ": " + (this.model.position.row + 1) + ", " + (this.model.position.column + 1);
      }
      this.appendChild(this.description = document.createElement('ide-haskell-item-description'));
      MessageObject = require('../../message-object.coffee');
      MessageObject.fromObject(this.model.message).paste(this.description);
      return this;
    };

    OutputPanelItemView.prototype.attachedCallback = function() {
      var SubAtom;
      SubAtom = require('sub-atom');
      this.disposables = new SubAtom;
      if (this.position != null) {
        return this.disposables.add(this.position, 'click', (function(_this) {
          return function() {
            return atom.workspace.open(_this.model.uri).then(function(editor) {
              return editor.setCursorBufferPosition(_this.model.position);
            });
          };
        })(this));
      }
    };

    OutputPanelItemView.prototype.destroy = function() {
      this.remove();
      this.disposables.dispose();
      return this.disposables = null;
    };

    return OutputPanelItemView;

  })(HTMLElement);

  OutputPanelItemElement = document.registerElement('ide-haskell-panel-item', {
    prototype: OutputPanelItemView.prototype
  });

  module.exports = OutputPanelItemElement;

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvb3V0cHV0LXBhbmVsL3ZpZXdzL291dHB1dC1wYW5lbC1pdGVtLmNvZmZlZSIKICBdLAogICJuYW1lcyI6IFtdLAogICJtYXBwaW5ncyI6ICJBQUFBO0FBQUEsTUFBQSwyQ0FBQTtJQUFBO21TQUFBOztBQUFBLEVBQU07QUFDSiwwQ0FBQSxDQUFBOzs7O0tBQUE7O0FBQUEsa0NBQUEsUUFBQSxHQUFVLFNBQUUsS0FBRixHQUFBO0FBQ1IsVUFBQSxhQUFBO0FBQUEsTUFEUyxJQUFDLENBQUEsUUFBQSxLQUNWLENBQUE7QUFBQSxNQUFBLElBQUMsQ0FBQSxTQUFELEdBQWEsRUFBYixDQUFBO0FBQ0EsTUFBQSxJQUFHLHdCQUFBLElBQWdCLDZCQUFuQjtBQUNFLFFBQUEsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsUUFBRCxHQUFZLFFBQVEsQ0FBQyxhQUFULENBQXVCLDJCQUF2QixDQUF6QixDQUFBLENBQUE7QUFBQSxRQUNBLElBQUMsQ0FBQSxRQUFRLENBQUMsU0FBVixHQUFzQixFQUFBLEdBQUcsSUFBQyxDQUFBLEtBQUssQ0FBQyxHQUFWLEdBQWMsSUFBZCxHQUFpQixDQUFDLElBQUMsQ0FBQSxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQWhCLEdBQXNCLENBQXZCLENBQWpCLEdBQTBDLElBQTFDLEdBQTZDLENBQUMsSUFBQyxDQUFBLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBaEIsR0FBeUIsQ0FBMUIsQ0FEbkUsQ0FERjtPQURBO0FBQUEsTUFJQSxJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxXQUFELEdBQWUsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsOEJBQXZCLENBQTVCLENBSkEsQ0FBQTtBQUFBLE1BS0EsYUFBQSxHQUFnQixPQUFBLENBQVEsNkJBQVIsQ0FMaEIsQ0FBQTtBQUFBLE1BTUEsYUFBYSxDQUFDLFVBQWQsQ0FBeUIsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFoQyxDQUF3QyxDQUFDLEtBQXpDLENBQStDLElBQUMsQ0FBQSxXQUFoRCxDQU5BLENBQUE7YUFPQSxLQVJRO0lBQUEsQ0FBVixDQUFBOztBQUFBLGtDQVVBLGdCQUFBLEdBQWtCLFNBQUEsR0FBQTtBQUNoQixVQUFBLE9BQUE7QUFBQSxNQUFBLE9BQUEsR0FBVSxPQUFBLENBQVEsVUFBUixDQUFWLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxXQUFELEdBQWUsR0FBQSxDQUFBLE9BRGYsQ0FBQTtBQUVBLE1BQUEsSUFBRyxxQkFBSDtlQUNFLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFDLENBQUEsUUFBbEIsRUFBNEIsT0FBNUIsRUFBcUMsQ0FBQSxTQUFBLEtBQUEsR0FBQTtpQkFBQSxTQUFBLEdBQUE7bUJBQ25DLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQixLQUFDLENBQUEsS0FBSyxDQUFDLEdBQTNCLENBQStCLENBQUMsSUFBaEMsQ0FBcUMsU0FBQyxNQUFELEdBQUE7cUJBQ25DLE1BQU0sQ0FBQyx1QkFBUCxDQUErQixLQUFDLENBQUEsS0FBSyxDQUFDLFFBQXRDLEVBRG1DO1lBQUEsQ0FBckMsRUFEbUM7VUFBQSxFQUFBO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFyQyxFQURGO09BSGdCO0lBQUEsQ0FWbEIsQ0FBQTs7QUFBQSxrQ0FrQkEsT0FBQSxHQUFTLFNBQUEsR0FBQTtBQUNQLE1BQUEsSUFBQyxDQUFBLE1BQUQsQ0FBQSxDQUFBLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxXQUFXLENBQUMsT0FBYixDQUFBLENBREEsQ0FBQTthQUVBLElBQUMsQ0FBQSxXQUFELEdBQWUsS0FIUjtJQUFBLENBbEJULENBQUE7OytCQUFBOztLQURnQyxZQUFsQyxDQUFBOztBQUFBLEVBeUJBLHNCQUFBLEdBQ0UsUUFBUSxDQUFDLGVBQVQsQ0FBeUIsd0JBQXpCLEVBQ0U7QUFBQSxJQUFBLFNBQUEsRUFBVyxtQkFBbUIsQ0FBQyxTQUEvQjtHQURGLENBMUJGLENBQUE7O0FBQUEsRUE2QkEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsc0JBN0JqQixDQUFBO0FBQUEiCn0=

//# sourceURL=/Users/erewok/.atom/packages/ide-haskell/lib/output-panel/views/output-panel-item.coffee

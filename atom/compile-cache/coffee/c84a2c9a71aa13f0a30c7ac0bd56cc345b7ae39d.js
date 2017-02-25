(function() {
  var MessageObject, TooltipElement, TooltipMessage, TooltipView,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  MessageObject = require('../message-object.coffee');

  module.exports = TooltipMessage = (function() {
    function TooltipMessage(text) {
      this.element = (new TooltipElement).setMessage(text);
    }

    return TooltipMessage;

  })();

  TooltipView = (function(_super) {
    __extends(TooltipView, _super);

    function TooltipView() {
      return TooltipView.__super__.constructor.apply(this, arguments);
    }

    TooltipView.prototype.setMessage = function(message) {
      var inner, m, _i, _len;
      this.innerHtml = '';
      if (message instanceof Array) {
        for (_i = 0, _len = message.length; _i < _len; _i++) {
          m = message[_i];
          this.appendChild(inner = document.createElement('div'));
          MessageObject.fromObject(m).paste(inner);
        }
      } else {
        this.appendChild(inner = document.createElement('div'));
        MessageObject.fromObject(message).paste(inner);
      }
      return this;
    };

    TooltipView.prototype.attachedCallback = function() {
      return this.parentElement.classList.add('ide-haskell');
    };

    return TooltipView;

  })(HTMLElement);

  TooltipElement = document.registerElement('ide-haskell-tooltip', {
    prototype: TooltipView.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvdmlld3MvdG9vbHRpcC12aWV3LmNvZmZlZSIKICBdLAogICJuYW1lcyI6IFtdLAogICJtYXBwaW5ncyI6ICJBQUFBO0FBQUEsTUFBQSwwREFBQTtJQUFBO21TQUFBOztBQUFBLEVBQUEsYUFBQSxHQUFnQixPQUFBLENBQVEsMEJBQVIsQ0FBaEIsQ0FBQTs7QUFBQSxFQUVBLE1BQU0sQ0FBQyxPQUFQLEdBQ007QUFDUyxJQUFBLHdCQUFDLElBQUQsR0FBQTtBQUNYLE1BQUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxDQUFDLEdBQUEsQ0FBQSxjQUFELENBQW9CLENBQUMsVUFBckIsQ0FBZ0MsSUFBaEMsQ0FBWCxDQURXO0lBQUEsQ0FBYjs7MEJBQUE7O01BSkYsQ0FBQTs7QUFBQSxFQU9NO0FBQ0osa0NBQUEsQ0FBQTs7OztLQUFBOztBQUFBLDBCQUFBLFVBQUEsR0FBWSxTQUFDLE9BQUQsR0FBQTtBQUNWLFVBQUEsa0JBQUE7QUFBQSxNQUFBLElBQUMsQ0FBQSxTQUFELEdBQWEsRUFBYixDQUFBO0FBQ0EsTUFBQSxJQUFHLE9BQUEsWUFBbUIsS0FBdEI7QUFDRSxhQUFBLDhDQUFBOzBCQUFBO0FBQ0UsVUFBQSxJQUFDLENBQUEsV0FBRCxDQUFhLEtBQUEsR0FBUSxRQUFRLENBQUMsYUFBVCxDQUF1QixLQUF2QixDQUFyQixDQUFBLENBQUE7QUFBQSxVQUNBLGFBQWEsQ0FBQyxVQUFkLENBQXlCLENBQXpCLENBQTJCLENBQUMsS0FBNUIsQ0FBa0MsS0FBbEMsQ0FEQSxDQURGO0FBQUEsU0FERjtPQUFBLE1BQUE7QUFLRSxRQUFBLElBQUMsQ0FBQSxXQUFELENBQWEsS0FBQSxHQUFRLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCLENBQXJCLENBQUEsQ0FBQTtBQUFBLFFBQ0EsYUFBYSxDQUFDLFVBQWQsQ0FBeUIsT0FBekIsQ0FBaUMsQ0FBQyxLQUFsQyxDQUF3QyxLQUF4QyxDQURBLENBTEY7T0FEQTthQVFBLEtBVFU7SUFBQSxDQUFaLENBQUE7O0FBQUEsMEJBV0EsZ0JBQUEsR0FBa0IsU0FBQSxHQUFBO2FBQ2hCLElBQUMsQ0FBQSxhQUFhLENBQUMsU0FBUyxDQUFDLEdBQXpCLENBQTZCLGFBQTdCLEVBRGdCO0lBQUEsQ0FYbEIsQ0FBQTs7dUJBQUE7O0tBRHdCLFlBUDFCLENBQUE7O0FBQUEsRUFzQkEsY0FBQSxHQUNFLFFBQVEsQ0FBQyxlQUFULENBQXlCLHFCQUF6QixFQUNFO0FBQUEsSUFBQSxTQUFBLEVBQVcsV0FBVyxDQUFDLFNBQXZCO0dBREYsQ0F2QkYsQ0FBQTtBQUFBIgp9

//# sourceURL=/Users/erewok/.atom/packages/ide-haskell/lib/views/tooltip-view.coffee

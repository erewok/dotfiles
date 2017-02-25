(function() {
  var OutputPanelItemsElement, OutputPanelItemsView,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  OutputPanelItemsView = (function(_super) {
    __extends(OutputPanelItemsView, _super);

    function OutputPanelItemsView() {
      return OutputPanelItemsView.__super__.constructor.apply(this, arguments);
    }

    OutputPanelItemsView.prototype.setModel = function(model) {
      this.model = model;
    };

    OutputPanelItemsView.prototype.createdCallback = function() {
      this.classList.add('native-key-bindings');
      this.setAttribute('tabindex', -1);
      return this.itemViews = [];
    };

    OutputPanelItemsView.prototype.filter = function(activeFilter) {
      var OutputPanelItemElement, i, scrollTop;
      this.activeFilter = activeFilter;
      scrollTop = this.scrollTop;
      this.clear();
      this.items = this.model.filter(this.activeFilter);
      OutputPanelItemElement = require('./output-panel-item');
      this.itemViews = (function() {
        var _i, _len, _ref, _results;
        _ref = this.items;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          i = _ref[_i];
          _results.push(this.appendChild((new OutputPanelItemElement).setModel(i)));
        }
        return _results;
      }).call(this);
      return this.scrollTop = scrollTop;
    };

    OutputPanelItemsView.prototype.showItem = function(item) {
      var view;
      view = this.itemViews[this.items.indexOf(item)];
      if (view == null) {
        return;
      }
      view.position.click();
      return view.scrollIntoView({
        block: "start",
        behavior: "smooth"
      });
    };

    OutputPanelItemsView.prototype.scrollToEnd = function() {
      return this.scrollTop = this.scrollHeight;
    };

    OutputPanelItemsView.prototype.atEnd = function() {
      return this.scrollTop >= (this.scrollHeight - this.clientHeight);
    };

    OutputPanelItemsView.prototype.clear = function() {
      var i, _i, _len, _ref;
      _ref = this.itemViews;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        i.destroy();
      }
      return this.itemViews = [];
    };

    OutputPanelItemsView.prototype.destroy = function() {
      this.remove();
      return this.clear();
    };

    return OutputPanelItemsView;

  })(HTMLElement);

  OutputPanelItemsElement = document.registerElement('ide-haskell-panel-items', {
    prototype: OutputPanelItemsView.prototype
  });

  module.exports = OutputPanelItemsElement;

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvb3V0cHV0LXBhbmVsL3ZpZXdzL291dHB1dC1wYW5lbC1pdGVtcy5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLE1BQUEsNkNBQUE7SUFBQTttU0FBQTs7QUFBQSxFQUFNO0FBQ0osMkNBQUEsQ0FBQTs7OztLQUFBOztBQUFBLG1DQUFBLFFBQUEsR0FBVSxTQUFFLEtBQUYsR0FBQTtBQUFVLE1BQVQsSUFBQyxDQUFBLFFBQUEsS0FBUSxDQUFWO0lBQUEsQ0FBVixDQUFBOztBQUFBLG1DQUVBLGVBQUEsR0FBaUIsU0FBQSxHQUFBO0FBQ2YsTUFBQSxJQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSxxQkFBZixDQUFBLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxZQUFELENBQWMsVUFBZCxFQUEwQixDQUFBLENBQTFCLENBREEsQ0FBQTthQUVBLElBQUMsQ0FBQSxTQUFELEdBQWEsR0FIRTtJQUFBLENBRmpCLENBQUE7O0FBQUEsbUNBT0EsTUFBQSxHQUFRLFNBQUUsWUFBRixHQUFBO0FBQ04sVUFBQSxvQ0FBQTtBQUFBLE1BRE8sSUFBQyxDQUFBLGVBQUEsWUFDUixDQUFBO0FBQUEsTUFBQSxTQUFBLEdBQVksSUFBQyxDQUFBLFNBQWIsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBQSxDQURBLENBQUE7QUFBQSxNQUVBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBQyxDQUFBLEtBQUssQ0FBQyxNQUFQLENBQWMsSUFBQyxDQUFBLFlBQWYsQ0FGVCxDQUFBO0FBQUEsTUFHQSxzQkFBQSxHQUF5QixPQUFBLENBQVEscUJBQVIsQ0FIekIsQ0FBQTtBQUFBLE1BSUEsSUFBQyxDQUFBLFNBQUQ7O0FBQWE7QUFBQTthQUFBLDJDQUFBO3VCQUFBO0FBQ1gsd0JBQUEsSUFBQyxDQUFBLFdBQUQsQ0FBYSxDQUFDLEdBQUEsQ0FBQSxzQkFBRCxDQUE0QixDQUFDLFFBQTdCLENBQXNDLENBQXRDLENBQWIsRUFBQSxDQURXO0FBQUE7O21CQUpiLENBQUE7YUFNQSxJQUFDLENBQUEsU0FBRCxHQUFhLFVBUFA7SUFBQSxDQVBSLENBQUE7O0FBQUEsbUNBZ0JBLFFBQUEsR0FBVSxTQUFDLElBQUQsR0FBQTtBQUNSLFVBQUEsSUFBQTtBQUFBLE1BQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxTQUFVLENBQUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQLENBQWUsSUFBZixDQUFBLENBQWxCLENBQUE7QUFDQSxNQUFBLElBQWMsWUFBZDtBQUFBLGNBQUEsQ0FBQTtPQURBO0FBQUEsTUFFQSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQWQsQ0FBQSxDQUZBLENBQUE7YUFHQSxJQUFJLENBQUMsY0FBTCxDQUNFO0FBQUEsUUFBQSxLQUFBLEVBQU8sT0FBUDtBQUFBLFFBQ0EsUUFBQSxFQUFVLFFBRFY7T0FERixFQUpRO0lBQUEsQ0FoQlYsQ0FBQTs7QUFBQSxtQ0F3QkEsV0FBQSxHQUFhLFNBQUEsR0FBQTthQUNYLElBQUMsQ0FBQSxTQUFELEdBQWEsSUFBQyxDQUFBLGFBREg7SUFBQSxDQXhCYixDQUFBOztBQUFBLG1DQTJCQSxLQUFBLEdBQU8sU0FBQSxHQUFBO2FBQ0wsSUFBQyxDQUFBLFNBQUQsSUFBYyxDQUFDLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUMsQ0FBQSxZQUFsQixFQURUO0lBQUEsQ0EzQlAsQ0FBQTs7QUFBQSxtQ0E4QkEsS0FBQSxHQUFPLFNBQUEsR0FBQTtBQUNMLFVBQUEsaUJBQUE7QUFBQTtBQUFBLFdBQUEsMkNBQUE7cUJBQUE7QUFBQSxRQUFBLENBQUMsQ0FBQyxPQUFGLENBQUEsQ0FBQSxDQUFBO0FBQUEsT0FBQTthQUNBLElBQUMsQ0FBQSxTQUFELEdBQWEsR0FGUjtJQUFBLENBOUJQLENBQUE7O0FBQUEsbUNBa0NBLE9BQUEsR0FBUyxTQUFBLEdBQUE7QUFDUCxNQUFBLElBQUMsQ0FBQSxNQUFELENBQUEsQ0FBQSxDQUFBO2FBQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBQSxFQUZPO0lBQUEsQ0FsQ1QsQ0FBQTs7Z0NBQUE7O0tBRGlDLFlBQW5DLENBQUE7O0FBQUEsRUF1Q0EsdUJBQUEsR0FDRSxRQUFRLENBQUMsZUFBVCxDQUF5Qix5QkFBekIsRUFDRTtBQUFBLElBQUEsU0FBQSxFQUFXLG9CQUFvQixDQUFDLFNBQWhDO0dBREYsQ0F4Q0YsQ0FBQTs7QUFBQSxFQTJDQSxNQUFNLENBQUMsT0FBUCxHQUFpQix1QkEzQ2pCLENBQUE7QUFBQSIKfQ==

//# sourceURL=/Users/erewok/.atom/packages/ide-haskell/lib/output-panel/views/output-panel-items.coffee

(function() {
  var ImportListView, SelectListView,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  SelectListView = require('atom-space-pen-views').SelectListView;

  module.exports = ImportListView = (function(_super) {
    __extends(ImportListView, _super);

    function ImportListView() {
      return ImportListView.__super__.constructor.apply(this, arguments);
    }

    ImportListView.prototype.initialize = function(_arg) {
      var items;
      this.onConfirmed = _arg.onConfirmed, items = _arg.items;
      ImportListView.__super__.initialize.apply(this, arguments);
      this.panel = atom.workspace.addModalPanel({
        item: this,
        visible: false
      });
      this.addClass('ide-haskell');
      return this.show(items);
    };

    ImportListView.prototype.cancelled = function() {
      return this.panel.destroy();
    };

    ImportListView.prototype.getFilterKey = function() {
      return "text";
    };

    ImportListView.prototype.show = function(list) {
      this.setItems(list);
      this.panel.show();
      this.storeFocusedElement();
      return this.focusFilterEditor();
    };

    ImportListView.prototype.viewForItem = function(mod) {
      return "<li>" + mod + "</li>";
    };

    ImportListView.prototype.confirmed = function(mod) {
      if (typeof this.onConfirmed === "function") {
        this.onConfirmed(mod);
      }
      return this.cancel();
    };

    return ImportListView;

  })(SelectListView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL3ZpZXdzL2ltcG9ydC1saXN0LXZpZXcuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFBQSxNQUFBLDhCQUFBO0lBQUE7bVNBQUE7O0FBQUEsRUFBQyxpQkFBa0IsT0FBQSxDQUFRLHNCQUFSLEVBQWxCLGNBQUQsQ0FBQTs7QUFBQSxFQUVBLE1BQU0sQ0FBQyxPQUFQLEdBQ007QUFDSixxQ0FBQSxDQUFBOzs7O0tBQUE7O0FBQUEsNkJBQUEsVUFBQSxHQUFZLFNBQUMsSUFBRCxHQUFBO0FBQ1YsVUFBQSxLQUFBO0FBQUEsTUFEWSxJQUFDLENBQUEsbUJBQUEsYUFBYSxhQUFBLEtBQzFCLENBQUE7QUFBQSxNQUFBLGdEQUFBLFNBQUEsQ0FBQSxDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBZixDQUNQO0FBQUEsUUFBQSxJQUFBLEVBQU0sSUFBTjtBQUFBLFFBQ0EsT0FBQSxFQUFTLEtBRFQ7T0FETyxDQURULENBQUE7QUFBQSxNQUlBLElBQUMsQ0FBQSxRQUFELENBQVUsYUFBVixDQUpBLENBQUE7YUFLQSxJQUFDLENBQUEsSUFBRCxDQUFNLEtBQU4sRUFOVTtJQUFBLENBQVosQ0FBQTs7QUFBQSw2QkFRQSxTQUFBLEdBQVcsU0FBQSxHQUFBO2FBQ1QsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQLENBQUEsRUFEUztJQUFBLENBUlgsQ0FBQTs7QUFBQSw2QkFXQSxZQUFBLEdBQWMsU0FBQSxHQUFBO2FBQ1osT0FEWTtJQUFBLENBWGQsQ0FBQTs7QUFBQSw2QkFjQSxJQUFBLEdBQU0sU0FBQyxJQUFELEdBQUE7QUFDSixNQUFBLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixDQUFBLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxDQUFBLENBREEsQ0FBQTtBQUFBLE1BRUEsSUFBQyxDQUFBLG1CQUFELENBQUEsQ0FGQSxDQUFBO2FBR0EsSUFBQyxDQUFBLGlCQUFELENBQUEsRUFKSTtJQUFBLENBZE4sQ0FBQTs7QUFBQSw2QkFvQkEsV0FBQSxHQUFhLFNBQUMsR0FBRCxHQUFBO2FBQ1YsTUFBQSxHQUFNLEdBQU4sR0FBVSxRQURBO0lBQUEsQ0FwQmIsQ0FBQTs7QUFBQSw2QkF1QkEsU0FBQSxHQUFXLFNBQUMsR0FBRCxHQUFBOztRQUNULElBQUMsQ0FBQSxZQUFhO09BQWQ7YUFDQSxJQUFDLENBQUEsTUFBRCxDQUFBLEVBRlM7SUFBQSxDQXZCWCxDQUFBOzswQkFBQTs7S0FEMkIsZUFIN0IsQ0FBQTtBQUFBIgp9

//# sourceURL=/Users/erewok/.atom/packages/haskell-ghc-mod/lib/views/import-list-view.coffee

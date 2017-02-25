(function() {
  var ProgressBar, ProgressBarElement,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ProgressBar = (function(_super) {
    __extends(ProgressBar, _super);

    function ProgressBar() {
      return ProgressBar.__super__.constructor.apply(this, arguments);
    }

    ProgressBar.prototype.createdCallback = function() {
      return this.appendChild(this.span = document.createElement('span'));
    };

    ProgressBar.prototype.setProgress = function(progress) {
      this.span.style.setProperty('width', "" + (progress * 100) + "%");
      if (progress <= 0) {
        return this.classList.remove('visible');
      } else {
        return this.classList.add('visible');
      }
    };

    return ProgressBar;

  })(HTMLElement);

  module.exports = ProgressBarElement = document.registerElement('ide-haskell-progress-bar', {
    prototype: ProgressBar.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvb3V0cHV0LXBhbmVsL3ZpZXdzL3Byb2dyZXNzLWJhci5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLE1BQUEsK0JBQUE7SUFBQTttU0FBQTs7QUFBQSxFQUFNO0FBQ0osa0NBQUEsQ0FBQTs7OztLQUFBOztBQUFBLDBCQUFBLGVBQUEsR0FBaUIsU0FBQSxHQUFBO2FBQ2YsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsSUFBRCxHQUFRLFFBQVEsQ0FBQyxhQUFULENBQXVCLE1BQXZCLENBQXJCLEVBRGU7SUFBQSxDQUFqQixDQUFBOztBQUFBLDBCQUdBLFdBQUEsR0FBYSxTQUFDLFFBQUQsR0FBQTtBQUNYLE1BQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBWixDQUF3QixPQUF4QixFQUFpQyxFQUFBLEdBQUUsQ0FBQyxRQUFBLEdBQVcsR0FBWixDQUFGLEdBQWtCLEdBQW5ELENBQUEsQ0FBQTtBQUNBLE1BQUEsSUFBRyxRQUFBLElBQVksQ0FBZjtlQUNFLElBQUMsQ0FBQSxTQUFTLENBQUMsTUFBWCxDQUFrQixTQUFsQixFQURGO09BQUEsTUFBQTtlQUdFLElBQUMsQ0FBQSxTQUFTLENBQUMsR0FBWCxDQUFlLFNBQWYsRUFIRjtPQUZXO0lBQUEsQ0FIYixDQUFBOzt1QkFBQTs7S0FEd0IsWUFBMUIsQ0FBQTs7QUFBQSxFQVlBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLGtCQUFBLEdBQ2YsUUFBUSxDQUFDLGVBQVQsQ0FBeUIsMEJBQXpCLEVBQ0U7QUFBQSxJQUFBLFNBQUEsRUFBVyxXQUFXLENBQUMsU0FBdkI7R0FERixDQWJGLENBQUE7QUFBQSIKfQ==

//# sourceURL=/Users/erewok/.atom/packages/ide-haskell/lib/output-panel/views/progress-bar.coffee

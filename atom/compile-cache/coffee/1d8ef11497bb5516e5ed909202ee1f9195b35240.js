(function() {
  var ResultItem;

  module.exports = ResultItem = (function() {
    function ResultItem(parent, _arg) {
      this.parent = parent;
      this.uri = _arg.uri, this.message = _arg.message, this.severity = _arg.severity, this.position = _arg.position;
    }

    ResultItem.prototype.destroy = function() {
      if (this.parent != null) {
        return this.parent.removeResult(this);
      }
    };

    return ResultItem;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvcmVzdWx0LWl0ZW0uY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFBQSxNQUFBLFVBQUE7O0FBQUEsRUFBQSxNQUFNLENBQUMsT0FBUCxHQUNNO0FBQ1MsSUFBQSxvQkFBRSxNQUFGLEVBQVUsSUFBVixHQUFBO0FBQW1ELE1BQWxELElBQUMsQ0FBQSxTQUFBLE1BQWlELENBQUE7QUFBQSxNQUF4QyxJQUFDLENBQUEsV0FBQSxLQUFLLElBQUMsQ0FBQSxlQUFBLFNBQVMsSUFBQyxDQUFBLGdCQUFBLFVBQVUsSUFBQyxDQUFBLGdCQUFBLFFBQVksQ0FBbkQ7SUFBQSxDQUFiOztBQUFBLHlCQUVBLE9BQUEsR0FBUyxTQUFBLEdBQUE7QUFDUCxNQUFBLElBQUcsbUJBQUg7ZUFDRSxJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBcUIsSUFBckIsRUFERjtPQURPO0lBQUEsQ0FGVCxDQUFBOztzQkFBQTs7TUFGRixDQUFBO0FBQUEiCn0=

//# sourceURL=/Users/erewok/.atom/packages/ide-haskell/lib/result-item.coffee

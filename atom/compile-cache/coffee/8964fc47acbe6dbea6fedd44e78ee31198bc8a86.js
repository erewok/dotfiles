(function() {
  var MessageObject;

  module.exports = MessageObject = (function() {
    function MessageObject(_arg) {
      this.text = _arg.text, this.highlighter = _arg.highlighter, this.html = _arg.html;
    }

    MessageObject.fromObject = function(message) {
      if (typeof message === 'string') {
        return new MessageObject({
          text: message
        });
      } else if (typeof message === 'object') {
        this.validate(message);
        return new MessageObject(message);
      }
    };

    MessageObject.validate = function(message) {
      if ((message.text != null) && (message.html != null)) {
        throw new Error('Can\'t have both text and html set');
      }
      if ((message.highlighter != null) && (message.text == null)) {
        throw new Error('Must pass text when highlighter is set');
      }
      if ((message.text == null) && (message.html == null)) {
        throw new Error('Neither text nor html is set');
      }
    };

    MessageObject.prototype.toHtml = function() {
      var cls, div, g, l, ls, s, span, start, t, tl, tls;
      if ((this.highlighter != null) && (this.text != null)) {
        g = atom.grammars.grammarForScopeName(this.highlighter);
        if (g == null) {
          this.highlighter = null;
          return this.toHtml();
        }
        ls = g.tokenizeLines(this.text);
        tls = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = ls.length; _i < _len; _i++) {
            l = ls[_i];
            tl = (function() {
              var _j, _k, _len1, _len2, _ref, _ref1, _results1;
              _results1 = [];
              for (_j = 0, _len1 = l.length; _j < _len1; _j++) {
                t = l[_j];
                span = start = document.createElement('span');
                _ref = t.scopes;
                for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
                  s = _ref[_k];
                  span.appendChild(span = document.createElement('span'));
                  cls = s.split('.');
                  (_ref1 = span.classList).add.apply(_ref1, cls);
                }
                span.innerText = t.value;
                _results1.push(start.innerHTML);
              }
              return _results1;
            })();
            _results.push(tl.join(''));
          }
          return _results;
        })();
        return tls.join('\n');
      } else if (this.html != null) {
        return this.html;
      } else {
        div = document.createElement('div');
        div.innerText = this.text;
        return div.innerHTML;
      }
    };

    MessageObject.prototype.paste = function(element) {
      return element.innerHTML = this.toHtml();
    };

    return MessageObject;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvbWVzc2FnZS1vYmplY3QuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFBQSxNQUFBLGFBQUE7O0FBQUEsRUFBQSxNQUFNLENBQUMsT0FBUCxHQUNNO0FBQ1MsSUFBQSx1QkFBQyxJQUFELEdBQUE7QUFBZ0MsTUFBOUIsSUFBQyxDQUFBLFlBQUEsTUFBTSxJQUFDLENBQUEsbUJBQUEsYUFBYSxJQUFDLENBQUEsWUFBQSxJQUFRLENBQWhDO0lBQUEsQ0FBYjs7QUFBQSxJQUVBLGFBQUMsQ0FBQSxVQUFELEdBQWEsU0FBQyxPQUFELEdBQUE7QUFDWCxNQUFBLElBQUcsTUFBQSxDQUFBLE9BQUEsS0FBbUIsUUFBdEI7QUFDRSxlQUFXLElBQUEsYUFBQSxDQUNUO0FBQUEsVUFBQSxJQUFBLEVBQU0sT0FBTjtTQURTLENBQVgsQ0FERjtPQUFBLE1BR0ssSUFBRyxNQUFBLENBQUEsT0FBQSxLQUFtQixRQUF0QjtBQUNILFFBQUEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxPQUFWLENBQUEsQ0FBQTtBQUNBLGVBQVcsSUFBQSxhQUFBLENBQWMsT0FBZCxDQUFYLENBRkc7T0FKTTtJQUFBLENBRmIsQ0FBQTs7QUFBQSxJQVVBLGFBQUMsQ0FBQSxRQUFELEdBQVcsU0FBQyxPQUFELEdBQUE7QUFDVCxNQUFBLElBQUcsc0JBQUEsSUFBa0Isc0JBQXJCO0FBQ0UsY0FBVSxJQUFBLEtBQUEsQ0FBTSxvQ0FBTixDQUFWLENBREY7T0FBQTtBQUVBLE1BQUEsSUFBRyw2QkFBQSxJQUE2QixzQkFBaEM7QUFDRSxjQUFVLElBQUEsS0FBQSxDQUFNLHdDQUFOLENBQVYsQ0FERjtPQUZBO0FBSUEsTUFBQSxJQUFPLHNCQUFKLElBQTBCLHNCQUE3QjtBQUNFLGNBQVUsSUFBQSxLQUFBLENBQU0sOEJBQU4sQ0FBVixDQURGO09BTFM7SUFBQSxDQVZYLENBQUE7O0FBQUEsNEJBa0JBLE1BQUEsR0FBUSxTQUFBLEdBQUE7QUFDTixVQUFBLDhDQUFBO0FBQUEsTUFBQSxJQUFHLDBCQUFBLElBQWtCLG1CQUFyQjtBQUNFLFFBQUEsQ0FBQSxHQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsbUJBQWQsQ0FBa0MsSUFBQyxDQUFBLFdBQW5DLENBQUosQ0FBQTtBQUNBLFFBQUEsSUFBTyxTQUFQO0FBQ0UsVUFBQSxJQUFDLENBQUEsV0FBRCxHQUFlLElBQWYsQ0FBQTtBQUNBLGlCQUFPLElBQUMsQ0FBQSxNQUFELENBQUEsQ0FBUCxDQUZGO1NBREE7QUFBQSxRQUlBLEVBQUEsR0FBSyxDQUFDLENBQUMsYUFBRixDQUFnQixJQUFDLENBQUEsSUFBakIsQ0FKTCxDQUFBO0FBQUEsUUFLQSxHQUFBOztBQUFNO2VBQUEseUNBQUE7dUJBQUE7QUFDSixZQUFBLEVBQUE7O0FBQUs7bUJBQUEsMENBQUE7MEJBQUE7QUFDSCxnQkFBQSxJQUFBLEdBQU8sS0FBQSxHQUFRLFFBQVEsQ0FBQyxhQUFULENBQXVCLE1BQXZCLENBQWYsQ0FBQTtBQUNBO0FBQUEscUJBQUEsNkNBQUE7K0JBQUE7QUFDRSxrQkFBQSxJQUFJLENBQUMsV0FBTCxDQUFpQixJQUFBLEdBQU8sUUFBUSxDQUFDLGFBQVQsQ0FBdUIsTUFBdkIsQ0FBeEIsQ0FBQSxDQUFBO0FBQUEsa0JBQ0EsR0FBQSxHQUFNLENBQUMsQ0FBQyxLQUFGLENBQVEsR0FBUixDQUROLENBQUE7QUFBQSxrQkFFQSxTQUFBLElBQUksQ0FBQyxTQUFMLENBQWMsQ0FBQyxHQUFmLGNBQW1CLEdBQW5CLENBRkEsQ0FERjtBQUFBLGlCQURBO0FBQUEsZ0JBS0EsSUFBSSxDQUFDLFNBQUwsR0FBaUIsQ0FBQyxDQUFDLEtBTG5CLENBQUE7QUFBQSwrQkFNQSxLQUFLLENBQUMsVUFOTixDQURHO0FBQUE7O2dCQUFMLENBQUE7QUFBQSwwQkFRQSxFQUFFLENBQUMsSUFBSCxDQUFRLEVBQVIsRUFSQSxDQURJO0FBQUE7O1lBTE4sQ0FBQTtBQWVBLGVBQU8sR0FBRyxDQUFDLElBQUosQ0FBUyxJQUFULENBQVAsQ0FoQkY7T0FBQSxNQWlCSyxJQUFHLGlCQUFIO0FBQ0gsZUFBTyxJQUFDLENBQUEsSUFBUixDQURHO09BQUEsTUFBQTtBQUdILFFBQUEsR0FBQSxHQUFNLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCLENBQU4sQ0FBQTtBQUFBLFFBQ0EsR0FBRyxDQUFDLFNBQUosR0FBZ0IsSUFBQyxDQUFBLElBRGpCLENBQUE7QUFFQSxlQUFPLEdBQUcsQ0FBQyxTQUFYLENBTEc7T0FsQkM7SUFBQSxDQWxCUixDQUFBOztBQUFBLDRCQTJDQSxLQUFBLEdBQU8sU0FBQyxPQUFELEdBQUE7YUFDTCxPQUFPLENBQUMsU0FBUixHQUFvQixJQUFDLENBQUEsTUFBRCxDQUFBLEVBRGY7SUFBQSxDQTNDUCxDQUFBOzt5QkFBQTs7TUFGRixDQUFBO0FBQUEiCn0=

//# sourceURL=/Users/erewok/.atom/packages/ide-haskell/lib/message-object.coffee

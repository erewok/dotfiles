(function() {
  var MessageObject;

  module.exports = MessageObject = (function() {
    function MessageObject(arg) {
      this.text = arg.text, this.highlighter = arg.highlighter, this.html = arg.html;
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
      var div, html;
      if ((this.highlighter != null) && (this.text != null)) {
        html = require('atom-highlight')({
          fileContents: this.text,
          scopeName: this.highlighter,
          nbsp: false
        });
        if (html == null) {
          this.highlighter = null;
          return this.toHtml();
        } else {
          return html;
        }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvbWVzc2FnZS1vYmplY3QuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1MsdUJBQUMsR0FBRDtNQUFFLElBQUMsQ0FBQSxXQUFBLE1BQU0sSUFBQyxDQUFBLGtCQUFBLGFBQWEsSUFBQyxDQUFBLFdBQUE7SUFBeEI7O0lBRWIsYUFBQyxDQUFBLFVBQUQsR0FBYSxTQUFDLE9BQUQ7TUFDWCxJQUFHLE9BQU8sT0FBUCxLQUFtQixRQUF0QjtBQUNFLGVBQVcsSUFBQSxhQUFBLENBQ1Q7VUFBQSxJQUFBLEVBQU0sT0FBTjtTQURTLEVBRGI7T0FBQSxNQUdLLElBQUcsT0FBTyxPQUFQLEtBQW1CLFFBQXRCO1FBQ0gsSUFBQyxDQUFBLFFBQUQsQ0FBVSxPQUFWO0FBQ0EsZUFBVyxJQUFBLGFBQUEsQ0FBYyxPQUFkLEVBRlI7O0lBSk07O0lBUWIsYUFBQyxDQUFBLFFBQUQsR0FBVyxTQUFDLE9BQUQ7TUFDVCxJQUFHLHNCQUFBLElBQWtCLHNCQUFyQjtBQUNFLGNBQVUsSUFBQSxLQUFBLENBQU0sb0NBQU4sRUFEWjs7TUFFQSxJQUFHLDZCQUFBLElBQTZCLHNCQUFoQztBQUNFLGNBQVUsSUFBQSxLQUFBLENBQU0sd0NBQU4sRUFEWjs7TUFFQSxJQUFPLHNCQUFKLElBQTBCLHNCQUE3QjtBQUNFLGNBQVUsSUFBQSxLQUFBLENBQU0sOEJBQU4sRUFEWjs7SUFMUzs7NEJBUVgsTUFBQSxHQUFRLFNBQUE7QUFDTixVQUFBO01BQUEsSUFBRywwQkFBQSxJQUFrQixtQkFBckI7UUFDRSxJQUFBLEdBQU8sT0FBQSxDQUFRLGdCQUFSLENBQUEsQ0FDTDtVQUFBLFlBQUEsRUFBYyxJQUFDLENBQUEsSUFBZjtVQUNBLFNBQUEsRUFBVyxJQUFDLENBQUEsV0FEWjtVQUVBLElBQUEsRUFBTSxLQUZOO1NBREs7UUFJUCxJQUFPLFlBQVA7VUFDRSxJQUFDLENBQUEsV0FBRCxHQUFlO2lCQUNmLElBQUMsQ0FBQSxNQUFELENBQUEsRUFGRjtTQUFBLE1BQUE7aUJBSUUsS0FKRjtTQUxGO09BQUEsTUFVSyxJQUFHLGlCQUFIO0FBQ0gsZUFBTyxJQUFDLENBQUEsS0FETDtPQUFBLE1BQUE7UUFHSCxHQUFBLEdBQU0sUUFBUSxDQUFDLGFBQVQsQ0FBdUIsS0FBdkI7UUFDTixHQUFHLENBQUMsU0FBSixHQUFnQixJQUFDLENBQUE7QUFDakIsZUFBTyxHQUFHLENBQUMsVUFMUjs7SUFYQzs7NEJBa0JSLEtBQUEsR0FBTyxTQUFDLE9BQUQ7YUFDTCxPQUFPLENBQUMsU0FBUixHQUFvQixJQUFDLENBQUEsTUFBRCxDQUFBO0lBRGY7Ozs7O0FBdENUIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgTWVzc2FnZU9iamVjdFxuICBjb25zdHJ1Y3RvcjogKHtAdGV4dCwgQGhpZ2hsaWdodGVyLCBAaHRtbH0pIC0+XG5cbiAgQGZyb21PYmplY3Q6IChtZXNzYWdlKSAtPlxuICAgIGlmIHR5cGVvZihtZXNzYWdlKSBpcyAnc3RyaW5nJ1xuICAgICAgcmV0dXJuIG5ldyBNZXNzYWdlT2JqZWN0XG4gICAgICAgIHRleHQ6IG1lc3NhZ2VcbiAgICBlbHNlIGlmIHR5cGVvZihtZXNzYWdlKSBpcyAnb2JqZWN0J1xuICAgICAgQHZhbGlkYXRlKG1lc3NhZ2UpXG4gICAgICByZXR1cm4gbmV3IE1lc3NhZ2VPYmplY3QobWVzc2FnZSlcblxuICBAdmFsaWRhdGU6IChtZXNzYWdlKSAtPlxuICAgIGlmIG1lc3NhZ2UudGV4dD8gYW5kIG1lc3NhZ2UuaHRtbD9cbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuXFwndCBoYXZlIGJvdGggdGV4dCBhbmQgaHRtbCBzZXQnKVxuICAgIGlmIG1lc3NhZ2UuaGlnaGxpZ2h0ZXI/IGFuZCBub3QgbWVzc2FnZS50ZXh0P1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdNdXN0IHBhc3MgdGV4dCB3aGVuIGhpZ2hsaWdodGVyIGlzIHNldCcpXG4gICAgaWYgbm90IG1lc3NhZ2UudGV4dD8gYW5kIG5vdCBtZXNzYWdlLmh0bWw/XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05laXRoZXIgdGV4dCBub3IgaHRtbCBpcyBzZXQnKVxuXG4gIHRvSHRtbDogLT5cbiAgICBpZiBAaGlnaGxpZ2h0ZXI/IGFuZCBAdGV4dD9cbiAgICAgIGh0bWwgPSByZXF1aXJlKCdhdG9tLWhpZ2hsaWdodCcpXG4gICAgICAgIGZpbGVDb250ZW50czogQHRleHRcbiAgICAgICAgc2NvcGVOYW1lOiBAaGlnaGxpZ2h0ZXJcbiAgICAgICAgbmJzcDogZmFsc2VcbiAgICAgIHVubGVzcyBodG1sP1xuICAgICAgICBAaGlnaGxpZ2h0ZXIgPSBudWxsXG4gICAgICAgIEB0b0h0bWwoKVxuICAgICAgZWxzZVxuICAgICAgICBodG1sXG4gICAgZWxzZSBpZiBAaHRtbD9cbiAgICAgIHJldHVybiBAaHRtbFxuICAgIGVsc2VcbiAgICAgIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICBkaXYuaW5uZXJUZXh0ID0gQHRleHRcbiAgICAgIHJldHVybiBkaXYuaW5uZXJIVE1MXG5cbiAgcGFzdGU6IChlbGVtZW50KSAtPlxuICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gQHRvSHRtbCgpXG4iXX0=

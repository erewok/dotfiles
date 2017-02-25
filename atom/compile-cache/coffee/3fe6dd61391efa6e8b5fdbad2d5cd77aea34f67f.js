(function() {
  var Commands, CompositeDisposable, EditorLinter, EditorRegistry, Emitter, Helpers, IndieRegistry, Linter, LinterRegistry, LinterViews, MessageRegistry, Path, ref;

  Path = require('path');

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Emitter = ref.Emitter;

  LinterViews = require('./linter-views');

  MessageRegistry = require('./message-registry');

  EditorRegistry = require('./editor-registry');

  EditorLinter = require('./editor-linter');

  LinterRegistry = require('./linter-registry');

  IndieRegistry = require('./indie-registry');

  Helpers = require('./helpers');

  Commands = require('./commands');

  Linter = (function() {
    function Linter(state) {
      var base;
      this.state = state;
      if ((base = this.state).scope == null) {
        base.scope = 'File';
      }
      this.lintOnFly = true;
      this.emitter = new Emitter;
      this.linters = new LinterRegistry;
      this.indieLinters = new IndieRegistry();
      this.editors = new EditorRegistry;
      this.messages = new MessageRegistry();
      this.views = new LinterViews(this.state.scope, this.editors);
      this.commands = new Commands(this);
      this.subscriptions = new CompositeDisposable(this.views, this.editors, this.linters, this.messages, this.commands, this.indieLinters);
      this.indieLinters.observe((function(_this) {
        return function(indieLinter) {
          return indieLinter.onDidDestroy(function() {
            return _this.messages.deleteMessages(indieLinter);
          });
        };
      })(this));
      this.indieLinters.onDidUpdateMessages((function(_this) {
        return function(arg) {
          var linter, messages;
          linter = arg.linter, messages = arg.messages;
          return _this.messages.set({
            linter: linter,
            messages: messages
          });
        };
      })(this));
      this.linters.onDidUpdateMessages((function(_this) {
        return function(arg) {
          var editor, linter, messages;
          linter = arg.linter, messages = arg.messages, editor = arg.editor;
          return _this.messages.set({
            linter: linter,
            messages: messages,
            editorLinter: _this.editors.ofTextEditor(editor)
          });
        };
      })(this));
      this.messages.onDidUpdateMessages((function(_this) {
        return function(messages) {
          return _this.views.render(messages);
        };
      })(this));
      this.views.onDidUpdateScope((function(_this) {
        return function(scope) {
          return _this.state.scope = scope;
        };
      })(this));
      this.subscriptions.add(atom.config.observe('linter.lintOnFly', (function(_this) {
        return function(value) {
          return _this.lintOnFly = value;
        };
      })(this)));
      this.subscriptions.add(atom.project.onDidChangePaths((function(_this) {
        return function() {
          return _this.commands.lint();
        };
      })(this)));
      this.subscriptions.add(atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          return _this.createEditorLinter(editor);
        };
      })(this)));
    }

    Linter.prototype.addLinter = function(linter) {
      return this.linters.addLinter(linter);
    };

    Linter.prototype.deleteLinter = function(linter) {
      if (!this.hasLinter(linter)) {
        return;
      }
      this.linters.deleteLinter(linter);
      return this.deleteMessages(linter);
    };

    Linter.prototype.hasLinter = function(linter) {
      return this.linters.hasLinter(linter);
    };

    Linter.prototype.getLinters = function() {
      return this.linters.getLinters();
    };

    Linter.prototype.setMessages = function(linter, messages) {
      return this.messages.set({
        linter: linter,
        messages: messages
      });
    };

    Linter.prototype.deleteMessages = function(linter) {
      return this.messages.deleteMessages(linter);
    };

    Linter.prototype.getMessages = function() {
      return this.messages.publicMessages;
    };

    Linter.prototype.onDidUpdateMessages = function(callback) {
      return this.messages.onDidUpdateMessages(callback);
    };

    Linter.prototype.getActiveEditorLinter = function() {
      return this.editors.ofActiveTextEditor();
    };

    Linter.prototype.getEditorLinter = function(editor) {
      return this.editors.ofTextEditor(editor);
    };

    Linter.prototype.getEditorLinterByPath = function(path) {
      return this.editors.ofPath(path);
    };

    Linter.prototype.eachEditorLinter = function(callback) {
      return this.editors.forEach(callback);
    };

    Linter.prototype.observeEditorLinters = function(callback) {
      return this.editors.observe(callback);
    };

    Linter.prototype.createEditorLinter = function(editor) {
      var editorLinter;
      if (this.editors.has(editor)) {
        return;
      }
      editorLinter = this.editors.create(editor);
      editorLinter.onShouldUpdateBubble((function(_this) {
        return function() {
          return _this.views.renderBubble(editorLinter);
        };
      })(this));
      editorLinter.onShouldLint((function(_this) {
        return function(onChange) {
          return _this.linters.lint({
            onChange: onChange,
            editorLinter: editorLinter
          });
        };
      })(this));
      editorLinter.onDidDestroy((function(_this) {
        return function() {
          return _this.messages.deleteEditorMessages(editorLinter);
        };
      })(this));
      editorLinter.onDidCalculateLineMessages((function(_this) {
        return function() {
          _this.views.updateCounts();
          if (_this.state.scope === 'Line') {
            return _this.views.bottomPanel.refresh();
          }
        };
      })(this));
      return this.views.notifyEditorLinter(editorLinter);
    };

    Linter.prototype.deactivate = function() {
      return this.subscriptions.dispose();
    };

    return Linter;

  })();

  module.exports = Linter;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9saW50ZXIvbGliL2xpbnRlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxNQUFpQyxPQUFBLENBQVEsTUFBUixDQUFqQyxFQUFDLDZDQUFELEVBQXNCOztFQUN0QixXQUFBLEdBQWMsT0FBQSxDQUFRLGdCQUFSOztFQUNkLGVBQUEsR0FBa0IsT0FBQSxDQUFRLG9CQUFSOztFQUNsQixjQUFBLEdBQWlCLE9BQUEsQ0FBUSxtQkFBUjs7RUFDakIsWUFBQSxHQUFlLE9BQUEsQ0FBUSxpQkFBUjs7RUFDZixjQUFBLEdBQWlCLE9BQUEsQ0FBUSxtQkFBUjs7RUFDakIsYUFBQSxHQUFnQixPQUFBLENBQVEsa0JBQVI7O0VBQ2hCLE9BQUEsR0FBVSxPQUFBLENBQVEsV0FBUjs7RUFDVixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBRUw7SUFFUyxnQkFBQyxLQUFEO0FBQ1gsVUFBQTtNQURZLElBQUMsQ0FBQSxRQUFEOztZQUNOLENBQUMsUUFBUzs7TUFHaEIsSUFBQyxDQUFBLFNBQUQsR0FBYTtNQUdiLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUNmLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUNmLElBQUMsQ0FBQSxZQUFELEdBQW9CLElBQUEsYUFBQSxDQUFBO01BQ3BCLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUNmLElBQUMsQ0FBQSxRQUFELEdBQWdCLElBQUEsZUFBQSxDQUFBO01BQ2hCLElBQUMsQ0FBQSxLQUFELEdBQWEsSUFBQSxXQUFBLENBQVksSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFuQixFQUEwQixJQUFDLENBQUEsT0FBM0I7TUFDYixJQUFDLENBQUEsUUFBRCxHQUFnQixJQUFBLFFBQUEsQ0FBUyxJQUFUO01BRWhCLElB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QUMsQ0FBQSxhQUFhLENBQUMsT0FBZixDQUFBO0lBRFU7Ozs7OztFQUdkLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBNUdqQiIsInNvdXJjZXNDb250ZW50IjpbIlBhdGggPSByZXF1aXJlICdwYXRoJ1xue0NvbXBvc2l0ZURpc3Bvc2FibGUsIEVtaXR0ZXJ9ID0gcmVxdWlyZSAnYXRvbSdcbkxpbnRlclZpZXdzID0gcmVxdWlyZSAnLi9saW50ZXItdmlld3MnXG5NZXNzYWdlUmVnaXN0cnkgPSByZXF1aXJlICcuL21lc3NhZ2UtcmVnaXN0cnknXG5FZGl0b3JSZWdpc3RyeSA9IHJlcXVpcmUgJy4vZWRpdG9yLXJlZ2lzdHJ5J1xuRWRpdG9yTGludGVyID0gcmVxdWlyZSAnLi9lZGl0b3ItbGludGVyJ1xuTGludGVyUmVnaXN0cnkgPSByZXF1aXJlICcuL2xpbnRlci1yZWdpc3RyeSdcbkluZGllUmVnaXN0cnkgPSByZXF1aXJlICcuL2luZGllLXJlZ2lzdHJ5J1xuSGVscGVycyA9IHJlcXVpcmUgJy4vaGVscGVycydcbkNvbW1hbmRzID0gcmVxdWlyZSAnLi9jb21tYW5kcydcblxuY2xhc3MgTGludGVyXG4gICMgU3RhdGUgaXMgYW4gb2JqZWN0IGJ5IGRlZmF1bHQ7IG5ldmVyIG51bGwgb3IgdW5kZWZpbmVkXG4gIGNvbnN0cnVjdG9yOiAoQHN0YXRlKSAgLT5cbiAgICBAc3RhdGUuc2NvcGUgPz0gJ0ZpbGUnXG5cbiAgICAjIFB1YmxpYyBTdHVmZlxuICAgIEBsaW50T25GbHkgPSB0cnVlICMgQSBkZWZhdWx0IGFydCB2YWx1ZSwgdG8gYmUgaW1tZWRpYXRlbHkgcmVwbGFjZWQgYnkgdGhlIG9ic2VydmUgY29uZmlnIGJlbG93XG5cbiAgICAjIFByaXZhdGUgU3R1ZmZcbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQGxpbnRlcnMgPSBuZXcgTGludGVyUmVnaXN0cnlcbiAgICBAaW5kaWVMaW50ZXJzID0gbmV3IEluZGllUmVnaXN0cnkoKVxuICAgIEBlZGl0b3JzID0gbmV3IEVkaXRvclJlZ2lzdHJ5XG4gICAgQG1lc3NhZ2VzID0gbmV3IE1lc3NhZ2VSZWdpc3RyeSgpXG4gICAgQHZpZXdzID0gbmV3IExpbnRlclZpZXdzKEBzdGF0ZS5zY29wZSwgQGVkaXRvcnMpXG4gICAgQGNvbW1hbmRzID0gbmV3IENvbW1hbmRzKHRoaXMpXG5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKEB2aWV3cywgQGVkaXRvcnMsIEBsaW50ZXJzLCBAbWVzc2FnZXMsIEBjb21tYW5kcywgQGluZGllTGludGVycylcblxuICAgIEBpbmRpZUxpbnRlcnMub2JzZXJ2ZSAoaW5kaWVMaW50ZXIpID0+XG4gICAgICBpbmRpZUxpbnRlci5vbkRpZERlc3Ryb3kgPT5cbiAgICAgICAgQG1lc3NhZ2VzLmRlbGV0ZU1lc3NhZ2VzKGluZGllTGludGVyKVxuICAgIEBpbmRpZUxpbnRlcnMub25EaWRVcGRhdGVNZXNzYWdlcyAoe2xpbnRlciwgbWVzc2FnZXN9KSA9PlxuICAgICAgQG1lc3NhZ2VzLnNldCh7bGludGVyLCBtZXNzYWdlc30pXG4gICAgQGxpbnRlcnMub25EaWRVcGRhdGVNZXNzYWdlcyAoe2xpbnRlciwgbWVzc2FnZXMsIGVkaXRvcn0pID0+XG4gICAgICBAbWVzc2FnZXMuc2V0KHtsaW50ZXIsIG1lc3NhZ2VzLCBlZGl0b3JMaW50ZXI6IEBlZGl0b3JzLm9mVGV4dEVkaXRvcihlZGl0b3IpfSlcbiAgICBAbWVzc2FnZXMub25EaWRVcGRhdGVNZXNzYWdlcyAobWVzc2FnZXMpID0+XG4gICAgICBAdmlld3MucmVuZGVyKG1lc3NhZ2VzKVxuICAgIEB2aWV3cy5vbkRpZFVwZGF0ZVNjb3BlIChzY29wZSkgPT5cbiAgICAgIEBzdGF0ZS5zY29wZSA9IHNjb3BlXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAnbGludGVyLmxpbnRPbkZseScsICh2YWx1ZSkgPT5cbiAgICAgIEBsaW50T25GbHkgPSB2YWx1ZVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VQYXRocyA9PlxuICAgICAgQGNvbW1hbmRzLmxpbnQoKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyAoZWRpdG9yKSA9PiBAY3JlYXRlRWRpdG9yTGludGVyKGVkaXRvcilcblxuICBhZGRMaW50ZXI6IChsaW50ZXIpIC0+XG4gICAgQGxpbnRlcnMuYWRkTGludGVyKGxpbnRlcilcblxuICBkZWxldGVMaW50ZXI6IChsaW50ZXIpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAaGFzTGludGVyKGxpbnRlcilcbiAgICBAbGludGVycy5kZWxldGVMaW50ZXIobGludGVyKVxuICAgIEBkZWxldGVNZXNzYWdlcyhsaW50ZXIpXG5cbiAgaGFzTGludGVyOiAobGludGVyKSAtPlxuICAgIEBsaW50ZXJzLmhhc0xpbnRlcihsaW50ZXIpXG5cbiAgZ2V0TGludGVyczogLT5cbiAgICBAbGludGVycy5nZXRMaW50ZXJzKClcblxuICBzZXRNZXNzYWdlczogKGxpbnRlciwgbWVzc2FnZXMpIC0+XG4gICAgQG1lc3NhZ2VzLnNldCh7bGludGVyLCBtZXNzYWdlc30pXG5cbiAgZGVsZXRlTWVzc2FnZXM6IChsaW50ZXIpIC0+XG4gICAgQG1lc3NhZ2VzLmRlbGV0ZU1lc3NhZ2VzKGxpbnRlcilcblxuICBnZXRNZXNzYWdlczogLT5cbiAgICBAbWVzc2FnZXMucHVibGljTWVzc2FnZXNcblxuICBvbkRpZFVwZGF0ZU1lc3NhZ2VzOiAoY2FsbGJhY2spIC0+XG4gICAgQG1lc3NhZ2VzLm9uRGlkVXBkYXRlTWVzc2FnZXMoY2FsbGJhY2spXG5cbiAgZ2V0QWN0aXZlRWRpdG9yTGludGVyOiAtPlxuICAgIEBlZGl0b3JzLm9mQWN0aXZlVGV4dEVkaXRvcigpXG5cbiAgZ2V0RWRpdG9yTGludGVyOiAoZWRpdG9yKSAtPlxuICAgIEBlZGl0b3JzLm9mVGV4dEVkaXRvcihlZGl0b3IpXG5cbiAgZ2V0RWRpdG9yTGludGVyQnlQYXRoOiAocGF0aCkgLT5cbiAgICBAZWRpdG9ycy5vZlBhdGgocGF0aClcblxuICBlYWNoRWRpdG9yTGludGVyOiAoY2FsbGJhY2spIC0+XG4gICAgQGVkaXRvcnMuZm9yRWFjaChjYWxsYmFjaylcblxuICBvYnNlcnZlRWRpdG9yTGludGVyczogKGNhbGxiYWNrKSAtPlxuICAgIEBlZGl0b3JzLm9ic2VydmUoY2FsbGJhY2spXG5cbiAgY3JlYXRlRWRpdG9yTGludGVyOiAoZWRpdG9yKSAtPlxuICAgIHJldHVybiBpZiBAZWRpdG9ycy5oYXMoZWRpdG9yKVxuXG4gICAgZWRpdG9yTGludGVyID0gQGVkaXRvcnMuY3JlYXRlKGVkaXRvcilcbiAgICBlZGl0b3JMaW50ZXIub25TaG91bGRVcGRhdGVCdWJibGUgPT5cbiAgICAgIEB2aWV3cy5yZW5kZXJCdWJibGUoZWRpdG9yTGludGVyKVxuICAgIGVkaXRvckxpbnRlci5vblNob3VsZExpbnQgKG9uQ2hhbmdlKSA9PlxuICAgICAgQGxpbnRlcnMubGludCh7b25DaGFuZ2UsIGVkaXRvckxpbnRlcn0pXG4gICAgZWRpdG9yTGludGVyLm9uRGlkRGVzdHJveSA9PlxuICAgICAgQG1lc3NhZ2VzLmRlbGV0ZUVkaXRvck1lc3NhZ2VzKGVkaXRvckxpbnRlcilcbiAgICBlZGl0b3JMaW50ZXIub25EaWRDYWxjdWxhdGVMaW5lTWVzc2FnZXMgPT5cbiAgICAgIEB2aWV3cy51cGRhdGVDb3VudHMoKVxuICAgICAgQHZpZXdzLmJvdHRvbVBhbmVsLnJlZnJlc2goKSBpZiBAc3RhdGUuc2NvcGUgaXMgJ0xpbmUnXG4gICAgQHZpZXdzLm5vdGlmeUVkaXRvckxpbnRlcihlZGl0b3JMaW50ZXIpXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcblxubW9kdWxlLmV4cG9ydHMgPSBMaW50ZXJcbiJdfQ==

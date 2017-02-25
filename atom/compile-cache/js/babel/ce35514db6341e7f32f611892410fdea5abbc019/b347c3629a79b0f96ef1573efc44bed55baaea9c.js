Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _messageElement = require('./message-element');

'use babel';

var Interact = require('interact.js');

var BottomPanel = (function () {
  function BottomPanel(scope) {
    var _this = this;

    _classCallCheck(this, BottomPanel);

    this.subscriptions = new _atom.CompositeDisposable();

    this.visibility = false;
    this.visibleMessages = 0;
    this.alwaysTakeMinimumSpace = atom.config.get('linter.alwaysTakeMinimumSpace');
    this.errorPanelHeight = atom.config.get('linter.errorPanelHeight');
    this.configVisibility = atom.config.get('linter.showErrorPanel');
    this.scope = scope;
    this.editorMessages = new Map();
    this.messages = new Map();

    var element = document.createElement('linter-panel'); // TODO(steelbrain): Make this a `div`
    element.tabIndex = '-1';
    this.messagesElement = document.createElement('div');
    element.appendChild(this.messagesElement);
    this.panel = atom.workspace.addBottomPanel({ item: element, visible: false, priority: 500 });
    Interact(element).resizable({ edges: { top: true } }).on('resizemove', function (event) {
      event.target.style.height = event.rect.height + 'px';
    }).on('resizeend', function (event) {
      atom.config.set('linter.errorPanelHeight', event.target.clientHeight);
    });
    element.addEventListener('keydown', function (e) {
      if (e.which === 67 && e.ctrlKey) {
        atom.clipboard.write(getSelection().toString());
      }
    });

    this.subscriptions.add(atom.config.onDidChange('linter.alwaysTakeMinimumSpace', function (_ref) {
      var newValue = _ref.newValue;

      _this.alwaysTakeMinimumSpace = newValue;
      _this.updateHeight();
    }));

    this.subscriptions.add(atom.config.onDidChange('linter.errorPanelHeight', function (_ref2) {
      var newValue = _ref2.newValue;

      _this.errorPanelHeight = newValue;
      _this.updateHeight();
    }));

    this.subscriptions.add(atom.config.onDidChange('linter.showErrorPanel', function (_ref3) {
      var newValue = _ref3.newValue;

      _this.configVisibility = newValue;
      _this.updateVisibility();
    }));

    this.subscriptions.add(atom.workspace.observeActivePaneItem(function (paneItem) {
      _this.paneVisibility = paneItem === atom.workspace.getActiveTextEditor();
      _this.updateVisibility();
    }));

    // Container for messages with no filePath
    var defaultContainer = document.createElement('div');
    this.editorMessages.set(null, defaultContainer);
    this.messagesElement.appendChild(defaultContainer);
    if (scope !== 'Project') {
      defaultContainer.setAttribute('hidden', true);
    }
  }

  _createClass(BottomPanel, [{
    key: 'setMessages',
    value: function setMessages(_ref4) {
      var _this2 = this;

      var added = _ref4.added;
      var removed = _ref4.removed;

      if (removed.length) {
        this.removeMessages(removed);
      }
      if (added.length) {
        (function () {
          var activeFile = atom.workspace.getActiveTextEditor();
          activeFile = activeFile ? activeFile.getPath() : undefined;
          added.forEach(function (message) {
            if (!_this2.editorMessages.has(message.filePath)) {
              var container = document.createElement('div');
              _this2.editorMessages.set(message.filePath, container);
              _this2.messagesElement.appendChild(container);
              if (!(_this2.scope === 'Project' || activeFile === message.filePath)) {
                container.setAttribute('hidden', true);
              }
            }
            var messageElement = _messageElement.Message.fromMessage(message);
            _this2.messages.set(message, messageElement);
            _this2.editorMessages.get(message.filePath).appendChild(messageElement);
            if (messageElement.updateVisibility(_this2.scope).visibility) {
              _this2.visibleMessages++;
            }
          });
        })();
      }

      this.editorMessages.forEach(function (child, key) {
        // Never delete the default container
        if (key !== null && !child.childNodes.length) {
          child.remove();
          _this2.editorMessages['delete'](key);
        }
      });

      this.updateVisibility();
    }
  }, {
    key: 'removeMessages',
    value: function removeMessages(messages) {
      var _this3 = this;

      messages.forEach(function (message) {
        var messageElement = _this3.messages.get(message);
        _this3.messages['delete'](message);
        messageElement.remove();
        if (messageElement.visibility) {
          _this3.visibleMessages--;
        }
      });
    }
  }, {
    key: 'refresh',
    value: function refresh(scope) {
      var _this4 = this;

      if (scope) {
        this.scope = scope;
      } else scope = this.scope;
      this.visibleMessages = 0;

      this.messages.forEach(function (messageElement) {
        if (messageElement.updateVisibility(scope).visibility && scope === 'Line') {
          _this4.visibleMessages++;
        }
      });

      if (scope === 'File') {
        (function () {
          var activeFile = atom.workspace.getActiveTextEditor();
          activeFile = activeFile ? activeFile.getPath() : undefined;
          _this4.editorMessages.forEach(function (messagesElement, filePath) {
            if (filePath === activeFile) {
              messagesElement.removeAttribute('hidden');
              _this4.visibleMessages = messagesElement.childNodes.length;
            } else messagesElement.setAttribute('hidden', true);
          });
        })();
      } else if (scope === 'Project') {
        this.visibleMessages = this.messages.size;
        this.editorMessages.forEach(function (messageElement) {
          messageElement.removeAttribute('hidden');
        });
      }

      this.updateVisibility();
    }
  }, {
    key: 'updateHeight',
    value: function updateHeight() {
      var height = this.errorPanelHeight;

      if (this.alwaysTakeMinimumSpace) {
        // Add `1px` for the top border.
        height = Math.min(this.messagesElement.clientHeight + 1, height);
      }

      this.messagesElement.parentNode.style.height = height + 'px';
    }
  }, {
    key: 'getVisibility',
    value: function getVisibility() {
      return this.visibility;
    }
  }, {
    key: 'updateVisibility',
    value: function updateVisibility() {
      this.visibility = this.configVisibility && this.paneVisibility && this.visibleMessages > 0;

      if (this.visibility) {
        this.panel.show();
        this.updateHeight();
      } else {
        this.panel.hide();
      }
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
      this.messages.clear();
      try {
        this.panel.destroy();
      } catch (err) {
        // Atom fails weirdly sometimes when doing this
      }
    }
  }]);

  return BottomPanel;
})();

exports['default'] = BottomPanel;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9lcmV3b2svLmF0b20vcGFja2FnZXMvbGludGVyL2xpYi91aS9ib3R0b20tcGFuZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7b0JBR2tDLE1BQU07OzhCQUNsQixtQkFBbUI7O0FBSnpDLFdBQVcsQ0FBQTs7QUFFWCxJQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUE7O0lBSWxCLFdBQVc7QUFDbkIsV0FEUSxXQUFXLENBQ2xCLEtBQUssRUFBRTs7OzBCQURBLFdBQVc7O0FBRTVCLFFBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXVCLENBQUE7O0FBRTVDLFFBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFBO0FBQ3ZCLFFBQUksQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFBO0FBQ3hCLFFBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsQ0FBQyxDQUFBO0FBQzlFLFFBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFBO0FBQ2xFLFFBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFBO0FBQ2hFLFFBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFBO0FBQ2xCLFFBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtBQUMvQixRQUFJLENBQUMsUUFBUSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7O0FBRXpCLFFBQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUE7QUFDdEQsV0FBTyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUE7QUFDdkIsUUFBSSxDQUFDLGVBQWUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ3BELFdBQU8sQ0FBQyxX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QUU7O0FBRS9CLGNBQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsWUFBWSxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQTtPQUNqRTs7QUFFRCxVQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFNLE1BQU0sT0FBSSxDQUFBO0tBQzdEOzs7V0FDWSx5QkFBRztBQUNkLGFBQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQTtLQUN2Qjs7O1dBQ2UsNEJBQUc7QUFDakIsVUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLElBQUksSUFBSSxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQTs7QUFFMUYsVUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQ25CLFlBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUE7QUFDakIsWUFBSSxDQUFDLFlBQVksRUFBRSxDQUFBO09BQ3BCLE1BQU07QUFDTCxZQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFBO09BQ2xCO0tBQ0Y7OztXQUNNLG1CQUFHO0FBQ1IsVUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUM1QixVQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFBO0FBQ3JCLFVBQUk7QUFDRixZQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFBO09BQ3JCLENBQUMsT0FBTyxHQUFHLEVBQUU7O09BRWI7S0FDRjs7O1NBcktrQixXQUFXOzs7cUJBQVgsV0FBVyIsImZpbGUiOiIvVXNlcnMvZXJld29rLy5hdG9tL3BhY2thZ2VzL2xpbnRlci9saWIvdWkvYm90dG9tLXBhbmVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuY29uc3QgSW50ZXJhY3QgPSByZXF1aXJlKCdpbnRlcmFjdC5qcycpXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gJ2F0b20nXG5pbXBvcnQge01lc3NhZ2V9IGZyb20gJy4vbWVzc2FnZS1lbGVtZW50J1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCb3R0b21QYW5lbCB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICAgIHRoaXMudmlzaWJpbGl0eSA9IGZhbHNlXG4gICAgdGhpcy52aXNpYmxlTWVzc2FnZXMgPSAwXG4gICAgdGhpcy5hbHdheXNUYWtlTWluaW11bVNwYWNlID0gYXRvbS5jb25maWcuZ2V0KCdsaW50ZXIuYWx3YXlzVGFrZU1pbmltdW1TcGFjZScpXG4gICAgdGhpcy5lcnJvclBhbmVsSGVpZ2h0ID0gYXRvbS5jb25maWcuZ2V0KCdsaW50ZXIuZXJyb3JQYW5lbEhlaWdodCcpXG4gICAgdGhpcy5jb25maWdWaXNpYmlsaXR5ID0gYXRvbS5jb25maWcuZ2V0KCdsaW50ZXIuc2hvd0Vycm9yUGFuZWwnKVxuICAgIHRoaXMuc2NvcGUgPSBzY29wZVxuICAgIHRoaXMuZWRpdG9yTWVzc2FnZXMgPSBuZXcgTWFwKClcbiAgICB0aGlzLm1lc3NhZ2VzID0gbmV3IE1hcCgpXG5cbiAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGludGVyLXBhbmVsJykgLy8gVE9ETyhzdGVlbGJyYWluKTogTWFrZSB0aGlzIGEgYGRpdmBcbiAgICBlbGVtZW50LnRhYkluZGV4ID0gJy0xJ1xuICAgIHRoaXMubWVzc2FnZXNFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKHRoaXMubWVzc2FnZXNFbGVtZW50KVxuICAgIHRoaXMucGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRCb3R0b21QYW5lbCh7aXRlbTogZWxlbWVudCwgdmlzaWJsZTogZmFsc2UsIHByaW9yaXR5OiA1MDB9KVxuICAgIEludGVyYWN0KGVsZW1lbnQpLnJlc2l6YWJsZSh7ZWRnZXM6IHt0b3A6IHRydWV9fSlcbiAgICAgIC5vbigncmVzaXplbW92ZScsIGV2ZW50ID0+IHtcbiAgICAgICAgZXZlbnQudGFyZ2V0LnN0eWxlLmhlaWdodCA9IGAke2V2ZW50LnJlY3QuaGVpZ2h0fXB4YFxuICAgICAgfSlcbiAgICAgIC5vbigncmVzaXplZW5kJywgZXZlbnQgPT4ge1xuICAgICAgICBhdG9tLmNvbmZpZy5zZXQoJ2xpbnRlci5lcnJvclBhbmVsSGVpZ2h0JywgZXZlbnQudGFyZ2V0LmNsaWVudEhlaWdodClcbiAgICAgIH0pXG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGUud2hpY2ggPT09IDY3ICYmIGUuY3RybEtleSkge1xuICAgICAgICBhdG9tLmNsaXBib2FyZC53cml0ZShnZXRTZWxlY3Rpb24oKS50b1N0cmluZygpKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlKCdsaW50ZXIuYWx3YXlzVGFrZU1pbmltdW1TcGFjZScsICh7bmV3VmFsdWV9KSA9PiB7XG4gICAgICB0aGlzLmFsd2F5c1Rha2VNaW5pbXVtU3BhY2UgPSBuZXdWYWx1ZVxuICAgICAgdGhpcy51cGRhdGVIZWlnaHQoKVxuICAgIH0pKVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSgnbGludGVyLmVycm9yUGFuZWxIZWlnaHQnLCAoe25ld1ZhbHVlfSkgPT4ge1xuICAgICAgdGhpcy5lcnJvclBhbmVsSGVpZ2h0ID0gbmV3VmFsdWVcbiAgICAgIHRoaXMudXBkYXRlSGVpZ2h0KClcbiAgICB9KSlcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub25EaWRDaGFuZ2UoJ2xpbnRlci5zaG93RXJyb3JQYW5lbCcsICh7bmV3VmFsdWV9KSA9PiB7XG4gICAgICB0aGlzLmNvbmZpZ1Zpc2liaWxpdHkgPSBuZXdWYWx1ZVxuICAgICAgdGhpcy51cGRhdGVWaXNpYmlsaXR5KClcbiAgICB9KSlcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtKHBhbmVJdGVtID0+IHtcbiAgICAgIHRoaXMucGFuZVZpc2liaWxpdHkgPSBwYW5lSXRlbSA9PT0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgICB0aGlzLnVwZGF0ZVZpc2liaWxpdHkoKVxuICAgIH0pKVxuXG4gICAgLy8gQ29udGFpbmVyIGZvciBtZXNzYWdlcyB3aXRoIG5vIGZpbGVQYXRoXG4gICAgY29uc3QgZGVmYXVsdENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgdGhpcy5lZGl0b3JNZXNzYWdlcy5zZXQobnVsbCwgZGVmYXVsdENvbnRhaW5lcilcbiAgICB0aGlzLm1lc3NhZ2VzRWxlbWVudC5hcHBlbmRDaGlsZChkZWZhdWx0Q29udGFpbmVyKVxuICAgIGlmIChzY29wZSAhPT0gJ1Byb2plY3QnKSB7XG4gICAgICBkZWZhdWx0Q29udGFpbmVyLnNldEF0dHJpYnV0ZSgnaGlkZGVuJywgdHJ1ZSlcbiAgICB9XG4gIH1cbiAgc2V0TWVzc2FnZXMoe2FkZGVkLCByZW1vdmVkfSkge1xuICAgIGlmIChyZW1vdmVkLmxlbmd0aCkge1xuICAgICAgdGhpcy5yZW1vdmVNZXNzYWdlcyhyZW1vdmVkKVxuICAgIH1cbiAgICBpZiAoYWRkZWQubGVuZ3RoKSB7XG4gICAgICBsZXQgYWN0aXZlRmlsZSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgICAgYWN0aXZlRmlsZSA9IGFjdGl2ZUZpbGUgPyBhY3RpdmVGaWxlLmdldFBhdGgoKSA6IHVuZGVmaW5lZFxuICAgICAgYWRkZWQuZm9yRWFjaChtZXNzYWdlID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmVkaXRvck1lc3NhZ2VzLmhhcyhtZXNzYWdlLmZpbGVQYXRoKSkge1xuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICAgICAgdGhpcy5lZGl0b3JNZXNzYWdlcy5zZXQobWVzc2FnZS5maWxlUGF0aCwgY29udGFpbmVyKVxuICAgICAgICAgIHRoaXMubWVzc2FnZXNFbGVtZW50LmFwcGVuZENoaWxkKGNvbnRhaW5lcilcbiAgICAgICAgICBpZiAoISh0aGlzLnNjb3BlID09PSAnUHJvamVjdCcgfHwgYWN0aXZlRmlsZSA9PT0gbWVzc2FnZS5maWxlUGF0aCkpIHtcbiAgICAgICAgICAgIGNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ2hpZGRlbicsIHRydWUpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1lc3NhZ2VFbGVtZW50ID0gTWVzc2FnZS5mcm9tTWVzc2FnZShtZXNzYWdlKVxuICAgICAgICB0aGlzLm1lc3NhZ2VzLnNldChtZXNzYWdlLCBtZXNzYWdlRWxlbWVudClcbiAgICAgICAgdGhpcy5lZGl0b3JNZXNzYWdlcy5nZXQobWVzc2FnZS5maWxlUGF0aCkuYXBwZW5kQ2hpbGQobWVzc2FnZUVsZW1lbnQpXG4gICAgICAgIGlmIChtZXNzYWdlRWxlbWVudC51cGRhdGVWaXNpYmlsaXR5KHRoaXMuc2NvcGUpLnZpc2liaWxpdHkpIHtcbiAgICAgICAgICB0aGlzLnZpc2libGVNZXNzYWdlcysrXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy5lZGl0b3JNZXNzYWdlcy5mb3JFYWNoKChjaGlsZCwga2V5KSA9PiB7XG4gICAgICAvLyBOZXZlciBkZWxldGUgdGhlIGRlZmF1bHQgY29udGFpbmVyXG4gICAgICBpZiAoa2V5ICE9PSBudWxsICYmICFjaGlsZC5jaGlsZE5vZGVzLmxlbmd0aCkge1xuICAgICAgICBjaGlsZC5yZW1vdmUoKVxuICAgICAgICB0aGlzLmVkaXRvck1lc3NhZ2VzLmRlbGV0ZShrZXkpXG4gICAgICB9XG4gICAgfSlcblxuICAgIHRoaXMudXBkYXRlVmlzaWJpbGl0eSgpXG4gIH1cbiAgcmVtb3ZlTWVzc2FnZXMobWVzc2FnZXMpIHtcbiAgICBtZXNzYWdlcy5mb3JFYWNoKG1lc3NhZ2UgPT4ge1xuICAgICAgY29uc3QgbWVzc2FnZUVsZW1lbnQgPSB0aGlzLm1lc3NhZ2VzLmdldChtZXNzYWdlKVxuICAgICAgdGhpcy5tZXNzYWdlcy5kZWxldGUobWVzc2FnZSlcbiAgICAgIG1lc3NhZ2VFbGVtZW50LnJlbW92ZSgpXG4gICAgICBpZiAobWVzc2FnZUVsZW1lbnQudmlzaWJpbGl0eSkge1xuICAgICAgICB0aGlzLnZpc2libGVNZXNzYWdlcy0tXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICByZWZyZXNoKHNjb3BlKSB7XG4gICAgaWYgKHNjb3BlKSB7XG4gICAgICB0aGlzLnNjb3BlID0gc2NvcGVcbiAgICB9IGVsc2Ugc2NvcGUgPSB0aGlzLnNjb3BlXG4gICAgdGhpcy52aXNpYmxlTWVzc2FnZXMgPSAwXG5cbiAgICB0aGlzLm1lc3NhZ2VzLmZvckVhY2gobWVzc2FnZUVsZW1lbnQgPT4ge1xuICAgICAgaWYgKG1lc3NhZ2VFbGVtZW50LnVwZGF0ZVZpc2liaWxpdHkoc2NvcGUpLnZpc2liaWxpdHkgJiYgc2NvcGUgPT09ICdMaW5lJykge1xuICAgICAgICB0aGlzLnZpc2libGVNZXNzYWdlcysrXG4gICAgICB9XG4gICAgfSlcblxuICAgIGlmIChzY29wZSA9PT0gJ0ZpbGUnKSB7XG4gICAgICBsZXQgYWN0aXZlRmlsZSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgICAgYWN0aXZlRmlsZSA9IGFjdGl2ZUZpbGUgPyBhY3RpdmVGaWxlLmdldFBhdGgoKSA6IHVuZGVmaW5lZFxuICAgICAgdGhpcy5lZGl0b3JNZXNzYWdlcy5mb3JFYWNoKChtZXNzYWdlc0VsZW1lbnQsIGZpbGVQYXRoKSA9PiB7XG4gICAgICAgIGlmIChmaWxlUGF0aCA9PT0gYWN0aXZlRmlsZSkge1xuICAgICAgICAgIG1lc3NhZ2VzRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2hpZGRlbicpXG4gICAgICAgICAgdGhpcy52aXNpYmxlTWVzc2FnZXMgPSBtZXNzYWdlc0VsZW1lbnQuY2hpbGROb2Rlcy5sZW5ndGhcbiAgICAgICAgfSBlbHNlIG1lc3NhZ2VzRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2hpZGRlbicsIHRydWUpXG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAoc2NvcGUgPT09ICdQcm9qZWN0Jykge1xuICAgICAgdGhpcy52aXNpYmxlTWVzc2FnZXMgPSB0aGlzLm1lc3NhZ2VzLnNpemVcbiAgICAgIHRoaXMuZWRpdG9yTWVzc2FnZXMuZm9yRWFjaChtZXNzYWdlRWxlbWVudCA9PiB7XG4gICAgICAgIG1lc3NhZ2VFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnaGlkZGVuJylcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy51cGRhdGVWaXNpYmlsaXR5KClcbiAgfVxuICB1cGRhdGVIZWlnaHQoKSB7XG4gICAgbGV0IGhlaWdodCA9IHRoaXMuZXJyb3JQYW5lbEhlaWdodFxuXG4gICAgaWYgKHRoaXMuYWx3YXlzVGFrZU1pbmltdW1TcGFjZSkge1xuICAgICAgLy8gQWRkIGAxcHhgIGZvciB0aGUgdG9wIGJvcmRlci5cbiAgICAgIGhlaWdodCA9IE1hdGgubWluKHRoaXMubWVzc2FnZXNFbGVtZW50LmNsaWVudEhlaWdodCArIDEsIGhlaWdodClcbiAgICB9XG5cbiAgICB0aGlzLm1lc3NhZ2VzRWxlbWVudC5wYXJlbnROb2RlLnN0eWxlLmhlaWdodCA9IGAke2hlaWdodH1weGBcbiAgfVxuICBnZXRWaXNpYmlsaXR5KCkge1xuICAgIHJldHVybiB0aGlzLnZpc2liaWxpdHlcbiAgfVxuICB1cGRhdGVWaXNpYmlsaXR5KCkge1xuICAgIHRoaXMudmlzaWJpbGl0eSA9IHRoaXMuY29uZmlnVmlzaWJpbGl0eSAmJiB0aGlzLnBhbmVWaXNpYmlsaXR5ICYmIHRoaXMudmlzaWJsZU1lc3NhZ2VzID4gMFxuXG4gICAgaWYgKHRoaXMudmlzaWJpbGl0eSkge1xuICAgICAgdGhpcy5wYW5lbC5zaG93KClcbiAgICAgIHRoaXMudXBkYXRlSGVpZ2h0KClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wYW5lbC5oaWRlKClcbiAgICB9XG4gIH1cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgdGhpcy5tZXNzYWdlcy5jbGVhcigpXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMucGFuZWwuZGVzdHJveSgpXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBBdG9tIGZhaWxzIHdlaXJkbHkgc29tZXRpbWVzIHdoZW4gZG9pbmcgdGhpc1xuICAgIH1cbiAgfVxufVxuIl19
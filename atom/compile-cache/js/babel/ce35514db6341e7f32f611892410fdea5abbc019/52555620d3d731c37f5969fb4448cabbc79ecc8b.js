Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _helpers = require('./helpers');

var _helpers2 = _interopRequireDefault(_helpers);

'use babel';

var EditorLinter = (function () {
  function EditorLinter(editor) {
    var _this = this;

    _classCallCheck(this, EditorLinter);

    if (typeof editor !== 'object' || typeof editor.markBufferRange !== 'function') {
      throw new Error('Given editor is not really an editor');
    }

    this.editor = editor;
    this.emitter = new _atom.Emitter();
    this.messages = new Set();
    this.markers = new Map();
    this.subscriptions = new _atom.CompositeDisposable();
    this.gutter = null;
    this.countLineMessages = 0;

    this.subscriptions.add(atom.config.observe('linter.underlineIssues', function (underlineIssues) {
      return _this.underlineIssues = underlineIssues;
    }));
    this.subscriptions.add(atom.config.observe('linter.showErrorInline', function (showBubble) {
      return _this.showBubble = showBubble;
    }));
    this.subscriptions.add(this.editor.onDidDestroy(function () {
      return _this.dispose();
    }));
    this.subscriptions.add(this.editor.onDidSave(function () {
      return _this.emitter.emit('should-lint', false);
    }));
    this.subscriptions.add(this.editor.onDidChangeCursorPosition(function (_ref) {
      var oldBufferPosition = _ref.oldBufferPosition;
      var newBufferPosition = _ref.newBufferPosition;

      if (newBufferPosition.row !== oldBufferPosition.row) {
        _this.calculateLineMessages(newBufferPosition.row);
      }
      _this.emitter.emit('should-update-bubble');
    }));
    this.subscriptions.add(atom.config.observe('linter.gutterEnabled', function (gutterEnabled) {
      _this.gutterEnabled = gutterEnabled;
      _this.handleGutter();
    }));
    // Using onDidChange instead of observe here 'cause the same function is invoked above
    this.subscriptions.add(atom.config.onDidChange('linter.gutterPosition', function () {
      return _this.handleGutter();
    }));
    this.subscriptions.add(this.onDidMessageAdd(function (message) {
      if (!_this.underlineIssues && !_this.gutterEnabled && !_this.showBubble || !message.range) {
        return; // No-Op
      }
      var marker = _this.editor.getBuffer().markRange(message.range, { invalidate: 'inside' });
      marker.onDidChange(function (_ref2) {
        var oldHeadPosition = _ref2.oldHeadPosition;
        var newHeadPosition = _ref2.newHeadPosition;
        var isValid = _ref2.isValid;

        if (isValid && (oldHeadPosition.row !== 0 || newHeadPosition.row === 0)) {
          message.range = marker.previousEventState.range;
          message.key = _helpers2['default'].messageKey(message);
        }
      });
      _this.markers.set(message, marker);
      if (_this.underlineIssues) {
        _this.editor.decorateMarker(marker, {
          type: 'highlight',
          'class': 'linter-highlight ' + message['class']
        });
      }
      if (_this.gutterEnabled) {
        var item = document.createElement('span');
        item.className = 'linter-gutter linter-highlight ' + message['class'];
        _this.gutter.decorateMarker(marker, {
          'class': 'linter-row',
          item: item
        });
      }
    }));
    this.subscriptions.add(this.onDidMessageDelete(function (message) {
      if (_this.markers.has(message)) {
        _this.markers.get(message).destroy();
        _this.markers['delete'](message);
      }
    }));

    // TODO: Atom invokes onDid{Change, StopChanging} callbacks immediately. Workaround it
    atom.config.observe('linter.lintOnFlyInterval', function (interval) {
      if (_this.changeSubscription) {
        _this.changeSubscription.dispose();
      }
      _this.changeSubscription = _this.editor.onDidChange(_helpers2['default'].debounce(function () {
        _this.emitter.emit('should-lint', true);
      }, interval));
    });

    this.active = true;
  }

  _createClass(EditorLinter, [{
    key: 'handleGutter',
    value: function handleGutter() {
      if (this.gutter !== null) {
        this.removeGutter();
      }
      if (this.gutterEnabled) {
        this.addGutter();
      }
    }
  }, {
    key: 'addGutter',
    value: function addGutter() {
      var position = atom.config.get('linter.gutterPosition');
      this.gutter = this.editor.addGutter({
        name: 'linter',
        priority: position === 'Left' ? -100 : 100
      });
    }
  }, {
    key: 'removeGutter',
    value: function removeGutter() {
      if (this.gutter !== null) {
        try {
          // Atom throws when we try to remove a gutter container from a closed text editor
          this.gutter.destroy();
        } catch (err) {}
        this.gutter = null;
      }
    }
  }, {
    key: 'getMessages',
    value: function getMessages() {
      return this.messages;
    }
  }, {
    key: 'addMessage',
    value: function addMessage(message) {
      if (!this.messages.has(message)) {
        if (this.active) {
          message.currentFile = true;
        }
        this.messages.add(message);
        this.emitter.emit('did-message-add', message);
        this.emitter.emit('did-message-change', { message: message, type: 'add' });
      }
    }
  }, {
    key: 'deleteMessage',
    value: function deleteMessage(message) {
      if (this.messages.has(message)) {
        this.messages['delete'](message);
        this.emitter.emit('did-message-delete', message);
        this.emitter.emit('did-message-change', { message: message, type: 'delete' });
      }
    }
  }, {
    key: 'calculateLineMessages',
    value: function calculateLineMessages(row) {
      var _this2 = this;

      if (atom.config.get('linter.showErrorTabLine')) {
        if (row === null) {
          row = this.editor.getCursorBufferPosition().row;
        }
        this.countLineMessages = 0;
        this.messages.forEach(function (message) {
          if (message.currentLine = message.range && message.range.intersectsRow(row)) {
            _this2.countLineMessages++;
          }
        });
      } else {
        this.countLineMessages = 0;
      }
      this.emitter.emit('did-calculate-line-messages', this.countLineMessages);
      return this.countLineMessages;
    }
  }, {
    key: 'lint',
    value: function lint() {
      var onChange = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

      this.emitter.emit('should-lint', onChange);
    }
  }, {
    key: 'onDidMessageAdd',
    value: function onDidMessageAdd(callback) {
      return this.emitter.on('did-message-add', callback);
    }
  }, {
    key: 'onDidMessageDelete',
    value: function onDidMessageDelete(callback) {
      return this.emitter.on('did-message-delete', callback);
    }
  }, {
    key: 'onDidMessageChange',
    value: function onDidMessageChange(callback) {
      return this.emitter.on('did-message-change', callback);
    }
  }, {
    key: 'onDidCalculateLineMessages',
    value: function onDidCalculateLineMessages(callback) {
      return this.emitter.on('did-calculate-line-messages', callback);
    }
  }, {
    key: 'onShouldUpdateBubble',
    value: function onShouldUpdateBubble(callback) {
      return this.emitter.on('should-update-bubble', callback);
    }
  }, {
    key: 'onShouldLint',
    value: function onShouldLint(callback) {
      return this.emitter.on('should-lint', callback);
    }
  }, {
    key: 'onDidDestroy',
    value: function onDidDestroy(callback) {
      return this.emitter.on('did-destroy', callback);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.emitter.emit('did-destroy');
      if (this.markers.size) {
        this.markers.forEach(function (marker) {
          return marker.destroy();
        });
        this.markers.clear();
      }
      this.removeGutter();
      this.subscriptions.dispose();
      if (this.changeSubscription) {
        this.changeSubscription.dispose();
      }
      this.emitter.dispose();
      this.messages.clear();
    }
  }, {
    key: 'active',
    set: function set(value) {
      value = Boolean(value);
      if (value !== this._active) {
        this._active = value;
        if (this.messages.size) {
          this.messages.forEach(function (message) {
            return message.currentFile = value;
          });
        }
      }
    },
    get: function get() {
      return this._active;
    }
  }]);

  return EditorLinter;
})();

exports['default'] = EditorLinter;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9lcmV3b2svLmF0b20vcGFja2FnZXMvbGludGVyL2xpYi9lZGl0b3ItbGludGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7b0JBRTJDLE1BQU07O3VCQUM3QixXQUFXOzs7O0FBSC9CLFdBQVcsQ0FBQTs7SUFLVSxZQUFZO0FBQ3BCLFdBRFEsWUFBWSxDQUNuQixNQUFNLEVBQUU7OzswQkFERCxZQUFZOztBQUU3QixRQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsSUFBSSxPQUFPLE1BQU0sQ0FBQyxlQUFlLEtBQUssVUFBVSxFQUFFO0FBQzlFLFlBQU0sSUFBSSxLQUFLLENBQUMsc0NBQXNDLENBQUMsQ0FBQTtLQUN4RDs7QUFFRCxRQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQTtBQUNwQixRQUFJLENBQUMsT0FBTyxHQUFHLG1CQUFhLENBQUE7QUFDNUIsUUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBO0FBQ3pCLFFBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtBQUN4QixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF1QixDQUFBO0FBQzVDLFFBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFBO0FBQ2xCLFFBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUE7O0FBRTFCLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLHdCQUF3QixFQUFFLFVBQUEsZUFBZTthQUNsRixNQUFLLGVBQWUsR0FBRyxlQUFlO0tBQUEsQ0FDdkMsQ0FBQyxDQUFBO0FBQ0YsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsd0JBQXdCLEVBQUUsVUFBQSxVQUFVO2FBQzdFLE1BQUssVUFBVSxHQUFHLFVBQVU7S0FBQSxDQUM3QixDQUFDLENBQUE7QUFDRixRQUFJLENBQUMs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QUEsTUFBTTtpQkFBSSxNQUFNLENBQUMsT0FBTyxFQUFFO1NBQUEsQ0FBQyxDQUFBO0FBQ2hELFlBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUE7T0FDckI7QUFDRCxVQUFJLENBQUMsWUFBWSxFQUFFLENBQUE7QUFDbkIsVUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUM1QixVQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtBQUMzQixZQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLENBQUE7T0FDbEM7QUFDRCxVQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFBO0FBQ3RCLFVBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUE7S0FDdEI7OztTQTlIUyxhQUFDLEtBQUssRUFBRTtBQUNoQixXQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ3RCLFVBQUksS0FBSyxLQUFLLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDMUIsWUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUE7QUFDcEIsWUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRTtBQUN0QixjQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFBLE9BQU87bUJBQUksT0FBTyxDQUFDLFdBQVcsR0FBRyxLQUFLO1dBQUEsQ0FBQyxDQUFBO1NBQzlEO09BQ0Y7S0FDRjtTQUNTLGVBQUc7QUFDWCxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUE7S0FDcEI7OztTQWxHa0IsWUFBWTs7O3FCQUFaLFlBQVkiLCJmaWxlIjoiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9saW50ZXIvbGliL2VkaXRvci1saW50ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJ1xuXG5pbXBvcnQge0VtaXR0ZXIsIENvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gJ2F0b20nXG5pbXBvcnQgSGVscGVycyBmcm9tICcuL2hlbHBlcnMnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEVkaXRvckxpbnRlciB7XG4gIGNvbnN0cnVjdG9yKGVkaXRvcikge1xuICAgIGlmICh0eXBlb2YgZWRpdG9yICE9PSAnb2JqZWN0JyB8fCB0eXBlb2YgZWRpdG9yLm1hcmtCdWZmZXJSYW5nZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdHaXZlbiBlZGl0b3IgaXMgbm90IHJlYWxseSBhbiBlZGl0b3InKVxuICAgIH1cblxuICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yXG4gICAgdGhpcy5lbWl0dGVyID0gbmV3IEVtaXR0ZXIoKVxuICAgIHRoaXMubWVzc2FnZXMgPSBuZXcgU2V0KClcbiAgICB0aGlzLm1hcmtlcnMgPSBuZXcgTWFwKClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIHRoaXMuZ3V0dGVyID0gbnVsbFxuICAgIHRoaXMuY291bnRMaW5lTWVzc2FnZXMgPSAwXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2xpbnRlci51bmRlcmxpbmVJc3N1ZXMnLCB1bmRlcmxpbmVJc3N1ZXMgPT5cbiAgICAgIHRoaXMudW5kZXJsaW5lSXNzdWVzID0gdW5kZXJsaW5lSXNzdWVzXG4gICAgKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2xpbnRlci5zaG93RXJyb3JJbmxpbmUnLCBzaG93QnViYmxlID0+XG4gICAgICB0aGlzLnNob3dCdWJibGUgPSBzaG93QnViYmxlXG4gICAgKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PlxuICAgICAgdGhpcy5kaXNwb3NlKClcbiAgICApKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5lZGl0b3Iub25EaWRTYXZlKCgpID0+XG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnc2hvdWxkLWxpbnQnLCBmYWxzZSlcbiAgICApKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5lZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbigoe29sZEJ1ZmZlclBvc2l0aW9uLCBuZXdCdWZmZXJQb3NpdGlvbn0pID0+IHtcbiAgICAgIGlmIChuZXdCdWZmZXJQb3NpdGlvbi5yb3cgIT09IG9sZEJ1ZmZlclBvc2l0aW9uLnJvdykge1xuICAgICAgICB0aGlzLmNhbGN1bGF0ZUxpbmVNZXNzYWdlcyhuZXdCdWZmZXJQb3NpdGlvbi5yb3cpXG4gICAgICB9XG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnc2hvdWxkLXVwZGF0ZS1idWJibGUnKVxuICAgIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLmd1dHRlckVuYWJsZWQnLCBndXR0ZXJFbmFibGVkID0+IHtcbiAgICAgIHRoaXMuZ3V0dGVyRW5hYmxlZCA9IGd1dHRlckVuYWJsZWRcbiAgICAgIHRoaXMuaGFuZGxlR3V0dGVyKClcbiAgICB9KSlcbiAgICAvLyBVc2luZyBvbkRpZENoYW5nZSBpbnN0ZWFkIG9mIG9ic2VydmUgaGVyZSAnY2F1c2UgdGhlIHNhbWUgZnVuY3Rpb24gaXMgaW52b2tlZCBhYm92ZVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub25EaWRDaGFuZ2UoJ2xpbnRlci5ndXR0ZXJQb3NpdGlvbicsICgpID0+XG4gICAgICB0aGlzLmhhbmRsZUd1dHRlcigpXG4gICAgKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMub25EaWRNZXNzYWdlQWRkKG1lc3NhZ2UgPT4ge1xuICAgICAgaWYgKCF0aGlzLnVuZGVybGluZUlzc3VlcyAmJiAhdGhpcy5ndXR0ZXJFbmFibGVkICYmICF0aGlzLnNob3dCdWJibGUgfHwgIW1lc3NhZ2UucmFuZ2UpIHtcbiAgICAgICAgcmV0dXJuIC8vIE5vLU9wXG4gICAgICB9XG4gICAgICBjb25zdCBtYXJrZXIgPSB0aGlzLmVkaXRvci5nZXRCdWZmZXIoKS5tYXJrUmFuZ2UobWVzc2FnZS5yYW5nZSwge2ludmFsaWRhdGU6ICdpbnNpZGUnfSlcbiAgICAgIG1hcmtlci5vbkRpZENoYW5nZSgoeyBvbGRIZWFkUG9zaXRpb24sIG5ld0hlYWRQb3NpdGlvbiwgaXNWYWxpZCB9KSA9PiB7XG4gICAgICAgIGlmIChpc1ZhbGlkICYmIChvbGRIZWFkUG9zaXRpb24ucm93ICE9PSAwIHx8IG5ld0hlYWRQb3NpdGlvbi5yb3cgPT09IDApKSB7XG4gICAgICAgICAgbWVzc2FnZS5yYW5nZSA9IG1hcmtlci5wcmV2aW91c0V2ZW50U3RhdGUucmFuZ2VcbiAgICAgICAgICBtZXNzYWdlLmtleSA9IEhlbHBlcnMubWVzc2FnZUtleShtZXNzYWdlKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgdGhpcy5tYXJrZXJzLnNldChtZXNzYWdlLCBtYXJrZXIpXG4gICAgICBpZiAodGhpcy51bmRlcmxpbmVJc3N1ZXMpIHtcbiAgICAgICAgdGhpcy5lZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7XG4gICAgICAgICAgdHlwZTogJ2hpZ2hsaWdodCcsXG4gICAgICAgICAgY2xhc3M6IGBsaW50ZXItaGlnaGxpZ2h0ICR7bWVzc2FnZS5jbGFzc31gXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBpZiAodGhpcy5ndXR0ZXJFbmFibGVkKSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJylcbiAgICAgICAgaXRlbS5jbGFzc05hbWUgPSBgbGludGVyLWd1dHRlciBsaW50ZXItaGlnaGxpZ2h0ICR7bWVzc2FnZS5jbGFzc31gXG4gICAgICAgIHRoaXMuZ3V0dGVyLmRlY29yYXRlTWFya2VyKG1hcmtlciwge1xuICAgICAgICAgIGNsYXNzOiAnbGludGVyLXJvdycsXG4gICAgICAgICAgaXRlbVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5vbkRpZE1lc3NhZ2VEZWxldGUobWVzc2FnZSA9PiB7XG4gICAgICBpZiAodGhpcy5tYXJrZXJzLmhhcyhtZXNzYWdlKSkge1xuICAgICAgICB0aGlzLm1hcmtlcnMuZ2V0KG1lc3NhZ2UpLmRlc3Ryb3koKVxuICAgICAgICB0aGlzLm1hcmtlcnMuZGVsZXRlKG1lc3NhZ2UpXG4gICAgICB9XG4gICAgfSkpXG5cbiAgICAvLyBUT0RPOiBBdG9tIGludm9rZXMgb25EaWR7Q2hhbmdlLCBTdG9wQ2hhbmdpbmd9IGNhbGxiYWNrcyBpbW1lZGlhdGVseS4gV29ya2Fyb3VuZCBpdFxuICAgIGF0b20uY29uZmlnLm9ic2VydmUoJ2xpbnRlci5saW50T25GbHlJbnRlcnZhbCcsIChpbnRlcnZhbCkgPT4ge1xuICAgICAgaWYgKHRoaXMuY2hhbmdlU3Vic2NyaXB0aW9uKSB7XG4gICAgICAgIHRoaXMuY2hhbmdlU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKVxuICAgICAgfVxuICAgICAgdGhpcy5jaGFuZ2VTdWJzY3JpcHRpb24gPSB0aGlzLmVkaXRvci5vbkRpZENoYW5nZShIZWxwZXJzLmRlYm91bmNlKCgpID0+IHtcbiAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ3Nob3VsZC1saW50JywgdHJ1ZSlcbiAgICAgIH0sIGludGVydmFsKSlcbiAgICB9KVxuXG4gICAgdGhpcy5hY3RpdmUgPSB0cnVlXG4gIH1cblxuICBzZXQgYWN0aXZlKHZhbHVlKSB7XG4gICAgdmFsdWUgPSBCb29sZWFuKHZhbHVlKVxuICAgIGlmICh2YWx1ZSAhPT0gdGhpcy5fYWN0aXZlKSB7XG4gICAgICB0aGlzLl9hY3RpdmUgPSB2YWx1ZVxuICAgICAgaWYgKHRoaXMubWVzc2FnZXMuc2l6ZSkge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzLmZvckVhY2gobWVzc2FnZSA9PiBtZXNzYWdlLmN1cnJlbnRGaWxlID0gdmFsdWUpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGdldCBhY3RpdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVxuICB9XG5cbiAgaGFuZGxlR3V0dGVyKCkge1xuICAgIGlmICh0aGlzLmd1dHRlciAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5yZW1vdmVHdXR0ZXIoKVxuICAgIH1cbiAgICBpZiAodGhpcy5ndXR0ZXJFbmFibGVkKSB7XG4gICAgICB0aGlzLmFkZEd1dHRlcigpXG4gICAgfVxuICB9XG5cbiAgYWRkR3V0dGVyKCkge1xuICAgIGNvbnN0IHBvc2l0aW9uID0gYXRvbS5jb25maWcuZ2V0KCdsaW50ZXIuZ3V0dGVyUG9zaXRpb24nKVxuICAgIHRoaXMuZ3V0dGVyID0gdGhpcy5lZGl0b3IuYWRkR3V0dGVyKHtcbiAgICAgIG5hbWU6ICdsaW50ZXInLFxuICAgICAgcHJpb3JpdHk6IHBvc2l0aW9uID09PSAnTGVmdCcgPyAtMTAwIDogMTAwXG4gICAgfSlcbiAgfVxuXG4gIHJlbW92ZUd1dHRlcigpIHtcbiAgICBpZiAodGhpcy5ndXR0ZXIgIT09IG51bGwpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIEF0b20gdGhyb3dzIHdoZW4gd2UgdHJ5IHRvIHJlbW92ZSBhIGd1dHRlciBjb250YWluZXIgZnJvbSBhIGNsb3NlZCB0ZXh0IGVkaXRvclxuICAgICAgICB0aGlzLmd1dHRlci5kZXN0cm95KClcbiAgICAgIH0gY2F0Y2ggKGVycikge31cbiAgICAgIHRoaXMuZ3V0dGVyID0gbnVsbFxuICAgIH1cbiAgfVxuXG4gIGdldE1lc3NhZ2VzKCkge1xuICAgIHJldHVybiB0aGlzLm1lc3NhZ2VzXG4gIH1cblxuICBhZGRNZXNzYWdlKG1lc3NhZ2UpIHtcbiAgICBpZiAoIXRoaXMubWVzc2FnZXMuaGFzKG1lc3NhZ2UpKSB7XG4gICAgICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICAgICAgbWVzc2FnZS5jdXJyZW50RmlsZSA9IHRydWVcbiAgICAgIH1cbiAgICAgIHRoaXMubWVzc2FnZXMuYWRkKG1lc3NhZ2UpXG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLW1lc3NhZ2UtYWRkJywgbWVzc2FnZSlcbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtbWVzc2FnZS1jaGFuZ2UnLCB7bWVzc2FnZSwgdHlwZTogJ2FkZCd9KVxuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZU1lc3NhZ2UobWVzc2FnZSkge1xuICAgIGlmICh0aGlzLm1lc3NhZ2VzLmhhcyhtZXNzYWdlKSkge1xuICAgICAgdGhpcy5tZXNzYWdlcy5kZWxldGUobWVzc2FnZSlcbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtbWVzc2FnZS1kZWxldGUnLCBtZXNzYWdlKVxuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1tZXNzYWdlLWNoYW5nZScsIHttZXNzYWdlLCB0eXBlOiAnZGVsZXRlJ30pXG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlTGluZU1lc3NhZ2VzKHJvdykge1xuICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2xpbnRlci5zaG93RXJyb3JUYWJMaW5lJykpIHtcbiAgICAgIGlmIChyb3cgPT09IG51bGwpIHtcbiAgICAgICAgcm93ID0gdGhpcy5lZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKS5yb3dcbiAgICAgIH1cbiAgICAgIHRoaXMuY291bnRMaW5lTWVzc2FnZXMgPSAwXG4gICAgICB0aGlzLm1lc3NhZ2VzLmZvckVhY2gobWVzc2FnZSA9PiB7XG4gICAgICAgIGlmIChtZXNzYWdlLmN1cnJlbnRMaW5lID0gbWVzc2FnZS5yYW5nZSAmJiBtZXNzYWdlLnJhbmdlLmludGVyc2VjdHNSb3cocm93KSkge1xuICAgICAgICAgIHRoaXMuY291bnRMaW5lTWVzc2FnZXMrK1xuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvdW50TGluZU1lc3NhZ2VzID0gMFxuICAgIH1cbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLWNhbGN1bGF0ZS1saW5lLW1lc3NhZ2VzJywgdGhpcy5jb3VudExpbmVNZXNzYWdlcylcbiAgICByZXR1cm4gdGhpcy5jb3VudExpbmVNZXNzYWdlc1xuICB9XG5cbiAgbGludChvbkNoYW5nZSA9IGZhbHNlKSB7XG4gICAgdGhpcy5lbWl0dGVyLmVtaXQoJ3Nob3VsZC1saW50Jywgb25DaGFuZ2UpXG4gIH1cblxuICBvbkRpZE1lc3NhZ2VBZGQoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtbWVzc2FnZS1hZGQnLCBjYWxsYmFjaylcbiAgfVxuXG4gIG9uRGlkTWVzc2FnZURlbGV0ZShjYWxsYmFjaykge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1tZXNzYWdlLWRlbGV0ZScsIGNhbGxiYWNrKVxuICB9XG5cbiAgb25EaWRNZXNzYWdlQ2hhbmdlKGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignZGlkLW1lc3NhZ2UtY2hhbmdlJywgY2FsbGJhY2spXG4gIH1cblxuICBvbkRpZENhbGN1bGF0ZUxpbmVNZXNzYWdlcyhjYWxsYmFjaykge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1jYWxjdWxhdGUtbGluZS1tZXNzYWdlcycsIGNhbGxiYWNrKVxuICB9XG5cbiAgb25TaG91bGRVcGRhdGVCdWJibGUoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdzaG91bGQtdXBkYXRlLWJ1YmJsZScsIGNhbGxiYWNrKVxuICB9XG5cbiAgb25TaG91bGRMaW50KGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignc2hvdWxkLWxpbnQnLCBjYWxsYmFjaylcbiAgfVxuXG4gIG9uRGlkRGVzdHJveShjYWxsYmFjaykge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1kZXN0cm95JywgY2FsbGJhY2spXG4gIH1cblxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtZGVzdHJveScpXG4gICAgaWYgKHRoaXMubWFya2Vycy5zaXplKSB7XG4gICAgICB0aGlzLm1hcmtlcnMuZm9yRWFjaChtYXJrZXIgPT4gbWFya2VyLmRlc3Ryb3koKSlcbiAgICAgIHRoaXMubWFya2Vycy5jbGVhcigpXG4gICAgfVxuICAgIHRoaXMucmVtb3ZlR3V0dGVyKClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgaWYgKHRoaXMuY2hhbmdlU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLmNoYW5nZVN1YnNjcmlwdGlvbi5kaXNwb3NlKClcbiAgICB9XG4gICAgdGhpcy5lbWl0dGVyLmRpc3Bvc2UoKVxuICAgIHRoaXMubWVzc2FnZXMuY2xlYXIoKVxuICB9XG59XG4iXX0=
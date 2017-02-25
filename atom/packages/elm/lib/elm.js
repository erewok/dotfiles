'use strict';
'use babel';

var _atom = require('atom');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _settings = require('./settings');

var _settings2 = _interopRequireDefault(_settings);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = {
  config: _settings2.default,
  subscriptions: null,
  // TODO: Some better debounce/throttle function
  lastSave: Date.now(),

  activate: function activate() {
    var _this = this;

    this.subscriptions = new _atom.CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'elm-format:file': function elmFormatFile() {
        return _this.formatCurrentFile();
      }
    }));
    this.editorObserver = atom.workspace.observeTextEditors(function (e) {
      return _this.handleEvents(e);
    });
  },
  handleEvents: function handleEvents(editor) {
    var _this2 = this;

    editor.getBuffer().onDidSave(function (file) {
      if (atom.config.get('elm-format.formatOnSave') && _this2.isElmFile(file)) {
        _this2.debounce(function () {
          return _this2.format(file, editor);
        });
      }
    });
  },
  debounce: function debounce(func) {
    if (Date.now() - 1000 > this.lastSave) {
      this.lastSave = Date.now();
      func();
    }
  },
  deactivate: function deactivate() {
    this.subscriptions.dispose();
  },
  error: function error(str) {
    if (atom.config.get('elm-format.showErrorNotifications')) {
      atom.notifications.addError(str);
    }
  },
  success: function success(str) {
    if (atom.config.get('elm-format.showNotifications')) {
      atom.notifications.addSuccess(str);
    }
  },
  formatCurrentFile: function formatCurrentFile() {
    var editor = atom.workspace.getActivePaneItem();

    if (!editor || editor.isModified()) {
      // Abort for invalid or unsaved text editors
      atom.notifications.addError('Please save before formatting');
      return;
    }

    var file = editor !== null ? editor.buffer.file : void 0;

    if (this.isElmFile(file)) {
      this.format(file, editor);
    } else {
      atom.notifications.addInfo('Not an Elm file', {
        dismissable: false,
        detail: 'I only know how to format .elm-files, sorry!'
      });
    }
  },
  isElmFile: function isElmFile(file) {
    return file && _path2.default.extname(file.path) === '.elm';
  },
  format: function format(file, editor) {
    var _this3 = this;

    var cursorPosition = editor.getCursorScreenPosition();
    new _atom.BufferedProcess({
      command: atom.config.get('elm-format.binary'),
      args: [file.path, '--yes', '--output', '/tmp/elm-format.tmp'],
      exit: function exit(code) {
        if (code === 0) {
          _fs2.default.readFile('/tmp/elm-format.tmp', 'utf8', function (err, data) {
            editor.setText(data);
            editor.save();
            editor.setCursorScreenPosition(cursorPosition);

            _this3.success('Formatted file');
          });
        } else {
          _this3.error('elm-format exited with code ' + code);
        }
      }
    });
  }
};
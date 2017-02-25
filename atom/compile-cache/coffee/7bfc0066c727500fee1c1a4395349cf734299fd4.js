(function() {
  var CompositeDisposable, ImportListView, UPIConsumer,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  CompositeDisposable = require('atom').CompositeDisposable;

  ImportListView = require('./views/import-list-view');

  module.exports = UPIConsumer = (function() {
    UPIConsumer.prototype.messageTypes = {
      error: {},
      warning: {},
      lint: {}
    };

    UPIConsumer.prototype.contextScope = 'atom-text-editor[data-grammar~="haskell"]';

    UPIConsumer.prototype.globalCommands = function() {
      return {
        'haskell-ghc-mod:check-file': this.checkCommand,
        'haskell-ghc-mod:lint-file': this.lintCommand
      };
    };

    UPIConsumer.prototype.mainMenu = [
      {
        label: 'Check',
        command: 'haskell-ghc-mod:check-file'
      }, {
        label: 'Lint',
        command: 'haskell-ghc-mod:lint-file'
      }
    ];

    UPIConsumer.prototype.contextCommands = function() {
      return {
        'haskell-ghc-mod:show-type': this.tooltipCommand(this.typeTooltip),
        'haskell-ghc-mod:show-info': this.tooltipCommand(this.infoTooltip),
        'haskell-ghc-mod:case-split': this.caseSplitCommand,
        'haskell-ghc-mod:sig-fill': this.sigFillCommand,
        'haskell-ghc-mod:go-to-declaration': this.goToDeclCommand,
        'haskell-ghc-mod:show-info-fallback-to-type': this.tooltipCommand(this.infoTypeTooltip),
        'haskell-ghc-mod:show-type-fallback-to-info': this.tooltipCommand(this.typeInfoTooltip),
        'haskell-ghc-mod:show-type-and-info': this.tooltipCommand(this.typeAndInfoTooltip),
        'haskell-ghc-mod:insert-type': this.insertTypeCommand,
        'haskell-ghc-mod:insert-import': this.insertImportCommand
      };
    };

    UPIConsumer.prototype.contextMenu = {
      label: 'ghc-mod',
      submenu: [
        {
          label: 'Show Type',
          command: 'haskell-ghc-mod:show-type'
        }, {
          label: 'Show Info',
          command: 'haskell-ghc-mod:show-info'
        }, {
          label: 'Show Type And Info',
          command: 'haskell-ghc-mod:show-type-and-info'
        }, {
          label: 'Case Split',
          command: 'haskell-ghc-mod:case-split'
        }, {
          label: 'Sig Fill',
          command: 'haskell-ghc-mod:sig-fill'
        }, {
          label: 'Insert Type',
          command: 'haskell-ghc-mod:insert-type'
        }, {
          label: 'Insert Import',
          command: 'haskell-ghc-mod:insert-import'
        }, {
          label: 'Go To Declaration',
          command: 'haskell-ghc-mod:go-to-declaration'
        }
      ]
    };

    UPIConsumer.prototype.upi = null;

    UPIConsumer.prototype.process = null;

    function UPIConsumer(service, process) {
      var cm;
      this.process = process;
      this.typeAndInfoTooltip = __bind(this.typeAndInfoTooltip, this);
      this.typeInfoTooltip = __bind(this.typeInfoTooltip, this);
      this.infoTypeTooltip = __bind(this.infoTypeTooltip, this);
      this.infoTooltip = __bind(this.infoTooltip, this);
      this.typeTooltip = __bind(this.typeTooltip, this);
      this.insertImportCommand = __bind(this.insertImportCommand, this);
      this.goToDeclCommand = __bind(this.goToDeclCommand, this);
      this.sigFillCommand = __bind(this.sigFillCommand, this);
      this.caseSplitCommand = __bind(this.caseSplitCommand, this);
      this.insertTypeCommand = __bind(this.insertTypeCommand, this);
      this.tooltipCommand = __bind(this.tooltipCommand, this);
      this.lintCommand = __bind(this.lintCommand, this);
      this.checkCommand = __bind(this.checkCommand, this);
      this.shouldShowTooltip = __bind(this.shouldShowTooltip, this);
      this.upi = service.registerPlugin(this.disposables = new CompositeDisposable);
      this.upi.setMessageTypes(this.messageTypes);
      this.disposables.add(atom.commands.add(this.contextScope, this.contextCommands()));
      this.upi.onShouldShowTooltip(this.shouldShowTooltip);
      this.disposables.add(this.process.onBackendActive((function(_this) {
        return function() {
          return _this.upi.setStatus({
            status: 'progress'
          });
        };
      })(this)));
      this.disposables.add(this.process.onBackendIdle((function(_this) {
        return function() {
          return _this.upi.setStatus({
            status: 'ready'
          });
        };
      })(this)));
      cm = {};
      cm[this.contextScope] = [this.contextMenu];
      this.disposables.add(atom.contextMenu.add(cm));
      if (!atom.config.get('haskell-ghc-mod.useLinter')) {
        this.disposables.add(atom.commands.add(this.contextScope, this.globalCommands()));
        this.upi.setMenu('ghc-mod', this.mainMenu);
        this.disposables.add(this.upi.onDidSaveBuffer((function(_this) {
          return function(buffer) {
            return _this.checkLint(buffer, 'Save');
          };
        })(this)));
        this.disposables.add(this.upi.onDidStopChanging((function(_this) {
          return function(buffer) {
            return _this.checkLint(buffer, 'Change', true);
          };
        })(this)));
      } else {
        this.upi.setMenu('ghc-mod', [
          {
            label: 'Check',
            command: 'linter:lint'
          }
        ]);
      }
      this.upi.setMenu('ghc-mod', [
        {
          label: 'Stop Backend',
          command: 'haskell-ghc-mod:shutdown-backend'
        }
      ]);
    }

    UPIConsumer.prototype.destroy = function() {
      this.disposables.dispose();
      this.upi = null;
      return this.process = null;
    };

    UPIConsumer.prototype.shouldShowTooltip = function(editor, crange, type) {
      var t;
      switch (type) {
        case 'mouse':
        case void 0:
          if (t = atom.config.get('haskell-ghc-mod.onMouseHoverShow')) {
            return this["" + t + "Tooltip"](editor, crange);
          }
          break;
        case 'selection':
          if (t = atom.config.get('haskell-ghc-mod.onSelectionShow')) {
            return this["" + t + "Tooltip"](editor, crange);
          }
      }
    };

    UPIConsumer.prototype.checkCommand = function(_arg) {
      var editor, target;
      target = _arg.target;
      editor = target.getModel();
      return this.process.doCheckBuffer(editor.getBuffer()).then((function(_this) {
        return function(res) {
          return _this.setMessages(res, ['error', 'warning']);
        };
      })(this));
    };

    UPIConsumer.prototype.lintCommand = function(_arg) {
      var editor, target;
      target = _arg.target;
      editor = target.getModel();
      return this.process.doLintBuffer(editor.getBuffer()).then((function(_this) {
        return function(res) {
          return _this.setMessages(res, ['lint']);
        };
      })(this));
    };

    UPIConsumer.prototype.tooltipCommand = function(tooltipfun) {
      return (function(_this) {
        return function(_arg) {
          var detail, target;
          target = _arg.target, detail = _arg.detail;
          return _this.upi.showTooltip({
            editor: target.getModel(),
            detail: detail,
            tooltip: function(crange) {
              return tooltipfun(target.getModel(), crange);
            }
          });
        };
      })(this);
    };

    UPIConsumer.prototype.insertTypeCommand = function(_arg) {
      var Util, detail, editor, target;
      target = _arg.target, detail = _arg.detail;
      Util = require('./util');
      editor = target.getModel();
      return this.upi.withEventRange({
        editor: editor,
        detail: detail
      }, (function(_this) {
        return function(_arg1) {
          var crange, pos;
          crange = _arg1.crange, pos = _arg1.pos;
          return _this.process.getTypeInBuffer(editor.getBuffer(), crange).then(function(o) {
            var birdTrack, indent, range, scope, symbol, type, _ref;
            type = o.type;
            _ref = Util.getSymbolAtPoint(editor, pos), scope = _ref.scope, range = _ref.range, symbol = _ref.symbol;
            if (editor.getTextInBufferRange(o.range).match(/[=]/) != null) {
              indent = editor.getTextInBufferRange([[o.range.start.row, 0], o.range.start]);
              if (scope === 'keyword.operator.haskell') {
                symbol = "(" + symbol + ")";
              }
              birdTrack = '';
              if (__indexOf.call(editor.scopeDescriptorForBufferPosition(pos).getScopesArray(), 'meta.embedded.haskell') >= 0) {
                birdTrack = indent.slice(0, 2);
                indent = indent.slice(2);
              }
              if (indent.match(/\S/) != null) {
                indent = indent.replace(/\S/g, ' ');
              }
              return editor.setTextInBufferRange([o.range.start, o.range.start], "" + symbol + " :: " + type + "\n" + birdTrack + indent);
            } else if (scope == null) {
              return editor.setTextInBufferRange(o.range, "(" + (editor.getTextInBufferRange(o.range)) + " :: " + type + ")");
            }
          });
        };
      })(this));
    };

    UPIConsumer.prototype.caseSplitCommand = function(_arg) {
      var detail, editor, target;
      target = _arg.target, detail = _arg.detail;
      editor = target.getModel();
      return this.upi.withEventRange({
        editor: editor,
        detail: detail
      }, (function(_this) {
        return function(_arg1) {
          var crange;
          crange = _arg1.crange;
          return _this.process.doCaseSplit(editor.getBuffer(), crange).then(function(res) {
            return res.forEach(function(_arg2) {
              var range, replacement;
              range = _arg2.range, replacement = _arg2.replacement;
              return editor.setTextInBufferRange(range, replacement);
            });
          });
        };
      })(this));
    };

    UPIConsumer.prototype.sigFillCommand = function(_arg) {
      var detail, editor, target;
      target = _arg.target, detail = _arg.detail;
      editor = target.getModel();
      return this.upi.withEventRange({
        editor: editor,
        detail: detail
      }, (function(_this) {
        return function(_arg1) {
          var crange;
          crange = _arg1.crange;
          return _this.process.doSigFill(editor.getBuffer(), crange).then(function(res) {
            return res.forEach(function(_arg2) {
              var body, indent, pos, range, sig, text, type;
              type = _arg2.type, range = _arg2.range, body = _arg2.body;
              sig = editor.getTextInBufferRange(range);
              indent = editor.indentLevelForLine(sig);
              pos = range.end;
              text = "\n" + body;
              return editor.transact(function() {
                var newrange, row, _i, _len, _ref, _results;
                if (type === 'instance') {
                  indent += 1;
                  if (!sig.endsWith(' where')) {
                    editor.setTextInBufferRange([range.end, range.end], ' where');
                  }
                }
                newrange = editor.setTextInBufferRange([pos, pos], text);
                _ref = newrange.getRows().slice(1);
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  row = _ref[_i];
                  _results.push(editor.setIndentationForBufferRow(row, indent));
                }
                return _results;
              });
            });
          });
        };
      })(this));
    };

    UPIConsumer.prototype.goToDeclCommand = function(_arg) {
      var detail, editor, target;
      target = _arg.target, detail = _arg.detail;
      editor = target.getModel();
      return this.upi.withEventRange({
        editor: editor,
        detail: detail
      }, (function(_this) {
        return function(_arg1) {
          var crange;
          crange = _arg1.crange;
          return _this.process.getInfoInBuffer(editor, crange).then(function(_arg2) {
            var col, fn, info, line, range, res, rootDir, _;
            range = _arg2.range, info = _arg2.info;
            res = /.*-- Defined at (.+):(\d+):(\d+)/.exec(info);
            if (res == null) {
              return;
            }
            _ = res[0], fn = res[1], line = res[2], col = res[3];
            rootDir = _this.process.getRootDir(editor.getBuffer());
            return atom.workspace.open(((function() {
              var _ref;
              try {
                return (_ref = rootDir.getFile(fn).getPath()) != null ? _ref : fn;
              } catch (_error) {}
            })()), {
              initialLine: parseInt(line) - 1,
              initialColumn: parseInt(col) - 1
            });
          });
        };
      })(this));
    };

    UPIConsumer.prototype.insertImportCommand = function(_arg) {
      var buffer, detail, editor, target;
      target = _arg.target, detail = _arg.detail;
      editor = target.getModel();
      buffer = editor.getBuffer();
      return this.upi.withEventRange({
        editor: editor,
        detail: detail
      }, (function(_this) {
        return function(_arg1) {
          var crange;
          crange = _arg1.crange;
          return _this.process.findSymbolProvidersInBuffer(editor, crange).then(function(lines) {
            return new ImportListView({
              items: lines,
              onConfirmed: function(mod) {
                var piP;
                piP = new Promise(function(resolve) {
                  buffer.backwardsScan(/^(\s*)(import|module)/, function(_arg2) {
                    var match, range, stop;
                    match = _arg2.match, range = _arg2.range, stop = _arg2.stop;
                    return resolve({
                      pos: buffer.rangeForRow(range.start.row).end,
                      indent: (function() {
                        switch (match[2]) {
                          case "import":
                            return "\n" + match[1];
                          case "module":
                            return "\n\n" + match[1];
                        }
                      })()
                    });
                  });
                  return resolve({
                    pos: buffer.getFirstPosition(),
                    indent: "",
                    end: "\n"
                  });
                });
                return piP.then(function(pi) {
                  var _ref;
                  return editor.setTextInBufferRange([pi.pos, pi.pos], "" + pi.indent + "import " + mod + ((_ref = pi.end) != null ? _ref : ''));
                });
              }
            });
          });
        };
      })(this));
    };

    UPIConsumer.prototype.typeTooltip = function(e, p) {
      return this.process.getTypeInBuffer(e.getBuffer(), p).then(function(_arg) {
        var range, type;
        range = _arg.range, type = _arg.type;
        return {
          range: range,
          text: {
            text: type,
            highlighter: atom.config.get('haskell-ghc-mod.highlightTooltips') ? 'hint.type.haskell' : void 0
          }
        };
      });
    };

    UPIConsumer.prototype.infoTooltip = function(e, p) {
      return this.process.getInfoInBuffer(e, p).then(function(_arg) {
        var info, range;
        range = _arg.range, info = _arg.info;
        return {
          range: range,
          text: {
            text: info,
            highlighter: atom.config.get('haskell-ghc-mod.highlightTooltips') ? 'source.haskell' : void 0
          }
        };
      });
    };

    UPIConsumer.prototype.infoTypeTooltip = function(e, p) {
      var args;
      args = arguments;
      return this.infoTooltip(e, p)["catch"]((function(_this) {
        return function() {
          return _this.typeTooltip(e, p);
        };
      })(this));
    };

    UPIConsumer.prototype.typeInfoTooltip = function(e, p) {
      var args;
      args = arguments;
      return this.typeTooltip(e, p)["catch"]((function(_this) {
        return function() {
          return _this.infoTooltip(e, p);
        };
      })(this));
    };

    UPIConsumer.prototype.typeAndInfoTooltip = function(e, p) {
      var args, infoP, typeP;
      args = arguments;
      typeP = this.typeTooltip(e, p)["catch"](function() {
        return null;
      });
      infoP = this.infoTooltip(e, p)["catch"](function() {
        return null;
      });
      return Promise.all([typeP, infoP]).then(function(_arg) {
        var info, type, _ref, _ref1, _ref2;
        type = _arg[0], info = _arg[1];
        return {
          range: (function() {
            if ((type != null) && (info != null)) {
              return type.range.union(info.range);
            } else if (type != null) {
              return type.range;
            } else if (info != null) {
              return info.range;
            } else {
              throw new Error('Got neither type nor info');
            }
          })(),
          text: {
            text: "" + ((type != null ? (_ref = type.text) != null ? _ref.text : void 0 : void 0) ? ':: ' + type.text.text + '\n' : '') + ((_ref1 = info != null ? (_ref2 = info.text) != null ? _ref2.text : void 0 : void 0) != null ? _ref1 : ''),
            highlighter: atom.config.get('haskell-ghc-mod.highlightTooltips') ? 'source.haskell' : void 0
          }
        };
      });
    };

    UPIConsumer.prototype.setHighlighter = function() {
      if (atom.config.get('haskell-ghc-mod.highlightMessages')) {
        return function(m) {
          m.message = {
            text: m.message,
            highlighter: 'hint.message.haskell'
          };
          return m;
        };
      } else {
        return function(m) {
          return m;
        };
      }
    };

    UPIConsumer.prototype.setMessages = function(messages, types) {
      return this.upi.setMessages(messages.map(this.setHighlighter()), types);
    };

    UPIConsumer.prototype.checkLint = function(buffer, opt, fast) {
      if (atom.config.get("haskell-ghc-mod.on" + opt + "Check") && atom.config.get("haskell-ghc-mod.on" + opt + "Lint")) {
        return this.process.doCheckAndLint(buffer, fast).then((function(_this) {
          return function(res) {
            return _this.setMessages(res, ['error', 'warning', 'lint']);
          };
        })(this));
      } else if (atom.config.get("haskell-ghc-mod.on" + opt + "Check")) {
        return this.process.doCheckBuffer(buffer, fast).then((function(_this) {
          return function(res) {
            return _this.setMessages(res, ['error', 'warning']);
          };
        })(this));
      } else if (atom.config.get("haskell-ghc-mod.on" + opt + "Lint")) {
        return this.process.doLintBuffer(buffer, fast).then((function(_this) {
          return function(res) {
            return _this.setMessages(res, ['lint']);
          };
        })(this));
      }
    };

    return UPIConsumer;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL3VwaS1jb25zdW1lci5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLE1BQUEsZ0RBQUE7SUFBQTt5SkFBQTs7QUFBQSxFQUFDLHNCQUF1QixPQUFBLENBQVEsTUFBUixFQUF2QixtQkFBRCxDQUFBOztBQUFBLEVBQ0EsY0FBQSxHQUFpQixPQUFBLENBQVEsMEJBQVIsQ0FEakIsQ0FBQTs7QUFBQSxFQUdBLE1BQU0sQ0FBQyxPQUFQLEdBQ007QUFDSiwwQkFBQSxZQUFBLEdBQ0U7QUFBQSxNQUFBLEtBQUEsRUFBTyxFQUFQO0FBQUEsTUFDQSxPQUFBLEVBQVMsRUFEVDtBQUFBLE1BRUEsSUFBQSxFQUFNLEVBRk47S0FERixDQUFBOztBQUFBLDBCQUtBLFlBQUEsR0FBYywyQ0FMZCxDQUFBOztBQUFBLDBCQU9BLGNBQUEsR0FBZ0IsU0FBQSxHQUFBO2FBQ2Q7QUFBQSxRQUFBLDRCQUFBLEVBQThCLElBQUMsQ0FBQSxZQUEvQjtBQUFBLFFBQ0EsMkJBQUEsRUFBNkIsSUFBQyxDQUFBLFdBRDlCO1FBRGM7SUFBQSxDQVBoQixDQUFBOztBQUFBLDBCQVdBLFFBQUEsR0FDRTtNQUNFO0FBQUEsUUFBQyxLQUFBLEVBQU8sT0FBUjtBQUFBLFFBQWlCLE9BQUEsRUFBUyw0QkFBMUI7T0FERixFQUVFO0FBQUEsUUFBQyxLQUFBLEVBQU8sTUFBUjtBQUFBLFFBQWdCLE9BQUEsRUFBUywyQkFBekI7T0FGRjtLQVpGLENBQUE7O0FBQUEsMEJBaUJBLGVBQUEsR0FBaUIsU0FBQSxHQUFBO2FBQ2Y7QUFBQSxRQUFBLDJCQUFBLEVBQTZCLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQUMsQ0FBQSxXQUFqQixDQUE3QjtBQUFBLFFBQ0EsMkJBQUEsRUFBNkIsSUFB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

//# sourceURL=/Users/erewok/.atom/packages/haskell-ghc-mod/lib/upi-consumer.coffee

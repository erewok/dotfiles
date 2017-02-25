(function() {
  var CompositeDisposable, ImportListView, UPIConsumer,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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
      this.typeAndInfoTooltip = bind(this.typeAndInfoTooltip, this);
      this.typeInfoTooltip = bind(this.typeInfoTooltip, this);
      this.infoTypeTooltip = bind(this.infoTypeTooltip, this);
      this.infoTooltip = bind(this.infoTooltip, this);
      this.typeTooltip = bind(this.typeTooltip, this);
      this.insertImportCommand = bind(this.insertImportCommand, this);
      this.goToDeclCommand = bind(this.goToDeclCommand, this);
      this.sigFillCommand = bind(this.sigFillCommand, this);
      this.caseSplitCommand = bind(this.caseSplitCommand, this);
      this.insertTypeCommand = bind(this.insertTypeCommand, this);
      this.tooltipCommand = bind(this.tooltipCommand, this);
      this.lintCommand = bind(this.lintCommand, this);
      this.checkCommand = bind(this.checkCommand, this);
      this.shouldShowTooltip = bind(this.shouldShowTooltip, this);
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
            return this[t + "Tooltip"](editor, crange);
          }
          break;
        case 'selection':
          if (t = atom.config.get('haskell-ghc-mod.onSelectionShow')) {
            return this[t + "Tooltip"](editor, crange);
          }
      }
    };

    UPIConsumer.prototype.checkCommand = function(arg) {
      var currentTarget, editor;
      currentTarget = arg.currentTarget;
      editor = currentTarget.getModel();
      return this.process.doCheckBuffer(editor.getBuffer()).then((function(_this) {
        return function(res) {
          return _this.setMessages(res, ['error', 'warning']);
        };
      })(this));
    };

    UPIConsumer.prototype.lintCommand = function(arg) {
      var currentTarget, editor;
      currentTarget = arg.currentTarget;
      editor = currentTarget.getModel();
      return this.process.doLintBuffer(editor.getBuffer()).then((function(_this) {
        return function(res) {
          return _this.setMessages(res, ['lint']);
        };
      })(this));
    };

    UPIConsumer.prototype.tooltipCommand = function(tooltipfun) {
      return (function(_this) {
        return function(arg) {
          var currentTarget, detail;
          currentTarget = arg.currentTarget, detail = arg.detail;
          return _this.upi.showTooltip({
            editor: currentTarget.getModel(),
            detail: detail,
            tooltip: function(crange) {
              return tooltipfun(currentTarget.getModel(), crange);
            }
          });
        };
      })(this);
    };

    UPIConsumer.prototype.insertTypeCommand = function(arg) {
      var Util, currentTarget, detail, editor;
      currentTarget = arg.currentTarget, detail = arg.detail;
      Util = require('./util');
      editor = currentTarget.getModel();
      return this.upi.withEventRange({
        editor: editor,
        detail: detail
      }, (function(_this) {
        return function(arg1) {
          var crange, pos;
          crange = arg1.crange, pos = arg1.pos;
          return _this.process.getTypeInBuffer(editor.getBuffer(), crange).then(function(o) {
            var birdTrack, indent, range, ref, scope, symbol, type;
            type = o.type;
            ref = Util.getSymbolAtPoint(editor, pos), scope = ref.scope, range = ref.range, symbol = ref.symbol;
            if (editor.getTextInBufferRange(o.range).match(/[=]/) != null) {
              indent = editor.getTextInBufferRange([[o.range.start.row, 0], o.range.start]);
              if (scope === 'keyword.operator.haskell') {
                symbol = "(" + symbol + ")";
              }
              birdTrack = '';
              if (indexOf.call(editor.scopeDescriptorForBufferPosition(pos).getScopesArray(), 'meta.embedded.haskell') >= 0) {
                birdTrack = indent.slice(0, 2);
                indent = indent.slice(2);
              }
              if (indent.match(/\S/) != null) {
                indent = indent.replace(/\S/g, ' ');
              }
              return editor.setTextInBufferRange([o.range.start, o.range.start], symbol + " :: " + type + "\n" + birdTrack + indent);
            } else if (scope == null) {
              return editor.setTextInBufferRange(o.range, "(" + (editor.getTextInBufferRange(o.range)) + " :: " + type + ")");
            }
          });
        };
      })(this));
    };

    UPIConsumer.prototype.caseSplitCommand = function(arg) {
      var currentTarget, detail, editor;
      currentTarget = arg.currentTarget, detail = arg.detail;
      editor = currentTarget.getModel();
      return this.upi.withEventRange({
        editor: editor,
        detail: detail
      }, (function(_this) {
        return function(arg1) {
          var crange;
          crange = arg1.crange;
          return _this.process.doCaseSplit(editor.getBuffer(), crange).then(function(res) {
            return res.forEach(function(arg2) {
              var range, replacement;
              range = arg2.range, replacement = arg2.replacement;
              return editor.setTextInBufferRange(range, replacement);
            });
          });
        };
      })(this));
    };

    UPIConsumer.prototype.sigFillCommand = function(arg) {
      var currentTarget, detail, editor;
      currentTarget = arg.currentTarget, detail = arg.detail;
      editor = currentTarget.getModel();
      return this.upi.withEventRange({
        editor: editor,
        detail: detail
      }, (function(_this) {
        return function(arg1) {
          var crange;
          crange = arg1.crange;
          return _this.process.doSigFill(editor.getBuffer(), crange).then(function(res) {
            return res.forEach(function(arg2) {
              var body, indent, pos, range, sig, text, type;
              type = arg2.type, range = arg2.range, body = arg2.body;
              sig = editor.getTextInBufferRange(range);
              indent = editor.indentLevelForLine(sig);
              pos = range.end;
              text = "\n" + body;
              return editor.transact(function() {
                var i, len, newrange, ref, results, row;
                if (type === 'instance') {
                  indent += 1;
                  if (!sig.endsWith(' where')) {
                    editor.setTextInBufferRange([range.end, range.end], ' where');
                  }
                }
                newrange = editor.setTextInBufferRange([pos, pos], text);
                ref = newrange.getRows().slice(1);
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                  row = ref[i];
                  results.push(editor.setIndentationForBufferRow(row, indent));
                }
                return results;
              });
            });
          });
        };
      })(this));
    };

    UPIConsumer.prototype.goToDeclCommand = function(arg) {
      var currentTarget, detail, editor;
      currentTarget = arg.currentTarget, detail = arg.detail;
      editor = currentTarget.getModel();
      return this.upi.withEventRange({
        editor: editor,
        detail: detail
      }, (function(_this) {
        return function(arg1) {
          var crange;
          crange = arg1.crange;
          return _this.process.getInfoInBuffer(editor, crange).then(function(arg2) {
            var _, col, fn, info, line, range, res, rootDir;
            range = arg2.range, info = arg2.info;
            res = /.*-- Defined at (.+):(\d+):(\d+)/.exec(info);
            if (res == null) {
              return;
            }
            _ = res[0], fn = res[1], line = res[2], col = res[3];
            rootDir = _this.process.getRootDir(editor.getBuffer());
            return atom.workspace.open(((function() {
              var ref;
              try {
                return (ref = rootDir.getFile(fn).getPath()) != null ? ref : fn;
              } catch (error) {}
            })()), {
              initialLine: parseInt(line) - 1,
              initialColumn: parseInt(col) - 1
            });
          });
        };
      })(this));
    };

    UPIConsumer.prototype.insertImportCommand = function(arg) {
      var buffer, currentTarget, detail, editor;
      currentTarget = arg.currentTarget, detail = arg.detail;
      editor = currentTarget.getModel();
      buffer = editor.getBuffer();
      return this.upi.withEventRange({
        editor: editor,
        detail: detail
      }, (function(_this) {
        return function(arg1) {
          var crange;
          crange = arg1.crange;
          return _this.process.findSymbolProvidersInBuffer(editor, crange).then(function(lines) {
            return new ImportListView({
              items: lines,
              onConfirmed: function(mod) {
                var piP;
                piP = new Promise(function(resolve) {
                  buffer.backwardsScan(/^(\s*)(import|module)/, function(arg2) {
                    var match, range, stop;
                    match = arg2.match, range = arg2.range, stop = arg2.stop;
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
                  var ref;
                  return editor.setTextInBufferRange([pi.pos, pi.pos], pi.indent + "import " + mod + ((ref = pi.end) != null ? ref : ''));
                });
              }
            });
          });
        };
      })(this));
    };

    UPIConsumer.prototype.typeTooltip = function(e, p) {
      return this.process.getTypeInBuffer(e.getBuffer(), p).then(function(arg) {
        var range, type;
        range = arg.range, type = arg.type;
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
      return this.process.getInfoInBuffer(e, p).then(function(arg) {
        var info, range;
        range = arg.range, info = arg.info;
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
      return Promise.all([typeP, infoP]).then(function(arg) {
        var info, ref, ref1, ref2, type;
        type = arg[0], info = arg[1];
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
            text: "" + ((type != null ? (ref = type.text) != null ? ref.text : void 0 : void 0) ? ':: ' + type.text.text + '\n' : '') + ((ref1 = info != null ? (ref2 = info.text) != null ? ref2.text : void 0 : void 0) != null ? ref1 : ''),
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL3VwaS1jb25zdW1lci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGdEQUFBO0lBQUE7OztFQUFDLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsY0FBQSxHQUFpQixPQUFBLENBQVEsMEJBQVI7O0VBRWpCLE1BQU0sQ0FBQyxPQUFQLEdBQ007MEJBQ0osWUFBQSxHQUNFO01BQUEsS0FBQSxFQUFPLEVBQVA7TUFDQSxPQUFBLEVBQVMsRUFEVDtNQUVBLElBQUEsRUFBTSxFQUZOOzs7MEJBSUYsWUFBQSxHQUFjOzswQkFFZCxjQUFBLEdBQWdCLFNBQUE7YUFDZDtRQUFBLDRCQUFBLEVBQThCLElBQUMsQ0FBQSxZQUEvQjtRQUNBLDJCQUFBLEVBQTZCLElBQUMsQ0FBQSxXQUQ5Qjs7SUFEYzs7MEJBSWhCLFFBQUEsR0FDRTtNQUNFO1FBQUMsS0FBQSxFQUFPLE9BQVI7UUFBaUIsT0FBQSxFQUFTLDRCQUExQjtPQURGLEVBRUU7UUFBQyxLQUFBLEVBQU8sTUFBUjtRQUFnQixPQUFBLEVBQVMsMkJBQXpCO09BRkY7OzswQkFLRixlQUFBLEdBQWlCLFNBQUE7YUFDZjtRQUFBLDJCQUFBLEVBQTZCLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQUMsQ0FBQSxXQUFqQixDQUE3QjtRQUNBLDJCQUFBLEVBQTZCLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQUMsQ0FBQSxXQUFqQixDQUQ3QjtRQUVBLDRCQUFBLEVBQThCLElBQUMsQ0FBQSxnQkFGL0I7UUFHQSwwQkFBQSxFQUE0QixJQUFDLENBQUEsY0FIN0I7UUFJQSxtQ0FBQSxFQUFxQyxJQUFDLENBQUEsZUFKdEM7UUFLQSw0Q0FBQSxFQUE4QyxJQUFDLENBQUEsY0FBRCxDQUFnQixJQUFDLENBQUEsZUFBakIsQ0FMOUM7UUFNQSw0Q0FBQSxF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QUFBLENBQUEsSUFBQSxDQUExQyxFQURHO09BQUEsTUFHQSxJQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixvQkFBQSxHQUFxQixHQUFyQixHQUF5QixNQUF6QyxDQUFIO2VBQ0gsSUFBQyxDQUFBLE9BQU8sQ0FBQyxZQUFULENBQXNCLE1BQXRCLEVBQThCLElBQTlCLENBQW1DLENBQUMsSUFBcEMsQ0FBeUMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxHQUFEO21CQUN2QyxLQUFDLENBQUEsV0FBRCxDQUFhLEdBQWIsRUFBa0IsQ0FBQyxNQUFELENBQWxCO1VBRHVDO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QyxFQURHOztJQVJJOzs7OztBQWxSYiIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5JbXBvcnRMaXN0VmlldyA9IHJlcXVpcmUgJy4vdmlld3MvaW1wb3J0LWxpc3QtdmlldydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgVVBJQ29uc3VtZXJcbiAgbWVzc2FnZVR5cGVzOlxuICAgIGVycm9yOiB7fVxuICAgIHdhcm5pbmc6IHt9XG4gICAgbGludDoge31cblxuICBjb250ZXh0U2NvcGU6ICdhdG9tLXRleHQtZWRpdG9yW2RhdGEtZ3JhbW1hcn49XCJoYXNrZWxsXCJdJ1xuXG4gIGdsb2JhbENvbW1hbmRzOiAtPlxuICAgICdoYXNrZWxsLWdoYy1tb2Q6Y2hlY2stZmlsZSc6IEBjaGVja0NvbW1hbmRcbiAgICAnaGFza2VsbC1naGMtbW9kOmxpbnQtZmlsZSc6IEBsaW50Q29tbWFuZFxuXG4gIG1haW5NZW51OlxuICAgIFtcbiAgICAgIHtsYWJlbDogJ0NoZWNrJywgY29tbWFuZDogJ2hhc2tlbGwtZ2hjLW1vZDpjaGVjay1maWxlJ31cbiAgICAgIHtsYWJlbDogJ0xpbnQnLCBjb21tYW5kOiAnaGFza2VsbC1naGMtbW9kOmxpbnQtZmlsZSd9XG4gICAgXVxuXG4gIGNvbnRleHRDb21tYW5kczogLT5cbiAgICAnaGFza2VsbC1naGMtbW9kOnNob3ctdHlwZSc6IEB0b29sdGlwQ29tbWFuZCBAdHlwZVRvb2x0aXBcbiAgICAnaGFza2VsbC1naGMtbW9kOnNob3ctaW5mbyc6IEB0b29sdGlwQ29tbWFuZCBAaW5mb1Rvb2x0aXBcbiAgICAnaGFza2VsbC1naGMtbW9kOmNhc2Utc3BsaXQnOiBAY2FzZVNwbGl0Q29tbWFuZFxuICAgICdoYXNrZWxsLWdoYy1tb2Q6c2lnLWZpbGwnOiBAc2lnRmlsbENvbW1hbmRcbiAgICAnaGFza2VsbC1naGMtbW9kOmdvLXRvLWRlY2xhcmF0aW9uJzogQGdvVG9EZWNsQ29tbWFuZFxuICAgICdoYXNrZWxsLWdoYy1tb2Q6c2hvdy1pbmZvLWZhbGxiYWNrLXRvLXR5cGUnOiBAdG9vbHRpcENvbW1hbmQgQGluZm9UeXBlVG9vbHRpcFxuICAgICdoYXNrZWxsLWdoYy1tb2Q6c2hvdy10eXBlLWZhbGxiYWNrLXRvLWluZm8nOiBAdG9vbHRpcENvbW1hbmQgQHR5cGVJbmZvVG9vbHRpcFxuICAgICdoYXNrZWxsLWdoYy1tb2Q6c2hvdy10eXBlLWFuZC1pbmZvJzogQHRvb2x0aXBDb21tYW5kIEB0eXBlQW5kSW5mb1Rvb2x0aXBcbiAgICAnaGFza2VsbC1naGMtbW9kOmluc2VydC10eXBlJzogQGluc2VydFR5cGVDb21tYW5kXG4gICAgJ2hhc2tlbGwtZ2hjLW1vZDppbnNlcnQtaW1wb3J0JzogQGluc2VydEltcG9ydENvbW1hbmRcblxuICBjb250ZXh0TWVudTpcbiAgICBsYWJlbDogJ2doYy1tb2QnXG4gICAgc3VibWVudTpcbiAgICAgIFtcbiAgICAgICAge2xhYmVsOiAnU2hvdyBUeXBlJywgY29tbWFuZDogJ2hhc2tlbGwtZ2hjLW1vZDpzaG93LXR5cGUnfVxuICAgICAgICB7bGFiZWw6ICdTaG93IEluZm8nLCBjb21tYW5kOiAnaGFza2VsbC1naGMtbW9kOnNob3ctaW5mbyd9XG4gICAgICAgIHtsYWJlbDogJ1Nob3cgVHlwZSBBbmQgSW5mbycsIGNvbW1hbmQ6ICdoYXNrZWxsLWdoYy1tb2Q6c2hvdy10eXBlLWFuZC1pbmZvJ31cbiAgICAgICAge2xhYmVsOiAnQ2FzZSBTcGxpdCcsIGNvbW1hbmQ6ICdoYXNrZWxsLWdoYy1tb2Q6Y2FzZS1zcGxpdCd9XG4gICAgICAgIHtsYWJlbDogJ1NpZyBGaWxsJywgY29tbWFuZDogJ2hhc2tlbGwtZ2hjLW1vZDpzaWctZmlsbCd9XG4gICAgICAgIHtsYWJlbDogJ0luc2VydCBUeXBlJywgY29tbWFuZDogJ2hhc2tlbGwtZ2hjLW1vZDppbnNlcnQtdHlwZSd9XG4gICAgICAgIHtsYWJlbDogJ0luc2VydCBJbXBvcnQnLCBjb21tYW5kOiAnaGFza2VsbC1naGMtbW9kOmluc2VydC1pbXBvcnQnfVxuICAgICAgICB7bGFiZWw6ICdHbyBUbyBEZWNsYXJhdGlvbicsIGNvbW1hbmQ6ICdoYXNrZWxsLWdoYy1tb2Q6Z28tdG8tZGVjbGFyYXRpb24nfVxuICAgICAgXVxuXG4gIHVwaTogbnVsbFxuICBwcm9jZXNzOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChzZXJ2aWNlLCBAcHJvY2VzcykgLT5cbiAgICBAdXBpID0gc2VydmljZS5yZWdpc3RlclBsdWdpbiBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEB1cGkuc2V0TWVzc2FnZVR5cGVzIEBtZXNzYWdlVHlwZXNcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgQGNvbnRleHRTY29wZSwgQGNvbnRleHRDb21tYW5kcygpXG5cbiAgICBAdXBpLm9uU2hvdWxkU2hvd1Rvb2x0aXAgQHNob3VsZFNob3dUb29sdGlwXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBwcm9jZXNzLm9uQmFja2VuZEFjdGl2ZSA9PlxuICAgICAgQHVwaS5zZXRTdGF0dXMgc3RhdHVzOiAncHJvZ3Jlc3MnXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBwcm9jZXNzLm9uQmFja2VuZElkbGUgPT5cbiAgICAgIEB1cGkuc2V0U3RhdHVzIHN0YXR1czogJ3JlYWR5J1xuXG4gICAgY20gPSB7fVxuICAgIGNtW0Bjb250ZXh0U2NvcGVdID0gW0Bjb250ZXh0TWVudV1cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29udGV4dE1lbnUuYWRkIGNtXG5cbiAgICB1bmxlc3MgYXRvbS5jb25maWcuZ2V0ICdoYXNrZWxsLWdoYy1tb2QudXNlTGludGVyJ1xuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCBAY29udGV4dFNjb3BlLCBAZ2xvYmFsQ29tbWFuZHMoKVxuICAgICAgQHVwaS5zZXRNZW51ICdnaGMtbW9kJywgQG1haW5NZW51XG4gICAgICBAZGlzcG9zYWJsZXMuYWRkIEB1cGkub25EaWRTYXZlQnVmZmVyIChidWZmZXIpID0+XG4gICAgICAgIEBjaGVja0xpbnQgYnVmZmVyLCAnU2F2ZSdcbiAgICAgIEBkaXNwb3NhYmxlcy5hZGQgQHVwaS5vbkRpZFN0b3BDaGFuZ2luZyAoYnVmZmVyKSA9PlxuICAgICAgICBAY2hlY2tMaW50IGJ1ZmZlciwgJ0NoYW5nZScsIHRydWVcbiAgICBlbHNlXG4gICAgICBAdXBpLnNldE1lbnUgJ2doYy1tb2QnLCBbXG4gICAgICAgIHtsYWJlbDogJ0NoZWNrJywgY29tbWFuZDogJ2xpbnRlcjpsaW50J31cbiAgICAgIF1cblxuICAgIEB1cGkuc2V0TWVudSAnZ2hjLW1vZCcsIFtcbiAgICAgIHtsYWJlbDogJ1N0b3AgQmFja2VuZCcsIGNvbW1hbmQ6ICdoYXNrZWxsLWdoYy1tb2Q6c2h1dGRvd24tYmFja2VuZCd9XG4gICAgXVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuICAgIEB1cGkgPSBudWxsXG4gICAgQHByb2Nlc3MgPSBudWxsXG5cbiAgc2hvdWxkU2hvd1Rvb2x0aXA6IChlZGl0b3IsIGNyYW5nZSwgdHlwZSkgPT5cbiAgICBzd2l0Y2ggdHlwZVxuICAgICAgd2hlbiAnbW91c2UnLCB1bmRlZmluZWRcbiAgICAgICAgaWYgdCA9IGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1naGMtbW9kLm9uTW91c2VIb3ZlclNob3cnKVxuICAgICAgICAgIEBbXCIje3R9VG9vbHRpcFwiXSBlZGl0b3IsIGNyYW5nZVxuICAgICAgd2hlbiAnc2VsZWN0aW9uJ1xuICAgICAgICBpZiB0ID0gYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWdoYy1tb2Qub25TZWxlY3Rpb25TaG93JylcbiAgICAgICAgICBAW1wiI3t0fVRvb2x0aXBcIl0gZWRpdG9yLCBjcmFuZ2VcblxuICBjaGVja0NvbW1hbmQ6ICh7Y3VycmVudFRhcmdldH0pID0+XG4gICAgZWRpdG9yID0gY3VycmVudFRhcmdldC5nZXRNb2RlbCgpXG4gICAgQHByb2Nlc3MuZG9DaGVja0J1ZmZlcihlZGl0b3IuZ2V0QnVmZmVyKCkpLnRoZW4gKHJlcykgPT5cbiAgICAgIEBzZXRNZXNzYWdlcyByZXMsIFsnZXJyb3InLCAnd2FybmluZyddXG5cbiAgbGludENvbW1hbmQ6ICh7Y3VycmVudFRhcmdldH0pID0+XG4gICAgZWRpdG9yID0gY3VycmVudFRhcmdldC5nZXRNb2RlbCgpXG4gICAgQHByb2Nlc3MuZG9MaW50QnVmZmVyKGVkaXRvci5nZXRCdWZmZXIoKSkudGhlbiAocmVzKSA9PlxuICAgICAgQHNldE1lc3NhZ2VzIHJlcywgWydsaW50J11cblxuICB0b29sdGlwQ29tbWFuZDogKHRvb2x0aXBmdW4pID0+XG4gICAgKHtjdXJyZW50VGFyZ2V0LCBkZXRhaWx9KSA9PlxuICAgICAgQHVwaS5zaG93VG9vbHRpcFxuICAgICAgICBlZGl0b3I6IGN1cnJlbnRUYXJnZXQuZ2V0TW9kZWwoKVxuICAgICAgICBkZXRhaWw6IGRldGFpbFxuICAgICAgICB0b29sdGlwOiAoY3JhbmdlKSAtPlxuICAgICAgICAgIHRvb2x0aXBmdW4gY3VycmVudFRhcmdldC5nZXRNb2RlbCgpLCBjcmFuZ2VcblxuICBpbnNlcnRUeXBlQ29tbWFuZDogKHtjdXJyZW50VGFyZ2V0LCBkZXRhaWx9KSA9PlxuICAgIFV0aWwgPSByZXF1aXJlICcuL3V0aWwnXG4gICAgZWRpdG9yID0gY3VycmVudFRhcmdldC5nZXRNb2RlbCgpXG4gICAgQHVwaS53aXRoRXZlbnRSYW5nZSB7ZWRpdG9yLCBkZXRhaWx9LCAoe2NyYW5nZSwgcG9zfSkgPT5cbiAgICAgIEBwcm9jZXNzLmdldFR5cGVJbkJ1ZmZlcihlZGl0b3IuZ2V0QnVmZmVyKCksIGNyYW5nZSlcbiAgICAgIC50aGVuIChvKSAtPlxuICAgICAgICB7dHlwZX0gPSBvXG4gICAgICAgIHtzY29wZSwgcmFuZ2UsIHN5bWJvbH0gPSBVdGlsLmdldFN5bWJvbEF0UG9pbnQgZWRpdG9yLCBwb3NcbiAgICAgICAgaWYgZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKG8ucmFuZ2UpLm1hdGNoKC9bPV0vKT9cbiAgICAgICAgICBpbmRlbnQgPSBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoW1tvLnJhbmdlLnN0YXJ0LnJvdywgMF0sIG8ucmFuZ2Uuc3RhcnRdKVxuICAgICAgICAgIHN5bWJvbCA9IFwiKCN7c3ltYm9sfSlcIiBpZiBzY29wZSBpcyAna2V5d29yZC5vcGVyYXRvci5oYXNrZWxsJ1xuICAgICAgICAgIGJpcmRUcmFjayA9ICcnXG4gICAgICAgICAgaWYgJ21ldGEuZW1iZWRkZWQuaGFza2VsbCcgaW4gZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKHBvcykuZ2V0U2NvcGVzQXJyYXkoKVxuICAgICAgICAgICAgYmlyZFRyYWNrID0gaW5kZW50LnNsaWNlIDAsIDJcbiAgICAgICAgICAgIGluZGVudCA9IGluZGVudC5zbGljZSgyKVxuICAgICAgICAgIGlmIGluZGVudC5tYXRjaCgvXFxTLyk/XG4gICAgICAgICAgICBpbmRlbnQgPSBpbmRlbnQucmVwbGFjZSAvXFxTL2csICcgJ1xuICAgICAgICAgIGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZSBbby5yYW5nZS5zdGFydCwgby5yYW5nZS5zdGFydF0sXG4gICAgICAgICAgICBcIiN7c3ltYm9sfSA6OiAje3R5cGV9XFxuI3tiaXJkVHJhY2t9I3tpbmRlbnR9XCJcbiAgICAgICAgZWxzZSBpZiBub3Qgc2NvcGU/ICNuZWl0aGVyIG9wZXJhdG9yIG5vciBpbmZpeFxuICAgICAgICAgIGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZSBvLnJhbmdlLFxuICAgICAgICAgICAgXCIoI3tlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2Uoby5yYW5nZSl9IDo6ICN7dHlwZX0pXCJcblxuICBjYXNlU3BsaXRDb21tYW5kOiAoe2N1cnJlbnRUYXJnZXQsIGRldGFpbH0pID0+XG4gICAgZWRpdG9yID0gY3VycmVudFRhcmdldC5nZXRNb2RlbCgpXG4gICAgQHVwaS53aXRoRXZlbnRSYW5nZSB7ZWRpdG9yLCBkZXRhaWx9LCAoe2NyYW5nZX0pID0+XG4gICAgICBAcHJvY2Vzcy5kb0Nhc2VTcGxpdChlZGl0b3IuZ2V0QnVmZmVyKCksIGNyYW5nZSlcbiAgICAgIC50aGVuIChyZXMpIC0+XG4gICAgICAgIHJlcy5mb3JFYWNoICh7cmFuZ2UsIHJlcGxhY2VtZW50fSkgLT5cbiAgICAgICAgICBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UsIHJlcGxhY2VtZW50KVxuXG4gIHNpZ0ZpbGxDb21tYW5kOiAoe2N1cnJlbnRUYXJnZXQsIGRldGFpbH0pID0+XG4gICAgZWRpdG9yID0gY3VycmVudFRhcmdldC5nZXRNb2RlbCgpXG4gICAgQHVwaS53aXRoRXZlbnRSYW5nZSB7ZWRpdG9yLCBkZXRhaWx9LCAoe2NyYW5nZX0pID0+XG4gICAgICBAcHJvY2Vzcy5kb1NpZ0ZpbGwoZWRpdG9yLmdldEJ1ZmZlcigpLCBjcmFuZ2UpXG4gICAgICAudGhlbiAocmVzKSAtPlxuICAgICAgICByZXMuZm9yRWFjaCAoe3R5cGUsIHJhbmdlLCBib2R5fSkgLT5cbiAgICAgICAgICBzaWcgPSBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgICAgICAgaW5kZW50ID0gZWRpdG9yLmluZGVudExldmVsRm9yTGluZShzaWcpXG4gICAgICAgICAgcG9zID0gcmFuZ2UuZW5kXG4gICAgICAgICAgdGV4dCA9IFwiXFxuI3tib2R5fVwiXG4gICAgICAgICAgZWRpdG9yLnRyYW5zYWN0IC0+XG4gICAgICAgICAgICBpZiB0eXBlIGlzICdpbnN0YW5jZSdcbiAgICAgICAgICAgICAgaW5kZW50ICs9IDFcbiAgICAgICAgICAgICAgdW5sZXNzIHNpZy5lbmRzV2l0aCAnIHdoZXJlJ1xuICAgICAgICAgICAgICAgIGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShbcmFuZ2UuZW5kLCByYW5nZS5lbmRdLCAnIHdoZXJlJylcbiAgICAgICAgICAgIG5ld3JhbmdlID0gZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKFtwb3MsIHBvc10sIHRleHQpXG4gICAgICAgICAgICBmb3Igcm93IGluIG5ld3JhbmdlLmdldFJvd3MoKS5zbGljZSgxKVxuICAgICAgICAgICAgICBlZGl0b3Iuc2V0SW5kZW50YXRpb25Gb3JCdWZmZXJSb3cgcm93LCBpbmRlbnRcblxuICBnb1RvRGVjbENvbW1hbmQ6ICh7Y3VycmVudFRhcmdldCwgZGV0YWlsfSkgPT5cbiAgICBlZGl0b3IgPSBjdXJyZW50VGFyZ2V0LmdldE1vZGVsKClcbiAgICBAdXBpLndpdGhFdmVudFJhbmdlIHtlZGl0b3IsIGRldGFpbH0sICh7Y3JhbmdlfSkgPT5cbiAgICAgIEBwcm9jZXNzLmdldEluZm9JbkJ1ZmZlcihlZGl0b3IsIGNyYW5nZSlcbiAgICAgIC50aGVuICh7cmFuZ2UsIGluZm99KSA9PlxuICAgICAgICByZXMgPSAvLiotLSBEZWZpbmVkIGF0ICguKyk6KFxcZCspOihcXGQrKS8uZXhlYyBpbmZvXG4gICAgICAgIHJldHVybiB1bmxlc3MgcmVzP1xuICAgICAgICBbXywgZm4sIGxpbmUsIGNvbF0gPSByZXNcbiAgICAgICAgcm9vdERpciA9IEBwcm9jZXNzLmdldFJvb3REaXIoZWRpdG9yLmdldEJ1ZmZlcigpKVxuICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuICh0cnkgcm9vdERpci5nZXRGaWxlKGZuKS5nZXRQYXRoKCkgPyBmbiksXG4gICAgICAgICAgaW5pdGlhbExpbmU6IHBhcnNlSW50KGxpbmUpIC0gMVxuICAgICAgICAgIGluaXRpYWxDb2x1bW46IHBhcnNlSW50KGNvbCkgLSAxXG5cbiAgaW5zZXJ0SW1wb3J0Q29tbWFuZDogKHtjdXJyZW50VGFyZ2V0LCBkZXRhaWx9KSA9PlxuICAgIGVkaXRvciA9IGN1cnJlbnRUYXJnZXQuZ2V0TW9kZWwoKVxuICAgIGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKVxuICAgIEB1cGkud2l0aEV2ZW50UmFuZ2Uge2VkaXRvciwgZGV0YWlsfSwgKHtjcmFuZ2V9KSA9PlxuICAgICAgQHByb2Nlc3MuZmluZFN5bWJvbFByb3ZpZGVyc0luQnVmZmVyIGVkaXRvciwgY3JhbmdlXG4gICAgICAudGhlbiAobGluZXMpIC0+XG4gICAgICAgIG5ldyBJbXBvcnRMaXN0Vmlld1xuICAgICAgICAgIGl0ZW1zOiBsaW5lc1xuICAgICAgICAgIG9uQ29uZmlybWVkOiAobW9kKSAtPlxuICAgICAgICAgICAgcGlQID0gbmV3IFByb21pc2UgKHJlc29sdmUpIC0+XG4gICAgICAgICAgICAgIGJ1ZmZlci5iYWNrd2FyZHNTY2FuIC9eKFxccyopKGltcG9ydHxtb2R1bGUpLywgKHttYXRjaCwgcmFuZ2UsIHN0b3B9KSAtPlxuICAgICAgICAgICAgICAgIHJlc29sdmVcbiAgICAgICAgICAgICAgICAgIHBvczogYnVmZmVyLnJhbmdlRm9yUm93KHJhbmdlLnN0YXJ0LnJvdykuZW5kXG4gICAgICAgICAgICAgICAgICBpbmRlbnQ6XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCBtYXRjaFsyXVxuICAgICAgICAgICAgICAgICAgICAgIHdoZW4gXCJpbXBvcnRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgXCJcXG5cIiArIG1hdGNoWzFdXG4gICAgICAgICAgICAgICAgICAgICAgd2hlbiBcIm1vZHVsZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlxcblxcblwiICsgbWF0Y2hbMV1cbiAgICAgICAgICAgICAgcmVzb2x2ZVxuICAgICAgICAgICAgICAgIHBvczogYnVmZmVyLmdldEZpcnN0UG9zaXRpb24oKVxuICAgICAgICAgICAgICAgIGluZGVudDogXCJcIlxuICAgICAgICAgICAgICAgIGVuZDogXCJcXG5cIlxuICAgICAgICAgICAgcGlQLnRoZW4gKHBpKSAtPlxuICAgICAgICAgICAgICBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UgW3BpLnBvcywgcGkucG9zXSwgXCIje3BpLmluZGVudH1pbXBvcnQgI3ttb2R9I3twaS5lbmQgPyAnJ31cIlxuXG4gIHR5cGVUb29sdGlwOiAoZSwgcCkgPT5cbiAgICBAcHJvY2Vzcy5nZXRUeXBlSW5CdWZmZXIoZS5nZXRCdWZmZXIoKSwgcClcbiAgICAudGhlbiAoe3JhbmdlLCB0eXBlfSkgLT5cbiAgICAgIHJhbmdlOiByYW5nZVxuICAgICAgdGV4dDpcbiAgICAgICAgdGV4dDogdHlwZVxuICAgICAgICBoaWdobGlnaHRlcjpcbiAgICAgICAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZ2hjLW1vZC5oaWdobGlnaHRUb29sdGlwcycpXG4gICAgICAgICAgICAnaGludC50eXBlLmhhc2tlbGwnXG5cbiAgaW5mb1Rvb2x0aXA6IChlLCBwKSA9PlxuICAgIEBwcm9jZXNzLmdldEluZm9JbkJ1ZmZlcihlLCBwKVxuICAgIC50aGVuICh7cmFuZ2UsIGluZm99KSAtPlxuICAgICAgcmFuZ2U6IHJhbmdlXG4gICAgICB0ZXh0OlxuICAgICAgICB0ZXh0OiBpbmZvXG4gICAgICAgIGhpZ2hsaWdodGVyOlxuICAgICAgICAgIGlmIGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1naGMtbW9kLmhpZ2hsaWdodFRvb2x0aXBzJylcbiAgICAgICAgICAgICdzb3VyY2UuaGFza2VsbCdcblxuICBpbmZvVHlwZVRvb2x0aXA6IChlLCBwKSA9PlxuICAgIGFyZ3MgPSBhcmd1bWVudHNcbiAgICBAaW5mb1Rvb2x0aXAoZSwgcClcbiAgICAuY2F0Y2ggPT5cbiAgICAgIEB0eXBlVG9vbHRpcChlLCBwKVxuXG4gIHR5cGVJbmZvVG9vbHRpcDogKGUsIHApID0+XG4gICAgYXJncyA9IGFyZ3VtZW50c1xuICAgIEB0eXBlVG9vbHRpcChlLCBwKVxuICAgIC5jYXRjaCA9PlxuICAgICAgQGluZm9Ub29sdGlwKGUsIHApXG5cbiAgdHlwZUFuZEluZm9Ub29sdGlwOiAoZSwgcCkgPT5cbiAgICBhcmdzID0gYXJndW1lbnRzXG4gICAgdHlwZVAgPVxuICAgICAgQHR5cGVUb29sdGlwKGUsIHApLmNhdGNoIC0+IHJldHVybiBudWxsXG4gICAgaW5mb1AgPVxuICAgICAgQGluZm9Ub29sdGlwKGUsIHApLmNhdGNoIC0+IHJldHVybiBudWxsXG4gICAgUHJvbWlzZS5hbGwgW3R5cGVQLCBpbmZvUF1cbiAgICAudGhlbiAoW3R5cGUsIGluZm9dKSAtPlxuICAgICAgcmFuZ2U6XG4gICAgICAgIGlmIHR5cGU/IGFuZCBpbmZvP1xuICAgICAgICAgIHR5cGUucmFuZ2UudW5pb24oaW5mby5yYW5nZSlcbiAgICAgICAgZWxzZSBpZiB0eXBlP1xuICAgICAgICAgIHR5cGUucmFuZ2VcbiAgICAgICAgZWxzZSBpZiBpbmZvP1xuICAgICAgICAgIGluZm8ucmFuZ2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignR290IG5laXRoZXIgdHlwZSBub3IgaW5mbycpXG4gICAgICB0ZXh0OlxuICAgICAgICB0ZXh0OiBcIiN7aWYgdHlwZT8udGV4dD8udGV4dCB0aGVuICc6OiAnK3R5cGUudGV4dC50ZXh0KydcXG4nIGVsc2UgJyd9I3tpbmZvPy50ZXh0Py50ZXh0ID8gJyd9XCJcbiAgICAgICAgaGlnaGxpZ2h0ZXI6XG4gICAgICAgICAgaWYgYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWdoYy1tb2QuaGlnaGxpZ2h0VG9vbHRpcHMnKVxuICAgICAgICAgICAgJ3NvdXJjZS5oYXNrZWxsJ1xuXG4gIHNldEhpZ2hsaWdodGVyOiAtPlxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1naGMtbW9kLmhpZ2hsaWdodE1lc3NhZ2VzJylcbiAgICAgIChtKSAtPlxuICAgICAgICBtLm1lc3NhZ2U9XG4gICAgICAgICAgdGV4dDogbS5tZXNzYWdlXG4gICAgICAgICAgaGlnaGxpZ2h0ZXI6ICdoaW50Lm1lc3NhZ2UuaGFza2VsbCdcbiAgICAgICAgbVxuICAgIGVsc2VcbiAgICAgIChtKSAtPiBtXG5cbiAgc2V0TWVzc2FnZXM6IChtZXNzYWdlcywgdHlwZXMpIC0+XG4gICAgQHVwaS5zZXRNZXNzYWdlcyBtZXNzYWdlcy5tYXAoQHNldEhpZ2hsaWdodGVyKCkpLCB0eXBlc1xuXG4gIGNoZWNrTGludDogKGJ1ZmZlciwgb3B0LCBmYXN0KSAtPlxuICAgIGlmIGF0b20uY29uZmlnLmdldChcImhhc2tlbGwtZ2hjLW1vZC5vbiN7b3B0fUNoZWNrXCIpIGFuZFxuICAgICAgIGF0b20uY29uZmlnLmdldChcImhhc2tlbGwtZ2hjLW1vZC5vbiN7b3B0fUxpbnRcIilcbiAgICAgIEBwcm9jZXNzLmRvQ2hlY2tBbmRMaW50KGJ1ZmZlciwgZmFzdCkudGhlbiAocmVzKSA9PlxuICAgICAgICBAc2V0TWVzc2FnZXMgcmVzLCBbJ2Vycm9yJywgJ3dhcm5pbmcnLCAnbGludCddXG4gICAgZWxzZSBpZiBhdG9tLmNvbmZpZy5nZXQoXCJoYXNrZWxsLWdoYy1tb2Qub24je29wdH1DaGVja1wiKVxuICAgICAgQHByb2Nlc3MuZG9DaGVja0J1ZmZlcihidWZmZXIsIGZhc3QpLnRoZW4gKHJlcykgPT5cbiAgICAgICAgQHNldE1lc3NhZ2VzIHJlcywgWydlcnJvcicsICd3YXJuaW5nJ11cbiAgICBlbHNlIGlmIGF0b20uY29uZmlnLmdldChcImhhc2tlbGwtZ2hjLW1vZC5vbiN7b3B0fUxpbnRcIilcbiAgICAgIEBwcm9jZXNzLmRvTGludEJ1ZmZlcihidWZmZXIsIGZhc3QpLnRoZW4gKHJlcykgPT5cbiAgICAgICAgQHNldE1lc3NhZ2VzIHJlcywgWydsaW50J11cbiJdfQ==

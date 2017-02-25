(function() {
  var IdeHaskell;

  module.exports = IdeHaskell = {
    pluginManager: null,
    disposables: null,
    menu: null,
    config: {
      onSavePrettify: {
        type: "boolean",
        "default": false,
        description: "Run file through stylish-haskell before save",
        order: 20
      },
      switchTabOnCheck: {
        type: "boolean",
        "default": true,
        description: "Switch to error tab after file check finished",
        order: 10
      },
      expressionTypeInterval: {
        type: "integer",
        "default": 300,
        description: "Type/Info tooltip show delay, in ms",
        order: 30
      },
      onCursorMove: {
        type: 'string',
        description: 'Show check results (error, lint) description tooltips\nwhen text cursor is near marker, close open tooltips, or do\nnothing?',
        "enum": ['Show Tooltip', 'Hide Tooltip', 'Nothing'],
        "default": 'Nothing',
        order: 40
      },
      stylishHaskellPath: {
        type: "string",
        "default": 'stylish-haskell',
        description: "Path to `stylish-haskell` utility or other prettifier",
        order: 60
      },
      stylishHaskellArguments: {
        type: 'array',
        "default": [],
        description: 'Additional arguments to pass to prettifier; comma-separated',
        items: {
          type: 'string'
        },
        order: 70
      },
      cabalPath: {
        type: "string",
        "default": 'cabal',
        description: "Path to `cabal` utility, for `cabal format`",
        order: 50
      },
      startupMessageIdeBackend: {
        type: "boolean",
        "default": true,
        description: "Show info message about haskell-ide-backend service on activation",
        order: 80
      },
      panelPosition: {
        type: 'string',
        "default": 'bottom',
        description: 'Output panel position',
        "enum": ['bottom', 'left', 'top', 'right'],
        order: 41
      },
      hideParameterValues: {
        type: 'boolean',
        "default": false,
        description: 'Hide additional plugin parameter values until hovered',
        order: 12
      },
      autoHideOutput: {
        type: 'boolean',
        "default": false,
        description: 'Hide panel output when there are no new messages to show',
        order: 11
      }
    },
    cleanConfig: function() {
      ['onSaveCheck', 'onSaveLint', 'onMouseHoverShow', 'useLinter'].forEach(function(item) {
        if (atom.config.get("ide-haskell." + item) != null) {
          atom.config.set("haskell-ghc-mod." + item, atom.config.get("ide-haskell." + item));
        }
        return atom.config.unset("ide-haskell." + item);
      });
      if (atom.config.get('ide-haskell.closeTooltipsOnCursorMove')) {
        atom.config.set('ide-haskell.onCursorMove', 'Hide Tooltip');
      }
      ['useBackend', 'useBuildBackend', 'closeTooltipsOnCursorMove'].forEach(function(item) {
        return atom.config.unset("ide-haskell." + item);
      });
      return setTimeout((function() {
        var cs, newconf, serialize;
        newconf = {};
        serialize = function(obj, indent) {
          var k, v;
          if (indent == null) {
            indent = "";
          }
          return ((function() {
            var results;
            results = [];
            for (k in obj) {
              v = obj[k];
              if (typeof v === 'object') {
                results.push(indent + "'" + (k.replace(/'/g, '\\\'')) + "':\n" + (serialize(v, indent + '  ')));
              } else {
                results.push(indent + "'" + (k.replace(/'/g, '\\\'')) + "': '" + (v.replace(/'/g, '\\\'')) + "'");
              }
            }
            return results;
          })()).join('\n');
        };
        ['check-file', 'lint-file', 'show-type', 'show-info', 'show-info-fallback-to-type', 'insert-type', 'insert-import'].forEach(function(item) {
          var kbs;
          kbs = atom.keymaps.findKeyBindings({
            command: "ide-haskell:" + item
          });
          return kbs.forEach(function(arg) {
            var keystrokes, selector;
            selector = arg.selector, keystrokes = arg.keystrokes;
            if (newconf[selector] == null) {
              newconf[selector] = {};
            }
            return newconf[selector][keystrokes] = "haskell-ghc-mod:" + item;
          });
        });
        ['build', 'clean', 'test', 'set-build-target'].forEach(function(item) {
          var kbs;
          kbs = atom.keymaps.findKeyBindings({
            command: "ide-haskell:" + item
          });
          return kbs.forEach(function(arg) {
            var keystrokes, selector;
            selector = arg.selector, keystrokes = arg.keystrokes;
            if (newconf[selector] == null) {
              newconf[selector] = {};
            }
            return newconf[selector][keystrokes] = "ide-haskell-cabal:" + item;
          });
        });
        cs = serialize(newconf);
        if (cs) {
          return atom.workspace.open('ide-haskell-keymap.cson').then(function(editor) {
            return editor.setText("# This is ide-haskell system message\n# Most keybinding commands have been moved to backend packages\n# Please add the following to your keymap\n# in order to preserve existing keybindings.\n# This message won't be shown once there are no obsolete keybindings\n# anymore\n" + cs);
          });
        }
      }), 1000);
    },
    activate: function(state) {
      var CompositeDisposable, MainMenuLabel, PluginManager, prettifyFile;
      this.cleanConfig();
      atom.views.getView(atom.workspace).classList.add('ide-haskell');
      this.upiProvided = false;
      if (atom.config.get('ide-haskell.startupMessageIdeBackend')) {
        setTimeout(((function(_this) {
          return function() {
            if (!_this.upiProvided) {
              return atom.notifications.addWarning("Ide-Haskell needs backends that provide most of functionality.\nPlease refer to README for details", {
                dismissable: true
              });
            }
          };
        })(this)), 5000);
      }
      CompositeDisposable = require('atom').CompositeDisposable;
      this.disposables = new CompositeDisposable;
      PluginManager = require('./plugin-manager');
      this.pluginManager = new PluginManager(state);
      this.disposables.add(atom.commands.add('atom-workspace', {
        'ide-haskell:toggle-output': (function(_this) {
          return function() {
            return _this.pluginManager.togglePanel();
          };
        })(this)
      }));
      prettifyFile = require('./binutils/prettify').prettifyFile;
      this.disposables.add(atom.commands.add('atom-text-editor[data-grammar~="haskell"]', {
        'ide-haskell:prettify-file': function(arg) {
          var currentTarget;
          currentTarget = arg.currentTarget;
          return prettifyFile(currentTarget.getModel());
        },
        'ide-haskell:close-tooltip': (function(_this) {
          return function(arg) {
            var abortKeyBinding, currentTarget, ref;
            currentTarget = arg.currentTarget, abortKeyBinding = arg.abortKeyBinding;
            if ((ref = _this.pluginManager.controller(currentTarget.getModel())) != null ? typeof ref.hasTooltips === "function" ? ref.hasTooltips() : void 0 : void 0) {
              return _this.pluginManager.controller(currentTarget.getModel()).hideTooltip();
            } else {
              return typeof abortKeyBinding === "function" ? abortKeyBinding() : void 0;
            }
          };
        })(this),
        'ide-haskell:next-error': (function(_this) {
          return function() {
            return _this.pluginManager.nextError();
          };
        })(this),
        'ide-haskell:prev-error': (function(_this) {
          return function() {
            return _this.pluginManager.prevError();
          };
        })(this)
      }));
      this.disposables.add(atom.commands.add('atom-text-editor[data-grammar~="cabal"]', {
        'ide-haskell:prettify-file': function(arg) {
          var currentTarget;
          currentTarget = arg.currentTarget;
          return prettifyFile(currentTarget.getModel(), 'cabal');
        }
      }));
      atom.keymaps.add('ide-haskell', {
        'atom-text-editor[data-grammar~="haskell"]': {
          'escape': 'ide-haskell:close-tooltip'
        }
      });
      MainMenuLabel = require('./utils').MainMenuLabel;
      this.menu = new CompositeDisposable;
      return this.menu.add(atom.menu.add([
        {
          label: MainMenuLabel,
          submenu: [
            {
              label: 'Prettify',
              command: 'ide-haskell:prettify-file'
            }, {
              label: 'Toggle Panel',
              command: 'ide-haskell:toggle-output'
            }
          ]
        }
      ]));
    },
    deactivate: function() {
      this.pluginManager.deactivate();
      this.pluginManager = null;
      atom.keymaps.removeBindingsFromSource('ide-haskell');
      this.disposables.dispose();
      this.disposables = null;
      this.menu.dispose();
      this.menu = null;
      return atom.menu.update();
    },
    serialize: function() {
      var ref;
      return (ref = this.pluginManager) != null ? ref.serialize() : void 0;
    },
    provideUpi: function() {
      var UPI;
      this.upiProvided = true;
      UPI = require('./upi');
      return new UPI(this.pluginManager);
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvaWRlLWhhc2tlbGwuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUFpQixVQUFBLEdBQ2Y7SUFBQSxhQUFBLEVBQWUsSUFBZjtJQUNBLFdBQUEsRUFBYSxJQURiO0lBRUEsSUFBQSxFQUFNLElBRk47SUFJQSxNQUFBLEVBQ0U7TUFBQSxjQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FEVDtRQUVBLFdBQUEsRUFBYSw4Q0FGYjtRQUdBLEtBQUEsRUFBTyxFQUhQO09BREY7TUFLQSxnQkFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLElBRFQ7UUFFQSxXQUFBLEVBQWEsK0NBRmI7UUFHQSxLQUFBLEVBQU8sRUFIUDtPQU5GO01BVUEsc0JBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxHQURUO1FBRUEsV0FBQSxFQUFhLHFDQUZiO1FBR0EsS0FBQSxFQUFPLEVBSFA7T0FYRjtNQWVBLFlBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBQ0EsV0FBQSxFQUFhLDhIQURiO1FBTUEsQ0FBQSxJQUFBLENBQUEsRUFBTSxDQUFDLGNBQUQsRUFBaUIsY0FBakIsRUFBaUMsU0FBakMsQ0FOTjtRQU9BLENBQUEsT0FBQSxDQUFBLEVBQVMsU0FQVDtRQVFBLEtBQUEsRUFBTyxFQVJQO09BaEJGO01BeUJBLGtCQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sUUFBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsaUJBRFQ7UUFFQSxXQUFBLEVBQWEsdURBRmI7UUFHQSxLQUFBLEVBQU8sRUFIUDtPQTFCRjtNQThCQSx1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ID0gSWRlSGFza2VsbCA9XG4gIHBsdWdpbk1hbmFnZXI6IG51bGxcbiAgZGlzcG9zYWJsZXM6IG51bGxcbiAgbWVudTogbnVsbFxuXG4gIGNvbmZpZzpcbiAgICBvblNhdmVQcmV0dGlmeTpcbiAgICAgIHR5cGU6IFwiYm9vbGVhblwiXG4gICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgZGVzY3JpcHRpb246IFwiUnVuIGZpbGUgdGhyb3VnaCBzdHlsaXNoLWhhc2tlbGwgYmVmb3JlIHNhdmVcIlxuICAgICAgb3JkZXI6IDIwXG4gICAgc3dpdGNoVGFiT25DaGVjazpcbiAgICAgIHR5cGU6IFwiYm9vbGVhblwiXG4gICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICBkZXNjcmlwdGlvbjogXCJTd2l0Y2ggdG8gZXJyb3IgdGFiIGFmdGVyIGZpbGUgY2hlY2sgZmluaXNoZWRcIlxuICAgICAgb3JkZXI6IDEwXG4gICAgZXhwcmVzc2lvblR5cGVJbnRlcnZhbDpcbiAgICAgIHR5cGU6IFwiaW50ZWdlclwiXG4gICAgICBkZWZhdWx0OiAzMDBcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlR5cGUvSW5mbyB0b29sdGlwIHNob3cgZGVsYXksIGluIG1zXCJcbiAgICAgIG9yZGVyOiAzMFxuICAgIG9uQ3Vyc29yTW92ZTpcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZXNjcmlwdGlvbjogJycnXG4gICAgICBTaG93IGNoZWNrIHJlc3VsdHMgKGVycm9yLCBsaW50KSBkZXNjcmlwdGlvbiB0b29sdGlwc1xuICAgICAgd2hlbiB0ZXh0IGN1cnNvciBpcyBuZWFyIG1hcmtlciwgY2xvc2Ugb3BlbiB0b29sdGlwcywgb3IgZG9cbiAgICAgIG5vdGhpbmc/XG4gICAgICAnJydcbiAgICAgIGVudW06IFsnU2hvdyBUb29sdGlwJywgJ0hpZGUgVG9vbHRpcCcsICdOb3RoaW5nJ11cbiAgICAgIGRlZmF1bHQ6ICdOb3RoaW5nJ1xuICAgICAgb3JkZXI6IDQwXG4gICAgc3R5bGlzaEhhc2tlbGxQYXRoOlxuICAgICAgdHlwZTogXCJzdHJpbmdcIlxuICAgICAgZGVmYXVsdDogJ3N0eWxpc2gtaGFza2VsbCdcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlBhdGggdG8gYHN0eWxpc2gtaGFza2VsbGAgdXRpbGl0eSBvciBvdGhlciBwcmV0dGlmaWVyXCJcbiAgICAgIG9yZGVyOiA2MFxuICAgIHN0eWxpc2hIYXNrZWxsQXJndW1lbnRzOlxuICAgICAgdHlwZTogJ2FycmF5J1xuICAgICAgZGVmYXVsdDogW11cbiAgICAgIGRlc2NyaXB0aW9uOiAnQWRkaXRpb25hbCBhcmd1bWVudHMgdG8gcGFzcyB0byBwcmV0dGlmaWVyOyBjb21tYS1zZXBhcmF0ZWQnXG4gICAgICBpdGVtczpcbiAgICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIG9yZGVyOiA3MFxuICAgIGNhYmFsUGF0aDpcbiAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICAgIGRlZmF1bHQ6ICdjYWJhbCdcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlBhdGggdG8gYGNhYmFsYCB1dGlsaXR5LCBmb3IgYGNhYmFsIGZvcm1hdGBcIlxuICAgICAgb3JkZXI6IDUwXG4gICAgc3RhcnR1cE1lc3NhZ2VJZGVCYWNrZW5kOlxuICAgICAgdHlwZTogXCJib29sZWFuXCJcbiAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlNob3cgaW5mbyBtZXNzYWdlIGFib3V0IGhhc2tlbGwtaWRlLWJhY2tlbmQgc2VydmljZSBvblxuICAgICAgICAgICAgICAgICAgICBhY3RpdmF0aW9uXCJcbiAgICAgIG9yZGVyOiA4MFxuICAgIHBhbmVsUG9zaXRpb246XG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDogJ2JvdHRvbSdcbiAgICAgIGRlc2NyaXB0aW9uOiAnJydcbiAgICAgIE91dHB1dCBwYW5lbCBwb3NpdGlvblxuICAgICAgJycnXG4gICAgICBlbnVtOiBbJ2JvdHRvbScsICdsZWZ0JywgJ3RvcCcsICdyaWdodCddXG4gICAgICBvcmRlcjogNDFcbiAgICBoaWRlUGFyYW1ldGVyVmFsdWVzOlxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgZGVzY3JpcHRpb246ICcnJ1xuICAgICAgSGlkZSBhZGRpdGlvbmFsIHBsdWdpbiBwYXJhbWV0ZXIgdmFsdWVzIHVudGlsIGhvdmVyZWRcbiAgICAgICcnJ1xuICAgICAgb3JkZXI6IDEyXG4gICAgYXV0b0hpZGVPdXRwdXQ6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICBkZXNjcmlwdGlvbjogJycnXG4gICAgICBIaWRlIHBhbmVsIG91dHB1dCB3aGVuIHRoZXJlIGFyZSBubyBuZXcgbWVzc2FnZXMgdG8gc2hvd1xuICAgICAgJycnXG4gICAgICBvcmRlcjogMTFcblxuICBjbGVhbkNvbmZpZzogLT5cbiAgICBbICdvblNhdmVDaGVjaydcbiAgICAsICdvblNhdmVMaW50J1xuICAgICwgJ29uTW91c2VIb3ZlclNob3cnXG4gICAgLCAndXNlTGludGVyJ1xuICAgIF0uZm9yRWFjaCAoaXRlbSkgLT5cbiAgICAgIGlmIGF0b20uY29uZmlnLmdldChcImlkZS1oYXNrZWxsLiN7aXRlbX1cIik/XG4gICAgICAgIGF0b20uY29uZmlnLnNldCBcImhhc2tlbGwtZ2hjLW1vZC4je2l0ZW19XCIsIGF0b20uY29uZmlnLmdldCBcImlkZS1oYXNrZWxsLiN7aXRlbX1cIlxuICAgICAgYXRvbS5jb25maWcudW5zZXQgXCJpZGUtaGFza2VsbC4je2l0ZW19XCJcblxuICAgIGlmIGF0b20uY29uZmlnLmdldCAnaWRlLWhhc2tlbGwuY2xvc2VUb29sdGlwc09uQ3Vyc29yTW92ZSdcbiAgICAgIGF0b20uY29uZmlnLnNldCAnaWRlLWhhc2tlbGwub25DdXJzb3JNb3ZlJywgJ0hpZGUgVG9vbHRpcCdcblxuICAgIFsgJ3VzZUJhY2tlbmQnXG4gICAgLCAndXNlQnVpbGRCYWNrZW5kJ1xuICAgICwgJ2Nsb3NlVG9vbHRpcHNPbkN1cnNvck1vdmUnXG4gICAgXS5mb3JFYWNoIChpdGVtKSAtPlxuICAgICAgYXRvbS5jb25maWcudW5zZXQgXCJpZGUtaGFza2VsbC4je2l0ZW19XCJcblxuICAgIHNldFRpbWVvdXQgKC0+XG4gICAgICBuZXdjb25mID0ge31cblxuICAgICAgc2VyaWFsaXplID0gKG9iaiwgaW5kZW50ID0gXCJcIikgLT5cbiAgICAgICAgKGZvciBrLCB2IG9mIG9ialxuICAgICAgICAgIGlmIHR5cGVvZih2KSBpcyAnb2JqZWN0J1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICAje2luZGVudH0nI3trLnJlcGxhY2UgLycvZywgJ1xcXFxcXCcnfSc6XG4gICAgICAgICAgICAje3NlcmlhbGl6ZSh2LCBpbmRlbnQrJyAgJyl9XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgICN7aW5kZW50fScje2sucmVwbGFjZSAvJy9nLCAnXFxcXFxcJyd9JzogJyN7di5yZXBsYWNlIC8nL2csICdcXFxcXFwnJ30nXG4gICAgICAgICAgICBcIlwiXCIpLmpvaW4gJ1xcbidcblxuXG4gICAgICBbICdjaGVjay1maWxlJ1xuICAgICAgLCAnbGludC1maWxlJ1xuICAgICAgLCAnc2hvdy10eXBlJ1xuICAgICAgLCAnc2hvdy1pbmZvJ1xuICAgICAgLCAnc2hvdy1pbmZvLWZhbGxiYWNrLXRvLXR5cGUnXG4gICAgICAsICdpbnNlcnQtdHlwZSdcbiAgICAgICwgJ2luc2VydC1pbXBvcnQnXG4gICAgICBdLmZvckVhY2ggKGl0ZW0pIC0+XG4gICAgICAgIGticyA9IGF0b20ua2V5bWFwcy5maW5kS2V5QmluZGluZ3MgY29tbWFuZDogXCJpZGUtaGFza2VsbDoje2l0ZW19XCJcbiAgICAgICAga2JzLmZvckVhY2ggKHtzZWxlY3Rvciwga2V5c3Ryb2tlc30pIC0+XG4gICAgICAgICAgbmV3Y29uZltzZWxlY3Rvcl0gPz0ge31cbiAgICAgICAgICBuZXdjb25mW3NlbGVjdG9yXVtrZXlzdHJva2VzXSA9IFwiaGFza2VsbC1naGMtbW9kOiN7aXRlbX1cIlxuXG4gICAgICBbICdidWlsZCdcbiAgICAgICwgJ2NsZWFuJ1xuICAgICAgLCAndGVzdCdcbiAgICAgICwgJ3NldC1idWlsZC10YXJnZXQnXG4gICAgICBdLmZvckVhY2ggKGl0ZW0pIC0+XG4gICAgICAgIGticyA9IGF0b20ua2V5bWFwcy5maW5kS2V5QmluZGluZ3MgY29tbWFuZDogXCJpZGUtaGFza2VsbDoje2l0ZW19XCJcbiAgICAgICAga2JzLmZvckVhY2ggKHtzZWxlY3Rvciwga2V5c3Ryb2tlc30pIC0+XG4gICAgICAgICAgbmV3Y29uZltzZWxlY3Rvcl0gPz0ge31cbiAgICAgICAgICBuZXdjb25mW3NlbGVjdG9yXVtrZXlzdHJva2VzXSA9IFwiaWRlLWhhc2tlbGwtY2FiYWw6I3tpdGVtfVwiXG5cbiAgICAgIGNzID0gc2VyaWFsaXplKG5ld2NvbmYpXG4gICAgICBpZiBjc1xuICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKCdpZGUtaGFza2VsbC1rZXltYXAuY3NvbicpLnRoZW4gKGVkaXRvcikgLT5cbiAgICAgICAgICBlZGl0b3Iuc2V0VGV4dCBcIlwiXCJcbiAgICAgICAgICAjIFRoaXMgaXMgaWRlLWhhc2tlbGwgc3lzdGVtIG1lc3NhZ2VcbiAgICAgICAgICAjIE1vc3Qga2V5YmluZGluZyBjb21tYW5kcyBoYXZlIGJlZW4gbW92ZWQgdG8gYmFja2VuZCBwYWNrYWdlc1xuICAgICAgICAgICMgUGxlYXNlIGFkZCB0aGUgZm9sbG93aW5nIHRvIHlvdXIga2V5bWFwXG4gICAgICAgICAgIyBpbiBvcmRlciB0byBwcmVzZXJ2ZSBleGlzdGluZyBrZXliaW5kaW5ncy5cbiAgICAgICAgICAjIFRoaXMgbWVzc2FnZSB3b24ndCBiZSBzaG93biBvbmNlIHRoZXJlIGFyZSBubyBvYnNvbGV0ZSBrZXliaW5kaW5nc1xuICAgICAgICAgICMgYW55bW9yZVxuICAgICAgICAgICN7Y3N9XG4gICAgICAgICAgXCJcIlwiXG4gICAgICApLCAxMDAwXG5cbiAgYWN0aXZhdGU6IChzdGF0ZSkgLT5cbiAgICBAY2xlYW5Db25maWcoKVxuXG4gICAgYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKS5jbGFzc0xpc3QuYWRkICdpZGUtaGFza2VsbCdcblxuICAgIEB1cGlQcm92aWRlZCA9IGZhbHNlXG5cbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQgJ2lkZS1oYXNrZWxsLnN0YXJ0dXBNZXNzYWdlSWRlQmFja2VuZCdcbiAgICAgIHNldFRpbWVvdXQgKD0+XG4gICAgICAgIHVubGVzcyBAdXBpUHJvdmlkZWRcbiAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyBcIlwiXCJcbiAgICAgICAgICBJZGUtSGFza2VsbCBuZWVkcyBiYWNrZW5kcyB0aGF0IHByb3ZpZGUgbW9zdCBvZiBmdW5jdGlvbmFsaXR5LlxuICAgICAgICAgIFBsZWFzZSByZWZlciB0byBSRUFETUUgZm9yIGRldGFpbHNcbiAgICAgICAgICBcIlwiXCIsXG4gICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgKSwgNTAwMFxuXG4gICAge0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgUGx1Z2luTWFuYWdlciA9IHJlcXVpcmUgJy4vcGx1Z2luLW1hbmFnZXInXG4gICAgQHBsdWdpbk1hbmFnZXIgPSBuZXcgUGx1Z2luTWFuYWdlciBzdGF0ZVxuXG4gICAgIyBnbG9iYWwgY29tbWFuZHNcbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsXG4gICAgICAnaWRlLWhhc2tlbGw6dG9nZ2xlLW91dHB1dCc6ID0+XG4gICAgICAgIEBwbHVnaW5NYW5hZ2VyLnRvZ2dsZVBhbmVsKClcblxuICAgIHtwcmV0dGlmeUZpbGV9ID0gcmVxdWlyZSAnLi9iaW51dGlscy9wcmV0dGlmeSdcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgXFxcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXRleHQtZWRpdG9yW2RhdGEtZ3JhbW1hcn49XCJoYXNrZWxsXCJdJyxcbiAgICAgICAgJ2lkZS1oYXNrZWxsOnByZXR0aWZ5LWZpbGUnOiAoe2N1cnJlbnRUYXJnZXR9KSAtPlxuICAgICAgICAgIHByZXR0aWZ5RmlsZSBjdXJyZW50VGFyZ2V0LmdldE1vZGVsKClcbiAgICAgICAgJ2lkZS1oYXNrZWxsOmNsb3NlLXRvb2x0aXAnOiAoe2N1cnJlbnRUYXJnZXQsIGFib3J0S2V5QmluZGluZ30pID0+XG4gICAgICAgICAgaWYgQHBsdWdpbk1hbmFnZXIuY29udHJvbGxlcihjdXJyZW50VGFyZ2V0LmdldE1vZGVsKCkpPy5oYXNUb29sdGlwcz8oKVxuICAgICAgICAgICAgQHBsdWdpbk1hbmFnZXIuY29udHJvbGxlcihjdXJyZW50VGFyZ2V0LmdldE1vZGVsKCkpLmhpZGVUb29sdGlwKClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBhYm9ydEtleUJpbmRpbmc/KClcbiAgICAgICAgJ2lkZS1oYXNrZWxsOm5leHQtZXJyb3InOiA9PlxuICAgICAgICAgIEBwbHVnaW5NYW5hZ2VyLm5leHRFcnJvcigpXG4gICAgICAgICdpZGUtaGFza2VsbDpwcmV2LWVycm9yJzogPT5cbiAgICAgICAgICBAcGx1Z2luTWFuYWdlci5wcmV2RXJyb3IoKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBcXFxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20tdGV4dC1lZGl0b3JbZGF0YS1ncmFtbWFyfj1cImNhYmFsXCJdJyxcbiAgICAgICAgJ2lkZS1oYXNrZWxsOnByZXR0aWZ5LWZpbGUnOiAoe2N1cnJlbnRUYXJnZXR9KSAtPlxuICAgICAgICAgIHByZXR0aWZ5RmlsZSBjdXJyZW50VGFyZ2V0LmdldE1vZGVsKCksICdjYWJhbCdcblxuICAgIGF0b20ua2V5bWFwcy5hZGQgJ2lkZS1oYXNrZWxsJyxcbiAgICAgICdhdG9tLXRleHQtZWRpdG9yW2RhdGEtZ3JhbW1hcn49XCJoYXNrZWxsXCJdJzpcbiAgICAgICAgJ2VzY2FwZSc6ICdpZGUtaGFza2VsbDpjbG9zZS10b29sdGlwJ1xuXG4gICAge01haW5NZW51TGFiZWx9ID0gcmVxdWlyZSAnLi91dGlscydcbiAgICBAbWVudSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQG1lbnUuYWRkIGF0b20ubWVudS5hZGQgW1xuICAgICAgbGFiZWw6IE1haW5NZW51TGFiZWxcbiAgICAgIHN1Ym1lbnUgOiBbXG4gICAgICAgIHtsYWJlbDogJ1ByZXR0aWZ5JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsOnByZXR0aWZ5LWZpbGUnfVxuICAgICAgICB7bGFiZWw6ICdUb2dnbGUgUGFuZWwnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGw6dG9nZ2xlLW91dHB1dCd9XG4gICAgICBdXG4gICAgXVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgQHBsdWdpbk1hbmFnZXIuZGVhY3RpdmF0ZSgpXG4gICAgQHBsdWdpbk1hbmFnZXIgPSBudWxsXG5cbiAgICBhdG9tLmtleW1hcHMucmVtb3ZlQmluZGluZ3NGcm9tU291cmNlICdpZGUtaGFza2VsbCdcblxuICAgICMgY2xlYXIgY29tbWFuZHNcbiAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gICAgQGRpc3Bvc2FibGVzID0gbnVsbFxuXG4gICAgQG1lbnUuZGlzcG9zZSgpXG4gICAgQG1lbnUgPSBudWxsXG4gICAgYXRvbS5tZW51LnVwZGF0ZSgpXG5cbiAgc2VyaWFsaXplOiAtPlxuICAgIEBwbHVnaW5NYW5hZ2VyPy5zZXJpYWxpemUoKVxuXG4gIHByb3ZpZGVVcGk6IC0+XG4gICAgQHVwaVByb3ZpZGVkID0gdHJ1ZVxuICAgIFVQSSA9IHJlcXVpcmUgJy4vdXBpJ1xuICAgIG5ldyBVUEkoQHBsdWdpbk1hbmFnZXIpXG4iXX0=

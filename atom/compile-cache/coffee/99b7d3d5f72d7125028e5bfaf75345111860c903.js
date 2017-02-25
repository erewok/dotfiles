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
        description: "Run file through stylish-haskell before save"
      },
      switchTabOnCheck: {
        type: "boolean",
        "default": true,
        description: "Switch to error tab after file check finished"
      },
      expressionTypeInterval: {
        type: "integer",
        "default": 300,
        description: "Type/Info tooltip show delay, in ms"
      },
      onCursorMove: {
        type: 'string',
        description: 'Show check results (error, lint) description tooltips\nwhen text cursor is near marker, close open tooltips, or do\nnothing?',
        "enum": ['Show Tooltip', 'Hide Tooltip', 'Nothing'],
        "default": 'Nothing'
      },
      stylishHaskellPath: {
        type: "string",
        "default": 'stylish-haskell',
        description: "Path to `stylish-haskell` utility or other prettifier"
      },
      stylishHaskellArguments: {
        type: 'array',
        "default": [],
        description: 'Additional arguments to pass to prettifier; comma-separated',
        items: {
          type: 'string'
        }
      },
      cabalPath: {
        type: "string",
        "default": 'cabal',
        description: "Path to `cabal` utility, for `cabal format`"
      },
      startupMessageIdeBackend: {
        type: "boolean",
        "default": true,
        description: "Show info message about haskell-ide-backend service on activation"
      },
      panelPosition: {
        type: 'string',
        "default": 'bottom',
        description: 'Output panel position',
        "enum": ['bottom', 'left', 'top', 'right']
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
            var _results;
            _results = [];
            for (k in obj) {
              v = obj[k];
              if (typeof v === 'object') {
                _results.push("" + indent + "'" + (k.replace(/'/g, '\\\'')) + "':\n" + (serialize(v, indent + '  ')));
              } else {
                _results.push("" + indent + "'" + (k.replace(/'/g, '\\\'')) + "': '" + (v.replace(/'/g, '\\\'')) + "'");
              }
            }
            return _results;
          })()).join('\n');
        };
        ['check-file', 'lint-file', 'show-type', 'show-info', 'show-info-fallback-to-type', 'insert-type', 'insert-import'].forEach(function(item) {
          var kbs;
          kbs = atom.keymaps.findKeyBindings({
            command: "ide-haskell:" + item
          });
          return kbs.forEach(function(_arg) {
            var keystrokes, selector;
            selector = _arg.selector, keystrokes = _arg.keystrokes;
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
          return kbs.forEach(function(_arg) {
            var keystrokes, selector;
            selector = _arg.selector, keystrokes = _arg.keystrokes;
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
        'ide-haskell:prettify-file': function(_arg) {
          var target;
          target = _arg.target;
          return prettifyFile(target.getModel());
        },
        'ide-haskell:close-tooltip': (function(_this) {
          return function(_arg) {
            var abortKeyBinding, target, _ref;
            target = _arg.target, abortKeyBinding = _arg.abortKeyBinding;
            if ((_ref = _this.pluginManager.controller(target.getModel())) != null ? typeof _ref.hasTooltips === "function" ? _ref.hasTooltips() : void 0 : void 0) {
              return _this.pluginManager.controller(target.getModel()).hideTooltip();
            } else {
              return typeof abortKeyBinding === "function" ? abortKeyBinding() : void 0;
            }
          };
        })(this),
        'ide-haskell:next-error': (function(_this) {
          return function(_arg) {
            var target;
            target = _arg.target;
            return _this.pluginManager.nextError();
          };
        })(this),
        'ide-haskell:prev-error': (function(_this) {
          return function(_arg) {
            var target;
            target = _arg.target;
            return _this.pluginManager.prevError();
          };
        })(this)
      }));
      this.disposables.add(atom.commands.add('atom-text-editor[data-grammar~="cabal"]', {
        'ide-haskell:prettify-file': function(_arg) {
          var target;
          target = _arg.target;
          return prettifyFile(target.getModel(), 'cabal');
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
      var _ref;
      return (_ref = this.pluginManager) != null ? _ref.serialize() : void 0;
    },
    provideUpi: function() {
      var UPI;
      this.upiProvided = true;
      UPI = require('./upi');
      return new UPI(this.pluginManager);
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvaWRlLWhhc2tlbGwuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFBQSxNQUFBLFVBQUE7O0FBQUEsRUFBQSxNQUFNLENBQUMsT0FBUCxHQUFpQixVQUFBLEdBQ2Y7QUFBQSxJQUFBLGFBQUEsRUFBZSxJQUFmO0FBQUEsSUFDQSxXQUFBLEVBQWEsSUFEYjtBQUFBLElBRUEsSUFBQSxFQUFNLElBRk47QUFBQSxJQUlBLE1BQUEsRUFDRTtBQUFBLE1BQUEsY0FBQSxFQUNFO0FBQUEsUUFBQSxJQUFBLEVBQU0sU0FBTjtBQUFBLFFBQ0EsU0FBQSxFQUFTLEtBRFQ7QUFBQSxRQUVBLFdBQUEsRUFBYSw4Q0FGYjtPQURGO0FBQUEsTUFLQSxnQkFBQSxFQUNFO0FBQUEsUUFBQSxJQUFBLEVBQU0sU0FBTjtBQUFBLFFBQ0EsU0FBQSxFQUFTLElBRFQ7QUFBQSxRQUVBLFdBQUEsRUFBYSwrQ0FGYjtPQU5GO0FBQUEsTUFTQSxzQkFBQSxFQUNFO0FBQUEsUUFBQSxJQUFBLEVBQU0sU0FBTjtBQUFBLFFBQ0EsU0FBQSxFQUFTLEdBRFQ7QUFBQSxRQUVBLFdBQUEsRUFBYSxxQ0FGYjtPQVZGO0FBQUEsTUFhQSxZQUFBLEVBQ0U7QUFBQSxRQUFBLElBQUEsRUFBTSxRQUFOO0FBQUEsUUFDQSxXQUFBLEVBQWEsOEhBRGI7QUFBQSxRQU1BLE1BQUEsRUFBTSxDQUFDLGNBQUQsRUFBaUIsY0FBakIsRUFBaUMsU0FBakMsQ0FOTjtBQUFBLFFBT0EsU0FBQSxFQUFTLFNBUFQ7T0FkRjtBQUFBLE1Bc0JBLGtCQUFBLEVBQ0U7QUFBQSxRQUFBLElBQUEsRUFBTSxRQUFOO0FBQUEsUUFDQSxTQUFBLEVBQVMsaUJBRFQ7QUFBQSxRQUVBLFdBQUEsRUFBYSx1REFGYjtPQXZCRjtB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

//# sourceURL=/Users/erewok/.atom/packages/ide-haskell/lib/ide-haskell.coffee

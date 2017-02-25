(function() {
  var HaskellGhcMod, tooltipActions,
    __slice = [].slice;

  tooltipActions = [
    {
      value: '',
      description: 'Nothing'
    }, {
      value: 'type',
      description: 'Type'
    }, {
      value: 'info',
      description: 'Info'
    }, {
      value: 'infoType',
      description: 'Info, fallback to Type'
    }, {
      value: 'typeInfo',
      description: 'Type, fallback to Info'
    }, {
      value: 'typeAndInfo',
      description: 'Type and Info'
    }
  ];

  module.exports = HaskellGhcMod = {
    process: null,
    config: {
      ghcModPath: {
        type: 'string',
        "default": 'ghc-mod',
        description: 'Path to ghc-mod'
      },
      enableGhcModi: {
        type: 'boolean',
        "default": true,
        description: 'Using GHC Modi is suggested and noticeably faster, but if experiencing problems, disabling it can sometimes help.'
      },
      lowMemorySystem: {
        type: 'boolean',
        "default": false,
        description: 'Avoid spawning more than one ghc-mod process; also disables parallel features, which can help with weird stack errors'
      },
      debug: {
        type: 'boolean',
        "default": false
      },
      additionalPathDirectories: {
        type: 'array',
        "default": [],
        description: 'Add this directories to PATH when invoking ghc-mod. You might want to add path to a directory with ghc, cabal, etc binaries here. Separate with comma.',
        items: {
          type: 'string'
        }
      },
      cabalSandbox: {
        type: 'boolean',
        "default": true,
        description: 'Add cabal sandbox bin-path to PATH'
      },
      stackSandbox: {
        type: 'boolean',
        "default": true,
        description: 'Add stack bin-path to PATH'
      },
      initTimeout: {
        type: 'integer',
        description: 'How long to wait for initialization commands (checking GHC and ghc-mod versions, getting stack sandbox) until assuming those hanged and bailing. In seconds.',
        "default": 60,
        minimum: 1
      },
      interactiveInactivityTimeout: {
        type: 'integer',
        description: 'Kill ghc-mod interactive process (ghc-modi) after this number of minutes of inactivity to conserve memory. 0 means never.',
        "default": 60,
        minimum: 0
      },
      interactiveActionTimeout: {
        type: 'integer',
        description: 'Timeout for interactive ghc-mod commands (in seconds). 0 means wait forever.',
        "default": 300,
        minimum: 0
      },
      onSaveCheck: {
        type: "boolean",
        "default": true,
        description: "Check file on save"
      },
      onSaveLint: {
        type: "boolean",
        "default": true,
        description: "Lint file on save"
      },
      onChangeCheck: {
        type: "boolean",
        "default": false,
        description: "Check file on change"
      },
      onChangeLint: {
        type: "boolean",
        "default": false,
        description: "Lint file on change"
      },
      onMouseHoverShow: {
        type: 'string',
        description: 'Contents of tooltip on mouse hover',
        "default": 'typeAndInfo',
        "enum": tooltipActions
      },
      onSelectionShow: {
        type: 'string',
        description: 'Contents of tooltip on selection',
        "default": '',
        "enum": tooltipActions
      },
      useLinter: {
        type: 'boolean',
        "default": false,
        description: 'Use \'linter\' package instead of \'ide-haskell\' to display check and lint results (requires restart)'
      },
      maxBrowseProcesses: {
        type: 'integer',
        "default": 2,
        description: 'Maximum number of parallel ghc-mod browse processes, which are used in autocompletion backend initialization. Note that on larger projects it may require a considerable amount of memory.'
      },
      highlightTooltips: {
        type: 'boolean',
        "default": true,
        description: 'Show highlighting for type/info tooltips'
      },
      highlightMessages: {
        type: 'boolean',
        "default": true,
        description: 'Show highlighting for output panel messages'
      },
      hlintOptions: {
        type: 'array',
        "default": [],
        description: 'Command line options to pass to hlint (comma-separated)'
      },
      experimental: {
        type: 'boolean',
        "default": false,
        description: 'Enable experimentai features, which are expected to land in next release of ghc-mod. ENABLE ONLY IF YOU KNOW WHAT YOU ARE DOING'
      }
    },
    activate: function(state) {
      var CompositeDisposable, GhcModiProcess;
      GhcModiProcess = require('./ghc-mod/ghc-modi-process');
      this.process = new GhcModiProcess;
      CompositeDisposable = require('atom').CompositeDisposable;
      this.disposables = new CompositeDisposable;
      return this.disposables.add(atom.commands.add('atom-workspace', {
        'haskell-ghc-mod:shutdown-backend': (function(_this) {
          return function() {
            var _ref;
            return (_ref = _this.process) != null ? typeof _ref.killProcess === "function" ? _ref.killProcess() : void 0 : void 0;
          };
        })(this)
      }));
    },
    deactivate: function() {
      var _ref, _ref1;
      if ((_ref = this.process) != null) {
        if (typeof _ref.destroy === "function") {
          _ref.destroy();
        }
      }
      this.process = null;
      this.completionBackend = null;
      if ((_ref1 = this.disposables) != null) {
        if (typeof _ref1.dispose === "function") {
          _ref1.dispose();
        }
      }
      return this.disposables = null;
    },
    provideCompletionBackend: function() {
      var CompletionBackend;
      if (this.process == null) {
        return;
      }
      CompletionBackend = require('./completion-backend/completion-backend');
      if (this.completionBackend == null) {
        this.completionBackend = new CompletionBackend(this.process);
      }
      return this.completionBackend;
    },
    consumeUPI: function(service) {
      var Disposable, UPIConsumer, upiConsumer, upiConsumerDisp;
      if (this.process == null) {
        return;
      }
      UPIConsumer = require('./upi-consumer');
      Disposable = require('atom').Disposable;
      upiConsumer = new UPIConsumer(service, this.process);
      upiConsumerDisp = new Disposable(function() {
        return upiConsumer.destroy();
      });
      this.disposables.add(upiConsumerDisp);
      return upiConsumerDisp;
    },
    provideLinter: function() {
      if (!atom.config.get('haskell-ghc-mod.useLinter')) {
        return;
      }
      return [
        {
          func: 'doCheckBuffer',
          lintOnFly: 'onChangeCheck',
          enabledConf: 'onSaveCheck'
        }, {
          func: 'doLintBuffer',
          lintOnFly: 'onChangeLint',
          enabledConf: 'onSaveLint'
        }
      ].map((function(_this) {
        return function(_arg) {
          var enabledConf, func, lintOnFly, linter;
          func = _arg.func, lintOnFly = _arg.lintOnFly, enabledConf = _arg.enabledConf;
          linter = {
            grammarScopes: ['source.haskell', 'text.tex.latex.haskell'],
            scope: 'file',
            lintOnFly: false,
            lint: function(textEditor) {
              if (_this.process == null) {
                return;
              }
              if (!(atom.config.get("haskell-ghc-mod." + enabledConf) || atom.config.get("haskell-ghc-mod." + lintOnFly))) {
                return;
              }
              if (textEditor.isEmpty()) {
                return;
              }
              return _this.process[func](textEditor.getBuffer(), lintOnFly).then(function(res) {
                return res.map(function(_arg1) {
                  var message, messages, position, severity, uri, _ref;
                  uri = _arg1.uri, position = _arg1.position, message = _arg1.message, severity = _arg1.severity;
                  _ref = message.split(/^(?!\s)/gm), message = _ref[0], messages = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
                  return {
                    type: severity,
                    text: message.replace(/\n+$/, ''),
                    filePath: uri,
                    range: [position, position.translate([0, 1])],
                    trace: messages.map(function(text) {
                      return {
                        type: 'trace',
                        text: text.replace(/\n+$/, '')
                      };
                    })
                  };
                });
              });
            }
          };
          atom.config.observe("haskell-ghc-mod." + lintOnFly, function(value) {
            return linter.lintOnFly = value;
          });
          return linter;
        };
      })(this));
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL2hhc2tlbGwtZ2hjLW1vZC5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLE1BQUEsNkJBQUE7SUFBQSxrQkFBQTs7QUFBQSxFQUFBLGNBQUEsR0FDRTtJQUNFO0FBQUEsTUFBQyxLQUFBLEVBQU8sRUFBUjtBQUFBLE1BQVksV0FBQSxFQUFhLFNBQXpCO0tBREYsRUFFRTtBQUFBLE1BQUMsS0FBQSxFQUFPLE1BQVI7QUFBQSxNQUFnQixXQUFBLEVBQWEsTUFBN0I7S0FGRixFQUdFO0FBQUEsTUFBQyxLQUFBLEVBQU8sTUFBUjtBQUFBLE1BQWdCLFdBQUEsRUFBYSxNQUE3QjtLQUhGLEVBSUU7QUFBQSxNQUFDLEtBQUEsRUFBTyxVQUFSO0FBQUEsTUFBb0IsV0FBQSxFQUFhLHdCQUFqQztLQUpGLEVBS0U7QUFBQSxNQUFDLEtBQUEsRUFBTyxVQUFSO0FBQUEsTUFBb0IsV0FBQSxFQUFhLHdCQUFqQztLQUxGLEVBTUU7QUFBQSxNQUFDLEtBQUEsRUFBTyxhQUFSO0FBQUEsTUFBdUIsV0FBQSxFQUFhLGVBQXBDO0tBTkY7R0FERixDQUFBOztBQUFBLEVBVUEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsYUFBQSxHQUNmO0FBQUEsSUFBQSxPQUFBLEVBQVMsSUFBVDtBQUFBLElBRUEsTUFBQSxFQUNFO0FBQUEsTUFBQSxVQUFBLEVBQ0U7QUFBQSxRQUFBLElBQUEsRUFBTSxRQUFOO0FBQUEsUUFDQSxTQUFBLEVBQVMsU0FEVDtBQUFBLFFBRUEsV0FBQSxFQUFhLGlCQUZiO09BREY7QUFBQSxNQUlBLGFBQUEsRUFDRTtBQUFBLFFBQUEsSUFBQSxFQUFNLFNBQU47QUFBQSxRQUNBLFNBQUEsRUFBUyxJQURUO0FBQUEsUUFFQSxXQUFBLEVBQ0UsbUhBSEY7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

//# sourceURL=/Users/erewok/.atom/packages/haskell-ghc-mod/lib/haskell-ghc-mod.coffee

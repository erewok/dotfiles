(function() {
  var HaskellGhcMod, tooltipActions,
    slice = [].slice;

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
        description: 'Path to ghc-mod',
        order: 0
      },
      enableGhcModi: {
        type: 'boolean',
        "default": true,
        description: 'Using GHC Modi is suggested and noticeably faster, but if experiencing problems, disabling it can sometimes help.',
        order: 70
      },
      lowMemorySystem: {
        type: 'boolean',
        "default": false,
        description: 'Avoid spawning more than one ghc-mod process; also disables parallel features, which can help with weird stack errors',
        order: 70
      },
      debug: {
        type: 'boolean',
        "default": false,
        order: 999
      },
      additionalPathDirectories: {
        type: 'array',
        "default": [],
        description: 'Add this directories to PATH when invoking ghc-mod. You might want to add path to a directory with ghc, cabal, etc binaries here. Separate with comma.',
        items: {
          type: 'string'
        },
        order: 0
      },
      cabalSandbox: {
        type: 'boolean',
        "default": true,
        description: 'Add cabal sandbox bin-path to PATH',
        order: 100
      },
      stackSandbox: {
        type: 'boolean',
        "default": true,
        description: 'Add stack bin-path to PATH',
        order: 100
      },
      initTimeout: {
        type: 'integer',
        description: 'How long to wait for initialization commands (checking GHC and ghc-mod versions, getting stack sandbox) until assuming those hanged and bailing. In seconds.',
        "default": 60,
        minimum: 1,
        order: 50
      },
      interactiveInactivityTimeout: {
        type: 'integer',
        description: 'Kill ghc-mod interactive process (ghc-modi) after this number of minutes of inactivity to conserve memory. 0 means never.',
        "default": 60,
        minimum: 0,
        order: 50
      },
      interactiveActionTimeout: {
        type: 'integer',
        description: 'Timeout for interactive ghc-mod commands (in seconds). 0 means wait forever.',
        "default": 300,
        minimum: 0,
        order: 50
      },
      onSaveCheck: {
        type: "boolean",
        "default": true,
        description: "Check file on save",
        order: 25
      },
      onSaveLint: {
        type: "boolean",
        "default": true,
        description: "Lint file on save",
        order: 25
      },
      onChangeCheck: {
        type: "boolean",
        "default": false,
        description: "Check file on change",
        order: 25
      },
      onChangeLint: {
        type: "boolean",
        "default": false,
        description: "Lint file on change",
        order: 25
      },
      onMouseHoverShow: {
        type: 'string',
        description: 'Contents of tooltip on mouse hover',
        "default": 'typeAndInfo',
        "enum": tooltipActions,
        order: 30
      },
      onSelectionShow: {
        type: 'string',
        description: 'Contents of tooltip on selection',
        "default": '',
        "enum": tooltipActions,
        order: 30
      },
      useLinter: {
        type: 'boolean',
        "default": false,
        description: 'Use \'linter\' package instead of \'ide-haskell\' to display check and lint results (requires restart)',
        order: 75
      },
      maxBrowseProcesses: {
        type: 'integer',
        "default": 2,
        description: 'Maximum number of parallel ghc-mod browse processes, which are used in autocompletion backend initialization. Note that on larger projects it may require a considerable amount of memory.',
        order: 60
      },
      highlightTooltips: {
        type: 'boolean',
        "default": true,
        description: 'Show highlighting for type/info tooltips',
        order: 40
      },
      highlightMessages: {
        type: 'boolean',
        "default": true,
        description: 'Show highlighting for output panel messages',
        order: 40
      },
      hlintOptions: {
        type: 'array',
        "default": [],
        description: 'Command line options to pass to hlint (comma-separated)',
        order: 45
      },
      experimental: {
        type: 'boolean',
        "default": false,
        description: 'Enable experimentai features, which are expected to land in next release of ghc-mod. ENABLE ONLY IF YOU KNOW WHAT YOU ARE DOING',
        order: 999
      },
      suppressGhcPackagePathWarning: {
        type: 'boolean',
        "default": false,
        description: 'Suppress warning about GHC_PACKAGE_PATH environment variable. ENABLE ONLY IF YOU KNOW WHAT YOU ARE DOING.',
        order: 999
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
            var ref;
            return (ref = _this.process) != null ? typeof ref.killProcess === "function" ? ref.killProcess() : void 0 : void 0;
          };
        })(this)
      }));
    },
    deactivate: function() {
      var ref, ref1;
      if ((ref = this.process) != null) {
        if (typeof ref.destroy === "function") {
          ref.destroy();
        }
      }
      this.process = null;
      this.completionBackend = null;
      if ((ref1 = this.disposables) != null) {
        if (typeof ref1.dispose === "function") {
          ref1.dispose();
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
        return function(arg) {
          var enabledConf, func, lintOnFly, linter;
          func = arg.func, lintOnFly = arg.lintOnFly, enabledConf = arg.enabledConf;
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
                return res.map(function(arg1) {
                  var message, messages, position, ref, severity, uri;
                  uri = arg1.uri, position = arg1.position, message = arg1.message, severity = arg1.severity;
                  ref = message.split(/^(?!\s)/gm), message = ref[0], messages = 2 <= ref.length ? slice.call(ref, 1) : [];
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9oYXNrZWxsLWdoYy1tb2QvbGliL2hhc2tlbGwtZ2hjLW1vZC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDZCQUFBO0lBQUE7O0VBQUEsY0FBQSxHQUNFO0lBQ0U7TUFBQyxLQUFBLEVBQU8sRUFBUjtNQUFZLFdBQUEsRUFBYSxTQUF6QjtLQURGLEVBRUU7TUFBQyxLQUFBLEVBQU8sTUFBUjtNQUFnQixXQUFBLEVBQWEsTUFBN0I7S0FGRixFQUdFO01BQUMsS0FBQSxFQUFPLE1BQVI7TUFBZ0IsV0FBQSxFQUFhLE1BQTdCO0tBSEYsRUFJRTtNQUFDLEtBQUEsRUFBTyxVQUFSO01BQW9CLFdBQUEsRUFBYSx3QkFBakM7S0FKRixFQUtFO01BQUMsS0FBQSxFQUFPLFVBQVI7TUFBb0IsV0FBQSxFQUFhLHdCQUFqQztLQUxGLEVBTUU7TUFBQyxLQUFBLEVBQU8sYUFBUjtNQUF1QixXQUFBLEVBQWEsZUFBcEM7S0FORjs7O0VBU0YsTUFBTSxDQUFDLE9BQVAsR0FBaUIsYUFBQSxHQUNmO0lBQUEsT0FBQSxFQUFTLElBQVQ7SUFFQSxNQUFBLEVBQ0U7TUFBQSxVQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sUUFBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsU0FEVDtRQUVBLFdBQUEsRUFBYSxpQkFGYjtRQUdBLEtBQUEsRUFBTyxDQUhQO09BREY7TUFLQSxhQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFEVDtRQUVBLFdBQUEsRUFDRSxtSEFIRjtRQUtBLEtBQUEsRUFBTyxFQUxQO09BTkY7TUFZQSxlQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FEVDtRQUVBLFdBQUEsRUFDRSx1SEFIRjtRQUtBLEtBQUEsRUFBTyxF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SSxDQUFKLENBQW5CLENBQVgsQ0FKVDtvQkFLRSxLQUFBLEVBQU8sUUFBUSxDQUFDLEdBQVQsQ0FBYSxTQUFDLElBQUQ7NkJBQ2xCO3dCQUFBLElBQUEsRUFBTSxPQUFOO3dCQUNBLElBQUEsRUFBTSxJQUFJLENBQUMsT0FBTCxDQUFhLE1BQWIsRUFBcUIsRUFBckIsQ0FETjs7b0JBRGtCLENBQWIsQ0FMVDs7Z0JBRk0sQ0FBUjtjQURxRCxDQUF2RDtZQUxJLENBSE47O1VBc0JBLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBWixDQUFvQixrQkFBQSxHQUFtQixTQUF2QyxFQUFvRCxTQUFDLEtBQUQ7bUJBQ2xELE1BQU0sQ0FBQyxTQUFQLEdBQW1CO1VBRCtCLENBQXBEO0FBR0EsaUJBQU87UUEzQkg7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBUk47SUFGYSxDQW5MZjs7QUFYRiIsInNvdXJjZXNDb250ZW50IjpbInRvb2x0aXBBY3Rpb25zID1cbiAgW1xuICAgIHt2YWx1ZTogJycsIGRlc2NyaXB0aW9uOiAnTm90aGluZyd9XG4gICAge3ZhbHVlOiAndHlwZScsIGRlc2NyaXB0aW9uOiAnVHlwZSd9XG4gICAge3ZhbHVlOiAnaW5mbycsIGRlc2NyaXB0aW9uOiAnSW5mbyd9XG4gICAge3ZhbHVlOiAnaW5mb1R5cGUnLCBkZXNjcmlwdGlvbjogJ0luZm8sIGZhbGxiYWNrIHRvIFR5cGUnfVxuICAgIHt2YWx1ZTogJ3R5cGVJbmZvJywgZGVzY3JpcHRpb246ICdUeXBlLCBmYWxsYmFjayB0byBJbmZvJ31cbiAgICB7dmFsdWU6ICd0eXBlQW5kSW5mbycsIGRlc2NyaXB0aW9uOiAnVHlwZSBhbmQgSW5mbyd9XG4gIF1cblxubW9kdWxlLmV4cG9ydHMgPSBIYXNrZWxsR2hjTW9kID1cbiAgcHJvY2VzczogbnVsbFxuXG4gIGNvbmZpZzpcbiAgICBnaGNNb2RQYXRoOlxuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6ICdnaGMtbW9kJ1xuICAgICAgZGVzY3JpcHRpb246ICdQYXRoIHRvIGdoYy1tb2QnXG4gICAgICBvcmRlcjogMFxuICAgIGVuYWJsZUdoY01vZGk6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAnVXNpbmcgR0hDIE1vZGkgaXMgc3VnZ2VzdGVkIGFuZCBub3RpY2VhYmx5IGZhc3RlcixcbiAgICAgICAgIGJ1dCBpZiBleHBlcmllbmNpbmcgcHJvYmxlbXMsIGRpc2FibGluZyBpdCBjYW4gc29tZXRpbWVzIGhlbHAuJ1xuICAgICAgb3JkZXI6IDcwXG4gICAgbG93TWVtb3J5U3lzdGVtOlxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICdBdm9pZCBzcGF3bmluZyBtb3JlIHRoYW4gb25lIGdoYy1tb2QgcHJvY2VzczsgYWxzbyBkaXNhYmxlcyBwYXJhbGxlbFxuICAgICAgICBmZWF0dXJlcywgd2hpY2ggY2FuIGhlbHAgd2l0aCB3ZWlyZCBzdGFjayBlcnJvcnMnXG4gICAgICBvcmRlcjogNzBcbiAgICBkZWJ1ZzpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgIG9yZGVyOiA5OTlcbiAgICBhZGRpdGlvbmFsUGF0aERpcmVjdG9yaWVzOlxuICAgICAgdHlwZTogJ2FycmF5J1xuICAgICAgZGVmYXVsdDogW11cbiAgICAgIGRlc2NyaXB0aW9uOiAnQWRkIHRoaXMgZGlyZWN0b3JpZXMgdG8gUEFUSCB3aGVuIGludm9raW5nIGdoYy1tb2QuXG4gICAgICAgICAgICAgICAgICAgIFlvdSBtaWdodCB3YW50IHRvIGFkZCBwYXRoIHRvIGEgZGlyZWN0b3J5IHdpdGhcbiAgICAgICAgICAgICAgICAgICAgZ2hjLCBjYWJhbCwgZXRjIGJpbmFyaWVzIGhlcmUuXG4gICAgICAgICAgICAgICAgICAgIFNlcGFyYXRlIHdpdGggY29tbWEuJ1xuICAgICAgaXRlbXM6XG4gICAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBvcmRlcjogMFxuICAgIGNhYmFsU2FuZGJveDpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgZGVzY3JpcHRpb246ICdBZGQgY2FiYWwgc2FuZGJveCBiaW4tcGF0aCB0byBQQVRIJ1xuICAgICAgb3JkZXI6IDEwMFxuICAgIHN0YWNrU2FuZGJveDpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgZGVzY3JpcHRpb246ICdBZGQgc3RhY2sgYmluLXBhdGggdG8gUEFUSCdcbiAgICAgIG9yZGVyOiAxMDBcbiAgICBpbml0VGltZW91dDpcbiAgICAgIHR5cGU6ICdpbnRlZ2VyJ1xuICAgICAgZGVzY3JpcHRpb246ICdIb3cgbG9uZyB0byB3YWl0IGZvciBpbml0aWFsaXphdGlvbiBjb21tYW5kcyAoY2hlY2tpbmdcbiAgICAgICAgICAgICAgICAgICAgR0hDIGFuZCBnaGMtbW9kIHZlcnNpb25zLCBnZXR0aW5nIHN0YWNrIHNhbmRib3gpIHVudGlsXG4gICAgICAgICAgICAgICAgICAgIGFzc3VtaW5nIHRob3NlIGhhbmdlZCBhbmQgYmFpbGluZy4gSW4gc2Vjb25kcy4nXG4gICAgICBkZWZhdWx0OiA2MFxuICAgICAgbWluaW11bTogMVxuICAgICAgb3JkZXI6IDUwXG4gICAgaW50ZXJhY3RpdmVJbmFjdGl2aXR5VGltZW91dDpcbiAgICAgIHR5cGU6ICdpbnRlZ2VyJ1xuICAgICAgZGVzY3JpcHRpb246ICdLaWxsIGdoYy1tb2QgaW50ZXJhY3RpdmUgcHJvY2VzcyAoZ2hjLW1vZGkpIGFmdGVyIHRoaXNcbiAgICAgICAgICAgICAgICAgICAgbnVtYmVyIG9mIG1pbnV0ZXMgb2YgaW5hY3Rpdml0eSB0byBjb25zZXJ2ZSBtZW1vcnkuIDBcbiAgICAgICAgICAgICAgICAgICAgbWVhbnMgbmV2ZXIuJ1xuICAgICAgZGVmYXVsdDogNjBcbiAgICAgIG1pbmltdW06IDBcbiAgICAgIG9yZGVyOiA1MFxuICAgIGludGVyYWN0aXZlQWN0aW9uVGltZW91dDpcbiAgICAgIHR5cGU6ICdpbnRlZ2VyJ1xuICAgICAgZGVzY3JpcHRpb246ICdUaW1lb3V0IGZvciBpbnRlcmFjdGl2ZSBnaGMtbW9kIGNvbW1hbmRzIChpbiBzZWNvbmRzKS4gMFxuICAgICAgICAgICAgICAgICAgICBtZWFucyB3YWl0IGZvcmV2ZXIuJ1xuICAgICAgZGVmYXVsdDogMzAwXG4gICAgICBtaW5pbXVtOiAwXG4gICAgICBvcmRlcjogNTBcbiAgICBvblNhdmVDaGVjazpcbiAgICAgIHR5cGU6IFwiYm9vbGVhblwiXG4gICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICBkZXNjcmlwdGlvbjogXCJDaGVjayBmaWxlIG9uIHNhdmVcIlxuICAgICAgb3JkZXI6IDI1XG4gICAgb25TYXZlTGludDpcbiAgICAgIHR5cGU6IFwiYm9vbGVhblwiXG4gICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICBkZXNjcmlwdGlvbjogXCJMaW50IGZpbGUgb24gc2F2ZVwiXG4gICAgICBvcmRlcjogMjVcbiAgICBvbkNoYW5nZUNoZWNrOlxuICAgICAgdHlwZTogXCJib29sZWFuXCJcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICBkZXNjcmlwdGlvbjogXCJDaGVjayBmaWxlIG9uIGNoYW5nZVwiXG4gICAgICBvcmRlcjogMjVcbiAgICBvbkNoYW5nZUxpbnQ6XG4gICAgICB0eXBlOiBcImJvb2xlYW5cIlxuICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkxpbnQgZmlsZSBvbiBjaGFuZ2VcIlxuICAgICAgb3JkZXI6IDI1XG4gICAgb25Nb3VzZUhvdmVyU2hvdzpcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvbnRlbnRzIG9mIHRvb2x0aXAgb24gbW91c2UgaG92ZXInXG4gICAgICBkZWZhdWx0OiAndHlwZUFuZEluZm8nXG4gICAgICBlbnVtOiB0b29sdGlwQWN0aW9uc1xuICAgICAgb3JkZXI6IDMwXG4gICAgb25TZWxlY3Rpb25TaG93OlxuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29udGVudHMgb2YgdG9vbHRpcCBvbiBzZWxlY3Rpb24nXG4gICAgICBkZWZhdWx0OiAnJ1xuICAgICAgZW51bTogdG9vbHRpcEFjdGlvbnNcbiAgICAgIG9yZGVyOiAzMFxuICAgIHVzZUxpbnRlcjpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgIGRlc2NyaXB0aW9uOiAnVXNlIFxcJ2xpbnRlclxcJyBwYWNrYWdlIGluc3RlYWQgb2YgXFwnaWRlLWhhc2tlbGxcXCdcbiAgICAgICAgICAgICAgICAgICAgdG8gZGlzcGxheSBjaGVjayBhbmQgbGludCByZXN1bHRzXG4gICAgICAgICAgICAgICAgICAgIChyZXF1aXJlcyByZXN0YXJ0KSdcbiAgICAgIG9yZGVyOiA3NVxuICAgIG1heEJyb3dzZVByb2Nlc3NlczpcbiAgICAgIHR5cGU6ICdpbnRlZ2VyJ1xuICAgICAgZGVmYXVsdDogMlxuICAgICAgZGVzY3JpcHRpb246ICdNYXhpbXVtIG51bWJlciBvZiBwYXJhbGxlbCBnaGMtbW9kIGJyb3dzZSBwcm9jZXNzZXMsIHdoaWNoXG4gICAgICAgICAgICAgICAgICAgIGFyZSB1c2VkIGluIGF1dG9jb21wbGV0aW9uIGJhY2tlbmQgaW5pdGlhbGl6YXRpb24uXG4gICAgICAgICAgICAgICAgICAgIE5vdGUgdGhhdCBvbiBsYXJnZXIgcHJvamVjdHMgaXQgbWF5IHJlcXVpcmUgYSBjb25zaWRlcmFibGVcbiAgICAgICAgICAgICAgICAgICAgYW1vdW50IG9mIG1lbW9yeS4nXG4gICAgICBvcmRlcjogNjBcbiAgICBoaWdobGlnaHRUb29sdGlwczpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgZGVzY3JpcHRpb246ICdTaG93IGhpZ2hsaWdodGluZyBmb3IgdHlwZS9pbmZvIHRvb2x0aXBzJ1xuICAgICAgb3JkZXI6IDQwXG4gICAgaGlnaGxpZ2h0TWVzc2FnZXM6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2hvdyBoaWdobGlnaHRpbmcgZm9yIG91dHB1dCBwYW5lbCBtZXNzYWdlcydcbiAgICAgIG9yZGVyOiA0MFxuICAgIGhsaW50T3B0aW9uczpcbiAgICAgIHR5cGU6ICdhcnJheSdcbiAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvbW1hbmQgbGluZSBvcHRpb25zIHRvIHBhc3MgdG8gaGxpbnQgKGNvbW1hLXNlcGFyYXRlZCknXG4gICAgICBvcmRlcjogNDVcbiAgICBleHBlcmltZW50YWw6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICBkZXNjcmlwdGlvbjogJ0VuYWJsZSBleHBlcmltZW50YWkgZmVhdHVyZXMsIHdoaWNoIGFyZSBleHBlY3RlZCB0byBsYW5kIGluXG4gICAgICAgICAgICAgICAgICAgIG5leHQgcmVsZWFzZSBvZiBnaGMtbW9kLiBFTkFCTEUgT05MWSBJRiBZT1UgS05PVyBXSEFUIFlPVVxuICAgICAgICAgICAgICAgICAgICBBUkUgRE9JTkcnXG4gICAgICBvcmRlcjogOTk5XG4gICAgc3VwcHJlc3NHaGNQYWNrYWdlUGF0aFdhcm5pbmc6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICBkZXNjcmlwdGlvbjogJ1N1cHByZXNzIHdhcm5pbmcgYWJvdXQgR0hDX1BBQ0tBR0VfUEFUSCBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAgICAgICAgICAgICAgICAgICAgRU5BQkxFIE9OTFkgSUYgWU9VIEtOT1cgV0hBVCBZT1UgQVJFIERPSU5HLidcbiAgICAgIG9yZGVyOiA5OTlcblxuICBhY3RpdmF0ZTogKHN0YXRlKSAtPlxuICAgIEdoY01vZGlQcm9jZXNzID0gcmVxdWlyZSAnLi9naGMtbW9kL2doYy1tb2RpLXByb2Nlc3MnXG4gICAgQHByb2Nlc3MgPSBuZXcgR2hjTW9kaVByb2Nlc3NcbiAgICB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsXG4gICAgICAnaGFza2VsbC1naGMtbW9kOnNodXRkb3duLWJhY2tlbmQnOiA9PlxuICAgICAgICBAcHJvY2Vzcz8ua2lsbFByb2Nlc3M/KClcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBwcm9jZXNzPy5kZXN0cm95PygpXG4gICAgQHByb2Nlc3MgPSBudWxsXG4gICAgQGNvbXBsZXRpb25CYWNrZW5kID0gbnVsbFxuICAgIEBkaXNwb3NhYmxlcz8uZGlzcG9zZT8oKVxuICAgIEBkaXNwb3NhYmxlcyA9IG51bGxcblxuICBwcm92aWRlQ29tcGxldGlvbkJhY2tlbmQ6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAcHJvY2Vzcz9cbiAgICBDb21wbGV0aW9uQmFja2VuZCA9IHJlcXVpcmUgJy4vY29tcGxldGlvbi1iYWNrZW5kL2NvbXBsZXRpb24tYmFja2VuZCdcbiAgICBAY29tcGxldGlvbkJhY2tlbmQgPz0gbmV3IENvbXBsZXRpb25CYWNrZW5kIEBwcm9jZXNzXG4gICAgQGNvbXBsZXRpb25CYWNrZW5kXG5cbiAgY29uc3VtZVVQSTogKHNlcnZpY2UpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAcHJvY2Vzcz9cbiAgICBVUElDb25zdW1lciA9IHJlcXVpcmUgJy4vdXBpLWNvbnN1bWVyJ1xuICAgIHtEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG4gICAgdXBpQ29uc3VtZXIgPSBuZXcgVVBJQ29uc3VtZXIoc2VydmljZSwgQHByb2Nlc3MpXG4gICAgdXBpQ29uc3VtZXJEaXNwID1cbiAgICAgIG5ldyBEaXNwb3NhYmxlIC0+XG4gICAgICAgIHVwaUNvbnN1bWVyLmRlc3Ryb3koKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgdXBpQ29uc3VtZXJEaXNwXG4gICAgcmV0dXJuIHVwaUNvbnN1bWVyRGlzcFxuXG4gIHByb3ZpZGVMaW50ZXI6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBhdG9tLmNvbmZpZy5nZXQgJ2hhc2tlbGwtZ2hjLW1vZC51c2VMaW50ZXInXG4gICAgW1xuICAgICAgZnVuYzogJ2RvQ2hlY2tCdWZmZXInXG4gICAgICBsaW50T25GbHk6ICdvbkNoYW5nZUNoZWNrJ1xuICAgICAgZW5hYmxlZENvbmY6ICdvblNhdmVDaGVjaydcbiAgICAsXG4gICAgICBmdW5jOiAnZG9MaW50QnVmZmVyJ1xuICAgICAgbGludE9uRmx5OiAnb25DaGFuZ2VMaW50J1xuICAgICAgZW5hYmxlZENvbmY6ICdvblNhdmVMaW50J1xuICAgIF0ubWFwICh7ZnVuYywgbGludE9uRmx5LCBlbmFibGVkQ29uZn0pID0+XG4gICAgICBsaW50ZXIgPVxuICAgICAgZ3JhbW1hclNjb3BlczogWydzb3VyY2UuaGFza2VsbCcsICd0ZXh0LnRleC5sYXRleC5oYXNrZWxsJ11cbiAgICAgIHNjb3BlOiAnZmlsZSdcbiAgICAgIGxpbnRPbkZseTogZmFsc2VcbiAgICAgIGxpbnQ6ICh0ZXh0RWRpdG9yKSA9PlxuICAgICAgICByZXR1cm4gdW5sZXNzIEBwcm9jZXNzP1xuICAgICAgICByZXR1cm4gdW5sZXNzIGF0b20uY29uZmlnLmdldChcImhhc2tlbGwtZ2hjLW1vZC4je2VuYWJsZWRDb25mfVwiKSBvclxuICAgICAgICAgIGF0b20uY29uZmlnLmdldChcImhhc2tlbGwtZ2hjLW1vZC4je2xpbnRPbkZseX1cIilcbiAgICAgICAgcmV0dXJuIGlmIHRleHRFZGl0b3IuaXNFbXB0eSgpXG4gICAgICAgIEBwcm9jZXNzW2Z1bmNdKHRleHRFZGl0b3IuZ2V0QnVmZmVyKCksIGxpbnRPbkZseSkudGhlbiAocmVzKSAtPlxuICAgICAgICAgIHJlcy5tYXAgKHt1cmksIHBvc2l0aW9uLCBtZXNzYWdlLCBzZXZlcml0eX0pIC0+XG4gICAgICAgICAgICBbbWVzc2FnZSwgbWVzc2FnZXMuLi5dID0gbWVzc2FnZS5zcGxpdCAvXig/IVxccykvZ21cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdHlwZTogc2V2ZXJpdHlcbiAgICAgICAgICAgICAgdGV4dDogbWVzc2FnZS5yZXBsYWNlKC9cXG4rJC8sICcnKVxuICAgICAgICAgICAgICBmaWxlUGF0aDogdXJpXG4gICAgICAgICAgICAgIHJhbmdlOiBbcG9zaXRpb24sIHBvc2l0aW9uLnRyYW5zbGF0ZSBbMCwgMV1dXG4gICAgICAgICAgICAgIHRyYWNlOiBtZXNzYWdlcy5tYXAgKHRleHQpIC0+XG4gICAgICAgICAgICAgICAgdHlwZTogJ3RyYWNlJ1xuICAgICAgICAgICAgICAgIHRleHQ6IHRleHQucmVwbGFjZSgvXFxuKyQvLCAnJylcbiAgICAgICAgICAgIH1cblxuICAgICAgIyBUT0RPOiBSZXdyaXRlIHRoaXMgaG9ycmlibGVuZXNzXG4gICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlIFwiaGFza2VsbC1naGMtbW9kLiN7bGludE9uRmx5fVwiLCAodmFsdWUpIC0+XG4gICAgICAgIGxpbnRlci5saW50T25GbHkgPSB2YWx1ZVxuXG4gICAgICByZXR1cm4gbGludGVyXG4iXX0=

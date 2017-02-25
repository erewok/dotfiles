(function() {
  var AutocompleteHaskell, BackendHelper, CompositeDisposable, LastSuggestionView, SuggestionBuilder;

  CompositeDisposable = require('atom').CompositeDisposable;

  SuggestionBuilder = require('./suggestion-builder');

  BackendHelper = require('atom-backend-helper');

  LastSuggestionView = require('./last-suggestion-view');

  module.exports = AutocompleteHaskell = {
    config: {
      completionBackendInfo: {
        type: "boolean",
        "default": true,
        description: "Show info message about haskell-completion-backend service on activation"
      },
      useBackend: {
        type: "string",
        "default": '',
        description: 'Name of backend to use. Leave empty for any. Consult backend provider documentation for name.'
      },
      ingoreMinimumWordLengthForHoleCompletions: {
        type: 'boolean',
        "default": 'true',
        description: 'If enabled, hole completions will be shown on \'_\' keystroke. Otherwise, only when there is a prefix, e.g. \'_something\''
      },
      defaultHintPanelVisibility: {
        type: 'string',
        "default": 'Visible',
        "enum": ['Visible', 'Hidden']
      },
      hideHintPanelIfEmpty: {
        type: 'boolean',
        "default": false,
        description: 'Hide hint panel if it\'s empty. Also enables \'escape\' key\nto hide it.'
      }
    },
    backend: null,
    disposables: null,
    backendHelperDisp: null,
    activate: function(state) {
      var ref;
      this.backendHelper = new BackendHelper('autocomplete-haskell', {
        main: AutocompleteHaskell,
        backendInfo: 'completionBackendInfo',
        backendName: 'haskell-completion-backend'
      });
      this.backendHelper.init();
      this.disposables = new CompositeDisposable;
      this.globalDisposables = new CompositeDisposable;
      this.globalDisposables.add(this.disposables);
      if ((ref = state.panelVisible) != null ? ref : atom.config.get('autocomplete-haskell.defaultHintPanelVisibility') === 'Visible') {
        this.createPanel();
      }
      this.globalDisposables.add(atom.config.observe('autocomplete-haskell.hideHintPanelIfEmpty', (function(_this) {
        return function(val) {
          if (_this.panel != null) {
            if (val) {
              if (_this.view.getText()) {
                return _this.panel.show();
              } else {
                return _this.panel.hide();
              }
            } else {
              return _this.panel.show();
            }
          }
        };
      })(this)));
      atom.keymaps.add('autocomplete-haskell', {
        'atom-text-editor[data-grammar~="haskell"]': {
          'escape': 'autocomplete-haskell:conceal-hint-panel'
        }
      });
      this.globalDisposables.add(atom.commands.add('atom-text-editor[data-grammar~="haskell"]', {
        'autocomplete-haskell:conceal-hint-panel': (function(_this) {
          return function(arg) {
            var abortKeyBinding, currentTarget, ref1;
            currentTarget = arg.currentTarget, abortKeyBinding = arg.abortKeyBinding;
            if (((ref1 = _this.panel) != null ? typeof ref1.isVisible === "function" ? ref1.isVisible() : void 0 : void 0) && atom.config.get('autocomplete-haskell.hideHintPanelIfEmpty')) {
              return _this.panel.hide();
            } else {
              return typeof abortKeyBinding === "function" ? abortKeyBinding() : void 0;
            }
          };
        })(this)
      }));
      this.globalDisposables.add(atom.commands.add('atom-workspace', {
        'autocomplete-haskell:toggle-completion-hint': (function(_this) {
          return function() {
            if (_this.panel != null) {
              return _this.destroyPanel();
            } else {
              return _this.createPanel();
            }
          };
        })(this)
      }));
      return this.globalDisposables.add(atom.menu.add([
        {
          'label': 'Haskell IDE',
          'submenu': [
            {
              'label': 'Toggle Completion Hint Panel',
              'command': 'autocomplete-haskell:toggle-completion-hint'
            }
          ]
        }
      ]));
    },
    serialize: function() {
      return {
        panelVisible: this.panel != null
      };
    },
    deactivate: function() {
      var ref;
      if ((ref = this.backendHelperDisp) != null) {
        ref.dispose();
      }
      this.globalDisposables.dispose();
      atom.keymaps.removeBindingsFromSource('autocomplete-haskell');
      this.disposables = null;
      this.globalDisposables = null;
      this.backendHelper = null;
      return this.destroyPanel();
    },
    createPanel: function() {
      return this.panel = atom.workspace.addBottomPanel({
        item: this.view = new LastSuggestionView,
        visible: true,
        priority: 200
      });
    },
    destroyPanel: function() {
      this.panel.destroy();
      this.panel = null;
      return this.view = null;
    },
    autocompleteProvider_2_0_0: function() {
      return {
        selector: '.source.haskell',
        disableForSelector: '.source.haskell .comment',
        inclusionPriority: 0,
        getSuggestions: (function(_this) {
          return function(options) {
            if (_this.backend == null) {
              return [];
            }
            return (new SuggestionBuilder(options, _this.backend)).getSuggestions();
          };
        })(this),
        onDidInsertSuggestion: (function(_this) {
          return function(arg) {
            var editor, suggestion, triggerPosition;
            editor = arg.editor, triggerPosition = arg.triggerPosition, suggestion = arg.suggestion;
            if (_this.view != null) {
              if ((suggestion != null ? suggestion.description : void 0) != null) {
                _this.view.setText("" + suggestion.description);
                if (atom.config.get('autocomplete-haskell.hideHintPanelIfEmpty')) {
                  return _this.panel.show();
                }
              } else {
                _this.view.setText('');
                if (atom.config.get('autocomplete-haskell.hideHintPanelIfEmpty')) {
                  return _this.panel.hide();
                }
              }
            }
          };
        })(this)
      };
    },
    consumeCompBack: function(service) {
      return this.backendHelperDisp = this.backendHelper.consume(service, {
        success: (function(_this) {
          return function() {
            return _this.disposables.add(atom.workspace.observeTextEditors(function(editor) {
              if (editor.getGrammar().scopeName !== "source.haskell") {
                return;
              }
              return _this.disposables.add(service.registerCompletionBuffer(editor.getBuffer()));
            }));
          };
        })(this),
        dispose: (function(_this) {
          return function() {
            _this.disposables.dispose();
            _this.disposables = new CompositeDisposable;
            return _this.globalDisposables.add(_this.disposables);
          };
        })(this)
      });
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9hdXRvY29tcGxldGUtaGFza2VsbC9saWIvYXV0b2NvbXBsZXRlLWhhc2tlbGwuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLGlCQUFBLEdBQW9CLE9BQUEsQ0FBUSxzQkFBUjs7RUFDcEIsYUFBQSxHQUFnQixPQUFBLENBQVEscUJBQVI7O0VBQ2hCLGtCQUFBLEdBQXFCLE9BQUEsQ0FBUSx3QkFBUjs7RUFFckIsTUFBTSxDQUFDLE9BQVAsR0FBaUIsbUJBQUEsR0FDZjtJQUFBLE1BQUEsRUFDRTtNQUFBLHFCQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFEVDtRQUVBLFdBQUEsRUFBYSwwRUFGYjtPQURGO01BS0EsVUFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFFBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEVBRFQ7UUFFQSxXQUFBLEVBQWEsK0ZBRmI7T0FORjtNQVVBLHlDQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsTUFEVDtRQUVBLFdBQUEsRUFBYSw0SEFGYjtPQVhGO01BZUEsMEJBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxTQURUO1FBRUEsQ0FBQSxJQUFBLENBQUEsRUFBTSxDQUFDLFNBQUQsRUFBWSxRQUFaLENBRk47T0FoQkY7TUFtQkEsb0JBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQURUO1FBRUEsV0FBQSxFQUFhLDBFQUZiO09BcEJGO0tBREY7SUE0QkEsT0FBQSxFQUFTLElBNUJUO0lBNkJBLFdBQUEsRUFBYSxJQTdCYjtJ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Q0FBQyxPQUFiLENBQUE7WUFDQSxLQUFDLENBQUEsV0FBRCxHQUFlLElBQUk7bUJBQ25CLEtBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxHQUFuQixDQUF1QixLQUFDLENBQUEsV0FBeEI7VUFITztRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FKVDtPQURtQjtJQUROLENBaElqQjs7QUFORiIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5TdWdnZXN0aW9uQnVpbGRlciA9IHJlcXVpcmUgJy4vc3VnZ2VzdGlvbi1idWlsZGVyJ1xuQmFja2VuZEhlbHBlciA9IHJlcXVpcmUgJ2F0b20tYmFja2VuZC1oZWxwZXInXG5MYXN0U3VnZ2VzdGlvblZpZXcgPSByZXF1aXJlICcuL2xhc3Qtc3VnZ2VzdGlvbi12aWV3J1xuXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9jb21wbGV0ZUhhc2tlbGwgPVxuICBjb25maWc6XG4gICAgY29tcGxldGlvbkJhY2tlbmRJbmZvOlxuICAgICAgdHlwZTogXCJib29sZWFuXCJcbiAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlNob3cgaW5mbyBtZXNzYWdlIGFib3V0IGhhc2tlbGwtY29tcGxldGlvbi1iYWNrZW5kIHNlcnZpY2VcbiAgICAgICAgICAgICAgICAgICAgb24gYWN0aXZhdGlvblwiXG4gICAgdXNlQmFja2VuZDpcbiAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICBkZXNjcmlwdGlvbjogJ05hbWUgb2YgYmFja2VuZCB0byB1c2UuIExlYXZlIGVtcHR5IGZvciBhbnkuIENvbnN1bHRcbiAgICAgICAgICAgICAgICAgICAgYmFja2VuZCBwcm92aWRlciBkb2N1bWVudGF0aW9uIGZvciBuYW1lLidcbiAgICBpbmdvcmVNaW5pbXVtV29yZExlbmd0aEZvckhvbGVDb21wbGV0aW9uczpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogJ3RydWUnXG4gICAgICBkZXNjcmlwdGlvbjogJ0lmIGVuYWJsZWQsIGhvbGUgY29tcGxldGlvbnMgd2lsbCBiZSBzaG93biBvbiBcXCdfXFwnIGtleXN0cm9rZS5cbiAgICAgICAgICAgICAgICAgICAgT3RoZXJ3aXNlLCBvbmx5IHdoZW4gdGhlcmUgaXMgYSBwcmVmaXgsIGUuZy4gXFwnX3NvbWV0aGluZ1xcJydcbiAgICBkZWZhdWx0SGludFBhbmVsVmlzaWJpbGl0eTpcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiAnVmlzaWJsZSdcbiAgICAgIGVudW06IFsnVmlzaWJsZScsICdIaWRkZW4nXVxuICAgIGhpZGVIaW50UGFuZWxJZkVtcHR5OlxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgZGVzY3JpcHRpb246ICcnJ1xuICAgICAgSGlkZSBoaW50IHBhbmVsIGlmIGl0J3MgZW1wdHkuIEFsc28gZW5hYmxlcyAnZXNjYXBlJyBrZXlcbiAgICAgIHRvIGhpZGUgaXQuXG4gICAgICAnJydcblxuICBiYWNrZW5kOiBudWxsXG4gIGRpc3Bvc2FibGVzOiBudWxsXG4gIGJhY2tlbmRIZWxwZXJEaXNwOiBudWxsXG5cbiAgYWN0aXZhdGU6IChzdGF0ZSkgLT5cbiAgICBAYmFja2VuZEhlbHBlciA9IG5ldyBCYWNrZW5kSGVscGVyICdhdXRvY29tcGxldGUtaGFza2VsbCcsXG4gICAgICBtYWluOiBBdXRvY29tcGxldGVIYXNrZWxsXG4gICAgICBiYWNrZW5kSW5mbzogJ2NvbXBsZXRpb25CYWNrZW5kSW5mbydcbiAgICAgIGJhY2tlbmROYW1lOiAnaGFza2VsbC1jb21wbGV0aW9uLWJhY2tlbmQnXG5cbiAgICBAYmFja2VuZEhlbHBlci5pbml0KClcblxuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGdsb2JhbERpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAZ2xvYmFsRGlzcG9zYWJsZXMuYWRkIEBkaXNwb3NhYmxlc1xuXG4gICAgaWYgc3RhdGUucGFuZWxWaXNpYmxlID8gKGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLWhhc2tlbGwuZGVmYXVsdEhpbnRQYW5lbFZpc2liaWxpdHknKSBpcyAnVmlzaWJsZScpXG4gICAgICBAY3JlYXRlUGFuZWwoKVxuXG4gICAgQGdsb2JhbERpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdhdXRvY29tcGxldGUtaGFza2VsbC5oaWRlSGludFBhbmVsSWZFbXB0eScsICh2YWwpID0+XG4gICAgICBpZiBAcGFuZWw/XG4gICAgICAgIGlmIHZhbFxuICAgICAgICAgIGlmIEB2aWV3LmdldFRleHQoKVxuICAgICAgICAgICAgQHBhbmVsLnNob3coKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBwYW5lbC5oaWRlKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBwYW5lbC5zaG93KClcblxuICAgIGF0b20ua2V5bWFwcy5hZGQgJ2F1dG9jb21wbGV0ZS1oYXNrZWxsJyxcbiAgICAgICdhdG9tLXRleHQtZWRpdG9yW2RhdGEtZ3JhbW1hcn49XCJoYXNrZWxsXCJdJzpcbiAgICAgICAgJ2VzY2FwZSc6ICdhdXRvY29tcGxldGUtaGFza2VsbDpjb25jZWFsLWhpbnQtcGFuZWwnXG5cbiAgICBAZ2xvYmFsRGlzcG9zYWJsZXMuYWRkIFxcXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS10ZXh0LWVkaXRvcltkYXRhLWdyYW1tYXJ+PVwiaGFza2VsbFwiXScsXG4gICAgICAgICdhdXRvY29tcGxldGUtaGFza2VsbDpjb25jZWFsLWhpbnQtcGFuZWwnOiAoe2N1cnJlbnRUYXJnZXQsIGFib3J0S2V5QmluZGluZ30pID0+XG4gICAgICAgICAgaWYgQHBhbmVsPy5pc1Zpc2libGU/KCkgYW5kIGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLWhhc2tlbGwuaGlkZUhpbnRQYW5lbElmRW1wdHknKVxuICAgICAgICAgICAgQHBhbmVsLmhpZGUoKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGFib3J0S2V5QmluZGluZz8oKVxuXG4gICAgQGdsb2JhbERpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLFxuICAgICAgJ2F1dG9jb21wbGV0ZS1oYXNrZWxsOnRvZ2dsZS1jb21wbGV0aW9uLWhpbnQnOiA9PlxuICAgICAgICBpZiBAcGFuZWw/XG4gICAgICAgICAgQGRlc3Ryb3lQYW5lbCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAY3JlYXRlUGFuZWwoKVxuXG4gICAgQGdsb2JhbERpc3Bvc2FibGVzLmFkZCBhdG9tLm1lbnUuYWRkIFtcbiAgICAgICAgJ2xhYmVsJzogJ0hhc2tlbGwgSURFJ1xuICAgICAgICAnc3VibWVudSc6IFtcbiAgICAgICAgICAjICdsYWJlbCc6ICdBdXRvY29tcGxldGUgSGFza2VsbCdcbiAgICAgICAgICAjICdzdWJtZW51JzogW1xuICAgICAgICAgICAgICAnbGFiZWwnOiAnVG9nZ2xlIENvbXBsZXRpb24gSGludCBQYW5lbCdcbiAgICAgICAgICAgICAgJ2NvbW1hbmQnOiAnYXV0b2NvbXBsZXRlLWhhc2tlbGw6dG9nZ2xlLWNvbXBsZXRpb24taGludCdcbiAgICAgICAgICAjIF1cbiAgICAgICAgXVxuICAgIF1cblxuICBzZXJpYWxpemU6IC0+XG4gICAgcGFuZWxWaXNpYmxlOiBAcGFuZWw/XG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAYmFja2VuZEhlbHBlckRpc3A/LmRpc3Bvc2UoKVxuICAgIEBnbG9iYWxEaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBhdG9tLmtleW1hcHMucmVtb3ZlQmluZGluZ3NGcm9tU291cmNlICdhdXRvY29tcGxldGUtaGFza2VsbCdcbiAgICBAZGlzcG9zYWJsZXMgPSBudWxsXG4gICAgQGdsb2JhbERpc3Bvc2FibGVzID0gbnVsbFxuICAgIEBiYWNrZW5kSGVscGVyID0gbnVsbFxuICAgIEBkZXN0cm95UGFuZWwoKVxuXG4gIGNyZWF0ZVBhbmVsOiAtPlxuICAgIEBwYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZEJvdHRvbVBhbmVsXG4gICAgICBpdGVtOiBAdmlldyA9IG5ldyBMYXN0U3VnZ2VzdGlvblZpZXdcbiAgICAgIHZpc2libGU6IHRydWVcbiAgICAgIHByaW9yaXR5OiAyMDBcblxuICBkZXN0cm95UGFuZWw6IC0+XG4gICAgQHBhbmVsLmRlc3Ryb3koKVxuICAgIEBwYW5lbCA9IG51bGxcbiAgICBAdmlldyA9IG51bGxcblxuICBhdXRvY29tcGxldGVQcm92aWRlcl8yXzBfMDogLT5cbiAgICBzZWxlY3RvcjogJy5zb3VyY2UuaGFza2VsbCdcbiAgICBkaXNhYmxlRm9yU2VsZWN0b3I6ICcuc291cmNlLmhhc2tlbGwgLmNvbW1lbnQnXG4gICAgaW5jbHVzaW9uUHJpb3JpdHk6IDBcbiAgICBnZXRTdWdnZXN0aW9uczogKG9wdGlvbnMpID0+XG4gICAgICByZXR1cm4gW10gdW5sZXNzIEBiYWNrZW5kP1xuICAgICAgKG5ldyBTdWdnZXN0aW9uQnVpbGRlciBvcHRpb25zLCBAYmFja2VuZCkuZ2V0U3VnZ2VzdGlvbnMoKVxuICAgIG9uRGlkSW5zZXJ0U3VnZ2VzdGlvbjogKHtlZGl0b3IsIHRyaWdnZXJQb3NpdGlvbiwgc3VnZ2VzdGlvbn0pID0+XG4gICAgICBpZiBAdmlldz9cbiAgICAgICAgaWYgc3VnZ2VzdGlvbj8uZGVzY3JpcHRpb24/XG4gICAgICAgICAgQHZpZXcuc2V0VGV4dCBcIiN7c3VnZ2VzdGlvbi5kZXNjcmlwdGlvbn1cIlxuICAgICAgICAgIGlmIGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLWhhc2tlbGwuaGlkZUhpbnRQYW5lbElmRW1wdHknKVxuICAgICAgICAgICAgQHBhbmVsLnNob3coKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHZpZXcuc2V0VGV4dCAnJ1xuICAgICAgICAgIGlmIGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLWhhc2tlbGwuaGlkZUhpbnRQYW5lbElmRW1wdHknKVxuICAgICAgICAgICAgQHBhbmVsLmhpZGUoKVxuXG4gIGNvbnN1bWVDb21wQmFjazogKHNlcnZpY2UpIC0+XG4gICAgQGJhY2tlbmRIZWxwZXJEaXNwID0gQGJhY2tlbmRIZWxwZXIuY29uc3VtZSBzZXJ2aWNlLFxuICAgICAgc3VjY2VzczogPT5cbiAgICAgICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgKGVkaXRvcikgPT5cbiAgICAgICAgICByZXR1cm4gdW5sZXNzIGVkaXRvci5nZXRHcmFtbWFyKCkuc2NvcGVOYW1lID09IFwic291cmNlLmhhc2tlbGxcIlxuICAgICAgICAgIEBkaXNwb3NhYmxlcy5hZGQgc2VydmljZS5yZWdpc3RlckNvbXBsZXRpb25CdWZmZXIgZWRpdG9yLmdldEJ1ZmZlcigpXG4gICAgICBkaXNwb3NlOiA9PlxuICAgICAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gICAgICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgICAgIEBnbG9iYWxEaXNwb3NhYmxlcy5hZGQgQGRpc3Bvc2FibGVzXG4iXX0=

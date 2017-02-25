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
      }
    },
    backend: null,
    disposables: null,
    backendHelperDisp: null,
    activate: function(state) {
      this.backendHelper = new BackendHelper('autocomplete-haskell', {
        main: AutocompleteHaskell,
        backendInfo: 'completionBackendInfo',
        backendName: 'haskell-completion-backend'
      });
      this.backendHelper.init();
      this.disposables = new CompositeDisposable;
      this.globalDisposables = new CompositeDisposable;
      this.globalDisposables.add(this.disposables);
      this.globalDisposables.add(atom.packages.onDidActivatePackage((function(_this) {
        return function(p) {
          var _ref;
          if (p.name !== 'autocomplete-haskell') {
            return;
          }
          return _this.panel = atom.workspace.addBottomPanel({
            item: _this.view = new LastSuggestionView,
            visible: (_ref = state.panelVisible) != null ? _ref : atom.config.get('autocomplete-haskell.defaultHintPanelVisibility') === 'Visible',
            priority: 200
          });
        };
      })(this)));
      this.globalDisposables.add(atom.commands.add('atom-workspace', {
        'autocomplete-haskell:toggle-completion-hint': (function(_this) {
          return function() {
            if (_this.panel.isVisible()) {
              return _this.panel.hide();
            } else {
              return _this.panel.show();
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
        panelVisible: this.panel.isVisible()
      };
    },
    deactivate: function() {
      var _ref;
      if ((_ref = this.backendHelperDisp) != null) {
        _ref.dispose();
      }
      this.globalDisposables.dispose();
      this.disposables = null;
      this.globalDisposables = null;
      this.backendHelper = null;
      this.panel.destroy();
      return this.panel = null;
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
          return function(_arg) {
            var editor, suggestion, triggerPosition;
            editor = _arg.editor, triggerPosition = _arg.triggerPosition, suggestion = _arg.suggestion;
            return _this.view.setText("" + suggestion.description);
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
            return _this.disposables = new CompositeDisposable;
          };
        })(this)
      });
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9hdXRvY29tcGxldGUtaGFza2VsbC9saWIvYXV0b2NvbXBsZXRlLWhhc2tlbGwuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFBQSxNQUFBLDhGQUFBOztBQUFBLEVBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSLEVBQXZCLG1CQUFELENBQUE7O0FBQUEsRUFDQSxpQkFBQSxHQUFvQixPQUFBLENBQVEsc0JBQVIsQ0FEcEIsQ0FBQTs7QUFBQSxFQUVBLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLHFCQUFSLENBRmhCLENBQUE7O0FBQUEsRUFHQSxrQkFBQSxHQUFxQixPQUFBLENBQVEsd0JBQVIsQ0FIckIsQ0FBQTs7QUFBQSxFQUtBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLG1CQUFBLEdBQ2Y7QUFBQSxJQUFBLE1BQUEsRUFDRTtBQUFBLE1BQUEscUJBQUEsRUFDRTtBQUFBLFFBQUEsSUFBQSxFQUFNLFNBQU47QUFBQSxRQUNBLFNBQUEsRUFBUyxJQURUO0FBQUEsUUFFQSxXQUFBLEVBQWEsMEVBRmI7T0FERjtBQUFBLE1BS0EsVUFBQSxFQUNFO0FBQUEsUUFBQSxJQUFBLEVBQU0sUUFBTjtBQUFBLFFBQ0EsU0FBQSxFQUFTLEVBRFQ7QUFBQSxRQUVBLFdBQUEsRUFBYSwrRkFGYjtPQU5GO0FBQUEsTUFVQSx5Q0FBQSxFQUNFO0FBQUEsUUFBQSxJQUFBLEVBQU0sU0FBTjtBQUFBLFFBQ0EsU0FBQSxFQUFTLE1BRFQ7QUFBQSxRQUVBLFdBQUEsRUFBYSw0SEFGYjtPQVhGO0FBQUEsTUFlQSwwQkFBQSxFQUNFO0FBQUEsUUFBQSxJQUFBLEVBQU0sUUFBTjtBQUFBLFFBQ0EsU0FBQSxFQUFTLFNBRFQ7QUFBQSxRQUVBLE1BQUEsRUFBTSxDQUFDLFNBQUQsRUFBWSxRQUFaLENBRk47T0FoQkY7S0FERjtBQUFBLElBcUJBLE9BQUEsRUFBUyxJQXJCVDtBQUFBLElBc0JBLFdBQUEsRUFBYSxJQXRCYjtBQUFBLElBdUJBLGlCQUFBLEVBQW1CLElBdkJuQjtBQUFBLElBeUJBLFFBQUEsRUFBVSxTQUFDLEtBQUQsR0FBQTtBQUNSLE1BQUEsSUFBQyxDQUFBLGFBQUQsR0FBcUIsSUFBQSxhQUFBLENBQWMsc0JBQWQsRUFDbkI7QUFBQSxRQUFBLElBQUEsRUFBTSxtQkFBTjtBQUFBLFFBQ0EsV0FBQSxFQUFhLHVCQURiO0FBQUEsUUFFQSxXQUFBLEVBQWEsNEJBRmI7T0FEbUIsQ0FBckIsQ0FBQTtBQUFBLE1BS0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxJQUFmLENBQUEsQ0FMQSxDQUFBO0FBQUEsTUFPQSxJQUFDLENBQUEsV0FBRCxHQUFlLEdBQUEsQ0FBQSxtQkFQZixDQUFBO0FBQUEsTUFRQSxJQUFDLENBQUEsaUJBQUQsR0FBcUIsR0FBQSxDQUFBLG1CQVJyQixDQUFBO0FBQUEsTUFTQSxJQUFDLENBQUEsaUJBQWlCLENBQUMsR0FBbkIsQ0FBdUIsSUFBQyxDQUFBLFdBQXhCLENBVEEsQ0FBQTtBQUFBLE1BV0EsSUFBQyxDQUFBLGlCQUFpQixDQUFDLEdBQW5CLENBQXVCLElBQUksQ0FBQyxRQUFRLENBQUMsb0JBQWQsQ0FBbUMsQ0FBQSxTQUFBLEtBQUEsR0FBQTtlQUFBLFNBQUMsQ0FBRCxHQUFBO0FBQ3hELGNBQUEsSUFBQTtBQUFBLFVBQUEsSUFBYyxDQUFDLENBQUMsSUFBRixLQUFVLHNCQUF4QjtBQUFBLGtCQUFBLENBQUE7V0FBQTtpQkFFQSxLQUFDLENBQUEsS0FBRCxHQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBZixDQUNQO0FBQUEsWUFBQSxJQUFBLEVBQU0sS0FBQyxDQUFBLElBQUQsR0FBUSxHQUFBLENBQUEsa0JBQWQ7QUFBQSxZQUNBLE9BQUEsK0NBQ3dCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixpREFBaEIsQ0FBQSxLQUFzRSxTQUY5RjtBQUFBLFlBR0EsUUFBQSxFQUFVLEdBSFY7V0FETyxFQUgrQztRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQW5DLENBQXZCLENBWEEsQ0FBQTtBQUFBLE1Bb0JBLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxHQUFuQixDQUF1QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQ3JCO0FBQUEsUUFBQSw2Q0FBQSxFQUErQyxDQUFBLFNBQUEsS0FBQSxHQUFBO2lCQUFBLFNBQUEsR0FBQTtBQUM3QyxZQUFBLElBQUcsS0FBQyxDQUFBLEtBQUssQ0FBQyxTQUFQLENBQUEsQ0FBSDtxQkFDRSxLQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBQSxFQURGO2FBQUEsTUFBQTtxQkFHRSxLQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBQSxFQUhGO2FBRDZDO1VBQUEsRUFBQTtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBL0M7T0FEcUIsQ0FBdkIsQ0FwQkEsQ0FBQTthQTJCQSxJQUFDLENBQUEsaUJBQWlCLENBQUMsR0FBbkIsQ0FBdUIsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFWLENBQWM7UUFDakM7QUFBQSxVQUFBLE9BQUEsRUFBUyxhQUFUO0FBQUEsVUFDQSxTQUFBLEVBQVc7WUFHTDtBQUFBLGNBQUEsT0FBQSxFQUFTLDhCQUFUO0FBQUEsY0FDQSxTQUFBLEVBQVcsNkNBRFg7YUFISztXQURYO1NBRGlDO09BQWQsQ0FBdkIsRUE1QlE7SUFBQSxDQXpCVjtBQUFBLElBZ0VBLFNBQUEsRUFBVyxTQUFBLEdBQUE7YUFDVDtBQUFBLFFBQUEsWUFBQSxFQUFjLElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBUCxDQUFBLENBQWQ7UUFEUztJQUFBLENBaEVYO0FBQUEsSUFtRUEsVUFBQSxFQUFZLFNBQUEsR0FBQTtBQUNWLFVBQUEsSUFBQTs7WUFBa0IsQ0FBRSxPQUFwQixDQUFBO09BQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxPQUFuQixDQUFBLENBREEsQ0FBQTtBQUFBLE1BRUEsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUZmLENBQUE7QUFBQSxNQUdBLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixJQUhyQixDQUFBO0FBQUEsTUFJQSxJQUFDLENBQUEsYUFBRCxHQUFpQixJQUpqQixDQUFBO0FBQUEsTUFLQSxJQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsQ0FBQSxDQUxBLENBQUE7YUFNQSxJQUFDLENBQUEsS0FBRCxHQUFTLEtBUEM7SUFBQSxDQW5FWjtBQUFBLElBNEVBLDBCQUFBLEVBQTRCLFNBQUEsR0FBQTthQUMxQjtBQUFBLFFBQUEsUUFBQSxFQUFVLGlCQUFWO0FBQUEsUUFDQSxrQkFBQSxFQUFvQiwwQkFEcEI7QUFBQSxRQUVBLGlCQUFBLEVBQW1CLENBRm5CO0FBQUEsUUFHQSxjQUFBLEVBQWdCLENBQUEsU0FBQSxLQUFBLEdBQUE7aUJBQUEsU0FBQyxPQUFELEdBQUE7QUFDZCxZQUFBLElBQWlCLHFCQUFqQjtBQUFBLHFCQUFPLEVBQVAsQ0FBQTthQUFBO21CQUNBLENBQUssSUFBQSxpQkFBQSxDQUFrQixPQUFsQixFQUEyQixLQUFDLENBQUEsT0FBNUIsQ0FBTCxDQUF5QyxDQUFDLGNBQTFDLENBQUEsRUFGYztVQUFBLEVBQUE7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBSGhCO0FBQUEsUUFNQSxxQkFBQSxFQUF1QixDQUFBLFNBQUEsS0FBQSxHQUFBO2lCQUFBLFNBQUMsSUFBRCxHQUFBO0FBQ3JCLGdCQUFBLG1DQUFBO0FBQUEsWUFEdUIsY0FBQSxRQUFRLHVCQUFBLGlCQUFpQixrQkFBQSxVQUNoRCxDQUFBO21CQUFBLEtBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTixDQUFjLEVBQUEsR0FBRyxVQUFVLENBQUMsV0FBNUIsRUFEcUI7VUFBQSxFQUFBO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQU52QjtRQUQwQjtJQUFBLENBNUU1QjtBQUFBLElBc0ZBLGVBQUEsRUFBaUIsU0FBQyxPQUFELEdBQUE7YUFDZixJQUFDLENBQUEsaUJBQUQsR0FBcUIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxPQUFmLENBQXVCLE9BQXZCLEVBQ25CO0FBQUEsUUFBQSxPQUFBLEVBQVMsQ0FBQSxTQUFBLEtBQUEsR0FBQTtpQkFBQSxTQUFBLEdBQUE7bUJBQ1AsS0FBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWYsQ0FBa0MsU0FBQyxNQUFELEdBQUE7QUFDakQsY0FBQSxJQUFjLE1BQU0sQ0FBQyxVQUFQLENBQUEsQ0FBbUIsQ0FBQyxTQUFwQixLQUFpQyxnQkFBL0M7QUFBQSxzQkFBQSxDQUFBO2VBQUE7cUJBQ0EsS0FBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLE9BQU8sQ0FBQyx3QkFBUixDQUFpQyxNQUFNLENBQUMsU0FBUCxDQUFBLENBQWpDLENBQWpCLEVBRmlEO1lBQUEsQ0FBbEMsQ0FBakIsRUFETztVQUFBLEVBQUE7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVQ7QUFBQSxRQUlBLE9BQUEsRUFBUyxDQUFBLFNBQUEsS0FBQSxHQUFBO2lCQUFBLFNBQUEsR0FBQTtBQUNQLFlBQUEsS0FBQyxDQUFBLFdBQVcsQ0FBQyxPQUFiLENBQUEsQ0FBQSxDQUFBO21CQUNBLEtBQUMsQ0FBQSxXQUFELEdBQWUsR0FBQSxDQUFBLG9CQUZSO1VBQUEsRUFBQTtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FKVDtPQURtQixFQUROO0lBQUEsQ0F0RmpCO0dBTkYsQ0FBQTtBQUFBIgp9

//# sourceURL=/Users/erewok/.atom/packages/autocomplete-haskell/lib/autocomplete-haskell.coffee

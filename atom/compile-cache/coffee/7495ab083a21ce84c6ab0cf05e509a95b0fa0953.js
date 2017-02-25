(function() {
  var PluginManager, mkError,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  mkError = function(name, message) {
    var e;
    e = new Error(message);
    e.name = name;
    return e;
  };

  module.exports = PluginManager = (function() {
    function PluginManager(state) {
      this.onResultsUpdated = __bind(this.onResultsUpdated, this);
      var CompositeDisposable, Emitter, ResultsDB, _ref, _ref1;
      ResultsDB = require('./results-db');
      this.checkResults = new ResultsDB;
      _ref = require('atom'), CompositeDisposable = _ref.CompositeDisposable, Emitter = _ref.Emitter;
      this.disposables = new CompositeDisposable;
      this.controllers = new WeakMap;
      this.disposables.add(this.emitter = new Emitter);
      this.disposables.add(this.onResultsUpdated((function(_this) {
        return function(_arg) {
          var types;
          types = _arg.types;
          return _this.updateEditorsWithResults(types);
        };
      })(this)));
      this.createOutputViewPanel(state);
      this.subscribeEditorController();
      this.changeParamFs = {};
      this.configParams = (_ref1 = state.configParams) != null ? _ref1 : {};
    }

    PluginManager.prototype.deactivate = function() {
      var _ref;
      this.checkResults.destroy();
      this.disposables.dispose();
      if ((_ref = this.backend) != null) {
        if (typeof _ref.shutdownBackend === "function") {
          _ref.shutdownBackend();
        }
      }
      this.deleteEditorControllers();
      return this.deleteOutputViewPanel();
    };

    PluginManager.prototype.serialize = function() {
      var _ref;
      return {
        outputView: (_ref = this.outputView) != null ? _ref.serialize() : void 0,
        configParams: this.configParams
      };
    };

    PluginManager.prototype.onShouldShowTooltip = function(callback) {
      return this.emitter.on('should-show-tooltip', callback);
    };

    PluginManager.prototype.onWillSaveBuffer = function(callback) {
      return this.emitter.on('will-save-buffer', callback);
    };

    PluginManager.prototype.onDidSaveBuffer = function(callback) {
      return this.emitter.on('did-save-buffer', callback);
    };

    PluginManager.prototype.onDidStopChanging = function(callback) {
      return this.emitter.on('did-stop-changing', callback);
    };

    PluginManager.prototype.togglePanel = function() {
      var _ref;
      return (_ref = this.outputView) != null ? _ref.toggle() : void 0;
    };

    PluginManager.prototype.updateEditorsWithResults = function(types) {
      var ed, _i, _len, _ref, _ref1, _results;
      _ref = atom.workspace.getTextEditors();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ed = _ref[_i];
        _results.push((_ref1 = this.controller(ed)) != null ? typeof _ref1.updateResults === "function" ? _ref1.updateResults(this.checkResults.filter({
          uri: ed.getPath()
        }, types)) : void 0 : void 0);
      }
      return _results;
    };

    PluginManager.prototype.onResultsUpdated = function(callback) {
      return this.checkResults.onDidUpdate(callback);
    };

    PluginManager.prototype.controller = function(editor) {
      var _ref;
      return (_ref = this.controllers) != null ? typeof _ref.get === "function" ? _ref.get(editor) : void 0 : void 0;
    };

    PluginManager.prototype.createOutputViewPanel = function(state) {
      var OutputPanel;
      OutputPanel = require('./output-panel/output-panel');
      return this.outputView = new OutputPanel(state.outputView, this.checkResults);
    };

    PluginManager.prototype.deleteOutputViewPanel = function() {
      this.outputView.destroy();
      return this.outputView = null;
    };

    PluginManager.prototype.addController = function(editor) {
      var EditorControl, controller;
      if (this.controllers.get(editor) == null) {
        EditorControl = require('./editor-control');
        this.controllers.set(editor, controller = new EditorControl(editor));
        controller.disposables.add(editor.onDidDestroy((function(_this) {
          return function() {
            return _this.removeController(editor);
          };
        })(this)));
        controller.disposables.add(controller.onShouldShowTooltip((function(_this) {
          return function(_arg) {
            var editor, eventType, pos;
            editor = _arg.editor, pos = _arg.pos, eventType = _arg.eventType;
            return _this.emitter.emit('should-show-tooltip', {
              editor: editor,
              pos: pos,
              eventType: eventType
            });
          };
        })(this)));
        controller.disposables.add(controller.onWillSaveBuffer((function(_this) {
          return function(buffer) {
            return _this.emitter.emit('will-save-buffer', buffer);
          };
        })(this)));
        controller.disposables.add(controller.onDidSaveBuffer((function(_this) {
          return function(buffer) {
            return _this.emitter.emit('did-save-buffer', buffer);
          };
        })(this)));
        controller.disposables.add(controller.onDidStopChanging((function(_this) {
          return function(editor) {
            return _this.emitter.emit('did-stop-changing', editor.getBuffer());
          };
        })(this)));
        return controller.updateResults(this.checkResults.filter({
          uri: editor.getPath()
        }));
      }
    };

    PluginManager.prototype.removeController = function(editor) {
      var _ref;
      if ((_ref = this.controllers.get(editor)) != null) {
        _ref.deactivate();
      }
      return this.controllers["delete"](editor);
    };

    PluginManager.prototype.controllerOnGrammar = function(editor, grammar) {
      if (grammar.scopeName.match(/haskell$/)) {
        return this.addController(editor);
      } else {
        return this.removeController(editor);
      }
    };

    PluginManager.prototype.subscribeEditorController = function() {
      return this.disposables.add(atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          _this.disposables.add(editor.onDidChangeGrammar(function(grammar) {
            return _this.controllerOnGrammar(editor, grammar);
          }));
          return _this.controllerOnGrammar(editor, editor.getGrammar());
        };
      })(this)));
    };

    PluginManager.prototype.deleteEditorControllers = function() {
      var editor, _i, _len, _ref, _results;
      _ref = atom.workspace.getTextEditors();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        editor = _ref[_i];
        _results.push(this.removeController(editor));
      }
      return _results;
    };

    PluginManager.prototype.nextError = function() {
      var _ref;
      return (_ref = this.outputView) != null ? _ref.showNextError() : void 0;
    };

    PluginManager.prototype.prevError = function() {
      var _ref;
      return (_ref = this.outputView) != null ? _ref.showPrevError() : void 0;
    };

    PluginManager.prototype.addConfigParam = function(pluginName, specs) {
      var CompositeDisposable, disp, name, spec, _base, _base1, _fn;
      CompositeDisposable = require('atom').CompositeDisposable;
      disp = new CompositeDisposable;
      if ((_base = this.changeParamFs)[pluginName] == null) {
        _base[pluginName] = {};
      }
      if ((_base1 = this.configParams)[pluginName] == null) {
        _base1[pluginName] = {};
      }
      _fn = (function(_this) {
        return function(name, spec) {
          var change, elem, show, _base2;
          if ((_base2 = _this.configParams[pluginName])[name] == null) {
            _base2[name] = spec["default"];
          }
          elem = document.createElement("ide-haskell-param");
          elem.classList.add("ide-haskell-" + pluginName + "-" + name);
          if (spec.displayName == null) {
            spec.displayName = name.charAt(0).toUpperCase() + name.slice(1);
          }
          show = function() {
            elem.innerText = ("" + spec.displayName + ": ") + spec.displayTemplate(_this.configParams[pluginName][name]);
            return typeof spec.onChanged === "function" ? spec.onChanged(_this.configParams[pluginName][name]) : void 0;
          };
          show();
          _this.changeParamFs[pluginName][name] = change = function(resolve, reject) {
            var ParamSelectView;
            ParamSelectView = require('./output-panel/views/param-select-view');
            return new ParamSelectView({
              items: typeof spec.items === 'function' ? spec.items() : spec.items,
              heading: spec.description,
              itemTemplate: spec.itemTemplate,
              itemFilterName: spec.itemFilterName,
              onConfirmed: function(value) {
                _this.configParams[pluginName][name] = value;
                show();
                return typeof resolve === "function" ? resolve(value) : void 0;
              },
              onCancelled: function() {
                return typeof reject === "function" ? reject() : void 0;
              }
            });
          };
          return disp.add(_this.outputView.addPanelControl(elem, {
            events: {
              click: function() {
                return change();
              }
            },
            before: '#progressBar'
          }));
        };
      })(this);
      for (name in specs) {
        spec = specs[name];
        _fn(name, spec);
      }
      return disp;
    };

    PluginManager.prototype.getConfigParam = function(pluginName, name) {
      var _ref, _ref1;
      if (!atom.packages.isPackageActive(pluginName)) {
        return Promise.reject(mkError('PackageInactiveError', "Ide-haskell cannot get parameter " + pluginName + ":" + name + " of inactive package " + pluginName));
      }
      if (((_ref = this.configParams[pluginName]) != null ? _ref[name] : void 0) != null) {
        return Promise.resolve(this.configParams[pluginName][name]);
      } else if (((_ref1 = this.changeParamFs[pluginName]) != null ? _ref1[name] : void 0) != null) {
        return new Promise((function(_this) {
          return function(resolve, reject) {
            return _this.changeParamFs[pluginName][name](resolve, reject);
          };
        })(this));
      } else {
        return Promise.reject(mkError('ParamUndefinedError', "Ide-haskell cannot get parameter " + pluginName + ":" + name + " before it is defined"));
      }
    };

    PluginManager.prototype.setConfigParam = function(pluginName, name, value) {
      var _base, _ref;
      if (!atom.packages.isPackageActive(pluginName)) {
        return Promise.reject(mkError('PackageInactiveError', "Ide-haskell cannot set parameter " + pluginName + ":" + name + " of inactive package " + pluginName));
      }
      if (value != null) {
        if ((_base = this.configParams)[pluginName] == null) {
          _base[pluginName] = {};
        }
        this.configParams[pluginName][name] = value;
        return Promise.resolve(value);
      } else if (((_ref = this.changeParamFs[pluginName]) != null ? _ref[name] : void 0) != null) {
        return new Promise((function(_this) {
          return function(resolve, reject) {
            return _this.changeParamFs[pluginName][name](resolve, reject);
          };
        })(this));
      } else {
        return Promise.reject(mkError('ParamUndefinedError', "Ide-haskell cannot set parameter " + pluginName + ":" + name + " before it is defined"));
      }
    };

    return PluginManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvcGx1Z2luLW1hbmFnZXIuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFBQSxNQUFBLHNCQUFBO0lBQUEsa0ZBQUE7O0FBQUEsRUFBQSxPQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sT0FBUCxHQUFBO0FBQ1IsUUFBQSxDQUFBO0FBQUEsSUFBQSxDQUFBLEdBQVEsSUFBQSxLQUFBLENBQU0sT0FBTixDQUFSLENBQUE7QUFBQSxJQUNBLENBQUMsQ0FBQyxJQUFGLEdBQVMsSUFEVCxDQUFBO0FBRUEsV0FBTyxDQUFQLENBSFE7RUFBQSxDQUFWLENBQUE7O0FBQUEsRUFLQSxNQUFNLENBQUMsT0FBUCxHQUNNO0FBQ1MsSUFBQSx1QkFBQyxLQUFELEdBQUE7QUFDWCxpRUFBQSxDQUFBO0FBQUEsVUFBQSxvREFBQTtBQUFBLE1BQUEsU0FBQSxHQUFZLE9BQUEsQ0FBUSxjQUFSLENBQVosQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsR0FBQSxDQUFBLFNBRGhCLENBQUE7QUFBQSxNQUdBLE9BQWlDLE9BQUEsQ0FBUSxNQUFSLENBQWpDLEVBQUMsMkJBQUEsbUJBQUQsRUFBc0IsZUFBQSxPQUh0QixDQUFBO0FBQUEsTUFJQSxJQUFDLENBQUEsV0FBRCxHQUFlLEdBQUEsQ0FBQSxtQkFKZixDQUFBO0FBQUEsTUFLQSxJQUFDLENBQUEsV0FBRCxHQUFlLEdBQUEsQ0FBQSxPQUxmLENBQUE7QUFBQSxNQU1BLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFDLENBQUEsT0FBRCxHQUFXLEdBQUEsQ0FBQSxPQUE1QixDQU5BLENBQUE7QUFBQSxNQVFBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFDLENBQUEsZ0JBQUQs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

//# sourceURL=/Users/erewok/.atom/packages/ide-haskell/lib/plugin-manager.coffee

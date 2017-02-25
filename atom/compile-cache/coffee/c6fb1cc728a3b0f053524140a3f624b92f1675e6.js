(function() {
  var PluginManager, mkError,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  mkError = function(name, message) {
    var e;
    e = new Error(message);
    e.name = name;
    return e;
  };

  module.exports = PluginManager = (function() {
    function PluginManager(state) {
      this.onResultsUpdated = bind(this.onResultsUpdated, this);
      var CompositeDisposable, Emitter, ResultsDB, ref, ref1;
      ResultsDB = require('./results-db');
      this.checkResults = new ResultsDB;
      ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Emitter = ref.Emitter;
      this.disposables = new CompositeDisposable;
      this.controllers = new WeakMap;
      this.disposables.add(this.emitter = new Emitter);
      this.disposables.add(this.onResultsUpdated((function(_this) {
        return function(arg) {
          var types;
          types = arg.types;
          return _this.updateEditorsWithResults(types);
        };
      })(this)));
      this.createOutputViewPanel(state);
      this.subscribeEditorController();
      this.changeParamFs = {};
      this.configParams = (ref1 = state.configParams) != null ? ref1 : {};
      this.disposables.add(atom.config.observe('ide-haskell.hideParameterValues', (function(_this) {
        return function(value) {
          return _this.outputView.setHideParameterValues(value);
        };
      })(this)));
    }

    PluginManager.prototype.deactivate = function() {
      var ref;
      this.checkResults.destroy();
      this.disposables.dispose();
      if ((ref = this.backend) != null) {
        if (typeof ref.shutdownBackend === "function") {
          ref.shutdownBackend();
        }
      }
      this.deleteEditorControllers();
      return this.deleteOutputViewPanel();
    };

    PluginManager.prototype.serialize = function() {
      var ref;
      return {
        outputView: (ref = this.outputView) != null ? ref.serialize() : void 0,
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
      var ref;
      return (ref = this.outputView) != null ? ref.toggle() : void 0;
    };

    PluginManager.prototype.updateEditorsWithResults = function(types) {
      var ed, i, len, ref, ref1, results;
      ref = atom.workspace.getTextEditors();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        ed = ref[i];
        results.push((ref1 = this.controller(ed)) != null ? typeof ref1.updateResults === "function" ? ref1.updateResults(this.checkResults.filter({
          uri: ed.getPath()
        }, types)) : void 0 : void 0);
      }
      return results;
    };

    PluginManager.prototype.onResultsUpdated = function(callback) {
      return this.checkResults.onDidUpdate(callback);
    };

    PluginManager.prototype.controller = function(editor) {
      var ref;
      return (ref = this.controllers) != null ? typeof ref.get === "function" ? ref.get(editor) : void 0 : void 0;
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
          return function(arg) {
            var editor, eventType, pos;
            editor = arg.editor, pos = arg.pos, eventType = arg.eventType;
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
      var ref;
      if ((ref = this.controllers.get(editor)) != null) {
        ref.deactivate();
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
      var editor, i, len, ref, results;
      ref = atom.workspace.getTextEditors();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        editor = ref[i];
        results.push(this.removeController(editor));
      }
      return results;
    };

    PluginManager.prototype.nextError = function() {
      var ref;
      return (ref = this.outputView) != null ? ref.showNextError() : void 0;
    };

    PluginManager.prototype.prevError = function() {
      var ref;
      return (ref = this.outputView) != null ? ref.showPrevError() : void 0;
    };

    PluginManager.prototype.addConfigParam = function(pluginName, specs) {
      var CompositeDisposable, base, base1, disp, fn, name, spec;
      CompositeDisposable = require('atom').CompositeDisposable;
      disp = new CompositeDisposable;
      if ((base = this.changeParamFs)[pluginName] == null) {
        base[pluginName] = {};
      }
      if ((base1 = this.configParams)[pluginName] == null) {
        base1[pluginName] = {};
      }
      fn = (function(_this) {
        return function(name, spec) {
          var base2, change, elem, elemVal, show;
          if ((base2 = _this.configParams[pluginName])[name] == null) {
            base2[name] = spec["default"];
          }
          elem = document.createElement("ide-haskell-param");
          elem.classList.add("ide-haskell--" + pluginName, "ide-haskell-param--" + name);
          if (atom.config.get('ide-haskell.hideParameterValues')) {
            elem.classList.add('hidden-value');
          }
          elem.appendChild(elemVal = document.createElement("ide-haskell-param-value"));
          if (spec.displayName == null) {
            spec.displayName = name.charAt(0).toUpperCase() + name.slice(1);
          }
          show = function() {
            elem.setAttribute('data-display-name', spec.displayName);
            elemVal.setAttribute('data-display-name', spec.displayName);
            elemVal.innerText = spec.displayTemplate(_this.configParams[pluginName][name]);
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
        fn(name, spec);
      }
      return disp;
    };

    PluginManager.prototype.getConfigParam = function(pluginName, name) {
      var ref, ref1;
      if (!atom.packages.isPackageActive(pluginName)) {
        return Promise.reject(mkError('PackageInactiveError', "Ide-haskell cannot get parameter " + pluginName + ":" + name + " of inactive package " + pluginName));
      }
      if (((ref = this.configParams[pluginName]) != null ? ref[name] : void 0) != null) {
        return Promise.resolve(this.configParams[pluginName][name]);
      } else if (((ref1 = this.changeParamFs[pluginName]) != null ? ref1[name] : void 0) != null) {
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
      var base, ref;
      if (!atom.packages.isPackageActive(pluginName)) {
        return Promise.reject(mkError('PackageInactiveError', "Ide-haskell cannot set parameter " + pluginName + ":" + name + " of inactive package " + pluginName));
      }
      if (value != null) {
        if ((base = this.configParams)[pluginName] == null) {
          base[pluginName] = {};
        }
        this.configParams[pluginName][name] = value;
        return Promise.resolve(value);
      } else if (((ref = this.changeParamFs[pluginName]) != null ? ref[name] : void 0) != null) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvcGx1Z2luLW1hbmFnZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxzQkFBQTtJQUFBOztFQUFBLE9BQUEsR0FBVSxTQUFDLElBQUQsRUFBTyxPQUFQO0FBQ1IsUUFBQTtJQUFBLENBQUEsR0FBUSxJQUFBLEtBQUEsQ0FBTSxPQUFOO0lBQ1IsQ0FBQyxDQUFDLElBQUYsR0FBUztBQUNULFdBQU87RUFIQzs7RUFLVixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1MsdUJBQUMsS0FBRDs7QUFDWCxVQUFBO01BQUEsU0FBQSxHQUFZLE9BQUEsQ0FBUSxjQUFSO01BQ1osSUFBQyxDQUFBLFlBQUQsR0FBZ0IsSUFBSTtNQUVwQixNQUFpQyxPQUFBLENBQVEsTUFBUixDQUFqQyxFQUFDLDZDQUFELEVBQXNCO01BQ3RCLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBSTtNQUNuQixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUk7TUFDbkIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSSxPQUFoQztNQUVBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7QUFBYSxjQUFBO1VBQVgsUUFBRDtpQkFBWSxLQUFDLENBQUEsd0JBQUQsQ0FBMEIsS0FBMUI7UUFBYjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbEIsQ0FBakI7TUFFQSxJQUFDLENBQUEscUJBQUQsQ0FBdUIsS0FBdkI7TUFDQSxJQUFDLENBQUEseUJBQUQsQ0FBQTtNQUVBLElBQUMsQ0FBQSxhQUFELEdBQWlCO01BQ2pCLElBQUMsQ0FBQSxZQUFELGdEQUFxQztNQUVyQyxJQUFDLENBQUEsV0FB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QyxDQUFBLFlBQWEsQ0FBQSxVQUFBLENBQVksQ0FBQSxJQUFBLENBQTFCLEdBQWtDO2VBQ2xDLE9BQU8sQ0FBQyxPQUFSLENBQWdCLEtBQWhCLEVBSEY7T0FBQSxNQUlLLElBQUcsNkVBQUg7ZUFDQyxJQUFBLE9BQUEsQ0FBUSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLE9BQUQsRUFBVSxNQUFWO21CQUNWLEtBQUMsQ0FBQSxhQUFjLENBQUEsVUFBQSxDQUFZLENBQUEsSUFBQSxDQUEzQixDQUFpQyxPQUFqQyxFQUEwQyxNQUExQztVQURVO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFSLEVBREQ7T0FBQSxNQUFBO0FBSUgsZUFBTyxPQUFPLENBQUMsTUFBUixDQUNMLE9BQUEsQ0FBUSxxQkFBUixFQUNFLG1DQUFBLEdBQW9DLFVBQXBDLEdBQStDLEdBQS9DLEdBQWtELElBQWxELEdBQXVELHVCQUR6RCxDQURLLEVBSko7O0lBVlM7Ozs7O0FBNUtsQiIsInNvdXJjZXNDb250ZW50IjpbIm1rRXJyb3IgPSAobmFtZSwgbWVzc2FnZSkgLT5cbiAgZSA9IG5ldyBFcnJvcihtZXNzYWdlKVxuICBlLm5hbWUgPSBuYW1lXG4gIHJldHVybiBlXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFBsdWdpbk1hbmFnZXJcbiAgY29uc3RydWN0b3I6IChzdGF0ZSkgLT5cbiAgICBSZXN1bHRzREIgPSByZXF1aXJlICcuL3Jlc3VsdHMtZGInXG4gICAgQGNoZWNrUmVzdWx0cyA9IG5ldyBSZXN1bHRzREJcblxuICAgIHtDb21wb3NpdGVEaXNwb3NhYmxlLCBFbWl0dGVyfSA9IHJlcXVpcmUgJ2F0b20nXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAY29udHJvbGxlcnMgPSBuZXcgV2Vha01hcFxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAb25SZXN1bHRzVXBkYXRlZCAoe3R5cGVzfSkgPT4gQHVwZGF0ZUVkaXRvcnNXaXRoUmVzdWx0cyh0eXBlcylcblxuICAgIEBjcmVhdGVPdXRwdXRWaWV3UGFuZWwoc3RhdGUpXG4gICAgQHN1YnNjcmliZUVkaXRvckNvbnRyb2xsZXIoKVxuXG4gICAgQGNoYW5nZVBhcmFtRnMgPSB7fVxuICAgIEBjb25maWdQYXJhbXMgPSBzdGF0ZS5jb25maWdQYXJhbXMgPyB7fVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdpZGUtaGFza2VsbC5oaWRlUGFyYW1ldGVyVmFsdWVzJywgKHZhbHVlKSA9PlxuICAgICAgQG91dHB1dFZpZXcuc2V0SGlkZVBhcmFtZXRlclZhbHVlcyh2YWx1ZSlcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBjaGVja1Jlc3VsdHMuZGVzdHJveSgpXG4gICAgQGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuICAgIEBiYWNrZW5kPy5zaHV0ZG93bkJhY2tlbmQ/KClcblxuICAgIEBkZWxldGVFZGl0b3JDb250cm9sbGVycygpXG4gICAgQGRlbGV0ZU91dHB1dFZpZXdQYW5lbCgpXG5cbiAgc2VyaWFsaXplOiAtPlxuICAgIG91dHB1dFZpZXc6IEBvdXRwdXRWaWV3Py5zZXJpYWxpemUoKVxuICAgIGNvbmZpZ1BhcmFtczogQGNvbmZpZ1BhcmFtc1xuXG4gIG9uU2hvdWxkU2hvd1Rvb2x0aXA6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnc2hvdWxkLXNob3ctdG9vbHRpcCcsIGNhbGxiYWNrXG5cbiAgb25XaWxsU2F2ZUJ1ZmZlcjogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICd3aWxsLXNhdmUtYnVmZmVyJywgY2FsbGJhY2tcblxuICBvbkRpZFNhdmVCdWZmZXI6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLXNhdmUtYnVmZmVyJywgY2FsbGJhY2tcblxuICBvbkRpZFN0b3BDaGFuZ2luZzogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtc3RvcC1jaGFuZ2luZycsIGNhbGxiYWNrXG5cbiAgdG9nZ2xlUGFuZWw6IC0+XG4gICAgQG91dHB1dFZpZXc/LnRvZ2dsZSgpXG5cbiAgdXBkYXRlRWRpdG9yc1dpdGhSZXN1bHRzOiAodHlwZXMpIC0+XG4gICAgZm9yIGVkIGluIGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKClcbiAgICAgIEBjb250cm9sbGVyKGVkKT8udXBkYXRlUmVzdWx0cz8oQGNoZWNrUmVzdWx0cy5maWx0ZXIgdXJpOiBlZC5nZXRQYXRoKCksIHR5cGVzKVxuXG4gIG9uUmVzdWx0c1VwZGF0ZWQ6IChjYWxsYmFjaykgPT5cbiAgICBAY2hlY2tSZXN1bHRzLm9uRGlkVXBkYXRlIGNhbGxiYWNrXG5cbiAgY29udHJvbGxlcjogKGVkaXRvcikgLT5cbiAgICBAY29udHJvbGxlcnM/LmdldD8gZWRpdG9yXG5cbiAgIyBDcmVhdGUgYW5kIGRlbGV0ZSBvdXRwdXQgdmlldyBwYW5lbC5cbiAgY3JlYXRlT3V0cHV0Vmlld1BhbmVsOiAoc3RhdGUpIC0+XG4gICAgT3V0cHV0UGFuZWwgPSByZXF1aXJlICcuL291dHB1dC1wYW5lbC9vdXRwdXQtcGFuZWwnXG4gICAgQG91dHB1dFZpZXcgPSBuZXcgT3V0cHV0UGFuZWwoc3RhdGUub3V0cHV0VmlldywgQGNoZWNrUmVzdWx0cylcblxuICBkZWxldGVPdXRwdXRWaWV3UGFuZWw6IC0+XG4gICAgQG91dHB1dFZpZXcuZGVzdHJveSgpXG4gICAgQG91dHB1dFZpZXcgPSBudWxsXG5cbiAgYWRkQ29udHJvbGxlcjogKGVkaXRvcikgLT5cbiAgICB1bmxlc3MgQGNvbnRyb2xsZXJzLmdldChlZGl0b3IpP1xuICAgICAgRWRpdG9yQ29udHJvbCA9IHJlcXVpcmUgJy4vZWRpdG9yLWNvbnRyb2wnXG4gICAgICBAY29udHJvbGxlcnMuc2V0IGVkaXRvciwgY29udHJvbGxlciA9IG5ldyBFZGl0b3JDb250cm9sKGVkaXRvcilcbiAgICAgIGNvbnRyb2xsZXIuZGlzcG9zYWJsZXMuYWRkIGVkaXRvci5vbkRpZERlc3Ryb3kgPT5cbiAgICAgICAgQHJlbW92ZUNvbnRyb2xsZXIgZWRpdG9yXG4gICAgICBjb250cm9sbGVyLmRpc3Bvc2FibGVzLmFkZCBjb250cm9sbGVyLm9uU2hvdWxkU2hvd1Rvb2x0aXAgKHtlZGl0b3IsIHBvcywgZXZlbnRUeXBlfSkgPT5cbiAgICAgICAgQGVtaXR0ZXIuZW1pdCAnc2hvdWxkLXNob3ctdG9vbHRpcCcsIHtlZGl0b3IsIHBvcywgZXZlbnRUeXBlfVxuICAgICAgY29udHJvbGxlci5kaXNwb3NhYmxlcy5hZGQgY29udHJvbGxlci5vbldpbGxTYXZlQnVmZmVyIChidWZmZXIpID0+XG4gICAgICAgIEBlbWl0dGVyLmVtaXQgJ3dpbGwtc2F2ZS1idWZmZXInLCBidWZmZXJcbiAgICAgIGNvbnRyb2xsZXIuZGlzcG9zYWJsZXMuYWRkIGNvbnRyb2xsZXIub25EaWRTYXZlQnVmZmVyIChidWZmZXIpID0+XG4gICAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1zYXZlLWJ1ZmZlcicsIGJ1ZmZlclxuICAgICAgY29udHJvbGxlci5kaXNwb3NhYmxlcy5hZGQgY29udHJvbGxlci5vbkRpZFN0b3BDaGFuZ2luZyAoZWRpdG9yKSA9PlxuICAgICAgICBAZW1pdHRlci5lbWl0ICdkaWQtc3RvcC1jaGFuZ2luZycsIGVkaXRvci5nZXRCdWZmZXIoKVxuICAgICAgY29udHJvbGxlci51cGRhdGVSZXN1bHRzIEBjaGVja1Jlc3VsdHMuZmlsdGVyIHVyaTogZWRpdG9yLmdldFBhdGgoKVxuXG4gIHJlbW92ZUNvbnRyb2xsZXI6IChlZGl0b3IpIC0+XG4gICAgQGNvbnRyb2xsZXJzLmdldChlZGl0b3IpPy5kZWFjdGl2YXRlKClcbiAgICBAY29udHJvbGxlcnMuZGVsZXRlKGVkaXRvcilcblxuICBjb250cm9sbGVyT25HcmFtbWFyOiAoZWRpdG9yLCBncmFtbWFyKSAtPlxuICAgIGlmIGdyYW1tYXIuc2NvcGVOYW1lLm1hdGNoIC9oYXNrZWxsJC9cbiAgICAgIEBhZGRDb250cm9sbGVyIGVkaXRvclxuICAgIGVsc2VcbiAgICAgIEByZW1vdmVDb250cm9sbGVyIGVkaXRvclxuXG4gICMgT2JzZXJ2ZSB0ZXh0IGVkaXRvcnMgdG8gYXR0YWNoIGNvbnRyb2xsZXJcbiAgc3Vic2NyaWJlRWRpdG9yQ29udHJvbGxlcjogLT5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyAoZWRpdG9yKSA9PlxuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBlZGl0b3Iub25EaWRDaGFuZ2VHcmFtbWFyIChncmFtbWFyKSA9PlxuICAgICAgICBAY29udHJvbGxlck9uR3JhbW1hciBlZGl0b3IsIGdyYW1tYXJcbiAgICAgIEBjb250cm9sbGVyT25HcmFtbWFyIGVkaXRvciwgZWRpdG9yLmdldEdyYW1tYXIoKVxuXG4gIGRlbGV0ZUVkaXRvckNvbnRyb2xsZXJzOiAtPlxuICAgIGZvciBlZGl0b3IgaW4gYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKVxuICAgICAgQHJlbW92ZUNvbnRyb2xsZXIgZWRpdG9yXG5cbiAgbmV4dEVycm9yOiAtPlxuICAgIEBvdXRwdXRWaWV3Py5zaG93TmV4dEVycm9yKClcblxuICBwcmV2RXJyb3I6IC0+XG4gICAgQG91dHB1dFZpZXc/LnNob3dQcmV2RXJyb3IoKVxuXG4gIGFkZENvbmZpZ1BhcmFtOiAocGx1Z2luTmFtZSwgc3BlY3MpIC0+XG4gICAge0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbiAgICBkaXNwID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAY2hhbmdlUGFyYW1Gc1twbHVnaW5OYW1lXSA/PSB7fVxuICAgIEBjb25maWdQYXJhbXNbcGx1Z2luTmFtZV0gPz0ge31cbiAgICBmb3IgbmFtZSwgc3BlYyBvZiBzcGVjc1xuICAgICAgZG8gKG5hbWUsIHNwZWMpID0+XG4gICAgICAgIEBjb25maWdQYXJhbXNbcGx1Z2luTmFtZV1bbmFtZV0gPz0gc3BlYy5kZWZhdWx0XG4gICAgICAgIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50IFwiaWRlLWhhc2tlbGwtcGFyYW1cIlxuICAgICAgICBlbGVtLmNsYXNzTGlzdC5hZGQgXCJpZGUtaGFza2VsbC0tI3twbHVnaW5OYW1lfVwiLCBcImlkZS1oYXNrZWxsLXBhcmFtLS0je25hbWV9XCJcbiAgICAgICAgaWYgYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC5oaWRlUGFyYW1ldGVyVmFsdWVzJylcbiAgICAgICAgICBlbGVtLmNsYXNzTGlzdC5hZGQgJ2hpZGRlbi12YWx1ZSdcbiAgICAgICAgZWxlbS5hcHBlbmRDaGlsZCBlbGVtVmFsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCBcImlkZS1oYXNrZWxsLXBhcmFtLXZhbHVlXCJcbiAgICAgICAgc3BlYy5kaXNwbGF5TmFtZSA/PSBuYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgbmFtZS5zbGljZSgxKVxuICAgICAgICBzaG93ID0gPT5cbiAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnZGF0YS1kaXNwbGF5LW5hbWUnLCBzcGVjLmRpc3BsYXlOYW1lKVxuICAgICAgICAgIGVsZW1WYWwuc2V0QXR0cmlidXRlKCdkYXRhLWRpc3BsYXktbmFtZScsIHNwZWMuZGlzcGxheU5hbWUpXG4gICAgICAgICAgZWxlbVZhbC5pbm5lclRleHQgPSBzcGVjLmRpc3BsYXlUZW1wbGF0ZShAY29uZmlnUGFyYW1zW3BsdWdpbk5hbWVdW25hbWVdKVxuICAgICAgICAgIHNwZWMub25DaGFuZ2VkPyhAY29uZmlnUGFyYW1zW3BsdWdpbk5hbWVdW25hbWVdKVxuICAgICAgICBzaG93KClcbiAgICAgICAgQGNoYW5nZVBhcmFtRnNbcGx1Z2luTmFtZV1bbmFtZV0gPSBjaGFuZ2UgPSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgICAgIFBhcmFtU2VsZWN0VmlldyA9IHJlcXVpcmUgJy4vb3V0cHV0LXBhbmVsL3ZpZXdzL3BhcmFtLXNlbGVjdC12aWV3J1xuICAgICAgICAgIG5ldyBQYXJhbVNlbGVjdFZpZXdcbiAgICAgICAgICAgIGl0ZW1zOiBpZiB0eXBlb2Ygc3BlYy5pdGVtcyBpcyAnZnVuY3Rpb24nIHRoZW4gc3BlYy5pdGVtcygpIGVsc2Ugc3BlYy5pdGVtc1xuICAgICAgICAgICAgaGVhZGluZzogc3BlYy5kZXNjcmlwdGlvblxuICAgICAgICAgICAgaXRlbVRlbXBsYXRlOiBzcGVjLml0ZW1UZW1wbGF0ZVxuICAgICAgICAgICAgaXRlbUZpbHRlck5hbWU6IHNwZWMuaXRlbUZpbHRlck5hbWVcbiAgICAgICAgICAgIG9uQ29uZmlybWVkOiAodmFsdWUpID0+XG4gICAgICAgICAgICAgIEBjb25maWdQYXJhbXNbcGx1Z2luTmFtZV1bbmFtZV0gPSB2YWx1ZVxuICAgICAgICAgICAgICBzaG93KClcbiAgICAgICAgICAgICAgcmVzb2x2ZT8odmFsdWUpXG4gICAgICAgICAgICBvbkNhbmNlbGxlZDogLT5cbiAgICAgICAgICAgICAgcmVqZWN0PygpXG4gICAgICAgIGRpc3AuYWRkIEBvdXRwdXRWaWV3LmFkZFBhbmVsQ29udHJvbCBlbGVtLFxuICAgICAgICAgIGV2ZW50czpcbiAgICAgICAgICAgIGNsaWNrOiAtPiBjaGFuZ2UoKVxuICAgICAgICAgIGJlZm9yZTogJyNwcm9ncmVzc0JhcidcbiAgICByZXR1cm4gZGlzcFxuXG4gIGdldENvbmZpZ1BhcmFtOiAocGx1Z2luTmFtZSwgbmFtZSkgLT5cbiAgICB1bmxlc3MgYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VBY3RpdmUocGx1Z2luTmFtZSlcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcbiAgICAgICAgbWtFcnJvcignUGFja2FnZUluYWN0aXZlRXJyb3InLFxuICAgICAgICAgIFwiSWRlLWhhc2tlbGwgY2Fubm90IGdldCBwYXJhbWV0ZXIgI3twbHVnaW5OYW1lfToje25hbWV9XG4gICAgICAgICAgIG9mIGluYWN0aXZlIHBhY2thZ2UgI3twbHVnaW5OYW1lfVwiKSlcbiAgICBpZiBAY29uZmlnUGFyYW1zW3BsdWdpbk5hbWVdP1tuYW1lXT9cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoQGNvbmZpZ1BhcmFtc1twbHVnaW5OYW1lXVtuYW1lXSlcbiAgICBlbHNlIGlmIEBjaGFuZ2VQYXJhbUZzW3BsdWdpbk5hbWVdP1tuYW1lXT9cbiAgICAgIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICAgIEBjaGFuZ2VQYXJhbUZzW3BsdWdpbk5hbWVdW25hbWVdKHJlc29sdmUsIHJlamVjdClcbiAgICBlbHNlXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXG4gICAgICAgIG1rRXJyb3IoJ1BhcmFtVW5kZWZpbmVkRXJyb3InLFxuICAgICAgICAgIFwiSWRlLWhhc2tlbGwgY2Fubm90IGdldCBwYXJhbWV0ZXIgI3twbHVnaW5OYW1lfToje25hbWV9XG4gICAgICAgICAgIGJlZm9yZSBpdCBpcyBkZWZpbmVkXCIpKVxuXG4gIHNldENvbmZpZ1BhcmFtOiAocGx1Z2luTmFtZSwgbmFtZSwgdmFsdWUpIC0+XG4gICAgdW5sZXNzIGF0b20ucGFja2FnZXMuaXNQYWNrYWdlQWN0aXZlKHBsdWdpbk5hbWUpXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXG4gICAgICAgIG1rRXJyb3IoJ1BhY2thZ2VJbmFjdGl2ZUVycm9yJyxcbiAgICAgICAgICBcIklkZS1oYXNrZWxsIGNhbm5vdCBzZXQgcGFyYW1ldGVyICN7cGx1Z2luTmFtZX06I3tuYW1lfVxuICAgICAgICAgICBvZiBpbmFjdGl2ZSBwYWNrYWdlICN7cGx1Z2luTmFtZX1cIikpXG4gICAgaWYgdmFsdWU/XG4gICAgICBAY29uZmlnUGFyYW1zW3BsdWdpbk5hbWVdID89IHt9XG4gICAgICBAY29uZmlnUGFyYW1zW3BsdWdpbk5hbWVdW25hbWVdID0gdmFsdWVcbiAgICAgIFByb21pc2UucmVzb2x2ZSh2YWx1ZSlcbiAgICBlbHNlIGlmIEBjaGFuZ2VQYXJhbUZzW3BsdWdpbk5hbWVdP1tuYW1lXT9cbiAgICAgIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICAgIEBjaGFuZ2VQYXJhbUZzW3BsdWdpbk5hbWVdW25hbWVdKHJlc29sdmUsIHJlamVjdClcbiAgICBlbHNlXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXG4gICAgICAgIG1rRXJyb3IoJ1BhcmFtVW5kZWZpbmVkRXJyb3InLFxuICAgICAgICAgIFwiSWRlLWhhc2tlbGwgY2Fubm90IHNldCBwYXJhbWV0ZXIgI3twbHVnaW5OYW1lfToje25hbWV9XG4gICAgICAgICAgIGJlZm9yZSBpdCBpcyBkZWZpbmVkXCIpKVxuIl19

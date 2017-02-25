(function() {
  var CompositeDisposable, MainMenuLabel, Point, UPI, UPIInstance, getEventType, _ref, _ref1;

  _ref = require('atom'), CompositeDisposable = _ref.CompositeDisposable, Point = _ref.Point;

  _ref1 = require('./utils'), MainMenuLabel = _ref1.MainMenuLabel, getEventType = _ref1.getEventType;

  module.exports = UPI = (function() {
    function UPI(pluginManager) {
      this.pluginManager = pluginManager;
    }


    /*
    Call this function in consumer to get actual interface
    
    disposables: CompositeDisposable, one you will return in consumer
    name: Plugin package name
     */

    UPI.prototype.registerPlugin = function(disposables, name) {
      return new UPIInstance(this.pluginManager, disposables, name);
    };

    return UPI;

  })();

  UPIInstance = (function() {
    function UPIInstance(pluginManager, disposables, pluginName) {
      this.pluginManager = pluginManager;
      this.pluginName = pluginName;
      disposables.add(this.disposables = new CompositeDisposable);
    }


    /*
    Adds new sumbenu to 'Haskell IDE' menu item
    name -- submenu label, should be descriptive of a package
    menu -- Atom menu object
    
    Returns Disposable.
     */

    UPIInstance.prototype.setMenu = function(name, menu) {
      var menuDisp;
      this.disposables.add(menuDisp = atom.menu.add([
        {
          label: MainMenuLabel,
          submenu: [
            {
              label: name,
              submenu: menu
            }
          ]
        }
      ]));
      return menuDisp;
    };


    /*
    Sets backend status
    status -- object
      status: one of 'progress', 'ready', 'error', 'warning'
      progress: float between 0 and 1, only relevant when status is 'progress'
                if 0 or undefined, progress bar is not shown
     */

    UPIInstance.prototype.setStatus = function(status) {
      return this.pluginManager.outputView.backendStatus(status);
    };


    /*
    Add messages to ide-haskell output
    messages: Array of Object
      uri: String, File URI message relates to
      position: Point, or Point-like Object, position to which message relates
      message: String or {<text | html>, highlighter?}, message
      severity: String, one of 'error', 'warning', 'lint', 'build',
                or user-defined, see `setMessageTypes`
    types: Array of String, containing possible message `severity`. If undefined,
           will be taken from `messages`
     */

    UPIInstance.prototype.addMessages = function(messages, types) {
      messages = messages.map(function(m) {
        if (m.position != null) {
          m.position = Point.fromObject(m.position);
        }
        return m;
      });
      return this.pluginManager.checkResults.appendResults(messages, types);
    };


    /*
    Set messages in ide-haskell output. Clears all existing messages with
    `severity` in `types`
    messages: Array of Object
      uri: String, File URI message relates to
      position: Point, or Point-like Object, position to which message relates
      message: String, message
      severity: String, one of 'error', 'warning', 'lint', 'build',
                or user-defined, see `setMessageTypes`
    types: Array of String, containing possible message `severity`. If undefined,
           will be taken from `messages`
     */

    UPIInstance.prototype.setMessages = function(messages, types) {
      messages = messages.map(function(m) {
        if (m.position != null) {
          m.position = Point.fromObject(m.position);
        }
        return m;
      });
      return this.pluginManager.checkResults.setResults(messages, types);
    };


    /*
    Clear all existing messages with `severity` in `types`
    This is shorthand from `setMessages([],types)`
     */

    UPIInstance.prototype.clearMessages = function(types) {
      return this.pluginManager.checkResults.setResults([], types);
    };


    /*
    Set possible message `severity` that your package will use.
    types: Object with keys representing possible message `severity` (i.e. tab name)
           and values being Objects with keys
      uriFilter: Bool, should uri filter apply to tab?
      autoScroll: Bool, should tab auto-scroll?
    
    This allows to define custom output panel tabs.
     */

    UPIInstance.prototype.setMessageTypes = function(types) {
      var opts, type, _results;
      _results = [];
      for (type in types) {
        opts = types[type];
        _results.push(this.pluginManager.outputView.createTab(type, opts));
      }
      return _results;
    };


    /*
    Editor event subscription. Fires when mouse cursor stopped over a symbol in
    editor.
    
    callback: callback(editor, crange, type)
      editor: TextEditor, editor that generated event
      crange: Range, cursor range that generated event.
      type: One of 'mouse', 'selection' -- type of event that triggered this
    
      Returns {range, text} or Promise.
        range: Range, tooltip highlighting range
        text: tooltip text. String or {text, highlighter} or {html}
          text: tooltip text
          highlighter: grammar scope that will be used to highlight tooltip text
          html: html to be displayed in tooltip
    
    returns Disposable
     */

    UPIInstance.prototype.onShouldShowTooltip = function(callback) {
      var disp;
      this.disposables.add(disp = this.pluginManager.onShouldShowTooltip((function(_this) {
        return function(_arg) {
          var editor, eventType, pos;
          editor = _arg.editor, pos = _arg.pos, eventType = _arg.eventType;
          return _this.showTooltip({
            editor: editor,
            pos: pos,
            eventType: eventType,
            tooltip: function(crange) {
              var res;
              res = callback(editor, crange, eventType);
              if (res != null) {
                return Promise.resolve(res);
              } else {
                return Promise.reject({
                  ignore: true
                });
              }
            }
          });
        };
      })(this)));
      return disp;
    };


    /*
    Show tooltip in editor.
    
    editor: editor that will show tooltip
    pos: tooltip position
    eventType: one of 'context', 'keyboard' and 'mouse'
    detail: for automatic selection between 'context' and 'keyboard'.
            Ignored if 'eventType' is set.
    tooltip: function(crange)
      crange: Range, currently selected range in editor (possibly empty)
    
      Returns {range, text} or Promise
        range: Range, tooltip highlighting range
        text: tooltip text. String or {text, highlighter} or {html}
          text: tooltip text
          highlighter: grammar scope that will be used to highlight tooltip text
          html: html to be displayed in tooltip
     */

    UPIInstance.prototype.showTooltip = function(_arg) {
      var controller, detail, editor, eventType, pos, tooltip;
      editor = _arg.editor, pos = _arg.pos, eventType = _arg.eventType, detail = _arg.detail, tooltip = _arg.tooltip;
      controller = this.pluginManager.controller(editor);
      return this.withEventRange({
        controller: controller,
        pos: pos,
        detail: detail,
        eventType: eventType
      }, (function(_this) {
        return function(_arg1) {
          var crange, eventType, pos;
          crange = _arg1.crange, pos = _arg1.pos, eventType = _arg1.eventType;
          return tooltip(crange).then(function(_arg2) {
            var range, text;
            range = _arg2.range, text = _arg2.text;
            return controller.showTooltip(pos, range, text, {
              eventType: eventType,
              subtype: 'external'
            });
          })["catch"](function(status) {
            if (status == null) {
              status = {
                status: 'warning'
              };
            }
            if (status instanceof Error) {
              console.warn(status);
              status = {
                status: 'warning'
              };
            }
            if (!status.ignore) {
              controller.hideTooltip({
                eventType: eventType
              });
              return _this.setStatus(status);
            }
          });
        };
      })(this));
    };


    /*
    Convenience function. Will fire before Haskell buffer is saved.
    
    callback: callback(buffer)
      buffer: TextBuffer, buffer that generated event
    
    Returns Disposable
     */

    UPIInstance.prototype.onWillSaveBuffer = function(callback) {
      var disp;
      this.disposables.add(disp = this.pluginManager.onWillSaveBuffer(callback));
      return disp;
    };


    /*
    Convenience function. Will fire after Haskell buffer is saved.
    
    callback: callback(buffer)
      buffer: TextBuffer, buffer that generated event
    
    Returns Disposable
     */

    UPIInstance.prototype.onDidSaveBuffer = function(callback) {
      var disp;
      this.disposables.add(disp = this.pluginManager.onDidSaveBuffer(callback));
      return disp;
    };

    UPIInstance.prototype.onDidStopChanging = function(callback) {
      var disp;
      this.disposables.add(disp = this.pluginManager.onDidStopChanging(callback));
      return disp;
    };


    /*
    Add a new control to ouptut panel heading.
    
    element: HTMLElement of control, or String with tag name
    opts: various options
      id: String, id
      events: Object, event callbacks, key is event name, e.g. "click",
              value is callback
      classes: Array of String, classes
      style: Object, css style, keys are style attributes, values are values
      attrs: Object, other attributes, keys are attribute names, values are values
      before: String, CSS selector of element, that this one should be inserted
              before, e.g. '#progressBar'
    
    Returns Disposable.
     */

    UPIInstance.prototype.addPanelControl = function(element, opts) {
      return this.pluginManager.outputView.addPanelControl(element, opts);
    };


    /*
    addConfigParam
      param_name:
        onChanged: callback void(value)
        items: Array or callback Array(void)
        itemTemplate: callback, String(item), html template
        itemFilterKey: String, item filter key
        description: String [optional]
        displayName: String [optional, capitalized param_name default]
        displayTemplate: callback, String(item), string template
        default: item, default value
    
    Returns
      disp: Disposable
      change: object of change functions, keys being param_name
     */

    UPIInstance.prototype.addConfigParam = function(spec) {
      return this.pluginManager.addConfigParam(this.pluginName, spec);
    };


    /*
    getConfigParam(paramName) or getConfigParam(pluginName, paramName)
    
    returns a Promise that resolves to parameter
    value.
    
    Promise can be rejected with either error, or 'undefined'. Latter
    in case user cancels param selection dialog.
     */

    UPIInstance.prototype.getConfigParam = function(pluginName, name) {
      if (name == null) {
        name = pluginName;
        pluginName = this.pluginName;
      }
      return this.pluginManager.getConfigParam(pluginName, name);
    };


    /*
    setConfigParam(paramName, value) or setConfigParam(pluginName, paramName, value)
    
    value is optional. If omitted, a selection dialog will be presented to user.
    
    returns a Promise that resolves to parameter value.
    
    Promise can be rejected with either error, or 'undefined'. Latter
    in case user cancels param selection dialog.
     */

    UPIInstance.prototype.setConfigParam = function(pluginName, name, value) {
      if (value == null) {
        value = name;
        name = pluginName;
        pluginName = this.pluginName;
      }
      return this.pluginManager.setConfigParam(pluginName, name, value);
    };


    /*
    Utility function to extract event range/type for a given event
    
    editor: TextEditor, editor that generated event
    detail: event detail, ignored if eventType is set
    eventType: String, event type, one of 'keyboard', 'context', 'mouse'
    pos: Point, or Point-like Object, event position, can be undefined
    controller: leave undefined, this is internal field
    
    callback: callback({pos, crange}, eventType)
      pos: Point, event position
      crange: Range, event range
      eventType: String, event type, one of 'keyboard', 'context', 'mouse'
     */

    UPIInstance.prototype.withEventRange = function(_arg, callback) {
      var controller, detail, editor, eventType, pos;
      editor = _arg.editor, detail = _arg.detail, eventType = _arg.eventType, pos = _arg.pos, controller = _arg.controller;
      if (pos != null) {
        pos = Point.fromObject(pos);
      }
      if (eventType == null) {
        eventType = getEventType(detail);
      }
      if (controller == null) {
        controller = this.pluginManager.controller(editor);
      }
      if (controller == null) {
        return;
      }
      return callback(controller.getEventRange(pos, eventType));
    };

    return UPIInstance;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvdXBpLmNvZmZlZSIKICBdLAogICJuYW1lcyI6IFtdLAogICJtYXBwaW5ncyI6ICJBQUFBO0FBQUEsTUFBQSxzRkFBQTs7QUFBQSxFQUFBLE9BQStCLE9BQUEsQ0FBUSxNQUFSLENBQS9CLEVBQUMsMkJBQUEsbUJBQUQsRUFBc0IsYUFBQSxLQUF0QixDQUFBOztBQUFBLEVBQ0EsUUFBZ0MsT0FBQSxDQUFRLFNBQVIsQ0FBaEMsRUFBQyxzQkFBQSxhQUFELEVBQWdCLHFCQUFBLFlBRGhCLENBQUE7O0FBQUEsRUFHQSxNQUFNLENBQUMsT0FBUCxHQUNNO0FBQ1MsSUFBQSxhQUFFLGFBQUYsR0FBQTtBQUFrQixNQUFqQixJQUFDLENBQUEsZ0JBQUEsYUFBZ0IsQ0FBbEI7SUFBQSxDQUFiOztBQUVBO0FBQUE7Ozs7O09BRkE7O0FBQUEsa0JBUUEsY0FBQSxHQUFnQixTQUFDLFdBQUQsRUFBYyxJQUFkLEdBQUE7YUFDVixJQUFBLFdBQUEsQ0FBWSxJQUFDLENBQUEsYUFBYixFQUE0QixXQUE1QixFQUF5QyxJQUF6QyxFQURVO0lBQUEsQ0FSaEIsQ0FBQTs7ZUFBQTs7TUFMRixDQUFBOztBQUFBLEVBZ0JNO0FBQ1MsSUFBQSxxQkFBRSxhQUFGLEVBQWlCLFdBQWpCLEVBQStCLFVBQS9CLEdBQUE7QUFDWCxNQURZLElBQUMsQ0FBQSxnQkFBQSxhQUNiLENBQUE7QUFBQSxNQUR5QyxJQUFDLENBQUEsYUFBQSxVQUMxQyxDQUFBO0FBQUEsTUFBQSxXQUFXLENBQUMsR0FBWixDQUFnQixJQUFDLENBQUEsV0FBRCxHQUFlLEdBQUEsQ0FBQSxtQkFBL0IsQ0FBQSxDQURXO0lBQUEsQ0FBYjs7QUFHQTtBQUFBOzs7Ozs7T0FIQTs7QUFBQSwwQkFVQSxPQUFBLEdBQVMsU0FBQyxJQUFELEVBQU8sSUFBUCxHQUFB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

//# sourceURL=/Users/erewok/.atom/packages/ide-haskell/lib/upi.coffee

(function() {
  var OutputPanelElement, OutputPanelView,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  module.exports = OutputPanelView = (function(_super) {
    __extends(OutputPanelView, _super);

    function OutputPanelView() {
      return OutputPanelView.__super__.constructor.apply(this, arguments);
    }

    OutputPanelView.prototype.setModel = function(model) {
      var _ref, _ref1, _ref2;
      this.model = model;
      this.disposables.add(this.model.results.onDidUpdate((function(_this) {
        return function(_arg) {
          var types;
          types = _arg.types;
          if (atom.config.get('ide-haskell.switchTabOnCheck')) {
            _this.activateFirstNonEmptyTab(types);
          }
          return _this.updateItems();
        };
      })(this)));
      this.items.setModel(this.model.results);
      if (((_ref = this.model.state) != null ? _ref.height : void 0) != null) {
        this.style.height = this.model.state.height;
      }
      if (((_ref1 = this.model.state) != null ? _ref1.width : void 0) != null) {
        this.style.width = this.model.state.width;
      }
      this.activateTab((_ref2 = this.model.state.activeTab) != null ? _ref2 : this.buttons.buttonNames()[0]);
      this.buttons.setFileFilter(this.model.state.fileFilter);
      return this;
    };

    OutputPanelView.prototype.createdCallback = function() {
      var OutputPanelButtonsElement, OutputPanelItemsElement, ProgressBar, SubAtom;
      SubAtom = require('sub-atom');
      this.disposables = new SubAtom;
      this.appendChild(this.resizeHandle = document.createElement('resize-handle'));
      this.initResizeHandle();
      this.appendChild(this.heading = document.createElement('ide-haskell-panel-heading'));
      this.disposables.add(this.addPanelControl('ide-haskell-status-icon', {
        id: 'status',
        attrs: {
          'data-status': 'ready'
        }
      }));
      OutputPanelButtonsElement = require('./output-panel-buttons');
      this.disposables.add(this.addPanelControl(new OutputPanelButtonsElement, {
        id: 'buttons'
      }));
      ProgressBar = require('./progress-bar');
      this.disposables.add(this.addPanelControl(new ProgressBar, {
        id: 'progressBar'
      }));
      this.progressBar.setProgress(0);
      OutputPanelItemsElement = require('./output-panel-items');
      this.appendChild(this.items = new OutputPanelItemsElement);
      this.disposables.add(this.buttons.onButtonClicked((function(_this) {
        return function() {
          return _this.updateItems();
        };
      })(this)));
      this.disposables.add(this.buttons.onCheckboxSwitched((function(_this) {
        return function() {
          return _this.updateItems();
        };
      })(this)));
      return this.disposables.add(atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {
          if (_this.buttons.getFileFilter()) {
            return _this.updateItems();
          }
        };
      })(this)));
    };

    OutputPanelView.prototype.addPanelControl = function(element, _arg) {
      var Disposable, SubAtom, a, action, attrs, before, classes, cls, disp, event, events, id, s, style, v, _i, _len;
      events = _arg.events, classes = _arg.classes, style = _arg.style, attrs = _arg.attrs, before = _arg.before, id = _arg.id;
      Disposable = require('atom').Disposable;
      if ((id != null) && this[id]) {
        return new Disposable(function() {});
      }
      if (typeof element === 'string') {
        element = document.createElement(element);
      }
      if (id != null) {
        element.id = id;
        this[id] = element;
      }
      SubAtom = require('sub-atom');
      disp = new SubAtom;
      disp.add(new Disposable(function() {
        if (id != null) {
          delete this[id];
        }
        element.remove();
        return typeof element.destroy === "function" ? element.destroy() : void 0;
      }));
      if (classes != null) {
        for (_i = 0, _len = classes.length; _i < _len; _i++) {
          cls = classes[_i];
          element.classList.add(cls);
        }
      }
      if (style != null) {
        for (s in style) {
          v = style[s];
          element.style.setProperty(s, v);
        }
      }
      if (attrs != null) {
        for (a in attrs) {
          v = attrs[a];
          element.setAttribute(a, v);
        }
      }
      if (events != null) {
        for (event in events) {
          action = events[event];
          disp.add(element, event, action);
        }
      }
      if (before != null) {
        before = this.heading.querySelector(before);
      }
      if (before != null) {
        before.parentElement.insertBefore(element, before);
      } else {
        this.heading.appendChild(element);
      }
      this.disposables.add(disp);
      return disp;
    };


    /*
    Note: can't use detachedCallback here, since when panel
    is reattached, it is called, and panel items are
    detached
     */

    OutputPanelView.prototype.destroy = function() {
      this.remove();
      this.items.destroy();
      return this.disposables.dispose();
    };

    OutputPanelView.prototype.setPanelPosition = function(pos) {
      this.pos = pos;
      return this.setAttribute('data-pos', this.pos);
    };

    OutputPanelView.prototype.initResizeHandle = function() {
      return this.disposables.add(this.resizeHandle, 'mousedown', (function(_this) {
        return function(e) {
          var dir, doDrag, startHeight, startWidth, startX, startY, stopDrag;
          doDrag = (function() {
            switch (this.pos) {
              case 'top':
              case 'bottom':
                startY = e.clientY;
                startHeight = parseInt(document.defaultView.getComputedStyle(this).height, 10);
                dir = (function() {
                  switch (this.pos) {
                    case 'top':
                      return 1;
                    case 'bottom':
                      return -1;
                  }
                }).call(this);
                return (function(_this) {
                  return function(e) {
                    return _this.style.height = (startHeight + dir * (e.clientY - startY)) + 'px';
                  };
                })(this);
              case 'left':
              case 'right':
                startX = e.clientX;
                startWidth = parseInt(document.defaultView.getComputedStyle(this).width, 10);
                dir = (function() {
                  switch (this.pos) {
                    case 'left':
                      return 1;
                    case 'right':
                      return -1;
                  }
                }).call(this);
                return (function(_this) {
                  return function(e) {
                    return _this.style.width = (startWidth + dir * (e.clientX - startX)) + 'px';
                  };
                })(this);
            }
          }).call(_this);
          stopDrag = function(e) {
            document.documentElement.removeEventListener('mousemove', doDrag);
            return document.documentElement.removeEventListener('mouseup', stopDrag);
          };
          document.documentElement.addEventListener('mousemove', doDrag);
          return document.documentElement.addEventListener('mouseup', stopDrag);
        };
      })(this));
    };

    OutputPanelView.prototype.updateItems = function() {
      var activeTab, btn, f, filter, scroll, uri, _i, _len, _ref, _ref1, _results;
      activeTab = this.getActiveTab();
      filter = {
        severity: activeTab
      };
      if (this.buttons.getFileFilter()) {
        uri = (_ref = atom.workspace.getActiveTextEditor()) != null ? typeof _ref.getPath === "function" ? _ref.getPath() : void 0 : void 0;
        if ((uri != null) && this.buttons.options(activeTab).uriFilter) {
          filter.uri = uri;
        }
      }
      scroll = this.buttons.options(activeTab).autoScroll && this.items.atEnd();
      this.items.filter(filter);
      if (scroll) {
        this.items.scrollToEnd();
      }
      _ref1 = this.buttons.buttonNames();
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        btn = _ref1[_i];
        f = {
          severity: btn
        };
        if ((uri != null) && this.buttons.options(btn).uriFilter) {
          f.uri = uri;
        }
        _results.push(this.buttons.setCount(btn, this.model.results.filter(f).length));
      }
      return _results;
    };

    OutputPanelView.prototype.activateTab = function(tab) {
      return this.buttons.clickButton(tab);
    };

    OutputPanelView.prototype.activateFirstNonEmptyTab = function(types) {
      var name, _i, _len, _ref, _results;
      _ref = this.buttons.buttonNames();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        if ((types != null ? __indexOf.call(types, name) >= 0 : true)) {
          if ((this.model.results.filter({
            severity: name
          })).length > 0) {
            this.activateTab(name);
            break;
          } else {
            _results.push(void 0);
          }
        }
      }
      return _results;
    };

    OutputPanelView.prototype.statusChanged = function(_arg) {
      var oldStatus, prio, status;
      status = _arg.status, oldStatus = _arg.oldStatus;
      prio = {
        progress: 0,
        error: 20,
        warning: 10,
        ready: 0
      };
      if (prio[status] >= prio[oldStatus] || status === 'progress') {
        return this.status.setAttribute('data-status', status);
      }
    };

    OutputPanelView.prototype.showItem = function(item) {
      this.activateTab(item.severity);
      return this.items.showItem(item);
    };

    OutputPanelView.prototype.getActiveTab = function() {
      return this.buttons.getActive();
    };

    OutputPanelView.prototype.createTab = function(name, opts) {
      if (__indexOf.call(this.buttons.buttonNames(), name) < 0) {
        this.buttons.createButton(name, opts);
      }
      if (this.getActiveTab() == null) {
        return this.activateTab(this.buttons.buttonNames()[0]);
      }
    };

    OutputPanelView.prototype.setProgress = function(progress) {
      return this.progressBar.setProgress(progress);
    };

    return OutputPanelView;

  })(HTMLElement);

  OutputPanelElement = document.registerElement('ide-haskell-panel', {
    prototype: OutputPanelView.prototype
  });

  module.exports = OutputPanelElement;

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvb3V0cHV0LXBhbmVsL3ZpZXdzL291dHB1dC1wYW5lbC5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLE1BQUEsbUNBQUE7SUFBQTs7eUpBQUE7O0FBQUEsRUFBQSxNQUFNLENBQUMsT0FBUCxHQUNNO0FBQ0osc0NBQUEsQ0FBQTs7OztLQUFBOztBQUFBLDhCQUFBLFFBQUEsR0FBVSxTQUFFLEtBQUYsR0FBQTtBQUNSLFVBQUEsa0JBQUE7QUFBQSxNQURTLElBQUMsQ0FBQSxRQUFBLEtBQ1YsQ0FBQTtBQUFBLE1BQUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQWYsQ0FBMkIsQ0FBQSxTQUFBLEtBQUEsR0FBQTtlQUFBLFNBQUMsSUFBRCxHQUFBO0FBQzFDLGNBQUEsS0FBQTtBQUFBLFVBRDRDLFFBQUQsS0FBQyxLQUM1QyxDQUFBO0FBQUEsVUFBQSxJQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiw4QkFBaEIsQ0FBSDtBQUNFLFlBQUEsS0FBQyxDQUFBLHdCQUFELENBQTBCLEtBQTFCLENBQUEsQ0FERjtXQUFBO2lCQUVBLEtBQUMsQ0FBQSxXQUFELENBQUEsRUFIMEM7UUFBQSxFQUFBO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUEzQixDQUFqQixDQUFBLENBQUE7QUFBQSxNQUlBLElBQUMsQ0FBQSxLQUFLLENBQUMsUUFBUCxDQUFnQixJQUFDLENBQUEsS0FBSyxDQUFDLE9BQXZCLENBSkEsQ0FBQTtBQU1BLE1BQUEsSUFBdUMsa0VBQXZDO0FBQUEsUUFBQSxJQUFDLENBQUEsS0FBSyxDQUFDLE1BQVAsR0FBZ0IsSUFBQyxDQUFBLEtBQUssQ0FBQyxL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

//# sourceURL=/Users/erewok/.atom/packages/ide-haskell/lib/output-panel/views/output-panel.coffee

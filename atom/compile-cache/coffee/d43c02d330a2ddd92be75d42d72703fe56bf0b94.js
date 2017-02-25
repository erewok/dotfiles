(function() {
  var OutputPanelElement, OutputPanelView,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  module.exports = OutputPanelView = (function(superClass) {
    extend(OutputPanelView, superClass);

    function OutputPanelView() {
      return OutputPanelView.__super__.constructor.apply(this, arguments);
    }

    OutputPanelView.prototype.setModel = function(model) {
      var ref, ref1;
      this.model = model;
      this.disposables.add(this.model.results.onDidUpdate((function(_this) {
        return function(arg) {
          var types;
          types = arg.types;
          if (atom.config.get('ide-haskell.autoHideOutput') && types.map(function(type) {
            return _this.model.results.filter({
              severity: type
            }).length;
          }).every(function(l) {
            return l === 0;
          })) {
            _this.buttons.disableAll();
          } else {
            if (atom.config.get('ide-haskell.switchTabOnCheck')) {
              _this.activateFirstNonEmptyTab(types);
            }
          }
          return _this.updateItems();
        };
      })(this)));
      this.items.setModel(this.model.results);
      if (((ref = this.model.state) != null ? ref.height : void 0) != null) {
        this.style.height = this.model.state.height;
      }
      if (((ref1 = this.model.state) != null ? ref1.width : void 0) != null) {
        this.style.width = this.model.state.width;
      }
      this.checkboxUriFilter.setFileFilter(this.model.state.fileFilter);
      return this;
    };

    OutputPanelView.prototype.createdCallback = function() {
      var OutputPanelButtonsElement, OutputPanelCheckboxElement, OutputPanelItemsElement, ProgressBar, SubAtom;
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
      OutputPanelCheckboxElement = require('./output-panel-checkbox');
      this.disposables.add(this.addPanelControl(new OutputPanelCheckboxElement, {
        id: 'checkboxUriFilter'
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
      this.disposables.add(this.checkboxUriFilter.onCheckboxSwitched((function(_this) {
        return function() {
          return _this.updateItems();
        };
      })(this)));
      return this.disposables.add(atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {
          if (_this.checkboxUriFilter.getFileFilter()) {
            return _this.updateItems();
          }
        };
      })(this)));
    };

    OutputPanelView.prototype.addPanelControl = function(element, arg) {
      var Disposable, SubAtom, a, action, attrs, before, classes, cls, disp, event, events, i, id, len, s, style, v;
      events = arg.events, classes = arg.classes, style = arg.style, attrs = arg.attrs, before = arg.before, id = arg.id;
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
        for (i = 0, len = classes.length; i < len; i++) {
          cls = classes[i];
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

    OutputPanelView.prototype.setHideParameterValues = function(value) {
      return Array.prototype.slice.call(this.heading.querySelectorAll('ide-haskell-param')).forEach(function(el) {
        if (value) {
          return el.classList.add('hidden-value');
        } else {
          return el.classList.remove('hidden-value');
        }
      });
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
      var activeTab, btn, f, filter, i, len, ref, ref1, results, scroll, uri;
      activeTab = this.getActiveTab();
      if (activeTab != null) {
        this.classList.remove('hidden-output');
        filter = {
          severity: activeTab
        };
        if (this.checkboxUriFilter.getFileFilter()) {
          uri = (ref = atom.workspace.getActiveTextEditor()) != null ? typeof ref.getPath === "function" ? ref.getPath() : void 0 : void 0;
          if ((uri != null) && this.buttons.options(activeTab).uriFilter) {
            filter.uri = uri;
          }
        }
        scroll = this.buttons.options(activeTab).autoScroll && this.items.atEnd();
        this.items.filter(filter);
        if (scroll) {
          this.items.scrollToEnd();
        }
      } else {
        this.classList.add('hidden-output');
      }
      ref1 = this.buttons.buttonNames();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        btn = ref1[i];
        f = {
          severity: btn
        };
        if ((uri != null) && this.buttons.options(btn).uriFilter) {
          f.uri = uri;
        }
        results.push(this.buttons.setCount(btn, this.model.results.filter(f).length));
      }
      return results;
    };

    OutputPanelView.prototype.activateTab = function(tab) {
      return this.buttons.clickButton(tab, true);
    };

    OutputPanelView.prototype.activateFirstNonEmptyTab = function(types) {
      var i, len, name, ref, results;
      ref = this.buttons.buttonNames();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        name = ref[i];
        if ((types != null ? indexOf.call(types, name) >= 0 : true)) {
          if ((this.model.results.filter({
            severity: name
          })).length > 0) {
            this.activateTab(name);
            break;
          } else {
            results.push(void 0);
          }
        }
      }
      return results;
    };

    OutputPanelView.prototype.statusChanged = function(arg) {
      var oldStatus, prio, status;
      status = arg.status, oldStatus = arg.oldStatus;
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
      var ref, ref1;
      if (indexOf.call(this.buttons.buttonNames(), name) < 0) {
        this.buttons.createButton(name, opts);
        if (((ref = this.model.state) != null ? ref.activeTab : void 0) != null) {
          this.activateTab(this.model.state.activeTab);
        }
        if (((ref1 = this.model.state) != null ? ref1.activeTab : void 0) === void 0) {
          return this.activateTab(this.buttons.buttonNames()[0]);
        }
      }
    };

    OutputPanelView.prototype.setProgress = function(progress) {
      switch (atom.config.get('ide-haskell.panelPosition')) {
        case 'top':
        case 'bottom':
          return this.progressBar.setProgress(progress, 'horizontal');
        default:
          return this.progressBar.setProgress(progress, 'vertical');
      }
    };

    return OutputPanelView;

  })(HTMLElement);

  OutputPanelElement = document.registerElement('ide-haskell-panel', {
    prototype: OutputPanelView.prototype
  });

  module.exports = OutputPanelElement;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvb3V0cHV0LXBhbmVsL3ZpZXdzL291dHB1dC1wYW5lbC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLG1DQUFBO0lBQUE7Ozs7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7OzhCQUNKLFFBQUEsR0FBVSxTQUFDLEtBQUQ7QUFDUixVQUFBO01BRFMsSUFBQyxDQUFBLFFBQUQ7TUFDVCxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBZixDQUEyQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsR0FBRDtBQUMxQyxjQUFBO1VBRDRDLFFBQUQ7VUFDM0MsSUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsNEJBQWhCLENBQUEsSUFDQyxLQUFLLENBQUMsR0FBTixDQUFVLFNBQUMsSUFBRDttQkFBVSxLQUFDLENBQUEsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFmLENBQXNCO2NBQUEsUUFBQSxFQUFVLElBQVY7YUFBdEIsQ0FBcUMsQ0FBQztVQUFoRCxDQUFWLENBQWlFLENBQUMsS0FBbEUsQ0FBd0UsU0FBQyxDQUFEO21CQUFPLENBQUEsS0FBSztVQUFaLENBQXhFLENBREo7WUFFRSxLQUFDLENBQUEsT0FBTyxDQUFDLFVBQVQsQ0FBQSxFQUZGO1dBQUEsTUFBQTtZQUlFLElBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLDhCQUFoQixDQUFIO2NBQ0UsS0FBQyxDQUFBLHdCQUFELENBQTBCLEtBQTFCLEVBREY7YUFKRjs7aUJBTUEsS0FBQyxDQUFBLFdBQUQsQ0FBQTtRQVAwQztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBM0IsQ0FBakI7TUFRQSxJQUFDLENBQUEsS0FBSyxDQUFDLFFBQVAs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QUF5QixRQUF6QixFQUFtQyxVQUFuQztBQUpKO0lBRFc7Ozs7S0F4TGU7O0VBK0w5QixrQkFBQSxHQUNFLFFBQVEsQ0FBQyxlQUFULENBQXlCLG1CQUF6QixFQUNFO0lBQUEsU0FBQSxFQUFXLGVBQWUsQ0FBQyxTQUEzQjtHQURGOztFQUdGLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBcE1qQiIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzPVxuY2xhc3MgT3V0cHV0UGFuZWxWaWV3IGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAgc2V0TW9kZWw6IChAbW9kZWwpIC0+XG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAbW9kZWwucmVzdWx0cy5vbkRpZFVwZGF0ZSAoe3R5cGVzfSkgPT5cbiAgICAgIGlmIGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwuYXV0b0hpZGVPdXRwdXQnKSBhbmQgXFxcbiAgICAgICAgICB0eXBlcy5tYXAoKHR5cGUpID0+IEBtb2RlbC5yZXN1bHRzLmZpbHRlcihzZXZlcml0eTogdHlwZSkubGVuZ3RoKS5ldmVyeSgobCkgLT4gbCBpcyAwKVxuICAgICAgICBAYnV0dG9ucy5kaXNhYmxlQWxsKClcbiAgICAgIGVsc2VcbiAgICAgICAgaWYgYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC5zd2l0Y2hUYWJPbkNoZWNrJylcbiAgICAgICAgICBAYWN0aXZhdGVGaXJzdE5vbkVtcHR5VGFiIHR5cGVzXG4gICAgICBAdXBkYXRlSXRlbXMoKVxuICAgIEBpdGVtcy5zZXRNb2RlbCBAbW9kZWwucmVzdWx0c1xuXG4gICAgQHN0eWxlLmhlaWdodCA9IEBtb2RlbC5zdGF0ZS5oZWlnaHQgaWYgQG1vZGVsLnN0YXRlPy5oZWlnaHQ/XG4gICAgQHN0eWxlLndpZHRoID0gQG1vZGVsLnN0YXRlLndpZHRoIGlmIEBtb2RlbC5zdGF0ZT8ud2lkdGg/XG4gICAgQGNoZWNrYm94VXJpRmlsdGVyLnNldEZpbGVGaWx0ZXIgQG1vZGVsLnN0YXRlLmZpbGVGaWx0ZXJcblxuICAgIEBcblxuICBjcmVhdGVkQ2FsbGJhY2s6IC0+XG4gICAgU3ViQXRvbSA9IHJlcXVpcmUgJ3N1Yi1hdG9tJ1xuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBTdWJBdG9tXG4gICAgQGFwcGVuZENoaWxkIEByZXNpemVIYW5kbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdyZXNpemUtaGFuZGxlJ1xuICAgIEBpbml0UmVzaXplSGFuZGxlKClcbiAgICBAYXBwZW5kQ2hpbGQgQGhlYWRpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdpZGUtaGFza2VsbC1wYW5lbC1oZWFkaW5nJ1xuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGFkZFBhbmVsQ29udHJvbCAnaWRlLWhhc2tlbGwtc3RhdHVzLWljb24nLFxuICAgICAgaWQ6ICdzdGF0dXMnXG4gICAgICBhdHRyczpcbiAgICAgICAgJ2RhdGEtc3RhdHVzJzogJ3JlYWR5J1xuICAgIE91dHB1dFBhbmVsQnV0dG9uc0VsZW1lbnQgPSByZXF1aXJlICcuL291dHB1dC1wYW5lbC1idXR0b25zJ1xuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGFkZFBhbmVsQ29udHJvbCBuZXcgT3V0cHV0UGFuZWxCdXR0b25zRWxlbWVudCxcbiAgICAgIGlkOiAnYnV0dG9ucydcbiAgICBPdXRwdXRQYW5lbENoZWNrYm94RWxlbWVudCA9IHJlcXVpcmUgJy4vb3V0cHV0LXBhbmVsLWNoZWNrYm94J1xuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGFkZFBhbmVsQ29udHJvbCBuZXcgT3V0cHV0UGFuZWxDaGVja2JveEVsZW1lbnQsXG4gICAgICBpZDogJ2NoZWNrYm94VXJpRmlsdGVyJ1xuICAgIFByb2dyZXNzQmFyID0gcmVxdWlyZSAnLi9wcm9ncmVzcy1iYXInXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAYWRkUGFuZWxDb250cm9sIG5ldyBQcm9ncmVzc0JhcixcbiAgICAgIGlkOiAncHJvZ3Jlc3NCYXInXG4gICAgQHByb2dyZXNzQmFyLnNldFByb2dyZXNzIDBcblxuICAgIE91dHB1dFBhbmVsSXRlbXNFbGVtZW50ID0gcmVxdWlyZSAnLi9vdXRwdXQtcGFuZWwtaXRlbXMnXG4gICAgQGFwcGVuZENoaWxkIEBpdGVtcyA9IG5ldyBPdXRwdXRQYW5lbEl0ZW1zRWxlbWVudFxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGJ1dHRvbnMub25CdXR0b25DbGlja2VkID0+XG4gICAgICBAdXBkYXRlSXRlbXMoKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGNoZWNrYm94VXJpRmlsdGVyLm9uQ2hlY2tib3hTd2l0Y2hlZCA9PlxuICAgICAgQHVwZGF0ZUl0ZW1zKClcbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20ud29ya3NwYWNlLm9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW0gPT5cbiAgICAgIEB1cGRhdGVJdGVtcygpIGlmIEBjaGVja2JveFVyaUZpbHRlci5nZXRGaWxlRmlsdGVyKClcblxuICBhZGRQYW5lbENvbnRyb2w6IChlbGVtZW50LCB7ZXZlbnRzLCBjbGFzc2VzLCBzdHlsZSwgYXR0cnMsIGJlZm9yZSwgaWR9KSAtPlxuICAgIHtEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG4gICAgaWYgaWQ/IGFuZCBAW2lkXVxuICAgICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlIC0+XG4gICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgZWxlbWVudCBpZiB0eXBlb2YgZWxlbWVudCBpcyAnc3RyaW5nJ1xuICAgIGlmIGlkP1xuICAgICAgZWxlbWVudC5pZCA9IGlkXG4gICAgICBAW2lkXSA9IGVsZW1lbnRcbiAgICBTdWJBdG9tID0gcmVxdWlyZSAnc3ViLWF0b20nXG4gICAgZGlzcCA9IG5ldyBTdWJBdG9tXG4gICAgZGlzcC5hZGQgbmV3IERpc3Bvc2FibGUgLT5cbiAgICAgIGlmIGlkP1xuICAgICAgICBkZWxldGUgQFtpZF1cbiAgICAgIGVsZW1lbnQucmVtb3ZlKClcbiAgICAgIGVsZW1lbnQuZGVzdHJveT8oKVxuICAgIGlmIGNsYXNzZXM/XG4gICAgICBmb3IgY2xzIGluIGNsYXNzZXNcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkIGNsc1xuICAgIGlmIHN0eWxlP1xuICAgICAgZm9yIHMsIHYgb2Ygc3R5bGVcbiAgICAgICAgZWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSBzLCB2XG4gICAgaWYgYXR0cnM/XG4gICAgICBmb3IgYSwgdiBvZiBhdHRyc1xuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSBhLCB2XG4gICAgaWYgZXZlbnRzP1xuICAgICAgZm9yIGV2ZW50LCBhY3Rpb24gb2YgZXZlbnRzXG4gICAgICAgIGRpc3AuYWRkIGVsZW1lbnQsIGV2ZW50LCBhY3Rpb25cblxuICAgIGJlZm9yZSA9IEBoZWFkaW5nLnF1ZXJ5U2VsZWN0b3IoYmVmb3JlKSBpZiBiZWZvcmU/XG4gICAgaWYgYmVmb3JlP1xuICAgICAgYmVmb3JlLnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlIGVsZW1lbnQsIGJlZm9yZVxuICAgIGVsc2VcbiAgICAgIEBoZWFkaW5nLmFwcGVuZENoaWxkIGVsZW1lbnRcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgZGlzcFxuXG4gICAgZGlzcFxuXG4gIHNldEhpZGVQYXJhbWV0ZXJWYWx1ZXM6ICh2YWx1ZSkgLT5cbiAgICBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChAaGVhZGluZy5xdWVyeVNlbGVjdG9yQWxsKCdpZGUtaGFza2VsbC1wYXJhbScpKS5mb3JFYWNoIChlbCkgLT5cbiAgICAgIGlmIHZhbHVlXG4gICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbi12YWx1ZScpXG4gICAgICBlbHNlXG4gICAgICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbi12YWx1ZScpXG5cbiAgIyMjXG4gIE5vdGU6IGNhbid0IHVzZSBkZXRhY2hlZENhbGxiYWNrIGhlcmUsIHNpbmNlIHdoZW4gcGFuZWxcbiAgaXMgcmVhdHRhY2hlZCwgaXQgaXMgY2FsbGVkLCBhbmQgcGFuZWwgaXRlbXMgYXJlXG4gIGRldGFjaGVkXG4gICMjI1xuICBkZXN0cm95OiAtPlxuICAgIEByZW1vdmUoKVxuICAgIEBpdGVtcy5kZXN0cm95KClcbiAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG5cbiAgc2V0UGFuZWxQb3NpdGlvbjogKEBwb3MpIC0+XG4gICAgQHNldEF0dHJpYnV0ZSAnZGF0YS1wb3MnLCBAcG9zXG5cbiAgaW5pdFJlc2l6ZUhhbmRsZTogLT5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEByZXNpemVIYW5kbGUsICdtb3VzZWRvd24nLCAoZSkgPT5cbiAgICAgIGRvRHJhZyA9XG4gICAgICAgIHN3aXRjaCBAcG9zXG4gICAgICAgICAgd2hlbiAndG9wJywgJ2JvdHRvbSdcbiAgICAgICAgICAgIHN0YXJ0WSA9IGUuY2xpZW50WVxuICAgICAgICAgICAgc3RhcnRIZWlnaHQgPSBwYXJzZUludCBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKEApLmhlaWdodCwgMTBcbiAgICAgICAgICAgIGRpciA9IHN3aXRjaCBAcG9zXG4gICAgICAgICAgICAgIHdoZW4gJ3RvcCcgdGhlbiAxXG4gICAgICAgICAgICAgIHdoZW4gJ2JvdHRvbScgdGhlbiAtMVxuICAgICAgICAgICAgKGUpID0+XG4gICAgICAgICAgICAgIEBzdHlsZS5oZWlnaHQgPSAoc3RhcnRIZWlnaHQgKyBkaXIgKiAoZS5jbGllbnRZIC0gc3RhcnRZKSkgKyAncHgnXG4gICAgICAgICAgd2hlbiAnbGVmdCcsICdyaWdodCdcbiAgICAgICAgICAgIHN0YXJ0WCA9IGUuY2xpZW50WFxuICAgICAgICAgICAgc3RhcnRXaWR0aCA9IHBhcnNlSW50IGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoQCkud2lkdGgsIDEwXG4gICAgICAgICAgICBkaXIgPSBzd2l0Y2ggQHBvc1xuICAgICAgICAgICAgICB3aGVuICdsZWZ0JyB0aGVuIDFcbiAgICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gLTFcbiAgICAgICAgICAgIChlKSA9PlxuICAgICAgICAgICAgICBAc3R5bGUud2lkdGggPSAoc3RhcnRXaWR0aCArIGRpciAqIChlLmNsaWVudFggLSBzdGFydFgpKSArICdweCdcblxuICAgICAgc3RvcERyYWcgPSAoZSkgLT5cbiAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ21vdXNlbW92ZScsIGRvRHJhZ1xuICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciAnbW91c2V1cCcsIHN0b3BEcmFnXG5cbiAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hZGRFdmVudExpc3RlbmVyICdtb3VzZW1vdmUnLCBkb0RyYWdcbiAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hZGRFdmVudExpc3RlbmVyICdtb3VzZXVwJywgc3RvcERyYWdcbiAgdXBkYXRlSXRlbXM6IC0+XG4gICAgYWN0aXZlVGFiID0gQGdldEFjdGl2ZVRhYigpXG4gICAgaWYgYWN0aXZlVGFiP1xuICAgICAgQGNsYXNzTGlzdC5yZW1vdmUgJ2hpZGRlbi1vdXRwdXQnXG4gICAgICBmaWx0ZXIgPSBzZXZlcml0eTogYWN0aXZlVGFiXG4gICAgICBpZiBAY2hlY2tib3hVcmlGaWx0ZXIuZ2V0RmlsZUZpbHRlcigpXG4gICAgICAgIHVyaSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKT8uZ2V0UGF0aD8oKVxuICAgICAgICBmaWx0ZXIudXJpID0gdXJpIGlmIHVyaT8gYW5kIEBidXR0b25zLm9wdGlvbnMoYWN0aXZlVGFiKS51cmlGaWx0ZXJcbiAgICAgIHNjcm9sbCA9IEBidXR0b25zLm9wdGlvbnMoYWN0aXZlVGFiKS5hdXRvU2Nyb2xsIGFuZCBAaXRlbXMuYXRFbmQoKVxuICAgICAgQGl0ZW1zLmZpbHRlciBmaWx0ZXJcbiAgICAgIEBpdGVtcy5zY3JvbGxUb0VuZCgpIGlmIHNjcm9sbFxuICAgIGVsc2VcbiAgICAgIEBjbGFzc0xpc3QuYWRkICdoaWRkZW4tb3V0cHV0J1xuXG4gICAgZm9yIGJ0biBpbiBAYnV0dG9ucy5idXR0b25OYW1lcygpXG4gICAgICBmID0gc2V2ZXJpdHk6IGJ0blxuICAgICAgZi51cmkgPSB1cmkgaWYgdXJpPyBhbmQgQGJ1dHRvbnMub3B0aW9ucyhidG4pLnVyaUZpbHRlclxuICAgICAgQGJ1dHRvbnMuc2V0Q291bnQgYnRuLCBAbW9kZWwucmVzdWx0cy5maWx0ZXIoZikubGVuZ3RoXG5cbiAgYWN0aXZhdGVUYWI6ICh0YWIpIC0+XG4gICAgQGJ1dHRvbnMuY2xpY2tCdXR0b24gdGFiLCB0cnVlXG5cbiAgYWN0aXZhdGVGaXJzdE5vbkVtcHR5VGFiOiAodHlwZXMpIC0+XG4gICAgZm9yIG5hbWUgaW4gQGJ1dHRvbnMuYnV0dG9uTmFtZXMoKSB3aGVuIChpZiB0eXBlcz8gdGhlbiBuYW1lIGluIHR5cGVzIGVsc2UgdHJ1ZSlcbiAgICAgIGlmIChAbW9kZWwucmVzdWx0cy5maWx0ZXIgc2V2ZXJpdHk6IG5hbWUpLmxlbmd0aCA+IDBcbiAgICAgICAgQGFjdGl2YXRlVGFiIG5hbWVcbiAgICAgICAgYnJlYWtcblxuICBzdGF0dXNDaGFuZ2VkOiAoe3N0YXR1cywgb2xkU3RhdHVzfSkgLT5cbiAgICBwcmlvID1cbiAgICAgIHByb2dyZXNzOiAwXG4gICAgICBlcnJvcjogMjBcbiAgICAgIHdhcm5pbmc6IDEwXG4gICAgICByZWFkeTogMFxuICAgIGlmIHByaW9bc3RhdHVzXSA+PSBwcmlvW29sZFN0YXR1c10gb3Igc3RhdHVzIGlzICdwcm9ncmVzcydcbiAgICAgIEBzdGF0dXMuc2V0QXR0cmlidXRlICdkYXRhLXN0YXR1cycsIHN0YXR1c1xuXG4gIHNob3dJdGVtOiAoaXRlbSkgLT5cbiAgICBAYWN0aXZhdGVUYWIgaXRlbS5zZXZlcml0eVxuICAgIEBpdGVtcy5zaG93SXRlbSBpdGVtXG5cbiAgZ2V0QWN0aXZlVGFiOiAtPlxuICAgIEBidXR0b25zLmdldEFjdGl2ZSgpXG5cbiAgY3JlYXRlVGFiOiAobmFtZSwgb3B0cykgLT5cbiAgICB1bmxlc3MgbmFtZSBpbiBAYnV0dG9ucy5idXR0b25OYW1lcygpXG4gICAgICBAYnV0dG9ucy5jcmVhdGVCdXR0b24gbmFtZSwgb3B0c1xuICAgICAgQGFjdGl2YXRlVGFiKEBtb2RlbC5zdGF0ZS5hY3RpdmVUYWIpIGlmIEBtb2RlbC5zdGF0ZT8uYWN0aXZlVGFiP1xuICAgICAgaWYgQG1vZGVsLnN0YXRlPy5hY3RpdmVUYWIgaXMgdW5kZWZpbmVkXG4gICAgICAgIEBhY3RpdmF0ZVRhYihAYnV0dG9ucy5idXR0b25OYW1lcygpWzBdKVxuXG4gIHNldFByb2dyZXNzOiAocHJvZ3Jlc3MpIC0+XG4gICAgc3dpdGNoIGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwucGFuZWxQb3NpdGlvbicpXG4gICAgICB3aGVuICd0b3AnLCAnYm90dG9tJ1xuICAgICAgICBAcHJvZ3Jlc3NCYXIuc2V0UHJvZ3Jlc3MgcHJvZ3Jlc3MsICdob3Jpem9udGFsJ1xuICAgICAgZWxzZVxuICAgICAgICBAcHJvZ3Jlc3NCYXIuc2V0UHJvZ3Jlc3MgcHJvZ3Jlc3MsICd2ZXJ0aWNhbCdcblxuT3V0cHV0UGFuZWxFbGVtZW50ID1cbiAgZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50ICdpZGUtaGFza2VsbC1wYW5lbCcsXG4gICAgcHJvdG90eXBlOiBPdXRwdXRQYW5lbFZpZXcucHJvdG90eXBlXG5cbm1vZHVsZS5leHBvcnRzID0gT3V0cHV0UGFuZWxFbGVtZW50XG4iXX0=

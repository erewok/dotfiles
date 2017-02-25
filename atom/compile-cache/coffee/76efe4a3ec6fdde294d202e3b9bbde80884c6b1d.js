(function() {
  var OutputPanelButtons, OutputPanelButtonsElement,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  module.exports = OutputPanelButtons = (function(superClass) {
    extend(OutputPanelButtons, superClass);

    function OutputPanelButtons() {
      return OutputPanelButtons.__super__.constructor.apply(this, arguments);
    }

    OutputPanelButtons.prototype.createdCallback = function() {
      var Emitter, SubAtom;
      Emitter = require('atom').Emitter;
      SubAtom = require('sub-atom');
      this.disposables = new SubAtom;
      this.disposables.add(this.emitter = new Emitter);
      this.buttons = {};
      ['error', 'warning', 'lint'].forEach((function(_this) {
        return function(btn) {
          return _this.createButton(btn);
        };
      })(this));
      return this.createButton('build', {
        uriFilter: false,
        autoScroll: true
      });
    };

    OutputPanelButtons.prototype.createButton = function(btn, opts) {
      this.buttons[btn] = {
        element: null,
        options: opts != null ? opts : {}
      };
      this.appendChild(this.buttons[btn].element = document.createElement('ide-haskell-button'));
      this.buttons[btn].element.setAttribute('data-caption', btn);
      this.buttons[btn].element.setAttribute('data-count', 0);
      return this.disposables.add(this.buttons[btn].element, 'click', (function(_this) {
        return function() {
          return _this.clickButton(btn);
        };
      })(this));
    };

    OutputPanelButtons.prototype.options = function(btn) {
      var opts;
      opts = this.buttons[btn] != null ? this.buttons[btn].options : {};
      if (opts['uriFilter'] == null) {
        opts['uriFilter'] = true;
      }
      if (opts['autoScroll'] == null) {
        opts['autoScroll'] = false;
      }
      return opts;
    };

    OutputPanelButtons.prototype.onButtonClicked = function(callback) {
      return this.emitter.on('button-clicked', callback);
    };

    OutputPanelButtons.prototype.onCheckboxSwitched = function(callback) {
      return this.emitter.on('checkbox-switched', callback);
    };

    OutputPanelButtons.prototype.buttonNames = function() {
      return Object.keys(this.buttons);
    };

    OutputPanelButtons.prototype.clickButton = function(btn, force) {
      var i, isActive, len, ref, v;
      if (force == null) {
        force = false;
      }
      if (this.buttons[btn] != null) {
        isActive = this.buttons[btn].element.classList.contains('active');
        ref = this.getElementsByClassName('active');
        for (i = 0, len = ref.length; i < len; i++) {
          v = ref[i];
          v.classList.remove('active');
        }
        if (!isActive || force) {
          this.buttons[btn].element.classList.add('active');
        }
        return this.emitter.emit('button-clicked', btn);
      }
    };

    OutputPanelButtons.prototype.disableAll = function() {
      var i, len, ref, results, v;
      ref = this.getElementsByClassName('active');
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        v = ref[i];
        results.push(v.classList.remove('active'));
      }
      return results;
    };

    OutputPanelButtons.prototype.setCount = function(btn, count) {
      if (this.buttons[btn] != null) {
        return this.buttons[btn].element.setAttribute('data-count', count);
      }
    };

    OutputPanelButtons.prototype.destroy = function() {
      this.remove();
      return this.disposables.dispose();
    };

    OutputPanelButtons.prototype.getActive = function() {
      var ref, ref1;
      return (ref = (ref1 = this.getElementsByClassName('active')[0]) != null ? typeof ref1.getAttribute === "function" ? ref1.getAttribute('data-caption') : void 0 : void 0) != null ? ref : null;
    };

    return OutputPanelButtons;

  })(HTMLElement);

  OutputPanelButtonsElement = document.registerElement('ide-haskell-panel-buttons', {
    prototype: OutputPanelButtons.prototype
  });

  module.exports = OutputPanelButtonsElement;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvb3V0cHV0LXBhbmVsL3ZpZXdzL291dHB1dC1wYW5lbC1idXR0b25zLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNkNBQUE7SUFBQTs7O0VBQUEsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7OztpQ0FDSixlQUFBLEdBQWlCLFNBQUE7QUFDZixVQUFBO01BQUMsVUFBVyxPQUFBLENBQVEsTUFBUjtNQUNaLE9BQUEsR0FBVSxPQUFBLENBQVEsVUFBUjtNQUNWLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBSTtNQUNuQixJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJLE9BQWhDO01BQ0EsSUFBQyxDQUFBLE9BQUQsR0FBVztNQUNYLENBQUMsT0FBRCxFQUFVLFNBQVYsRUFBcUIsTUFBckIsQ0FBNEIsQ0FBQyxPQUE3QixDQUFxQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsR0FBRDtpQkFDbkMsS0FBQyxDQUFBLFlBQUQsQ0FBYyxHQUFkO1FBRG1DO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFyQzthQUVBLElBQUMsQ0FBQSxZQUFELENBQWMsT0FBZCxFQUNFO1FBQUEsU0FBQSxFQUFXLEtBQVg7UUFDQSxVQUFBLEVBQVksSUFEWjtPQURGO0lBUmU7O2lDQVlqQixZQUFBLEdBQWMsU0FBQyxHQUFELEVBQU0sSUFBTjtNQUNaLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQSxDQUFULEdBQ0U7UUFBQSxPQUFBLEVBQVMsSUFBVDtRQUNBLE9BQUEsaUJBQVMsT0FBTyxFQURoQjs7TUFFRixJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQSxDQUFJLENBQUMsT0FBZCxHQUF3QixRQUFRLENBQUMsYUFBVCxDQUF1QixvQkFBdkIsQ0FBckM7TUFDQSxJQUFDLENBQUEsT0FBUSxDQUFBLEdBQUEsQ0FBSSxDQUFDLE9BQU8sQ0FBQyxZQUF0QixDQUFtQyxjQUFuQyxFQUFtRCxHQUFuRDtNQUNBLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQSxDQUFJLENBQUMsT0FBTyxDQUFDLFlBQXRCLENBQW1DLFlBQW5DLEVBQWlELENBQWpEO2FBQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQSxDQUFJLENBQUMsT0FBL0IsRUFBd0MsT0FBeEMsRUFBaUQsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLEtBQUMsQ0FBQSxXQUFELENBQWEsR0FBYjtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFqRDtJQVBZOztpQ0FTZCxPQUFBLEdBQVMsU0FBQyxHQUFEO0FBQ1AsVUFBQTtNQUFBLElBQUEsR0FBVSx5QkFBSCxHQUNMLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQSxDQUFJLENBQUMsT0FEVCxHQUdMOztRQUNGLElBQUssQ0FBQSxXQUFBLElBQWdCOzs7UUFDckIsSUFBSyxDQUFBLFlBQUEsSUFBaUI7O2FBQ3RCO0lBUE87O2lDQVNULGVBQUEsR0FBaUIsU0FBQyxRQUFEO2FBQ2YsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksZ0JBQVosRUFBOEIsUUFBOUI7SUFEZTs7aUNBR2pCLGtCQUFBLEdBQW9CLFNBQUMsUUFBRDthQUNsQixJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxtQkFBWixFQUFpQyxRQUFqQztJQURrQjs7aUNBR3BCLFdBQUEsR0FBYSxTQUFBO2FBQ1gsTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFDLENBQUEsT0FBYjtJQURXOztpQ0FHYixXQUFBLEdBQWEsU0FBQyxHQUFELEVBQU0sS0FBTjtBQUNYLFVBQUE7O1FBRGlCLFFBQVE7O01BQ3pCLElBQUcseUJBQUg7UUFDRSxRQUFBLEdBQVcsSUFBQyxDQUFBLE9BQVEsQ0FBQSxHQUFBLENBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFFBQWhDLENBQXlDLFFBQXpDO0FBQ1g7QUFBQSxhQUFBLHFDQUFBOztVQUNFLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBWixDQUFtQixRQUFuQjtBQURGO1FBRUEsSUFBZ0QsQ0FBSSxRQUFKLElBQWdCLEtBQWhFO1VBQUEsSUFBQyxDQUFBLE9BQVEsQ0FBQSxHQUFBLENBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQWhDLENBQW9DLFFBQXBDLEVBQUE7O2VBQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsZ0JBQWQsRUFBZ0MsR0FBaEMsRUFMRjs7SUFEVzs7aUNBUWIsVUFBQSxHQUFZLFNBQUE7QUFDVixVQUFBO0FBQUE7QUFBQTtXQUFBLHFDQUFBOztxQkFDRSxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQVosQ0FBbUIsUUFBbkI7QUFERjs7SUFEVTs7aUNBSVosUUFBQSxHQUFVLFNBQUMsR0FBRCxFQUFNLEtBQU47TUFDUixJQUFHLHlCQUFIO2VBQ0UsSUFBQyxDQUFBLE9BQVEsQ0FBQSxHQUFBLENBQUksQ0FBQyxPQUFPLENBQUMsWUFBdEIsQ0FBbUMsWUFBbkMsRUFBaUQsS0FBakQsRUFERjs7SUFEUTs7aUNBSVYsT0FBQSxHQUFTLFNBQUE7TUFDUCxJQUFDLENBQUEsTUFBRCxDQUFBO2FBQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxPQUFiLENBQUE7SUFGTzs7aUNBSVQsU0FBQSxHQUFXLFNBQUE7QUFDVCxVQUFBOytMQUFzRTtJQUQ3RDs7OztLQTVEb0I7O0VBK0RqQyx5QkFBQSxHQUNFLFFBQVEsQ0FBQyxlQUFULENBQXlCLDJCQUF6QixFQUNFO0lBQUEsU0FBQSxFQUFXLGtCQUFrQixDQUFDLFNBQTlCO0dBREY7O0VBR0YsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUFwRWpCIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHM9XG5jbGFzcyBPdXRwdXRQYW5lbEJ1dHRvbnMgZXh0ZW5kcyBIVE1MRWxlbWVudFxuICBjcmVhdGVkQ2FsbGJhY2s6IC0+XG4gICAge0VtaXR0ZXJ9ID0gcmVxdWlyZSAnYXRvbSdcbiAgICBTdWJBdG9tID0gcmVxdWlyZSAnc3ViLWF0b20nXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IFN1YkF0b21cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAYnV0dG9ucyA9IHt9XG4gICAgWydlcnJvcicsICd3YXJuaW5nJywgJ2xpbnQnXS5mb3JFYWNoIChidG4pID0+XG4gICAgICBAY3JlYXRlQnV0dG9uIGJ0blxuICAgIEBjcmVhdGVCdXR0b24gJ2J1aWxkJyxcbiAgICAgIHVyaUZpbHRlcjogZmFsc2VcbiAgICAgIGF1dG9TY3JvbGw6IHRydWVcblxuICBjcmVhdGVCdXR0b246IChidG4sIG9wdHMpIC0+XG4gICAgQGJ1dHRvbnNbYnRuXSA9XG4gICAgICBlbGVtZW50OiBudWxsXG4gICAgICBvcHRpb25zOiBvcHRzID8ge31cbiAgICBAYXBwZW5kQ2hpbGQgQGJ1dHRvbnNbYnRuXS5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnaWRlLWhhc2tlbGwtYnV0dG9uJ1xuICAgIEBidXR0b25zW2J0bl0uZWxlbWVudC5zZXRBdHRyaWJ1dGUgJ2RhdGEtY2FwdGlvbicsIGJ0blxuICAgIEBidXR0b25zW2J0bl0uZWxlbWVudC5zZXRBdHRyaWJ1dGUgJ2RhdGEtY291bnQnLCAwXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAYnV0dG9uc1tidG5dLmVsZW1lbnQsICdjbGljaycsID0+IEBjbGlja0J1dHRvbiBidG5cblxuICBvcHRpb25zOiAoYnRuKSAtPlxuICAgIG9wdHMgPSBpZiBAYnV0dG9uc1tidG5dP1xuICAgICAgQGJ1dHRvbnNbYnRuXS5vcHRpb25zXG4gICAgZWxzZVxuICAgICAge31cbiAgICBvcHRzWyd1cmlGaWx0ZXInXSA/PSB0cnVlXG4gICAgb3B0c1snYXV0b1Njcm9sbCddID89IGZhbHNlXG4gICAgb3B0c1xuXG4gIG9uQnV0dG9uQ2xpY2tlZDogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdidXR0b24tY2xpY2tlZCcsIGNhbGxiYWNrXG5cbiAgb25DaGVja2JveFN3aXRjaGVkOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2NoZWNrYm94LXN3aXRjaGVkJywgY2FsbGJhY2tcblxuICBidXR0b25OYW1lczogLT5cbiAgICBPYmplY3Qua2V5cyBAYnV0dG9uc1xuXG4gIGNsaWNrQnV0dG9uOiAoYnRuLCBmb3JjZSA9IGZhbHNlKSAtPlxuICAgIGlmIEBidXR0b25zW2J0bl0/XG4gICAgICBpc0FjdGl2ZSA9IEBidXR0b25zW2J0bl0uZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMgJ2FjdGl2ZSdcbiAgICAgIGZvciB2IGluIEBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lICdhY3RpdmUnXG4gICAgICAgIHYuY2xhc3NMaXN0LnJlbW92ZSAnYWN0aXZlJ1xuICAgICAgQGJ1dHRvbnNbYnRuXS5lbGVtZW50LmNsYXNzTGlzdC5hZGQgJ2FjdGl2ZScgaWYgbm90IGlzQWN0aXZlIG9yIGZvcmNlXG4gICAgICBAZW1pdHRlci5lbWl0ICdidXR0b24tY2xpY2tlZCcsIGJ0blxuXG4gIGRpc2FibGVBbGw6IC0+XG4gICAgZm9yIHYgaW4gQGdldEVsZW1lbnRzQnlDbGFzc05hbWUgJ2FjdGl2ZSdcbiAgICAgIHYuY2xhc3NMaXN0LnJlbW92ZSAnYWN0aXZlJ1xuXG4gIHNldENvdW50OiAoYnRuLCBjb3VudCkgLT5cbiAgICBpZiBAYnV0dG9uc1tidG5dP1xuICAgICAgQGJ1dHRvbnNbYnRuXS5lbGVtZW50LnNldEF0dHJpYnV0ZSAnZGF0YS1jb3VudCcsIGNvdW50XG5cbiAgZGVzdHJveTogLT5cbiAgICBAcmVtb3ZlKClcbiAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG5cbiAgZ2V0QWN0aXZlOiAtPlxuICAgIEBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdhY3RpdmUnKVswXT8uZ2V0QXR0cmlidXRlPygnZGF0YS1jYXB0aW9uJykgPyBudWxsXG5cbk91dHB1dFBhbmVsQnV0dG9uc0VsZW1lbnQgPVxuICBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQgJ2lkZS1oYXNrZWxsLXBhbmVsLWJ1dHRvbnMnLFxuICAgIHByb3RvdHlwZTogT3V0cHV0UGFuZWxCdXR0b25zLnByb3RvdHlwZVxuXG5tb2R1bGUuZXhwb3J0cyA9IE91dHB1dFBhbmVsQnV0dG9uc0VsZW1lbnRcbiJdfQ==

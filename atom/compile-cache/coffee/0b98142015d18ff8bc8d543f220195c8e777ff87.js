(function() {
  var OutputPanelButtons, OutputPanelButtonsElement,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = OutputPanelButtons = (function(_super) {
    __extends(OutputPanelButtons, _super);

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
      this.appendChild(this.buttonsContainer = document.createElement('ide-haskell-buttons-container'));
      ['error', 'warning', 'lint'].forEach((function(_this) {
        return function(btn) {
          return _this.createButton(btn);
        };
      })(this));
      this.createButton('build', {
        uriFilter: false,
        autoScroll: true
      });
      this.appendChild(this.cbCurrentFile = document.createElement('ide-haskell-checkbox'));
      return this.disposables.add(this.cbCurrentFile, 'click', (function(_this) {
        return function() {
          return _this.toggleFileFilter();
        };
      })(this));
    };

    OutputPanelButtons.prototype.createButton = function(btn, opts) {
      this.buttons[btn] = {
        element: null,
        options: opts != null ? opts : {}
      };
      this.buttonsContainer.appendChild(this.buttons[btn].element = document.createElement('ide-haskell-button'));
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

    OutputPanelButtons.prototype.clickButton = function(btn) {
      var v, _i, _len, _ref;
      if (this.buttons[btn] != null) {
        _ref = this.getElementsByClassName('active');
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          v = _ref[_i];
          v.classList.remove('active');
        }
        this.buttons[btn].element.classList.add('active');
        return this.emitter.emit('button-clicked', btn);
      }
    };

    OutputPanelButtons.prototype.setFileFilter = function(state) {
      if (state) {
        this.cbCurrentFile.classList.add('enabled');
        return this.emitter.emit('checkbox-switched', true);
      } else {
        this.cbCurrentFile.classList.remove('enabled');
        return this.emitter.emit('checkbox-switched', false);
      }
    };

    OutputPanelButtons.prototype.getFileFilter = function() {
      return this.cbCurrentFile.classList.contains('enabled');
    };

    OutputPanelButtons.prototype.toggleFileFilter = function() {
      return this.setFileFilter(!this.getFileFilter());
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
      var _ref;
      return (_ref = this.getElementsByClassName('active')[0]) != null ? typeof _ref.getAttribute === "function" ? _ref.getAttribute('data-caption') : void 0 : void 0;
    };

    return OutputPanelButtons;

  })(HTMLElement);

  OutputPanelButtonsElement = document.registerElement('ide-haskell-panel-buttons', {
    prototype: OutputPanelButtons.prototype
  });

  module.exports = OutputPanelButtonsElement;

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvb3V0cHV0LXBhbmVsL3ZpZXdzL291dHB1dC1wYW5lbC1idXR0b25zLmNvZmZlZSIKICBdLAogICJuYW1lcyI6IFtdLAogICJtYXBwaW5ncyI6ICJBQUFBO0FBQUEsTUFBQSw2Q0FBQTtJQUFBO21TQUFBOztBQUFBLEVBQUEsTUFBTSxDQUFDLE9BQVAsR0FDTTtBQUNKLHlDQUFBLENBQUE7Ozs7S0FBQTs7QUFBQSxpQ0FBQSxlQUFBLEdBQWlCLFNBQUEsR0FBQTtBQUNmLFVBQUEsZ0JBQUE7QUFBQSxNQUFDLFVBQVcsT0FBQSxDQUFRLE1BQVIsRUFBWCxPQUFELENBQUE7QUFBQSxNQUNBLE9BQUEsR0FBVSxPQUFBLENBQVEsVUFBUixDQURWLENBQUE7QUFBQSxNQUVBLElBQUMsQ0FBQSxXQUFELEdBQWUsR0FBQSxDQUFBLE9BRmYsQ0FBQTtBQUFBLE1BR0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxPQUFELEdBQVcsR0FBQSxDQUFBLE9BQTVCLENBSEEsQ0FBQTtBQUFBLE1BSUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxFQUpYLENBQUE7QUFBQSxNQUtBLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLGdCQUFELEdBQW9CLFFBQVEsQ0FBQyxhQUFULENBQXVCLCtCQUF2QixDQUFqQyxDQUxBLENBQUE7QUFBQSxNQU1BLENBQUMsT0FBRCxFQUFVLFNBQVYsRUFBcUIsTUFBckIsQ0FBNEIsQ0FBQyxPQUE3QixDQUFxQyxDQUFBLFNBQUEsS0FBQSxHQUFBO2VBQUEsU0FBQyxHQUFELEdBQUE7aUJBQ25DLEtBQUMsQ0FBQSxZQUFELENBQWMsR0FBZCxFQURtQztRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJDLENBTkEsQ0FBQTtBQUFBLE1B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

//# sourceURL=/Users/erewok/.atom/packages/ide-haskell/lib/output-panel/views/output-panel-buttons.coffee

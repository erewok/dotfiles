(function() {
  var OutputPanelCheckbox, OutputPanelCheckboxElement,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  OutputPanelCheckbox = (function(superClass) {
    extend(OutputPanelCheckbox, superClass);

    function OutputPanelCheckbox() {
      return OutputPanelCheckbox.__super__.constructor.apply(this, arguments);
    }

    OutputPanelCheckbox.prototype.createdCallback = function() {
      var Emitter, SubAtom;
      Emitter = require('atom').Emitter;
      SubAtom = require('sub-atom');
      this.disposables = new SubAtom;
      this.disposables.add(this.emitter = new Emitter);
      return this.disposables.add(this, 'click', (function(_this) {
        return function() {
          return _this.toggleFileFilter();
        };
      })(this));
    };

    OutputPanelCheckbox.prototype.onCheckboxSwitched = function(callback) {
      return this.emitter.on('checkbox-switched', callback);
    };

    OutputPanelCheckbox.prototype.setFileFilter = function(state) {
      if (state) {
        this.classList.add('enabled');
        return this.emitter.emit('checkbox-switched', true);
      } else {
        this.classList.remove('enabled');
        return this.emitter.emit('checkbox-switched', false);
      }
    };

    OutputPanelCheckbox.prototype.getFileFilter = function() {
      return this.classList.contains('enabled');
    };

    OutputPanelCheckbox.prototype.toggleFileFilter = function() {
      return this.setFileFilter(!this.getFileFilter());
    };

    OutputPanelCheckbox.prototype.destroy = function() {
      this.remove();
      return this.disposables.dispose();
    };

    return OutputPanelCheckbox;

  })(HTMLElement);

  OutputPanelCheckboxElement = document.registerElement('ide-haskell-checkbox', {
    prototype: OutputPanelCheckbox.prototype
  });

  module.exports = OutputPanelCheckboxElement;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvb3V0cHV0LXBhbmVsL3ZpZXdzL291dHB1dC1wYW5lbC1jaGVja2JveC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLCtDQUFBO0lBQUE7OztFQUFNOzs7Ozs7O2tDQUNKLGVBQUEsR0FBaUIsU0FBQTtBQUNmLFVBQUE7TUFBQyxVQUFXLE9BQUEsQ0FBUSxNQUFSO01BQ1osT0FBQSxHQUFVLE9BQUEsQ0FBUSxVQUFSO01BQ1YsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFJO01BQ25CLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUksT0FBaEM7YUFDQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBakIsRUFBdUIsT0FBdkIsRUFBZ0MsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLEtBQUMsQ0FBQSxnQkFBRCxDQUFBO1FBQUg7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWhDO0lBTGU7O2tDQU9qQixrQkFBQSxHQUFvQixTQUFDLFFBQUQ7YUFDbEIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksbUJBQVosRUFBaUMsUUFBakM7SUFEa0I7O2tDQUdwQixhQUFBLEdBQWUsU0FBQyxLQUFEO01BQ2IsSUFBRyxLQUFIO1FBQ0UsSUFBQyxDQUFBLFNBQVMsQ0FBQyxHQUFYLENBQWUsU0FBZjtlQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLG1CQUFkLEVBQW1DLElBQW5DLEVBRkY7T0FBQSxNQUFBO1FBSUUsSUFBQyxDQUFBLFNBQVMsQ0FBQyxNQUFYLENBQWtCLFNBQWxCO2VBQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsbUJBQWQsRUFBbUMsS0FBbkMsRUFMRjs7SUFEYTs7a0NBUWYsYUFBQSxHQUFlLFNBQUE7YUFDYixJQUFDLENBQUEsU0FBUyxDQUFDLFFBQVgsQ0FBb0IsU0FBcEI7SUFEYTs7a0NBR2YsZ0JBQUEsR0FBa0IsU0FBQTthQUNoQixJQUFDLENBQUEsYUFBRCxDQUFlLENBQUksSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQUFuQjtJQURnQjs7a0NBR2xCLE9BQUEsR0FBUyxTQUFBO01BQ1AsSUFBQyxDQUFBLE1BQUQsQ0FBQTthQUNBLElBQUMsQ0FBQSxXQUFXLENBQUMsT0FBYixDQUFBO0lBRk87Ozs7S0F6QnVCOztFQTZCbEMsMEJBQUEsR0FDRSxRQUFRLENBQUMsZUFBVCxDQUF5QixzQkFBekIsRUFDRTtJQUFBLFNBQUEsRUFBVyxtQkFBbUIsQ0FBQyxTQUEvQjtHQURGOztFQUdGLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBakNqQiIsInNvdXJjZXNDb250ZW50IjpbImNsYXNzIE91dHB1dFBhbmVsQ2hlY2tib3ggZXh0ZW5kcyBIVE1MRWxlbWVudFxuICBjcmVhdGVkQ2FsbGJhY2s6IC0+XG4gICAge0VtaXR0ZXJ9ID0gcmVxdWlyZSAnYXRvbSdcbiAgICBTdWJBdG9tID0gcmVxdWlyZSAnc3ViLWF0b20nXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IFN1YkF0b21cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAZGlzcG9zYWJsZXMuYWRkIHRoaXMsICdjbGljaycsID0+IEB0b2dnbGVGaWxlRmlsdGVyKClcblxuICBvbkNoZWNrYm94U3dpdGNoZWQ6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnY2hlY2tib3gtc3dpdGNoZWQnLCBjYWxsYmFja1xuXG4gIHNldEZpbGVGaWx0ZXI6IChzdGF0ZSkgLT5cbiAgICBpZiBzdGF0ZVxuICAgICAgQGNsYXNzTGlzdC5hZGQgJ2VuYWJsZWQnXG4gICAgICBAZW1pdHRlci5lbWl0ICdjaGVja2JveC1zd2l0Y2hlZCcsIHRydWVcbiAgICBlbHNlXG4gICAgICBAY2xhc3NMaXN0LnJlbW92ZSAnZW5hYmxlZCdcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2NoZWNrYm94LXN3aXRjaGVkJywgZmFsc2VcblxuICBnZXRGaWxlRmlsdGVyOiAtPlxuICAgIEBjbGFzc0xpc3QuY29udGFpbnMgJ2VuYWJsZWQnXG5cbiAgdG9nZ2xlRmlsZUZpbHRlcjogLT5cbiAgICBAc2V0RmlsZUZpbHRlciBub3QgQGdldEZpbGVGaWx0ZXIoKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQHJlbW92ZSgpXG4gICAgQGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuXG5PdXRwdXRQYW5lbENoZWNrYm94RWxlbWVudCA9XG4gIGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCAnaWRlLWhhc2tlbGwtY2hlY2tib3gnLFxuICAgIHByb3RvdHlwZTogT3V0cHV0UGFuZWxDaGVja2JveC5wcm90b3R5cGVcblxubW9kdWxlLmV4cG9ydHMgPSBPdXRwdXRQYW5lbENoZWNrYm94RWxlbWVudFxuIl19

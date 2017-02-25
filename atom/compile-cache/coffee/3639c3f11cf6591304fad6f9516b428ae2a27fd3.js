(function() {
  var OutputPanel;

  module.exports = OutputPanel = (function() {
    function OutputPanel(state, results) {
      var CompositeDisposable, OutputPanelElement, pos, ref, ref1;
      this.state = state != null ? state : {};
      this.results = results;
      CompositeDisposable = require('atom').CompositeDisposable;
      this.disposables = new CompositeDisposable;
      pos = atom.config.get('ide-haskell.panelPosition');
      OutputPanelElement = require('./views/output-panel');
      this.element = (new OutputPanelElement).setModel(this);
      this.element.setPanelPosition(pos);
      this.panel = atom.workspace.addPanel(pos, {
        item: this,
        visible: (ref = (ref1 = this.state) != null ? ref1.visibility : void 0) != null ? ref : true
      });
      atom.config.onDidChange('ide-haskell.panelPosition', (function(_this) {
        return function(arg) {
          var newValue;
          newValue = arg.newValue;
          _this.element.setPanelPosition(newValue);
          return atom.workspace.addPanel(newValue, {
            item: _this
          });
        };
      })(this));
      this.disposables.add(this.results.onDidUpdate((function(_this) {
        return function() {
          return _this.currentResult = null;
        };
      })(this)));
      this.backendStatus({
        status: 'ready'
      });
    }

    OutputPanel.prototype.toggle = function() {
      if (this.panel.isVisible()) {
        return this.panel.hide();
      } else {
        return this.panel.show();
      }
    };

    OutputPanel.prototype.destroy = function() {
      this.disposables.dispose();
      this.panel.destroy();
      return this.element.destroy();
    };

    OutputPanel.prototype.createTab = function(name, opts) {
      return this.element.createTab(name, opts);
    };

    OutputPanel.prototype.serialize = function() {
      return {
        visibility: this.panel.isVisible(),
        height: this.element.style.height,
        width: this.element.style.width,
        activeTab: this.element.getActiveTab(),
        fileFilter: this.element.checkboxUriFilter.getFileFilter()
      };
    };

    OutputPanel.prototype.addPanelControl = function(element, opts) {
      return this.element.addPanelControl(element, opts);
    };

    OutputPanel.prototype.setHideParameterValues = function(value) {
      return this.element.setHideParameterValues(value);
    };

    OutputPanel.prototype.backendStatus = function(arg) {
      var progress, ref, status;
      status = arg.status, progress = arg.progress;
      this.element.statusChanged({
        status: status,
        oldStatus: (ref = this.status) != null ? ref : 'ready'
      });
      this.status = status;
      if (status !== 'progress') {
        if (progress == null) {
          progress = 0;
        }
      }
      if (progress != null) {
        return this.element.setProgress(progress);
      }
    };

    OutputPanel.prototype.showNextError = function() {
      var rs;
      rs = this.results.resultsWithURI();
      if (rs.length === 0) {
        return;
      }
      if (this.currentResult != null) {
        this.currentResult++;
      } else {
        this.currentResult = 0;
      }
      if (this.currentResult >= rs.length) {
        this.currentResult = 0;
      }
      return this.element.showItem(rs[this.currentResult]);
    };

    OutputPanel.prototype.showPrevError = function() {
      var rs;
      rs = this.results.resultsWithURI();
      if (rs.length === 0) {
        return;
      }
      if (this.currentResult != null) {
        this.currentResult--;
      } else {
        this.currentResult = rs.length - 1;
      }
      if (this.currentResult < 0) {
        this.currentResult = rs.length - 1;
      }
      return this.element.showItem(rs[this.currentResult]);
    };

    return OutputPanel;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvb3V0cHV0LXBhbmVsL291dHB1dC1wYW5lbC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyxxQkFBQyxLQUFELEVBQWMsT0FBZDtBQUNYLFVBQUE7TUFEWSxJQUFDLENBQUEsd0JBQUQsUUFBUztNQUFJLElBQUMsQ0FBQSxVQUFEO01BQ3hCLHNCQUF1QixPQUFBLENBQVEsTUFBUjtNQUN4QixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUk7TUFFbkIsR0FBQSxHQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiwyQkFBaEI7TUFFTixrQkFBQSxHQUFxQixPQUFBLENBQVEsc0JBQVI7TUFDckIsSUFBQyxDQUFBLE9BQUQsR0FBVyxDQUFDLElBQUksa0JBQUwsQ0FBd0IsQ0FBQyxRQUF6QixDQUFrQyxJQUFsQztNQUNYLElBQUMsQ0FBQSxPQUFPLENBQUMsZ0JBQVQsQ0FBMEIsR0FBMUI7TUFFQSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBZixDQUF3QixHQUF4QixFQUNQO1FBQUEsSUFBQSxFQUFNLElBQU47UUFDQSxPQUFBLGlGQUE4QixJQUQ5QjtPQURPO01BSVQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFaLENBQXdCLDJCQUF4QixFQUFxRCxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsR0FBRDtBQUNuRCxjQUFBO1VBRHFELFdBQUQ7VUFDcEQsS0FBQyxDQUFBLE9BQU8sQ0FBQyxnQkFBVCxDQUEwQixRQUExQjtpQkFDQSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQWYsQ0FBd0IsUUFBeEIsRUFBa0M7WUFBQSxJQUFBLEVBQU0sS0FBTjtXQUFsQztRQUZtRDtNQUFBLENBQUEsQ0FBQSxDQUFBLElB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O01BQ0wsSUFBVSxFQUFFLENBQUMsTUFBSCxLQUFhLENBQXZCO0FBQUEsZUFBQTs7TUFFQSxJQUFHLDBCQUFIO1FBQ0UsSUFBQyxDQUFBLGFBQUQsR0FERjtPQUFBLE1BQUE7UUFHRSxJQUFDLENBQUEsYUFBRCxHQUFpQixFQUFFLENBQUMsTUFBSCxHQUFZLEVBSC9COztNQUlBLElBQWtDLElBQUMsQ0FBQSxhQUFELEdBQWlCLENBQW5EO1FBQUEsSUFBQyxDQUFBLGFBQUQsR0FBaUIsRUFBRSxDQUFDLE1BQUgsR0FBWSxFQUE3Qjs7YUFFQSxJQUFDLENBQUEsT0FBTyxDQUFDLFFBQVQsQ0FBa0IsRUFBRyxDQUFBLElBQUMsQ0FBQSxhQUFELENBQXJCO0lBVmE7Ozs7O0FBdEVqQiIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzPVxuY2xhc3MgT3V0cHV0UGFuZWxcbiAgY29uc3RydWN0b3I6IChAc3RhdGUgPSB7fSwgQHJlc3VsdHMpIC0+XG4gICAge0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgcG9zID0gYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC5wYW5lbFBvc2l0aW9uJylcblxuICAgIE91dHB1dFBhbmVsRWxlbWVudCA9IHJlcXVpcmUgJy4vdmlld3Mvb3V0cHV0LXBhbmVsJ1xuICAgIEBlbGVtZW50ID0gKG5ldyBPdXRwdXRQYW5lbEVsZW1lbnQpLnNldE1vZGVsIEBcbiAgICBAZWxlbWVudC5zZXRQYW5lbFBvc2l0aW9uIHBvc1xuXG4gICAgQHBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkUGFuZWwgcG9zLFxuICAgICAgaXRlbTogQFxuICAgICAgdmlzaWJsZTogQHN0YXRlPy52aXNpYmlsaXR5ID8gdHJ1ZVxuXG4gICAgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ2lkZS1oYXNrZWxsLnBhbmVsUG9zaXRpb24nLCAoe25ld1ZhbHVlfSkgPT5cbiAgICAgIEBlbGVtZW50LnNldFBhbmVsUG9zaXRpb24gbmV3VmFsdWVcbiAgICAgIGF0b20ud29ya3NwYWNlLmFkZFBhbmVsIG5ld1ZhbHVlLCBpdGVtOiBAXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEByZXN1bHRzLm9uRGlkVXBkYXRlID0+IEBjdXJyZW50UmVzdWx0ID0gbnVsbFxuXG4gICAgQGJhY2tlbmRTdGF0dXMgc3RhdHVzOiAncmVhZHknXG5cbiAgdG9nZ2xlOiAtPlxuICAgIGlmIEBwYW5lbC5pc1Zpc2libGUoKVxuICAgICAgQHBhbmVsLmhpZGUoKVxuICAgIGVsc2VcbiAgICAgIEBwYW5lbC5zaG93KClcblxuICBkZXN0cm95OiAtPlxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBAcGFuZWwuZGVzdHJveSgpXG4gICAgQGVsZW1lbnQuZGVzdHJveSgpXG5cbiAgY3JlYXRlVGFiOiAobmFtZSwgb3B0cykgLT5cbiAgICBAZWxlbWVudC5jcmVhdGVUYWIgbmFtZSwgb3B0c1xuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICB2aXNpYmlsaXR5OiBAcGFuZWwuaXNWaXNpYmxlKClcbiAgICBoZWlnaHQ6IEBlbGVtZW50LnN0eWxlLmhlaWdodFxuICAgIHdpZHRoOiBAZWxlbWVudC5zdHlsZS53aWR0aFxuICAgIGFjdGl2ZVRhYjogQGVsZW1lbnQuZ2V0QWN0aXZlVGFiKClcbiAgICBmaWxlRmlsdGVyOiBAZWxlbWVudC5jaGVja2JveFVyaUZpbHRlci5nZXRGaWxlRmlsdGVyKClcblxuICBhZGRQYW5lbENvbnRyb2w6IChlbGVtZW50LCBvcHRzKSAtPlxuICAgIEBlbGVtZW50LmFkZFBhbmVsQ29udHJvbCBlbGVtZW50LCBvcHRzXG5cbiAgc2V0SGlkZVBhcmFtZXRlclZhbHVlczogKHZhbHVlKSAtPlxuICAgIEBlbGVtZW50LnNldEhpZGVQYXJhbWV0ZXJWYWx1ZXModmFsdWUpXG5cbiAgYmFja2VuZFN0YXR1czogKHtzdGF0dXMsIHByb2dyZXNzfSkgLT5cbiAgICBAZWxlbWVudC5zdGF0dXNDaGFuZ2VkIHtzdGF0dXMsIG9sZFN0YXR1czogQHN0YXR1cyA/ICdyZWFkeSd9XG4gICAgQHN0YXR1cyA9IHN0YXR1c1xuICAgIHVubGVzcyBzdGF0dXMgaXMgJ3Byb2dyZXNzJ1xuICAgICAgcHJvZ3Jlc3MgPz0gMFxuICAgIEBlbGVtZW50LnNldFByb2dyZXNzIHByb2dyZXNzIGlmIHByb2dyZXNzP1xuXG4gIHNob3dOZXh0RXJyb3I6IC0+XG4gICAgcnMgPSBAcmVzdWx0cy5yZXN1bHRzV2l0aFVSSSgpXG4gICAgcmV0dXJuIGlmIHJzLmxlbmd0aCBpcyAwXG5cbiAgICBpZiBAY3VycmVudFJlc3VsdD9cbiAgICAgIEBjdXJyZW50UmVzdWx0KytcbiAgICBlbHNlXG4gICAgICBAY3VycmVudFJlc3VsdCA9IDBcbiAgICBAY3VycmVudFJlc3VsdCA9IDAgaWYgQGN1cnJlbnRSZXN1bHQgPj0gcnMubGVuZ3RoXG5cbiAgICBAZWxlbWVudC5zaG93SXRlbSByc1tAY3VycmVudFJlc3VsdF1cblxuICBzaG93UHJldkVycm9yOiAtPlxuICAgIHJzID0gQHJlc3VsdHMucmVzdWx0c1dpdGhVUkkoKVxuICAgIHJldHVybiBpZiBycy5sZW5ndGggaXMgMFxuXG4gICAgaWYgQGN1cnJlbnRSZXN1bHQ/XG4gICAgICBAY3VycmVudFJlc3VsdC0tXG4gICAgZWxzZVxuICAgICAgQGN1cnJlbnRSZXN1bHQgPSBycy5sZW5ndGggLSAxXG4gICAgQGN1cnJlbnRSZXN1bHQgPSBycy5sZW5ndGggLSAxIGlmIEBjdXJyZW50UmVzdWx0IDwgMFxuXG4gICAgQGVsZW1lbnQuc2hvd0l0ZW0gcnNbQGN1cnJlbnRSZXN1bHRdXG4iXX0=

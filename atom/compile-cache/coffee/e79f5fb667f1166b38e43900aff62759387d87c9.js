(function() {
  var OutputPanel;

  module.exports = OutputPanel = (function() {
    function OutputPanel(state, results) {
      var CompositeDisposable, OutputPanelElement, pos, _ref, _ref1;
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
        visible: (_ref = (_ref1 = this.state) != null ? _ref1.visibility : void 0) != null ? _ref : true
      });
      atom.config.onDidChange('ide-haskell.panelPosition', (function(_this) {
        return function(_arg) {
          var newValue;
          newValue = _arg.newValue;
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
        fileFilter: this.element.buttons.getFileFilter()
      };
    };

    OutputPanel.prototype.addPanelControl = function(element, opts) {
      return this.element.addPanelControl(element, opts);
    };

    OutputPanel.prototype.backendStatus = function(_arg) {
      var progress, status, _ref;
      status = _arg.status, progress = _arg.progress;
      this.element.statusChanged({
        status: status,
        oldStatus: (_ref = this.status) != null ? _ref : 'ready'
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

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvb3V0cHV0LXBhbmVsL291dHB1dC1wYW5lbC5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLE1BQUEsV0FBQTs7QUFBQSxFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQ007QUFDUyxJQUFBLHFCQUFFLEtBQUYsRUFBZSxPQUFmLEdBQUE7QUFDWCxVQUFBLHlEQUFBO0FBQUEsTUFEWSxJQUFDLENBQUEsd0JBQUEsUUFBUSxFQUNyQixDQUFBO0FBQUEsTUFEeUIsSUFBQyxDQUFBLFVBQUEsT0FDMUIsQ0FBQTtBQUFBLE1BQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSLEVBQXZCLG1CQUFELENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxXQUFELEdBQWUsR0FBQSxDQUFBLG1CQURmLENBQUE7QUFBQSxNQUdBLEdBQUEsR0FBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsMkJBQWhCLENBSE4sQ0FBQTtBQUFBLE1BS0Esa0JBQUEsR0FBcUIsT0FBQSxDQUFRLHNCQUFSLENBTHJCLENBQUE7QUFBQSxNQU1BLElBQUMsQ0FBQSxPQUFELEdBQVcsQ0FBQyxHQUFBLENBQUEsa0JBQUQsQ0FBd0IsQ0FBQyxRQUF6QixDQUFrQyxJQUFsQyxDQU5YLENBQUE7QUFBQSxNQU9BLElBQUMsQ0FBQSxPQUFPLENBQUMsZ0JBQVQsQ0FBMEIsR0FBMUIsQ0FQQSxDQUFBO0FBQUEsTUFTQSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBZixDQUF3QixHQUF4QixFQUNQO0FBQUEsUUFBQSxJQUFBLEVBQU0sSUFBTjtBQUFBLFFBQ0EsT0FBQSxxRkFBOEIsSUFEOUI7T0FETyxDQVRULENBQUE7QUFBQSxNQWFBLElBQUksQ0FBQyxNQUFNLENB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

//# sourceURL=/Users/erewok/.atom/packages/ide-haskell/lib/output-panel/output-panel.coffee

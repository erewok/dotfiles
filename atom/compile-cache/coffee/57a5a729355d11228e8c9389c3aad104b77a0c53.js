(function() {
  var ResultItem, ResultsDB,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ResultItem = null;

  module.exports = ResultsDB = (function() {
    function ResultsDB() {
      var CompositeDisposable, Emitter, _ref;
      this.results = [];
      _ref = require('atom'), CompositeDisposable = _ref.CompositeDisposable, Emitter = _ref.Emitter;
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.emitter = new Emitter);
      ResultItem = require('./result-item');
    }

    ResultsDB.prototype.destroy = function() {
      var _ref;
      if ((_ref = this.disposables) != null) {
        if (typeof _ref.dispose === "function") {
          _ref.dispose();
        }
      }
      this.disposables = null;
      return this.emitter = null;
    };

    ResultsDB.prototype.onDidUpdate = function(callback) {
      return this.emitter.on('did-update', callback);
    };

    ResultsDB.prototype.setResults = function(res, severityArr) {
      var severity, _i, _len;
      if (severityArr != null) {
        this.results = this.results.filter(function(_arg) {
          var severity;
          severity = _arg.severity;
          return !(__indexOf.call(severityArr, severity) >= 0);
        }).concat(res.map((function(_this) {
          return function(i) {
            return new ResultItem(_this, i);
          };
        })(this)));
      } else {
        this.results = res;
      }
      if (severityArr == null) {
        severityArr = [];
        for (_i = 0, _len = res.length; _i < _len; _i++) {
          severity = res[_i].severity;
          if (!(__indexOf.call(severityArr, severity) >= 0)) {
            severityArr.push(severity);
          }
        }
      }
      return this.emitter.emit('did-update', {
        res: this,
        types: severityArr
      });
    };

    ResultsDB.prototype.appendResults = function(res, severityArr) {
      var severity, _i, _len;
      this.results = this.results.concat(res.map((function(_this) {
        return function(r) {
          return new ResultItem(_this, r);
        };
      })(this)));
      if (severityArr == null) {
        severityArr = [];
        for (_i = 0, _len = res.length; _i < _len; _i++) {
          severity = res[_i].severity;
          if (!(__indexOf.call(severityArr, severity) >= 0)) {
            severityArr.push(severity);
          }
        }
      }
      return this.emitter.emit('did-update', {
        res: this,
        types: severityArr
      });
    };

    ResultsDB.prototype.removeResult = function(resItem) {
      this.results = this.results.filter(function(res) {
        return res !== resItem;
      });
      return resItem.parent = null;
    };

    ResultsDB.prototype.resultsWithURI = function() {
      return this.results.filter(function(_arg) {
        var uri;
        uri = _arg.uri;
        return uri != null;
      });
    };

    ResultsDB.prototype.filter = function(template) {
      return this.results.filter(function(item) {
        var b, k, v;
        b = (function() {
          var _results;
          _results = [];
          for (k in template) {
            v = template[k];
            _results.push(item[k] === v);
          }
          return _results;
        })();
        return b.every(function(v) {
          return v;
        });
      });
    };

    return ResultsDB;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvcmVzdWx0cy1kYi5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLE1BQUEscUJBQUE7SUFBQSxxSkFBQTs7QUFBQSxFQUFBLFVBQUEsR0FBYSxJQUFiLENBQUE7O0FBQUEsRUFFQSxNQUFNLENBQUMsT0FBUCxHQUNNO0FBQ1MsSUFBQSxtQkFBQSxHQUFBO0FBQ1gsVUFBQSxrQ0FBQTtBQUFBLE1BQUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxFQUFYLENBQUE7QUFBQSxNQUNBLE9BQWlDLE9BQUEsQ0FBUSxNQUFSLENBQWpDLEVBQUMsMkJBQUEsbUJBQUQsRUFBc0IsZUFBQSxPQUR0QixDQUFBO0FBQUEsTUFFQSxJQUFDLENBQUEsV0FBRCxHQUFlLEdBQUEsQ0FBQSxtQkFGZixDQUFBO0FBQUEsTUFHQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBQyxDQUFBLE9BQUQsR0FBVyxHQUFBLENBQUEsT0FBNUIsQ0FIQSxDQUFBO0FBQUEsTUFJQSxVQUFBLEdBQWEsT0FBQSxDQUFRLGVBQVIsQ0FKYixDQURXO0lBQUEsQ0FBYjs7QUFBQSx3QkFPQSxPQUFBLEdBQVMsU0FBQSxHQUFBO0FBQ1AsVUFBQSxJQUFBOzs7Y0FBWSxDQUFFOztPQUFkO0FBQUEsTUFDQSxJQUFDLENBQUEsV0FBRCxHQUFlLElBRGYsQ0FBQTthQUVBLElBQUMsQ0FBQSxPQUFELEdBQVcsS0FISjtJQUFBLENBUFQsQ0FBQTs7QUFBQSx3QkFZQSxXQUFBLEdBQWEsU0FBQyxRQUFELEdBQUE7YUFDWCxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxZQUFaLEVBQTBCLFFBQTFCLEVBRFc7SUFBQSxDQVpiLENBQUE7O0FBQUEsd0JBZUEsVUFBQSxHQUFZLFNBQUMsR0FB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

//# sourceURL=/Users/erewok/.atom/packages/ide-haskell/lib/results-db.coffee

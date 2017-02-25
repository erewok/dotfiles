(function() {
  var ResultItem, ResultsDB,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ResultItem = null;

  module.exports = ResultsDB = (function() {
    function ResultsDB() {
      var CompositeDisposable, Emitter, ref;
      this.results = [];
      ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Emitter = ref.Emitter;
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.emitter = new Emitter);
      ResultItem = require('./result-item');
    }

    ResultsDB.prototype.destroy = function() {
      var ref;
      if ((ref = this.disposables) != null) {
        if (typeof ref.dispose === "function") {
          ref.dispose();
        }
      }
      this.disposables = null;
      return this.emitter = null;
    };

    ResultsDB.prototype.onDidUpdate = function(callback) {
      return this.emitter.on('did-update', callback);
    };

    ResultsDB.prototype.setResults = function(res, severityArr) {
      var j, len, severity;
      if (severityArr != null) {
        this.results = this.results.filter(function(arg) {
          var severity;
          severity = arg.severity;
          return !(indexOf.call(severityArr, severity) >= 0);
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
        for (j = 0, len = res.length; j < len; j++) {
          severity = res[j].severity;
          if (!(indexOf.call(severityArr, severity) >= 0)) {
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
      var j, len, severity;
      this.results = this.results.concat(res.map((function(_this) {
        return function(r) {
          return new ResultItem(_this, r);
        };
      })(this)));
      if (severityArr == null) {
        severityArr = [];
        for (j = 0, len = res.length; j < len; j++) {
          severity = res[j].severity;
          if (!(indexOf.call(severityArr, severity) >= 0)) {
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
      return this.results.filter(function(arg) {
        var uri;
        uri = arg.uri;
        return uri != null;
      });
    };

    ResultsDB.prototype.filter = function(template) {
      return this.results.filter(function(item) {
        var b, k, v;
        b = (function() {
          var results;
          results = [];
          for (k in template) {
            v = template[k];
            results.push(item[k] === v);
          }
          return results;
        })();
        return b.every(function(v) {
          return v;
        });
      });
    };

    ResultsDB.prototype.isEmpty = function() {
      return this.results.length === 0;
    };

    return ResultsDB;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvcmVzdWx0cy1kYi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHFCQUFBO0lBQUE7O0VBQUEsVUFBQSxHQUFhOztFQUViLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyxtQkFBQTtBQUNYLFVBQUE7TUFBQSxJQUFDLENBQUEsT0FBRCxHQUFXO01BQ1gsTUFBaUMsT0FBQSxDQUFRLE1BQVIsQ0FBakMsRUFBQyw2Q0FBRCxFQUFzQjtNQUN0QixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUk7TUFDbkIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSSxPQUFoQztNQUNBLFVBQUEsR0FBYSxPQUFBLENBQVEsZUFBUjtJQUxGOzt3QkFPYixPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7OzthQUFZLENBQUU7OztNQUNkLElBQUMsQ0FBQSxXQUFELEdBQWU7YUFDZixJQUFDLENBQUEsT0FBRCxHQUFXO0lBSEo7O3dCQUtULFdBQUEsR0FBYSxTQUFDLFFBQUQ7YUFDWCxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxZQUFaLEVBQTBCLFFBQTFCO0lBRFc7O3dCQUdiLFVBQUEsR0FBWSxTQUFDLEdBQUQsRUFBTSxXQUFOO0FBQ1YsVUFBQTtNQUFBLElBQUcsbUJBQUg7UUFDRSxJQUFDLENBQUEsT0FBRCxHQUNFLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxDQUFnQixTQUFDLEdBQUQ7QUFBZ0IsY0FBQTtVQUFkLFdBQUQ7aUJBQWUsQ0FBSSxDQUFDLGFBQVksV0FBWixFQUFBLFFBQUEsTUFBRDtRQUFwQixDQUFoQixDQUNBLENBQUMsTUFERCxDQUNRLEdBQUcsQ0FBQyxHQUFKLENBQVEsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxDQUFEO21CQUFXLElBQUEsVUFBQSxDQUFXLEtBQVgsRUFBYyxDQUFkO1VBQVg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVIsQ0FEUixFQUZKO09BQUEsTUFBQTtRQUtFLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFMYjs7TUFPQSxJQUFPLG1CQUFQO1FBQ0UsV0FBQSxHQUFjO0FBQ2QsYUFBQSxxQ0FBQTtVQUErQjtjQUFzQixDQUFJLENBQUMsYUFBWSxXQUFaLEVBQUEsUUFBQSxNQUFEO1lBQXpELFdBQVcsQ0FBQyxJQUFaLENBQWlCLFFBQWpCOztBQUFBLFNBRkY7O2FBSUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsWUFBZCxFQUE0QjtRQUFDLEdBQUEsRUFBSyxJQUFOO1FBQVMsS0FBQSxFQUFPLFdBQWhCO09BQTVCO0lBWlU7O3dCQWNaLGFBQUEsR0FBZSxTQUFDLEdBQUQsRUFBTSxXQUFOO0FBQ2IsVUFBQTtNQUFBLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULENBQWdCLEdBQUcsQ0FBQyxHQUFKLENBQVEsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLENBQUQ7aUJBQVcsSUFBQSxVQUFBLENBQVcsS0FBWCxFQUFjLENBQWQ7UUFBWDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBUixDQUFoQjtNQUVYLElBQU8sbUJBQVA7UUFDRSxXQUFBLEdBQWM7QUFDZCxhQUFBLHFDQUFBO1VBQStCO2NBQXNCLENBQUksQ0FBQyxhQUFZLFdBQVosRUFBQSxRQUFBLE1BQUQ7WUFBekQsV0FBVyxDQUFDLElBQVosQ0FBaUIsUUFBakI7O0FBQUEsU0FGRjs7YUFJQSxJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxZQUFkLEVBQTRCO1FBQUMsR0FBQSxFQUFLLElBQU47UUFBUyxLQUFBLEVBQU8sV0FBaEI7T0FBNUI7SUFQYTs7d0JBU2YsWUFBQSxHQUFjLFNBQUMsT0FBRDtNQUNaLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULENBQWdCLFNBQUMsR0FBRDtlQUFTLEdBQUEsS0FBUztNQUFsQixDQUFoQjthQUNYLE9BQU8sQ0FBQyxNQUFSLEdBQWlCO0lBRkw7O3dCQUlkLGNBQUEsR0FBZ0IsU0FBQTthQUNkLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxDQUFnQixTQUFDLEdBQUQ7QUFBVyxZQUFBO1FBQVQsTUFBRDtlQUFVO01BQVgsQ0FBaEI7SUFEYzs7d0JBR2hCLE1BQUEsR0FBUSxTQUFDLFFBQUQ7YUFDTixJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsQ0FBZ0IsU0FBQyxJQUFEO0FBQ2QsWUFBQTtRQUFBLENBQUE7O0FBQUs7ZUFBQSxhQUFBOzt5QkFBQSxJQUFLLENBQUEsQ0FBQSxDQUFMLEtBQVc7QUFBWDs7O2VBQ0wsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxTQUFDLENBQUQ7aUJBQU87UUFBUCxDQUFSO01BRmMsQ0FBaEI7SUFETTs7d0JBS1IsT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsS0FBbUI7SUFEWjs7Ozs7QUF0RFgiLCJzb3VyY2VzQ29udGVudCI6WyJSZXN1bHRJdGVtID0gbnVsbFxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBSZXN1bHRzREJcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHJlc3VsdHMgPSBbXVxuICAgIHtDb21wb3NpdGVEaXNwb3NhYmxlLCBFbWl0dGVyfSA9IHJlcXVpcmUgJ2F0b20nXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBSZXN1bHRJdGVtID0gcmVxdWlyZSAnLi9yZXN1bHQtaXRlbSdcblxuICBkZXN0cm95OiAtPlxuICAgIEBkaXNwb3NhYmxlcz8uZGlzcG9zZT8oKVxuICAgIEBkaXNwb3NhYmxlcyA9IG51bGxcbiAgICBAZW1pdHRlciA9IG51bGxcblxuICBvbkRpZFVwZGF0ZTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtdXBkYXRlJywgY2FsbGJhY2tcblxuICBzZXRSZXN1bHRzOiAocmVzLCBzZXZlcml0eUFycikgLT5cbiAgICBpZiBzZXZlcml0eUFycj9cbiAgICAgIEByZXN1bHRzID1cbiAgICAgICAgQHJlc3VsdHMuZmlsdGVyKCh7c2V2ZXJpdHl9KSAtPiBub3QgKHNldmVyaXR5IGluIHNldmVyaXR5QXJyKSlcbiAgICAgICAgLmNvbmNhdChyZXMubWFwIChpKSA9PiBuZXcgUmVzdWx0SXRlbShALCBpKSlcbiAgICBlbHNlXG4gICAgICBAcmVzdWx0cyA9IHJlc1xuXG4gICAgdW5sZXNzIHNldmVyaXR5QXJyP1xuICAgICAgc2V2ZXJpdHlBcnIgPSBbXVxuICAgICAgc2V2ZXJpdHlBcnIucHVzaCBzZXZlcml0eSBmb3Ige3NldmVyaXR5fSBpbiByZXMgd2hlbiBub3QgKHNldmVyaXR5IGluIHNldmVyaXR5QXJyKVxuXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLXVwZGF0ZScsIHtyZXM6IEAsIHR5cGVzOiBzZXZlcml0eUFycn1cblxuICBhcHBlbmRSZXN1bHRzOiAocmVzLCBzZXZlcml0eUFycikgLT5cbiAgICBAcmVzdWx0cyA9IEByZXN1bHRzLmNvbmNhdCByZXMubWFwIChyKSA9PiBuZXcgUmVzdWx0SXRlbShALCByKVxuXG4gICAgdW5sZXNzIHNldmVyaXR5QXJyP1xuICAgICAgc2V2ZXJpdHlBcnIgPSBbXVxuICAgICAgc2V2ZXJpdHlBcnIucHVzaCBzZXZlcml0eSBmb3Ige3NldmVyaXR5fSBpbiByZXMgd2hlbiBub3QgKHNldmVyaXR5IGluIHNldmVyaXR5QXJyKVxuXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLXVwZGF0ZScsIHtyZXM6IEAsIHR5cGVzOiBzZXZlcml0eUFycn1cblxuICByZW1vdmVSZXN1bHQ6IChyZXNJdGVtKSAtPlxuICAgIEByZXN1bHRzID0gQHJlc3VsdHMuZmlsdGVyIChyZXMpIC0+IHJlcyBpc250IHJlc0l0ZW1cbiAgICByZXNJdGVtLnBhcmVudCA9IG51bGxcblxuICByZXN1bHRzV2l0aFVSSTogLT5cbiAgICBAcmVzdWx0cy5maWx0ZXIgKHt1cml9KSAtPiB1cmk/XG5cbiAgZmlsdGVyOiAodGVtcGxhdGUpIC0+XG4gICAgQHJlc3VsdHMuZmlsdGVyIChpdGVtKSAtPlxuICAgICAgYiA9IChpdGVtW2tdIGlzIHYgZm9yIGssIHYgb2YgdGVtcGxhdGUpXG4gICAgICBiLmV2ZXJ5ICh2KSAtPiB2XG5cbiAgaXNFbXB0eTogLT5cbiAgICBAcmVzdWx0cy5sZW5ndGggaXMgMFxuIl19

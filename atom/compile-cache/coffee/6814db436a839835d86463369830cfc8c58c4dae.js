(function() {
  var EditorControl, Range,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Range = null;

  module.exports = EditorControl = (function() {
    function EditorControl(editor) {
      var Emitter, SubAtom, buffer, bufferPositionFromMouseEvent, editorElement, gutterElement, ref;
      this.editor = editor;
      this.updateResults = bind(this.updateResults, this);
      SubAtom = require('sub-atom');
      this.disposables = new SubAtom;
      ref = require('atom'), Range = ref.Range, Emitter = ref.Emitter;
      this.disposables.add(this.emitter = new Emitter);
      editorElement = atom.views.getView(this.editor);
      this.gutter = this.editor.gutterWithName("ide-haskell-check-results");
      if (this.gutter == null) {
        this.gutter = this.editor.addGutter({
          name: "ide-haskell-check-results",
          priority: 10
        });
      }
      bufferPositionFromMouseEvent = require('./utils').bufferPositionFromMouseEvent;
      gutterElement = atom.views.getView(this.gutter);
      this.disposables.add(gutterElement, 'mouseenter', ".decoration", (function(_this) {
        return function(e) {
          var bufferPt;
          bufferPt = bufferPositionFromMouseEvent(_this.editor, e);
          _this.lastMouseBufferPt = bufferPt;
          return _this.showCheckResult(bufferPt, true);
        };
      })(this));
      this.disposables.add(gutterElement, 'mouseleave', ".decoration", (function(_this) {
        return function(e) {
          return _this.hideTooltip();
        };
      })(this));
      buffer = this.editor.getBuffer();
      this.disposables.add(buffer.onWillSave((function(_this) {
        return function() {
          _this.emitter.emit('will-save-buffer', buffer);
          if (atom.config.get('ide-haskell.onSavePrettify')) {
            return atom.commands.dispatch(editorElement, 'ide-haskell:prettify-file');
          }
        };
      })(this)));
      this.disposables.add(buffer.onDidSave((function(_this) {
        return function() {
          return _this.emitter.emit('did-save-buffer', buffer);
        };
      })(this)));
      this.disposables.add(this.editor.onDidStopChanging((function(_this) {
        return function() {
          return _this.emitter.emit('did-stop-changing', _this.editor);
        };
      })(this)));
      this.disposables.add(editorElement.onDidChangeScrollLeft((function(_this) {
        return function() {
          return _this.hideTooltip({
            eventType: 'mouse'
          });
        };
      })(this)));
      this.disposables.add(editorElement.onDidChangeScrollTop((function(_this) {
        return function() {
          return _this.hideTooltip({
            eventType: 'mouse'
          });
        };
      })(this)));
      this.disposables.add(editorElement.rootElement, 'mousemove', '.scroll-view', (function(_this) {
        return function(e) {
          var bufferPt, ref1;
          bufferPt = bufferPositionFromMouseEvent(_this.editor, e);
          if ((ref1 = _this.lastMouseBufferPt) != null ? ref1.isEqual(bufferPt) : void 0) {
            return;
          }
          _this.lastMouseBufferPt = bufferPt;
          if (_this.exprTypeTimeout != null) {
            clearTimeout(_this.exprTypeTimeout);
          }
          return _this.exprTypeTimeout = setTimeout((function() {
            return _this.shouldShowTooltip(bufferPt);
          }), atom.config.get('ide-haskell.expressionTypeInterval'));
        };
      })(this));
      this.disposables.add(editorElement.rootElement, 'mouseout', '.scroll-view', (function(_this) {
        return function(e) {
          if (_this.exprTypeTimeout != null) {
            return clearTimeout(_this.exprTypeTimeout);
          }
        };
      })(this));
      this.disposables.add(this.editor.onDidChangeSelectionRange((function(_this) {
        return function(arg) {
          var newBufferRange;
          newBufferRange = arg.newBufferRange;
          if (_this.selTimeout != null) {
            clearTimeout(_this.selTimeout);
          }
          if (newBufferRange.isEmpty()) {
            _this.hideTooltip({
              eventType: 'selection'
            });
            switch (atom.config.get('ide-haskell.onCursorMove')) {
              case 'Show Tooltip':
                if (_this.exprTypeTimeout != null) {
                  clearTimeout(_this.exprTypeTimeout);
                }
                if (!_this.showCheckResult(newBufferRange.start, false, 'keyboard')) {
                  return _this.hideTooltip();
                }
                break;
              case 'Hide Tooltip':
                if (_this.exprTypeTimeout != null) {
                  clearTimeout(_this.exprTypeTimeout);
                }
                return _this.hideTooltip();
            }
          } else {
            return _this.selTimeout = setTimeout((function() {
              return _this.shouldShowTooltip(newBufferRange.start, 'selection');
            }), atom.config.get('ide-haskell.expressionTypeInterval'));
          }
        };
      })(this)));
    }

    EditorControl.prototype.deactivate = function() {
      if (this.exprTypeTimeout != null) {
        clearTimeout(this.exprTypeTimeout);
      }
      if (this.selTimeout != null) {
        clearTimeout(this.selTimeout);
      }
      this.hideTooltip();
      this.disposables.dispose();
      this.disposables = null;
      this.editor = null;
      return this.lastMouseBufferPt = null;
    };

    EditorControl.prototype.updateResults = function(res, types) {
      var i, j, k, l, len, len1, len2, len3, m, r, ref, ref1, results, t;
      if (types != null) {
        for (i = 0, len = types.length; i < len; i++) {
          t = types[i];
          ref = this.editor.findMarkers({
            type: 'check-result',
            severity: t,
            editor: this.editor.id
          });
          for (j = 0, len1 = ref.length; j < len1; j++) {
            m = ref[j];
            m.destroy();
          }
        }
      } else {
        ref1 = this.editor.findMarkers({
          type: 'check-result',
          editor: this.editor.id
        });
        for (k = 0, len2 = ref1.length; k < len2; k++) {
          m = ref1[k];
          m.destroy();
        }
      }
      results = [];
      for (l = 0, len3 = res.length; l < len3; l++) {
        r = res[l];
        results.push(this.markerFromCheckResult(r));
      }
      return results;
    };

    EditorControl.prototype.markerFromCheckResult = function(resItem) {
      var CompositeDisposable, disp, marker, message, position, range, severity, uri;
      uri = resItem.uri, severity = resItem.severity, message = resItem.message, position = resItem.position;
      if (!((uri != null) && uri === this.editor.getURI())) {
        return;
      }
      range = new Range(position, {
        row: position.row,
        column: position.column + 1
      });
      marker = this.editor.markBufferRange(range, {
        invalidate: 'touch'
      });
      marker.setProperties({
        type: 'check-result',
        severity: severity,
        desc: message,
        editor: this.editor.id
      });
      CompositeDisposable = require('atom').CompositeDisposable;
      disp = new CompositeDisposable;
      disp.add(marker.onDidChange(function(arg) {
        var isValid;
        isValid = arg.isValid;
        if (!isValid) {
          resItem.destroy();
          return marker.destroy();
        }
      }));
      disp.add(marker.onDidDestroy(function() {
        return disp.dispose();
      }));
      return this.decorateMarker(marker);
    };

    EditorControl.prototype.decorateMarker = function(m) {
      var cls;
      if (this.gutter == null) {
        return;
      }
      cls = 'ide-haskell-' + m.getProperties().severity;
      this.gutter.decorateMarker(m, {
        type: 'line-number',
        "class": cls
      });
      this.editor.decorateMarker(m, {
        type: 'highlight',
        "class": cls
      });
      return this.editor.decorateMarker(m, {
        type: 'line',
        "class": cls
      });
    };

    EditorControl.prototype.onShouldShowTooltip = function(callback) {
      return this.emitter.on('should-show-tooltip', callback);
    };

    EditorControl.prototype.onWillSaveBuffer = function(callback) {
      return this.emitter.on('will-save-buffer', callback);
    };

    EditorControl.prototype.onDidSaveBuffer = function(callback) {
      return this.emitter.on('did-save-buffer', callback);
    };

    EditorControl.prototype.onDidStopChanging = function(callback) {
      return this.emitter.on('did-stop-changing', callback);
    };

    EditorControl.prototype.shouldShowTooltip = function(pos, eventType) {
      if (eventType == null) {
        eventType = 'mouse';
      }
      if (this.showCheckResult(pos, false, eventType)) {
        return;
      }
      if (pos.row < 0 || pos.row >= this.editor.getLineCount() || pos.isEqual(this.editor.bufferRangeForBufferRow(pos.row).end)) {
        return this.hideTooltip({
          eventType: eventType
        });
      } else if (this.rangeHasChanged(pos, eventType)) {
        return this.emitter.emit('should-show-tooltip', {
          editor: this.editor,
          pos: pos,
          eventType: eventType
        });
      }
    };

    EditorControl.prototype.rangeHasChanged = function(pos, eventType) {
      var isFirstIteration, isSameRow, isSameToken, newrange, rangesAreEmpty, result;
      newrange = this.getEventRange(pos, eventType).crange;
      isFirstIteration = !((this.lastMouseBufferPtTest != null) && (this.lastMouseBufferRangeTest != null));
      rangesAreEmpty = (function(_this) {
        return function() {
          return _this.lastMouseBufferRangeTest.isEmpty() && newrange.isEmpty();
        };
      })(this);
      isSameRow = (function(_this) {
        return function() {
          return _this.lastMouseBufferPtTest.row === pos.row;
        };
      })(this);
      isSameToken = (function(_this) {
        return function() {
          var newtokid, oldtokid, tl;
          if (!(rangesAreEmpty() && isSameRow())) {
            return false;
          }
          tl = _this.editor.tokenizedBuffer.tokenizedLineForRow(_this.lastMouseBufferPtTest.row);
          oldtokid = tl.tokenIndexAtBufferColumn(_this.lastMouseBufferPtTest.column);
          newtokid = tl.tokenIndexAtBufferColumn(pos.column);
          return oldtokid === newtokid;
        };
      })(this);
      result = isFirstIteration || !(this.lastMouseBufferRangeTest.isEqual(newrange) || isSameToken());
      this.lastMouseBufferPtTest = pos;
      this.lastMouseBufferRangeTest = newrange;
      return result;
    };

    EditorControl.prototype.showTooltip = function(pos, range, text, detail) {
      var TooltipMessage, highlightMarker, lastSel, markerPos;
      if (this.editor == null) {
        return;
      }
      if (!detail.eventType) {
        throw new Error('eventType not set');
      }
      if (range.isEqual(this.tooltipHighlightRange)) {
        return;
      }
      this.hideTooltip();
      if (detail.eventType === 'mouse') {
        if (!range.containsPoint(this.lastMouseBufferPt)) {
          return;
        }
      }
      if (detail.eventType === 'selection') {
        lastSel = this.editor.getLastSelection();
        if (!(range.containsRange(lastSel.getBufferRange()) && !lastSel.isEmpty())) {
          return;
        }
      }
      this.tooltipHighlightRange = range;
      markerPos = range.start;
      detail.type = 'tooltip';
      highlightMarker = this.editor.markBufferRange(range);
      highlightMarker.setProperties(detail);
      TooltipMessage = require('./views/tooltip-view');
      this.editor.decorateMarker(highlightMarker, {
        type: 'overlay',
        position: 'tail',
        item: new TooltipMessage(text)
      });
      return this.editor.decorateMarker(highlightMarker, {
        type: 'highlight',
        "class": 'ide-haskell-type'
      });
    };

    EditorControl.prototype.hideTooltip = function(template) {
      var i, len, m, ref, results;
      if (template == null) {
        template = {};
      }
      this.tooltipHighlightRange = null;
      template.type = 'tooltip';
      ref = this.editor.findMarkers(template);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        m = ref[i];
        results.push(m.destroy());
      }
      return results;
    };

    EditorControl.prototype.getEventRange = function(pos, eventType) {
      var crange, selRange;
      switch (eventType) {
        case 'mouse':
        case 'context':
          if (pos == null) {
            pos = this.lastMouseBufferPt;
          }
          selRange = this.editor.getSelections().map(function(sel) {
            return sel.getBufferRange();
          }).filter(function(sel) {
            return sel.containsPoint(pos);
          })[0];
          crange = selRange != null ? selRange : Range.fromPointWithDelta(pos, 0, 0);
          break;
        case 'keyboard':
        case 'selection':
          crange = this.editor.getLastSelection().getBufferRange();
          pos = crange.start;
          break;
        default:
          throw new Error("unknown event type " + eventType);
      }
      return {
        crange: crange,
        pos: pos,
        eventType: eventType
      };
    };

    EditorControl.prototype.findCheckResultMarkers = function(pos, gutter, eventType) {
      if (gutter) {
        return this.editor.findMarkers({
          type: 'check-result',
          startBufferRow: pos.row,
          editor: this.editor.id
        });
      } else {
        switch (eventType) {
          case 'keyboard':
            return this.editor.findMarkers({
              type: 'check-result',
              editor: this.editor.id,
              containsRange: Range.fromPointWithDelta(pos, 0, 1)
            });
          case 'mouse':
            return this.editor.findMarkers({
              type: 'check-result',
              editor: this.editor.id,
              containsPoint: pos
            });
          default:
            return [];
        }
      }
    };

    EditorControl.prototype.showCheckResult = function(pos, gutter, eventType) {
      var marker, markers, text;
      if (eventType == null) {
        eventType = 'mouse';
      }
      markers = this.findCheckResultMarkers(pos, gutter, eventType);
      marker = markers[0];
      if (marker == null) {
        this.hideTooltip({
          subtype: 'check-result'
        });
        return false;
      }
      text = markers.map(function(marker) {
        return marker.getProperties().desc;
      });
      if (gutter) {
        this.showTooltip(pos, new Range(pos, pos), text, {
          eventType: eventType,
          subtype: 'check-result'
        });
      } else {
        this.showTooltip(pos, marker.getBufferRange(), text, {
          eventType: eventType,
          subtype: 'check-result'
        });
      }
      return true;
    };

    EditorControl.prototype.hasTooltips = function(template) {
      if (template == null) {
        template = {};
      }
      template.type = 'tooltip';
      return !!this.editor.findMarkers(template).length;
    };

    return EditorControl;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvZWRpdG9yLWNvbnRyb2wuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxvQkFBQTtJQUFBOztFQUFBLEtBQUEsR0FBUTs7RUFFUixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1MsdUJBQUMsTUFBRDtBQUNYLFVBQUE7TUFEWSxJQUFDLENBQUEsU0FBRDs7TUFDWixPQUFBLEdBQVUsT0FBQSxDQUFRLFVBQVI7TUFDVixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUk7TUFDbkIsTUFBbUIsT0FBQSxDQUFRLE1BQVIsQ0FBbkIsRUFBQyxpQkFBRCxFQUFRO01BQ1IsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSSxPQUFoQztNQUVBLGFBQUEsR0FBZ0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFYLENBQW1CLElBQUMsQ0FBQSxNQUFwQjtNQUVoQixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUF1QiwyQkFBdkI7O1FBQ1YsSUFBQyxDQUFBLFNBQVUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFSLENBQ1Q7VUFBQSxJQUFBLEVBQU0sMkJBQU47VUFDQSxRQUFBLEVBQVUsRUFEVjtTQURTOztNQUlWLCtCQUFnQyxPQUFBLENBQVEsU0FBUjtNQUVqQyxhQUFBLEdBQWdCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFDLENBQUEsTUFBcEI7TUFDaEIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLGFBQWpCLEVBQWdDLFlBQWhDLEVBQThDLGFBQTlDLEVBQTZELENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxDQUFEO0FBQzNELGNBQUE7VUFBQSxRQUFBLEdBQVcsNEJBQUEsQ0FBNkIsS0FBQyxDQUFB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aXRvckNvbnRyb2xcbiAgY29uc3RydWN0b3I6IChAZWRpdG9yKSAtPlxuICAgIFN1YkF0b20gPSByZXF1aXJlICdzdWItYXRvbSdcbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgU3ViQXRvbVxuICAgIHtSYW5nZSwgRW1pdHRlcn0gPSByZXF1aXJlICdhdG9tJ1xuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuXG4gICAgZWRpdG9yRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhAZWRpdG9yKVxuXG4gICAgQGd1dHRlciA9IEBlZGl0b3IuZ3V0dGVyV2l0aE5hbWUgXCJpZGUtaGFza2VsbC1jaGVjay1yZXN1bHRzXCJcbiAgICBAZ3V0dGVyID89IEBlZGl0b3IuYWRkR3V0dGVyXG4gICAgICBuYW1lOiBcImlkZS1oYXNrZWxsLWNoZWNrLXJlc3VsdHNcIlxuICAgICAgcHJpb3JpdHk6IDEwXG5cbiAgICB7YnVmZmVyUG9zaXRpb25Gcm9tTW91c2VFdmVudH0gPSByZXF1aXJlICcuL3V0aWxzJ1xuXG4gICAgZ3V0dGVyRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhAZ3V0dGVyKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgZ3V0dGVyRWxlbWVudCwgJ21vdXNlZW50ZXInLCBcIi5kZWNvcmF0aW9uXCIsIChlKSA9PlxuICAgICAgYnVmZmVyUHQgPSBidWZmZXJQb3NpdGlvbkZyb21Nb3VzZUV2ZW50IEBlZGl0b3IsIGVcbiAgICAgIEBsYXN0TW91c2VCdWZmZXJQdCA9IGJ1ZmZlclB0XG4gICAgICBAc2hvd0NoZWNrUmVzdWx0IGJ1ZmZlclB0LCB0cnVlXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBndXR0ZXJFbGVtZW50LCAnbW91c2VsZWF2ZScsIFwiLmRlY29yYXRpb25cIiwgKGUpID0+XG4gICAgICBAaGlkZVRvb2x0aXAoKVxuXG4gICAgIyBidWZmZXIgZXZlbnRzIGZvciBhdXRvbWF0aWMgY2hlY2tcbiAgICBidWZmZXIgPSBAZWRpdG9yLmdldEJ1ZmZlcigpXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBidWZmZXIub25XaWxsU2F2ZSA9PlxuICAgICAgQGVtaXR0ZXIuZW1pdCAnd2lsbC1zYXZlLWJ1ZmZlcicsIGJ1ZmZlclxuICAgICAgaWYgYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC5vblNhdmVQcmV0dGlmeScpXG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggZWRpdG9yRWxlbWVudCwgJ2lkZS1oYXNrZWxsOnByZXR0aWZ5LWZpbGUnXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGJ1ZmZlci5vbkRpZFNhdmUgPT5cbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1zYXZlLWJ1ZmZlcicsIGJ1ZmZlclxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAZWRpdG9yLm9uRGlkU3RvcENoYW5naW5nID0+XG4gICAgICBAZW1pdHRlci5lbWl0ICdkaWQtc3RvcC1jaGFuZ2luZycsIEBlZGl0b3JcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgZWRpdG9yRWxlbWVudC5vbkRpZENoYW5nZVNjcm9sbExlZnQgPT5cbiAgICAgIEBoaWRlVG9vbHRpcCBldmVudFR5cGU6ICdtb3VzZSdcbiAgICBAZGlzcG9zYWJsZXMuYWRkIGVkaXRvckVsZW1lbnQub25EaWRDaGFuZ2VTY3JvbGxUb3AgPT5cbiAgICAgIEBoaWRlVG9vbHRpcCBldmVudFR5cGU6ICdtb3VzZSdcblxuICAgICMgc2hvdyBleHByZXNzaW9uIHR5cGUgaWYgbW91c2Ugc3RvcHBlZCBzb21ld2hlcmVcbiAgICBAZGlzcG9zYWJsZXMuYWRkIGVkaXRvckVsZW1lbnQucm9vdEVsZW1lbnQsICdtb3VzZW1vdmUnLCAnLnNjcm9sbC12aWV3JywgKGUpID0+XG4gICAgICBidWZmZXJQdCA9IGJ1ZmZlclBvc2l0aW9uRnJvbU1vdXNlRXZlbnQgQGVkaXRvciwgZVxuXG4gICAgICByZXR1cm4gaWYgQGxhc3RNb3VzZUJ1ZmZlclB0Py5pc0VxdWFsKGJ1ZmZlclB0KVxuICAgICAgQGxhc3RNb3VzZUJ1ZmZlclB0ID0gYnVmZmVyUHRcblxuICAgICAgY2xlYXJUaW1lb3V0IEBleHByVHlwZVRpbWVvdXQgaWYgQGV4cHJUeXBlVGltZW91dD9cbiAgICAgIEBleHByVHlwZVRpbWVvdXQgPSBzZXRUaW1lb3V0ICg9PiBAc2hvdWxkU2hvd1Rvb2x0aXAgYnVmZmVyUHQpLFxuICAgICAgICBhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLmV4cHJlc3Npb25UeXBlSW50ZXJ2YWwnKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgZWRpdG9yRWxlbWVudC5yb290RWxlbWVudCwgJ21vdXNlb3V0JywgJy5zY3JvbGwtdmlldycsIChlKSA9PlxuICAgICAgY2xlYXJUaW1lb3V0IEBleHByVHlwZVRpbWVvdXQgaWYgQGV4cHJUeXBlVGltZW91dD9cblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGVkaXRvci5vbkRpZENoYW5nZVNlbGVjdGlvblJhbmdlICh7bmV3QnVmZmVyUmFuZ2V9KSA9PlxuICAgICAgY2xlYXJUaW1lb3V0IEBzZWxUaW1lb3V0IGlmIEBzZWxUaW1lb3V0P1xuICAgICAgaWYgbmV3QnVmZmVyUmFuZ2UuaXNFbXB0eSgpXG4gICAgICAgIEBoaWRlVG9vbHRpcCBldmVudFR5cGU6ICdzZWxlY3Rpb24nXG4gICAgICAgIHN3aXRjaCBhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLm9uQ3Vyc29yTW92ZScpXG4gICAgICAgICAgd2hlbiAnU2hvdyBUb29sdGlwJ1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0IEBleHByVHlwZVRpbWVvdXQgaWYgQGV4cHJUeXBlVGltZW91dD9cbiAgICAgICAgICAgIHVubGVzcyBAc2hvd0NoZWNrUmVzdWx0IG5ld0J1ZmZlclJhbmdlLnN0YXJ0LCBmYWxzZSwgJ2tleWJvYXJkJ1xuICAgICAgICAgICAgICBAaGlkZVRvb2x0aXAoKVxuICAgICAgICAgIHdoZW4gJ0hpZGUgVG9vbHRpcCdcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCBAZXhwclR5cGVUaW1lb3V0IGlmIEBleHByVHlwZVRpbWVvdXQ/XG4gICAgICAgICAgICBAaGlkZVRvb2x0aXAoKVxuICAgICAgZWxzZVxuICAgICAgICBAc2VsVGltZW91dCA9IHNldFRpbWVvdXQgKD0+IEBzaG91bGRTaG93VG9vbHRpcCBuZXdCdWZmZXJSYW5nZS5zdGFydCwgJ3NlbGVjdGlvbicpLFxuICAgICAgICAgIGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwuZXhwcmVzc2lvblR5cGVJbnRlcnZhbCcpXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBjbGVhclRpbWVvdXQgQGV4cHJUeXBlVGltZW91dCBpZiBAZXhwclR5cGVUaW1lb3V0P1xuICAgIGNsZWFyVGltZW91dCBAc2VsVGltZW91dCBpZiBAc2VsVGltZW91dD9cbiAgICBAaGlkZVRvb2x0aXAoKVxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBAZGlzcG9zYWJsZXMgPSBudWxsXG4gICAgQGVkaXRvciA9IG51bGxcbiAgICBAbGFzdE1vdXNlQnVmZmVyUHQgPSBudWxsXG5cbiAgdXBkYXRlUmVzdWx0czogKHJlcywgdHlwZXMpID0+XG4gICAgaWYgdHlwZXM/XG4gICAgICBmb3IgdCBpbiB0eXBlc1xuICAgICAgICBmb3IgbSBpbiBAZWRpdG9yLmZpbmRNYXJrZXJzIHt0eXBlOiAnY2hlY2stcmVzdWx0Jywgc2V2ZXJpdHk6IHQsIGVkaXRvcjogQGVkaXRvci5pZH1cbiAgICAgICAgICBtLmRlc3Ryb3koKVxuICAgIGVsc2VcbiAgICAgIGZvciBtIGluIEBlZGl0b3IuZmluZE1hcmtlcnMge3R5cGU6ICdjaGVjay1yZXN1bHQnLCBlZGl0b3I6IEBlZGl0b3IuaWR9XG4gICAgICAgIG0uZGVzdHJveSgpXG4gICAgQG1hcmtlckZyb21DaGVja1Jlc3VsdChyKSBmb3IgciBpbiByZXNcblxuICBtYXJrZXJGcm9tQ2hlY2tSZXN1bHQ6IChyZXNJdGVtKSAtPlxuICAgIHt1cmksIHNldmVyaXR5LCBtZXNzYWdlLCBwb3NpdGlvbn0gPSByZXNJdGVtXG4gICAgcmV0dXJuIHVubGVzcyB1cmk/IGFuZCB1cmkgaXMgQGVkaXRvci5nZXRVUkkoKVxuXG4gICAgIyBjcmVhdGUgYSBuZXcgbWFya2VyXG4gICAgcmFuZ2UgPSBuZXcgUmFuZ2UgcG9zaXRpb24sIHtyb3c6IHBvc2l0aW9uLnJvdywgY29sdW1uOiBwb3NpdGlvbi5jb2x1bW4gKyAxfVxuICAgIG1hcmtlciA9IEBlZGl0b3IubWFya0J1ZmZlclJhbmdlIHJhbmdlLCBpbnZhbGlkYXRlOiAndG91Y2gnXG4gICAgbWFya2VyLnNldFByb3BlcnRpZXNcbiAgICAgIHR5cGU6ICdjaGVjay1yZXN1bHQnXG4gICAgICBzZXZlcml0eTogc2V2ZXJpdHlcbiAgICAgIGRlc2M6IG1lc3NhZ2VcbiAgICAgIGVkaXRvcjogQGVkaXRvci5pZFxuICAgIHtDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG4gICAgZGlzcCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgZGlzcC5hZGQgbWFya2VyLm9uRGlkQ2hhbmdlICh7aXNWYWxpZH0pIC0+XG4gICAgICB1bmxlc3MgaXNWYWxpZFxuICAgICAgICByZXNJdGVtLmRlc3Ryb3koKVxuICAgICAgICBtYXJrZXIuZGVzdHJveSgpXG4gICAgZGlzcC5hZGQgbWFya2VyLm9uRGlkRGVzdHJveSAtPlxuICAgICAgZGlzcC5kaXNwb3NlKClcblxuICAgIEBkZWNvcmF0ZU1hcmtlcihtYXJrZXIpXG5cbiAgZGVjb3JhdGVNYXJrZXI6IChtKSAtPlxuICAgIHJldHVybiB1bmxlc3MgQGd1dHRlcj9cbiAgICBjbHMgPSAnaWRlLWhhc2tlbGwtJyArIG0uZ2V0UHJvcGVydGllcygpLnNldmVyaXR5XG4gICAgQGd1dHRlci5kZWNvcmF0ZU1hcmtlciBtLCB0eXBlOiAnbGluZS1udW1iZXInLCBjbGFzczogY2xzXG4gICAgQGVkaXRvci5kZWNvcmF0ZU1hcmtlciBtLCB0eXBlOiAnaGlnaGxpZ2h0JywgY2xhc3M6IGNsc1xuICAgIEBlZGl0b3IuZGVjb3JhdGVNYXJrZXIgbSwgdHlwZTogJ2xpbmUnLCBjbGFzczogY2xzXG5cbiAgb25TaG91bGRTaG93VG9vbHRpcDogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdzaG91bGQtc2hvdy10b29sdGlwJywgY2FsbGJhY2tcblxuICBvbldpbGxTYXZlQnVmZmVyOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ3dpbGwtc2F2ZS1idWZmZXInLCBjYWxsYmFja1xuXG4gIG9uRGlkU2F2ZUJ1ZmZlcjogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtc2F2ZS1idWZmZXInLCBjYWxsYmFja1xuXG4gIG9uRGlkU3RvcENoYW5naW5nOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1zdG9wLWNoYW5naW5nJywgY2FsbGJhY2tcblxuICBzaG91bGRTaG93VG9vbHRpcDogKHBvcywgZXZlbnRUeXBlID0gJ21vdXNlJykgLT5cbiAgICByZXR1cm4gaWYgQHNob3dDaGVja1Jlc3VsdCBwb3MsIGZhbHNlLCBldmVudFR5cGVcblxuICAgIGlmIHBvcy5yb3cgPCAwIG9yXG4gICAgICAgcG9zLnJvdyA+PSBAZWRpdG9yLmdldExpbmVDb3VudCgpIG9yXG4gICAgICAgcG9zLmlzRXF1YWwgQGVkaXRvci5idWZmZXJSYW5nZUZvckJ1ZmZlclJvdyhwb3Mucm93KS5lbmRcbiAgICAgIEBoaWRlVG9vbHRpcCB7ZXZlbnRUeXBlfVxuICAgIGVsc2UgaWYgQHJhbmdlSGFzQ2hhbmdlZChwb3MsIGV2ZW50VHlwZSlcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ3Nob3VsZC1zaG93LXRvb2x0aXAnLCB7QGVkaXRvciwgcG9zLCBldmVudFR5cGV9XG5cbiAgcmFuZ2VIYXNDaGFuZ2VkOiAocG9zLCBldmVudFR5cGUpIC0+XG4gICAgbmV3cmFuZ2UgPSBAZ2V0RXZlbnRSYW5nZShwb3MsIGV2ZW50VHlwZSkuY3JhbmdlXG4gICAgaXNGaXJzdEl0ZXJhdGlvbiA9IG5vdCAoQGxhc3RNb3VzZUJ1ZmZlclB0VGVzdD8gYW5kIEBsYXN0TW91c2VCdWZmZXJSYW5nZVRlc3Q/KVxuICAgIHJhbmdlc0FyZUVtcHR5ID0gPT4gQGxhc3RNb3VzZUJ1ZmZlclJhbmdlVGVzdC5pc0VtcHR5KCkgYW5kIG5ld3JhbmdlLmlzRW1wdHkoKVxuICAgIGlzU2FtZVJvdyA9ID0+IEBsYXN0TW91c2VCdWZmZXJQdFRlc3Qucm93IGlzIHBvcy5yb3dcbiAgICBpc1NhbWVUb2tlbiA9ID0+XG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHJhbmdlc0FyZUVtcHR5KCkgYW5kIGlzU2FtZVJvdygpXG4gICAgICB0bCA9IEBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnRva2VuaXplZExpbmVGb3JSb3coQGxhc3RNb3VzZUJ1ZmZlclB0VGVzdC5yb3cpXG4gICAgICBvbGR0b2tpZCA9IHRsLnRva2VuSW5kZXhBdEJ1ZmZlckNvbHVtbihAbGFzdE1vdXNlQnVmZmVyUHRUZXN0LmNvbHVtbilcbiAgICAgIG5ld3Rva2lkID0gdGwudG9rZW5JbmRleEF0QnVmZmVyQ29sdW1uKHBvcy5jb2x1bW4pXG4gICAgICBvbGR0b2tpZCBpcyBuZXd0b2tpZFxuICAgIHJlc3VsdCA9XG4gICAgICBpc0ZpcnN0SXRlcmF0aW9uIG9yIG5vdCAoIEBsYXN0TW91c2VCdWZmZXJSYW5nZVRlc3QuaXNFcXVhbChuZXdyYW5nZSkgb3IgaXNTYW1lVG9rZW4oKSApXG4gICAgQGxhc3RNb3VzZUJ1ZmZlclB0VGVzdCA9IHBvc1xuICAgIEBsYXN0TW91c2VCdWZmZXJSYW5nZVRlc3QgPSBuZXdyYW5nZVxuICAgIHJldHVybiByZXN1bHRcblxuICBzaG93VG9vbHRpcDogKHBvcywgcmFuZ2UsIHRleHQsIGRldGFpbCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBlZGl0b3I/XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2V2ZW50VHlwZSBub3Qgc2V0JykgdW5sZXNzIGRldGFpbC5ldmVudFR5cGVcblxuICAgIGlmIHJhbmdlLmlzRXF1YWwoQHRvb2x0aXBIaWdobGlnaHRSYW5nZSlcbiAgICAgIHJldHVyblxuICAgIEBoaWRlVG9vbHRpcCgpXG4gICAgI2V4aXQgaWYgbW91c2UgbW92ZWQgYXdheVxuICAgIGlmIGRldGFpbC5ldmVudFR5cGUgaXMgJ21vdXNlJ1xuICAgICAgdW5sZXNzIHJhbmdlLmNvbnRhaW5zUG9pbnQoQGxhc3RNb3VzZUJ1ZmZlclB0KVxuICAgICAgICByZXR1cm5cbiAgICBpZiBkZXRhaWwuZXZlbnRUeXBlIGlzICdzZWxlY3Rpb24nXG4gICAgICBsYXN0U2VsID0gQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKClcbiAgICAgIHVubGVzcyByYW5nZS5jb250YWluc1JhbmdlKGxhc3RTZWwuZ2V0QnVmZmVyUmFuZ2UoKSkgYW5kIG5vdCBsYXN0U2VsLmlzRW1wdHkoKVxuICAgICAgICByZXR1cm5cbiAgICBAdG9vbHRpcEhpZ2hsaWdodFJhbmdlID0gcmFuZ2VcbiAgICBtYXJrZXJQb3MgPSByYW5nZS5zdGFydFxuICAgIGRldGFpbC50eXBlID0gJ3Rvb2x0aXAnXG4gICAgaGlnaGxpZ2h0TWFya2VyID0gQGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UgcmFuZ2VcbiAgICBoaWdobGlnaHRNYXJrZXIuc2V0UHJvcGVydGllcyBkZXRhaWxcbiAgICBUb29sdGlwTWVzc2FnZSA9IHJlcXVpcmUgJy4vdmlld3MvdG9vbHRpcC12aWV3J1xuICAgIEBlZGl0b3IuZGVjb3JhdGVNYXJrZXIgaGlnaGxpZ2h0TWFya2VyLFxuICAgICAgdHlwZTogJ292ZXJsYXknXG4gICAgICBwb3NpdGlvbjogJ3RhaWwnXG4gICAgICBpdGVtOiBuZXcgVG9vbHRpcE1lc3NhZ2UgdGV4dFxuICAgIEBlZGl0b3IuZGVjb3JhdGVNYXJrZXIgaGlnaGxpZ2h0TWFya2VyLFxuICAgICAgdHlwZTogJ2hpZ2hsaWdodCdcbiAgICAgIGNsYXNzOiAnaWRlLWhhc2tlbGwtdHlwZSdcblxuICBoaWRlVG9vbHRpcDogKHRlbXBsYXRlID0ge30pIC0+XG4gICAgQHRvb2x0aXBIaWdobGlnaHRSYW5nZSA9IG51bGxcbiAgICB0ZW1wbGF0ZS50eXBlID0gJ3Rvb2x0aXAnXG4gICAgbS5kZXN0cm95KCkgZm9yIG0gaW4gQGVkaXRvci5maW5kTWFya2VycyB0ZW1wbGF0ZVxuXG4gIGdldEV2ZW50UmFuZ2U6IChwb3MsIGV2ZW50VHlwZSkgLT5cbiAgICBzd2l0Y2ggZXZlbnRUeXBlXG4gICAgICB3aGVuICdtb3VzZScsICdjb250ZXh0J1xuICAgICAgICBwb3MgPz0gQGxhc3RNb3VzZUJ1ZmZlclB0XG4gICAgICAgIFtzZWxSYW5nZV0gPSBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgICAgIC5tYXAgKHNlbCkgLT5cbiAgICAgICAgICAgIHNlbC5nZXRCdWZmZXJSYW5nZSgpXG4gICAgICAgICAgLmZpbHRlciAoc2VsKSAtPlxuICAgICAgICAgICAgc2VsLmNvbnRhaW5zUG9pbnQgcG9zXG4gICAgICAgIGNyYW5nZSA9IHNlbFJhbmdlID8gUmFuZ2UuZnJvbVBvaW50V2l0aERlbHRhKHBvcywgMCwgMClcbiAgICAgIHdoZW4gJ2tleWJvYXJkJywgJ3NlbGVjdGlvbidcbiAgICAgICAgY3JhbmdlID0gQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkuZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgICBwb3MgPSBjcmFuZ2Uuc3RhcnRcbiAgICAgIGVsc2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwidW5rbm93biBldmVudCB0eXBlICN7ZXZlbnRUeXBlfVwiXG5cbiAgICByZXR1cm4ge2NyYW5nZSwgcG9zLCBldmVudFR5cGV9XG5cbiAgZmluZENoZWNrUmVzdWx0TWFya2VyczogKHBvcywgZ3V0dGVyLCBldmVudFR5cGUpIC0+XG4gICAgaWYgZ3V0dGVyXG4gICAgICBAZWRpdG9yLmZpbmRNYXJrZXJzIHt0eXBlOiAnY2hlY2stcmVzdWx0Jywgc3RhcnRCdWZmZXJSb3c6IHBvcy5yb3csIGVkaXRvcjogQGVkaXRvci5pZH1cbiAgICBlbHNlXG4gICAgICBzd2l0Y2ggZXZlbnRUeXBlXG4gICAgICAgIHdoZW4gJ2tleWJvYXJkJ1xuICAgICAgICAgIEBlZGl0b3IuZmluZE1hcmtlcnNcbiAgICAgICAgICAgIHR5cGU6ICdjaGVjay1yZXN1bHQnXG4gICAgICAgICAgICBlZGl0b3I6IEBlZGl0b3IuaWRcbiAgICAgICAgICAgIGNvbnRhaW5zUmFuZ2U6IFJhbmdlLmZyb21Qb2ludFdpdGhEZWx0YSBwb3MsIDAsIDFcbiAgICAgICAgd2hlbiAnbW91c2UnXG4gICAgICAgICAgQGVkaXRvci5maW5kTWFya2VycyB7dHlwZTogJ2NoZWNrLXJlc3VsdCcsIGVkaXRvcjogQGVkaXRvci5pZCwgY29udGFpbnNQb2ludDogcG9zfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgW11cblxuICAjIHNob3cgY2hlY2sgcmVzdWx0IHdoZW4gbW91c2Ugb3ZlciBndXR0ZXIgaWNvblxuICBzaG93Q2hlY2tSZXN1bHQ6IChwb3MsIGd1dHRlciwgZXZlbnRUeXBlID0gJ21vdXNlJykgLT5cbiAgICBtYXJrZXJzID0gQGZpbmRDaGVja1Jlc3VsdE1hcmtlcnMgcG9zLCBndXR0ZXIsIGV2ZW50VHlwZVxuICAgIFttYXJrZXJdID0gbWFya2Vyc1xuXG4gICAgdW5sZXNzIG1hcmtlcj9cbiAgICAgIEBoaWRlVG9vbHRpcCBzdWJ0eXBlOiAnY2hlY2stcmVzdWx0J1xuICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICB0ZXh0ID1cbiAgICAgIG1hcmtlcnMubWFwIChtYXJrZXIpIC0+XG4gICAgICAgIG1hcmtlci5nZXRQcm9wZXJ0aWVzKCkuZGVzY1xuXG4gICAgaWYgZ3V0dGVyXG4gICAgICBAc2hvd1Rvb2x0aXAgcG9zLCBuZXcgUmFuZ2UocG9zLCBwb3MpLCB0ZXh0LCB7ZXZlbnRUeXBlLCBzdWJ0eXBlOiAnY2hlY2stcmVzdWx0J31cbiAgICBlbHNlXG4gICAgICBAc2hvd1Rvb2x0aXAgcG9zLCBtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKSwgdGV4dCwge2V2ZW50VHlwZSwgc3VidHlwZTogJ2NoZWNrLXJlc3VsdCd9XG5cbiAgICByZXR1cm4gdHJ1ZVxuXG4gIGhhc1Rvb2x0aXBzOiAodGVtcGxhdGUgPSB7fSkgLT5cbiAgICB0ZW1wbGF0ZS50eXBlID0gJ3Rvb2x0aXAnXG4gICAgISFAZWRpdG9yLmZpbmRNYXJrZXJzKHRlbXBsYXRlKS5sZW5ndGhcbiJdfQ==

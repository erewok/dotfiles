(function() {
  var EditorControl, Range,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Range = null;

  module.exports = EditorControl = (function() {
    function EditorControl(editor) {
      var Emitter, SubAtom, buffer, bufferPositionFromMouseEvent, editorElement, gutterElement, _ref;
      this.editor = editor;
      this.updateResults = __bind(this.updateResults, this);
      SubAtom = require('sub-atom');
      this.disposables = new SubAtom;
      _ref = require('atom'), Range = _ref.Range, Emitter = _ref.Emitter;
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
          var bufferPt, _ref1;
          bufferPt = bufferPositionFromMouseEvent(_this.editor, e);
          if ((_ref1 = _this.lastMouseBufferPt) != null ? _ref1.isEqual(bufferPt) : void 0) {
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
        return function(_arg) {
          var newBufferRange;
          newBufferRange = _arg.newBufferRange;
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
      var m, r, t, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _results;
      if (types != null) {
        for (_i = 0, _len = types.length; _i < _len; _i++) {
          t = types[_i];
          _ref = this.editor.findMarkers({
            type: 'check-result',
            severity: t,
            editor: this.editor.id
          });
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            m = _ref[_j];
            m.destroy();
          }
        }
      } else {
        _ref1 = this.editor.findMarkers({
          type: 'check-result',
          editor: this.editor.id
        });
        for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
          m = _ref1[_k];
          m.destroy();
        }
      }
      _results = [];
      for (_l = 0, _len3 = res.length; _l < _len3; _l++) {
        r = res[_l];
        _results.push(this.markerFromCheckResult(r));
      }
      return _results;
    };

    EditorControl.prototype.markerFromCheckResult = function(resItem) {
      var marker, message, position, range, severity, uri;
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
      marker.disposables.add(marker.onDidChange(function(_arg) {
        var isValid;
        isValid = _arg.isValid;
        if (!isValid) {
          resItem.destroy();
          return marker.destroy();
        }
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
      } else {
        return this.emitter.emit('should-show-tooltip', {
          editor: this.editor,
          pos: pos,
          eventType: eventType
        });
      }
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
      var m, _i, _len, _ref, _results;
      if (template == null) {
        template = {};
      }
      this.tooltipHighlightRange = null;
      template.type = 'tooltip';
      _ref = this.editor.findMarkers(template);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        m = _ref[_i];
        _results.push(m.destroy());
      }
      return _results;
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

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvZWRpdG9yLWNvbnRyb2wuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFBQSxNQUFBLG9CQUFBO0lBQUEsa0ZBQUE7O0FBQUEsRUFBQSxLQUFBLEdBQVEsSUFBUixDQUFBOztBQUFBLEVBRUEsTUFBTSxDQUFDLE9BQVAsR0FDTTtBQUNTLElBQUEsdUJBQUUsTUFBRixHQUFBO0FBQ1gsVUFBQSwwRkFBQTtBQUFBLE1BRFksSUFBQyxDQUFBLFNBQUEsTUFDYixDQUFBO0FBQUEsMkRBQUEsQ0FBQTtBQUFBLE1BQUEsT0FBQSxHQUFVLE9BQUEsQ0FBUSxVQUFSLENBQVYsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLFdBQUQsR0FBZSxHQUFBLENBQUEsT0FEZixDQUFBO0FBQUEsTUFFQSxPQUFtQixPQUFBLENBQVEsTUFBUixDQUFuQixFQUFDLGFBQUEsS0FBRCxFQUFRLGVBQUEsT0FGUixDQUFBO0FBQUEsTUFHQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBQyxDQUFBLE9BQUQsR0FBVyxHQUFBLENBQUEsT0FBNUIsQ0FIQSxDQUFBO0FBQUEsTUFLQSxhQUFBLEdBQWdCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFDLENBQUEsTUFBcEIsQ0FMaEIsQ0FBQTtBQUFBLE1BT0EsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBdUIsMkJBQXZCLENBUFYsQ0FBQTs7UUFRQSxJQUFDLENBQUEsU0FBVSxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsQ0FDVDtBQUFBLFVBQUEsSUFBQSxFQUFNLDJCQUFOO0FBQUEsVUFDQSxRQUFBLEVBQVUsRUFEVjtTQURTO09BUlg7QUFBQSxNQVlDLCtCQUFn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

//# sourceURL=/Users/erewok/.atom/packages/ide-haskell/lib/editor-control.coffee

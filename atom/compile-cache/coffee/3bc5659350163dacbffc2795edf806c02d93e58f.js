(function() {
  var ProgressBar, ProgressBarElement,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ProgressBar = (function(superClass) {
    extend(ProgressBar, superClass);

    function ProgressBar() {
      return ProgressBar.__super__.constructor.apply(this, arguments);
    }

    ProgressBar.prototype.createdCallback = function() {
      return this.appendChild(this.span = document.createElement('span'));
    };

    ProgressBar.prototype.setProgress = function(progress, direction) {
      if (direction == null) {
        direction = 'horizontal';
      }
      if (direction === 'horizontal') {
        this.span.style.setProperty('width', (progress * 100) + "%");
        this.span.style.removeProperty('height');
      } else {
        this.span.style.setProperty('height', (progress * 100) + "%");
        this.span.style.removeProperty('width');
      }
      if (progress <= 0) {
        return this.classList.remove('visible');
      } else {
        return this.classList.add('visible');
      }
    };

    return ProgressBar;

  })(HTMLElement);

  module.exports = ProgressBarElement = document.registerElement('ide-haskell-progress-bar', {
    prototype: ProgressBar.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2VyZXdvay8uYXRvbS9wYWNrYWdlcy9pZGUtaGFza2VsbC9saWIvb3V0cHV0LXBhbmVsL3ZpZXdzL3Byb2dyZXNzLWJhci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLCtCQUFBO0lBQUE7OztFQUFNOzs7Ozs7OzBCQUNKLGVBQUEsR0FBaUIsU0FBQTthQUNmLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLElBQUQsR0FBUSxRQUFRLENBQUMsYUFBVCxDQUF1QixNQUF2QixDQUFyQjtJQURlOzswQkFHakIsV0FBQSxHQUFhLFNBQUMsUUFBRCxFQUFXLFNBQVg7O1FBQVcsWUFBWTs7TUFDbEMsSUFBRyxTQUFBLEtBQWEsWUFBaEI7UUFDRSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFaLENBQXdCLE9BQXhCLEVBQW1DLENBQUMsUUFBQSxHQUFXLEdBQVosQ0FBQSxHQUFnQixHQUFuRDtRQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQVosQ0FBMkIsUUFBM0IsRUFGRjtPQUFBLE1BQUE7UUFJRSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFaLENBQXdCLFFBQXhCLEVBQW9DLENBQUMsUUFBQSxHQUFXLEdBQVosQ0FBQSxHQUFnQixHQUFwRDtRQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQVosQ0FBMkIsT0FBM0IsRUFMRjs7TUFNQSxJQUFHLFFBQUEsSUFBWSxDQUFmO2VBQ0UsSUFBQyxDQUFBLFNBQVMsQ0FBQyxNQUFYLENBQWtCLFNBQWxCLEVBREY7T0FBQSxNQUFBO2VBR0UsSUFBQyxDQUFBLFNBQVMsQ0FBQyxHQUFYLENBQWUsU0FBZixFQUhGOztJQVBXOzs7O0tBSlc7O0VBaUIxQixNQUFNLENBQUMsT0FBUCxHQUFpQixrQkFBQSxHQUNmLFFBQVEsQ0FBQyxlQUFULENBQXlCLDBCQUF6QixFQUNFO0lBQUEsU0FBQSxFQUFXLFdBQVcsQ0FBQyxTQUF2QjtHQURGO0FBbEJGIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgUHJvZ3Jlc3NCYXIgZXh0ZW5kcyBIVE1MRWxlbWVudFxuICBjcmVhdGVkQ2FsbGJhY2s6IC0+XG4gICAgQGFwcGVuZENoaWxkIEBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnc3BhbidcblxuICBzZXRQcm9ncmVzczogKHByb2dyZXNzLCBkaXJlY3Rpb24gPSAnaG9yaXpvbnRhbCcpIC0+XG4gICAgaWYgZGlyZWN0aW9uIGlzICdob3Jpem9udGFsJ1xuICAgICAgQHNwYW4uc3R5bGUuc2V0UHJvcGVydHkgJ3dpZHRoJywgXCIje3Byb2dyZXNzICogMTAwfSVcIlxuICAgICAgQHNwYW4uc3R5bGUucmVtb3ZlUHJvcGVydHkgJ2hlaWdodCdcbiAgICBlbHNlXG4gICAgICBAc3Bhbi5zdHlsZS5zZXRQcm9wZXJ0eSAnaGVpZ2h0JywgXCIje3Byb2dyZXNzICogMTAwfSVcIlxuICAgICAgQHNwYW4uc3R5bGUucmVtb3ZlUHJvcGVydHkgJ3dpZHRoJ1xuICAgIGlmIHByb2dyZXNzIDw9IDBcbiAgICAgIEBjbGFzc0xpc3QucmVtb3ZlICd2aXNpYmxlJ1xuICAgIGVsc2VcbiAgICAgIEBjbGFzc0xpc3QuYWRkICd2aXNpYmxlJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gUHJvZ3Jlc3NCYXJFbGVtZW50ID1cbiAgZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50ICdpZGUtaGFza2VsbC1wcm9ncmVzcy1iYXInLFxuICAgIHByb3RvdHlwZTogUHJvZ3Jlc3NCYXIucHJvdG90eXBlXG4iXX0=

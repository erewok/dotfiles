Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _tabsSettings = require('./tabs-settings');

var _tabsSettings2 = _interopRequireDefault(_tabsSettings);

'use babel';
'use strict';

var panels = document.querySelectorAll('atom-panel-container');
var observerConfig = { childList: true };
var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function () {
        return toggleBlendTreeView(atom.config.get('atom-material-ui.treeView.blendTabs'));
    });
});

// Observe panels for DOM mutations
Array.prototype.forEach.call(panels, function (panel) {
    return observer.observe(panel, observerConfig);
});

function getTreeViews() {
    var treeViews = [document.querySelector('.tree-view-resizer:not(.nuclide-ui-panel-component)'), document.querySelector('.remote-ftp-view'), (function () {
        var nuclideTreeView = document.querySelector('.nuclide-file-tree-toolbar-container');

        if (nuclideTreeView) {
            return nuclideTreeView.closest('div[style*="display: flex;"]');
        }
    })()];

    return treeViews;
}

function removeBlendingEl(treeView) {

    if (treeView) {
        var blendingEl = treeView.querySelector('.tabBlender');

        if (blendingEl) {
            treeView.removeChild(blendingEl);
        }
    }
}

function toggleBlendTreeView(bool) {
    var treeViews = getTreeViews();

    setImmediate(function () {
        treeViews.forEach(function (treeView) {
            if (treeView) {
                var blendingEl = document.createElement('div');
                var title = document.createElement('span');

                blendingEl.classList.add('tabBlender');
                blendingEl.appendChild(title);

                if (treeView && bool) {
                    if (treeView.querySelector('.tabBlender')) {
                        removeBlendingEl(treeView);
                    }
                    treeView.insertBefore(blendingEl, treeView.firstChild);
                } else if (treeView && !bool) {
                    removeBlendingEl(treeView);
                } else if (!treeView && bool) {
                    if (atom.packages.getActivePackage('tree-view') || atom.packages.getActivePackage('Remote-FTP') || atom.packages.getActivePackage('nuclide')) {
                        return setTimeout(function () {
                            toggleBlendTreeView(bool);
                            setImmediate(function () {
                                return _tabsSettings2['default'].apply();
                            });
                        }, 2000);
                    }
                }
            }
        });
    });
}

atom.packages.onDidActivatePackage(function (pkg) {
    if (pkg.name === 'nuclide-file-tree') {
        toggleBlendTreeView(atom.config.get('atom-material-ui.treeView.blendTabs'));
    }
});

exports['default'] = { toggleBlendTreeView: toggleBlendTreeView };
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9lcmV3b2svLmF0b20vcGFja2FnZXMvYXRvbS1tYXRlcmlhbC11aS9saWIvdHJlZS12aWV3LXNldHRpbmdzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs0QkFHeUIsaUJBQWlCOzs7O0FBSDFDLFdBQVcsQ0FBQztBQUNaLFlBQVksQ0FBQzs7QUFJYixJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUMvRCxJQUFJLGNBQWMsR0FBRyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQztBQUN6QyxJQUFJLFFBQVEsR0FBRyxJQUFJLGdCQUFnQixDQUFDLFVBQUMsU0FBUyxFQUFLO0FBQ2xELGFBQVMsQ0FBQyxPQUFPLENBQUM7ZUFBTSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO0tBQUEsQ0FBQyxDQUFDO0NBQ3JHLENBQUMsQ0FBQzs7O0FBR0gsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxVQUFDLEtBQUs7V0FBSyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxjQUFjLENBQUM7Q0FBQSxDQUFDLENBQUM7O0FBRXpGLFNBQVMsWUFBWSxHQUFHO0FBQ3BCLFFBQUksU0FBUyxHQUFHLENBQ1osUUFBUSxDQUFDLGFBQWEsQ0FBQyxxREFBcUQsQ0FBQyxFQUM3RSxRQUFRLENBQUMsYUFBYSxDQUFDLGtCQUFrQixDQUFDLEVBQzFDLENBQUMsWUFBWTtBQUNULFlBQUksZUFBZSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsc0NBQXNDLENBQUMsQ0FBQzs7QUFFckYsWUFBSSxlQUFlLEVBQUU7QUFDakIsbUJBQU8sZUFBZSxDQUFDLE9BQU8sQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1NBQ2xFO0tBQ0osQ0FBQSxFQUFHLENBQ1AsQ0FBQzs7QUFFRixXQUFPLFNBQVMsQ0FBQztDQUNwQjs7QUFFRCxTQUFTLGdCQUFnQixDQUFDLFFBQVEsRUFBRTs7QUFFaEMsUUFBSSxRQUFRLEVBQUU7QUFDVixZQUFJLFVBQVUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDOztBQUV2RCxZQUFJLFVBQVUsRUFBRTtBQUNaLG9CQUFRLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ3BDO0tBQ0o7Q0FFSjs7QUFFRCxTQUFTLG1CQUFtQixDQUFDLElBQUksRUFBRTtBQUMvQixRQUFJLFNBQVMsR0FBRyxZQUFZLEVBQUUsQ0FBQzs7QUFFL0IsZ0JBQVksQ0FBQyxZQUFNO0FBQ2YsaUJBQVMsQ0FBQyxPQUFPLENBQUMsVUFBQyxRQUFRLEVBQUs7QUFDNUIsZ0JBQUksUUFBUSxFQUFFO0FBQ1Ysb0JBQUksVUFBVSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDL0Msb0JBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTNDLDBCQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUN2QywwQkFBVSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFOUIsb0JBQUksUUFBUSxJQUFJLElBQUksRUFBRTtBQUNsQix3QkFBSSxRQUFRLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxFQUFFO0FBQ3ZDLHdDQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO3FCQUM5QjtBQUNELDRCQUFRLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQzFELE1BQU0sSUFBSSxRQUFRLElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDMUIsb0NBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7aUJBQzlCLE1BQU0sSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLEVBQUU7QUFDMUIsd0JBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDMUksK0JBQU8sVUFBVSxDQUFDLFlBQU07QUFDcEIsK0NBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDMUIsd0NBQVksQ0FBQzt1Q0FBTSwwQkFBYSxLQUFLLEVBQUU7NkJBQUEsQ0FBQyxDQUFDO3lCQUM1QyxFQUFFLElBQUksQ0FBQyxDQUFDO3FCQUNaO2lCQUNKO2FBQ0o7U0FDSixDQUFDLENBQUM7S0FDTixDQUFDLENBQUM7Q0FDTjs7QUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLFVBQUMsR0FBRyxFQUFLO0FBQ3hDLFFBQUksR0FBRyxDQUFDLElBQUksS0FBSyxtQkFBbUIsRUFBRTtBQUNsQywyQkFBbUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDLENBQUM7S0FDL0U7Q0FDSixDQUFDLENBQUM7O3FCQUVZLEVBQUUsbUJBQW1CLEVBQW5CLG1CQUFtQixFQUFFIiwiZmlsZSI6Ii9Vc2Vycy9lcmV3b2svLmF0b20vcGFja2FnZXMvYXRvbS1tYXRlcmlhbC11aS9saWIvdHJlZS12aWV3LXNldHRpbmdzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB0YWJzU2V0dGluZ3MgZnJvbSAnLi90YWJzLXNldHRpbmdzJztcblxudmFyIHBhbmVscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2F0b20tcGFuZWwtY29udGFpbmVyJyk7XG52YXIgb2JzZXJ2ZXJDb25maWcgPSB7IGNoaWxkTGlzdDogdHJ1ZSB9O1xudmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKG11dGF0aW9ucykgPT4ge1xuXHRtdXRhdGlvbnMuZm9yRWFjaCgoKSA9PiB0b2dnbGVCbGVuZFRyZWVWaWV3KGF0b20uY29uZmlnLmdldCgnYXRvbS1tYXRlcmlhbC11aS50cmVlVmlldy5ibGVuZFRhYnMnKSkpO1xufSk7XG5cbi8vIE9ic2VydmUgcGFuZWxzIGZvciBET00gbXV0YXRpb25zXG5BcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHBhbmVscywgKHBhbmVsKSA9PiBvYnNlcnZlci5vYnNlcnZlKHBhbmVsLCBvYnNlcnZlckNvbmZpZykpO1xuXG5mdW5jdGlvbiBnZXRUcmVlVmlld3MoKSB7XG4gICAgdmFyIHRyZWVWaWV3cyA9IFtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnRyZWUtdmlldy1yZXNpemVyOm5vdCgubnVjbGlkZS11aS1wYW5lbC1jb21wb25lbnQpJyksXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yZW1vdGUtZnRwLXZpZXcnKSxcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBudWNsaWRlVHJlZVZpZXcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubnVjbGlkZS1maWxlLXRyZWUtdG9vbGJhci1jb250YWluZXInKTtcblxuICAgICAgICAgICAgaWYgKG51Y2xpZGVUcmVlVmlldykge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWNsaWRlVHJlZVZpZXcuY2xvc2VzdCgnZGl2W3N0eWxlKj1cImRpc3BsYXk6IGZsZXg7XCJdJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKClcbiAgICBdO1xuXG4gICAgcmV0dXJuIHRyZWVWaWV3cztcbn1cblxuZnVuY3Rpb24gcmVtb3ZlQmxlbmRpbmdFbCh0cmVlVmlldykge1xuXG4gICAgaWYgKHRyZWVWaWV3KSB7XG4gICAgICAgIHZhciBibGVuZGluZ0VsID0gdHJlZVZpZXcucXVlcnlTZWxlY3RvcignLnRhYkJsZW5kZXInKTtcblxuICAgICAgICBpZiAoYmxlbmRpbmdFbCkge1xuICAgICAgICAgICAgdHJlZVZpZXcucmVtb3ZlQ2hpbGQoYmxlbmRpbmdFbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbn1cblxuZnVuY3Rpb24gdG9nZ2xlQmxlbmRUcmVlVmlldyhib29sKSB7XG4gICAgdmFyIHRyZWVWaWV3cyA9IGdldFRyZWVWaWV3cygpO1xuXG4gICAgc2V0SW1tZWRpYXRlKCgpID0+IHtcbiAgICAgICAgdHJlZVZpZXdzLmZvckVhY2goKHRyZWVWaWV3KSA9PiB7XG4gICAgICAgICAgICBpZiAodHJlZVZpZXcpIHtcbiAgICAgICAgICAgICAgICB2YXIgYmxlbmRpbmdFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgIHZhciB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcblxuICAgICAgICAgICAgICAgIGJsZW5kaW5nRWwuY2xhc3NMaXN0LmFkZCgndGFiQmxlbmRlcicpO1xuICAgICAgICAgICAgICAgIGJsZW5kaW5nRWwuYXBwZW5kQ2hpbGQodGl0bGUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRyZWVWaWV3ICYmIGJvb2wpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyZWVWaWV3LnF1ZXJ5U2VsZWN0b3IoJy50YWJCbGVuZGVyJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUJsZW5kaW5nRWwodHJlZVZpZXcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRyZWVWaWV3Lmluc2VydEJlZm9yZShibGVuZGluZ0VsLCB0cmVlVmlldy5maXJzdENoaWxkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRyZWVWaWV3ICYmICFib29sKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUJsZW5kaW5nRWwodHJlZVZpZXcpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIXRyZWVWaWV3ICYmIGJvb2wpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF0b20ucGFja2FnZXMuZ2V0QWN0aXZlUGFja2FnZSgndHJlZS12aWV3JykgfHwgYXRvbS5wYWNrYWdlcy5nZXRBY3RpdmVQYWNrYWdlKCdSZW1vdGUtRlRQJykgfHwgYXRvbS5wYWNrYWdlcy5nZXRBY3RpdmVQYWNrYWdlKCdudWNsaWRlJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGVCbGVuZFRyZWVWaWV3KGJvb2wpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEltbWVkaWF0ZSgoKSA9PiB0YWJzU2V0dGluZ3MuYXBwbHkoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmF0b20ucGFja2FnZXMub25EaWRBY3RpdmF0ZVBhY2thZ2UoKHBrZykgPT4ge1xuICAgIGlmIChwa2cubmFtZSA9PT0gJ251Y2xpZGUtZmlsZS10cmVlJykge1xuICAgICAgICB0b2dnbGVCbGVuZFRyZWVWaWV3KGF0b20uY29uZmlnLmdldCgnYXRvbS1tYXRlcmlhbC11aS50cmVlVmlldy5ibGVuZFRhYnMnKSk7XG4gICAgfVxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IHsgdG9nZ2xlQmxlbmRUcmVlVmlldyB9O1xuIl19
//# sourceURL=/Users/erewok/.atom/packages/atom-material-ui/lib/tree-view-settings.js

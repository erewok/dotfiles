'use babel';
'use strict';

function rippleClick(event) {
    var item = event.target;

    if (!item) return;

    var rect = item.getBoundingClientRect();
    var x = (event.clientX || 80) - rect.left;
    var y = (event.clientY || 24) - rect.top;
    var ink = undefined;

    if (item.querySelectorAll('.ink').length === 0) {
        ink = document.createElement('span');

        ink.classList.add('ink');
        item.appendChild(ink);
    }

    ink = item.querySelector('.ink');
    ink.style.left = x + 'px';
    ink.style.top = y + 'px';

    setTimeout(function () {
        if (ink && ink.parentElement) {
            ink.parentElement.removeChild(ink);
        }
    }, 1000);
}

function apply() {
    var tabs = document.querySelectorAll('.tab-bar');

    // Ripple Effect for Tabs
    if (tabs) {
        Array.from(tabs).forEach(function (tab) {
            tab.removeEventListener('click', rippleClick);
            tab.addEventListener('click', rippleClick);

            atom.workspace.onDidChangeActivePaneItem(function () {
                var activeTab = document.querySelector('.tab-bar .tab.active');

                if (activeTab && activeTab.click) {
                    activeTab.click();
                }
            });
        });
    }
}

atom.workspace.onDidAddPane(function () {
    setImmediate(function () {
        return apply();
    });
});

module.exports = { apply: apply };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9lcmV3b2svLmF0b20vcGFja2FnZXMvYXRvbS1tYXRlcmlhbC11aS9saWIvdGFicy1zZXR0aW5ncy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7QUFDWixZQUFZLENBQUM7O0FBRWIsU0FBUyxXQUFXLENBQUMsS0FBSyxFQUFFO0FBQ3hCLFFBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7O0FBRXhCLFFBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTzs7QUFFbEIsUUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7QUFDMUMsUUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQSxHQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDNUMsUUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQSxHQUFJLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDM0MsUUFBSSxHQUFHLFlBQUEsQ0FBQzs7QUFFUixRQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQzVDLFdBQUcsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUVyQyxXQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN6QixZQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3pCOztBQUVELE9BQUcsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2pDLE9BQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDMUIsT0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQzs7QUFFekIsY0FBVSxDQUFDLFlBQU07QUFDYixZQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsYUFBYSxFQUFFO0FBQzFCLGVBQUcsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3RDO0tBQ0osRUFBRSxJQUFJLENBQUMsQ0FBQztDQUNaOztBQUVELFNBQVMsS0FBSyxHQUFHO0FBQ2IsUUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDOzs7QUFHakQsUUFBSSxJQUFJLEVBQUU7QUFDTixhQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFDLEdBQUcsRUFBSztBQUM5QixlQUFHLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQzlDLGVBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7O0FBRTNDLGdCQUFJLENBQUMsU0FBUyxDQUFDLHlCQUF5QixDQUFDLFlBQU07QUFDM0Msb0JBQUksU0FBUyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsc0JBQXNCLENBQUMsQ0FBQzs7QUFFL0Qsb0JBQUksU0FBUyxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUU7QUFDOUIsNkJBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztpQkFDckI7YUFDSixDQUFDLENBQUM7U0FDTixDQUFDLENBQUM7S0FDTjtDQUNKOztBQUVELElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLFlBQU07QUFDOUIsZ0JBQVksQ0FBQztlQUFNLEtBQUssRUFBRTtLQUFBLENBQUMsQ0FBQztDQUMvQixDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxFQUFFLEtBQUssRUFBTCxLQUFLLEVBQUUsQ0FBQyIsImZpbGUiOiIvVXNlcnMvZXJld29rLy5hdG9tL3BhY2thZ2VzL2F0b20tbWF0ZXJpYWwtdWkvbGliL3RhYnMtc2V0dGluZ3MuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gcmlwcGxlQ2xpY2soZXZlbnQpIHtcbiAgICB2YXIgaXRlbSA9IGV2ZW50LnRhcmdldDtcblxuICAgIGlmICghaXRlbSkgcmV0dXJuO1xuXG4gICAgY29uc3QgcmVjdCA9IGl0ZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgeCA9IChldmVudC5jbGllbnRYIHx8IDgwKSAtIHJlY3QubGVmdDtcbiAgICBjb25zdCB5ID0gKGV2ZW50LmNsaWVudFkgfHwgMjQpIC0gcmVjdC50b3A7XG4gICAgbGV0IGluaztcblxuICAgIGlmIChpdGVtLnF1ZXJ5U2VsZWN0b3JBbGwoJy5pbmsnKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXG4gICAgICAgIGluay5jbGFzc0xpc3QuYWRkKCdpbmsnKTtcbiAgICAgICAgaXRlbS5hcHBlbmRDaGlsZChpbmspO1xuICAgIH1cblxuICAgIGluayA9IGl0ZW0ucXVlcnlTZWxlY3RvcignLmluaycpO1xuICAgIGluay5zdHlsZS5sZWZ0ID0geCArICdweCc7XG4gICAgaW5rLnN0eWxlLnRvcCA9IHkgKyAncHgnO1xuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGlmIChpbmsgJiYgaW5rLnBhcmVudEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGluay5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKGluayk7XG4gICAgICAgIH1cbiAgICB9LCAxMDAwKTtcbn1cblxuZnVuY3Rpb24gYXBwbHkoKSB7XG4gICAgdmFyIHRhYnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudGFiLWJhcicpO1xuXG4gICAgLy8gUmlwcGxlIEVmZmVjdCBmb3IgVGFic1xuICAgIGlmICh0YWJzKSB7XG4gICAgICAgIEFycmF5LmZyb20odGFicykuZm9yRWFjaCgodGFiKSA9PiB7XG4gICAgICAgICAgICB0YWIucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCByaXBwbGVDbGljayk7XG4gICAgICAgICAgICB0YWIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCByaXBwbGVDbGljayk7XG5cbiAgICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW0oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHZhciBhY3RpdmVUYWIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudGFiLWJhciAudGFiLmFjdGl2ZScpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGFjdGl2ZVRhYiAmJiBhY3RpdmVUYWIuY2xpY2spIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlVGFiLmNsaWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuYXRvbS53b3Jrc3BhY2Uub25EaWRBZGRQYW5lKCgpID0+IHtcbiAgICBzZXRJbW1lZGlhdGUoKCkgPT4gYXBwbHkoKSk7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSB7IGFwcGx5IH07XG4iXX0=
//# sourceURL=/Users/erewok/.atom/packages/atom-material-ui/lib/tabs-settings.js
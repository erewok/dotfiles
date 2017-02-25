'use babel';
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
function toggleClass(boolean, className) {
    var root = document.querySelector('atom-workspace');

    if (boolean) {
        root.classList.add(className);
    } else {
        root.classList.remove(className);
    }
}

function toCamelCase(str) {
    return str.replace(/\s(.)/g, function ($1) {
        return $1.toUpperCase();
    }).replace(/\s/g, '').replace(/^(.)/, function ($1) {
        return $1.toLowerCase();
    });
}

exports['default'] = {
    toggleClass: toggleClass,
    toCamelCase: toCamelCase
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9lcmV3b2svLmF0b20vcGFja2FnZXMvYXRvbS1tYXRlcmlhbC11aS9saWIvaGVscGVycy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7QUFDWixZQUFZLENBQUM7Ozs7O0FBRWIsU0FBUyxXQUFXLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRTtBQUNyQyxRQUFJLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7O0FBRXBELFFBQUksT0FBTyxFQUFFO0FBQ1QsWUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDakMsTUFBTTtBQUNILFlBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQ3BDO0NBQ0o7O0FBRUQsU0FBUyxXQUFXLENBQUMsR0FBRyxFQUFFO0FBQ3RCLFdBQU8sR0FBRyxDQUNMLE9BQU8sQ0FBQyxRQUFRLEVBQUUsVUFBUyxFQUFFLEVBQUU7QUFBRSxlQUFPLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztLQUFFLENBQUMsQ0FDNUQsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FDbEIsT0FBTyxDQUFDLE1BQU0sRUFBRSxVQUFTLEVBQUUsRUFBRTtBQUFFLGVBQU8sRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0tBQUUsQ0FBQyxDQUFDO0NBQ25FOztxQkFFYztBQUNYLGVBQVcsRUFBWCxXQUFXO0FBQ1gsZUFBVyxFQUFYLFdBQVc7Q0FDZCIsImZpbGUiOiIvVXNlcnMvZXJld29rLy5hdG9tL3BhY2thZ2VzL2F0b20tbWF0ZXJpYWwtdWkvbGliL2hlbHBlcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gdG9nZ2xlQ2xhc3MoYm9vbGVhbiwgY2xhc3NOYW1lKSB7XG4gICAgdmFyIHJvb3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdhdG9tLXdvcmtzcGFjZScpO1xuXG4gICAgaWYgKGJvb2xlYW4pIHtcbiAgICAgICAgcm9vdC5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0b0NhbWVsQ2FzZShzdHIpIHtcbiAgICByZXR1cm4gc3RyXG4gICAgICAgIC5yZXBsYWNlKC9cXHMoLikvZywgZnVuY3Rpb24oJDEpIHsgcmV0dXJuICQxLnRvVXBwZXJDYXNlKCk7IH0pXG4gICAgICAgIC5yZXBsYWNlKC9cXHMvZywgJycpXG4gICAgICAgIC5yZXBsYWNlKC9eKC4pLywgZnVuY3Rpb24oJDEpIHsgcmV0dXJuICQxLnRvTG93ZXJDYXNlKCk7IH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgdG9nZ2xlQ2xhc3MsXG4gICAgdG9DYW1lbENhc2Vcbn07XG4iXX0=
//# sourceURL=/Users/erewok/.atom/packages/atom-material-ui/lib/helpers.js

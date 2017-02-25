Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _main = require('./main');

var _main2 = _interopRequireDefault(_main);

var _helpers = require('./helpers');

var _tinycolor2 = require('tinycolor2');

var _tinycolor22 = _interopRequireDefault(_tinycolor2);

var _colorTemplates = require('./color-templates');

var _colorTemplates2 = _interopRequireDefault(_colorTemplates);

'use babel';
'use strict';

function init() {
    (0, _helpers.toggleClass)(atom.config.get('atom-material-ui.colors.paintCursor'), 'paint-cursor');
}

function apply() {

    init();

    atom.config.onDidChange('atom-material-ui.colors.accentColor', function () {
        return _main2['default'].writeConfig();
    });

    atom.config.onDidChange('atom-material-ui.colors.abaseColor', function (value) {
        var baseColor = (0, _tinycolor22['default'])(value.newValue.toRGBAString());

        if (atom.config.get('atom-material-ui.colors.genAccent')) {
            var accentColor = baseColor.complement().saturate(20).lighten(5);
            return atom.config.set('atom-material-ui.colors.accentColor', accentColor.toRgbString());
        }

        _main2['default'].writeConfig();
    });

    atom.config.onDidChange('atom-material-ui.colors.predefinedColor', function (value) {
        var newValue = (0, _helpers.toCamelCase)(value.newValue);

        atom.config.set('atom-material-ui.colors.abaseColor', _colorTemplates2['default'][newValue].base);
        atom.config.set('atom-material-ui.colors.accentColor', _colorTemplates2['default'][newValue].accent);
    });

    atom.config.onDidChange('atom-material-ui.colors.paintCursor', function (value) {
        return (0, _helpers.toggleClass)(value.newValue, 'paint-cursor');
    });
}

exports['default'] = { apply: apply };
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9lcmV3b2svLmF0b20vcGFja2FnZXMvYXRvbS1tYXRlcmlhbC11aS9saWIvY29sb3Itc2V0dGluZ3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O29CQUdnQixRQUFROzs7O3VCQUNpQixXQUFXOzswQkFDOUIsWUFBWTs7Ozs4QkFDUCxtQkFBbUI7Ozs7QUFOOUMsV0FBVyxDQUFDO0FBQ1osWUFBWSxDQUFDOztBQU9iLFNBQVMsSUFBSSxHQUFHO0FBQ1osOEJBQVksSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMscUNBQXFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztDQUN2Rjs7QUFFRCxTQUFTLEtBQUssR0FBRzs7QUFFYixRQUFJLEVBQUUsQ0FBQzs7QUFFUCxRQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxxQ0FBcUMsRUFBRTtlQUFNLGtCQUFJLFdBQVcsRUFBRTtLQUFBLENBQUMsQ0FBQzs7QUFFeEYsUUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0NBQW9DLEVBQUUsVUFBQyxLQUFLLEVBQUs7QUFDckUsWUFBSSxTQUFTLEdBQUcsNkJBQVUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDOztBQUV6RCxZQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxDQUFDLEVBQUU7QUFDdEQsZ0JBQUksV0FBVyxHQUFHLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pFLG1CQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHFDQUFxQyxFQUFFLFdBQVcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1NBQzVGOztBQUVELDBCQUFJLFdBQVcsRUFBRSxDQUFDO0tBQ3JCLENBQUMsQ0FBQzs7QUFFSCxRQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5Q0FBeUMsRUFBRSxVQUFDLEtBQUssRUFBSztBQUMxRSxZQUFJLFFBQVEsR0FBRywwQkFBWSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRTNDLFlBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLG9DQUFvQyxFQUFFLDRCQUFlLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3JGLFlBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHFDQUFxQyxFQUFFLDRCQUFlLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQzNGLENBQUMsQ0FBQzs7QUFFSCxRQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxxQ0FBcUMsRUFBRSxVQUFDLEtBQUs7ZUFBSywwQkFBWSxLQUFLLENBQUMsUUFBUSxFQUFFLGNBQWMsQ0FBQztLQUFBLENBQUMsQ0FBQztDQUMxSDs7cUJBRWMsRUFBRSxLQUFLLEVBQUwsS0FBSyxFQUFFIiwiZmlsZSI6Ii9Vc2Vycy9lcmV3b2svLmF0b20vcGFja2FnZXMvYXRvbS1tYXRlcmlhbC11aS9saWIvY29sb3Itc2V0dGluZ3MuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IGFtdSBmcm9tICcuL21haW4nO1xuaW1wb3J0IHsgdG9DYW1lbENhc2UsIHRvZ2dsZUNsYXNzIH0gZnJvbSAnLi9oZWxwZXJzJztcbmltcG9ydCB0aW55Y29sb3IgZnJvbSAndGlueWNvbG9yMic7XG5pbXBvcnQgY29sb3JUZW1wbGF0ZXMgZnJvbSAnLi9jb2xvci10ZW1wbGF0ZXMnO1xuXG5mdW5jdGlvbiBpbml0KCkge1xuICAgIHRvZ2dsZUNsYXNzKGF0b20uY29uZmlnLmdldCgnYXRvbS1tYXRlcmlhbC11aS5jb2xvcnMucGFpbnRDdXJzb3InKSwgJ3BhaW50LWN1cnNvcicpO1xufVxuXG5mdW5jdGlvbiBhcHBseSgpIHtcblxuICAgIGluaXQoKTtcbiAgICBcbiAgICBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSgnYXRvbS1tYXRlcmlhbC11aS5jb2xvcnMuYWNjZW50Q29sb3InLCAoKSA9PiBhbXUud3JpdGVDb25maWcoKSk7XG5cbiAgICBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSgnYXRvbS1tYXRlcmlhbC11aS5jb2xvcnMuYWJhc2VDb2xvcicsICh2YWx1ZSkgPT4ge1xuICAgICAgICB2YXIgYmFzZUNvbG9yID0gdGlueWNvbG9yKHZhbHVlLm5ld1ZhbHVlLnRvUkdCQVN0cmluZygpKTtcblxuICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdhdG9tLW1hdGVyaWFsLXVpLmNvbG9ycy5nZW5BY2NlbnQnKSkge1xuICAgICAgICAgICAgbGV0IGFjY2VudENvbG9yID0gYmFzZUNvbG9yLmNvbXBsZW1lbnQoKS5zYXR1cmF0ZSgyMCkubGlnaHRlbig1KTtcbiAgICAgICAgICAgIHJldHVybiBhdG9tLmNvbmZpZy5zZXQoJ2F0b20tbWF0ZXJpYWwtdWkuY29sb3JzLmFjY2VudENvbG9yJywgYWNjZW50Q29sb3IudG9SZ2JTdHJpbmcoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBhbXUud3JpdGVDb25maWcoKTtcbiAgICB9KTtcblxuICAgIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlKCdhdG9tLW1hdGVyaWFsLXVpLmNvbG9ycy5wcmVkZWZpbmVkQ29sb3InLCAodmFsdWUpID0+IHtcbiAgICAgICAgdmFyIG5ld1ZhbHVlID0gdG9DYW1lbENhc2UodmFsdWUubmV3VmFsdWUpO1xuXG4gICAgICAgIGF0b20uY29uZmlnLnNldCgnYXRvbS1tYXRlcmlhbC11aS5jb2xvcnMuYWJhc2VDb2xvcicsIGNvbG9yVGVtcGxhdGVzW25ld1ZhbHVlXS5iYXNlKTtcbiAgICAgICAgYXRvbS5jb25maWcuc2V0KCdhdG9tLW1hdGVyaWFsLXVpLmNvbG9ycy5hY2NlbnRDb2xvcicsIGNvbG9yVGVtcGxhdGVzW25ld1ZhbHVlXS5hY2NlbnQpO1xuICAgIH0pO1xuXG4gICAgYXRvbS5jb25maWcub25EaWRDaGFuZ2UoJ2F0b20tbWF0ZXJpYWwtdWkuY29sb3JzLnBhaW50Q3Vyc29yJywgKHZhbHVlKSA9PiB0b2dnbGVDbGFzcyh2YWx1ZS5uZXdWYWx1ZSwgJ3BhaW50LWN1cnNvcicpKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgeyBhcHBseSB9O1xuIl19
//# sourceURL=/Users/erewok/.atom/packages/atom-material-ui/lib/color-settings.js

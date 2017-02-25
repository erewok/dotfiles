Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _configSchema = require('./config-schema');

var _configSchema2 = _interopRequireDefault(_configSchema);

var _settings = require('./settings');

var _settings2 = _interopRequireDefault(_settings);

var _colorSettings = require('./color-settings');

var _colorSettings2 = _interopRequireDefault(_colorSettings);

var _tabsSettings = require('./tabs-settings');

var _tabsSettings2 = _interopRequireDefault(_tabsSettings);

var _treeViewSettings = require('./tree-view-settings');

var _treeViewSettings2 = _interopRequireDefault(_treeViewSettings);

var _tinycolor2 = require('tinycolor2');

var _tinycolor22 = _interopRequireDefault(_tinycolor2);

var _updateConfigSchema = require('./update-config-schema');

'use babel';
'use strict';

exports['default'] = {
    config: _configSchema2['default'],

    writeConfig: function writeConfig(options) {
        var accentColor = atom.config.get('atom-material-ui.colors.accentColor').toRGBAString();
        var baseColor = atom.config.get('atom-material-ui.colors.abaseColor').toRGBAString();
        var accentTextColor = '#666';
        var luminance = (0, _tinycolor22['default'])(baseColor).getLuminance();

        if (luminance <= 0.3 && luminance > 0.22) {
            accentTextColor = 'rgba(255,255,255,0.9)';
        } else if (luminance <= 0.22) {
            accentTextColor = 'rgba(255,255,255,0.8)';
        } else if (luminance > 0.3) {
            accentTextColor = 'rgba(0,0,0,0.6)';
        }

        /**
        * This is kind of against Airbnb's stylguide, but produces a much
        * better output and is readable.
        */
        var config = '@accent-color: ' + accentColor + ';\n' + ('@accent-text-color: ' + accentTextColor + ';\n') + ('@base-color: ' + baseColor + ';\n');

        _fs2['default'].writeFile(__dirname + '/../styles/custom.less', config, 'utf8', function () {
            if (!options || !options.noReload) {
                var themePack = atom.packages.getLoadedPackage('atom-material-ui');

                if (themePack) {
                    themePack.deactivate();
                    setImmediate(function () {
                        return themePack.activate();
                    });
                }
            }
            if (options && options.callback && typeof options.callback === 'function') {
                options.callback();
            }
        });
    },

    activate: function activate() {
        (0, _updateConfigSchema.apply)();
        _settings2['default'].apply();
        _colorSettings2['default'].apply();
        setImmediate(function () {
            return _tabsSettings2['default'].apply();
        });
        this.writeConfig({ noReload: true });
    },

    deactivate: function deactivate() {
        _treeViewSettings2['default'].toggleBlendTreeView(false);
    }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9lcmV3b2svLmF0b20vcGFja2FnZXMvYXRvbS1tYXRlcmlhbC11aS9saWIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7a0JBR2UsSUFBSTs7Ozs0QkFDQSxpQkFBaUI7Ozs7d0JBQ2YsWUFBWTs7Ozs2QkFDUCxrQkFBa0I7Ozs7NEJBQ25CLGlCQUFpQjs7OztnQ0FDYixzQkFBc0I7Ozs7MEJBQzdCLFlBQVk7Ozs7a0NBQ0ksd0JBQXdCOztBQVY5RCxXQUFXLENBQUM7QUFDWixZQUFZLENBQUM7O3FCQVdFO0FBQ1gsVUFBTSwyQkFBQTs7QUFFTixlQUFXLEVBQUEscUJBQUMsT0FBTyxFQUFFO0FBQ2pCLFlBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHFDQUFxQyxDQUFDLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDeEYsWUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsb0NBQW9DLENBQUMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUNyRixZQUFJLGVBQWUsR0FBRyxNQUFNLENBQUM7QUFDN0IsWUFBSSxTQUFTLEdBQUcsNkJBQVUsU0FBUyxDQUFDLENBQUMsWUFBWSxFQUFFLENBQUM7O0FBRXBELFlBQUksU0FBUyxJQUFJLEdBQUcsSUFBSSxTQUFTLEdBQUcsSUFBSSxFQUFFO0FBQ3RDLDJCQUFlLEdBQUcsdUJBQXVCLENBQUM7U0FDN0MsTUFBTSxJQUFJLFNBQVMsSUFBSSxJQUFJLEVBQUU7QUFDMUIsMkJBQWUsR0FBRyx1QkFBdUIsQ0FBQztTQUM3QyxNQUFNLElBQUksU0FBUyxHQUFHLEdBQUcsRUFBRTtBQUN4QiwyQkFBZSxHQUFHLGlCQUFpQixDQUFDO1NBQ3ZDOzs7Ozs7QUFNRCxZQUFJLE1BQU0sR0FBRyxvQkFBa0IsV0FBVyxxQ0FDTixlQUFlLFNBQUssc0JBQzNCLFNBQVMsU0FBSyxDQUFDOztBQUU1Qyx3QkFBRyxTQUFTLENBQUksU0FBUyw2QkFBMEIsTUFBTSxFQUFFLE1BQU0sRUFBRSxZQUFNO0FBQ3JFLGdCQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTtBQUMvQixvQkFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDOztBQUVuRSxvQkFBSSxTQUFTLEVBQUU7QUFDWCw2QkFBUyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ3ZCLGdDQUFZLENBQUM7K0JBQU0sU0FBUyxDQUFDLFFBQVEsRUFBRTtxQkFBQSxDQUFDLENBQUM7aUJBQzVDO2FBQ0o7QUFDRCxnQkFBSSxPQUFPLElBQUksT0FBTyxDQUFDLFFBQVEsSUFBSSxPQUFPLE9BQU8sQ0FBQyxRQUFRLEtBQUssVUFBVSxFQUFFO0FBQ3ZFLHVCQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7YUFDdEI7U0FDSixDQUFDLENBQUM7S0FDTjs7QUFFRCxZQUFRLEVBQUEsb0JBQUc7QUFDUCx3Q0FBYyxDQUFDO0FBQ2YsOEJBQVMsS0FBSyxFQUFFLENBQUM7QUFDakIsbUNBQWMsS0FBSyxFQUFFLENBQUM7QUFDdEIsb0JBQVksQ0FBQzttQkFBTSwwQkFBYSxLQUFLLEVBQUU7U0FBQSxDQUFDLENBQUM7QUFDekMsWUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0tBQ3hDOztBQUVELGNBQVUsRUFBQSxzQkFBRztBQUNULHNDQUFpQixtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUMvQztDQUNKIiwiZmlsZSI6Ii9Vc2Vycy9lcmV3b2svLmF0b20vcGFja2FnZXMvYXRvbS1tYXRlcmlhbC11aS9saWIvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuL2NvbmZpZy1zY2hlbWEnO1xuaW1wb3J0IHNldHRpbmdzIGZyb20gJy4vc2V0dGluZ3MnO1xuaW1wb3J0IGNvbG9yU2V0dGluZ3MgZnJvbSAnLi9jb2xvci1zZXR0aW5ncyc7XG5pbXBvcnQgdGFic1NldHRpbmdzIGZyb20gJy4vdGFicy1zZXR0aW5ncyc7XG5pbXBvcnQgdHJlZVZpZXdTZXR0aW5ncyBmcm9tICcuL3RyZWUtdmlldy1zZXR0aW5ncyc7XG5pbXBvcnQgdGlueWNvbG9yIGZyb20gJ3Rpbnljb2xvcjInO1xuaW1wb3J0IHsgYXBwbHkgYXMgdXBkYXRlU2NoZW1hIH0gZnJvbSAnLi91cGRhdGUtY29uZmlnLXNjaGVtYSc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBjb25maWcsXG5cbiAgICB3cml0ZUNvbmZpZyhvcHRpb25zKSB7XG4gICAgICAgIHZhciBhY2NlbnRDb2xvciA9IGF0b20uY29uZmlnLmdldCgnYXRvbS1tYXRlcmlhbC11aS5jb2xvcnMuYWNjZW50Q29sb3InKS50b1JHQkFTdHJpbmcoKTtcbiAgICAgICAgdmFyIGJhc2VDb2xvciA9IGF0b20uY29uZmlnLmdldCgnYXRvbS1tYXRlcmlhbC11aS5jb2xvcnMuYWJhc2VDb2xvcicpLnRvUkdCQVN0cmluZygpO1xuICAgICAgICB2YXIgYWNjZW50VGV4dENvbG9yID0gJyM2NjYnO1xuICAgICAgICB2YXIgbHVtaW5hbmNlID0gdGlueWNvbG9yKGJhc2VDb2xvcikuZ2V0THVtaW5hbmNlKCk7XG5cbiAgICAgICAgaWYgKGx1bWluYW5jZSA8PSAwLjMgJiYgbHVtaW5hbmNlID4gMC4yMikge1xuICAgICAgICAgICAgYWNjZW50VGV4dENvbG9yID0gJ3JnYmEoMjU1LDI1NSwyNTUsMC45KSc7XG4gICAgICAgIH0gZWxzZSBpZiAobHVtaW5hbmNlIDw9IDAuMjIpIHtcbiAgICAgICAgICAgIGFjY2VudFRleHRDb2xvciA9ICdyZ2JhKDI1NSwyNTUsMjU1LDAuOCknO1xuICAgICAgICB9IGVsc2UgaWYgKGx1bWluYW5jZSA+IDAuMykge1xuICAgICAgICAgICAgYWNjZW50VGV4dENvbG9yID0gJ3JnYmEoMCwwLDAsMC42KSc7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgKiBUaGlzIGlzIGtpbmQgb2YgYWdhaW5zdCBBaXJibmIncyBzdHlsZ3VpZGUsIGJ1dCBwcm9kdWNlcyBhIG11Y2hcbiAgICAgICAgKiBiZXR0ZXIgb3V0cHV0IGFuZCBpcyByZWFkYWJsZS5cbiAgICAgICAgKi9cbiAgICAgICAgdmFyIGNvbmZpZyA9IGBAYWNjZW50LWNvbG9yOiAke2FjY2VudENvbG9yfTtcXG5gICtcbiAgICAgICAgICAgICAgICAgICAgIGBAYWNjZW50LXRleHQtY29sb3I6ICR7YWNjZW50VGV4dENvbG9yfTtcXG5gICtcbiAgICAgICAgICAgICAgICAgICAgIGBAYmFzZS1jb2xvcjogJHtiYXNlQ29sb3J9O1xcbmA7XG5cbiAgICAgICAgZnMud3JpdGVGaWxlKGAke19fZGlybmFtZX0vLi4vc3R5bGVzL2N1c3RvbS5sZXNzYCwgY29uZmlnLCAndXRmOCcsICgpID0+IHtcbiAgICAgICAgICAgIGlmICghb3B0aW9ucyB8fCAhb3B0aW9ucy5ub1JlbG9hZCkge1xuICAgICAgICAgICAgICAgIHZhciB0aGVtZVBhY2sgPSBhdG9tLnBhY2thZ2VzLmdldExvYWRlZFBhY2thZ2UoJ2F0b20tbWF0ZXJpYWwtdWknKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGVtZVBhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgdGhlbWVQYWNrLmRlYWN0aXZhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0SW1tZWRpYXRlKCgpID0+IHRoZW1lUGFjay5hY3RpdmF0ZSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmNhbGxiYWNrICYmIHR5cGVvZiBvcHRpb25zLmNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5jYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHVwZGF0ZVNjaGVtYSgpO1xuICAgICAgICBzZXR0aW5ncy5hcHBseSgpO1xuICAgICAgICBjb2xvclNldHRpbmdzLmFwcGx5KCk7XG4gICAgICAgIHNldEltbWVkaWF0ZSgoKSA9PiB0YWJzU2V0dGluZ3MuYXBwbHkoKSk7XG4gICAgICAgIHRoaXMud3JpdGVDb25maWcoeyBub1JlbG9hZDogdHJ1ZSB9KTtcbiAgICB9LFxuXG4gICAgZGVhY3RpdmF0ZSgpIHtcbiAgICAgICAgdHJlZVZpZXdTZXR0aW5ncy50b2dnbGVCbGVuZFRyZWVWaWV3KGZhbHNlKTtcbiAgICB9XG59O1xuIl19
//# sourceURL=/Users/erewok/.atom/packages/atom-material-ui/lib/main.js

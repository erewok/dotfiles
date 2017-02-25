'use babel';

var provider = require('./provider');

var _require = require('path');

var join = _require.join;

module.exports = {
  config: {
    autocompleteEnabled: {
      title: 'Enable autocomplete',
      type: 'boolean',
      'default': true
    },
    elmOraclePath: {
      title: 'The elm-oracle executable path (used for autocomplete)',
      type: 'string',
      'default': join(__dirname, '..', 'node_modules', '.bin', 'elm-oracle')
    },
    minCharsForAutocomplete: {
      title: 'The min number of characters to enter before autocomplete appears',
      type: 'number',
      'default': 1
    }
  },

  provide: function provide() {
    return [provider];
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9lcmV3b2svLmF0b20vcGFja2FnZXMvbGFuZ3VhZ2UtZWxtL2xpYi9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQTs7QUFFWCxJQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUE7O2VBQ3JCLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQXhCLElBQUksWUFBSixJQUFJOztBQUVaLE1BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDZixRQUFNLEVBQUU7QUFDTix1QkFBbUIsRUFBRTtBQUNuQixXQUFLLEVBQUUscUJBQXFCO0FBQzVCLFVBQUksRUFBRSxTQUFTO0FBQ2YsaUJBQVMsSUFBSTtLQUNkO0FBQ0QsaUJBQWEsRUFBRTtBQUNiLFdBQUssRUFBRSx3REFBd0Q7QUFDL0QsVUFBSSxFQUFFLFFBQVE7QUFDZCxpQkFBUyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLFlBQVksQ0FBQztLQUNyRTtBQUNELDJCQUF1QixFQUFFO0FBQ3ZCLFdBQUssRUFBRSxtRUFBbUU7QUFDMUUsVUFBSSxFQUFFLFFBQVE7QUFDZCxpQkFBUyxDQUFDO0tBQ1g7R0FDRjs7QUFFRCxTQUFPLEVBQUMsbUJBQUc7QUFDVCxXQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7R0FDbEI7Q0FDRixDQUFBIiwiZmlsZSI6Ii9Vc2Vycy9lcmV3b2svLmF0b20vcGFja2FnZXMvbGFuZ3VhZ2UtZWxtL2xpYi9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuY29uc3QgcHJvdmlkZXIgPSByZXF1aXJlKCcuL3Byb3ZpZGVyJylcbmNvbnN0IHsgam9pbiB9ID0gcmVxdWlyZSgncGF0aCcpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjb25maWc6IHtcbiAgICBhdXRvY29tcGxldGVFbmFibGVkOiB7XG4gICAgICB0aXRsZTogJ0VuYWJsZSBhdXRvY29tcGxldGUnLFxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgIH0sXG4gICAgZWxtT3JhY2xlUGF0aDoge1xuICAgICAgdGl0bGU6ICdUaGUgZWxtLW9yYWNsZSBleGVjdXRhYmxlIHBhdGggKHVzZWQgZm9yIGF1dG9jb21wbGV0ZSknLFxuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICBkZWZhdWx0OiBqb2luKF9fZGlybmFtZSwgJy4uJywgJ25vZGVfbW9kdWxlcycsICcuYmluJywgJ2VsbS1vcmFjbGUnKVxuICAgIH0sXG4gICAgbWluQ2hhcnNGb3JBdXRvY29tcGxldGU6IHtcbiAgICAgIHRpdGxlOiAnVGhlIG1pbiBudW1iZXIgb2YgY2hhcmFjdGVycyB0byBlbnRlciBiZWZvcmUgYXV0b2NvbXBsZXRlIGFwcGVhcnMnLFxuICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICBkZWZhdWx0OiAxXG4gICAgfVxuICB9LFxuXG4gIHByb3ZpZGUgKCkge1xuICAgIHJldHVybiBbcHJvdmlkZXJdXG4gIH1cbn1cbiJdfQ==
//# sourceURL=/Users/erewok/.atom/packages/language-elm/lib/main.js

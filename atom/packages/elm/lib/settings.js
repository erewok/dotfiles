'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  binary: {
    title: 'Binary path',
    description: 'Path for elm-format',
    type: 'string',
    default: '/usr/local/bin/elm-format',
    order: 1
  },
  formatOnSave: {
    title: 'Format on save',
    description: 'Do we format when you save files?',
    type: 'boolean',
    default: false,
    order: 2
  },
  showNotifications: {
    title: 'Show notifications on save',
    description: 'Do you want to see the bar when we save?',
    type: 'boolean',
    default: false,
    order: 3
  },
  showErrorNotifications: {
    title: 'Show error notifications on save',
    description: 'Do you want to see the bar when we save?',
    type: 'boolean',
    default: true,
    order: 4
  }
};
/**
 * @description: home
 * @author：junyang
 * @time 2018-2-23
 */
'use strict';


var fly = require('fly');

module.exports = fly.Component.extend({

  template: __inline('./test.html'),

  data: {
    name: 'this is a test demo'
  },
  event: {},
  page: {}

});
/**
 * @description: analysis-dispose    api地址：http://ifit.fun/#/flyui/datepicker
 * @author：junyang
 * @time 2018-4-18
 */
'use strict';


var fly = require('fly');
var that;
module.exports = fly.Component.extend({
    name: 'analysisDispose-view',
    template: fly.template(__inline('./analysis-dispose.html')),
    ctor: function (element, options) {
        this._super(element, options);
        that = this;
    },

    options: {  //构造体options就是data,data-bind="text:还是支持深层次读取数据的" {{}}是不支持深层次读写数据，两层也不行
        nowShow: true,
        weekShow: false,
        monthShow: false,
        valueEvent:function(){ // 获取当前选中日期值
            var value = document.getElementById('datepickers-now').handler.value(),
            newValue = value ? value :'你没有选择日期';
            fly.alert(newValue);
        },
    },
});
var dao = {};
function init() {
    setTimeout(function () {
        $('.dateTabs > a').click(function () {
            $('.dateTabs').children('a').removeClass('active');
            $(this).addClass('active');
            var uuid = $(this).attr('name');
            switch (uuid) {
                case 'now':
                    that.options.set('weekShow', false);
                    that.options.set('monthShow', false);
                    that.options.set('nowShow', true);
                break;
                case 'week':
                    that.options.set('weekShow', true);
                    that.options.set('monthShow', false);
                    that.options.set('nowShow', false);
                break;
                case 'month':
                    that.options.set('weekShow', false);
                    that.options.set('monthShow', true);
                    that.options.set('nowShow', false);
                break;
            };
        });
    });
}
init();
/**
 * @description: home
 * @author：junyang
 * @time 2018-3-28
 */
'use strict';


var fly = require('fly');
var that;
module.exports = fly.Component.extend({
    name: 'calender-view',
    template: fly.template(__inline('./flycalenders.html')),
    ctor: function (element, options) {
        this._super(element, options);
        that = this;

    },

    options: {  //构造体options就是data,而且不支持深层次读写数据，两层也不行
        format: 'yyyy-MM-dd HH:mm:ss',
        okHandle: function(e){
            fly.alert('当前选择日期为' + e.result);
        },
        okHandle2: function(e) {
                console.log(e);
                // 有多种方式可以获取当前选中的值
                fly.alert('<label>方式一:</label>' + e.sender.value() + ' <label>方式二:</label>' + e.result);
        },
        clearHandle: function(){
            fly.alert('取消按钮');
        }     
    },

});
var dao = {};
function init() {
    var options = {
        format: 'yyyy-MM-dd HH:mm:ss',
        okHandle: function(e){
            fly.alert('当前选择日期为' + e.result);
        },
        clear:function(){
            fly.alert('你点击了取消按钮');
        }     
    };
    var demo4 = document.getElementById('demo4');
    new fly.ui.calender(demo4, options); 

}
init();
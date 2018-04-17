/**
 * @description: home
 * @author：junyang
 * @time 2018-3-28
 */
'use strict';


var fly = require('fly');
var that;
module.exports = fly.Component.extend({
    name: 'router-view',
    template: fly.template(__inline('./flydialog.html')),
    ctor: function (element, options) {
        this._super(element, options);
        that = this;

    },

    options: {  //构造体options就是data,而且不支持深层次读写数据，两层也不行
        commonEvent: function(){          
          fly.dialog({
               title: '标准弹框',
               content: '标准弹框'
           }).show();
        },
        maskEvent: function(){          
          fly.dialog({
               title: '标准弹框',
               content: '标准弹框'
           }).showModal();
        },
        setStyleEvent:function(){
          fly.dialog({
             title: '宽高设置',
             content: '宽高设置：宽300px，高100px',
             width: '300px',
             height: '100px'
         }).show();
        },  
        setBackgroundEvent:function(){
          fly.dialog({
            title: '设置遮罩背景',
            content: '使用backdropBackground/backdropOpacity属性设置弹窗背景颜色和遮罩透明度',
            backdropBackground: '#27abe0', // 设置遮罩背景色
            backdropOpacity: 0.2,   // 设置遮罩背景透明度
            width: '300px',
            height: '100px'
          }).showModal();
        },              

    },

});
var dao = {};
function init() {
    

}
init();
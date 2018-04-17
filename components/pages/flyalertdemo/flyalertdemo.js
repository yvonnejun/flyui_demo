/**
 * @description: home
 * @author：junyang
 * @time 2018-2-23
 */
'use strict';


var fly = require('fly');
var tmp = __inline('./tmp.html');
var alertA = null;
module.exports = fly.Component.extend({

  template: __inline('./flyalertdemo.html'),

  data: {
    
  },
  event: {
     //1、最简单alert实例
     testClick1: function () {
        //  fly.alert('弹窗1信息');
         //或者
         fly.alert({
            content: '弹窗1信息info'
         });
     },

     //2、下面几个是alert的类型type实例,根据不同的type显示的弹框背景色不同
     successEvent: function(){
        fly.alert({
            content: '（安全）Success',
            type: 'success'
        })
     },   

     //警告类型的提示信息
     warningEvent: function(){
        fly.alert({
            content: '（警告）Warning',
            type: 'warning'
        })
     },

     //不可恢复或者导致意外情况操作提示信息
     dangerEvent: function(){
        fly.alert({
            content: '（危险）Danger',
            type: 'danger'
        })
     },

     //3、自动关闭属性
     autoCloseEvent:function(){              
        fly.alert({
            content :'删除不可恢复操作',
            type: 'danger',
            autoClose: 800 //提示一下就闪
        })
     },

     //4、是否显示关闭按钮属性
     closeEvent:function(){              
        fly.alert({
            content :'不可自己关闭信息',
            type: 'warning',
            close: false //去掉关闭按钮
        })
     },

     //5、content里面是可以写html标签字符串的
     contentEvent:function(){              
        fly.alert({
            content :'<div style="color: yellow;font-size:22px;">黄山风景区</div>',
            type: 'info',
        })
     },
     //6、向content里面导入模板
     contentEvent2:function(){              
        fly.alert({
            content :tmp,
            type: 'info',
        })
     },
     //7、把alert组件赋给一个对象，灵活调用，并动态改变alert的type类型
     clickToAlertEvent: function(e) {
        alertA = fly.alert({  //用alertA来获取alert组件对象
            content: '<div class="first-entence">窗前明月光</div><p>疑似地上霜</p>',
            type: 'success',
            autoClose: false // 不关闭
        });
        var keys = ['info', 'warning', 'danger', 'success', 'success'],
            i = 0;
        // 设置定时器 定时改变样式
        var intTag =  window.setInterval(function fluctuate() {
            // 先移除原有样式class  再添加一个目标的
            fly.removeClass(alertA.element, 'alert-success'); //引用组件对象要alertA.element这样引用，其实每个type都对应一个样式就是alert-typeName,所以原理就是动态改变alert-typeName样式名即可
            fly.addClass(alertA.element, 'alert-' + keys[i]);

            console.log('alert-' + keys[i]);
            i++;
            if (i == 5) {
                // 逻辑关闭
                alertA.close(); //js调用close()方法关闭alert框
                window.clearInterval(intTag);
            };
        }, 1500);
    },

     
  },
  page: {}

});
var dao = {};
function init() {
    

}
module.exports.destroy = function() {
}

module.exports.render = function () {
    init();
}
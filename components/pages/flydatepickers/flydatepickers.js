/**
 * @description: home
 * @author：junyang
 * @time 2018-3-28
 */
'use strict';


var fly = require('fly');
var that;
module.exports = fly.Component.extend({
    name: 'datepicker-view',
    template: fly.template(__inline('./flydatepickers.html')),
    ctor: function (element, options) {
        this._super(element, options);
        that = this;

    },

    options: {  //构造体options就是data,data-bind="text:还是支持深层次读取数据的" {{}}是不支持深层次读写数据，两层也不行
        datepickerDay:'2017-04-15',
        changeEvent:function(e){
            console.log(e);
            debugger
            fly.alert('你改变了日期！')
        },
        valueEvent:function(){ // 获取当前选中日期值
            var value = document.getElementById('datepicker5').handler.value(),
            newValue = value ? value :'你没有选择日期';
            fly.alert(newValue);
        },
        //手动打开下拉日历弹窗
        openEvent:function(){
            document.getElementById('datepicker5').handler.open();
        },
        demoBCvalue: '',
        demoBAvalue:function() {
            var now = new Date();
            now.setDate(now.getDate());
            // 格式转换
            return fly.formatDate(this.get('demoBCvalue') || now, 'yyyy/MM/dd');
        },

    },
});
var dao = {};
function init() {

}
init();
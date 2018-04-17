/**
 * @description: home
 * @author：junyang
 * @time 2018-2-23
 */
'use strict';


var fly = require('fly');
var tog = false;
var arr = [
    {name: '张三'},
    {name: '李四'},
    {name: '王五'},
    {name: '赵六'},
    {name: '杨七'},
]
module.exports = fly.Component.extend({

  template: __inline('./demo.html'),

  data: {
    demoName: 'this is a first DEMO',
    arrlists: arr
  },
  event: {
      demoaClick: function (e) {
        //   var chkValue =  $(e.target).attr('checked');
          var chkValue =  e.target.checked; // 查看f12可看到原生checked值是true和false，直接用
        //   debugger
          console.log(chkValue);
          $('input[type=checkbox]').not($(e.target)).attr('checked', chkValue);
        //   tog = !chkValue;
      },
      getIndexClick: function (e) {
    //     var index = $(e.target).prevAll().length; //动态jquery方法获取索引的话还是用init里面的click和$(this)的好，写在fly方法中无效
    //     console.log(index);
      }
  },
  page: {}

});
var dao = {};
function init() {
    // fly.alert('init初始化成功');

    // 1、动态获取无序元素集的当前元素索引
    $('.list-item').click(function () { //注意html结构性错误的坑
        var index = $(this).prevAll().length;
        console.log(index); //实测有效
        console.log($(this).index()); //实测$(this).index()得到的索引值跟上面的方式得到的索引值一致
    });

    //2、动态添加元素
    // var ele = $("a", {href:'#', class:'classA classB',title:'演示动态创建元素'}); //这些对象属性直接在标签字符串上写就好了,实测对象字面量的写法不实用
    // alert(ele);//[object object]表示是jquery对象
    // console.log(ele);
    $("#newWrap").append("<a href='#' class='classA classB' title='演示动态创建元素'>Hello</a>"); //append添加元素的要求是添加标签字符串，而不能添加任何对象，这样写是ok的，实测有效
    // $("#newWrap").append(ele); //append这样用就是错误的

    //3、判断元素是否绑定了事件：(只适用与jquery绑定的事件)
    $("button").click(function () {
        console.log('bind click!');
        $(this).clone(true).insertAfter(this);// 克隆按钮自己并插入到自己后面
    });
    $("button").on("click", function () {
        fly.alert($(this).text());
        console.log($(this).closest('div'));
    });
    var btn = document.getElementsByTagName('button')[0];//必须是原生DOM元素才能被$._data获取
    var events = $.data(btn,'events') || $._data(btn,'events'); //jquery1.8以后，使用$._data($('button')[0],'events').click来获取也可以
    console.log(events);
    if(events && events["click"]){
        fly.alert('成功绑定click事件');
    }


    //4、禁用右键菜单--实测有效开发环境不要屏蔽
    // $(document).on('contextmenu', function (e) {
    //     return false;
    // });

    //5、判断某个元素是否为空
    if ($('#foo').is(":empty")) { // 或者使用if (!$('#foo').html())
        fly.alert('foo元素为空');
    } else {
        fly.alert($('#foo').html());
    }

    //6、隐藏一个包含了某个文本值的元素，并用.is(':visible')查看该元素是否可见
    var jeep = $("div:contains('jeep')");
    if (jeep.length && jeep.is(':visible')) { //判断一个元素是不是存在获取该元素后用length判断
        console.log('jeep元素存在并且可见');
    }



    //7、jquery动态添加元素和属性：
    var newDiv = $('<div></div>');
    // newDiv.attr('id','myDiv').addClass('wrap').appendTo('body');
    newDiv.attr('id','myDiv').addClass('wrap').appendTo('.dashboard');

    //8、将数字比如日期数字1-31替换为汉字^[0-9]\d?$
    var n = $('#num');
    n.html(n.html().replace(/^[0-9]\d?$/ig, '今天'));

    //9、动态加载load图片，并弹出提示已经加载完成
    // 为部署后的绝对路径
    var favorite = __uri('kyfb.png');
    $('img').attr('src', favorite).load(function () { // flyjs框架中要动态设置图片路径，其获取路径有讲究
        fly.alert('图片已经动态加载成功2！');
    });
    // $('img').load(function () { // 直接这样写load()是凑效的
    //     fly.alert('图片已经加载成功1！');
    // });

}
module.exports.destroy = function() {
}

module.exports.render = function () {
    init();
}
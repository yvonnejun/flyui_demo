/**
 * @description: home
 * @author：junyang
 * @time 2018-2-23
 */
'use strict';


var fly = require('fly');

module.exports = fly.Component.extend({

  template: __inline('./demo2.html'),

  data: {
    
  },
  event: {
     
  },
  page: {}

});
var dao = {};
function init() {

    // 10、load动态加载html--实测load是加载不了的，用__inline()加载模板成模板字串后，再用append(tmp)的形式添加到父元素中，用load写回调是可以的
    // $('.wrap').load('insert.html');
    var tmp = __inline('./insert.html');
    console.log(tmp); //输出<div id="header"><h2>我是插入页面头部</h2></div>了insert.html页面的内容
    // $('.wrap').load(tmp);//用load直接加载模板字串或下面的直接加载DOM字串都是不行的，得像下面$('.wrap').append(tmp).load(callback);这样用才行
    // $('.wrap').load("<h2>我是插入页面头部</h2>");
    $('.wrap').append(tmp).load(function(responseTxt,statusTxt,xhr){ 
        if(statusTxt=="success")
            console.log("外部内容加载成功！");
        if(statusTxt=="error")
            console.log("Error: "+xhr.status+": "+xhr.statusText + ":" +responseTxt);
    });

   // 11、过滤出不含ol的p元素,并给不含ol的p元素添加红色字体
   var nolp = $("p").filter(function(index) {
     return $("ol", this).length == 0; //这个this就相当于$("p")这个上下文环境了
   }).css('color', 'red');
   console.log(nolp);


   //12、幂运算
   console.log(Math.pow(2, 53));// 2的53次方

   //13、js的浮点运算bug
   var two = 0.2, one = 0.1, eight = 0.8, six = 0.6;
   console.log([eight - six]); //输出[0.20000000000000007]
   console.log([two - one == one, eight - six == two]); //所以这个输出就是[true, false],因为0.20000...7不等于0.2

   //14、parseInt运算大全？为什么parseInt(3, 2)3的2进制整数是非数值，不解
   console.log(parseInt(3, 8));  // 3
   console.log(parseInt(3, 2));  // NaN
   if (isNaN(parseInt(3, 2))) { //通过此判断果然是NaN
       fly.alert('3-2是非数值');
   } else {
       console.log(parseInt(3, 2));
   }
   console.log(parseInt(3, 0));  // 3

   //15、数组的原型是不是数组，答案是true
   console.log(Array.isArray(Array.prototype));  // true

   //16、数组的比较,[] ==[] 为 false；[] == ![] 为 true；[] == {} 为 false；为什么？
   console.log([0] == true); // false
   console.log([0] == [0]); // false
   console.log([] == []); // false 虽然值一样，但是是两个不同的引用对象，所以为false
   /**
    * 
    [] == [] 这个好理解. 当两个值都是对象 (引用值) 时, 比较的是两个引用值在内存中是否是同一个对象. 因为此 [] 非彼 [], 虽然同为空数组, 确是两个互不相关的空数组, 自然 == 为 false.
    [] == ![] 这个要牵涉到 JavaScript 中不同类型 == 比较的规则, 具体是由相关标准定义的. ![] 的值是 false, 此时表达式变为 [] == false, 参照标准, 该比较变成了 [] == ToNumber(false), 即 [] == 0. 这个时候又变成了 ToPrimitive([]) == 0, 即 '' == 0, 接下来就是比较 ToNumber('') == 0, 也就是 0 == 0, 最终结果为 true.
    [] == {} 和[0] == [0] 情况同第一个.
    */

    //17、array.map()数组循环方法1
    var arr = Array(3);
    arr[0] = 2;
    // var newArr = arr.map(function (item) { //这样写是错的，只有ele.map()的写法，没有  数组.map()的写法，数组的循环应该是下面这种写法
    //     return '1';
    // });
    var newArr = $.map(arr, function(n){ //$.map--根据return方式处理原数组中的每个元素，并返回一个新数组
        return '1';
    });
    console.log(newArr); //把原数组中的每个元素都处理返回成了'1',所以输出是(3) ["1", "1", "1"]


    //18、$("input")jquery对象.map()循环根据返回值建立集合数组的方法2
    $("p#parentP b").append( $("input").map(function(){
        return $(this).val();
    }).get().join(", ") );

}
module.exports.destroy = function() {
}

module.exports.render = function () {
    init();
}
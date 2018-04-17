/**
 * @description: home
 * @author：junyang
 * @time 2018-2-23
 */
'use strict';


var fly = require('fly');
var tmp = __inline('./tmp.html');

module.exports = fly.Component.extend({

  template: __inline('./echartsDemo2.html'),

  data: {
    
  },
  event: {
    // dataclick: function (e) {
            
    //     dao.findTouristSourceDistrubute();
    // },
  },
  page: {}

});
var dao = {
    findDataResourceChangeNum: function () {
        // var time = '';
        // if (vm.data.trafficStatisticsMonth >= 10) {
        //     time = vm.data.trafficStatisticsYear + "" + vm.data.trafficStatisticsMonth;
        // } else {
        //     time = vm.data.trafficStatisticsYear + "0" + vm.data.trafficStatisticsMonth;
        // }
        var param = {
            // code: DEFAULT_CODE,
            // type: DEFAULT_TYPE,
            // time: time,
        }
        networkUtils.ajaxGet({
            url: CONFIGPATH.API.DATA_RESOURCES.changeNum,
            // url: 'public/project-a/1.0.0/mock/flowMonitor/changeNum.json',//实测是ok的，然后把地址封装到上面的api配置文件中来访问
            data: param
        }, function (res) {
                console.log(res);
                var changeInfoData = res;
                initEchart2(changeInfoData, 'demo2');
        }, function () { });
    },
};
function init() {
     dao.findDataResourceChangeNum();

}
module.exports.destroy = function() {
}

module.exports.render = function () {
    init();
}



function initEchart2(data, id) {
    var maxData = 0;
    for (var i = 0; i < data.length; i++) { //解决x轴max值的问题
        if (maxData < parseFloat(data[i].dateNum)) {
            var middleNum = parseFloat(data[i].dateNum);
            maxData = Math.ceil(middleNum);
            // console.log(data[i].dateNum);
        }
    }
    console.log(maxData);

    var defaultCityData = [];
    for (var i = 0; i < data.length; i++) {
        defaultCityData.push(data[i].cityName);
    }
    var defaultData = [];
    for (var i = 0; i < data.length; i++) {
        defaultData.push(parseFloat(data[i].dateNum));
    }

    var option = {
        title: {
            show:true,
            text: '省直部门交换量',
            x: 'left',
            textStyle: {
                color: '#fff',
                fontWeight: 'normal'
            },
            // subtext: '(单位千)', //副标题文本
            // subtextStyle: { //副标题文本样式
            //     color: '#2b6ea8',
            //     fontWeight: 'normal'
            // },
            // sublink:'http://www.baidu.com',//副标题超链接
            // subtarget:'blank',//副标题超链接打开方式
            // padding:[5,10,5,5],//设置标题内边距,上，右，下，左
            // itemGap:17,//主副标题之间的间距
        },
        tooltip: {
            trigger: 'item', //值axis根据整个x轴触发tooltip
            axisPointer : {            // 坐标轴指示器，坐标轴触发有效
                type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
            }
        },
        legend: { //图例
            bottom: 5,
            right: 20,
            z: 10,
            zlevel: 10,
            type: 'plain', //普通图例(默认)
            data:['换入', '换出'],
            itemGap: 15, //图例之间的距离
            textStyle: {
                color: '#307dbf',
                // borderColor: '1px solid #ff0000'
            },
            // formatter: function (name) { //针对图例文本的返回样式
            //     return '[' + name + '] ';
            // }
        },
        // toolbox: { //工具栏
        //     show : true,
        //     feature : {
        //         mark : {show: true},
        //         dataView : {show: true, readOnly: false},
        //         magicType : {show: true, type: ['line', 'bar', 'stack', 'tiled']},
        //         restore : {show: true},
        //         saveAsImage : {show: true}
        //     }
        // },
        calculable: true,
        grid: {
            // y2: 140 //这个可以调整y轴的刻度间距
            width: '85%',//右侧显示不全调节宽度
            left: 40//左侧显示不全调节left值
            // x2: 80 //x轴如果加了轴名称可能存在显示不全的问题，用grid的x2来调节轴间距让文本显示的全
        },
        xAxis: [
            {
                type : 'category',
                axisLine: { //轴线
                    show: true,
                    lineStyle: {
                        color: '#469be3' //x轴轴线及文本颜色
                    }
                },
                axisTick: { // 轴刻度
                    show: false
                },
                axisLabel: { //轴文本
                    show: true,
                    interval: 0, //横轴信息全部显示,刻度间隔的相关属性就是：interval
                    // rotate: -30, //-30°角倾斜显示,
                    color: '#2b6ea8'
                    // formatter: '{c} ℃'
                },
                splitLine: {  //数据背景线
                    show: false
                },
                position: 'bottom', //xAxis轴在顶部显示
                data : ['单位1', '单位2', '单位3', '单位4', '单位5', '单位6']
            }
        ],
        yAxis: [
            {
                type : 'value',
                axisTick: { // 轴刻度
                    show: false
                },
                axisLabel: { //轴文本
                    show: true,
                    color: '#2b6ea8'
                },
                axisLine: { //轴线
                    show: true,
                    lineStyle: {
                        color: '#469be3' //y轴轴线及文本颜色
                    }
                },
                max: function(value) { //其中 value 是一个包含 min 和 max 的对象，分别表示数据的最大最小值，这个函数应该返回坐标轴的最大值。
                    return maxData ? maxData : 1500;
                },
                splitLine: {  //数据背景线
                    show: false
                },
                
                // data : defaultCityData
            }
        ],
        series: [
            {
                name:'换入', //底下的基础数据(蓝色)
                type:'bar',
                barWidth : 16,//柱图宽度
                barMaxWidth:16,//最大宽度
                barGap: '20%',
                // barGap:'-100%',
                stack: '换入',
                // itemStyle : { normal: {color: '#37c0fa', label : {show: false, position: 'right'}}},
                itemStyle : { normal: {color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // 0,0,0,1是横向柱状图从上到下的渐变;0, 0, 1, 0,是横向柱状图从左到右的渐变
                        offset: 0,
                        color: "#40d0fe" // 0% 处的颜色
                    }, {
                        offset: 1,
                        color: "#1e95f1" // 100% 处的颜色
                    }], false), label : {show: false, position: 'right'}}},
                data:[510, 1020, 515, 1080, 515, 1080]
            },
            {
                name:'换出', //上面的黄色数据
                type:'bar',
                barWidth : 16,//柱图宽度
                barMaxWidth:16,//最大宽度
                barGap: '20%',
                // barGap:'-100%',
                // barCategoryGap: "70%",
                stack: '换出',
                itemStyle : { normal: {color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // 0,0,0,1是横向柱状图从上到下的渐变
                        offset: 0,
                        color: "#f7d931" // 0% 处的颜色
                    }, {
                        offset: 1,
                        color: "#f59b26" // 100% 处的颜色
                    }], false), label : {show: false, position: 'right', color: "#307dbf"}}},
                data:[930, 1260, 1115, 1320, 1200, 1250]
            },
        ]
    };
    // debugger

    var echart = echarts.init(document.getElementById(id));
    echart.setOption(option)
    var myOptions = echart.getOption();
    // var xmax= myOptions.xAxis[0].max;
    console.log(myOptions);
    // console.log(xmax);
}
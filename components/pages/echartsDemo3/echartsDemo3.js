/**
 * @description: home
 * @author：junyang
 * @time 2018-2-23
 */
'use strict';


var fly = require('fly');

module.exports = fly.Component.extend({

  template: __inline('./echartsDemo3.html'),

  data: {
    
  },
  event: {

  },
  page: {}

});
var dao = {
    findMonitoringControlCity: function () {
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
            url: CONFIGPATH.API.DATA_RESOURCES.monitoringControlCity,
            data: param
        }, function (res) {
                console.log(res);
                var kyfbInfo = res.data;
               
                var cityInfoData = res;
        
                initEchart(cityInfoData, 'demo3');
      
        }, function () { });
    },
};
function init() {
     dao.findMonitoringControlCity();

}
module.exports.destroy = function() {
}

module.exports.render = function () {
    init();
}



function initEchart(data, id) {
    var maxData = 0;
    for (var i = 0; i < data.length; i++) { //解决x轴max值的问题
        if (maxData < parseFloat(data[i].dateTotalNum)) {
            var middleNum = parseFloat(data[i].dateTotalNum);
            maxData = Math.ceil(middleNum);
            // console.log(data[i].dateTotalNum);
        }
    }
    console.log(maxData);

    var defaultCityData = [];
    for (var i = 0; i < data.length; i++) {
        defaultCityData.push(data[i].cityName);
    }
    var defaultTotalData = [];
    for (var i = 0; i < data.length; i++) {
        defaultTotalData.push(parseFloat(data[i].dateTotalNum));
    }

    var defaultData = [];
    for (var i = 0; i < data.length; i++) {
        defaultData.push(parseFloat(data[i].dateNum));
    }

    

    var option = {
        title: {
            show:true,
            text: '地市监控',
            x: 'left',
            textStyle: {
                color: '#fff',
                fontWeight: 'normal'
            },
        },
        tooltip: {
            trigger: 'axis', //值axis根据整个x轴触发tooltip,item值触发的是划过的某个柱形图，而不是整根坐标轴了
            axisPointer : {            // 坐标轴指示器，坐标轴触发有效
                type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
            }
        },
        legend: { //图例
            bottom: 15,
            right: 20,
            type: 'plain', //普通图例(默认)
            data:['本日', '累计'],
            itemGap: 15, //图例之间的距离
            textStyle: {
                color: '#307dbf',
                borderColor: '1px solid #ff0000'
            },
        },
        calculable: true,
        grid: {
            // y2: 140 //这个可以调整y轴的刻度间距
            width: '70%',//右侧显示不全调节宽度
            left: 50//左侧显示不全调节left值
            // x2: 80 //x轴如果加了轴名称可能存在显示不全的问题，用grid的x2来调节轴间距让文本显示的全
        },
        xAxis: [
            {
                type : 'value',
                name: '(单位千)', //坐标轴后面的名称文本
                nameLocation : 'end',//坐标轴后面的名称文本定位，------配置项 yAxis中有一个nameLocation属性，设置成'middle' 或者 'center 就可以了
                nameTextStyle: { //坐标轴后面的名称文本样式设置，参考手册多属性可设置
                    nameGap:0,
                    verticalAlign: 'top'
                },
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
                    color: '#2b6ea8'
                },
                max: function(value) { //其中 value 是一个包含 min 和 max 的对象，分别表示数据的最大最小值，这个函数应该返回坐标轴的最大值。
                    return maxData ? maxData : 10;
                },
                splitLine: {  //数据背景线
                    show: false
                },
                position: 'top' //xAxis轴在顶部显示
            }
        ],
        yAxis: [
            {
                type : 'category',
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
                splitLine: {  //数据背景线
                    show: false
                },
                data : defaultCityData
            }
        ],
        series: [
            {
                name:'累计', //黄色数据
                type:'bar',
                barWidth : 16,//柱图宽度
                barMaxWidth:16,//最大宽度
                barGap:'-100%',
                // barCategoryGap: "70%",
                stack: '累计',
                itemStyle : { normal: {color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // 0,0,0,1是横向柱状图从上到下的渐变
                        offset: 0,
                        color: "#f7d931" // 0% 处的颜色
                    }, {
                        offset: 1,
                        color: "#f59b26" // 100% 处的颜色
                    }], false), label : {show: true, position: 'right', color: "#307dbf"}}},
                data : defaultTotalData
            },
            {
                name:'本日', //蓝色数据
                type:'bar',
                barWidth : 16,//柱图宽度
                barMaxWidth:16,//最大宽度
                barGap:'-100%',
                stack: '本日',
                itemStyle : { normal: {color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // 0,0,0,1是横向柱状图从上到下的渐变
                        offset: 0,
                        color: "#40d0fe" // 0% 处的颜色
                    }, {
                        offset: 1,
                        color: "#1e95f1" // 100% 处的颜色
                    }], false), label : {show: false, position: 'right'}}},
                data : defaultData
            }
        ]
    };

    var echart = echarts.init(document.getElementById(id));
    echart.setOption(option)
    var myOptions = echart.getOption();
    console.log(myOptions);
}
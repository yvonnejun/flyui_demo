/**
 * @description: home
 * @author：junyang
 * @time 2018-2-23
 */
'use strict';


var fly = require('fly');
var tmp = __inline('./tmp.html');
module.exports = fly.Component.extend({

  template: __inline('./echartsDemo.html'),

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
            // url: 'public/project-a/1.0.0/mock/flowMonitor/findUserNum.json',//实测是ok的，然后把地址封装到上面的api配置文件中来访问
            data: param
        }, function (res) {
            // if (res.flag) {
                console.log(res);
                var kyfbInfo = res.data;
                // var total = kyfbInfo.abroadTourists + kyfbInfo.outSideTourists + kyfbInfo.provinceTourists;

                // kyfbInfo.abroadTouristsZb = getPercent(kyfbInfo.abroadTourists, total);
                // kyfbInfo.outSideTouristsZb = getPercent(kyfbInfo.outSideTourists, total);
                // kyfbInfo.provinceTouristsZb = getPercent(kyfbInfo.provinceTourists, total);

                // kyfbInfo.abroadTourists = utils.kilobit(kyfbInfo.abroadTourists);
                // kyfbInfo.outSideTourists = utils.kilobit(kyfbInfo.outSideTourists);
                // kyfbInfo.provinceTourists = utils.kilobit(kyfbInfo.provinceTourists);

                // var inSideSortData = [];
                // for (var i = 0; i < kyfbInfo.inSideSort.length; i++) {
                //     inSideSortData[i] = kyfbInfo.inSideSort[i].value;
                //     kyfbInfo.inSideSort[i].formatValue = utils.kilobit(kyfbInfo.inSideSort[i].value);
                // }

                // var abroadSortData = [];
                // for (var i = 0; i < kyfbInfo.abroadSort.length; i++) {
                //     abroadSortData[i] = kyfbInfo.abroadSort[i].value;
                //     kyfbInfo.abroadSort[i].formatValue = utils.kilobit(kyfbInfo.abroadSort[i].value);
                // }
                var cityInfoData = res;
                // var citySortData = [];
                // for (var i = 0; i < kyfbInfo.citySort.length; i++) {
                //     citySortData[i] = kyfbInfo.citySort[i].value;
                //     kyfbInfo.citySort[i].formatValue = utils.kilobit(kyfbInfo.citySort[i].value);
                // }

                // vm.data.set('kyfbInfo', kyfbInfo);

                // initEchart(inSideSortData, 'territory_echart_wrap');
                // initEchart(abroadSortData, 'abroad_echart_wrap');
                initEchart(cityInfoData, 'demo1');
            // } else {
                // mui.toast(res.message);
            // }
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
            text: '地市监控',
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
            bottom: 15,
            right: 20,
            type: 'plain', //普通图例(默认)
            data:['本日', '累计'],
            itemGap: 15, //图例之间的距离
            textStyle: {
                color: '#307dbf',
                borderColor: '1px solid #ff0000'
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
                    // rotate: -30, //-30°角倾斜显示,
                    color: '#2b6ea8'
                    // formatter: '{c} ℃'
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
                // splitLine: {lineStyle:{type:'dashed'}},
                // data : ['宣城', '濮阳', '铜陵', '六安', '淮北', '黄山', '蚌搥', '宿州', '安庆', '淮南', '毫州', '马鞍山', '合肥', '芜湖']
                data : defaultCityData
            }
        ],
        series: [
            {
                name:'本日', //底下的基础数据(蓝色)
                type:'bar',
                barWidth : 16,//柱图宽度
                barMaxWidth:16,//最大宽度
                // barGap:'-100%',
                stack: '总量',
                // itemStyle : { normal: {color: '#37c0fa', label : {show: false, position: 'right'}}},
                itemStyle : { normal: {color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // 0,0,0,1是横向柱状图从上到下的渐变
                        offset: 0,
                        color: "#40d0fe" // 0% 处的颜色
                    }, {
                        offset: 1,
                        color: "#1e95f1" // 100% 处的颜色
                    }], false), label : {show: false, position: 'right'}}},
                data:[1.1, 1.2, 1.3, 1.4, 1.2, 2, 2.6, 2.9, 4.1, 4.8, 5.4, 5.2, 5.4, 6]
            },
            {
                name:'累计', //上面的黄色数据
                type:'bar',
                barWidth : 16,//柱图宽度
                barMaxWidth:16,//最大宽度
                barGap: '1%',
                // barGap:'-100%',
                // barCategoryGap: "70%",
                stack: '总量',
                itemStyle : { normal: {color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // 0,0,0,1是横向柱状图从上到下的渐变
                        offset: 0,
                        color: "#f7d931" // 0% 处的颜色
                    }, {
                        offset: 1,
                        color: "#f59b26" // 100% 处的颜色
                    }], false), label : {show: false, position: 'right', color: "#307dbf"}}},
                data:[0.3, 0.5, 0.6, 0.6, 0.9, 1.4, 1.1, 1.3, 1.3, 2, 1.8, 2, 2,3.3]
            },
            { //堆叠显示总数的柱子，原理就是还是堆叠在最上面，然后把柱子隐藏color:'rgba(128, 128, 128, 0)' ，只显示总的数字，并注意把数字显示位置设置为当前柱子里面的最底部position: 'insideBottom',，横向要注意设置为里面的最左部position: 'insideLeft',
                name:'总数',
                type: 'bar', 
                barWidth : 16,//柱图宽度
                barMaxWidth:16,//最大宽度
                stack: '总量',
                label: { 
                    normal: { 
                        offset:['50', '80'], //是否对文字进行偏移。默认不偏移。例如：[50, 80] 表示文字在横向上偏移 50，纵向上偏移 80。
                        show: true, 
                        position: 'insideLeft', //横向有insideLeft,纵向有insideBottom
                        formatter:'{c}', //{c}拿取下面data中的数据在这里格式化显示
                        textStyle:{ color:'#307dbf' } //文本色
                    }
                }, 
                itemStyle:{ 
                    normal:{ 
                        color:'rgba(128, 128, 128, 0)' 
                    } 
                }, 
                // data:[1.4, 1.7, 1.9, 2.0, 2.1, 3.4, 3.7, 4.2, 5.4, 6.8, 7.2, 7.2, 7.4, 9.3]
                data : defaultData
            }
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
/**
 * @description: analysis-dispose    api地址：http://ifit.fun/#/flyui/datepicker
 * @author：junyang
 * @time 2018-4-18
 */
'use strict';


var fly = require('fly');
var that;
var changeInfoData = [
        {"unitName":"单位1", "changeIntoNum":"510", "changeOutNum":"930"},
        {"unitName":"单位2", "changeIntoNum":"1020", "changeOutNum":"1260"},
        {"unitName":"单位3", "changeIntoNum":"515", "changeOutNum":"1115"},
        {"unitName":"单位4", "changeIntoNum":"1080", "changeOutNum":"1320"},
        {"unitName":"单位5", "changeIntoNum":"515", "changeOutNum":"1200"},
        {"unitName":"单位6", "changeIntoNum":"1080", "changeOutNum":"1250"}
    ];
var disposeType = [
    {text: "全部",value: "1"},
    {text: "归还",value: "2"},
    {text: "销毁",value: "3"},
    {text: "拍卖",value: "4"}                   
];
var cityInfoData = [];
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
        listShow: false,
        disposeType: disposeType,
        typeFlag: true,
        doTypeEvent: function (e) {
            e.preventDefault();
            $('.dispose-type-tabs').children('a').removeClass('type-active');
            $(e.target).addClass('type-active');
            var uuType = $(e.target).attr('name');
            switch (uuType) {
                case 'goodsType':
                    // that.options.set('typeFlag', true);
                    console.log('传入数据changeInfoData1');
                    initEchart2(changeInfoData1, 'main');
                break;
                case 'caseUnit':
                    // that.options.set('typeFlag', false);
                    console.log('传入数据changeInfoData2');
                    initEchart2(changeInfoData2, 'main');
                break;
                default:
                    that.options.set('typeFlag', true);
                break;
            };
        },
        disposeList: []
    },
});
var dao = {
    getDisposeList: function () {
        var param = {}
        networkUtils.ajaxGet({
            url: CONFIGPATH.API.ANALYSIS.getDisposeList,
            data: param
        }, function (res) {
            console.log(res);
            var disposeList = res;   
            // that.options.set('disposeList', disposeList); 
            // that.options.set('listShow', true); 
        })
    },
};
function init() {
    // dao.getDisposeList();

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
        initEchart2(changeInfoData, 'main');
        initEchartPie1(cityInfoData, 'saveDetailPie1');
        // initEchart2(changeInfoData, 'main2');
    }, 0);
}
init();

function initEchart2(data, id) {
    var maxData = 0;
    for (var i = 0; i < data.length; i++) { //解决x轴max值的问题
        if (maxData < parseFloat(data[i].dateNum)) {
            var middleNum = parseFloat(data[i].dateNum);
            maxData = Math.ceil(middleNum);
            // console.log(data[i].dateNum);
        }
    }
    var defaultCityData = [];
    for (var i = 0; i < data.length; i++) {
        defaultCityData.push(data[i].cityName);
    }
    var defaultData = [];
    for (var i = 0; i < data.length; i++) {
        defaultData.push(parseFloat(data[i].dateNum));
    }

    var option = {
        tooltip: {
            trigger: 'item', //值axis根据整个x轴触发tooltip
            axisPointer : {            // 坐标轴指示器，坐标轴触发有效
                type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
            }
        },
        legend: { //图例
            top: 8,
            left: '11%',
            type: 'plain', //普通图例(默认)
            // data:['涉案财物', '贵重物品', '电子物证', '生物检材', '卷宗'],
            data:[
                {
                    name:'涉案财物',
                    textStyle:{
                        fontSize:12,
                        // fontWeight:'bolder',
                        color:'#999'
                    }, 
                    icon:'roundRect'
                    // icon: 'image://' + CONTEXTPATHIMG + '/icon/reactRed.png'
                },
                {
                    name:'贵重物品',
                    textStyle:{
                        fontSize:12,
                        // fontWeight:'bolder',
                        color:'#999'
                    },
                    icon:'roundRect'
                    // icon: 'image://' + CONTEXTPATHIMG + '/icon/reactBlue.png'
                },
                {
                    name:'电子物证',
                    textStyle:{
                        fontSize:12,
                        // fontWeight:'bolder',
                        color:'#999'
                    },
                    icon:'roundRect'
                    // icon: 'image://' + CONTEXTPATHIMG + '/icon/reactBlue.png'
                },
                {
                    name:'生物检材',
                    textStyle:{
                        fontSize:12,
                        // fontWeight:'bolder',
                        color:'#999'
                    },
                    icon:'roundRect'
                    // icon: 'image://' + CONTEXTPATHIMG + '/icon/reactBlue.png'
                },
                {
                    name:'卷宗',
                    textStyle:{
                        fontSize:12,
                        // fontWeight:'bolder',
                        color:'#999'
                    },
                    icon:'roundRect'
                    // icon: 'image://' + CONTEXTPATHIMG + '/icon/reactBlue.png'
                }
            ],
            itemWidth: 11,
            itemHeight: 11,
            itemGap: 15, //图例之间的距离
            textStyle: {
                color: '#307dbf',
                // borderColor: '1px solid #ff0000'
            },
            // formatter: function (name) { //针对图例文本的返回样式
            //     return '[' + name + '] ';
            // }
        },
        calculable: true,
        grid: {
            // y2: 140 //这个可以调整y轴的刻度间距
            width: '95%',//右侧显示不全的话就调节宽度变小即可
            left: 40//左侧显示不全调节left值
            // x2: 80 //x轴如果加了轴名称可能存在显示不全的问题，用grid的x2来调节轴间距让文本显示的全
        },
        xAxis: [
            {
                type : 'category',
                axisLine: { //轴线
                    show: true,
                    lineStyle: {
                        color: '#ddd' //x轴轴线颜色
                    }
                },
                axisTick: { // 轴刻度
                    show: false
                },
                axisLabel: { //轴文本样式
                    show: true,
                    interval: 0, //横轴信息全部显示,刻度间隔的相关属性就是：interval
                    // rotate: -30, //-30°角倾斜显示,
                    color: '#666'
                    // formatter: '{c} ℃'
                },
                splitLine: {  //数据背景线
                    show: false
                },
                position: 'bottom', //xAxis轴在顶部显示
                data : ['12-01', '12-02', '12-03', '12-04', '12-05', '12-06', '12-07']
            }
        ],
        yAxis: [
            {
                type : 'value',
                axisTick: { // 轴刻度
                    show: false
                },
                axisLabel: { //轴文本样式
                    show: true,
                    color: '#666'
                },
                interval: 15, // y轴的间隔值，默认是10，这里设为15
                axisLine: { //轴线
                    show: true,
                    lineStyle: {
                        color: '#ddd' //y轴轴线颜色
                    }
                },
                max: function(value) { //其中 value 是一个包含 min 和 max 的对象，分别表示数据的最大最小值，这个函数应该返回坐标轴的最大值。
                    return maxData ? maxData : 60;
                },
                splitLine: {  //数据背景线
                    show: false
                },
                
                // data : defaultCityData
            }
        ],
        series: [
            {
                name:'涉案财物', //底下的基础数据(蓝色)
                type:'bar',
                barWidth : 12,//柱图宽度
                barMaxWidth:16,//最大宽度
                barGap: '50%',
                // barGap:'-100%',
                stack: '涉案财物',
                // itemStyle : { normal: {color: '#49a9ee', barBorderRadius: 5, label : {show: false, position: 'right', color: "#307dbf"}}},
                itemStyle : { normal: {color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // 0,0,0,1是纵向柱状图从上到下的渐变
                    offset: 0,
                    color: "#206fb2" // 0% 处的颜色
                }, {
                    offset: 1,
                    color: "#1e3589" // 100% 处的颜色
                }], false), barBorderRadius: 10, label : {show: false, position: 'right'}}},
                data:[28, 46, 8, 43, 12, 36, 30]
            },
            {
                name:'贵重物品', //上面的黄色数据
                type:'bar',
                barWidth : 12,//柱图宽度
                barMaxWidth:16,//最大宽度
                barGap: '50%',
                // barGap:'-100%',
                // barCategoryGap: "70%",
                stack: '贵重物品',
                // itemStyle : { normal: {color: '#7dc856', barBorderRadius: 5, label : {show: false, position: 'right', color: "#307dbf"}}},
                itemStyle : { normal: {color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                    offset: 0,
                    color: "#a968d2" // 0% 处的颜色
                }, {
                    offset: 1,
                    color: "#612b83" // 100% 处的颜色
                }], false), barBorderRadius: 10, label : {show: false, position: 'right'}}},
                data:[24, 12, 20, 32, 45, 18, 19]
            },
            {
                name:'电子物证', //上面的黄色数据
                type:'bar',
                barWidth : 12,//柱图宽度
                barMaxWidth:16,//最大宽度
                barGap: '50%',
                // barGap:'-100%',
                // barCategoryGap: "70%",
                stack: '电子物证',
                // itemStyle : { normal: {color: '#feda75', barBorderRadius: 5, label : {show: false, position: 'right', color: "#307dbf"}}},
                itemStyle : { normal: {color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                    offset: 0,
                    color: "#2ac7a0" // 0% 处的颜色
                }, {
                    offset: 1,
                    color: "#208970" // 100% 处的颜色
                }], false), barBorderRadius: 10, label : {show: false, position: 'right'}}},
                data:[13, 42, 22, 45, 28, 23, 33]
            },
            {
                name:'生物检材', //上面的黄色数据
                type:'bar',
                barWidth : 12,//柱图宽度
                barMaxWidth:16,//最大宽度
                barGap: '50%',
                // barGap:'-100%',
                // barCategoryGap: "70%",
                stack: '生物检材',
                // itemStyle : { normal: {color: '#999999', barBorderRadius: 5, label : {show: false, position: 'right', color: "#307dbf"}}},
                itemStyle : { normal: {color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                    offset: 0,
                    color: "#da9745" // 0% 处的颜色
                }, {
                    offset: 1,
                    color: "#af6b34" // 100% 处的颜色
                }], false), barBorderRadius: 10, label : {show: false, position: 'right'}}},
                data:[19, 30, 11, 4, 30, 18, 29]
            },
            {
                name:'卷宗', //上面的黄色数据
                type:'bar',
                barWidth : 12,//柱图宽度
                barMaxWidth:16,//最大宽度
                barGap: '50%',
                // barGap:'-100%',
                // barCategoryGap: "70%",
                stack: '卷宗',
                // itemStyle : { normal: {color: '#92b4e2', barBorderRadius: 5, label : {show: false, position: 'right', color: "#307dbf"}}},
                itemStyle : { normal: {color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                    offset: 0,
                    color: "#3bbeca" // 0% 处的颜色
                }, {
                    offset: 1,
                    color: "#278c96" // 100% 处的颜色
                }], false), barBorderRadius: 10, label : {show: false, position: 'right'}}},
                data:[33, 53, 31, 17, 18, 8, 38]
            },
        ]
    };
    var echart = echarts.init(document.getElementById(id));
    echart.setOption(option)
}

// function initEchartPie1(data, id) {
//     // var maxData = 0;
//     // for (var i = 0; i < data.length; i++) { //解决x轴max值的问题
//     //     if (maxData < parseFloat(data[i].dateTotalNum)) {
//     //         var middleNum = parseFloat(data[i].dateTotalNum);
//     //         maxData = Math.ceil(middleNum);
//     //         // console.log(data[i].dateTotalNum);
//     //     }
//     // }
//     // console.log(maxData);

//     // var defaultCityData = [];
//     // for (var i = 0; i < data.length; i++) {
//     //     defaultCityData.push(data[i].cityName);
//     // }
//     // var defaultTotalData = [];
//     // for (var i = 0; i < data.length; i++) {
//     //     defaultTotalData.push(parseFloat(data[i].dateTotalNum));
//     // }

//     // var defaultData = [];
//     // for (var i = 0; i < data.length; i++) {
//     //     defaultData.push(parseFloat(data[i].dateNum));
//     // }

    

//     var option = {
//         title : {
//             text: '1号柜',
//             x:'center',
//             y:'center',
//             // left: 10,
//             // top: 10,
//             textStyle: {
//                 color: '#28a5f9',
//                 fontSize: 14,
//                 fontWeight: 'bold'
//             },
//         },
//         tooltip : {
//             trigger: 'item',
//             formatter: "{a} <br/>{b} : {c} ({d}%)"
//         },
//         legend: {
//             orient : 'vertical',
//             x : 'left',
//             textStyle: {
//                 color: '#307dbf',
//             },
//             itemWidth: 10,
//             itemHeight: 10,
//             borderRadius: 0,
//             top: 40, //图例图标的定位上和左
//             left: 10,
//             // data:['异常','正常']
//             data:[
//                 {
//                     name:'异常',
//                     textStyle:{
//                         fontSize:12,
//                         // fontWeight:'bolder',
//                         color:'#28a5f9'
//                     },
                    
//                     // icon:'reactRed'
//                     icon: 'image://' + CONTEXTPATHIMG + '/icon/reactRed.png'
//                 },
//                 {
//                     name:'正常',
//                     textStyle:{
//                         fontSize:12,
//                         // fontWeight:'bolder',
//                         color:'#28a5f9'
//                     },
//                     // icon:'reactBlue'
//                     icon: 'image://' + CONTEXTPATHIMG + '/icon/reactBlue.png'
//                 }
//             ]
//         },
//         color:['#28a5f9', '#f77b58'],
//         calculable : true, //pie图边框线
//         series : [
//             {
//                 name:'主机资源',
//                 type:'pie',
//                 radius : '82%', //这个百分比是根据父元素div的宽高的82%来计算的
//                 center: ['65%', '50%'],
//                 label:{            //饼图图形上的文本标签
//                     normal:{
//                         show:false,
//                         position:'inner', //标签的位置
//                         textStyle : {
//                             fontWeight : 300 ,
//                             fontSize : 16    //文字的字体大小
//                         },
//                         formatter:'{d}%'

                        
//                     }
//                 },
//                 data:[
//                     {value:435, name:'异常',
//                         itemStyle: {// 渐变色只有在这个itemStyle中设置
//                             normal: {
//                                 // color: '#28a5f9',
//                                 color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ //饼图径向渐变是0,0,1,0的组合
//                                 // 0% 处的颜色   
//                                 offset: 0, color: '#1f92ef'  },
//                                 {
//                                 // 100% 处的颜色
//                                 offset: 1, color: '#3fcefd' 
//                                 }], false)
//                             }
//                         },        
//                     },
//                     {value:210, name:'正常', 
//                         itemStyle: {
//                             normal: {
//                                 color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ //饼图径向渐变是0,0,1,0的组合
//                                 // 0% 处的颜色   
//                                 offset: 0, color: '#fe8769'  },
//                                 {
//                                 // 100% 处的颜色
//                                 offset: 1, color: '#ef6d42' 
//                                 }], false)
//                             }
//                         },        
//                     },
//                 ]
//             }
//         ]
//     };

//     var echart = echarts.init(document.getElementById(id));
//     echart.setOption(option)
//     var myOptions = echart.getOption();
// }
function initEchartPie1(data, id) { 
    var option = {
        tooltip : {
            trigger: 'item',
            formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        legend: {
            orient : 'vertical',
            x : 'left',
            data:['直达','营销广告']
        },
        calculable : false,
        series : [
            {
                name:'访问来源',
                type:'pie',
                selectedMode: 'single',
                radius : [0, 70],
                
                // for funnel
                x: '20%',
                width: '40%',
                funnelAlign: 'right',
                max: 1548,
                
                itemStyle : {
                    normal : {
                        label : {
                            position : 'inner'
                        },
                        labelLine : {
                            show : false
                        }
                    }
                },
                data:[
                    {value:335, name:'直达'},
                ]
            },
            {
                name:'访问来源',
                type:'pie',
                radius : [100, 140],
                
                // for funnel
                x: '60%',
                width: '35%',
                funnelAlign: 'left',
                max: 1048,
                
                data:[
                    {value:335, name:'直达'},
                    {value:310, name:'邮件营销'},
                ]
            }
        ]
    };

    var echart = echarts.init(document.getElementById(id));
    echart.setOption(option)
    var myOptions = echart.getOption();
}
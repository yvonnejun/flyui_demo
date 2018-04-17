/**
 * @description: home
 * @author：junyang
 * @time 2018-2-23
 */
'use strict';


var fly = require('fly');

module.exports = fly.Component.extend({

  template: __inline('./echartspieDemo.html'),

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
        
                initEchartPie1(cityInfoData, 'pie1');
                initEchartPie2(cityInfoData, 'pie2');
      
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



function initEchartPie1(data, id) {
    // var maxData = 0;
    // for (var i = 0; i < data.length; i++) { //解决x轴max值的问题
    //     if (maxData < parseFloat(data[i].dateTotalNum)) {
    //         var middleNum = parseFloat(data[i].dateTotalNum);
    //         maxData = Math.ceil(middleNum);
    //         // console.log(data[i].dateTotalNum);
    //     }
    // }
    // console.log(maxData);

    // var defaultCityData = [];
    // for (var i = 0; i < data.length; i++) {
    //     defaultCityData.push(data[i].cityName);
    // }
    // var defaultTotalData = [];
    // for (var i = 0; i < data.length; i++) {
    //     defaultTotalData.push(parseFloat(data[i].dateTotalNum));
    // }

    // var defaultData = [];
    // for (var i = 0; i < data.length; i++) {
    //     defaultData.push(parseFloat(data[i].dateNum));
    // }

    

    var option = {
        title : {
            text: '主机资源',
            x:'left',
            left: 10,
            top: 10,
            textStyle: {
                color: '#28a5f9',
                fontSize: 14,
                fontWeight: 'bold'
            },
        },
        tooltip : {
            trigger: 'item',
            formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        legend: {
            orient : 'vertical',
            x : 'left',
            textStyle: {
                color: '#307dbf',
            },
            itemWidth: 10,
            itemHeight: 10,
            borderRadius: 0,
            top: 40, //图例图标的定位上和左
            left: 10,
            // data:['异常','正常']
            data:[
                {
                    name:'异常',
                    textStyle:{
                        fontSize:12,
                        // fontWeight:'bolder',
                        color:'#28a5f9'
                    },
                    
                    // icon:'reactRed'
                    icon: 'image://' + CONTEXTPATHIMG + '/icon/reactRed.png'
                },
                {
                    name:'正常',
                    textStyle:{
                        fontSize:12,
                        // fontWeight:'bolder',
                        color:'#28a5f9'
                    },
                    // icon:'reactBlue'
                    icon: 'image://' + CONTEXTPATHIMG + '/icon/reactBlue.png'
                }
            ]
        },
        color:['#28a5f9', '#f77b58'],
        calculable : true, //pie图边框线
        series : [
            {
                name:'主机资源',
                type:'pie',
                radius : '75%',
                center: ['60%', '50%'],
                label:{            //饼图图形上的文本标签
                    normal:{
                        show:false,
                        position:'inner', //标签的位置
                        textStyle : {
                            fontWeight : 300 ,
                            fontSize : 16    //文字的字体大小
                        },
                        formatter:'{d}%'

                        
                    }
                },
                data:[
                    {value:435, name:'异常',
                        itemStyle: {// 渐变色只有在这个itemStyle中设置
                            normal: {
                                // color: '#28a5f9',
                                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ //饼图径向渐变是0,0,1,0的组合
                                // 0% 处的颜色   
                                offset: 0, color: '#1f92ef'  },
                                {
                                // 100% 处的颜色
                                offset: 1, color: '#3fcefd' 
                                }], false)
                            }
                        },        
                    },
                    {value:210, name:'正常', 
                        itemStyle: {
                            normal: {
                                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ //饼图径向渐变是0,0,1,0的组合
                                // 0% 处的颜色   
                                offset: 0, color: '#fe8769'  },
                                {
                                // 100% 处的颜色
                                offset: 1, color: '#ef6d42' 
                                }], false)
                            }
                        },        
                    },
                ]
            }
        ]
    };

    var echart = echarts.init(document.getElementById(id));
    echart.setOption(option)
    var myOptions = echart.getOption();
    console.log(myOptions);
}


function initEchartPie2(data, id) {
    // var maxData = 0;
    // for (var i = 0; i < data.length; i++) { //解决x轴max值的问题
    //     if (maxData < parseFloat(data[i].dateTotalNum)) {
    //         var middleNum = parseFloat(data[i].dateTotalNum);
    //         maxData = Math.ceil(middleNum);
    //         // console.log(data[i].dateTotalNum);
    //     }
    // }
    // console.log(maxData);

    // var defaultCityData = [];
    // for (var i = 0; i < data.length; i++) {
    //     defaultCityData.push(data[i].cityName);
    // }
    // var defaultTotalData = [];
    // for (var i = 0; i < data.length; i++) {
    //     defaultTotalData.push(parseFloat(data[i].dateTotalNum));
    // }

    // var defaultData = [];
    // for (var i = 0; i < data.length; i++) {
    //     defaultData.push(parseFloat(data[i].dateNum));
    // }

    

    var option = {
        title : {
            text: '组件资源',
            x:'left',
            left: 10,
            top: 10,
            textStyle: {
                color: '#28a5f9',
                fontSize: 14,
                fontWeight: 'bold'
            },
        },
        tooltip : {
            trigger: 'item',
            formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        legend: {
            orient : 'vertical',
            x : 'left',
            textStyle: {
                color: '#307dbf',
            },
            itemWidth: 10, //图例图标的宽度
            itemHeight: 10, //图例图标的高度
            borderRadius: 0, //图例图标的圆角设置，0是直角,还有一个方案那就是，把图例图标换成自定义图标更灵活那就不用处理图表中的图标了
            top: 40,
            left: 10,
            // data:['异常','正常']
            data:[
                {
                    name:'异常',
                    textStyle:{
                        fontSize:12,
                        // fontWeight:'bolder',
                        color:'#28a5f9'
                    },
                    // icon:'reactRed'
                    icon: 'image://' + CONTEXTPATHIMG + '/icon/reactRed.png'
                },
                {
                    name:'正常',
                    textStyle:{
                        fontSize:12,
                        // fontWeight:'bolder',
                        color:'#28a5f9'
                    },
                    // icon:'reactBlue'
                    icon: 'image://' + CONTEXTPATHIMG + '/icon/reactBlue.png'
                }
            ]
        },
        // color:['#28a5f9', '#f77b58'],
        calculable : true,
        // itemStyle: {
        //     normal: {
        //         color: '#28a5f9',
        //         shadowBlur: 200,
        //         shadowColor: 'rgba(0, 0, 0, 0.5)'
        //     }
        // },
        series : [
            {
                name:'组件资源',
                type:'pie',
                radius : '75%',
                center: ['60%', '50%'],
                label:{            //饼图图形上的文本标签
                    normal:{
                        show:false,
                        position:'inner', //标签的位置
                        textStyle : {
                            fontWeight : 300 ,
                            fontSize : 16    //文字的字体大小
                        },
                        formatter:'{d}%'

                        
                    }
                },
                data:[
                    {value:430, name:'异常', 
                        itemStyle: {// 渐变色只有在这个itemStyle中设置
                            normal: {
                                // color: '#28a5f9',
                                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ //饼图径向渐变是0,0,1,0的组合
                                // 0% 处的颜色   
                                offset: 0, color: '#1f92ef'  },
                                {
                                // 100% 处的颜色
                                offset: 1, color: '#3fcefd' 
                                }], false)
                            }
                        },    
                    },
                    {value:305, name:'正常', 
                        itemStyle: {
                            normal: {
                                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ //饼图径向渐变是0,0,1,0的组合
                                // 0% 处的颜色   
                                offset: 0, color: '#fe8769'  },
                                {
                                // 100% 处的颜色
                                offset: 1, color: '#ef6d42' 
                                }], false)
                            }
                        },        
                    },
                ]
            }
        ]
    };

    var echart = echarts.init(document.getElementById(id));
    echart.setOption(option)
    var myOptions = echart.getOption();
    console.log(myOptions);
}
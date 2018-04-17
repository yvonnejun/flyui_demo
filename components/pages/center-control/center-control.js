var fly = require('fly');
// var io = require('socket.io');
var now = utils.getNowFormatDate();
var time = utils.getNowFormatTime();
var getFullYear = now.year;
var getMonth = now.month;
var getDate = now.strDate;
var getTimes = time.currenttime;
var getWeek = utils.getWeek(now.currentdate);
// var routerManager = require('router-manager');

var that;
var view = module.exports = fly.Component.extend({
    name: 'router-view',
    template: fly.template(__inline('./center-control.html')),
    ctor: function (element, options) {
        this._super(element, options);
        that = this;
        // var socket = this.socket = io.connect('http://localhost:1414');
        // console.log(socket);
        // socket.emit('regViewer', {},function(msg){
        //     console.log(msg);
        // });
        // socket.on('receive', function(data,cb){
        //     console.log(data);
        //     that.options.set('msg','我也好');
        //     cb('已收到');
        // });
    },
    options: {  //构造体options就是data,而且不支持深层次读写数据，两层也不行
        getFullYear: getFullYear,
        getMonth: getMonth,
        getDate: getDate,
        getTimes: getTimes,
        getWeek: getWeek,
        alarmInfoData: []
    },
});
var dao = {
    findAlarmInfo: function () {
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
            url: CONFIGPATH.API.DATA_RESOURCES.findAlarmInfo,
            data: param
        }, function (res) {
            var alarmInfoData = res;   
            // that.options.set('alarmInfoData', alarmInfoData);  
            that.options.set('alarmInfoData', alarmInfoData); 
        }, function () { 

        });
    },
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
                var cityInfoData = res;  
                initEchartBubble(cityInfoData, 'bubblegraph');

        }, function () { });
    },
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
        }, function () { 
            
        });
    },
};
function init() {
    // fly.alert('显示端页面init初始化成功');
    // dao.findAlarmInfo();
    dao.findMonitoringControlCity();
    // dao.findDataResourceChangeNum();
    // var v = new view(); //fly的fly.Component.extend是构造函数，需要实例化才能拿到其内的对象设置值
    // console.log(v);
    setInterval(function () {
        var getTimes = utils.getNowFormatTime().currenttime;
        that.options.set('getTimes', getTimes);
    }, 1000)

}

// module.exports.destroy = function () {
// }

// module.exports.render = function () {
//     // var mainview = document.getElementById("mainview");
//     // mainview.innerHTML = tpl;//不用走路由的话，这样绑定模板是可以的，与路由器冲突不推荐，去掉路由器会报很多错
//     // fly.bind(mainview, vm);//不用走路由的话，这样绑定vm控制器也是可以的，与路由器冲突不推荐
//     init();
// }
init();

// bubble graph
var agencyUnits = ['省文化厅','省教育厅','省财政厅','省地震局','合肥市','省气象局','安庆市','省体育局','省农科院','省管局','省质监局','淮南市','淮北市','省司法厅','毫州市','省林业厅'];
function random(){
    var r = Math.round(Math.random() * 700);//这个数据代表了气泡大小
    return (r * (r % 2 == 0 ? 1 : -1));
}
function randomRadius(){
    var r = Math.round(Math.random() * 700);//这个数据代表了气泡大小
    return (r > 400 ? r : 400); //控制数据就是控制气泡的大小，所以最小气泡我给400的大小展示
}
function randomCeil(){
    var n = Math.round(Math.random() * 10);//这个数据代表了气泡大小
    return Math.ceil(n); //控制数据就是控制气泡的大小，所以最小气泡我给400的大小展示
}
function randomDataArray() {
    var d = [];
    var len = 20; //这个值就代表了气泡数量，scatter1显示20个，scatter2显示20个，一共显示40个
    while (len--) {
        d.push([
            random(),
            random(), //前面两个数据是气泡圆心坐标位置
            // Math.abs(random()), //这个数据为什么要绝对值，因为这个是气泡半径值,也就是气泡大小
            randomRadius(), //这个数据为什么要绝对值，因为这个是气泡半径值,也就是气泡大小
        ]);
        // console.log(d);
    }
    return d;
}
function initEchartBubble(data, id) {
    var option = {
        tooltip : {
            trigger: 'item', //axis是指根据坐标轴来触发悬浮效果，item是根据划过的个体元素对象来触发悬浮效果
            showDelay : 0,
            axisPointer:{
                show: true,
                type : 'cross',
                lineStyle: {
                    type : 'dashed',
                    width : 1
                }
            }
        },
        // legend: {
        //     data:['scatter1','scatter2']
        // },
        xAxis : [
            {
                type : 'value',
                show: false,
                splitNumber: 100,
                scale: true
            }
        ],
        yAxis : [
            {
                type : 'value',
                show: false,
                splitNumber: 100,
                scale: true
            }
        ],
        series : [
            {
                name:'bubbleGraphGreen',
                type:'scatter',
                symbolSize: function (value){
                    return Math.round(value[2] / 5);
                },
                itemStyle : { 
                    normal: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0,
                            color: "#a6fad5"
                        }, {
                            offset: 1,
                            color: "#19cc7e"
                        }], false), 
                        label:{
                            show:true,
                            position:'inside', 
                            textStyle: {
                                    color: '#ffffff',
                                    fontWeight: 'bold',
                                    fontSize: 16
                            },
                            formatter:function(params){
                                for (var i = 0; i < agencyUnits.length; i++) {
                                    var allStrs = agencyUnits[randomCeil()];
                                    return allStrs;
                                }
                            }
                        },
                        labelLine:{show:false}
                    },
                    emphasis: {
                         borderColor: 'rgba(35, 92, 147, 0.6)', //透明度颜色设置
                         borderWidth: 0,
                         itemStyle : { normal: {color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                offset: 0,
                                color: "#d5efff"
                            }, {
                                offset: 1,
                                color: "#1ca7fc"
                            }], false), }
                         },
                    }
                },
                data: randomDataArray()
            },
            {
                name:'bubbleGraphBule',
                type:'scatter',
                symbolSize: function (value){
                    return Math.round(value[2] / 5);
                },
                borderColor: 'rgba(35, 92, 147, .5)', //透明度颜色设置
                borderWidth: 0,
                itemStyle : { 
                    normal: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0,
                            color: "#8fd7ff"
                        }, {
                            offset: 1,
                            color: "#007eee"
                        }], false),
                        label:{
                            show:true, 
                            position:'inside', 
                            textStyle: {
                                color: '#ffffff',
                                fontWeight: 'bold',
                                fontSize: 16
                            },
                            formatter:function(params){
                                for (var i = 0; i < agencyUnits.length; i++) {
                                    var allStrs = agencyUnits[randomCeil()];
                                    return allStrs;
                                }
                            }
                        },
                        labelLine:{show:false}
                    },
                    emphasis: {
                         borderColor: 'rgba(35, 92, 147, 0.6)', //透明度颜色设置
                         borderWidth: 0,
                         itemStyle : { normal: {color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                offset: 0,
                                color: "#d5efff"
                            }, {
                                offset: 1,
                                color: "#1ca7fc"
                            }], false), }
                         },
                     }
                },
                data: randomDataArray()
            }
        ]
    };
    var echart = echarts.init(document.getElementById(id));
        echart.setOption(option);
}
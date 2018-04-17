var fly = require('fly');
// var io = require('socket.io');
var now = utils.getNowFormatDate();
var time = utils.getNowFormatTime();
var getFullYear = now.year;
var getMonth = now.month;
var getDate = now.strDate;
var getTime = time.currenttime;
var getWeek = utils.getWeek(now.currentdate);
// var routerManager = require('router-manager');
// var tpl = __inline('router-view.html');
// console.log(tpl); //模板能正常输出
var that;
var view = module.exports = fly.Component.extend({
// var view = fly.Component.extend({
    name: 'router-view',
    template: fly.template(__inline('./center-operation.html')),
    ctor: function (element, options) {
        this._super(element, options);
        that = this;
        // console.log(this);
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
        // setInterval(function () {
        //     var getTimes = utils.getNowFormatTime().currenttime;
        //     // $("#getTime").html(v.data.getTime);
        //     that.options.set('data.getTime', getTimes);
        // }, 1000)
    },
    options: {  //构造体options就是data,而且不支持深层次读写数据，两层也不行
        getFullYear: getFullYear,
        getMonth: getMonth,
        getDate: getDate,
        getTime: getTime,
        getWeek: getWeek,
        alarmInfoData: [],
        topBannerData: [],
        runtimeResourceData: [],
    },
});
var dao = {
    findTopBannerData: function () {
        var param = {};
        networkUtils.ajaxGet({
            url: CONFIGPATH.API.DATA_RESOURCES.findTopBannerData,
            data: param
        }, function (res) {
            var topBannerData = res;  
            that.options.set('topBannerData', topBannerData);
            for (var i = 0, len = topBannerData.length; i < len; i++) {
                switch (topBannerData[i].title) {
                    case "目录" :
                        that.options.set('itemDir', topBannerData[i]);
                        break;
                    case "入库量" :
                        that.options.set('itemScheduled', topBannerData[i]);
                        break;
                    case "文件" :
                        that.options.set('itemFile', topBannerData[i]);
                        break;
                    case "服务" :
                        that.options.set('itemService', topBannerData[i]);
                        break;
                    case "数据表" :
                        that.options.set('itemDataTable', topBannerData[i]);
                        break;
                    case "交换量" :
                        that.options.set('itemChangeNum', topBannerData[i]);
                        break;
                    case "数据中心任务数" :
                        that.options.set('itemTask', topBannerData[i]);
                        break;
                    case "告警数" :
                        that.options.set('itemAlarm', topBannerData[i]);
                        break;
                    default:
                        break;
                }
            }
            // alert(that.options.get('itemDir'));
        }, function () { 

        });
    },
    findRuntimeResourceData: function () {
        var param = {};
        networkUtils.ajaxGet({
            url: CONFIGPATH.API.DATA_RESOURCES.findRuntimeResourceData,
            data: param
        }, function (res) {
            var runtimeResourceData = res;  
            that.options.set('runtimeResourceData', runtimeResourceData);
        }, function () { 

        });
    },
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
                initEchart(cityInfoData, 'cityControlECharts');   

                initEchartPie1(cityInfoData, 'centerOperationPie1');
                initEchartPie2(cityInfoData, 'centerOperationPie2');

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
                var changeInfoData = res;
                initEchart2(changeInfoData, 'proDepartmentChangeNumEcharts');
        }, function () { });
    },
};
function init() {
    // fly.alert('显示端页面init初始化成功');
    dao.findAlarmInfo();
    dao.findMonitoringControlCity();
    dao.findDataResourceChangeNum();
    dao.findTopBannerData();
    dao.findRuntimeResourceData();
    var v = new view(); //fly的fly.Component.extend是构造函数，需要实例化才能拿到其内的对象设置值
    console.log(v);
    setInterval(function () {
        var getTimes = utils.getNowFormatTime().currenttime;
        // $("#getTime").html(getTimes);
        that.options.set('getTime', getTimes);
    }, 1000)
    /* 创建一个克隆节点 */
    setTimeout(function () {
        //单个文本翻转
        // function overturnGreen() {
        //     //获取元素-clone()-插入到上下文-数据变化
        //     var tgEmClone = $(".item-content .content-text-green .text-green").find('em').clone(); //克隆成功
        //     var tgClone = $(".item-content .content-text-green .text-green")
        //     /* 插入到上下文 */
        //     tgEmClone.appendTo(".item-content .content-text-green .text-green"); // 添加成功
        //     //tgEmClone.prependTo(".item-content .content-text-green .text-green"); // 前置添加
        //     // for (var i = 0, len = tgEmClone.length; i < len; i++) {
        //     //     $(tgEmClone[i]).appendTo(ic[i].className);
        //     // }
        //     /* 数据-变化 */
        //     var node = $(".item-content .content-text-green .text-green>em:last")
        //     var txtClone = parseInt(utils.unkilobit(node.text()))+Math.ceil(Math.random() * 100);
        //     var strClone = utils.kilobit(txtClone);
        //     node.text(strClone);
        // }
        // function overturnBlue() {
        //     //获取元素-clone()-插入到上下文-数据变化
        //     var tgEmClone = $(".item-content .content-text-blue .text-blue").find('em').clone(); //克隆成功
        //     var tgClone = $(".item-content .content-text-blue .text-blue")
        //     /* 插入到上下文 */
        //     tgEmClone.appendTo(".item-content .content-text-blue .text-blue"); // 添加成功
        //     //tgEmClone.prependTo(".item-content .content-text-blue .text-blue"); // 前置添加
        //     // for (var i = 0, len = tgEmClone.length; i < len; i++) {
        //     //     $(tgEmClone[i]).appendTo(ic[i].className);
        //     // }
        //     /* 数据-变化 */
        //     var node = $(".item-content .content-text-blue .text-blue>em:last")
        //     var txtClone = parseInt(utils.unkilobit(node.text()))+Math.ceil(Math.random() * 100);
        //     var strClone = utils.kilobit(txtClone);
        //     node.text(strClone);
        // }
            
        // function flip(obj){ //翻转动效+透明度变化
        //     $(".item-content .content-text-green .text-green").find('em').css('opacity', 0.1);
        //     $(".item-content .content-text-green .text-green").find('em').animate({
        //         top: '-=21',
        //         opacity: 1
        //     }, 600);
        //     $(".item-content .content-text-blue .text-blue").find('em').css('opacity', 0.1);
        //     $(".item-content .content-text-blue .text-blue").find('em').animate({
        //         top: '-=21',
        //         opacity: 1
        //     }, 600);
        // }

        var tg = $(".item-content .content-text-green .text-green");
        var tb = $(".item-content .content-text-blue .text-blue");
        var tgEm = $(".item-content .content-text-green .text-green").find('em');
        var tbEm = $(".item-content .content-text-blue .text-blue").find('em');
        for (var i = 0, len = tgEm.length; i < len; i++) {
            var kiloStrGreen = utils.kilobit(tgEm[i].innerHTML);
            var kiloStrBlue = utils.kilobit(tbEm[i].innerHTML);
            tgEm[i].innerHTML = kiloStrGreen;
            tbEm[i].innerHTML = kiloStrBlue;
        }
        var toTxt = $(".text-orange").text();
        $(".text-orange").html( utils.kilobit(toTxt))
        //多个文本同时翻转
        function overturnGreen() {
            var tgEmClone = tgEm.clone();
            for (var i = 0, len = tgEmClone.length; i < len; i++) {
                tg[i].appendChild(tgEmClone[i]);
                var node = tg.eq(i).find('em').last();
                var txtClone = parseInt(utils.unkilobit(node.text()))+Math.ceil(Math.random() * 100);
                var strClone = utils.kilobit(txtClone);
                node.text(strClone);
            }
        }
        function overturnBlue() {
            var tbEmClone = tbEm.clone(); 
            for (var i = 0, len = tbEmClone.length; i < len; i++) {
                tb[i].appendChild(tbEmClone[i]);
                var node = tb.eq(i).find('em').last();
                var txtClone = parseInt(utils.unkilobit(node.text()))+Math.ceil(Math.random() * 100);
                var strClone = utils.kilobit(txtClone);
                node.text(strClone);
            }
        }
            
        function flip() {
            /**
             * 这里的$(".item-content .content-text-green .text-green").find('em')为什么不能用上面的全局声明tgEm代替，
             * 因为上面的全局声明获取的是初始没有克隆的dom元素集合，而这里属于异步获取，可以获取到克隆体。
             * 
             */
            $(".item-content .content-text-green .text-green").find('em').css('opacity', 0.1); 
            $(".item-content .content-text-green .text-green").find('em').animate({
                top: '-=21',
                opacity: 1
            }, 600);
            $(".item-content .content-text-blue .text-blue").find('em').css('opacity', 0.1);
            $(".item-content .content-text-blue .text-blue").find('em').animate({
                top: '-=21',
                opacity: 1
            }, 600);
        }

        //runtime-table-overturn
        function overturnTable() {
            var rtPClone = $(".runtimelog-list-item .runtimelog-list-item-context").find('p').clone();
            var rt = $(".runtimelog-list-item .runtimelog-list-item-context");

            for (var i = 0, len = rtPClone.length; i < len; i++) {
                rt[i].appendChild(rtPClone[i]);
                // debugger
            }
        }
            
        function flipTable() {
            $(".runtimelog-list-item .runtimelog-list-item-context").find('p').css('opacity', 0.1);
            $(".runtimelog-list-item .runtimelog-list-item-context").find('p').animate({
                top: '-=36',
                opacity: 1
            }, 600);
        }

        function changeMegineStatus(color) {
            $('.chiz-pos').find('img').attr('src', CONTEXTPATHIMG + '/icon/' + color + 'ball.png'); //注意js里面对图片的引用非要加上CONTEXTPATHIMG才行，html的img和css的背景图片都可相对路径引用
        }
        setTimeout(function () {
            overturnGreen();
            overturnBlue();
            flip();
            overturnTable();
            flipTable();
            changeMegineStatus('red');
        }, 2000);
    }, 0);
}

init();
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
        // title: {
        //     show:true,
        //     text: '地市监控',
        //     x: 'left',
        //     textStyle: {
        //         color: '#fff',
        //         fontWeight: 'normal'
        //     },
        // },
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
                barWidth : 18,//柱图宽度
                barMaxWidth:18,//最大宽度
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
                barWidth : 18,//柱图宽度
                barMaxWidth:18,//最大宽度
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
                radius : '82%', //这个百分比是根据父元素div的宽高的82%来计算的
                center: ['65%', '50%'],
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
                radius : '82%',
                center: ['65%', '50%'],
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
        // title: {
        //     show:true,
        //     text: '省直部门交换量',
        //     x: 'left',
        //     textStyle: {
        //         color: '#fff',
        //         fontWeight: 'normal'
        //     },
        //     // subtext: '(单位千)', //副标题文本
        //     // subtextStyle: { //副标题文本样式
        //     //     color: '#2b6ea8',
        //     //     fontWeight: 'normal'
        //     // },
        //     // sublink:'http://www.baidu.com',//副标题超链接
        //     // subtarget:'blank',//副标题超链接打开方式
        //     // padding:[5,10,5,5],//设置标题内边距,上，右，下，左
        //     // itemGap:17,//主副标题之间的间距
        // },
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
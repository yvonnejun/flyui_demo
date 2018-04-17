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
    template: fly.template(__inline('./canvas-curve.html')),
    ctor: function (element, options) {
        this._super(element, options);
        that = this;
    },
    options: {  //构造体options就是data,而且不支持深层次读写数据，两层也不行
        getFullYear: getFullYear,
        getMonth: getMonth,
        getDate: getDate,
        getTime: getTime,
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
    //画canvas曲线动画
    eventWindowLoaded()
}

init();
// window.addEventListener('load',eventWindowLoaded,false);
function eventWindowLoaded(){
    canvasApp();
}
function canvasSupport(){
    return Modernizr.canvas;
}
function canvasApp(){
    if(!canvasSupport()){
        return;
    }
    
    var pointImage = new Image();
    pointImage.src="/public/project-a/1.0.0/img/icon/point.png ";
    
    function drawScreen(){
        //首先填充canvas的背景
        context.fillStyle = '#eee'
        context.fillRect(0,0,theCanvas.width,theCanvas.height);
        //边框
        context.strokeStyle = '#eee'
        context.strokeRect(1,1,theCanvas.width,theCanvas.height);
        

//在这里解释下贝塞尔曲线，看网页底部的那个点击成Canvas三次贝塞尔曲线操作实例！你就会发现一个曲线是由4个点组成的，在下面有注释

var t = ball.t;
        
        var cx = 3*(p1.x-p0.x);
        var bx = 3*(p2.x-p1.x)-cx;
        var ax = p3.x-p0.x-cx-bx;
        
        var cy = 3*(p1.y-p0.y);
        var by = 3*(p2.y-p1.y)-cy;
        var ay = p3.y-p0.y-cy-by;
        
        var xt = ax*(t*t*t)+bx*(t*t)+cx*t+p0.x;
        var yt = ay*(t*t*t)+by*(t*t)+cy*t+p0.y;
        //这里的xt和yt贝塞尔曲线的公式，这里涉及到一门叫做计算机图形学的学科（大学里面有上，我也最近一直在上）
        // 0 <= t <= 1这是一个T....学过图形学的应该知道比如一根直线他的起始坐标轴的位置（0,0）然后有DDA算法计算斜率,他也是一样，具体的公式网上还是都有的，我的语言组织也不是很好-_-//


        ball.t +=ball.speed;
        
        if(ball.t>1){
            ball.t=1;
        }
        
        //绘制点
        context.font = "10px sans ";
        context.fillStyle = "#ff0000 ";
        context.beginPath();
        context.arc(p0.x,p0.y,8,0,Math.PI*2,true);
        context.closePath();
        context.fill();
        context.fillStyle = "#fff";
        context.fillText("0",p0.x-2,p0.y+2);
        
        
        //
        points.push({x:xt,y:yt});
        
        for(var i =0;i<points.length;i++){
            
            context.drawImage(pointImage,points[i].x,points[i].y,1,1);

        }
        //绘制图片重点！！！！图片，定位context.drawImage(img,x,y,width,height);也就是绘制那个点后的小点的轨迹
     
        context.closePath();
        
        context.fillStyle="#000000 ";
        context.beginPath();
        context.arc(xt,yt,5,0,Math.PI*2,true);
        context.closePath();
        context.fill();
    }
        var p0={x:60,y:10};//起始点
        var p1={x:70,y:200};//1号点
        var p2={x:125,y:295};//2号点
        var p3={x:350,y:350};//3号点
        var ball={x:0,y:0,speed:.01,t:0};
        var points=new Array();
        
        //这里的起始点和3号点，我取得的名字比较通俗一下，实际上应该称为端点。因为必须要经过的
        //1号点和2号点虽然可以删除但是他控制着弧线的路径，我们就叫他控制点
        
        theCanvas = document.getElementById('canvas')
        context = theCanvas.getContext("2d")

        setInterval(drawScreen,33);
        
        
    
    
}
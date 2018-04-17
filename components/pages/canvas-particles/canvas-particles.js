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
    template: fly.template(__inline('./canvas-particles.html')),
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
    
};
function init() {
    // fly.alert('显示端页面init初始化成功');
    //画canvas粒子动画
    spawn();
    render();
    requestAnimationFrame(arguments.callee);
}

init();
var canvas = document.getElementById("myCanvas"),
    ctx = canvas.getContext("2d"),
    w = canvas.width = window.innerWidth,
    h = canvas.height = window.innerHeight,
    particles = [],
    pos = {x:w/2,y:h/2};
    debugger
    console.log(pos.x);
    console.log(pos.y);

function Particle(){
    this.x = pos.x;
    this.y = pos.y;
    this.r = 0.03;
    this.color = "#" + ((Math.random()*0xffffff) | 0).toString(16);
    this.vx = random(-5,5); 
    this.vy = random(-3,3); 
}

Particle.prototype.update = function(){
    this.x += this.vx;
    this.y += this.vy;
    this.r += 0.02;
}

Particle.prototype.draw = function(){
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
    ctx.fill();
}

function spawn(){
    var p = new Particle();
    particles.push(p);
}

function render(){
    ctx.fillStyle = "rgba(0,0,0,.1)";
    ctx.fillRect(0,0,w,h);
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.draw();
        p.update();
        p.r > 5 && particles.splice(i,1)
    }
}

~function(){ //这是demoinit()执行函数
    spawn();
    render();
    requestAnimationFrame(arguments.callee);
}()

var p = new Particle();
console.log(p)

function random(min,max){
    return Math.random()*(max-min)+min;
}

// document.onmousemove = function(e){
// 	pos.x = e.pageX;
// 	pos.y = e.pageY;
// }
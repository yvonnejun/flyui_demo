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

var that;
var view = module.exports = fly.Component.extend({
    name: 'router-view',
    template: fly.template(__inline('./canvas-points.html')),
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
    var setting = {
			"el": ".canvasview",		// （必选）指定一个父容器
//			"width": 600,				// （可选）宽度：不写默认为父容器的大小
//			"height": 400,				// （可选）高度：
			"bgcolor": "#222222",		// （可选）画布的背景颜色
			"color": "#ffffff",			// （可选）粒子的颜色
			"concentration": 0.5,		// （可选）浓度
			"radius": 5,				// （可选）例子半径
			"opacity": 0.9,				// （可选）粒子透明度
			"duration": 16,				// （可选）运动的时间（秒）大概值不一定精确
			"rangeRadius": 512,			// （可选）粒子运动的范围	
//			"tweenType": "",			// （可选）粒子运动的方式，不写表示每一个粒子随机一个方式，"easeInOutQuad" || "easeInOutCubic" || "easeInOutBack" || "easeOutBounce"
//			"tweenAni": "",				// （可选）当粒子进行自定义动画的时候使用那个缓动，不指定则使用 easeInOutBack
		}
		
		var test = new granule(setting);	// 设置动画的属性
		test.startAnimation();				// 启动，开始运行
}

init();
var granule = function(setting) {
	this.TWEEN = ["easeInOutQuad", "easeInOutCubic", "easeInOutBack"];
	this.fontSize = 256;		// 定义echo命令的字体大小
	this.sett = setting
	this._init();
	
	this.randomCreateAllBall();

	this.createCMD();
	this.bindEvent();

}

/**
 * 用于初始化
 * 
 * 创建画布: this.canvas;
 * 画图环境：this.cc
 * 计算宽高：this.cw, this.ch
 * 圆的半径： this.radius ， 默认5px
 * 例子的浓度： this.concentration
 * 粒子的运动时间： this.duration
 * 粒子的 活动范围半径：this.rangeRadius
 * 计算粒子数量: this.cg
 */
granule.prototype._init = function() {
	var el = document.querySelector(this.sett.el);
	var elbox = el.getBoundingClientRect();
	//			console.log(elbox)

	this.canvas = document.createElement("canvas");
	this.cc = this.canvas.getContext("2d");
	this.ctemp = document.createElement("canvas");
	this.c2 = this.ctemp.getContext("2d");

	this.cw = parseInt(this.sett.width) || elbox.width;
	this.ch = parseInt(this.sett.height) || elbox.height;
	this.radius = this.sett.radius || 5;
	this.opacity = this.sett.opacity || 1;
	this.concentration = this.sett.concentration || 1;
	this.duration = this.sett.duration || 8;
	this.rangeRadius = this.sett.rangeRadius || (this.cw + this.ch) / 4;
	this.tweenType = this.sett.tweenType || "";
	this.tweenAni = this.sett.tweenAni || "easeInOutCubic";

	this.cg = Math.floor(this.cw * this.ch / (this.radius * this.radius * 8 * 8) * this.concentration);
	this.color = this.sett.color || "#ffffff";
	this.bgcolor = this.sett.bgcolor || "#222222";

	this.canvas.width = this.cw;
	this.canvas.height = this.ch;
	this.ctemp.width = this.cw;
	this.ctemp.height = 256;
	this.ctemp.setAttribute("style", "position: absolute;opacity: 0;left: 0;top: 0;z-index: -2;")
	this.c2.fillStyle = "#FF0000";
	this.c2.font = "256px 微软雅黑";
	this.c2.textBaseline = "middle";
	el.appendChild(this.canvas);
	el.appendChild(this.ctemp);
}

/*
 * 随机所有的球
 */
granule.prototype.randomCreateAllBall = function() {
	var all = [];
	for(var i = 0; i < this.cg; i++) {
		var ball = {};
		ball.stauts = "0"; // 增加一个特殊状态，这个状态表示该粒子目前时候处于 [自定义动画中](自定义动画：输入指令而显示的动画)。0：表示目前没有自定义动画
		ball.color = this.color;

		ball.r = this.radius;
		ball.x = this.rdmmm(0, this.cw); // 实际坐标x， 对应tween中的b：起点
		ball.y = this.rdmmm(0, this.ch); // 实际坐标y，

		ball.txb = ball.x; // 对应tween中的b：起点
		ball.tyb = ball.y; // 起点， 对应y坐标

		ball.txc = this.rdmmm(-this.rangeRadius, this.rangeRadius); // 对应tween中的c：位移（可以随机一个）
		ball.tyc = this.rdmmm(-this.rangeRadius, this.rangeRadius);

		ball.td = (this.duration + this.rdmmm(-this.duration / 2, this.duration / 2)) * 60; // 对应tween中的d：终止时间，建议设置为60的倍数
		ball.tt = this.rdmmm(0, ball.td); // 对应tween中的t：时间

		if(this.tweenType) {
			ball.tp = this.tweenType
		} else {
			ball.tp = this.TWEEN[this.rdmmm(0, this.TWEEN.length)];
		}

		all.push(ball);
	}
	this.balls = all;
}

var ccc = 0;

/**
 * 对一个ball进行计算
 * @param {Object} ball
 */
granule.prototype.updataBallPosition = function(b) {
	// 根据 tween 计算在当前帧的位置
	var newx = this[b.tp](b.tt, b.txb, b.txc, b.td);
	var newy = this[b.tp](b.tt, b.tyb, b.tyc, b.td);

	// 四个方向的碰撞检测
	if(newx < 0) {
		newx = -newx;
	}
	if(newy < 0) {
		newy = -newy;
	}
	if(newx > this.cw) {
		newx = 2 * this.cw - newx;
	}
	if(newy > this.ch) {
		newy = 2 * this.ch - newy;
	}

	b.x = newx;
	b.y = newy;

	// 当运动时间结束之后   普通的粒子重新随机一个位移
	if(b.stauts == 0) {
		if(++b.tt >= b.td) {
			b.txb = b.x;
			b.tyb = b.y;
			b.txc = this.rdmmm(-this.rangeRadius, this.rangeRadius);
			b.tyc = this.rdmmm(-this.rangeRadius, this.rangeRadius);
			b.tt = 0;
		}
	} else if(b.stauts == 1) {
		if(b.tt < b.td) {
			b.tt++;
		}
	}
	return b;
}

/**
 * 绘制背景
 */
granule.prototype.drawbg = function() {
	this.cc.globalAlpha = 1;
	this.cc.fillStyle = this.bgcolor;
	this.cc.fillRect(0, 0, this.cw, this.ch);
}

/**
 * 绘制所有的小球
 */
granule.prototype.drawBalls = function() {
	this.drawbg();
	this.cc.globalAlpha = this.opacity;
	for(var i = 0; i < this.balls.length; i++) {
		var ball = this.balls[i];
		this.cc.beginPath();
		this.cc.fillStyle = ball.color || this.color;
		this.cc.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
		this.cc.closePath();
		this.cc.fill();
	}
}

/**
 * 生成指定范围的随机数
 * @param {int} min： 随机数的下限
 * @param {int} max： 随机数的上限
 */
granule.prototype.rdmmm = function(min, max) {
	return Math.floor(Math.random() * (max - min) + min);
}

/**
 * 二次缓动, 具体请查看Tween源码
 * @param {int} t:当前时间
 * @param {int} b:初始值
 * @param {int} c:变化量, 位移
 * @param {int} d:持续时间
 */
granule.prototype.easeInOutQuad = function(t, b, c, d) {
	if((t /= d / 2) < 1) return c / 2 * t * t + b;
	return -c / 2 * ((--t) * (t - 2) - 1) + b;
}
// 三次缓动
granule.prototype.easeInOutCubic = function(t, b, c, d) {
	if((t /= d / 2) < 1) return c / 2 * t * t * t + b;
	return c / 2 * ((t -= 2) * t * t + 2) + b;
}
// bakc
granule.prototype.easeInOutBack = function(t, b, c, d, s) {
	if(s == undefined) s = 1.70158;
	if((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
	return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
}
// 弹簧效果
granule.prototype.easeOutBounce = function(t, b, c, d) {
	if((t /= d) < (1 / 2.75)) {
		return c * (7.5625 * t * t) + b;
	} else if(t < (2 / 2.75)) {
		return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
	} else if(t < (2.5 / 2.75)) {
		return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
	} else {
		return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
	}
}

/*
 * 开启动画
 */
granule.prototype.startAnimation = function() {
	var self = this;
	var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

	start();

	function start() {
		for(var i = 0; i < self.balls.length; i++) {
			var ball = self.balls[i];
			var newb = self.updataBallPosition(ball);
			self.balls[i] = newb;
		}
		self.drawBalls();
		raf(start);
	}
}

/**
 * 组建矩形
 * @param {Object} w: 矩形的宽度
 * @param {Object} h： 矩形的高度
 */
granule.prototype.rect = function(w, h) {
	var cw = this.cw;
	var ch = this.ch;
	var r = this.radius;

	var top = (ch - (h * (r * 2 + 2))) / 2;
	var left = (cw - (w * (r * 2 + 2))) / 2;

	var balls = this.balls;

	for(var i = 0; i < w; i++) {
		for(var j = 0; j < h; j++) {
			var ba = balls[i * h + j] || {};
			ba.stauts = 1; // 更改状态，标记为特殊的粒子
			ba.tp = this.tweenAni;
			var tx = ba.x; // 当前的xy坐标
			var ty = ba.y;

			var zx = (r * 2 + 2) * i + left; // 计算应在所在的位置
			var zy = (r * 2 + 2) * j + top;

			var px = zx - tx; // 位移
			var py = zy - ty;

			ba.txb = ba.x; // 重新设置起点位置
			ba.tyb = ba.y;

			ba.txc = px; // 重新设置位移
			ba.tyc = py;

			ba.tt = 0; // 重置开始时间 和 结束重置
			ba.td = this.duration / 6 * 60;
		}
	}

}

/**
 * 组建一个圆
 * @param {Object} r：圆的半径
 */
granule.prototype.circle = function(r) {
	var cw = this.cw;
	var ch = this.ch;
	var r = this.radius;

	var top = (ch - 2 * (r + 2)) / 2;
	var left = (cw - 2 * (r + 2)) / 2;

	console.log(top + ":" + left);

	var balls = this.balls;
}

// TODO
/**
 * 打印字符串
 * @param {Object} str： 需要打印的字符串
 * @param {Object} type： 类型，可选
 */
granule.prototype.echo = function(str, type) {
	var ra = this.radius; // 粒子半径
	
	this.c2.fillStyle = "blue";
	this.c2.fillRect(0,0, this.cw, this.fontSize);
	this.c2.fillStyle = "red";
	var txt = str || "";
	var width = Math.ceil(this.c2.measureText(txt).width);
	this.c2.fillText(txt, 10, this.fontSize/2);

	var top = (this.ch - this.fontSize) / 2;
	var left = (this.cw - width) / 2;

	var imgData = this.c2.getImageData(0, 0, width, this.fontSize).data;

	var count = 0;

	var seep = ra * 2 + 2; // 间隔

	for(var i = 0; i < width; i += seep) {
		for(var j = 0; j < this.fontSize; j += seep) {
			var index = j * 4 * width + i * 4;
			var r = imgData[index];
			if(r > 200) {
				var ba = this.balls[count] || {};
				ba.stauts = 1;
				if (type == "error") {
					ba.color = "red";
				}
				ba.tp = this.tweenAni;

				var tx = ba.x; // 当前的xy坐标
				var ty = ba.y;

				var zx = i + left; // 计算应在所在的位置
				var zy = j + top;

				var px = zx - tx; // 位移
				var py = zy - ty;

				ba.txb = ba.x; // 重新设置起点位置
				ba.tyb = ba.y;

				ba.txc = px; // 重新设置位移
				ba.tyc = py;

				ba.tt = 0; // 重置开始时间 和 结束重置
				ba.td = this.duration / 6 * 60;
				count++;
			}

		}
	}
}

/**
 * 创建命令行
 */
granule.prototype.createCMD = function() {
	var inp = document.createElement("input");
	inp.type = "text";
	inp.id = "__cmd"
	inp.setAttribute("style", "display: none;position: absolute;top: 10px;left: 50%;margin-left: -200px;text-align: center;width: 400px;border: 1px solid #FFFFFF;padding: 10px;background-color: rgba(0,0,0,0);outline: none;color: #FFFFFF;font-size: 18px;");
	document.querySelector("body").appendChild(inp);
}

/**
 * 显示或者影藏cmd窗口
 */
granule.prototype.showOrCloseCMDWindow = function() {
	var cmd = document.getElementById("__cmd");
	if(cmd.style.display == "block") {
		cmd.style.display = "none";
		setTimeout(function() {
			document.querySelector("#__cmd").blur();
		}, 200)
	} else {
		cmd.style.display = "block";
		setTimeout(function() {
			document.querySelector("#__cmd").focus();
		}, 200)
	}
}

/**
 * 绑定事件
 */
granule.prototype.bindEvent = function() {
	var self = this;
	var ctrl = false;
	document.addEventListener("keydown", function(e) {
		if(e.keyCode == 17) {
			ctrl = true;
		}
	});
	document.addEventListener("keyup", function(e) {
		//				console.log(e);
		// ctrl 键
		if(e.keyCode == 17) {
			ctrl = false;
		}
		// F9 键 
		if(e.keyCode == 120 && ctrl) {
			self.showOrCloseCMDWindow();
		}

		// 键盘上键
		if(e.keyCode == 38) {
			if(document.getElementById("__cmd") == document.activeElement) {
				self.cmdHistory(1);
			}
		}

		// 键盘下键
		if(e.keyCode == 40) {
			if(document.getElementById("__cmd") == document.activeElement) {
				self.cmdHistory(-1);
			}
		}

	});

	document.getElementById("__cmd").addEventListener("change", function() {
		var val = this.value.trim();

		// 是否是rect num num 画矩形
		if(/^rect\s\d{1,2}\s\d{1,2}$/.test(val)) {
			var cmds = val.split(" ");
			self.rect(cmds[1], cmds[2]);
		} else if(/^circle\s\d$/.test(val)) { // 圆， 半径不超过9
			self.circle(5);
		} else if(/^echo/.test(val)) {
			var cmds = val.split(" ");
			self.echo(cmds[1]);
		} else {
			self.echo("null", "error");
		}
		setTimeout(function() {
			self.closeAniStauts();
		}, self.duration / 2 * 1000);

		self.cmdHistory(val);

		this.value = "";
	});
}

/**
 * 获取一条命令或者存储一条命令
 * @param {Stirng || int} cmdstr： 1 | -1 | string
 * 			1:  表示上一条
 * 			-1：表示下一条
 * 			string: 表示存贮一条
 */
granule.prototype.cmdHistory = function(str) {
	var cmdarr = JSON.parse(localStorage.getItem("cmdhistory") || "[]");
	var index = parseInt(localStorage.getItem("cmdindex")) || 0;
	if(str == 1) {
		var cmd = cmdarr[index] || "";
		index = (index - 1) > 0 ? (index - 1) : 0;
		document.getElementById("__cmd").value = cmd;
		localStorage.setItem("cmdindex", index);
	} else if(str == -1) {
		var cmd = cmdarr[index] || "";
		index = index > (cmdarr.length - 2) ? (cmdarr.length - 1) : (index + 1);
		document.getElementById("__cmd").value = cmd;
		localStorage.setItem("cmdindex", index);
	} else {
		if(str != cmdarr[cmdarr.length - 1]) {
			cmdarr.push(str);
			localStorage.setItem("cmdhistory", JSON.stringify(cmdarr));
			localStorage.setItem("cmdindex", cmdarr.length - 1);
		}
	}
}

// 解除动画小球的状态
granule.prototype.closeAniStauts = function() {
	var balls = this.balls;
	for(var i = 0; i < balls.length; i++) {
		if(balls[i].stauts == 1) {
			var ball = balls[i]
			ball.stauts = 0;
			ball.color = "#FFFFFF";
			ball.txb = ball.x;
			ball.tyb = ball.y;
			ball.txc = this.rdmmm(-this.rangeRadius, this.rangeRadius); // 对应tween中的c：位移（可以随机一个）
			ball.tyc = this.rdmmm(-this.rangeRadius, this.rangeRadius);

			ball.td = (this.duration + this.rdmmm(-this.duration / 2, this.duration / 2)) * 60;
			ball.tt = 0;
			if(this.tweenType) {
				ball.tp = this.tweenType
			} else {
				ball.tp = this.TWEEN[this.rdmmm(0, this.TWEEN.length)];
			}
		}
	}
}
require.config(__FRAMEWORK_CONFIG__);

require.async([
    'jquery',
    'fly',
    'router',
    'site',//自定义组件的导入site就这样导入即可，参数中对应位置写入即可在下面的程序中调用了
    'list',
    'alert',
    'dialog',
    'calender',
    'datepicker',
], function ($, fly, Router, site, list) {

    var vm = fly({
        author: '三毛'
    });

    var router = window.router = new Router(document.getElementById('mainview'));
    //简易的site模块封装：封装注册和load功能
    // var site = {};
    // site.load = function (routerObj) {
    //     router.register('/' + routerObj.page);
    //     router.load({
    //         page: '/' + routerObj.page,
    //         queryParams: routerObj.queryParams
    //     });
    // 
    console.log(site);

    // 一级页面
    router.route("/:page", function (page, queryStringParams) {
        site.load({ // site.load封装成site模块加载法
            page: page,// 传入的page就是模块名称
            queryParams: queryStringParams ? queryStringParams : ''
        });
        // router.load({ // 本地router实例加载法
        //     page: '/' + page,
        //     queryParams: queryStringParams
        // });
    });

    // 主页--这个开启就是跳转home组件模块
    router.route('/', function () {
        router.load('/home');
    });

/**
 * 下面是实战代码
 */
     //加载首页--这个开启就是跳转home组件模块
    if (!location.hash) { //如果没有#号就默认跳转到home页面
        // location.hash = '/flowMonitor';
        location.hash = '/home';
    }

    // 注册
    router.register('/home');
    // router.register('/test');

    fly.bind(document.body, vm);

    router.start();
// 实例化元素
    // js生成了calender日历控件，ok句柄没反应
    var demo4 = document.getElementById('calenderDemo4');

    // 实例化配置      
    var options = {
        format: 'yyyy-MM-dd HH:mm:ss',
        ok: function(e){
            debugger
            fly.alert('当前选择日期为' + e.result);
        },
        clear: function(){
            debugger
            fly.alert('你取消了');
        }
    };

    // 日历控件实例化
    new fly.ui.calender(demo4, options);
    

});
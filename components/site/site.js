// 定义页面和模块对应关系
var views = {
    '404': 'pages/404'
};

//简易的site模块封装：封装注册和load功能
var $ = fly.$,
    each = $.each,
    pageView = document.getElementById('mainview'),
    site = {},
    currentPage;
site.load = function (routerObj) { // 传入路由对象router给形参r,后面是路由数据对象包含路由页面名称和url中所带的参数传值
    router.register('/' + routerObj.page);
    router.load({
        page: '/' + routerObj.page,
        queryParams: routerObj.queryParams
    });
    require.async('pages/' + routerObj.page, function (page) { // 在调用site.load()时传入的模块名称routerObj.page要加上'pages/'路径前缀，因为require.async异步加载的对象始终是components下的目录名，回调函数中的参数就是加载成功的模块对象，可以调用自身方法的模块对象
        // console.log(page);
        if (window.currentModule) {
            window.currentModule.destroy();
        }
        window.currentModule = page;
        page.render && page.render(routerObj.queryParams);
        page.refresh && page.refresh();
    });
};
module.exports = site;

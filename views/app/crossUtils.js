function CrossUtils() {}
var isFirst = true;
CrossUtils.prototype = {
    constructor: CrossUtils,
    openLocation: function (callback) {
        if (IS_IOS) {
            crossUtils.openLocationForIOS();
        } else {
            crossUtils.openLocationForAndroid(callback);
        }
    },
    openLocationForAndroid: function (callback) {
        //获取经纬度
        croods.openLocation({
            interval: 1000, //代表每隔n毫秒进行一次定位，默认5000
            success: function (res) {
                //将位置信息写入session
                if (res.lat != '5e-324') {
                    sessionStorage.lng = res.lng;
                    sessionStorage.lat = res.lat;
                    croods.closeLocation();
                    callback && callback();
                }
                console.log('position lng=' + sessionStorage.lng + " lat=" + sessionStorage.lat);
            },
            fail: function (msg) {
                callback && callback();
                if (msg == '70033: 定位服务未开启，无法开始定位') {
                    setTimeout(function () {
                        if (isFirst) {
                            // mui.confirm('GPS未开启，请去设置中开启', ' ', ['取消', '确认'], function (e) {});
                            // mui.toast('GPS未开启，请去设置中开启');
                            isFirst = false;
                        }
                    }, 1000);
                    setTimeout(function () {
                        crossUtils.openLocation();
                    }, 3000);
                }
                console.log("openLocation fail=" + msg);
            }
        });
    },
    openLocationForIOS: function () {
        crossUtils.openLocationForAndroid();
    },
    closePage: function () {
        croods.pageClose();
    },
    getNetworkType: function (callback) {
        croods.getNetworkType({
            success: function (res) { //请求成功回调
                //”2g”,”3g”,”4g”,”wifi”,”none” //为none表明没有网络
                if (res.network === 'none') {
                    mui.toast('网络未连接，请去设置中开启网络');
                    return;
                } else {
                    callback && callback();
                }
            }
        });
    },
    getBDLocation: function (callback) {
        if (ISPACKAGE) {
            croods.customPlugin({
                action: 'BDLocationPlugin.bdLocation',
                success: function (res) {
                    console.log(res);
                    fail = false;
                    sessionStorage.lng = res.lng;
                    sessionStorage.lat = res.lat;
                    callback && callback();
                }
            });
        } else {
            //如果是浏览器调试，调用会失败，此处直接给一个默认位置
            sessionStorage.lng = 117.865597;
            sessionStorage.lat = 30.550942;
            callback && callback();
        }
    },
    isLogined: function (callback) {
        if (ISPACKAGE) {
            croods.customPlugin({
                action: 'UserPlugin.isLogin',
                success: function (res) {
                    console.log('---is logined ---');
                    callback && callback();
                }
            });
        } else {
            callback && callback();
        }
    }
}

window.crossUtils = new CrossUtils();
crossUtils.getBDLocation();
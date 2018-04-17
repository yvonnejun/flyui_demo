function NetworkUtils() {
    this.isWebView = ISWEBVIEW;
}
NetworkUtils.prototype = {
    constructor: NetworkUtils,

    ajax: function(option, params, success, callback) {
        var _this = this;

        var _params = fly.$.extend(option, {
            success: function(res, status, xhr) {
                console.log("response--------start")
                console.log(params);
                console.log(res);
                console.log("response--------end")
                var res = typeof res !== 'object' && JSON.parse(res) || res;
                success && typeof success === 'function' && success(res);
            },
            error: params.error && typeof params.error === 'function' && params.error || function() {
                // debugger
                console.log("ajax error");
            },
            complete: function() {
                // debugger
                callback && typeof callback === 'function' && callback();
            }
        }, (function() {
            return params && typeof params === 'object' && params || {
                url: params
            };
        }()));
        if (_params.data && ISWEBVIEW) {
            var s = JSON.parse(JSON.stringify(_params.data));
            fly.$.extend(s, { token: "", timestamp: "" });
            var keys = Object.keys(s).sort();
            var temp = keys.toString().replace(/,/g, "").toUpperCase();
            try {
                croods.customPlugin({
                    action: 'SignPlugin.getSign',
                    params: {
                        keys: temp
                    },
                    success: function(res) {
                        var device = JSON.parse(localStorage.deviceInfo);
                        var baseParams = {
                            timestamp: Date.parse(new Date()),
                            token: localStorage.token,
                            sign: res.value,
                            version: "050",
                            platform: IS_IOS ? "IOS" : "Android",
                            systemVersion: device.osVersion,
                            screenHeight: device.screenHeight,
                            screenWidth: device.screenWidth,
                        }
                        fly.$.extend(_params.data, { baseParams: JSON.stringify(baseParams) });
                        // debugger
                        if (networkUtils.isWebView) {
                            networkUtils.isWebView_ajax(_params);
                        } else {
                            var _newAjax = networkUtils.isNative_ajax(_params);
                            callback && typeof callback === 'function' && _newAjax.always(_params.complete);
                        }
                    }
                });
            } catch (error) {
                if (error.message && error.message == "croodsBridge is not defined") {
                    if (this.isWebView) {
                        this.isWebView_ajax(_params);
                    } else {
                        var _newAjax = this.isNative_ajax(_params);
                        callback && typeof callback === 'function' && _newAjax.always(_params.complete);
                    }
                }
            }
        } else {
            if (this.isWebView) {
                this.isWebView_ajax(_params);
            } else {
                var _newAjax = this.isNative_ajax(_params);
                callback && typeof callback === 'function' && _newAjax.always(_params.complete);
            }
        }
    },

    ajaxGet: function(params, success, callback) {
        var option = {
            type: 'GET',
            dataType: 'json'
        };
        networkUtils.ajax(option, params, success, callback);
    },

    ajaxPost: function(params, success, callback) {
        var option = {
            type: 'POST',
            dataType: 'json'
        };
        networkUtils.ajax(option, params, success, callback);
    },

    ajaxErrorToast: function(data) {
        if (data.code != "100200") {
            mui.toast(data.msg);
        } else {
            console.log('error happend');
        }
    },

    ajaxBD: function(params, success, callback) {
        var _this = this;
        var option = {
            type: 'GET',
            dataType: 'jsonp'
        }

        var _params = fly.$.extend(option, {
            success: function(res, status, xhr) {
                console.log(res);
                var res = typeof res !== 'object' && JSON.parse(res) || res;
                success && typeof success === 'function' && success(res);
            },
            error: params.error && typeof params.error === 'function' && params.error || function() {
                console.log("ajax error");
            },
            complete: function() {
                callback && typeof callback === 'function' && callback();
            }
        }, (function() {
            return params && typeof params === 'object' && params || {
                url: params
            };
        }()));
        var _newAjax = this.isNative_ajax(_params);
        callback && typeof callback === 'function' && _newAjax.always(_params.complete);
    },

    /**
     * 仅供测试gps调用
     */
    ajaxMock: function(params, success, callback) {
        var _this = this;
        var option = {
            type: 'GET',
            dataType: 'json'
        }

        var _params = fly.$.extend(option, {
            success: function(res, status, xhr) {
                console.log(res);
                var res = typeof res !== 'object' && JSON.parse(res) || res;
                success && typeof success === 'function' && success(res);
            },
            error: params.error && typeof params.error === 'function' && params.error || function() {
                console.log("ajax error");
            },
            complete: function() {
                callback && typeof callback === 'function' && callback();
            }
        }, (function() {
            return params && typeof params === 'object' && params || {
                url: params
            };
        }()));
        var _newAjax = this.isNative_ajax(_params);
        callback && typeof callback === 'function' && _newAjax.always(_params.complete);
    },

    // 原生请求
    isNative_ajax: fly.$.ajax,
    // 混合框架请求
    isWebView_ajax: function(option) {
        var _obj = {
            method: option.url,
            params: option.data || {
                request: 'must'
            },
            success: option.success,
            timeout: 60 * 1000,
            fail: option.error,
            complete: option.complete
        }
        croods.ajax(_obj);
    },

    // 设置cookie
    setCookie: function(cname, cvalue) {
        document.cookie = cname + "=" + cvalue + "; ";
    },
    //获取cookie
    getCookie: function(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i].trim();
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
    }
}

window.networkUtils = new NetworkUtils();
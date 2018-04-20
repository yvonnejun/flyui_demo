/*
*author: junyang
*/

var ISMOCK = true, // 测试数据
    ISWEBVIEW = false, // webview
    ISPACKAGE = false; //是否调用cross中的原生方法，打包成apk时改为true

var API_VER = "0.1";
var IS_IOS = false;
//must in debug
var IS_DEBUG = true;
var DEFAULT_CODE = "341000000000";
var DEFAULT_TYPE = "3";
var CONTEXTPATHIMG = ISWEBVIEW ? '' : ISMOCK ? 'public/project-a/1.0.0/img' : "http://" + location.host + '/img'; //\public\project-a\1.0.0\img\
// var CONTEXTPATH = ISWEBVIEW ? '' : ISMOCK ? 'http://localhost:6000/mockjsdata/86' : "http://" + location.host + '/TourBigdataRESTful';
var CONTEXTPATH = ISWEBVIEW ? '' : ISMOCK ? 'public/project-a/1.0.0/mock' : "http://" + location.host + '/TourBigdataRESTful'; //CONTEXTPATH如果是本地json的mock数据的话就是配置的本地项目的mock目录

var CONFIGPATH = {
    /**
     * api接口地址
     * @type {Object}
     */

    API: {
        DATA_RESOURCES:{
            monitoringControlCity: ISWEBVIEW && '42ee8a3e56f744a3919af32b97231c96' || CONTEXTPATH + "/dataresources/monitoringControlCity.json",
            changeNum: ISWEBVIEW && '252660b2ae514c2382e494cb4f83dda7' || CONTEXTPATH + "/dataresources/changeNum.json",
            findAlarmInfo: ISWEBVIEW && '6450b0cbf7344d4fa42684e3d4808201' || CONTEXTPATH + "/dataresources/alarmInfo.json",
            findTopBannerData: ISWEBVIEW && '252660b2ae514c2382e494cb4f83dda7' || CONTEXTPATH + "/dataresources/topbanner.json",
            findRuntimeResourceData: ISWEBVIEW && '252660b2ae514c2382e494cb4f83dda7' || CONTEXTPATH + "/dataresources/runtimecontrol.json",

        },
        COMMON:{
            LogoutRequest: ISWEBVIEW && '63bb2605de69470bbd570aad5b24ed61' || CONTEXTPATH + '/logout.do',
            LoginRequest: ISWEBVIEW && '3584aa906c6b408c9192b8bcc7011f1d' || CONTEXTPATH + '/login.do',
            validateUserName: ISWEBVIEW && '8d11298eddce46f3ada1bfc37ddab502' || CONTEXTPATH + '/validateUserName.do',
        },
        ANALYSIS:{
            getDisposeList: ISWEBVIEW && 'dd0c8ac810224ebfac81ae0f9020c57d' || CONTEXTPATH + '/analysis/disposeList.json',
        },
    },
    GET_PATH: function(id, path, ip) {
        id = id || '';
        return ISWEBVIEW && id || (ip || CONTEXTPATH) + path;
    }
}

window.CONFIGPATH = CONFIGPATH;
window.ISWEBVIEW = ISWEBVIEW;
window.IS_DEBUG = IS_DEBUG;
window.IS_IOS = IS_IOS;
window.ISPACKAGE = ISPACKAGE;
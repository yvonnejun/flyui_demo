/*!
fly.js v1.2.6
Build 1002
Licensed under MIT
Author: huanzhang
Update: 2018-01-09 18:01:28 CST
*/
! function(e) {
  if ("object" == typeof exports && "undefined" != typeof module) module.exports = e();
  else if ("function" == typeof define && define.amd) define([], e);
  else {
    var f;
    "undefined" != typeof window ? f = window : "undefined" != typeof global ? f = global :
      "undefined" != typeof self && (f = self), f.fly = e()
  }
}(function() {
  var define, module, exports;
  return (function e(t, n, r) {
    function s(o, u) {
      if (!n[o]) {
        if (!t[o]) {
          var a = typeof require == "function" && require;
          if (!u && a) return a(o, !0);
          if (i) return i(o, !0);
          var f = new Error("Cannot find module '" + o + "'");
          throw f.code = "MODULE_NOT_FOUND", f
        }
        var l = n[o] = {
          exports: {}
        };
        t[o][0].call(l.exports, function(e) {
          var n = t[o][1][e];
          return s(n ? n : e)
        }, l, l.exports, e, t, n, r)
      }
      return n[o].exports
    }
    var i = typeof require == "function" && require;
    for (var o = 0; o < r.length; o++) s(r[o]);
    return s
  })({
    1: [
      function(_require, module, exports) {
        /**
         * @file Ajax操作
         * @author huanzhang
         */

        /**
         * Ajax 模块，方法的调用均在 fly.$ 的命名空间下。
         * @namespace fly/jquery
         */
        'use strict';

        var $ = _require('./fly.jquery');

        var jsonpID = 0,
          document = window.document,
          escape = encodeURIComponent,
          scriptTypeRE = /^(?:text|application)\/javascript/i,
          xmlTypeRE = /^(?:text|application)\/xml/i,
          jsonType = 'application/json',
          htmlType = 'text/html',
          blankRE = /^\s*$/,
          originAnchor = document.createElement('a'),
          slice = Array.prototype.slice,
          key,
          name;

        var Deferred;

        // Number of active Ajax requests
        $.active = 0;

        originAnchor.href = window.location.href;

        // Empty function, used as default callback
        function empty() {}

        /**
         * 请求成功调用函数
         * @private
         * @param {Object}         data     - ajax请求中的data对象。
         * @param {XMLHttpRequest} xhr      - XMLHttpRequest对象。
         * @param {Object}         settings - 配置参数。
         * @param {Deferred}       deferred - deferred对象。
         */
        function ajaxSuccess(data, xhr, settings, deferred) {
          var context = settings.context,
            status = 'success';

          if (settings.dataFilter) {
            data = settings.dataFilter.call(context, data);
          }

          settings.success.call(context, data, status, xhr);

          if (deferred) {
            deferred.resolveWith(context, [data, status, xhr]);
          }
        }

        /**
         * 请求失败调用函数
         * @private
         * @param {Error}          error    - 两种请求，如果请求成功，解析获得的数据，与dataType类型不一致而报错，其他的error都是null。
         * @param {String}         type     - 出错的类型，"timeout", "error", "abort", "parsererror"，四种情况的一种。
         * @param {XMLHttpRequest} xhr      - XMLHttpRequest对象。
         * @param {Object}         settings - 配置参数。
         * @param {Deferred}       deferred - deferred对象。
         */
        function ajaxError(error, type, xhr, settings, deferred) {
          var context = settings.context;
          settings.error.call(context, xhr, type, error);
          if (deferred) deferred.rejectWith(context, [xhr, type, error]);
        }

        /**
         * 请求完成调用函数
         * @private
         * @param {String}         status   - 请求完成的状态。"success", "notmodified", "error", "timeout", "abort", "parsererror"，六种请求中的一种，
         * @param {XMLHttpRequest} xhr      - XMLHttpRequest对象。
         * @param {Object}         settings - 配置参数。
         */
        function ajaxComplete(status, xhr, settings) {
          var context = settings.context;
          settings.complete.call(context, xhr, status);
        }

        /**
         * 根据MIME返回相应的数据类型，用作ajax参数里的dataType用，设置预期返回的数据类型，例如：html,json,scirpt,xml,text
         * @private
         * @param   {String} mime - 文件类型
         * @return  {String} 对应的文件类型
         */
        function mimeToDataType(mime) {
          if (mime) mime = mime.split(';', 2)[0]
          return mime && (mime == htmlType ? 'html' :
            mime == jsonType ? 'json' :
            scriptTypeRE.test(mime) ? 'script' :
            xmlTypeRE.test(mime) && 'xml') || 'text'
        }

        /**
         * 将查询字符串追加到URL后面
         * @private
         * @param  {String} url   - 请求地址。
         * @param  {String} query - 序列化后的字符串，适用于一个URL 地址查询字符串或Ajax请求
         * @return {String} 序列化字符串。
         */
        function appendQuery(url, query) {
          if (query == '') return url
          return (url + '&' + query).replace(/[&?]{1,2}/, '?')
        }

        /**
         * 序列化发送到服务器上的数据，如果是GET请求，则将序列化后的数据追加到请求地址后面
         * @private
         * @param  {Object}           options      - 请求的配置参数。
         * @param  {(Array | Object)} options.data - 发送到服务器上的数据
         * @param  {String}           options.type - 请求类型('GET'/'POST')
         * @return {String} 序列化字符串。
         */
        function serializeData(options) {
          if (options.processData && options.data && $.type(options.data) != "string")
            options.data = $.param(options.data, options.traditional)
          if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
            options.url = appendQuery(options.url, options.data), options.data = undefined
        }

        /**
         * 处理参数
         * @private
         * @param {String} url      - 请求地址。
         * @param {Object} data     - ajax请求中的data对象。
         * @param {String} dataType - 对应的文件类型。
         * @return 处理后的数据对象。
         */
        function parseArguments(url, data, success, dataType) {
          if ($.isFunction(data)) {
            dataType = success, success = data, data = undefined;
          }
          if (!$.isFunction(success)) {
            dataType = success, success = undefined
          }
          return {
            url: url,
            data: data,
            success: success,
            dataType: dataType
          }
        }

        /**
         * 循环递归序列化数据。
         * @private
         * @param {Array}           params      - 放置数据的临时数组。
         * @param {Object | Array}  obj         - 一个用来序列化的一个数组，一个普通的对象，或一个jQuery对象。
         * @param {Boolean}         traditional - 指示是否执行了传统的的序列化。如果设置为 true。嵌套对象不会被序列化，嵌套数组的值不会使用放括号在他们的key上。
         * @param {String}          scope       - 当前序列化的字段
         * @return {Array}
         */
        function serialize(params, obj, traditional, scope) {
          var type,
            array = $.isArray(obj),
            hash = $.isPlainObject(obj); // 测试对象是否是纯粹的对象

          $.each(obj, function(key, value) {
            type = $.type(value);
            if (scope) {
              key = traditional ? scope :
                scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') +
                ']'
            }
            // handle data in serializeArray() format
            if (!scope && array) {
              params.add(value.name, value.value);
            }
            // recurse into nested objects
            else if (type == "array" || (!traditional && type == "object")) {
              serialize(params, value, traditional, key);
            } else {
              params.add(key, value);
            }
          });
        }

        /**
         * 通过 script 标签来发起 URL 请求，实现跨域。可以在fly.$.ajax中设置 jsonp 请求。
         * @memberOf fly/jquery
         * @alias ajaxJSONP
         * @param {Object}      options               - 请求配置参数。
         * @param {Boolean}     options.async         - 默认值: true。默认设置下，所有请求均为异步请求。如果需要发送同步请求，请将此选项设置为 false。
         *                                              注意，同步请求将锁住浏览器，用户其它操作必须等待请求完成才可以执行。
         * @param {Function}    options.beforeSend    - beforeSend(XHR)，Ajax事件，发送请求前可修改 XMLHttpRequest对象的函数，
         *                                              如添加自定义HTTP头。XMLHttpRequest对象是唯一的参数。如果返回false 可以取消本次ajax请求。
         * @param {Boolean}     options.cache         - 默认值: true，dataType为script和jsonp 时默认为false。设置为 false 将不缓存此页面。
         * @param {Function}    options.complete      - complete(XHR, TS)，Ajax事件，请求完成后回调函数 (请求成功或失败之后均调用)。参数：XMLHttpRequest对象和一个描述请求类型的字符串。
         * @param {String}      options.contentType   - 默认值: "application/x-www-form-urlencoded"。发送信息至服务器时内容编码类型。默认值适合大多数情况。
         *                                              如果明确地传递了一个 content-type 给 $.ajax()那么它必定会发送给服务器（即使没有数据要发送）。
         * @param {Object}      options.context       - 设置Ajax相关回调函数的上下文。让回调函数内this指向这个对象（如果不设定这个参数，
         *                                              那么this就指向调用本次AJAX请求时传递的options参数）。
         *                                              比如指定一个DOM元素作为context参数，这样就设置了success回调函数的上下文为这个DOM元素。
         * @param {String}      options.data          - 发送到服务器的数据。将自动转换为请求字符串格式。GET请求中将附加在URL后。查看processData选项说明以禁止此自动转换。
         *                                              必须为Key/Value格式。如果为数组，将自动为不同值对应同一个名称。
         *                                              如 {foo:["bar1", "bar2"]} 转换为 '&foo=bar1&foo=bar2'。
         * @param {Function}    options.dataFilter    - 给Ajax返回的原始数据的进行预处理的函数。提供data和type两个参数：
         *                                                  1.data是Ajax返回的原始数据，
         *                                                  2.type是调用jQuery.ajax时提供的dataType参数。
         *                                              函数返回的值将由jQuery进一步处理。
         * @param {String}      options.dataType      - 预期服务器返回的数据类型。如果不指定，将自动根据HTTP包MIME信息来智能判断，比如XML MIME类型就被识别为XML。可用值:
         *                                                  1."xml": 返回XML文档。
         *                                                  2."html": 返回纯文本HTML信息；包含的script标签会在插入dom时执行。
         *                                                  3."script": 返回纯文本JavaScript代码。不会自动缓存结果。除非设置了"cache"参数。
         *                                                    注意：在远程请求时(不在同一个域下)，所有POST请求都将转为GET请求。（因为将使用DOM的script标签来加载）
         *                                                  4."json": 返回JSON数据 。
         *                                                  5."jsonp": JSONP格式。使用JSONP形式调用函数时，如"myurl?callback=?"将自动替换"?"为正确的函数名，以执行回调函数。
         *                                                  6."text": 返回纯文本字符串。
         * @param {Function}    options.error         - 接收参数(xhr, errorType, error)，请求出错时调用。如果发生了错误，错误信息（第2个参数）除了得到null之外，
         *                                              还可能是"timeout","error", "notmodified"和"parsererror"。
         * @param {Boolean}     options.global        - 是否触发全局AJAX事件。默认值: true。设置为false将不会触发全局AJAX事件，如ajaxStart或ajaxStop可用于控制不同的Ajax事件。
         * @param {Boolean}     options.ifModified    - 仅在服务器数据改变时获取新数据。默认值: false。使用HTTP包Last-Modified头信息判断。
         * @param {String}      options.jsonp         - 在一个jsonp请求中重写回调函数的名字。这个值用来替代在 "callback=?" 这种GET或POST请求中URL参数里的 "callback" 部分，
         *                                              比如 {jsonp:'onJsonPLoad'} 会导致将 "onJsonPLoad=?" 传给服务器。
         * @param {String}      options.jsonpCallback - 全局JSONP回调函数的 字符串（或返回的一个函数）名。
         * @param {String}      options.password      - 用于响应 HTTP 访问认证请求的密码。
         * @param {Boolean}     options.processData   - 默认值: true。默认情况下，通过data选项传递进来的数据，如果是一个对象，都会处理转化成一个查询字符串，
         *                                              以配合默认内容类型 "application/x-www-form-urlencoded"。如果要发送DOM树信息或其它不希望转换的信息，请设置为false。
         * @param {String}      options.scriptCharset - 只有当请求时 dataType 为 "jsonp" 或 "script"，并且 type 是 "GET" 才会用于强制修改 charset。通常只在本地和远程的内容编码不同时使用。
         * @param {Function}    options.success       - success(data, status, xhr)，Ajax事件，请求成功之后调用。传入返回后的数据，以及包含成功代码的字符串。
         * @param {Boolean}     options.traditional   - 默认值：false。是否激活传统的方式序列化。
         * @param {Number}      options.timeout       - 默认值：0。以毫秒为单位的请求超时时间, 0 表示不超时。
         * @param {String}      options.type          - 默认值: "GET")。请求方式 ("POST" 或 "GET")， 默认为 "GET"。注意：其它 HTTP 请求方法，如 PUT 和 DELETE 也可以使用，但仅部分浏览器支持。
         * @param {String}      options.url           - 发送请求的地址。
         * @param {String}      options.username      - 用于响应 HTTP 访问认证请求的用户名。
         * @param {String}      options.mimeType      - 覆盖响应的MIME类型。
         * @param {Object}      options.headers       - Ajax请求中额外的HTTP信息头对象。
         * @param {Object}      options.xhrFields     - 一个对象包含的属性被逐字复制到XMLHttpRequest的实例。
         * @param {Deferred}    deferred              - Deferred对象。
         */
        $.ajaxJSONP = function(options, deferred) {
          if (!('type' in options)) return ajax(options)

          var _callbackName = options.jsonpCallback,
            callbackName = ($.isFunction(_callbackName) ?
              _callbackName() : _callbackName) || ('jsonp' + (++jsonpID)),
            script = document.createElement('script'),
            originalCallback = window[callbackName],
            responseData,
            abort = function(errorType) {
              // dispatchEvent 还未全部想好
              // script.dispatchEvent(new CustomEvent('error', errorType || 'abort'));
            },
            xhr = {
              abort: abort
            },
            loadHandler = function(e, errorType) {
              clearTimeout(abortTimeout);
              script.parentNode.removeChild(script);

              if (e.type == 'error' || !responseData) {
                ajaxError(null, errorType || 'error', xhr, options, deferred);
              } else {
                ajaxSuccess(responseData[0], xhr, options, deferred);
              }

              window[callbackName] = originalCallback;
              if (responseData && $.isFunction(originalCallback))
                originalCallback(responseData[0]);

              originalCallback = responseData = undefined;
            },
            abortTimeout;

          if (deferred) deferred.promise(xhr);

          script.addEventListener('load', loadHandler);
          script.addEventListener('error', loadHandler);

          /*if (ajaxBeforeSend(xhr, options) === false) {
        abort('abort');
        return xhr;
    }*/

          window[callbackName] = function() {
            responseData = arguments;
          }

          script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName);
          document.head.appendChild(script);

          if (options.timeout > 0) abortTimeout = setTimeout(function() {
            abort('timeout');
          }, options.timeout);

          return xhr;
        }

        /**
         * 一个包含ajax全局设置的对象。
         * @memberOf fly/jquery
         * @type {Object}
         */
        $.ajaxSettings = {
          type: 'GET',
          beforeSend: empty,
          success: empty,
          error: empty,
          complete: empty,
          context: null,
          global: true,
          // Transport
          xhr: function() {
            return new window.XMLHttpRequest()
          },
          // MIME types mapping
          // IIS returns Javascript as "application/x-javascript"
          accepts: {
            script: 'text/javascript, application/javascript, application/x-javascript',
            json: jsonType,
            xml: 'application/xml, text/xml',
            html: htmlType,
            text: 'text/plain'
          },
          // Whether the request is to another domain
          crossDomain: false,
          // Default timeout
          timeout: 0,
          // Whether data should be serialized to string
          processData: true,
          // Whether the browser should be allowed to cache GET responses
          cache: true
        };

        /**
         * 执行一个异步的HTTP（Ajax）的请求。
         * @memberOf fly/jquery
         * @alias ajax
         * @param {Object}      options               - 请求配置参数。
         * @param {Boolean}     options.async         - 默认值: true。默认设置下，所有请求均为异步请求。如果需要发送同步请求，请将此选项设置为 false。
         *                                              注意，同步请求将锁住浏览器，用户其它操作必须等待请求完成才可以执行。
         * @param {Function}    options.beforeSend    - beforeSend(XHR)，Ajax事件，发送请求前可修改 XMLHttpRequest对象的函数，
         *                                              如添加自定义HTTP头。XMLHttpRequest对象是唯一的参数。如果返回false 可以取消本次ajax请求。
         * @param {Boolean}     options.cache         - 默认值: true，dataType为script和jsonp 时默认为false。设置为 false 将不缓存此页面。
         * @param {Function}    options.complete      - complete(XHR, TS)，Ajax事件，请求完成后回调函数 (请求成功或失败之后均调用)。参数：XMLHttpRequest对象和一个描述请求类型的字符串。
         * @param {String}      options.contentType   - 默认值: "application/x-www-form-urlencoded"。发送信息至服务器时内容编码类型。默认值适合大多数情况。
         *                                              如果明确地传递了一个 content-type 给 $.ajax()那么它必定会发送给服务器（即使没有数据要发送）。
         * @param {Object}      options.context       - 设置Ajax相关回调函数的上下文。让回调函数内this指向这个对象（如果不设定这个参数，
         *                                              那么this就指向调用本次AJAX请求时传递的options参数）。
         *                                              比如指定一个DOM元素作为context参数，这样就设置了success回调函数的上下文为这个DOM元素。
         * @param {String}      options.data          - 发送到服务器的数据。将自动转换为请求字符串格式。GET请求中将附加在URL后。查看processData选项说明以禁止此自动转换。
         *                                              必须为Key/Value格式。如果为数组，将自动为不同值对应同一个名称。
         *                                              如 {foo:["bar1", "bar2"]} 转换为 '&foo=bar1&foo=bar2'。
         * @param {Function}    options.dataFilter    - 给Ajax返回的原始数据的进行预处理的函数。提供data和type两个参数：
         *                                                  1.data是Ajax返回的原始数据，
         *                                                  2.type是调用jQuery.ajax时提供的dataType参数。
         *                                              函数返回的值将由jQuery进一步处理。
         * @param {String}      options.dataType      - 预期服务器返回的数据类型。如果不指定，将自动根据HTTP包MIME信息来智能判断，比如XML MIME类型就被识别为XML。可用值:
         *                                                  1."xml": 返回XML文档。
         *                                                  2."html": 返回纯文本HTML信息；包含的script标签会在插入dom时执行。
         *                                                  3."script": 返回纯文本JavaScript代码。不会自动缓存结果。除非设置了"cache"参数。
         *                                                    注意：在远程请求时(不在同一个域下)，所有POST请求都将转为GET请求。（因为将使用DOM的script标签来加载）
         *                                                  4."json": 返回JSON数据 。
         *                                                  5."jsonp": JSONP格式。使用JSONP形式调用函数时，如"myurl?callback=?"将自动替换"?"为正确的函数名，以执行回调函数。
         *                                                  6."text": 返回纯文本字符串。
         * @param  {Function}    options.error         - 接收参数(xhr, errorType, error)，请求出错时调用。如果发生了错误，错误信息（第2个参数）除了得到null之外，
         *                                              还可能是"timeout","error", "notmodified"和"parsererror"。
         * @param  {Boolean}     options.global        - 是否触发全局AJAX事件。默认值: true。设置为false将不会触发全局AJAX事件，如ajaxStart或ajaxStop可用于控制不同的Ajax事件。
         * @param  {Boolean}     options.ifModified    - 仅在服务器数据改变时获取新数据。默认值: false。使用HTTP包Last-Modified头信息判断。
         * @param  {String}      options.jsonp         - 在一个jsonp请求中重写回调函数的名字。这个值用来替代在 "callback=?" 这种GET或POST请求中URL参数里的 "callback" 部分，
         *                                              比如 {jsonp:'onJsonPLoad'} 会导致将 "onJsonPLoad=?" 传给服务器。
         * @param  {String}      options.jsonpCallback - 全局JSONP回调函数的 字符串（或返回的一个函数）名。
         * @param  {String}      options.password      - 用于响应 HTTP 访问认证请求的密码。
         * @param  {Boolean}     options.processData   - 默认值: true。默认情况下，通过data选项传递进来的数据，如果是一个对象，都会处理转化成一个查询字符串，
         *                                              以配合默认内容类型 "application/x-www-form-urlencoded"。如果要发送DOM树信息或其它不希望转换的信息，请设置为false。
         * @param  {String}      options.scriptCharset - 只有当请求时 dataType 为 "jsonp" 或 "script"，并且 type 是 "GET" 才会用于强制修改 charset。通常只在本地和远程的内容编码不同时使用。
         * @param  {Function}    options.success       - success(data, status, xhr)，Ajax事件，请求成功之后调用。传入返回后的数据，以及包含成功代码的字符串。
         * @param  {Boolean}     options.traditional   - 默认值：false。是否激活传统的方式序列化。
         * @param  {Number}      options.timeout       - 默认值：0。以毫秒为单位的请求超时时间, 0 表示不超时。
         * @param  {String}      options.type          - 默认值: "GET")。请求方式 ("POST" 或 "GET")， 默认为 "GET"。注意：其它 HTTP 请求方法，如 PUT 和 DELETE 也可以使用，但仅部分浏览器支持。
         * @param  {String}      options.url           - 发送请求的地址。
         * @param  {String}      options.username      - 用于响应 HTTP 访问认证请求的用户名。
         * @param  {String}      options.mimeType      - 覆盖响应的MIME类型。
         * @param  {Object}      options.headers       - Ajax请求中额外的HTTP信息头对象。
         * @param  {Object}      options.xhrFields     - 一个对象包含的属性被逐字复制到XMLHttpRequest的实例。
         * @return {XMLHttpRequest}
         */
        $.ajax = function(options) {
          var settings = $.extend({}, options || {}),
            deferred = $.Deferred && $.Deferred(),
            urlAnchor, hashIndex
          for (key in $.ajaxSettings)
            if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

            //ajaxStart(settings)

          if (!settings.crossDomain) {
            urlAnchor = document.createElement('a')
            urlAnchor.href = settings.url
            // cleans up URL for .href (IE only), see https://github.com/madrobby/zepto/pull/1049
            urlAnchor.href = urlAnchor.href
            settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (
              urlAnchor.protocol + '//' + urlAnchor.host)
          }

          if (!settings.url) settings.url = window.location.toString()
          if ((hashIndex = settings.url.indexOf('#')) > -1) settings.url = settings.url.slice(
            0,
            hashIndex)
          serializeData(settings)

          var dataType = settings.dataType,
            hasPlaceholder = /\?.+=\?/.test(settings.url)
          if (hasPlaceholder) dataType = 'jsonp'

          if (settings.cache === false || (
            (!options || options.cache !== true) &&
            ('script' == dataType || 'jsonp' == dataType)
          ))
            settings.url = appendQuery(settings.url, '_=' + Date.now())

          if ('jsonp' == dataType) {
            if (!hasPlaceholder)
              settings.url = appendQuery(settings.url,
                settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' :
                'callback=?')
            return $.ajaxJSONP(settings, deferred)
          }

          var mime = settings.accepts[dataType],
            headers = {},
            setHeader = function(name, value) {
              headers[name.toLowerCase()] = [name, value]
            },
            protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
            xhr = settings.xhr(),
            nativeSetHeader = xhr.setRequestHeader,
            abortTimeout

          if (deferred) deferred.promise(xhr)

          if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
          setHeader('Accept', mime || '*/*')
          if (mime = settings.mimeType || mime) {
            if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
            xhr.overrideMimeType && xhr.overrideMimeType(mime)
          }
          if (settings.contentType || (settings.contentType !== false && settings.data &&
            settings.type
            .toUpperCase() != 'GET'))
            setHeader('Content-Type', settings.contentType ||
              'application/x-www-form-urlencoded')

          if (settings.headers)
            for (name in settings.headers) setHeader(name, settings.headers[name])
          xhr.setRequestHeader = setHeader

          xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
              xhr.onreadystatechange = empty
              clearTimeout(abortTimeout)
              var result, error = false
              if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status ==
                0 && protocol == 'file:')) {
                dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader(
                  'content-type'))

                if (xhr.responseType == 'arraybuffer' || xhr.responseType == 'blob')
                  result = xhr.response
                else {
                  result = xhr.responseText

                  try {
                    // http://perfectionkills.com/global-eval-what-are-the-options/
                    if (dataType == 'script')(1, eval)(result)
                    else if (dataType == 'xml') result = xhr.responseXML
                    else if (dataType == 'json') result = blankRE.test(result) ? null :
                      ((typeof(JSON) == 'object' && JSON.parse) ? JSON.parse(result) : eval(
                        '(' + result + ')'));
                  } catch (e) {
                    error = e
                  }

                  if (error) return ajaxError(error, 'parsererror', xhr, settings,
                    deferred)
                }

                ajaxSuccess(result, xhr, settings, deferred)
              } else {
                ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr,
                  settings, deferred)
              }
            }
          }

          /*if (ajaxBeforeSend(xhr, settings) === false) {
        xhr.abort()
        ajaxError(null, 'abort', xhr, settings, deferred)
        return xhr
    }*/

          if (settings.xhrFields)
            for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]

          var async = 'async' in settings ? settings.async : true
          xhr.open(settings.type, settings.url, async, settings.username, settings.password)

          for (name in headers) nativeSetHeader.apply(xhr, headers[name])

          if (settings.timeout > 0) abortTimeout = setTimeout(function() {
            xhr.onreadystatechange = empty
            xhr.abort()
            ajaxError(null, 'timeout', xhr, settings, deferred)
          }, settings.timeout)

          // avoid sending empty string (#319)
          xhr.send(settings.data ? settings.data : null)
          return xhr
        }

        /**
         * 创建一个数组，一个普通的对象，或一个jQuery对象的序列化表示形式，多用于URL查询字符串或Ajax请求。如果传递一个jQuery对象传递，它应该包含输入元素的名称/值属性。
         * @memberOf fly/jquery
         * @alias param
         * @param  {(Object | Array)} obj         - 一个用来序列化的一个数组，一个普通的对象，或一个jQuery对象。
         * @param  {Boolean}          traditional - 指示是否执行了传统的的序列化。如果设置为 true。嵌套对象不会被序列化，嵌套数组的值不会使用放括号在他们的key上。
         * @return {String}           序列化字符串。
         * @example
         * // "num[]=1&num[]=2&num[]=3"
         * decodeURIComponent(fly.$.param({ num:[1,2,3] }));
         * @example
         * // "num=1&num=2&num=3"
         * decodeURIComponent(fly.$.param({ num:[1,2,3] },true));
         */
        $.param = function(obj, traditional) {
          var params = []
          params.add = function(key, value) {
            if ($.isFunction(value)) value = value()
            if (value == null) value = ""
            this.push(escape(key) + '=' + escape(value))
          }
          serialize(params, obj, traditional)
          return params.join('&').replace(/%20/g, '+')
        }

        /**
         * 执行零个或多个对象的回调函数， 通常参数为 Deferred(延迟)对象表示异步事件处理。
         * 当传入一个JavaScript对象，它会被当作是一个被解决（resolved）的延迟对象，并且绑定到它上面的任何 doneCallbacks 都会被立刻执行；
         * 当传入多个延迟对象时，只有当异步队列都成功，才执行成功方法（done），只要有一个失败了，就会执行失败方法（fail）。
         * @memberOf fly/jquery
         * @alias when
         * @param  {Object} sub - 零个或多个 Deferred 延迟对象，或者普通的JavaScript对象。
         * @return {Object} 当不传递任何参数时，返回一个 resolved（已完成）状态的promise对象；
         */
        $.when = function(sub) {
          var resolveValues = slice.call(arguments),
            len = resolveValues.length,
            i = 0,
            remain = len !== 1 || (sub && $.isFunction(sub.promise)) ? len : 0,
            deferred = remain === 1 ? sub : Deferred(),
            progressValues, progressContexts, resolveContexts,
            updateFn = function(i, ctx, val) {
              return function(value) {
                ctx[i] = this
                val[i] = arguments.length > 1 ? slice.call(arguments) : value
                if (val === progressValues) {
                  deferred.notifyWith(ctx, val)
                } else if (!(--remain)) {
                  deferred.resolveWith(ctx, val)
                }
              }
            }

          if (len > 1) {
            progressValues = new Array(len)
            progressContexts = new Array(len)
            resolveContexts = new Array(len)
            for (; i < len; ++i) {
              if (resolveValues[i] && $.isFunction(resolveValues[i].promise)) {
                resolveValues[i].promise()
                  .done(updateFn(i, resolveContexts, resolveValues))
                  .fail(deferred.reject)
                  .progress(updateFn(i, progressContexts, progressValues))
              } else {
                --remain
              }
            }
          }
          if (!remain) deferred.resolveWith(resolveContexts, resolveValues)
          return deferred.promise()
        }

        /**
         * 调用$.Callbacks返回对象包含函数列表
         * @name fly/jquery~CallbacksReturns
         * @property {Object} callback - $.Callbacks 方法返回参数
         * @property {Function} callback.add - add(Function | Array)，添加一个或一组函数到回调列表里，返回回调函数列表。
         * @property {Function} callback.remove - remove(Function)，删除回调列表中的一个函数，返回回调函数列表。
         * @property {Function} callback.has - has(Function)，判断指定的回调函数是否在回调列表中，返回Boolean。
         * @property {Function} callback.empty - empty()，清空回调函数列表，返回回调函数列表。
         * @property {Function} callback.disable - disable(Function)，禁用回调列表中的一个函数，返回回调函数列表。
         * @property {Function} callback.disabled - disabled(Function)，删除回调列表中的一个函数，返回Boolean。
         * @property {Function} callback.locked - locked(Function)，判断回调列表是否已经被锁定，返回Boolean。
         * @property {Function} callback.fireWith - fireWith(context, args)，执行回调列表中的函数，并且指定上下文，返回回调函数列表。
         * @property {Function} callback.fire - fire(Function)，执行回调列表中的函数。
         * @property {Function} callback.fired - fired(Function)，判断回调列表中的函数是否已执行，返回Boolean。
         */


        /**
         * 回调函数管理，为$.deferred和$.ajax提供了基本功能支持。
         * @memberOf fly/jquery
         * @alias Callbacks
         * @function
         * @param  {Object}  options             - 配置参数，用来改变回调列表中的行为。
         * @param  {Boolean} options.once        - 默认为 false， 当设置为 true 表示回调列表函数只执行一次。
         * @param  {Boolean} options.memory      - 默认为 false， 当设置为 true 表示开启自动执行模式：记录上一次触发回调函数列表时的参数，之后添加的函数会用该参数立即执行。
         *                                        然后自动执行现有的回调函数集合里的所有回调函数。
         * @param  {Boolean} options.unique      - 默认为 false， 当设置为 true 表示一个回调函数只能被添加一次。
         * @param  {Boolean} options.stopOnFalse - 默认为 false， 当设置为 true 表示当某个回调函数返回false时中断执行。
         * @return {fly/jquery~CallbacksReturns} 回调函数管理对象。
         * @example
         * var test = fly.$.Callbacks({once:true,memory:true,unique:true,stopOnFalse:true});
         */
        $.Callbacks = function(options) {
          options = $.extend({}, options)

          var memory, // Last fire value (for non-forgettable lists)
            fired, // Flag to know if list was already fired
            firing, // Flag to know if list is currently firing
            firingStart, // First callback to fire (used internally by add and fireWith)
            firingLength, // End of the loop when firing
            firingIndex, // Index of currently firing callback (modified by remove if needed)
            list = [], // Actual callback list
            stack = !options.once && [], // Stack of fire calls for repeatable lists

            /**
             * 传入指定的参数执行列表中的所有回调。
             * @private
             * @param {*} data - 传入参数。
             * @return 返回绑定它的那个回调对象。
             */
            fire = function(data) {
              memory = options.memory && data
              fired = true
              firingIndex = firingStart || 0
              firingStart = 0
              firingLength = list.length
              firing = true
              for (; list && firingIndex < firingLength; ++firingIndex) {
                if (list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
                  memory = false
                  break
                }
              }
              firing = false
              if (list) {
                if (stack) stack.length && fire(stack.shift())
                else if (memory) list.length = 0
                else Callbacks.disable()
              }
            },

            Callbacks = {
              /**
               * 添加一个或一组函数到回调列表里。
               * @private
               * @param {Function | Array} fn - 需要添加的回调函数或函数组。
               * @return 添加函数后的回调列表。
               */
              add: function() {
                if (list) {
                  var start = list.length,
                    add = function(args) {
                      $.each(args, function(_, arg) {
                        if (typeof arg === "function") {
                          if (!options.unique || !Callbacks.has(arg)) list
                            .push(arg)
                        } else if (arg && arg.length && typeof arg !==
                          'string') add(arg)
                      })
                    }
                  add(arguments)
                  if (firing) firingLength = list.length
                  else if (memory) {
                    firingStart = start
                    fire(memory)
                  }
                }
                return this
              },

              /**
               * 删除回调列表中的一个函数。
               * @private
               * @param {Function} fn - 需要删除的函数。
               * @return 删除函数后的回调列表。
               */
              remove: function() {
                if (list) {
                  $.each(arguments, function(_, arg) {
                    var index
                    while ((index = $.inArray(arg, list, index)) > -1) {
                      list.splice(index, 1)
                      // Handle firing indexes
                      if (firing) {
                        if (index <= firingLength)--firingLength
                        if (index <= firingIndex)--firingIndex
                      }
                    }
                  })
                }
                return this
              },

              /**
               * 判断指定的回调函数是否在回调列表中。
               * @private
               * @param {Function} fn - 需要判断的回调函数名。
               * @return {boolean} 返回 true 表示在，返回 false 表示不在。
               */
              has: function(fn) {
                return !!(list && (fn ? $.inArray(fn, list) > -1 : list.length))
              },

              /**
               * 清空回调函数列表。
               * @private
               * @return 返回回调对象。
               */
              empty: function() {
                firingLength = list.length = 0
                return this
              },

              /**
               * 禁用回调函数。
               * @private
               * @return 返回回调对象。
               */
              disable: function() {
                list = stack = memory = undefined
                return this
              },

              /**
               * 判断回调列表是否已经被禁用。
               * @private
               * @return {boolean} 返回 true 表示已禁用，返回 false 表示未禁用。
               */
              disabled: function() {
                return !list
              },

              /**
               * 锁定回调函数。
               * @private
               * @return 返回回调对象。
               */
              lock: function() {
                stack = undefined;
                if (!memory) Callbacks.disable()
                return this
              },

              /**
               * 判断回调列表是否已经被锁定。
               * @private
               * @return {boolean} 返回 true 表示已锁定，返回 false 表示未锁定。
               */
              locked: function() {
                return !stack
              },

              /**
               * 执行回调列表中的函数，并且指定上下文。
               * @private
               * @param  {Object} context - 指定上下文环境。
               * @param  {Array}  args    - 回调函数列表。
               * @return {boolean} 返回 true 表示已锁定，返回 false 表示未锁定。
               */
              fireWith: function(context, args) {
                if (list && (!fired || stack)) {
                  args = args || []
                  args = [context, args.slice ? args.slice() : args]
                  if (firing) stack.push(args)
                  else fire(args)
                }
                return this
              },

              /**
               * 执行回调列表中的函数。
               * @private
               * @alias Callbacks().fire
               */
              fire: function() {
                return Callbacks.fireWith(this, arguments)
              },

              /**
               * 判断回调列表中的函数是否已执行。
               * @private
               * @return {boolean} 返回 true 表示已执行，返回 false 表示未执行。
               */
              fired: function() {
                return !!fired
              }
            }

          return Callbacks
        }

        /**
         * 调用$.Deferred返回对象包含函数列表
         * @name fly/jquery~DeferredRetruns
         * @property {Obejct}   deferred          - $.Deferred 方法返回对象
         * @property {Function} deferred.done     - done(Function)，当 Deferred 对象状态为 resolved，调用添加处理程序且回调是依照添加的顺序执行。
         * @property {Function} deferred.progress - progress(Function)，当 Deferred 对象状态为 pending，调用添加处理程序且回调是依照添加的顺序执行。
         * @property {Function} deferred.fail     - fail(Function)，当 Deferred 对象状态为 rejected，调用添加处理程序且回调是依照添加的顺序执行。
         * @property {Function} deferred.state    - state()，返回当前 Deferred 对象的状态为Deferred 对象有三种执行状态：未完成（pending），已完成（resolved）和已失败（rejected）。
         * @property {Function} deferred.always   - always(Function)，当 Deferred 对象状态为resolved或rejected时，调用指定的函数。
         * @property {Function} deferred.then     - then(Function)，当Deferred对象状态为resolved，rejected或pending时，调用对应的添加的函数。
         * @property {Function} deferred.promise  - promise(Obejct)，返回 Promise 对象。Promise 是 Deferred 的一个不可改变状态的副本，Promise 对象只开放与改变执行状态无关的方法（比如done()方法和fail()方法）。
         */

        /**
         * 用于返回一个处理回调函数的 Deferred （延迟）对象。一种提供回调函数的解决方案的对象，支持链式调用方法。
         * @memberOf fly/jquery
         * @alias Deferred
         * @function
         * @param   {Function} [func] - Deferred 对象返回之前调用的函数。
         * @return  {fly/jquery~DeferredRetruns} 返回一个 Deferred（延迟） 对象。
         * @example
         * var deferredObj = fly.$.Deferred();
         */
        $.Deferred = Deferred = function(func) {

          // 元组：描述状态、状态切换方法名、对应状态执行方法名、回调列表的关系
          // tuple引自C++/python，和list的区别是，它不可改变 ，用来存储常量集
          var tuples = [
              ["resolve", "done", $.Callbacks({
                once: 1,
                memory: 1
              }), "resolved"],
              ["reject", "fail", $.Callbacks({
                once: 1,
                memory: 1
              }), "rejected"],

              ["notify", "progress", $.Callbacks({
                memory: 1
              })]
            ],

            // Promise初始状态
            state = "pending",

            promise = {
              /**
               * 返回当前 Deferred 对象的状态。Deferred 对象有三种执行状态：未完成（pending），已完成（resolved）和已失败（rejected）。
               * @private
               * @return {string} 当前对象的状态。
               */
              state: function() {
                return state;
              },

              /**
               * 当 Deferred 对象解决或拒绝时，都会调用添加的函数。
               * @private
               * @param {Function} func - 一个函数或者函数数组。
               * @return 返回当前 Deferred 对象。
               */
              always: function() {
                deferred.done(arguments).fail(arguments);
                return this;
              },

              /**
               * 当Deferred 对象解决，拒绝或仍在进行中时，调用对应的添加的函数。
               * @private
               * @param {Function} fnDone       - 当Deferred（延迟）对象得到解决（resolved）时被调用的一个函数或函数数组。
               * @param {Function} [fnFailed]   - 当Deferred（延迟）对象拒绝（rejected）时被调用的一个函数或函数数组。
               * @param {Function} [fnProgress] - 当Deferred（延迟）对象生成进度通知（progress）时被调用的一个函数或函数数组。
               * @return 返回当前 Deferred 对象的 Promise 对象。
               */
              then: function( /* fnDone [, fnFailed [, fnProgress]] */ ) {
                var fns = arguments;
                return Deferred(function(defer) {
                  $.each(tuples, function(i, tuple) {
                    var fn = $.isFunction(fns[i]) && fns[i];
                    deferred[tuple[1]](function() {
                      var returned = fn && fn.apply(this,
                        arguments);
                      if (returned && $.isFunction(returned.promise)) {
                        returned.promise()
                          .done(defer.resolve)
                          .fail(defer.reject)
                          .progress(defer.notify);
                      } else {
                        var context = this === promise ? defer.promise() : this,
                          values = fn ? [returned] : arguments;
                        defer[tuple[0] + "With"](context, values)
                      }
                    })
                  });
                  fns = null;
                }).promise();
              },

              /**
               * 返回 Promise 对象。Promise 是 Deferred 的一个不可改变状态的副本，Promise 对象只开放与改变执行状态无关的方法（比如done()方法和fail()方法），
               * 屏蔽了 Deferred 包含的与改变执行状态有关的方法（比如resolve()方法和reject()方法），从而使得执行状态不能被改变。
               * @private
               * @param {Object} obj - 绑定 promise 方法的对象。
               * @return 返回当前 Deferred 对象的 Promise 对象。
               */
              promise: function(obj) {
                return obj != null ? $.extend(obj, promise) : promise;
              }
            },

            deferred = {};

          /**
           * 当 Deferred 对象解决时（状态为 resolved），调用添加处理程序且回调是依照添加的顺序执行。
           * @private
           * @function done
           * @param {Function} func   - doneCallbacks  一个函数，或者函数数组，当Deferred（延迟）对象得到解决时被调用。
           * @param {Function} [func] - doneCallbacks  一个函数，或者函数数组，当Deferred（延迟）对象得到解决时被调用。
           * @return {Object} 返回当前 Deferred 对象。
           */

          /**
           * 当 Deferred 对象对象生成正在执行中的进度通知时（状态为 pending），调用添加处理程序且回调是依照添加的顺序执行。
           * @private
           * @function progress
           * @param {Function} func   - progressCallbacks  一个函数，或者函数数组，当 Deferred 对象生成正在执行中的进度通知时被调用。
           * @param {Function} [func] - progressCallbacks  一个函数，或者函数数组，当 Deferred 对象生成正在执行中的进度通知时被调用。
           * @return {Object} 返回当前 Deferred 对象。
           */

          /**
           * 当 Deferred 对象拒绝时（状态为 rejected），调用添加处理程序且回调是依照添加的顺序执行。
           * @private
           * @function fail
           * @param {Function} func   - failCallbacks  一个函数，或者函数数组，当 Deferred 对象得到拒绝时被调用。
           * @param {Function} [func] - failCallbacks  一个函数，或者函数数组，当 Deferred 对象得到拒绝时被调用。
           * @return {Object} 返回当前 Deferred 对象。
           */

          /**
           * 将 Deferred 对象的状态改成已失败（rejected），并根据给定的参数调用任何完成回调函数。
           * @private
           * @function reject
           * @param {Object} [args] - 传递给完成回调函数的可选的参数。
           * @example
           * // error
           * var test = fly.$.Deferred().fail(function(v){console.log(v)}).reject('error');
           * @return 返回改变了状态的 Deferred 对象。
           */
          /**
           * 将 Deferred 对象的状态改成已完成（resolved），并根据给定的参数调用任何完成回调函数。
           * @private
           * @function resolve
           * @param {Object} [args] - 传递给完成回调函数的可选的参数。
           * @example
           * // success
           * var test = fly.$.Deferred().done(function(v){console.log(v)}).resolve('success');
           * @return 返回改变了状态的 Deferred 对象。
           */
          $.each(tuples, function(i, tuple) {
            var list = tuple[2],
              stateString = tuple[3];

            promise[tuple[1]] = list.add;

            if (stateString) {
              list.add(function() {
                state = stateString;
              }, tuples[i ^ 1][2].disable, tuples[2][2].lock);
            }
            deferred[tuple[0]] = function() {
              deferred[tuple[0] + "With"](this === deferred ? promise : this, arguments);
              return this;
            }
            deferred[tuple[0] + "With"] = list.fireWith;
          })

          promise.promise(deferred);
          if (func) func.call(deferred, deferred);
          return deferred;
        };

        module.exports = $.ajax;
      }, {
        "./fly.jquery": 7
      }
    ],
    2: [
      function(_require, module, exports) {
        /**
         * @file 绑定器，参考Knockout/kendo/VUE。
         * @author huanzhang
         */

        'use strict';

        /**
         * @namespace fly
         */

        // 依赖
        var fly = _require('./fly.core'),
          utils = _require('./fly.utils'),
          DataSource = _require('./fly.data'),
          tmpl = _require('./fly.template'),
          format = _require('./fly.format'),
          Component = _require('./fly.component'),
          $ = fly.$,
          ui = fly.ui,
          proxy = $.proxy,
          isArray = $.isArray,
          Class = fly.Class,
          Observable = fly.Observable,
          ObservableObject = fly.ObservableObject,
          ObservableArray = fly.ObservableArray;

        // 绑定器
        var componentBinders = {},
          binders = {
            component: componentBinders
          };

        // 静态变量
        var FUNCTION = 'function',
          NUMBER = 'number',
          CHANGE = 'change',
          VALUE = 'value',
          SOURCE = 'source',
          EVENTS = 'events',
          CHECKED = 'checked',
          CSS = 'css',
          DISABLED = 'disabled',
          READONLY = 'readonly',
          SOURCE = 'source',
          DATASOURCE = 'dataSource',
          SETDATASOURCE = 'setDataSource';

        // 正则表达式
        var regKeyValue = /[A-Za-z0-9_\-]+:(\{([^}]*)\}|[^,}]+)/g,
          regPath = /[a-zA-Z_]{1}[a-zA-Z0-9_.]+/,
          regWhiteSpace = /\s/g,
          regTemplate = /template$/i,
          regDate = /^\/Date\((.*?)\)\/$/,
          regNewLine = /(\r+|\n+)/g,
          regQuote = /(?=['\\])/g,
          regComponent = /^f-*/i;

        // 错误提示
        var errorMsg = 'The {0} binding is not supported by the {1} {2}';

        /**
         * 格式化字符串。
         * @private
         * @param  {String | Number | Object} value - 需要转化的值或日期对象。
         * @param  {String}                   fmt   - 转换的格式。如日期对应的转化格式。
         * @retrun {String} 转化后的字符串。
         */
        var toString = function(value, fmt) {
          if (value && fmt) {
            if (value.getTime()) {
              return fly.formatDate(value, fmt);
            } else if (typeof value === NUMBER) {
              return fly.formatNumber(value, fmt);
            }
          }
          return value !== undefined ? value : '';
        };

        /**
         * 格式化日期字符串。
         * @private
         * @param  {String | Object} value - 需要转化的日期值或日期对象。
         * @param  {String}          type  - 需要转化的日期类型，date 表示仅转化年月日；datetime 表示转化年月日时分秒。
         * @retrun {String} 转化后的日期字符串。
         */
        var toDateString = function(value, type) {
          if (type == "date") {
            value = toString(value, "yyyy-MM-dd");
          } else if (type == "datetime") {
            value = toString(value, "yyyy-MM-dd HH:mm:ss");
          }
          return value;
        };

        /**
         * 绑定器基类，它继承了 Observable 的属性和方法。
         * @see fly.Observable.js
         * @class
         * @memberOf fly
         * @alias fly.Binding
         */
        var Binding = Observable.extend({

          /**
           * Binding 类的构造函数，解析绑定属性，给视图模型绑定监听事件。
           * @memberOf fly.Binding.prototype
           * @param    {Object}           parents - 绑定参数所在的视图模型。
           * @param    {Object | String}  path    - 绑定的参数。
           */
          ctor: function(parents, path) {
            var that = this;

            /*if(path && typeof path == 'string') {
            path = path.match(regPath)[0] || '';
        }*/

            that._super();
            that.source = parents && parents[0];
            that.parents = parents;
            that.path = path;
            that.dependencies = {};
            that.dependencies[path] = true;
            that.observable = that.source instanceof Observable;

            that._access = function(e) {
              that.dependencies[e.field] = true;
            };

            if (that.observable) {
              that._change = function(e) {
                that.change(e);
              };

              that.source.bind(CHANGE, that._change);
            }
          },

          /**
           * 获取对象的父级对象。
           * @private
           * @memberOf fly.Binding.prototype
           * return  {Object} 对象的父级对象。
           */
          _parents: function() {
            var parents = this.parents;
            var value = this.get();

            if (value && typeof value.parent == FUNCTION) {
              var parent = value.parent();

              if ($.inArray(parent, parents) < 0) {
                parents = [parent].concat(parents);
              }
            }

            return parents;
          },

          /**
           * 触发绑定对象的监听（change）事件。
           * @memberOf fly.Binding.prototype
           * @param  {Object}  e  - 绑定对象。
           */
          change: function(e) {
            var dependency,
              ch,
              field = e.field,
              that = this;

            if (that.path === 'this') {
              that.trigger(CHANGE, e);
            } else {
              for (dependency in that.dependencies) {
                if (dependency.indexOf(field) === 0) {
                  ch = dependency.charAt(field.length);

                  if (!ch || ch === '.' || ch === '[') {
                    that.trigger(CHANGE, e);
                    break;
                  }
                }
              }
            }
          },

          /**
           * 绑定 get 方法。
           * @private
           * @memberOf fly.Binding.prototype
           * @param  {Object}  source - 绑定参数所在的视图模型。
           */
          start: function(source) {
            source.bind('get', this._access);
          },

          /**
           * 解除 get 方法的绑定。
           * @private
           * @memberOf fly.Binding.prototype
           * @param  {Object}  source - 绑定参数所在的视图模型。
           */
          stop: function(source) {
            source.unbind('get', this._access);
          },

          /**
           * 获取当前绑定属性的值。
           * @memberOf fly.Binding.prototype
           * @return  {*} 视图模型中对应的值。
           */
          get: function() {

            var that = this,
              source = that.source,
              index = 0,
              path = that.path,
              result = source;

            if (!that.observable) {
              return result;
            }

            that.start(that.source);

            result = source.get(path);

            // Traverse the observable hierarchy if the binding is not resolved at the current level.
            while (result === undefined && source) {
              source = that.parents[++index];
              if (source instanceof ObservableObject) {
                result = source.get(path);
              }
            }

            // second pass try to get the parent from the object hierarchy
            if (result === undefined) {
              source = that.source; //get the initial source
              while (result === undefined && source) {
                source = source.parent();
                if (source instanceof ObservableObject) {
                  result = source.get(path);
                }
              }
            }

            // If the result is a function - invoke it
            if (typeof result === FUNCTION) {
              index = path.lastIndexOf('.');

              // If the function is a member of a nested observable object make that nested observable the context (this) of the function
              if (index > 0) {
                source = source.get(path.substring(0, index));
              }

              // Invoke the function
              that.start(source);

              if (source !== that.source) {
                result = result.call(source, that.source);
              } else {
                result = result.call(source);
              }

              that.stop(source);
            }

            // If the binding is resolved by a parent object
            if (source && source !== that.source) {

              that.currentSource = source; // save parent object

              // Listen for changes in the parent object
              source.unbind(CHANGE, that._change)
                .bind(CHANGE, that._change);
            }

            that.stop(that.source);

            return result;
          },

          /**
           * 设置当前绑定属性的值。
           * @memberOf fly.Binding.prototype
           * @param  {*} value - 需要设置的值。
           */
          set: function(value) {
            var source = this.currentSource || this.source;

            var field = fly.getter(this.path)(source);

            if (typeof field === FUNCTION) {
              if (source !== this.source) {
                field.call(source, this.source, value);
              } else {
                field.call(source, value);
              }
            } else {
              source.set(this.path, value);
            }
          },

          /**
           * 销毁绑定。
           * @memberOf fly.Binding.prototype
           */
          destroy: function() {
            if (this.observable) {
              this.source.unbind(CHANGE, this._change);
              if (this.currentSource) {
                this.currentSource.unbind(CHANGE, this._change);
              }
            }

            this.unbind();
          }
        });

        /**
         * 事件绑定基类，它继承了 Binding 的属性和方法。因为事件绑定的特殊性，重写了基类的get方法，调用方式相同。
         * @class
         * @memberOf fly
         * @alias fly.EventBinding
         */
        var EventBinding = Binding.extend({

          /**
           * 获取绑定事件属性对象的方法。
           * @memberOf fly.EventBinding.prototype
           */
          get: function() {
            var source = this.source,
              path = this.path,
              index = 0,
              handler;

            handler = source.get(path);

            while (!handler && source) {
              source = this.parents[++index];

              if (source instanceof ObservableObject) {
                handler = source.get(path);
              }
            }

            return proxy(handler, source);
          }
        });

        /**
         * 模板绑定基类，它继承了 Binding 的属性和方法。因为模板绑定的特殊性，增加了 render 方法。
         * @class
         * @memberOf fly
         * @alias fly.TemplateBinding
         */
        var TemplateBinding = Binding.extend({

          /**
           * TemplateBinding 类的构造函数，继承父类方法和属性，并将模板赋值至当前对象的template属性中。
           * @memberOf fly.TemplateBinding.prototype
           * @param    {Object}           source   - 绑定参数所在的视图模型。
           * @param    {Object | String}  path     - 绑定的参数。
           * @param    {String}           template - 模板名称。
           */
          ctor: function(source, path, template) {
            this._super(source, path);
            this.template = template;
          },

          /**
           * 根据传入的数据渲染模板。
           * @memberOf fly.TemplateBinding.prototype
           * @param  {Object | String | Number}  value - 渲染数据。
           * @return {String} 根据传入的数据及模板渲染后的HTML。
           */
          render: function(value) {
            var html;

            this.start(this.source);

            html = tmpl(this.template, value.toJSON && value.toJSON(true) || value);

            this.stop(this.source);

            return html;
          }
        });

        /**
         * 目标绑定基类，将对应的DOM元素与视图模型进行绑定。
         * @class
         * @memberOf fly
         * @alias fly.BindingTarget
         */
        var BindingTarget = Class.extend({

          /**
           * BindingTarget 类的构造函数。
           * @memberOf fly.BindingTarget.prototype
           * @param  {Object}  target  - 目标源DOM元素。
           * @param  {Object}  options - 初始化配置参数。
           */
          ctor: function(target, options) {
            this.target = target;
            this.options = options;
            this.toDestroy = [];
          },

          /**
           * 绑定指定类型的绑定器。
           * @memberOf fly.BindingTarget.prototype
           * @param  {Object}  bindings  - 待绑定的绑定器信息。
           */
          bind: function(bindings) {
            var key,
              hasValue,
              hasSource,
              hasEvents,
              hasChecked,
              hasCss,
              componentBinding = this instanceof ComponentBindingTarget,
              specificBinders = this.binders();

            for (key in bindings) {
              if (key == VALUE) {
                hasValue = true;
              } else if (key == SOURCE) {
                hasSource = true;
              } else if (key == EVENTS) {
                hasEvents = true;
              } else if (key == CHECKED) {
                hasChecked = true;
              } else if (key == CSS && !componentBinding) {
                hasCss = true;
              } else {
                this.applyBinding(key, bindings, specificBinders);
              }
            }
            if (hasSource) {
              this.applyBinding(SOURCE, bindings, specificBinders);
            }

            if (hasValue) {
              this.applyBinding(VALUE, bindings, specificBinders);
            }

            if (hasChecked) {
              this.applyBinding(CHECKED, bindings, specificBinders);
            }

            if (hasEvents) {
              this.applyBinding(EVENTS, bindings, specificBinders);
            }

            if (hasCss && !componentBinding) {
              this.applyBinding(CSS, bindings, specificBinders);
            }
          },

          /**
           * 获取目标元素的特殊绑定器信息。
           * @private
           * @memberOf fly.BindingTarget.prototype
           * @retrun  {Object} 对应的绑定器。
           */
          binders: function() {
            return binders[this.target.nodeName.toLowerCase()] || {};
          },

          /**
           * 设置绑定器的绑定应用。
           * @private
           * @memberOf fly.BindingTarget.prototype
           * @param  {String}  name             - 绑定器名称。
           * @param  {String}  bindings         - 绑定的信息。
           * @param  {String}  specificBinders  - 绑定器缓存对象。
           */
          applyBinding: function(name, bindings, specificBinders) {
            var binder = specificBinders[name] || binders[name],
              toDestroy = this.toDestroy,
              attribute,
              binding = bindings[name];

            if (binder) {
              binder = new binder(this.target, bindings, this.options);

              toDestroy.push(binder);

              if (binding instanceof Binding) {
                binder.bind(binding);
                toDestroy.push(binding);
              } else {
                for (attribute in binding) {
                  binder.bind(binding, attribute);
                  toDestroy.push(binding[attribute]);
                }
              }
            } else if (name !== 'template') {
              throw new Error(format(errorMsg, name, this.target.nodeName.toLowerCase(),
                'element'));
            }
          },

          /**
           * 销毁绑定器。
           * @memberOf fly.BindingTarget.prototype
           */
          destroy: function() {
            var idx,
              length,
              toDestroy = this.toDestroy;

            for (idx = 0, length = toDestroy.length; idx < length; idx++) {
              toDestroy[idx].destroy();
            }
          }
        });

        /**
         * 组件目标绑定基类，继承 BindingTarget 的方法及属性，由于组件的特殊性，重写了 applyBinding 和 binders 的方法。
         * @class
         * @memberOf fly
         * @alias fly.ComponentBindingTarget
         */
        var ComponentBindingTarget = BindingTarget.extend({

          /**
           * 屏蔽特殊绑定器。
           * @private
           * @memberOf fly.ComponentBindingTarget.prototype
           * @retrun  {Object} 空对象。
           */
          binders: function() {
            return {};
          },

          /**
           * 设置组件绑定器的绑定应用。
           * @private
           * @memberOf fly.ComponentBindingTarget.prototype
           * @param  {String}  name             - 绑定器名称。
           * @param  {String}  bindings         - 绑定的信息。
           * @param  {String}  specificBinders  - 绑定器缓存对象。
           */
          applyBinding: function(name, bindings, specificBinders) {
            var binder = specificBinders[name] || componentBinders[name],
              toDestroy = this.toDestroy,
              attribute,
              binding = bindings[name];

            if (binder) {
              binder = new binder(this.target, bindings, this.target.options);

              toDestroy.push(binder);

              if (binding instanceof Binding) {
                binder.bind(binding);
                toDestroy.push(binding);
              } else {
                for (attribute in binding) {
                  binder.bind(binding, attribute);
                  toDestroy.push(binding[attribute]);
                }
              }
            } else {
              throw new Error(format(errorMsg, name, this.target.name, 'component'));
            }
          }
        });

        /**
         * 绑定器基类，为后续的绑定器封装提供基础属性和方法。
         * @see 绑定原理请参考：{@link http://www.flyui.cn/v1/docs/advance/bindprinciple.html}
         * @class
         * @memberOf fly
         * @alias fly.Binder
         */
        var Binder = Class.extend({
          /**
           * Binder 类的构造函数。初始化目标源DOM，绑定信息和相关配置信息。
           * @memberOf fly.Binder.prototype
           * @param  {Object}  element  - 目标源DOM元素。
           * @param  {Object}  bindings - 绑定信息。
           * @param  {Object}  options  - 初始化配置参数。
           */
          ctor: function(element, bindings, options) {
            this.element = element;
            this.bindings = bindings;
            this.options = options;
          },

          /**
           * 绑定指定的绑定器。执行对应绑定器的 refresh 操作并绑定监听事件。
           * @memberOf fly.Binder.prototype
           * @param  {Object}  binding   - 绑定信息。
           * @param  {String}  attribute - 绑定器名称。
           */
          bind: function(binding, attribute) {
            var that = this;

            binding = attribute ? binding[attribute] : binding;

            binding.bind(CHANGE, function(e) {
              that.refresh(attribute || e);
            });

            that.refresh(attribute);
          },

          /**
           * @todo 绑定销毁。
           * @memberOf fly.Binder.prototype
           * @private
           */
          destroy: function() {}
        });

        /**
         * 类型绑定器基类，它继承了 Binder 的属性和方法。另外提供了 parsedValue 的方法（主要用于对不同的数据类型的值的格式化处理）。
         * @class
         * @memberOf fly
         * @alias fly.TypedBinder
         */
        var TypedBinder = Binder.extend({
          /**
           * 获取当前元素的数据类型。
           * @memberOf fly.TypedBinder.prototype
           * @return  {String}  对应定义的数据类型，默认为'text'。
           */
          dataType: function() {
            var dataType = this.element.getAttribute('data-type') ||
              this.element.type || 'text';
            return dataType.toLowerCase();
          },

          /**
           * 根据元素数据类型解析当前元素值。
           * @memberOf fly.TypedBinder.prototype
           * @return {*} 处理后的值。
           */
          parsedValue: function() {
            return this._parseValue(this.element.value, this.dataType());
          },

          /**
           * 解析对应数据类型的值。
           * @private
           * @memberOf fly.TypedBinder.prototype
           * @param   {String | Object} value    - 需要解析的值。
           * @param   {String}          dataType - 数据类型：'date'，'datetime'，'number'，'boolean'，'text'。
           * @return  {*} 处理后的值。
           */
          _parseValue: function(value, dataType) {
            if (dataType == 'date') {
              value = toString(value, 'yyyy-MM-dd');
            } else if (dataType == 'datetime') {
              value = toString(value, 'yyyy-MM-dd HH:mm:ss');
            } else if (dataType == 'number') {
              value = parseFloat(value);
            } else if (dataType == 'boolean') {
              value = value.toLowerCase();
              if (parseFloat(value) !== NaN) {
                value = Boolean(parseFloat(value));
              } else {
                value = (value === 'true');
              }
            }
            return value;
          }
        });

        /**
         * 组件绑定器基类，它继承了 Binder 的属性和方法。
         * @class
         * @memberOf fly
         * @alias fly.ComponentBinder
         */
        var ComponentBinder = Binder.extend({
          /**
           * ComponentBinder 类的构造函数，初始化元素的组件属性。
           * @memberOf fly.ComponentBinder.prototype
           * @param  {Object}  component  - 组件对象。
           * @param  {Object}  bindings   - 绑定信息。
           * @param  {Object}  options    - 初始化配置参数。
           */
          ctor: function(component, bindings, options) {
            if (!component) return;
            this._super(component.element, bindings, options);
            this.component = component;
          }
        });

        /**
         * 属性绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于属性的更新监听）。
         * @class
         * @memberOf fly
         * @alias fly.binders.attr
         */
        binders.attr = Binder.extend({

          /**
           * 更新指定的属性的值。
           * @param {*} key - 属性值。
           * @memberOf fly.binders.attr.prototype
           */
          refresh: function(key) {
            this.element.setAttribute(key, this.bindings.attr[key].get());
          }
        });

        /**
         * 类名绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于类名的更新监听）。
         * @class
         * @memberOf fly
         * @alias fly.binders.css
         */
        binders.css = Binder.extend({

          /**
           * 类名绑定器基类的构造函数，继承父类的同时，初始化相关配置信息。
           * @param  {Object}  element  - 目标源DOM元素。
           * @param  {Object}  bindings - 绑定信息。
           * @param  {Object}  options  - 初始化配置参数。
           * @memberOf fly.binders.css.prototype
           */
          ctor: function(element, bindings, options) {
            this._super(element, bindings, options);
            this.classes = {};
          },

          /**
           * 更新指定的类名到绑定元素上。
           * @param {String} className - 类名。
           * @memberOf fly.binders.css.prototype
           */
          refresh: function(className) {
            var element = this.element,
              binding = this.bindings.css[className],
              hasClass = this.classes[className] = binding.get();
            if (hasClass) {
              fly.addClass(element, className);
            } else {
              fly.removeClass(element, className);
            }
          }
        });

        /**
         * 样式绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于样式的更新监听）。
         * @class
         * @memberOf fly
         * @alias fly.binders.style
         */
        binders.style = Binder.extend({
          /**
           * 更新指定的样式到绑定元素上。
           * @param {Object} key - 样式定义。
           * @memberOf fly.binders.style.prototype
           */
          refresh: function(key) {
            this.element.style[key] = this.bindings.style[key].get() || '';
          }
        });

        /**
         * 可用绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于可用性的更新监听）。
         * @class
         * @memberOf fly
         * @alias fly.binders.enabled
         */
        binders.enabled = Binder.extend({
          /**
           * 获取对应的 enabled 值，更新元素的可用性。
           * @memberOf fly.binders.enabled.prototype
           */
          refresh: function() {
            if (this.bindings.enabled.get()) {
              this.element.removeAttribute(DISABLED);
            } else {
              this.element.setAttribute(DISABLED, DISABLED);
            }
          }
        });

        /**
         * 可读绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于可读性的更新监听）。
         * @class
         * @memberOf fly
         * @alias fly.binders.readonly
         */
        binders.readonly = Binder.extend({
          /**
           * 获取对应的 readonly 值，更新元素的可读性。
           * @memberOf fly.binders.readonly.prototype
           */
          refresh: function() {
            if (this.bindings.readonly.get()) {
              this.element.setAttribute(READONLY, READONLY);
            } else {
              this.element.removeAttribute(READONLY);
            }
          }
        });

        /**
         * 禁用绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于禁用性的更新监听）。
         * @class
         * @memberOf fly
         * @alias fly.binders.disabled
         */
        binders.disabled = Binder.extend({
          /**
           * 获取对应的 disabled 值，更新元素的禁用性。
           * @memberOf fly.binders.disabled.prototype
           */
          refresh: function() {
            if (this.bindings.disabled.get()) {
              this.element.setAttribute(DISABLED, DISABLED);
            } else {
              this.element.removeAttribute(DISABLED);
            }
          }
        });

        /**
         * 事件绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于事件的更新监听）和 destroy 方法（用于事件的销毁绑定）。
         * @class
         * @memberOf fly
         * @alias fly.binders.events
         */
        binders.events = Binder.extend({
          /**
           * 事件绑定器基类的构造函数，继承父类的同时，初始化相关配置信息。
           * @param  {Object}  element  - 目标源DOM元素。
           * @param  {Object}  bindings - 绑定信息。
           * @param  {Object}  options  - 初始化配置参数。
           * @memberOf fly.binders.events.prototype
           */
          ctor: function(element, bindings, options) {
            this._super(element, bindings, options);
            this.handlers = {};
          },

          /**
           * 更新绑定元素上的指定事件。
           * @param {String} key - 事件名称。
           * @memberOf fly.binders.events.prototype
           */
          refresh: function(key) {
            var element = this.element,
              binding = this.bindings.events[key],
              handler = this.handlers[key];

            if (handler) {
              fly.off(element, key, handler);
            }

            handler = this.handlers[key] = function(e) {
              e.handleObj = e.handleObj || {};
              e.handleObj.data = binding.source;
              binding.get()(e);
            };

            fly.on(element, key, handler);
          },

          /**
           * 销毁绑定元素上的事件。
           * @memberOf fly.binders.events.prototype
           */
          destroy: function() {
            var element = this.element,
              handler;

            for (handler in this.handlers) {
              fly.off(element, handler, this.handlers[handler]);
            }
          }
        });

        /**
         * 文本绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于文本的更新监听）。
         * @class
         * @memberOf fly
         * @alias fly.binders.text
         */
        binders.text = Binder.extend({
          /**
           * 获取对应的值，更新绑定元素上的文本。
           * @memberOf fly.binders.text.prototype
           */
          refresh: function() {
            var element = this.element,
              dataFormat = element.getAttribute("data-format") || '',
              text = this.bindings.text.get();

            if (text == null) {
              text = '';
            }

            element.innerText = toString(text, dataFormat);
          }
        });

        /**
         * 可见性绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于可见性的更新监听）。
         * @class
         * @memberOf fly
         * @alias fly.binders.visible
         */
        binders.visible = Binder.extend({
          /**
           * 获取对应的值，更新绑定元素的可见性。
           * @memberOf fly.binders.visible.prototype
           */
          refresh: function() {
            if (this.bindings.visible.get()) {
              this.element.style.display = '';
            } else {
              this.element.style.display = "none";
            }
          }
        });

        /**
         * 不可见性绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于不可见性的更新监听）。
         * @class
         * @memberOf fly
         * @alias fly.binders.invisible
         */
        binders.invisible = Binder.extend({
          /**
           * 获取对应的值，更新绑定元素的不可见性。
           * @memberOf fly.binders.invisible.prototype
           */
          refresh: function() {
            if (!this.bindings.invisible.get()) {
              this.element.style.display = '';
            } else {
              this.element.style.display = "none";
            }
          }
        });

        /**
         * HTML绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于HTML的更新监听）。
         * @class
         * @memberOf fly
         * @alias fly.binders.html
         */
        binders.html = Binder.extend({
          /**
           * 获取对应的值，更新绑定元素的html。
           * @memberOf fly.binders.html.prototype
           */
          refresh: function() {
            this.element.innerHTML = this.bindings.html.get();
          }
        });

        /**
         * 值绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于值的更新监听）和 destroy 方法（用于值更新的销毁绑定）。
         * @class
         * @memberOf fly
         * @alias fly.binders.value
         */
        binders.value = TypedBinder.extend({

          /**
           * 值绑定器基类的构造函数，继承父类的同时，初始化相关配置信息，绑定事件监听。值绑定器主要是用在表单控件上。
           * @param  {Object}  element  - 目标源DOM元素。
           * @param  {Object}  bindings - 绑定信息。
           * @param  {Object}  options  - 初始化配置参数。
           * @memberOf fly.binders.value.prototype
           */
          ctor: function(element, bindings, options) {
            this._super(element, bindings, options);
            this._change = proxy(this.change, this);
            this.eventName = options.valueUpdate || CHANGE;

            fly.on(this.element, this.eventName, this._change);

            this._initChange = false;
          },

          /**
           * 事件监听。
           * @memberOf fly.binders.value.prototype
           */
          change: function() {
            this._initChange = this.eventName != CHANGE;

            this.bindings[VALUE].set(this.parsedValue());

            this._initChange = false;
          },

          /**
           * 更新绑定元素上的值。
           * @memberOf fly.binders.value.prototype
           */
          refresh: function() {
            if (!this._initChange) {
              var value = this.bindings[VALUE].get();

              if (value == null) {
                value = '';
              }

              value = toDateString(value, this.dataType());
              this.element.value = value;
            }

            this._initChange = false;
          },

          /**
           * 销毁绑定元素值的监听方法。
           * @memberOf fly.binders.value.prototype
           */
          destroy: function() {
            fly.off(this.element, this.eventName, this._change);
          }
        });

        /**
         * 数据源绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于数据源的更新监听），
         * 此外，当没有绑定模板时数据源绑定器能识别元素内部的HTML当作是渲染的模板。
         * @class
         * @memberOf fly
         * @alias fly.binders.source
         */
        binders.source = Binder.extend({

          /**
           * 数据源绑定器基类的构造函数，继承父类的同时，初始化相关配置信息。
           * @param  {Object}  element  - 目标源DOM元素。
           * @param  {Object}  bindings - 绑定信息。
           * @param  {Object}  options  - 初始化配置参数。
           * @memberOf fly.binders.source.prototype
           */
          ctor: function(element, bindings, options) {
            if (!element) return;
            this._super(element, bindings, options);

            var source = this.bindings.source.get();
            if (source instanceof DataSource && options.autoBind !== false) {
              source.fetch();
            }
          },

          /**
           * 更新绑定元素上的数据源。
           * @param  {Object}  e - 数据源对象。
           * @memberOf fly.binders.source.prototype
           */
          refresh: function(e) {
            var that = this,
              source = that.bindings.source.get();

            if (that.element.nodeName.toLowerCase() === 'select') {
              that.render();
              return;
            }

            // if (source instanceof ObservableArray) {
            e = e || {};

            if (e.action == undefined) {
              that.render();
            } else if (e.action === 'add') {
              that.add(e.index, e.items);
            } else if (e.action === 'remove') {
              that.remove(e.index, e.items);
            } else if (e.action === 'itemchange') {
              that.renderItems(e.items);
            }
            // } else {
            //     that.render();
            // }
          },

          /**
           * 对元素进行处理，当元素节点是 table 时对元素进行处理。
           * @memberOf fly.binders.source.prototype
           * @return 返回处理后的元素。
           */
          container: function() {
            var element = this.element;

            if (element.nodeName.toLowerCase() == "table") {
              if (!element.tBodies[0]) {
                element.appendChild(document.createElement("tbody"));
              }
              element = element.tBodies[0];
            }

            return element;
          },

          /**
           * 获取渲染模板，当没有定义模板的时候取元素内部HTML做模板。
           * @memberOf fly.binders.source.prototype
           * @return 渲染模板。
           */
          template: function() {
            var options = this.options,
              container = this.container(),
              template = options.template,
              textField = options.textField,
              valueField = options.valueField;

            if (!template) {
              var nodeName = container.nodeName.toLowerCase();
              var fieldName = valueField || textField;
              var html = fly.getTemplate(container);

              if (html.indexOf('<') === 0) {
                template = html;
              } else if (nodeName == "select") {
                if (fieldName) {
                  template = '<option value="{{$value.' + fieldName + '}}">{{$value.' +
                    textField + '}}</option>';
                } else {
                  template = "<option>{{$value}}</option>";
                }
              } else if (nodeName == "tbody") {
                template = "<tr><td>{{$value}}</td></tr>";
              } else if (nodeName == "ul" || nodeName == "ol") {
                template = "<li>{{$value}}</li>";
              } else {
                template = "{{$value}}";
              }

              template = '{{each $data}}' + template + '{{/each}}'
              template = tmpl.compile(template);
              this.options.template = template;
            } else if (typeof template === 'string') {
              template = tmpl.renderFile(template);
            }

            return template;
          },

          /**
           * 渲染单条数据
           * 在使用模板语法的时候需要
           * 如何判定使用模板语法是个问题
           *
           * @param {any} items
           */
          renderItems: function(items) {},

          add: function(index, items) {
            var element = this.container(),
              html = this.template()(items),
              options = this.options,
              parents = this.bindings.source._parents(),
              reference = element.children[index],
              node = element.nodeName.toLowerCase(),
              valueField = options.valueField,
              textField = options.textField,
              htmlElements = $(html),
              htmlElement;

            for (var idx = 0, length = items.length; idx < length; idx++) {
              if (node === 'select') {
                element.options.add(new Option(items[idx][textField || valueField],
                  valueField && items[idx][valueField]));
              } else {
                element.insertBefore(htmlElements[idx], reference || null);
                bindElement(htmlElements[idx], items[idx], [
                  items[idx]
                ].concat(parents));
              }
            }
          },

          /**
           * 移除数据源对应下标的数据及销毁其所有的绑定。
           * @memberOf fly.binders.source.prototype
           * @param {Number} index - 对应数据源的下标。
           * @param {Object} items - 需要移除的数据源对象。
           */
          remove: function(index, items) {
            var idx, element = this.container(),
              node = element.nodeName.toLowerCase();

            for (idx = 0; idx < items.length; idx++) {
              if (node === 'select') {
                element.options.remove(index);
              } else {
                var child = element.children[index];
                unbindElementTree(child);
                element.removeChild(child);
              }
            }
          },

          /**
           * 根据数据源和模板（自定义的模板或者元素标签内部HTML）渲染数据。
           * @memberOf fly.binders.source.prototype
           */
          render: function() {
            var source = this.bindings.source.get(),
              element = this.container(),
              template = this.template(),
              ie = fly.support.browser.ie,
              node = element.nodeName.toLowerCase(),
              html,
              htmlElements,
              parents;

            if (source instanceof DataSource) {
              source = source.view();
            }

            if (!(source instanceof ObservableArray) && !isArray(source)) {
              source = [source];
            }

            while (element.hasChildNodes()) {
              element.removeChild(element.firstChild);
            }

            unbindElementChildren(element);

            if (this.bindings.template) {
              html = this.bindings.template.render(source);
            } else {
              html = template(source.toJSON && source.toJSON() || source);
            }

            // 加速渲染
            // 在IE<=9的时候，使用appendChild，其他则直接innerHTML，减少DOM操作
            // 在使用模板语法渲染超大data的时候棒棒的
            if (ie && ie < 10 && (node === 'tbody' || node === 'select')) {
              htmlElements = $(html);
              for (var i = 0, l = htmlElements.length; i < l; i++) {
                element.appendChild(htmlElements[i]);
              }
            } else {
              element.innerHTML = html;
            }

            // 绑定数据
            if (element.children.length) {
              parents = this.bindings.source._parents();
              for (var idx = 0, length = source.length; idx < length; idx++) {
                bindElement(
                  element.children[idx],
                  source[idx], [source[idx]].concat(parents));
              }
            }
          }
        });

        binders.input = {

          /**
           * 选中绑定器基类，它继承了 TypedBinder 的属性和方法。另外提供了 refresh 的方法（主要用于 radio 和 checkbox 的更新监听。）
           * @class
           * @memberOf fly
           * @alias fly.binders.input.checked
           */
          checked: TypedBinder.extend({
            /**
             * 选中绑定器基类的构造函数，在元素上绑定监听事件。
             * @param  {Object}  element  - 目标源DOM元素。
             * @param  {Object}  bindings - 绑定信息。
             * @param  {Object}  options  - 初始化配置参数。
             * @memberOf fly.binders.input.checked.prototype
             */
            ctor: function(element, bindings, options) {
              this._super(element, bindings, options);
              this._change = proxy(this.change, this);
              fly.on(this.element, CHANGE, this._change);
            },

            /**
             * 选中绑定器的更新事件绑定。
             * @memberOf fly.binders.input.checked.prototype
             */
            change: function() {
              var element = this.element;
              var value = this.value();

              if (element.type == "radio") {
                value = this.parsedValue();
                this.bindings[CHECKED].set(value);
              } else if (element.type == "checkbox") {
                var source = this.bindings[CHECKED].get();
                var index;

                if (source instanceof ObservableArray) {
                  value = this.parsedValue();
                  if (value instanceof Date) {
                    for (var i = 0; i < source.length; i++) {
                      if (source[i] instanceof Date && +source[i] === +value) {
                        index = i;
                        break;
                      }
                    }
                  } else {
                    index = source.indexOf(value);
                  }
                  if (index > -1) {
                    source.splice(index, 1);
                  } else {
                    source.push(value);
                  }
                } else {
                  this.bindings[CHECKED].set(value);
                }
              }
            },

            /**
             * 更新元素（type 为 radio 或 checkbox）的选中值。
             * @memberOf fly.binders.input.checked.prototype
             */
            refresh: function() {
              var value = this.bindings[CHECKED].get(),
                source = value,
                type = this.dataType(),
                element = this.element;

              if (element.type == "checkbox") {
                if (source instanceof ObservableArray) {
                  var index = -1;
                  value = this.parsedValue();
                  if (value instanceof Date) {
                    for (var i = 0; i < source.length; i++) {
                      if (source[i] instanceof Date && +source[i] === +value) {
                        index = i;
                        break;
                      }
                    }
                  } else {
                    index = source.indexOf(value);
                  }
                  element.checked = (index >= 0);
                } else {
                  element.checked = source;
                }
              } else if (element.type == "radio" && value != null) {
                value = toDateString(value, type);
                if (element.value === value.toString()) {
                  element.checked = true;
                } else {
                  element.checked = false;
                }
              }
            },

            /**
             * 获取当前元素的选中值。
             * @memberOf fly.binders.input.checked.prototype
             */
            value: function() {
              var element = this.element,
                value = element.value;

              if (element.type == "checkbox") {
                value = element.checked;
              }

              return value;
            },

            /**
             * 销毁选中绑定器的更新事件绑定。
             * @memberOf fly.binders.input.checked.prototype
             */
            destroy: function() {
              fly.off(this.element, CHANGE, this._change);
            }
          })
        };

        binders.select = {
          /**
           * 下拉框数据源绑定器基类，它继承了 binders.source 的属性和方法。更新了 refresh 的方法（主要用于下拉框数据源更新监听）。
           * @class
           * @memberOf fly
           * @alias fly.binders.select.source
           */
          source: binders.source.extend({
            /**
             * 更新绑定元素上的下拉框数据源。
             * @param  {Object}  e - 下拉框数据源对象。
             * @memberOf fly.binders.select.source.prototype
             */
            refresh: function(e) {
              var that = this,
                source = that.bindings.source.get();

              if (source instanceof ObservableArray || source instanceof DataSource) {
                e = e || {};

                if (e.action == "add") {
                  that.add(e.index, e.items);
                } else if (e.action == "remove") {
                  that.remove(e.index, e.items);
                } else if (e.action == "itemchange" || e.action === undefined) {
                  that.render();
                  if (that.bindings.value) {
                    that.bindings.value.source.trigger(CHANGE, {
                      field: that.bindings.value.path
                    });
                  }
                }
              } else {
                that.render();
              }
            }
          }),

          /**
           * 下拉框值绑定器基类，它继承了 TypedBinder 的属性和方法。另外提供了 refresh 的方法（主要用于下拉框值的更新监听）。
           * @class
           * @memberOf fly
           * @alias fly.binders.select.value
           */
          value: TypedBinder.extend({
            /**
             * 下拉框值绑定器基类的构造函数，绑定对应的更新监听。
             * @param  {Object}  target   - 目标源DOM元素。
             * @param  {Object}  bindings - 绑定信息。
             * @param  {Object}  options  - 初始化配置参数。
             * @memberOf fly.binders.select.value.prototype
             */
            ctor: function(target, bindings, options) {
              this._super(target, bindings, options);
              this._change = proxy(this.change, this);
              fly.on(this.element, CHANGE, this._change);
            },

            /**
             * 根据数据的类型解析格式化元素的值。
             * @memberOf fly.binders.select.value.prototype
             */
            parsedValue: function() {
              var dataType = this.dataType();
              var values = [];
              var element = this.element;
              var value, option, idx, length;
              for (idx = 0, length = element.options.length; idx < length; idx++) {
                option = element.options[idx];

                if (option.selected) {
                  value = option.attributes.value;

                  if (value && value.specified) {
                    value = option.value;
                  } else {
                    value = option.text;
                  }

                  values.push(this._parseValue(value, dataType));
                }
              }
              return values;
            },

            /**
             * 元素的值更新监听绑定。
             * @memberOf fly.binders.select.value.prototype
             */
            change: function() {
              var values = [],
                element = this.element,
                options = this.options,
                field = options.valueField || options.textField,
                valuePrimitive = options.valuePrimitive,
                source,
                option,
                valueIndex,
                value,
                idx,
                length;

              values = this.parsedValue();

              if (field) {
                source = this.bindings.source.get();
                if (source instanceof DataSource) {
                  source = source.view();
                }

                for (valueIndex = 0; valueIndex < values.length; valueIndex++) {
                  for (idx = 0, length = source.length; idx < length; idx++) {
                    var match = valuePrimitive ? (this._parseValue(values[
                      valueIndex], this.dataType()) === source[idx].get(
                      field)) : (this._parseValue(source[idx].get(field),
                      this.dataType()).toString() === values[
                      valueIndex]);
                    if (match) {
                      values[valueIndex] = source[idx];
                      break;
                    }
                  }
                }
              }

              value = this.bindings[VALUE].get();
              if (value instanceof ObservableArray) {
                value.splice.apply(value, [0, value.length].concat(values));
              } else if (!valuePrimitive && (value instanceof ObservableObject ||
                value === null || value === undefined || !field)) {
                this.bindings[VALUE].set(values[0]);
              } else {
                this.bindings[VALUE].set(values[0].get(field));
              }
            },

            /**
             * 更新下拉框元素的值。
             * @memberOf fly.binders.select.value.prototype
             */
            refresh: function() {
              var optionIndex,
                element = this.element,
                options = element.options,
                valuePrimitive = this.options.valuePrimitive,
                value = this.bindings[VALUE].get(),
                values = value,
                field = this.options.valueField || this.options.textField,
                found = false,
                type = this.dataType(),
                optionValue;

              if (!(values instanceof ObservableArray)) {
                values = new ObservableArray([value]);
              }

              element.selectedIndex = -1;

              for (var valueIndex = 0; valueIndex < values.length; valueIndex++) {
                value = values[valueIndex];


                if (field && value instanceof ObservableObject) {
                  value = value.get(field);
                }

                value = toDateString(values[valueIndex], type);

                for (optionIndex = 0; optionIndex < options.length; optionIndex++) {
                  optionValue = options[optionIndex].value;

                  if (optionValue === '' && value !== '') {
                    optionValue = options[optionIndex].text;
                  }

                  if (value != null && optionValue == value.toString()) {
                    options[optionIndex].selected = true;
                    found = true;
                  }
                }
              }
            },

            /**
             * 销毁元素的事件监听绑定。
             * @memberOf fly.binders.select.value.prototype
             */
            destroy: function() {
              $(this.element).off(CHANGE, this._change);
            }
          })
        };

        /**
         * 组件事件绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于事件的更新监听）和 destroy 方法（用于事件的销毁绑定）。
         * @class
         * @memberOf fly
         * @alias fly.componentBinders.events
         */
        componentBinders.events = Binder.extend({
          /**
           * 组件事件绑定器基类的构造函数，继承父类并初始化相关配置信息。
           * @param  {Object}  component  - 目标组件对象。
           * @param  {Object}  bindings   - 绑定信息。
           * @param  {Object}  options    - 初始化配置参数。
           * @memberOf fly.componentBinders.events.prototype
           */
          ctor: function(component, bindings, options) {
            this._super(component.element, bindings, options);
            this.component = component;
            this.handlers = {};
          },

          /**
           * 更新绑定元素上的指定事件。
           * @param {String} key - 事件名称。
           * @memberOf fly.componentBinders.events.prototype
           */
          refresh: function(key) {
            var binding = this.bindings.events[key],
              handler = this.handlers[key];

            if (handler) {
              this.component.unbind(key, handler);
            }

            handler = binding.get();

            this.handlers[key] = function(e) {
              e.data = binding.source;

              handler(e);

              if (e.data === binding.source) {
                delete e.data;
              }
            };

            this.component.bind(key, this.handlers[key]);
          },

          /**
           * 组件事件绑定器销毁。
           * @memberOf fly.componentBinders.events.prototype
           */
          destroy: function() {
            var handler;

            for (handler in this.handlers) {
              this.component.unbind(handler, this.handlers[handler]);
            }
          }
        });

        /**
         * 组件选中绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于选中的更新监听）和 destroy 方法（用于选中的销毁绑定）。
         * @class
         * @memberOf fly
         * @alias fly.componentBinders.checked
         */
        componentBinders.checked = Binder.extend({
          /**
           * 组件选中绑定器基类的构造函数，继承父类并绑定对应的监听事件。
           * @param  {Object}  component  - 目标组件对象。
           * @param  {Object}  bindings   - 绑定信息。
           * @param  {Object}  options    - 初始化配置参数。
           * @memberOf fly.componentBinders.checked.prototype
           */
          ctor: function(component, bindings, options) {
            this._super(component.element, bindings, options);
            this.component = component;
            this._change = proxy(this.change, this);
            this.component.bind(CHANGE, this._change);
          },

          /**
           * 组件选中绑定器的更新事件绑定。
           * @memberOf fly.componentBinders.checked.prototype
           */
          change: function() {
            this.bindings[CHECKED].set(this.value());
          },

          /**
           * 更新组件的选中值。
           * @memberOf fly.componentBinders.checked.prototype
           */
          refresh: function() {
            this.component.check(this.bindings[CHECKED].get() === true);
          },

          /**
           * 获取组件的选中值。
           * @memberOf fly.componentBinders.checked.prototype
           */
          value: function() {
            var element = this.element,
              component = this.component,
              value = element.value;
            if (component.input) {
              value = component.input.checked;
            }
            return value;
          },

          /**
           * 销毁组件的选中绑定器更新事件。
           * @memberOf fly.componentBinders.checked.prototype
           */
          destroy: function() {
            this.component.unbind(CHANGE, this._change);
          }
        });

        /**
         * 组件可见绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于可见性的更新监听）。
         * @class
         * @memberOf fly
         * @alias fly.componentBinders.visible
         */
        componentBinders.visible = Binder.extend({

          /**
           * 组件可见绑定器基类的构造函数，继承父类并初始化信息。
           * @param  {Object}  component  - 目标组件对象。
           * @param  {Object}  bindings   - 绑定信息。
           * @param  {Object}  options    - 初始化配置参数。
           * @memberOf fly.componentBinders.visible.prototype
           */
          ctor: function(component, bindings, options) {
            this._super(component.element, bindings, options);
            this.component = component;
          },

          /**
           * 获取对应的可见性配置，更新组件的可见性。
           * @memberOf fly.componentBinders.visible.prototype
           */
          refresh: function() {
            var visible = this.bindings.visible.get();
            this.component.wrapper[0].style.display = visible ? '' : "none";
          }
        });

        /**
         * 组件不可见绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于不可见性的更新监听）。
         * @class
         * @memberOf fly
         * @alias fly.componentBinders.invisible
         */
        componentBinders.invisible = Binder.extend({

          /**
           * 组件不可见绑定器基类的构造函数，继承父类并初始化信息。
           * @param  {Object}  component  - 目标组件对象。
           * @param  {Object}  bindings   - 绑定信息。
           * @param  {Object}  options    - 初始化配置参数。
           * @memberOf fly.componentBinders.invisible.prototype
           */
          ctor: function(component, bindings, options) {
            this._super(component.element, bindings, options);
            this.component = component;
          },

          /**
           * 获取对应的不可见性配置，更新组件的不可见性。
           * @memberOf fly.componentBinders.visible.prototype
           */
          refresh: function() {
            var invisible = this.bindings.invisible.get();
            this.component.wrapper[0].style.display = invisible ? "none" : '';
          }
        });

        /**
         * 组件可用绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于可用性的更新监听）。
         * @class
         * @memberOf fly
         * @alias fly.componentBinders.enabled
         */
        componentBinders.enabled = Binder.extend({

          /**
           * 组件可用绑定器基类的构造函数，继承父类并初始化信息。
           * @param  {Object}  component  - 目标组件对象。
           * @param  {Object}  bindings   - 绑定信息。
           * @param  {Object}  options    - 初始化配置参数。
           * @memberOf fly.componentBinders.enabled.prototype
           */
          ctor: function(component, bindings, options) {
            this._super(component.element, bindings, options);
            this.component = component;
          },

          /**
           * 检测组件是否有 enable 的方法，获取对应的可用值，更新组件的可用性。
           * @memberOf fly.componentBinders.enabled.prototype
           */
          refresh: function() {
            if (this.component.enable) {
              this.component.enable(this.bindings.enabled.get());
            }
          }
        });

        /**
         * 组件不可用绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于不可用性的更新监听）。
         * @class
         * @memberOf fly
         * @alias fly.componentBinders.disabled
         */
        componentBinders.disabled = Binder.extend({

          /**
           * 组件不可用绑定器基类的构造函数，继承父类并初始化信息。
           * @param  {Object}  component  - 目标组件对象。
           * @param  {Object}  bindings   - 绑定信息。
           * @param  {Object}  options    - 初始化配置参数。
           * @memberOf fly.componentBinders.disabled.prototype
           */
          ctor: function(component, bindings, options) {
            this._super(component.element, bindings, options);
            this.component = component;
          },

          /**
           * 检测组件是否有 enable 的方法，获取对应的不可用值，更新组件的不可用性。
           * @memberOf fly.componentBinders.disabled.prototype
           */
          refresh: function() {
            if (this.component.enable) {
              this.component.enable(!this.bindings.disabled.get());
            }
          }
        });

        /**
         * 组件数据源绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于组件数据源的更新监听）。
         * @class
         * @memberOf fly
         * @alias fly.componentBinders.source
         */
        componentBinders.source = Binder.extend({

          /**
           * 组件数据源绑定器基类的构造函数，继承父类的并初始化相关配置信息、绑定相关事件。
           * @param  {Object}  component  - 组件对象。
           * @param  {Object}  bindings   - 绑定信息。
           * @param  {Object}  options    - 初始化配置参数。
           * @memberOf fly.componentBinders.source.prototype
           */
          ctor: function(component, bindings, options) {
            var that = this;
            that._super(component.element, bindings, options);

            that.component = component;
            that._dataBinding = proxy(that.dataBinding, that);
            that._dataBound = proxy(that.dataBound, that);
            that._itemChange = proxy(that.itemChange, that);
          },

          /**
           * 组件数据源内部单个成员数据的更新绑定。
           * @param  {Object}  e - 组件对象。
           * @memberOf fly.componentBinders.source.prototype
           */
          itemChange: function(e) {
            bindElement(e.item[0], e.data, [e.data].concat(this.bindings[SOURCE]._parents()));
          },

          /**
           * 解除组件与数据源的绑定。
           * @param  {Object}  e  - 组件对象。
           * @memberOf fly.componentBinders.source.prototype
           */
          dataBinding: function(e) {
            var idx,
              length,
              component = this.component,
              items = e.removedItems || component.items();

            for (idx = 0, length = items.length; idx < length; idx++) {
              unbindElementTree(items[idx]);
            }
          },

          /**
           * 将组件的元素与组件数据源进行绑定。
           * @param  {Object}  e  - 组件对象。
           * @memberOf fly.componentBinders.source.prototype
           */
          dataBound: function(e) {
            var idx,
              length,
              component = this.component,
              items = e.addedItems || component.items(),
              dataSource = component[DATASOURCE],
              view,
              parents;

            if (items.length) {
              view = e.addedDataItems || dataSource.view();
              parents = this.bindings[SOURCE]._parents();

              for (idx = 0, length = view.length; idx < length; idx++) {
                bindElement(items[idx], view[idx], [view[idx]].concat(
                  parents));
              }
            }
          },

          /**
           * 更新绑定在组件元素上的数据源。
           * @param  {Object}  e  - 组件对象。
           * @memberOf fly.componentBinders.source.prototype
           */
          refresh: function(e) {
            var that = this,
              source,
              component = that.component;

            e = e || {};

            if (!e.action) {
              that.destroy();

              component.bind("dataBinding", that._dataBinding);
              component.bind("dataBound", that._dataBound);
              component.bind("itemChange", that._itemChange);

              source = that.bindings[SOURCE].get();

              if (component[DATASOURCE] instanceof DataSource && component[DATASOURCE] !=
                source) {
                if (source instanceof DataSource) {
                  component[SETDATASOURCE](source);
                } else if (source && source._dataSource) {
                  component[SETDATASOURCE](source._dataSource);
                } else {
                  component[DATASOURCE].data(source);
                  // component instanceof ui.MultiSelect
                  if (that.bindings.value && ui.Select && (component instanceof ui.Select)) {
                    component.value(retrievePrimitiveValues(that.bindings.value.get(),
                      component.options.valueField));
                  }
                }
              }
            }
          },

          /**
           * 销毁组件上的事件监听绑定。
           * @param  {Object}  e  - 组件对象。
           * @memberOf fly.componentBinders.source.prototype
           */
          destroy: function() {
            var component = this.component;
            component.unbind("dataBinding", this._dataBinding);
            component.unbind("dataBound", this._dataBound);
            component.unbind("itemChange", this._itemChange);
          }
        });

        /**
         * 组件值绑定器基类，它继承了 Binder 的属性和方法。另外提供了 refresh 的方法（主要用于组件值的更新监听）和 destroy 方法（用于组件值更新的销毁绑定）。
         * @class
         * @memberOf fly
         * @alias fly.componentBinders.value
         */
        componentBinders.value = Binder.extend({

          /**
           * 组件值绑定器基类的构造函数，继承父类并初始化相关配置信息，绑定事件监听。
           * @param  {Object}  component  - 目标源DOM元素。
           * @param  {Object}  bindings   - 绑定信息。
           * @param  {Object}  options    - 初始化配置参数。
           * @memberOf fly.componentBinders.value.prototype
           */
          ctor: function(component, bindings, options) {
            this._super(component.element, bindings, options);
            this.component = component;
            this._change = proxy(this.change, this);
            this.component.first(CHANGE, this._change);

            var value = this.bindings.value.get();

            //value == null
            this._valueIsObservableObject = !options.valuePrimitive && value instanceof ObservableObject;
            this._valueIsObservableArray = value instanceof ObservableArray;
            this._initChange = false;
          },

          /**
           * 事件监听绑定。
           * @memberOf fly.componentBinders.value.prototype
           */
          change: function() {
            var value = this.component.value(),
              options = this.options,
              field = options.valueField || options.textField,
              isArray = $.isArray(value),
              isObservableObject = this._valueIsObservableObject,
              valueIndex, valueLength, values = [],
              sourceItem, sourceValue,
              idx, length, source;

            this._initChange = true;

            if (field) {

              if (this.bindings.source) {
                source = this.bindings.source.get();
              }

              if (value === '' && (isObservableObject || options.valuePrimitive)) {
                value = null;
              } else {
                if (!source || source instanceof DataSource) {
                  source = this.component.dataSource.view();
                }

                if (isArray) {
                  valueLength = value.length;
                  values = value.slice(0);
                }

                for (idx = 0, length = source.length; idx < length; idx++) {
                  sourceItem = source[idx];
                  sourceValue = sourceItem.get(field);

                  if (isArray) {
                    for (valueIndex = 0; valueIndex < valueLength; valueIndex++) {
                      if (sourceValue == values[valueIndex]) {
                        values[valueIndex] = sourceItem;
                        break;
                      }
                    }
                  } else if (sourceValue == value) {
                    value = isObservableObject ? sourceItem : sourceValue;
                    break;
                  }
                }

                if (values[0]) {
                  if (this._valueIsObservableArray) {
                    value = values;
                  } else if (isObservableObject || !field) {
                    value = values[0];
                  } else {
                    value = values[0].get(field);
                  }
                }
              }
            }

            this.bindings.value.set(value);
            this._initChange = false;
          },

          /**
           * 更新绑定组件元素上的值。
           * @memberOf fly.componentBinders.value.prototype
           */
          refresh: function() {
            if (!this._initChange) {
              var component = this.component,
                options = this.options,
                textField = options.textField,
                valueField = options.valueField || textField,
                value = this.bindings.value.get(),
                text = options.text || '',
                idx = 0,
                values = [],
                length;

              if (value === undefined) {
                value = null;
              }

              if (valueField) {
                if (value instanceof ObservableArray) {
                  for (length = value.length; idx < length; idx++) {
                    values[idx] = value[idx].get ? value[idx].get(valueField) : value[idx];
                  }
                  value = values;
                } else if (value instanceof ObservableObject) {
                  text = value.get(textField);
                  value = value.get(valueField);
                }
              }

              if (component.options.autoBind === false && component.listView && !component
                .listView.isBound()) {
                if (textField === valueField && !text) {
                  text = value;
                }

                component._preselect(value, text);
              } else {
                component.value(value);
              }
            }

            this._initChange = false;
          },

          /**
           * 销毁组件元素上的值的事件监听绑定。
           * @memberOf fly.componentBinders.value.prototype
           */
          destroy: function() {
            this.component.unbind(CHANGE, this._change);
          }
        });

        /**
         * 解析绑定属性。
         * @private
         * @param  {String} bind - 组件上data-bind的属性值。
         * @return {Object} 解析后的绑定信息。
         * @example
         * // {value:"testVal"}
         * parseBindings("value:testVal");
         */
        function parseBindings(bind) {
          var result = {},
            idx,
            length,
            token,
            colonIndex,
            key,
            value,
            tokens;

          tokens = bind.match(regKeyValue);

          for (idx = 0, length = tokens.length; idx < length; idx++) {
            token = tokens[idx];
            colonIndex = token.indexOf(":");

            key = token.substring(0, colonIndex);
            value = token.substring(colonIndex + 1);

            if (value.charAt(0) == "{") {
              value = parseBindings(value);
            }

            result[key] = value;
          }

          return result;
        }

        /**
         * 将绑定信息实例化成绑定信息对象。
         * @private
         * @param  {Object}          bindings - 绑定信息。
         * @param  {Object | Array}  source   - 试图模型。
         * @param  {Function}        type     - 绑定构造函数。
         * @result {Object} 绑定信息对象（拥有传入的type构造函数的属性和方法的对象）。
         */
        function createBindings(bindings, source, type) {
          var binding,
            result = {};

          for (binding in bindings) {
            result[binding] = new type(source, bindings[binding]);
          }

          return result;
        }

        /**
         * 根据元素的组件名和绑定信息，解析对应的值，将视图模型绑定到元素上。
         * @private
         * @param  {Object}  element    - 绑定元素。
         * @param  {Object}  source     - 视图模型。
         * @param  {Object}  parents    - 绑定元素的父级数据对象。
         * @param  {Object}  deepBefore - 是否深度查找对元素的孩子节点进行绑定。
         */
        function bindElement(element, source, parents, deepBefore) {
          var role = element.getAttribute("data-role"),
            bind = element.getAttribute("data-bind"),
            node = element.nodeName.toLowerCase(),
            children = element.children,
            childrenCopy = [],
            deep = true,
            bindings,
            options = {},
            idx,
            target;

          parents = parents || [source];

          if (deepBefore === undefined && (!bind || bind && bind.indexOf('source:') < 0)) {
            deepBefore = true;
          }

          if (node.indexOf('fly:') === 0) {
            node = node.substring(4);
          }

          if (!role && fly.ui[node]) {
            role = node;
          }

          if (role || bind) {
            unbindElement(element);
          }

          if (deepBefore && deep && children.length) {
            for (idx = 0; idx < children.length; idx++) {
              childrenCopy[idx] = children[idx];
            }

            for (idx = 0; idx < childrenCopy.length; idx++) {
              if (!childrenCopy[idx].binded) {
                bindElement(childrenCopy[idx], source, parents);
              }
            }
          }

          if (role) {
            target = bindingTargetForRole(element, role);
            element = target.target.element;
            children = element.children;
          }

          if (bind) {
            bind = parseBindings(bind.replace(regWhiteSpace, ''));

            if (!target) {
              options = fly.parseOptions(element, {
                textField: '',
                valueField: '',
                template: '',
                valueUpdate: CHANGE,
                valuePrimitive: false,
                itemChange: true,
                autoBind: true
              });
              target = new BindingTarget(element, options);
            }

            target.source = source;

            bindings = createBindings(bind, parents, Binding);

            if (options.template) {
              bindings.template = new TemplateBinding(parents, '', options.template);
            }

            if (bindings.click) {
              bind.events = bind.events || {};
              bind.events.click = bind.click;
              bindings.click.destroy();
              delete bindings.click;
            }

            if (bindings.source) {
              deep = false;
            }

            if (bind.attr) {
              bindings.attr = createBindings(bind.attr, parents, Binding);
            }

            if (bind.style) {
              bindings.style = createBindings(bind.style, parents, Binding);
            }

            if (bind.events) {
              bindings.events = createBindings(bind.events, parents,
                EventBinding);
            }

            if (bind.css) {
              bindings.css = createBindings(bind.css, parents, Binding);
            }

            target.bind(bindings);
          }

          if (target) {
            element.flyBindingTarget = target;
          }

          // 遍历子节点深度绑定
          if (!deepBefore && deep && children) {
            for (idx = 0; idx < children.length; idx++) {
              childrenCopy[idx] = children[idx];
            }

            for (idx = 0; idx < childrenCopy.length; idx++) {
              bindElement(childrenCopy[idx], source, parents);
            }
          }
        }

        /**
         * 解除元素上所有绑定。
         * @private
         */
        function unbindElement(element) {
          var bindingTarget = element.flyBindingTarget,
            handler = element.handler;

          if (bindingTarget) {
            bindingTarget.destroy();
            fly.deleteExpando(element, 'flyBindingTarget');
          }

          if (handler) {
            handler.destroy();
          }
        }

        /**
         * 解除元素及其孩子节点的绑定。
         * @private
         */
        function unbindElementTree(element) {
          unbindElement(element);
          unbindElementChildren(element);
        }

        /**
         * 解除元素孩子节点上的所有绑定。
         * @private
         */
        function unbindElementChildren(element) {
          var children = element.children;

          if (children) {
            for (var idx = 0, length = children.length; idx < length; idx++) {
              unbindElementTree(children[idx]);
            }
          }
        }

        /**
         * 解除指定的DOM元素及其孩子节点上的所有绑定。
         * @memberOf fly
         * @param {Object} dom - DOM元素。
         */
        function unbind(dom) {
          var idx, length;

          if (!dom) return;
          if (fly.isDOM(dom)) {
            dom = [dom];
          }

          for (idx = 0, length = dom.length; idx < length; idx++) {
            unbindElementTree(dom[idx]);
          }
        }

        /**
         * 将指定的DOM元素和视图模型进行绑定。
         * @memberOf fly
         * @param {Object}         dom    - DOM元素。
         * @param {Object | Array} object - 视图模型。
         * @param {Boolean}        deepBefore - 是否深度查找对元素的孩子节点进行绑定。
         */
        function bind(dom, object, deepBefore) {
          var idx,
            length,
            node

          if (!dom) return;

          if (fly.isDOM(dom)) {
            dom = [dom];
          }

          for (idx = 0, length = dom.length; idx < length; idx++) {
            node = dom[idx];
            if (node.nodeType === 1) {
              bindElement(node, object, deepBefore);
            }
          }
        }

        /**
         * 判断组件对象中是否有视图模型，存在则将组件元素和视图模型进行绑定。
         * @memberOf fly
         * @param {Object}  component  - 组件对象。
         */
        function notify(component) {
          var element = component.element,
            bindingTarget = element.flyBindingTarget;

          if (bindingTarget) {
            bind(element, bindingTarget.source);
          }
        }

        /**
         * 根据值字段名称和值获取最终值，若没有值字段名则直接返回值。若有则根据值字段名取值。
         * @private
         * @param  {*}       value       - 值。
         * @param  {String}  valueField  - 值字段名称。
         * @return {*} 最终值。
         */
        function retrievePrimitiveValues(value, valueField) {
          var values = [];
          var idx = 0;
          var length;
          var item;

          if (!valueField) {
            return value;
          }

          if (value instanceof ObservableArray) {
            for (length = value.length; idx < length; idx++) {
              item = value[idx];
              values[idx] = item.get ? item.get(valueField) : item[valueField];
            }
            value = values;
          } else if (value instanceof ObservableObject) {
            value = value.get(valueField);
          }

          return value;
        }

        /**
         * 根据组件元素及名称实例化组件。
         * @private
         * @param  {Object}  element - 组件元素。
         * @param  {String}  role    - 组件角色名称。
         * @return {Object}  实例化组件对象。
         */
        function bindingTargetForRole(element, role) {
          var component = ui.component(element, {}, role);

          if (component) {
            return new ComponentBindingTarget(component);
          }
        }

        fly.bind = bind;
        fly.unbind = unbind;
        fly.notify = notify;
        fly.binders = binders;
        fly.Binder = Binder;
        fly.ComponentBinder = ComponentBinder;

        module.exports = bind;

      }, {
        "./fly.component": 3,
        "./fly.core": 4,
        "./fly.data": 5,
        "./fly.format": 6,
        "./fly.template": 14,
        "./fly.utils": 15
      }
    ],
    3: [
      function(_require, module, exports) {
        /**
         * @file 组件
         * @author huanzhang
         */

        'use strict';

        /**
         * @namespace fly
         */

        // 依赖模块
        var fly = _require('./fly.core'),
          Observable = _require('./fly.observable'),
          utils = _require('./fly.utils'),
          DataSource = _require('./fly.data'),
          $ = fly.$,
          NS = fly.NS,
          ui = fly.ui,
          proxy = $.proxy,
          slice = [].slice;

        //静态变量
        var STRING = 'string',
          ROLE = 'role',
          HANDLER = 'handler',
          PROGRESS = 'progress',
          ERROR = 'error',
          CHANGE = 'change';

        //默认校验属性
        var validateAttr = {
          required: true,
          min: true,
          max: true,
          step: true,
          type: true,
          pattern: true,
          key: true,
          title: true,
          name: true
        };

        /**
         * 通用组件基类，将自定义的标签渲染出自定义的模板，执行自定义的功能。组件的共同的特点是小型、可复用。它继承了 ObservableObject 的属性和方法。
         * @see fly.Observable.js
         * @class
         * @memberOf fly
         * @alias fly.Component
         */
        var Component = fly.ObservableObject.extend({

          /**
           * Component 类的构造函数，给每个组件的内部绑定了一个视图模型并注册了事件监听。
           * @memberOf fly.Component.prototype
           * @param  {Object}  element - 自定义组件元素。
           * @param  {Object}  options - 定义在组件上的静态属性。
           * @param  {Boolean} cache   - 是否缓存组件实例。当 cache 不等于 false 时候，会把组件实例缓存在 element.handler的属性上。
           */
          ctor: function(element, options, cache) {
            var that = this,
              dataSource,
              dataset;

            if (!element) {
              return;
            };
            if (!element.nodeType && element.length) {
              element = element[0];
            }

            that._events = {};
            options = options || {};
            dataSource = options.dataSource || null;
            that.element = element;

            // 扩展 options
            // 因为 dataSource 比较特殊，不参与 extend
            // dataSource && delete options.dataSource;
            dataSource ? options.dataSource = null : options.dataSource = options.dataSource;
            dataset = fly.dataset(element);
            dataset.bind && delete(dataset.bind);
            // dataset.bind = null;
            options = new fly.ObservableObject($.extend(true, {}, that.options, options));
            that.set('options', options);
            if (dataSource) {
              that.options.dataSource = dataSource;
            }

            that._super();
            that._render();
            that._dataSource();
            element = that.element;

            // 将组件实例绑定到element
            if (that.template) {
              fly.bind(element, that, false);
              element['binded'] = true;
            }

            // 存在 jQuery 的话，就愉快的玩耍
            if (typeof(jQuery) !== 'undefined') {
              that.$element = jQuery(element);
            }

            // 将组件实例缓存
            if (cache !== false) {
              // element[ROLE] = name.toLowerCase();
              // element[NS + name] = that;
              element[HANDLER] = that;
            }

            // 绑定事件
            // 触发 options 中对应的事件
            that.bind(that.events, options);
          },

          events: [],

          options: {
            autoBind: true
          },

          // template: fly.template('<div></div>'),

          /**
           * 检测是否存在绑定目标。
           * @memberOf fly.Component.prototype
           * @private
           * @return {boolean} 返回存在结果，true 表示存在，false 表示不存在。
           */
          _hasBindingTarget: function() {
            return !!this.element.flyBindingTarget;
          },

          /**
           * @todo 将元素的 tabindex 转移到组件上
           * @memberOf fly.Component.prototype
           * @private
           * @param  {Object} target 目标元素
           */
          _tabindex: function(target) {

          },

          /**
           * 重新设置数据源。
           * @memberOf fly.Component.prototype
           * @param  {DataSource} dataSource - 新的数据源。
           * @return {DataSource} 新的数据源。
           */
          setDataSource: function(dataSource) {
            this.options.dataSource = dataSource;
            this._dataSource();
            if (this.options.autoBind !== false) {
              dataSource.fetch();
            }
          },

          /**
           * 解除数据源上的事件绑定。
           * @private
           * @memberOf fly.Component.prototype
           */
          _unbindDataSource: function() {
            this.dataSource.unbind(CHANGE, this._refreshHandler)
              .unbind(PROGRESS, this._progressHandler)
              .unbind(ERROR, this._errorHandler);
          },

          /**
           * 数据源设置及事件绑定，将组件的 refresh 方法绑定到数据源更新方法上，progress 方法绑定到数据源进度方法上，error 方法绑定到数据源失败方法上。
           * @private
           * @memberOf fly.Component.prototype
           */
          _dataSource: function() {
            var that = this,
              dataSource;

            if (that.dataSource && that._refreshHandler) {
              that._unbindDataSource();
            } else {
              that._refreshHandler = proxy(that.refresh || $.noop, that);
              that._progressHandler = proxy(that.progress || $.noop, that);
              that._errorHandler = proxy(that.error || $.noop, that);
            }

            dataSource = DataSource.create(that.options.dataSource)
              .bind(CHANGE, that._refreshHandler)
              .bind(PROGRESS, that._progressHandler)
              .bind(ERROR, that._errorHandler);

            that.set('dataSource', dataSource);
          },

          /**
           * 重新设置组件配置参数。
           * @memberOf fly.Component.prototype
           * @param  {Object} options - 新的配置参数。
           */
          setOptions: function(options) {
            this._setEvents(options);
            $.extend(this.options, options);
          },

          /**
           * 设置及绑定组件事件的监听。
           * @private
           * @memberOf fly.Component.prototype
           * @param  {Object} options - 配置参数。
           */
          _setEvents: function(options) {
            var that = this,
              idx = 0,
              length = that.events.length,
              e;

            for (; idx < length; idx++) {
              e = that.events[idx];
              if (that.options[e] && options[e]) {
                that.unbind(e, that.options[e]);
              }
            }

            that.bind(that.events, options);
          },

          /**
           * 重置组件大小（可见的宽度和高度）。
           * @memberOf fly.Component.prototype
           * @param  {boolean} force - 是否强制重置。当为 true 时表示强制重置，为 false 时会判断当前大小是否与缓存的大小一样，不一样的时候才会重置。
           */
          resize: function(force) {
            var size = this.getSize(),
              currentSize = this._size;

            if (force || (size.width > 0 || size.height > 0) && (!currentSize || size.width !==
              currentSize.width || size.height !== currentSize.height)) {
              this._size = size;
              this._resize(size, force);
              this.trigger('resize', size);
            }
          },

          /**
           * 获取组件大小（可见的宽度和高度）。
           * @memberOf fly.Component.prototype
           * @return {Object} width 是对象的可见宽度，height 是对象的可见高度。
           */
          getSize: function() {
            var element = this.element;
            return {
              width: element.offsetWidth,
              height: element.offsetHeight
            };
          },

          /**
           * 获取/设置组件大小（可见的宽度和高度）。
           * @memberOf fly.Component.prototype
           * @param  {Object}  [size] - 组件新的大小。当不传入参数时，表示获取组件当前的大小。
           * @return {Object}  当不传入参数时，返回组件当前的大小。
           */
          size: function(size) {
            if (!size) {
              return this.getSize();
            } else {
              this.setSize(size);
            }
          },

          /**
           * 设置组件大小（可见的宽度和高度）。
           * @memberOf fly.Component.prototype
           * @function
           */
          setSize: $.noop,

          _resize: $.noop,

          /**
           * 获取数据源的数据。
           * @memberOf fly.Component.prototype
           * @return 组件上有绑定数据源，则返回数据源的数据。
           */
          dataItems: function() {
            return this.dataSource && this.dataSource.view();
          },

          /**
           * 对组件标签进行解析，渲染自定义模板，获取定义的静态属性。
           * @memberOf fly.Component.prototype
           * @private
           */
          _render: function() {
            var that = this,
              element = that.element,
              options = that.options,
              template = that.template,
              cacheWrapper = document.createElement('div'),
              tagName = fly.support.browser.ie < 9 ? 'content' : 'FLY:CONTENT',
              oFragment,
              newElement,
              newContent;

            if (template) {
              that._getAttribute();
              options = $.extend(true, options, that.__validate);
              oFragment = document.createDocumentFragment();
              newElement = $(typeof template === 'string' ? template : template(options));
              if (newElement.length) {
                newElement = newElement[0];
              }
              element.parentNode.insertBefore(newElement, element);

              var onlyContent = newElement.nodeName == tagName;
              newContent = onlyContent ? newElement :
                newElement.getElementsByTagName(tagName)[0];

              while (element.childNodes.length) {
                element.firstChild.setAttribute && element.firstChild.setAttribute(
                  'binded', 'true');
                oFragment.appendChild(element.firstChild);
              }

              if (oFragment.childNodes.length) {
                cacheWrapper.appendChild(oFragment.cloneNode(true));
                that.set('content', cacheWrapper.innerHTML);
              }

              if (onlyContent) {
                that.element = oFragment.firstElementChild || oFragment.firstChild;
              } else {
                that.element = newElement;
              }

              if (newContent) {
                newContent.parentNode.insertBefore(oFragment, newContent);
                newContent.parentNode.removeChild(newContent);
              }

              cacheWrapper = null;
              element.parentNode.removeChild(element);
              that._setAttribute();
            }
          },

          /**
           * 获取在标签上定义的静态属性和校验属性。
           * @private
           * @memberOf fly.Component.prototype
           * @return 静态属性赋值于私有变量 __attrs 中缓存，校验属性赋值于私有变量 __validate 中缓存。
           */
          _getAttribute: function() {
            var element = this.element,
              attrs = {},
              validate = {};
            $.each(element.attributes, function(i, item) {
              if (item.name !== 'data-bind' && item.name !== 'data-role') {
                attrs[item.name] = item.value;
              }
              if (validateAttr[item.name]) {
                validate[item.name] = item.value;
              }
            });
            this.__attrs = attrs;
            this.__validate = validate;
          },

          /**
           * 将缓存池中的静态属性赋值给解析后的元素。
           * @private
           * @memberOf fly.Component.prototype
           */
          _setAttribute: function() {
            var element = this.element;
            $.each(this.__attrs, function(key, value) {
              if (key == 'class') {
                fly.addClass(element, value);
              } else {
                element.setAttribute(key, value);
              }
            });
          },

          /**
           * 使用 fly.bind() 方法绑定给定的视图模型。当传入2个参数时，表示元素和视图模型；当传入1个参数时，则为视图模型，元素则默认为当前组件元素。
           * @param {Object} [element] - 绑定元素。
           * @param {Object} vm        - 视图模型。
           * @memberOf fly.Component.prototype
           */
          bindViewModel: function(element, vm) {
            if (!vm) {
              vm = element;
              element = this.element;
            }
            fly.bind(element, vm);
          },


          /**
           * 组件销毁方法。销毁组件的方法、名称、角色及所有绑定。
           * @param {Object} component - 销毁的组件，不传入表示销毁本身。
           * @memberOf fly.Component.prototype
           */
          destroy: function(component) {
            var component = component || this,
              element = component.element,
              name = NS + component.name;
            if (!element) return;
            fly.deleteExpando(element, name);
            fly.deleteExpando(element, HANDLER);
            fly.deleteExpando(element, ROLE);
            fly.unbind(element);
          }

        });


        /**
         * 实例化组件，使用该方法可以实例化已知的组件。
         * @memberOf fly
         * @alias ui.component
         * @param  {Object} element - 元素。
         * @param  {Object} options - 配置参数。
         * @param  {Object} roles   - 已知组件名称。
         * @example
         * new fly.ui.component(element, options, role);
         * @return {Object}  实例化的组件。
         */
        ui.component = function(element, options, role) {
          var result,
            component,
            value,
            dataSource;

          component = ui[role];

          if (!component) return;

          var name = component.fn.name || role.replace(role.charAt(0), role.charAt(0).toUpperCase());
          var keyName = 'fly' + name;
          var keyRegExp = new RegExp('^' + keyName + '$', 'i');

          for (var key in element) {
            if (key.match(keyRegExp)) {
              if (key === keyName) {
                result = element[key];
              } else {
                return element[key];
              }
              break;
            }
          }

          dataSource = fly.parseOption(element, 'dataSource');

          options = $.extend({}, fly.parseOptions(element, component.fn.options), options);

          if (dataSource) {
            if (typeof dataSource === STRING) {
              options.dataSource = fly.getter(dataSource)(window);
            } else {
              options.dataSource = dataSource;
            }
          }

          // 调用全局事件
          // for (var idx = 0, events = component.fn.events, length = events.length, option; idx <
          //     length; idx++) {
          //     option = events[idx];
          //     value = fly.parseOption(element, option);
          //     if (value !== undefined) {
          //         options[option] = fly.getter(value)(window);
          //     }
          // }

          if (!result) {
            result = new component(element, options);
          } else if (!$.isEmptyObject(options)) {
            result.setOptions(options);
          }

          return result;
        };


        /**
         * 将组件注册到fly.ui的命名空间下。
         * @private
         * @param   {Object} MyComponent - 组件。
         * @param   {String} name        - 组件名。
         */
        fly.component = function(MyComponent, name) {
          fly.ui[(name || MyComponent.fn.name).toLowerCase()] = MyComponent;
        };

        fly.Component = Component;
        module.exports = Component;

      }, {
        "./fly.core": 4,
        "./fly.data": 5,
        "./fly.observable": 11,
        "./fly.utils": 15
      }
    ],
    4: [
      function(_require, module, exports) {
        /**
         * 基础代码
         * @author: huanzhang
         * @email: huanzhang@iflytek.com
         * @update: 2015-06-01 15:20
         */

        // 'use strict';
        // 因为callee，这里不能使用严格模式

        // 基础jQuery工具方法
        var $ = _require('./fly.jquery');

        // 特性检测
        var support = _require('./fly.support');

        var win = window,
          FUNCTION = 'function',
          CTOR = 'ctor',
          roperator = /(!|\+|-|\*|\/)+/g,
          rexpression = /^[a-zA-Z_]{1}[a-zA-Z0-9_.]{1,}$/,
          getterCache = {},
          setterCache = {};

        /**
         * 基类构造函数。
         * @class
         * @alias fly.Class
         * @memberOf fly
         * @example
         * var Person = fly.Class({});
         */
        var Class = function() {};

        /**
         * 定义监听对象的简化写法，
         * @namespace fly
         * @see 关于监听对象，可查看：{@link http://www.flyui.cn/v1/docs/base/observable.html}
         * @param  {Object | Array} vm - 视图模型
         * @return 被fly监听的视图模型。
         */
        var fly = function(vm) {
          return fly.observable(vm);
        };

        /**
         * 常用的键盘键值集合。
         * @memberOf fly
         * @example
         * // {DELETE: 46,BACKSPACE: 8,TAB: 9,ENTER: 13,ESC: 27,LEFT: 37,UP: 38,RIGHT: 39,
         * // DOWN: 40,END: 35,HOME: 36,SPACEBAR: 32,PAGEUP: 33,PAGEDOWN: 34}
         * fly.keys
         * @example
         * // 9
         * fly.keys.TAB
         * @return {Number} 获取到对应的键值。
         */
        fly.keys = {
          DELETE: 46,
          BACKSPACE: 8,
          TAB: 9,
          ENTER: 13,
          ESC: 27,
          LEFT: 37,
          UP: 38,
          RIGHT: 39,
          DOWN: 40,
          END: 35,
          HOME: 36,
          SPACEBAR: 32,
          PAGEUP: 33,
          PAGEDOWN: 34
        };

        var fnTest = /xyz/.test(function() {
          xyz;
        }) ? /\b_super\b/ : /.*/;

        /**
         * 基础类的继承方法，可以继承父类的所有属性和方法。
         * @see 参考文献：John Resig Class.js
         * @param   {Object} prop -  新创建类的属性和方法
         * @param   {Function} prop.ctor -  ctor方法专用于扩展和继承父类，通过使用this._super()访问父类的构造函数
         * @return  {Object} 继承父类的所有属性和方法后的子类。
         */
        Class.extend = function(prop) {

          var _super = this.prototype;

          // 父类的实例赋给变量prototype
          var prototype = new this();

          // 把要扩展的属性复制到prototype变量上
          for (var name in prop) {
            // this._super访问父类的实例
            // name == CTOR
            prototype[name] = typeof prop[name] == FUNCTION &&
              typeof _super[name] == FUNCTION && fnTest.test(prop[name]) ?
              (function(name, fn) {
              return function() {
                // 备份this._super
                var tmp = this._super;
                // 替换成父类的同名ctor方法
                this._super = _super[name];
                // 此时fn中的this里面的this._super已经换成了_super[name],即父类的同名方法
                var ret = fn.apply(this, arguments);
                // 把备份的还原回去
                this._super = tmp;
                return ret;
              };
            })(name, prop[name]) :
              prop[name];
          }

          // 假的构造函数
          function Class() {
            // 执行真正的构造函数
            this[CTOR].apply(this, arguments);
          }

          // 继承父类的静态属性
          for (var key in this) {
            if (this.hasOwnProperty(key) && key != 'extend')
              Class[key] = this[key];
          }

          // 子类的原型指向父类的实例
          Class.prototype = prototype;

          // 父类的实例
          // 这样做不太好，还是去掉
          // Class.prototype._super = new this();

          // 覆盖父类的静态属性
          if (prop.statics) {
            for (var name in prop.statics) {
              if (prop.statics.hasOwnProperty(name)) {
                Class[name] = prop.statics[name];
                if (name == CTOR) {
                  Class[name]();
                }
              }
            }
          }

          Class.prototype.constructor = Class;

          // 原型可扩展
          Class.extendPrototype = function(prop) {
            for (var name in prop) {
              prototype[name] = prop[name];
            }
          };

          Class.fn = Class.prototype;
          // 任何Class.extend的返回对象都将具备extend方法
          Class.extend = arguments.callee;

          return Class;
        };


        /**
         * 生成标准的GUID，GUID特点：32位数字加字母拼凑的字符串，随机生成的可以作为唯一性标识。
         * @memberOf fly
         * @example
         * // "49004DA8-2BB8-4ACF-B4D7-9C98C4A9525C"
         * fly.guid()
         * @return {String} 随机生成的32位GUID字符串。
         */
        fly.guid = function() {
          var originStr = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
          return originStr.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
              v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          }).toUpperCase();
        };

        /**
         * 恒等判断。
         * @memberOf fly
         * @todo 待实现
         * @param {*} o - 接受任何形式的参数输入
         */
        fly.identity = function(o) {
          return o;
        }

        /**
         * 构建表达式，fly 中用于构建缓存池中值的获取表达式。
         * @memberOf fly
         * @param   {String}  [expression=''] - 表达式，默认为空
         * @param   {Boolean} safe            - 是否构建安全的表达式
         * @param   {String}  paramName       - 参数名
         * @example
         * // "(b.a)"
         * fly.expr("a",true,'b')
         * @example
         * // "((b.fly || {}).a)"
         * fly.expr("fly.a",true,'b')
         * @return  {String}  构建后的表达式。
         */
        fly.expr = function(expression, safe, paramName) {
          expression = expression || '';

          if (typeof safe == 'string') {
            paramName = safe;
            safe = false;
          }

          paramName = paramName || 'd';

          if (expression && expression.charAt(0) !== '[') {
            expression = '.' + expression;
          }

          if (safe) {
            expression = expression.replace(/"([^.]*)\.([^"]*)"/g,
              '"$1_$DOT$_$2"');
            expression = expression.replace(/'([^.]*)\.([^']*)'/g,
              "'$1_$DOT$_$2'");
            expression = wrapExpression(expression.split('.'), paramName);
            expression = expression.replace(/_\$DOT\$_/g, '.');
          } else {
            expression = paramName + expression;
          }

          return expression;
        }

        /**
         * 从缓存池中获取对应值的表达式：fly 获取值时会先从 getterCache 缓存池中获取，如果有值则直接获取，无值则构建获取值表达式至缓存池中。
         * @memberOf fly
         * @param   {String}   expression - 表达式
         * @param   {Boolean}  safe       - 是否安全
         * @return  {Function} 解析的表达式函数。
         */
        fly.getter = function(expression, safe) {
          var key = expression + safe;
          return getterCache[key] = getterCache[key] ||
            new Function('d', 'return ' + fly.expr(expression, safe));
        }

        /**
         * 构建赋值表达式至缓存池：fly 设置值的同时会在 setterCache 缓存池中设置对应的值赋值表达式。
         * @memberOf fly
         * @param   {String}   expression - 表达式
         * @return  {Function} 解析的表达式的函数。
         */
        fly.setter = function(expression) {
          return setterCache[expression] = setterCache[expression] ||
            new Function('d, value', fly.expr(expression) + '=value');
        }


        /**
         * 构建读取属性值的表达式。
         * @memberOf fly
         * @private
         * @param   {Array}  members   - 成员
         * @param   {String} paramName - 参数名
         * @example
         * // "((c.a || {}).b)"
         * wrapExpression(['a','b'],'c')
         * @return  {String} 拼装好的表达式
         */
        function wrapExpression(members, paramName) {
          var result = paramName || 'd',
            index,
            idx,
            length,
            member,
            count = 1;

          for (idx = 0, length = members.length; idx < length; idx++) {
            member = members[idx];
            if (member !== '') {
              index = member.indexOf('[');

              if (index !== 0) {
                if (index == -1) {
                  member = '.' + member;
                } else {
                  count++;
                  member = '.' + member.substring(0, index) + ' || {})' +
                    member.substring(index);
                }
              }

              count++;
              result += member + ((idx < length - 1) ? ' || {})' : ')');
            }
          }
          return new Array(count).join('(') + result;
        };

        // 命名空间
        fly.NS = 'fly';
        fly.$ = win.jQuery || $;
        fly.win = win;
        fly.Class = Class;
        fly.support = support;
        fly.ui = {
          roles: {},
          defaults: {}
        };

        module.exports = fly;
      }, {
        "./fly.jquery": 7,
        "./fly.support": 13
      }
    ],
    5: [
      function(_require, module, exports) {
        /**
         * @file 数据对象
         * @author: huanzhang
         */

        'use strict';

        /**
         * @namespace fly
         */

        var fly = _require('./fly.core'),
          ajax = _require('./fly.ajax'),
          ob = _require('./fly.observable'),
          Model = _require('./fly.model'),
          format = _require('./fly.format');

        var Class = fly.Class,
          Observable = fly.Observable,
          ObservableObject = fly.ObservableObject,
          ObservableArray = fly.ObservableArray,
          LazyObservableArray = fly.LazyObservableArray,
          identity = fly.identity,
          getter = fly.getter,
          $ = fly.$,
          each = $.each,
          map = $.map,
          proxy = $.proxy,
          extend = $.extend,
          isEmptyObject = $.isEmptyObject,
          isPlainObject = $.isPlainObject,
          isFunction = $.isFunction,
          isNumber = $.isNumeric,
          isArray = $.isArray,
          grep = $.grep,
          noop = $.noop,
          Deferred = $.Deferred,
          slice = [].slice,
          math = Math;

        // 静态变量
        var FUNCTION = 'function',
          STRING = 'string',
          CHANGE = 'change',
          CREATE = 'create',
          READ = 'read',
          UPDATE = 'update',
          DESTROY = 'destroy',
          ERROR = 'error',
          REQUESTSTART = 'requestStart',
          PROGRESS = 'progress',
          REQUESTEND = 'requestEnd',
          EMPTY = 'empty',
          PUSH = 'push',
          CRUD = [CREATE, READ, UPDATE, DESTROY],
          ARR = '[object Array]';

        // 操作符转换
        var operatorMap = {
          '==': 'eq',
          '!=': 'neq',
          '<': 'lt',
          '<=': 'lte',
          '>': 'gt',
          '>=': 'gte',
          notsubstringof: 'doesnotcontain'
        };

        // 正则
        var dateRegExp = /^\/Date\((.*?)\)\/$/,
          newLineRegExp = /(\r+|\n+)/g,
          quoteRegExp = /(?=['\\])/g;


        /**
         * DataSource（数据源），数据源是整个fly Web应用程序的核心部分，它可以使用本地数据（javaScipt数组）和远程数据（web service返回的JSON、JSONP和XML）
         * @class
         * @augments {Observable}
         * @memberOf fly
         * @alias fly.DataSource
         */
        var DataSource = Observable.extend({

          /**
           * 构造函数，构造数据源
           * @memberOf fly.DataSource.prototype
           * @param {Object}             options          - 数据源的组成部分
           * @param {(String | Array)}   options.data     - 表示数据源服务地址的URL或本地数组
           * @param {Object}             opitons.read     - 远程数据接口
           * @param {Boolean}            options.server   - 是否启用从服务端拉取数据
           * @param {Number}             options.page     - 当前的页面数
           * @param {Number}             options.pageSize - 启用分页模式，每页展示信息条数
           * @param {(String | Array)}   options.sort     - 对数据进行排序的字段
           * @param {(Array | Object)}   options.filter   - 对数据进行过滤条件
           */
          ctor: function(options) {
            if (!options) return;

            if (isArray(options)) {
              options = {
                data: options
              };
            }

            var that = this,
              options = options || {},
              data = options.data,
              read = options.read,
              model;

            // 兼容老版本的写法
            if (data && data.url) {
              read = data;
            } else if (typeof data == STRING) {
              read = {
                url: data
              };
            } else if (isArray(data)) {
              options.server = false;
              options.pageMode = 0;
            }

            // 继承options
            options = that.options = extend({}, that.options, options);

            that._map = {};
            that._prefetch = {}; // 预拉取
            that._data = []; // 初始数据
            that._pristineData = []; // 关键数据
            that._ranges = [];
            that._view = [];
            that._pristineTotal = 0;
            that._destroyed = []; // 已销毁
            that._pageSize = options.pageSize;
            that._page = options.page || (options.pageSize ? 1 : undefined); // 当前页码
            that._sort = normalizeSort(options.sort);
            that._filter = normalizeFilter(options.filter);
            that._total = options.total;

            that._shouldDetachObservableParents = true;

            that._super();

            that.transport = Transport.create(options, that);

            // if (isFunction(that.transport.push)) {
            //     that.transport.push({
            //         pushCreate: proxy(that._pushCreate, that),
            //         pushUpdate: proxy(that._pushUpdate, that),
            //         pushDestroy: proxy(that._pushDestroy, that)
            //     });
            // }

            that.reader = new DataReader(options.model, options.modelBase, read ||
              options.childrenField);

            model = that.reader.model || {};

            that._detachObservableParents();

            that._data = that._observe(that._data);

            // 是否支持离线缓存
            that._online = true;

            that.bind([ERROR, CHANGE, REQUESTSTART, REQUESTEND, PROGRESS], options);
          },

          options: {
            data: null,
            interface: {},
            server: {
              page: true,
              sort: false,
              filter: true
            },
            pageMode: {
              page: 'currentPageNo',
              size: 'pageSize'
            }
          },

          /**
           * 返回父级上下文的函数
           * @type {Function}
           * @memberOf fly.DataSource.prototype
           */
          parent: noop,

          /**
           * 从当前DataSource实例对象中获取字段名key和对应值id的元素
           * @param   {String} id - 值
           * @param   {String} [key='uid'] - 字段名
           * @returns {Object} 符合条件的data
           * @memberOf fly.DataSource.prototype
           */
          get: function(id, key) {
            var data = this._data,
              key = key || 'uid',
              idx,
              length;

            for (idx = 0, length = data.length; idx < length; idx++) {
              if (data[idx][key] == id) {
                return data[idx];
              }
            }
          },

          /**
           * 从当前DataSource实例对象中获取指定元素的索引，找不到返回-1
           * @param  {DataSource} model - DataSource实例对象元素
           * @return {Number} 元素所在DataSource实例对象的索引值，找不到时返回-1
           * @memberOf fly.DataSource.prototype
           */
          indexOf: function(model) {
            return indexOfModel(this._data, model);
          },

          /**
           * 从当前DataSource实例对象获取索引值为index的数据
           * @param  {Number} index - 数据的索引值
           * @return {(Observable | ObservableObject | ObservableArray)} 索引值为index的数据
           * @memberOf fly.DataSource.prototype
           */
          at: function(index) {
            return this._data.at(index);
          },

          /**
           * 替换数据源数据
           * @param  {Array} value - 用来替换数据源的数据
           * @return {Array} 数据源的新数据
           * @memberOf fly.DataSource.prototype
           */
          data: function(value) {
            var that = this;
            if (value !== undefined) {
              that._detachObservableParents();
              that._data = this._observe(value);

              that._pristineData = value.slice(0);

              that._storeData();

              that._ranges = [];
              that.trigger('reset');
              that._addRange(that._data);

              that._total = that._data.length;
              that._pristineTotal = that._total;

              that._process(that._data);
            } else {
              if (that._data) {
                for (var idx = 0; idx < that._data.length; idx++) {
                  that._data.at(idx);
                }
              }

              return that._data;
            }
          },

          /**
           * 为指定数据源子项新增_index属性，记录其编号位置
           * @param  {Array} data - 待处理数据源
           * @return {Array} 新增_index属性的数据源
           * @private
           * @memberOf fly.DataSource.prototype
           */
          _index: function(data) {
            var skip = this.skip() || 0;
            each(data, function(i, item) {
              if (item != undefined && item != null) {
                item['_index'] = skip + i + 1;
              }
            });
            return data;
          },

          /**
           * 获取当前DataSource实例对象的元素
           * @param  {(Array | Undefined)} value - 新的视图数据,参数为空，则返回原数据视图，不为空则替换原数据视图
           * @return {(Array | Undefined)} 数据视图
           * @memberOf fly.DataSource.prototype
           */
          view: function(value) {
            if (value === undefined) {
              return this._view;
            } else {
              this._view = this._observeView(value);
            }
          },

          /**
           * 用新的数据源替换原有数据源视图
           * @param  {Object} data - 新的视图数据
           * @return {Array} 新的视图
           * @private
           * @memberOf fly.DataSource.prototype
           */
          _observeView: function(data) {
            var that = this;
            replaceWithObservable(data, that._data, that._ranges, that.reader.model ||
              ObservableObject, false);

            var view = new LazyObservableArray(data, that.reader.model);
            view.parent = function() {
              return that.parent();
            };
            return view;
          },

          /**
           * 将参数转化为ObservableObject实例对象
           * @param  {Object} model - 待转换数据
           * @return {ObservableObject}
           * @private
           * @memberOf fly.DataSource.prototype
           */
          _createNewModel: function(model) {
            if (this.reader.model) {
              return new this.reader.model(model);
            }

            if (model instanceof ObservableObject) {
              return model;
            }

            return new ObservableObject(model);
          },

          /**
           * 在指定位置插入数据
           * @param  {Number} index - 插入数据的位置
           * @param  {Object} model 带插入数据
           * @return {Object}
           * @memberOf fly.DataSource.prototype
           */
          insert: function(index, model) {
            if (!model) {
              model = index;
              index = 0;
            }

            if (!(model instanceof Model)) {
              model = this._createNewModel(model);
            }

            this._data.splice(index, 0, model);

            return model;
          },

          /**
           * 在数据源最后追加一条数据
           * @param {Object} model - 插入的数据
           * @memberOf fly.DataSource.prototype
           */
          add: function(model) {
            return this.insert(this._data.length, model);
          },

          /**
           * 移除数据源中的数据
           * @param  {Object} model - 待移除数据
           * @return {Object} 待移除数据
           * @memberOf fly.DataSource.prototype
           */
          remove: function(model) {
            var result,
              that = this;

            this._eachItem(that._data, function(items) {
              removeModel(items, model);
            });

            // this._removeModelFromRanges(model);

            // this._updateRangesLength();

            return model;
          },

          /**
           * 返回已销毁的数据
           * @memberOf fly.DataSource.prototype
           * @returns {Array} 已销毁的数据
           */
          destroyed: function() {
            return this._destroyed;
          },

          /**
           * 读取数据
           * @private
           * @param  {Object} data - 读取数据参数
           * @return {Array}  读取到的数据
           */
          _readData: function(data) {
            var read = this.reader.data;
            return read.call(this.reader, data);
          },

          _eachItem: function(data, callback) {
            if (data && data.length) {
              callback(data);
            }
          },

          /**
           * 根据所给查询条件拉取数据，并缓存
           * @memberOf fly.DataSource.prototype
           * @param  {Object} data - 查询条件
           * @return {Deferred} 查询到的数据
           */
          read: function(data) {
            var that = this,
              params = that._params(data);
            var deferred = Deferred();

            that._queueRequest(params, function() {
              var isPrevented = that.trigger(REQUESTSTART, {
                type: READ
              });
              if (!isPrevented) {
                that.trigger(PROGRESS);

                that._ranges = [];
                that.trigger("reset");
                if (that._online) {
                  that.transport.read({
                    data: params,
                    cache: false,
                    success: function(data) {
                      that.success(data);
                      deferred.resolve();
                    },
                    error: function() {
                      var args = slice.call(arguments);
                      that.error.apply(that, args);
                      deferred.reject.apply(deferred, args);
                    }
                  });
                }
              } else {
                that._dequeueRequest();

                deferred.resolve(isPrevented);
              }
            });

            return deferred.promise();
          },

          /**
           * 根据查询条件查询数据成功事件
           * @memberOf fly.DataSource.prototype
           * @param  {Object} data - 查询到的数据
           */
          success: function(data) {
            var that = this,
              options = that.options;

            that.trigger(REQUESTEND, {
              response: data,
              type: READ
            });

            if (that._online) {
              data = that.reader.parse(data);

              if (that._handleCustomErrors(data)) {
                that._dequeueRequest();
                return;
              }

              that._total = that.reader.total(data);

              data = that._readData(data);
            } else {
              data = that._readData(data);

              var items = [];

              for (var idx = 0; idx < data.length; idx++) {
                var item = data[idx];
                var state = item.__state__;

                if (state == "destroy") {
                  this._destroyed.push(this._createNewModel(item));
                } else {
                  items.push(item);
                }
              }

              data = items;

              that._total = data.length;
            }

            that._pristineTotal = that._total;

            that._pristineData = data.slice(0);

            that._detachObservableParents();

            that._data = that._observe(data);

            that._storeData();

            that._addRange(that._data);

            that._process(that._data);

            that._dequeueRequest();
          },

          _detachObservableParents: function() {
            if (this._data && this._shouldDetachObservableParents) {
              for (var idx = 0; idx < this._data.length; idx++) {
                if (this._data[idx].parent) {
                  this._data[idx].parent = noop;
                }
              }
            }
          },

          _storeData: function(updatePristine) {
            var server = this.options.server;
            var model = this.reader.model;

            function items(data) {
              var state = [];

              for (var idx = 0; idx < data.length; idx++) {
                var dataItem = data.at(idx);
                var item = dataItem.toJSON();

                if (server && dataItem.items) {
                  item.items = items(dataItem.items);
                } else {
                  item.uid = dataItem.uid;

                  if (model) {
                    if (dataItem.isNew()) {
                      item.__state__ = "create";
                    } else if (dataItem.dirty) {
                      item.__state__ = "update";
                    }
                  }
                }
                state.push(item);
              }

              return state;
            }
          },

          _addRange: function(data) {
            var that = this,
              start = that._skip || 0,
              end = start + data.length;

            that._ranges.push({
              start: start,
              end: end,
              data: data
            });
            that._ranges.sort(function(x, y) {
              return x.start - y.start;
            });
          },

          /**
           * 根据查询条件查询数据失败事件
           * @param {XMLHttpRequest} xhr - XMLHttpRequest对象
           * @param {String} status - 错误信息
           * @param {Error} errorThrown - 捕获的错误对象(可选)
           * @memberOf fly.DataSource.prototype
           */
          error: function(xhr, status, errorThrown) {
            this._dequeueRequest();
            this.trigger(REQUESTEND, {});
            this.trigger(ERROR, {
              xhr: xhr,
              status: status,
              errorThrown: errorThrown
            });
          },

          _pageParam: function() {
            var options = this.options,
              pageMode = options.pageMode;
            if (pageMode) {
              var opt = {};
              opt[pageMode.page] = this.page();
              return opt;
            } else {
              return {
                take: this.take(),
                skip: this.skip(),
                page: this.page()
              }
            }
          },

          _params: function(data) {
            var that = this,
              pageParam = that._pageParam(),
              thatOptions = that.options,
              options = extend(pageParam, {
                pageSize: that.pageSize(),
                sort: that._sort
              }, data);

            if (!thatOptions.server) {
              if (!thatOptions.pageSize) {
                delete options.take;
                delete options.skip;
              }
              delete options.page;
              delete options.pageSize;
              // delete options.currentPageNo;
            }

            return options;
          },

          _queueRequest: function(options, callback) {
            var that = this;
            if (!that._requestInProgress) {
              that._requestInProgress = true;
              that._pending = undefined;
              callback();
            } else {
              that._pending = {
                callback: proxy(callback, that),
                options: options
              };
            }
          },

          _dequeueRequest: function() {
            var that = this;
            that._requestInProgress = false;
            if (that._pending) {
              that._queueRequest(that._pending.options, that._pending.callback);
            }
          },

          _handleCustomErrors: function(response) {
            var errors = this.reader.errors(response);
            if (!errors) {
              return false;
            } else if (errors === EMPTY) {
              this.trigger(EMPTY);
              return false;
            } else {
              this.trigger(ERROR, {
                // xhr: null,
                status: "customerror",
                errorThrown: "custom error",
                errors: errors
              });
              return true;
            }
          },

          _observe: function(data) {
            var that = this,
              model = that.reader.model,
              wrap = false;

            that._shouldDetachObservableParents = true;

            if (model && data.length) {
              wrap = !(data[0] instanceof model);
            }

            if (data instanceof ObservableArray) {
              that._shouldDetachObservableParents = false;
              if (wrap) {
                data.type = that.reader.model;
                data.wrapAll(data, data);
              }
            } else {
              var arrayType = that.pageSize() && !that.options.server ?
                LazyObservableArray : ObservableArray;
              data = new arrayType(data, that.reader.model);
              data.parent = function() {
                return that.parent();
              };
            }

            if (that._changeHandler && that._data && that._data instanceof ObservableArray) {
              that._data.unbind(CHANGE, that._changeHandler);
            } else {
              that._changeHandler = proxy(that._change, that);
            }

            return data.bind(CHANGE, that._changeHandler);
          },

          _change: function(e) {
            var that = this,
              idx, length, action = e ? e.action : "";

            if (action === "remove") {
              for (idx = 0, length = e.items.length; idx < length; idx++) {
                if (!e.items[idx].isNew || !e.items[idx].isNew()) {
                  that._destroyed.push(e.items[idx]);
                }
              }
            }

            var total = parseInt(that._total, 10);
            if (!isNumber(that._total)) {
              total = parseInt(that._pristineTotal, 10);
            }
            if (action === "add") {
              total += e.items.length;
            } else if (action === "remove") {
              total -= e.items.length;
            } else if (action !== "itemchange" && action !== "sync" && !that.options.server) {
              total = that._pristineTotal;
            } else if (action === "sync") {
              total = that._pristineTotal = parseInt(that._total, 10);
            }

            that._total = total;

            that._process(that._data, e);
          },

          _process: function(data, e) {
            var that = this,
              options = {},
              result;

            if (that.options.server === false) {
              options.skip = that._skip;
              options.take = that._take || that._pageSize;

              if (options.skip === undefined && that._page !== undefined && that._pageSize !==
                undefined) {
                options.skip = (that._page - 1) * that._pageSize;
              }
            }

            if (that.options.server === false) {
              options.sort = that._sort;
              options.filter = that._filter;
            }

            result = that._queryProcess(data, options);

            that.view(that._index(result.data));

            if (result.total !== undefined && !that.options.server) {
              that._total = result.total;
            }

            e = e || {};

            e.items = e.items || that._view;

            that.trigger(CHANGE, e);
          },

          _queryProcess: function(data, options) {
            return Query.process(data, options);
          },

          _mergeState: function(options) {
            var that = this,
              pageMode = that.options.pageMode;

            if (options !== undefined) {
              that._pageSize = options.pageSize;
              that._page = options.page;
              that._sort = options.sort;
              that._filter = options.filter;
              that._skip = options.skip;
              that._take = options.take;

              if (that._skip === undefined) {
                that._skip = that.skip();
                options.skip = that.skip();
              }

              if (!pageMode && that._take === undefined && that._pageSize !==
                undefined) {
                that._take = that._pageSize;
                options.take = that._take;
              }

              if (options.sort) {
                that._sort = options.sort = normalizeSort(options.sort);
              }

              if (options.filter) {
                if (!that.options.server) {
                  that._filter = options.filter = normalizeFilter(options.filter);
                } else {
                  that._filter = normalizeFilter(options.filter);
                  delete options.filter;

                  if (that._filter) {
                    each(that._filter.filters, function(i, item) {
                      options[item.field] = item.value;
                    });
                  }
                }
              }

              if (pageMode) {
                delete options.pageSize;
                options[pageMode.page] = that._page;
                options[pageMode.size] = that._pageSize;
                delete options.page;
                delete options.take;
                delete options.skip;
              }

            }
            return options;
          },

          /**
           * 根据提供的查询条件查询数据
           * @memberOf fly.DataSource.prototype
           * @param  {Object} options - 查询条件
           * @return {Deferred}
           */
          query: function(options) {
            var result;
            var remote = this.options.server;

            if (remote || ((this._data === undefined || this._data.length === 0) && !this
              ._destroyed
              .length)) {
              return this.read(this._mergeState(options));
            }

            var isPrevented = this.trigger(REQUESTSTART, {
              type: READ
            });
            if (!isPrevented) {
              this.trigger(PROGRESS);

              result = this._queryProcess(this._data, this._mergeState(options));

              if (!remote) {
                if (result.total !== undefined) {
                  this._total = result.total;
                } else {
                  this._total = this._data.length;
                }
              }

              this.view(this._index(result.data));
              this.trigger(REQUESTEND, {
                type: READ
              });
              this.trigger(CHANGE, {
                items: result.data
              });
            }

            return Deferred().resolve(isPrevented).promise();
          },

          fetch: function(callback) {
            var that = this;
            var fn = function(isPrevented) {
              if (isPrevented !== true && isFunction(callback)) {
                callback.call(that);
              }
            };

            return this._query().then(fn);
          },

          _query: function(options) {
            var that = this;

            return that.query(extend({}, {
              page: that.page(),
              pageSize: that.pageSize(),
              sort: that.sort(),
              filter: that.filter()
            }, options));
          },

          /**
           * 查询当前页码下一页数据
           * @memberOf fly.DataSource.prototype
           * @param  {Object} options - 查询条件
           * @return {Number} 当前页面数
           */
          next: function(options) {
            var that = this,
              page = that.page(),
              total = that.total();

            options = options || {};

            if (!page || (total && page + 1 > that.totalPages())) {
              return;
            }

            that._skip = page * that.take();

            page += 1;
            options.page = page;

            that._query(options);

            return page;
          },

          /**
           * 查询当前页码上一页数据
           * @memberOf fly.DataSource.prototype
           * @param  {Object} options - 查询条件
           * @return {Number} 当前页面数
           */
          prev: function(options) {
            var that = this,
              page = that.page();

            options = options || {};

            if (!page || page === 1) {
              return;
            }

            that._skip = that._skip - that.take();

            page -= 1;
            options.page = page;

            that._query(options);

            return page;
          },

          /**
           * 获取指定页码的数据
           * @private
           * @memberOf fly.DataSource.prototype
           * @param  {Number} val - 指定的页码数
           */
          page: function(val) {
            var that = this,
              skip;

            if (val !== undefined) {
              if (this.options.total === false) {
                val = math.max(val, 1);
              } else {
                val = math.max(math.min(math.max(val, 1), that.totalPages()), 1);
              }
              that._query({
                page: val
              });
              return;
            }
            skip = that.skip();

            return skip !== undefined ? math.round((skip || 0) / (that.take() || 1)) + 1 :
              undefined;
          },

          /**
           * 设置每页展示的数据条数
           * @memberOf fly.DataSource.prototype
           * @param  {Number} val - 每页展示条数
           * @return {Number} 返回当前的每页展示的条数
           */
          pageSize: function(val) {
            var that = this;

            if (val !== undefined) {
              that._query({
                pageSize: val,
                page: 1
              });
              return;
            }

            return that.take();
          },

          /**
           * 根据提供的字段名，对当前的DataSource实例化对象进行排序
           * @memberOf fly.DataSource.prototype
           * @param  {String} val - 标识排序字段的字符串
           * @return {DataSource}   排序后的DataSource实例化对象
           */
          sort: function(val) {
            var that = this;

            if (val !== undefined) {
              that._query({
                sort: val
              });
              return;
            }

            return that._sort;
          },

          /**
           * 根据当前的查询条件，对数据进行过滤
           * @memberOf fly.DataSource.prototype
           * @param  {Object} val - 查询条件
           */
          filter: function(val) {
            var that = this;

            if (val === undefined) {
              return that._filter;
            }

            // if (!isEmptyObject(val) && isPlainObject(val) && val.field === undefined && !val.logic) {
            //     val = $.map(val, function (value, field) {
            //         return {
            //             field: field,
            //             value: value
            //         };
            //     });
            // }

            that._query({
              filter: val,
              page: 1
            });
            that.trigger("reset");
          },

          /**
           * 返回当前数据源数据数组长度
           * @memberOf fly.DataSource.prototype
           * @return {Number}
           */
          total: function() {
            return parseInt(this._total || 0, 10);
          },

          /**
           * 返回当前数据源数据总的页码数
           * @memberOf fly.DataSource.prototype
           * @return {Number}
           */
          totalPages: function() {
            var that = this,
              pageSize = that.pageSize() || that.total();

            return math.ceil((that.total() || 0) / pageSize);
          },


          /**
           * 当前DataSource展示数据编号
           * @private
           * @memberOf fly.DataSource.prototype
           * @return {Number}
           */
          skip: function() {
            var that = this;

            if (that._skip === undefined) {
              return (that._page !== undefined ? (that._page - 1) * (that.take() || 1) :
                undefined);
            }
            return that._skip;
          },

          /**
           * 获取当前DataSource每页条数
           * @private
           * @memberOf fly.DataSource.prototype
           * @return {Number}
           */
          take: function() {
            return this._take || this._pageSize;
          }
        });


        DataSource.create = function(options) {

          if (isArray(options) || options instanceof ObservableArray) {
            options = {
              data: options
            };
          }

          var dataSource = options || {},
            data = dataSource.data || [],
            fields = dataSource.fields,
            select = dataSource.select,
            idx,
            length,
            model = {},
            field;

          if (!data && fields && !dataSource.transport && select) {
            data = inferSelect(select, fields);
          }

          // 自动创建Model
          if (Model && fields && !dataSource.model) {
            for (idx = 0, length = fields.length; idx < length; idx++) {
              field = fields[idx];
              if (field.type) {
                model[field.field] = field;
              }
            }

            if (!isEmptyObject(model)) {
              dataSource.model = extend(true, model, {
                fields: model
              });
            }
          }

          dataSource.data = data;

          return dataSource instanceof DataSource ? dataSource : new DataSource(dataSource);
        };


        var Cache = Class.extend({
          ctor: function() {
            this._store = {};
          },
          add: function(key, data) {
            if (key !== undefined) {
              this._store[stringify(key)] = data;
            }
          },
          find: function(key) {
            return this._store[stringify(key)];
          },
          clear: function() {
            this._store = {};
          },
          remove: function(key) {
            delete this._store[stringify(key)];
          }
        });

        Cache.create = function(options) {
          var store = {
            "inmemory": function() {
              return new Cache();
            }
          };

          if (isPlainObject(options) && isFunction(options.find)) {
            return options;
          }

          if (options === true) {
            return new Cache();
          }

          return store[options]();
        };


        var DataReader = Class.extend({

          ctor: function(model, modelBase, data) {
            var that = this,
              serializeFunction = proxy(that.serialize, that),
              dataFunction = proxy(typeof data === STRING ? getter(data) : that.data,
                that),
              originalFieldNames = {},
              getters = {},
              serializeGetters = {},
              fieldNames = {},
              shouldSerialize = false,
              dataModel,
              fieldName;

            that._dataAccessFunction = dataFunction;

            if (typeof data === STRING) {
              that[data] = getter(data);
            }

            if (isPlainObject(model)) {
              dataModel = modelBase ? modelBase.define(model) : Model.define(model);
            }

            if (!dataModel) {
              return;
            }

            that.model = model = dataModel;

            if (model.fields) {
              each(model.fields, function(field, value) {
                var fromName;

                fieldName = field;

                if (isPlainObject(value) && value.field) {
                  fieldName = value.field;
                } else if (typeof value === STRING) {
                  fieldName = value;
                }

                if (isPlainObject(value) && value.from) {
                  fromName = value.from;
                }

                shouldSerialize = shouldSerialize || (fromName && fromName !==
                  field) || fieldName !== field;

                getters[field] = getter(fromName || fieldName);
                serializeGetters[field] = getter(field);
                originalFieldNames[fromName || fieldName] = field;
                fieldNames[field] = fromName || fieldName;
              });

              if (shouldSerialize) {
                that.serialize = wrapDataAccess(serializeFunction, dataModel,
                  serializeRecords, serializeGetters, originalFieldNames,
                  fieldNames);
              }
            }

            that.data = wrapDataAccess(dataFunction, dataModel, convertRecords,
              getters, originalFieldNames, fieldNames);
          },

          errors: function(data) {
            return data ? data.errors : null;
          },

          parse: function(data) {
            // 是否对无数据的情况进行过滤，这是一个大坑
            if (data && data.rows && data.rows.length == 0) {
              data.errors = EMPTY;
            }
            return data;
          },

          data: function(data) {
            if (data && data.rows != undefined) {
              return data.rows;
            }
            return data;
          },

          total: function(data) {
            if (data && data.total != undefined) {
              return data.total;
            }
            return data.length;
          },

          serialize: function(data) {
            return data;
          }
        });


        var Query = Class.extend({

          ctor: function(data) {
            this.data = data || [];
          },

          statics: {
            normalizeFilter: normalizeFilter,

            filterExpr: function(expression) {
              var expressions = [],
                fieldFunctions = [],
                operatorFunctions = [],
                logic = {
                  and: ' && ',
                  or: ' || '
                },
                idx,
                length,
                filter,
                expr,
                field,
                operator,
                filters = expression.filters;

              for (idx = 0, length = filters.length; idx < length; idx++) {
                filter = filters[idx];
                field = filter.field;
                operator = filter.operator;

                if (filter.filters) {
                  expr = Query.filterExpr(filter);
                  // __o[0] -> __o[1]
                  filter = expr.expression
                    .replace(/__o\[(\d+)\]/g, function(match, index) {
                      index = +index;
                      return '__o[' + (operatorFunctions.length + index) + ']';
                    })
                    .replace(/__f\[(\d+)\]/g, function(match, index) {
                      index = +index;
                      return '__f[' + (fieldFunctions.length + index) + ']';
                    });

                  operatorFunctions.push.apply(operatorFunctions, expr.operators);
                  fieldFunctions.push.apply(fieldFunctions, expr.fields);
                } else {
                  if (typeof field === FUNCTION) {
                    expr = '__f[' + fieldFunctions.length + '](d)';
                    fieldFunctions.push(field);
                  } else {
                    expr = fly.expr(field);
                  }

                  if (typeof operator === FUNCTION) {
                    filter = '__o[' + operatorFunctions.length + '](' + expr + ', ' +
                      operators.quote(
                        filter.value) + ')';
                    operatorFunctions.push(operator);
                  } else {
                    filter = operators[(operator || 'eq').toLowerCase()](expr, filter.value,
                      filter
                      .ignoreCase !== undefined ? filter.ignoreCase : true);
                  }
                }

                expressions.push(filter);
              }

              return {
                expression: '(' + expressions.join(logic[expression.logic]) + ')',
                fields: fieldFunctions,
                operators: operatorFunctions
              };
            },

            process: function(data, options) {
              options = options || {};

              var query = new Query(data),
                sort = normalizeSort(options.sort || []),
                total,
                filterCallback = options.filterCallback,
                filter = options.filter,
                skip = options.skip,
                take = options.take;

              if (filter) {
                query = query.filter(filter);

                if (filterCallback) {
                  query = filterCallback(query);
                }

                total = query.toArray().length;
              }

              if (sort) {
                query = query.sort(sort);
              }

              if (skip !== undefined && take !== undefined) {
                query = query.range(skip, take);
              }

              return {
                total: total,
                data: query.toArray()
              };
            }
          },

          toArray: function() {
            return this.data;
          },

          range: function(index, count) {
            return new Query(this.data.slice(index, index + count));
          },

          skip: function(count) {
            return new Query(this.data.slice(count));
          },

          take: function(count) {
            return new Query(this.data.slice(0, count));
          },

          select: function(selector) {
            return new Query(map(this.data, selector));
          },

          order: function(selector, dir) {
            var sort = {
              dir: dir
            };

            if (selector) {
              if (selector.compare) {
                sort.compare = selector.compare;
              } else {
                sort.field = selector;
              }
            }

            return new Query(this.data.slice(0).sort(Comparer.create(sort)));
          },

          orderBy: function(selector) {
            return this.order(selector, 'asc');
          },

          orderByDescending: function(selector) {
            return this.order(selector, 'desc');
          },

          sort: function(field, dir, comparer) {
            var descriptors = normalizeSort(field, dir),
              comparers = [],
              length = descriptors.length,
              idx = 0;

            comparer = comparer || Comparer;

            if (length) {
              for (; idx < length; idx++) {
                comparers.push(comparer.create(descriptors[idx]));
              }

              return this.orderBy({
                compare: comparer.combine(comparers)
              });
            }

            return this;
          },

          filter: function(expressions) {
            var idx,
              current,
              length,
              compiled,
              predicate,
              data = this.data,
              fields,
              operators,
              result = [],
              filter;

            expressions = normalizeFilter(expressions);

            if (!expressions || expressions.filters.length === 0) {
              return this;
            }

            compiled = Query.filterExpr(expressions);
            fields = compiled.fields;
            operators = compiled.operators;

            predicate = filter = new Function('d, __f, __o', 'return ' + compiled.expression);

            if (fields.length || operators.length) {
              filter = function(d) {
                return predicate(d, fields, operators);
              };
            }


            for (idx = 0, length = data.length; idx < length; idx++) {
              current = data[idx];

              if (filter(current)) {
                result.push(current);
              }
            }

            return new Query(result);
          }

        });

        var Transport = {
          /**
           * 根据配置信息read确认创建本地数据传输通道还是从服务端创建
           * @param  {Object} options - 创建DataSourece实例化对象配置参数
           * @param  {DataSource} dataSource - DataSource实例化对象
           * @return {(LocalTransport | RemoteTransport)}
           * @private
           */
          create: function(options, dataSource) {
            var transport,
              currentTransport = options.transport,
              read = options.read;

            if (read) {
              transport = isFunction(currentTransport) ? currentTransport : new RemoteTransport({
                read: read,
                dataSource: dataSource
              });
            } else {
              transport = new LocalTransport({
                data: options.data || []
              });
            }

            return transport;
          }
        };


        var LocalTransport = Class.extend({
          ctor: function(options) {
            this.data = options.data;
          },
          read: function(options) {
            var data = [];
            if (options.take && options.skip) {
              for (var i = 0; i < options.take; i++) {
                data.push(this.data[options.skip + i]);
              }
            } else {
              data = this.data;
            }
            options.success(data);
          },
          update: function(options) {
            options.success(options.data);
          },
          create: function(options) {
            options.success(options.data);
          },
          destroy: function(options) {
            options.success(options.data);
          }
        });

        /**
         * 从服务端创建数据传输通道
         * @class RemoteTransport
         * @ignore
         */
        var RemoteTransport = Class.extend({
          /**
           * RemoteTransport 构造函数
           * @param  {Object} options - 构造RemoteTransport实例对象默认配置
           * @param {Object} options.read - 服务端请求接口参数配置
           * @param {DataSource} options.dataSource - DataSource实例对象
           * @memberOf RemoteTransport.prototype
           */
          ctor: function(options) {
            var that = this,
              parameterMap;

            options = that.options = extend({}, that.options, options);

            each(CRUD, function(index, type) {
              if (typeof options[type] === STRING) {
                options[type] = {
                  url: options[type]
                };
              }
            });

            that.cache = options.cache ? Cache.create(options.cache) : {
              find: noop,
              add: noop
            };

            parameterMap = options.parameterMap;

            if (isFunction(options.push)) {
              that.push = options.push;
            }

            if (!that.push) {
              that.push = identity;
            }

            that.parameterMap = isFunction(parameterMap) ? parameterMap : function(
              options) {
              var result = {};

              each(options, function(option, value) {
                if (option in parameterMap) {
                  option = parameterMap[option];
                  if (isPlainObject(option)) {
                    value = option.value(value);
                    option = option.key;
                  }
                }

                result[option] = value;
              });

              return result;
            };
          },

          options: {
            parameterMap: identity
          },

          create: function(options) {
            return ajax(this.setup(options, CREATE));
          },

          read: function(options) {
            var that = this,
              success,
              error,
              result,
              cache = that.cache;

            options = that.setup(options, READ);
            success = options.success || noop;
            error = options.error || noop;
            result = cache.find(options.data);

            if (result !== undefined) {
              success(result);
            } else {
              options.success = function(result) {
                cache.add(options.data, result);
                success(result);
              };

              ajax(options);
            }
          },

          update: function(options) {
            return ajax(this.setup(options, UPDATE));
          },

          destroy: function(options) {
            return ajax(this.setup(options, DESTROY));
          },

          setup: function(options, type) {
            options = options || {};

            var that = this,
              parameters,
              operation = that.options[type],
              data = isFunction(operation.data) ? operation.data(options.data) :
              operation.data;

            options = extend(true, {}, operation, options);
            parameters = extend(true, {}, data, options.data);

            options.data = that.parameterMap(parameters, type);

            if (isFunction(options.url)) {
              options.url = options.url(parameters);
            }

            return options;
          }
        });


        /**
         * 将数据转化为带有index的JSON Object
         * @private
         * @param   {Array}  array 需要格式化的数组
         * @returns {Object} JSON
         */
        function toJSON(array) {
          var idx, length = array.length,
            result = new Array(length);

          for (idx = 0; idx < length; idx++) {
            result[idx] = format.toJSON(array[idx]);
          }

          return result;
        }

        function normalizeSort(field, dir) {
          if (field) {
            var descriptor = typeof field === STRING ? {
                field: field,
                dir: dir
              } : field,
              descriptors = isArray(descriptor) ?
              descriptor :
              (descriptor !== undefined ? [descriptor] : []);

            return grep(descriptors, function(d) {
              return !!d.dir;
            });
          }
        }

        function normalizeOperator(expression) {
          var idx,
            length,
            filter,
            operator,
            filters = expression.filters;

          if (filters) {
            for (idx = 0, length = filters.length; idx < length; idx++) {
              filter = filters[idx];
              operator = filter.operator;

              if (operator && typeof operator === STRING) {
                filter.operator = operatorMap[operator.toLowerCase()] || operator;
              }

              normalizeOperator(filter);
            }
          }
        }

        function normalizeFilter(expression) {
          if (expression && !isEmptyObject(expression)) {
            if (isArray(expression) || !expression.filters) {
              expression = {
                logic: 'and',
                filters: isArray(expression) ? expression : [expression]
              };
            }

            normalizeOperator(expression);

            return expression;
          }
        }

        var operators = (function() {

          function quote(value) {
            return value.replace(quoteRegExp, '\\').replace(newLineRegExp, '');
          }

          function operator(op, a, b, ignore) {
            var date;

            if (b != null) {
              if (typeof b === STRING) {
                b = quote(b);
                date = dateRegExp.exec(b);
                if (date) {
                  b = new Date(+date[1]);
                } else if (ignore) {
                  b = "'" + b.toLowerCase() + "'";
                  a = '(' + a + ' || "").toLowerCase()';
                } else {
                  b = "'" + b + "'";
                }
              }

              if (b.getTime) {
                a = '(' + a + '?' + a + '.getTime():' + a + ')';
                b = b.getTime();
              }
            }

            return a + ' ' + op + ' ' + b;
          }

          return {
            quote: function(value) {
              if (value && value.getTime) {
                return "new Date(" + value.getTime() + ")";
              }

              if (typeof value == "string") {
                return "'" + quote(value) + "'";
              }

              return "" + value;
            },
            eq: function(a, b, ignore) {
              return operator("==", a, b, ignore);
            },
            neq: function(a, b, ignore) {
              return operator("!=", a, b, ignore);
            },
            gt: function(a, b, ignore) {
              return operator(">", a, b, ignore);
            },
            gte: function(a, b, ignore) {
              return operator(">=", a, b, ignore);
            },
            lt: function(a, b, ignore) {
              return operator("<", a, b, ignore);
            },
            lte: function(a, b, ignore) {
              return operator("<=", a, b, ignore);
            },
            startswith: function(a, b, ignore) {
              if (ignore) {
                a = "(" + a + " || '').toLowerCase()";
                if (b) {
                  b = b.toLowerCase();
                }
              }

              if (b) {
                b = quote(b);
              }

              return a + ".lastIndexOf('" + b + "', 0) == 0";
            },
            endswith: function(a, b, ignore) {
              if (ignore) {
                a = "(" + a + " || '').toLowerCase()";
                if (b) {
                  b = b.toLowerCase();
                }
              }

              if (b) {
                b = quote(b);
              }

              return a + ".indexOf('" + b + "', " + a + ".length - " + (b || "").length +
                ") >= 0";
            },
            contains: function(a, b, ignore) {
              if (ignore) {
                a = "(" + a + " || '').toLowerCase()";
                if (b) {
                  b = b.toLowerCase();
                }
              }

              if (b) {
                b = quote(b);
              }

              return a + ".indexOf('" + b + "') >= 0";
            },
            doesnotcontain: function(a, b, ignore) {
              if (ignore) {
                a = "(" + a + " || '').toLowerCase()";
                if (b) {
                  b = b.toLowerCase();
                }
              }

              if (b) {
                b = quote(b);
              }

              return a + ".indexOf('" + b + "') == -1";
            }
          };
        })();


        function serializeRecords(data, getters, modelInstance, originalFieldNames,
          fieldNames) {
          var record,
            getter,
            originalName,
            idx,
            length;

          for (idx = 0, length = data.length; idx < length; idx++) {
            record = data[idx];
            for (getter in getters) {
              originalName = fieldNames[getter];

              if (originalName && originalName !== getter) {
                record[originalName] = getters[getter](record);
                delete record[getter];
              }
            }
          }
        }

        function convertRecords(data, getters, modelInstance, originalFieldNames, fieldNames) {
          var record,
            getter,
            originalName,
            idx,
            length;

          for (idx = 0, length = data.length; idx < length; idx++) {
            record = data[idx];
            for (getter in getters) {
              record[getter] = modelInstance._parse(getter, getters[getter](record));

              originalName = fieldNames[getter];
              if (originalName && originalName !== getter) {
                delete record[originalName];
              }
            }
          }
        }

        function wrapDataAccess(originalFunction, model, converter, getters,
          originalFieldNames, fieldNames) {
          return function(data) {
            data = originalFunction(data);

            if (data && !isEmptyObject(getters)) {
              if (toString.call(data) !== ARR && !(data instanceof ObservableArray)) {
                data = [data];
              }

              converter(data, getters, new model(), originalFieldNames, fieldNames);
            }

            return data || [];
          };
        }


        function replaceInRanges(ranges, data, item, observable) {
          for (var idx = 0; idx < ranges.length; idx++) {
            if (ranges[idx].data === data) {
              break;
            }
            if (replaceInRange(ranges[idx].data, item, observable)) {
              break;
            }
          }
        }

        function replaceInRange(items, item, observable) {
          for (var idx = 0, length = items.length; idx < length; idx++) {
            if (items[idx] === item || items[idx] === observable) {
              items[idx] = observable;
              return true;
            }
          }
        }

        function replaceWithObservable(view, data, ranges, type) {
          for (var viewIndex = 0, length = view.length; viewIndex < length; viewIndex++) {
            var item = view[viewIndex];

            if (!item || item instanceof type) {
              continue;
            }

            for (var idx = 0; idx < data.length; idx++) {
              if (data[idx] === item) {
                view[viewIndex] = data.at(idx);
                replaceInRanges(ranges, data, item, view[viewIndex]);
                break;
              }
            }
          }
        }

        function removeModel(data, model) {
          var idx, length;

          for (idx = 0, length = data.length; idx < length; idx++) {
            var dataItem = data.at(idx);
            if (dataItem.uid == model.uid) {
              data.splice(idx, 1);
              return dataItem;
            }
          }
        }


        function indexOfPristineModel(data, model) {
          if (model) {
            return indexOf(data, function(item) {
              if (item.uid) {
                return item.uid == model.uid;
              }

              return item[model.idField] === model.id;
            });
          }
          return -1;
        }

        function indexOfModel(data, model) {
          if (model) {
            return indexOf(data, function(item) {
              return item.uid == model.uid;
            });
          }
          return -1;
        }

        function indexOf(data, comparer) {
          var idx, length;

          for (idx = 0, length = data.length; idx < length; idx++) {
            if (comparer(data[idx])) {
              return idx;
            }
          }

          return -1;
        }

        function inferSelect(select, fields) {
          var options = $(select)[0].children,
            idx,
            length,
            data = [],
            record,
            firstField = fields[0],
            secondField = fields[1],
            value,
            option;

          for (idx = 0, length = options.length; idx < length; idx++) {
            record = {};
            option = options[idx];

            if (option.disabled) {
              continue;
            }

            record[firstField.field] = option.text;

            value = option.attributes.value;

            if (value && value.specified) {
              value = option.value;
            } else {
              value = option.text;
            }

            record[secondField.field] = value;

            data.push(record);
          }

          return data;
        }

        var Comparer = {

          selector: function(field) {
            return isFunction(field) ? field : getter(field);
          },

          compare: function(field) {
            var selector = this.selector(field);
            return function(a, b) {
              a = selector(a);
              b = selector(b);

              if (a == null && b == null) {
                return 0;
              }

              if (a == null) {
                return -1;
              }

              if (b == null) {
                return 1;
              }

              if (a.localeCompare) {
                return a.localeCompare(b);
              }

              return a > b ? 1 : (a < b ? -1 : 0);
            };
          },

          create: function(sort) {
            var compare = sort.compare || this.compare(sort.field);

            if (sort.dir == "desc") {
              return function(a, b) {
                return compare(b, a, true);
              };
            }

            return compare;
          },

          combine: function(comparers) {
            return function(a, b) {
              var result = comparers[0](a, b),
                idx,
                length;

              for (idx = 1, length = comparers.length; idx < length; idx++) {
                result = result || comparers[idx](a, b);
              }

              return result;
            };
          }
        };

        fly.data = fly.dataSource = function(object) {
          if (!(object instanceof DataSource)) {
            object = new DataSource(object);
          }
          return object;
        };


        fly.DataSource = DataSource;
        module.exports = DataSource;
      }, {
        "./fly.ajax": 1,
        "./fly.core": 4,
        "./fly.format": 6,
        "./fly.model": 9,
        "./fly.observable": 11
      }
    ],
    6: [
      function(_require, module, exports) {
        /**
         * 格式转换
         * @author: huanzhang
         * @update: 2015-06-06
         */

        'use strict';

        /**
         * @namespace fly
         * @type {Object}
         */

        // 依赖core
        var fly = _require('./fly.core');

        var $ = fly.$;

        // 类型检测
        var objectToString = {}.toString;

        // 纯数字
        var numberRegExp = /^\d*$/;

        // 特殊字符
        var escapeableRegExp = /["\\\x00-\x1f\x7f-\x9f]/g;

        var _meta = {
          '\b': '\\b',
          '\t': '\\t',
          '\n': '\\n',
          '\f': '\\f',
          '\r': '\\r',
          '"': '\\"',
          '\\': '\\\\'
        };

        /**
         * 格式化日期
         * @memberOf fly
         * @private
         * @param   {Object | String} date - 日期对象或日期字符串
         * @param   {String} format - 格式化形式
         * @return  {String} 格式化后的日期
         */
        var formatDate = function(date, format) {
          var regExps = {
            'M+': date.getMonth() + 1,
            'd+': date.getDate(),
            'H+': date.getHours(),
            'm+': date.getMinutes(),
            's+': date.getSeconds(),
            'q+': Math.floor((date.getMonth() + 3) / 3),
            'S': date.getMilliseconds()
          };

          if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1
              .length));
          }

          for (var reg in regExps) {
            var regExp = new RegExp('(' + reg + ')'),
              temp = regExps[reg] + '',
              real;
            if (regExp.test(format)) {
              real = RegExp.$1.length == 1 ? temp : ('00' + temp).substr(temp.length);
              format = format.replace(RegExp.$1, real);
            }
          }

          return format;
        };

        /**
         * 将字符串或日期对象转为定义的日期格式。
         * @memberOf fly
         * @param   {String | Object} value - 需要格式化的时间字符串或者Date对象，
         * 字符串格式必须遵循年（yyyy）、月（MM）、日（dd）的形式
         * @param   {String} format - 日期转化格式，格式支持（间隔符形式不限）：
         * yyyyMMdd 年月日，
         * yyyyMMddHHmm 年月日时分，
         * yyyyMMddHHmmss 年月日时分秒，
         * yyyy-MM-dd 年-月-日，
         * yyyy-MM-dd HH:mm 年-月-日 时:分，
         * yyyy-MM-dd HH:mm:ss 年-月-日 时:分:秒，
         * yyyy/MM/dd HH:mm:ss 年/月/日 时/分/秒
         * HHmmss 时分秒
         * HH:mm:ss 时:分:秒
         * @example
         * // "2017/04/12"
         * fly.formatDate(new Date(),'yyyy/MM/dd')
         * @example
         * // "2017-04-12"
         * fly.formatDate('2017/04/12','yyyy-MM-dd')
         * @return  {String} 格式化后的日期。
         */
        fly.formatDate = function(value, format) {

          // 标准转换格式
          var stand = 'yyyy/MM/dd HH:mm:ss',
            now = new Date(),
            idx = 0,
            date,
            length,
            reg;

          // 匹配格式库
          var formats = [
            'yyyyMMddHHmmss',
            'yyyyMMddHHmm',
            'yyyyMMdd',
            'yyyy-MM-dd HH:mm:ss',
            'yyyy-MM-dd HH:mm',
            'yyyy-MM-dd',
            'HHmmss',
            'HH:mm:ss'
          ];

          var regExps = {
            'y+': now.getFullYear(),
            'M+': now.getMonth() + 1,
            'd+': now.getDate(),
            'H+': 0,
            'm+': 0,
            's+': 0
          };

          // 如果是日期，则直接返回
          if (objectToString.call(value) === '[object Date]') {
            date = value;
          } else if (value) {
            for (length = formats.length; idx < length; idx++) {
              var newData = stand,
                newFormat = formats[idx];

              if (newFormat.length != value.length) {
                continue;
              }

              for (reg in regExps) {
                var regExp = new RegExp('(' + reg + ')'),
                  index = newFormat.search(regExp),
                  temp = '';
                if (index >= 0) {
                  temp = value.substr(index, RegExp.$1.length);
                  if (!numberRegExp.test(temp)) {
                    break;
                  }
                } else {
                  temp = regExps[reg] + '';
                }
                temp = temp.length == 1 ? '0' + temp : temp;
                newData = newData.replace(regExp, temp);
              }

              try {
                date = new Date(newData);
                if (!date.getTime()) {
                  continue;
                }
                break;
              } catch (e) {
                continue;
              }
            }
          }

          // 如果存在格式化
          value = !(date && date.getTime && date.getTime()) ? value : date;
          if (format) {
            return formatDate(value, format);
          } else {
            return value;
          }
        };

        /**
         * 将对象转为JSON。
         * @memberOf fly
         * @param   {Object} o - 需要转换的对象
         * @example
         * // "{"a":1}"
         * fly.toJSON({a:1})
         * @return  {String} 转换后的JSON字符串。
         */
        fly.toJSON = function(o) {
          if (typeof(JSON) == 'object' && JSON.stringify) {
            var json = JSON.stringify(o);
            return json;
          }
          var type = typeof(o);

          if (o === null)
            return 'null';

          if (type == 'undefined')
            return undefined;

          if (type == 'number' || type == 'boolean')
            return o + '';

          if (type == 'string')
            return fly.quoteString(o);

          if (type == 'object') {
            if (typeof o.toJSON == 'function')
              return fly.toJSON(o.toJSON());

            if (o.constructor === Date) {
              return formatDate(o, 'yyyy-MM-ddTHH:mm:ss.SZ');
            }

            if (o.constructor === Array) {
              var ret = [];
              for (var i = 0; i < o.length; i++)
                ret.push(fly.toJSON(o[i]) || '');

              return '[' + ret.join(',') + ']';
            }

            var pairs = [];
            for (var k in o) {
              var name;
              var type = typeof k;

              if (type == 'number')
                name = '"' + k + '"';
              else if (type == 'string')
                name = fly.quoteString(k);
              else
                continue; //skip non-string or number keys

              if (typeof o[k] == 'function')
                continue; //skip pairs where the value is a function.

              var val = fly.toJSON(o[k]);

              pairs.push(name + ':' + val);
            }

            return '{' + pairs.join(', ') + '}';
          }
        };

        /**
         * 将JSON字符串还原成对象。
         * @memberOf fly
         * @param   {String} src - 需要转换的JSON字符串
         * @example
         * // {a: 1,b: 2}
         * fly.evalJSON('{"a":1,"b":2}')
         * @return  {Object} 转换后的JSON对象。
         */
        fly.evalJSON = function(src) {
          if (!src) {
            return {};
          }
          if (typeof(src) !== 'string') {
            return src;
          }
          if (typeof(JSON) === 'object' && JSON.parse && !fly.support.browser.ie) {
            return JSON.parse(src);
          }
          return eval('(' + src + ')');
        };

        /**
         * 安全还原JSON：处理转义字符和特殊字符。
         * @memberOf fly
         * @param   {String} src - 需要转换的JSON字符串
         * @example
         * // {a: 1}
         * fly.secureEvalJSON("{\"a\":1}")
         * @return  {Object} 安全转换后的JSON对象。
         */
        fly.secureEvalJSON = function(src) {
          if (typeof(JSON) == 'object' && JSON.parse) {
            return JSON.parse(src);
          }

          var filtered = src;
          filtered = filtered.replace(/\\["\\\/bfnrtu]/g, '@');
          filtered = filtered.replace(
            /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
          filtered = filtered.replace(/(?:^|:|,)(?:\s*\[)+/g, '');

          if (/^[\],:{}\s]*$/.test(filtered))
            return eval('(' + src + ')');
          else
            throw new SyntaxError('Error parsing JSON, source is not valid.');
        };

        /**
         * 处理字符串中的特殊字符：空字符、单元分隔符、DEL符号、引号。
         * @memberOf fly
         * @param   {String} string - 需要处理包含特殊字符的字符串
         * @example
         * // ""Fly.\"js\"""
         * fly.quoteString('Fly."js"')
         * @return  {String}  处理过后的字符串。
         */
        fly.quoteString = function(string) {
          if (string.match(escapeableRegExp)) {
            return '"' + string.replace(escapeableRegExp, function(a) {
              var c = _meta[a];
              if (typeof c === 'string') return c;
              c = a.charCodeAt();
              return '\\u00' + Math.floor(c / 16).toString(
                16) + (c % 16).toString(16);
            }) + '"';
          }
          return '"' + string + '"';
        };

        /**
         * 字符格式化，
         * 替换并获取给定的数组或字符串对应的下标数据。
         * @memberOf fly
         * @param   {String} source - 需格式化的源字符串
         * @param   {Array | String}  params - 格式化的数据
         * @example
         * // "aabbcc"
         * fly.format("{0}bb{1}",['aa','cc'])
         * @example
         * // "aabbcc"
         * fly.format("{0}bb{1}", "aa", "cc")
         * @returns {String} 格式化后的字符串。
         */
        var format = fly.format = function(source, params) {
          if (arguments.length == 1)
            return function() {
              var args = $.makeArray(arguments);
              args.unshift(source);
              return format.format.apply(this, args);
            };
          if (arguments.length > 2 && params.constructor != Array) {
            params = $.makeArray(arguments).slice(1);
          }
          if (params.constructor != Array) {
            params = [params];
          }
          $.each(params, function(i, n) {
            source = source.replace(new RegExp('\\{' + i + '\\}', 'g'), n);
          });
          return source;
        };

        module.exports = format;
      }, {
        "./fly.core": 4
      }
    ],
    7: [
      function(_require, module, exports) {
        /**
         * @file 简易版jQuery
         * @author huanzhang
         */

        'use strict';

        var jQuery = null,
          arr = [],
          class2type = {},
          rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
          indexOf = arr.indexOf,
          slice = arr.slice,
          push = arr.push,
          concat = arr.concat,
          toString = {}.toString,
          hasOwn = {}.hasOwnProperty;

        /**
         * 对 jQuery.js 常用方法进行处理和封装到 fly.$ 的命名空间下。
         * 实例化 jQuery 对象。
         * @private
         */
        jQuery = function(context) {
          return new jQuery.fn.init(context);
        }

        /**
         * 返回某个指定的字符串值在字符串或数组对象中首次出现的位置。
         * @private
         * @param   {String} searchElement  - 规定需检索的字符串值。
         * @param   {Number} [fromIndex]    - 开始检索的位置，它的合法取值是 0 到 检索对象的长度 - 1之间，默认从 0 开始检索。
         * @return  {Number} 返回对应的位置或-1（表示不存在）。
         */
        if (!indexOf) {
          indexOf = function(searchElement, fromIndex) {
            var index = -1;
            fromIndex = fromIndex * 1 || 0;
            for (var k = 0, length = this.length; k < length; k++) {
              if (k >= fromIndex && this[k] === searchElement) {
                index = k;
                break;
              }
            }
            return index;
          };
        }

        jQuery.fn = jQuery.prototype = {

          constructor: jQuery,

          length: 0,

          /**
           * 将出入的元素封装成一个新的jQuery对象, 并将 this 赋值给新构建jQuery对象的prevObject,最后返回新生的jQuery对象。
           * @memberOf fly/jquery
           * @instance
           * @param  {Array} elems - 将要压入 jQuery 栈的数组元素，用于生成一个新的 jQuery 对象。
           */
          pushStack: function(elems) {
            var ret = jQuery.merge(this.constructor(), elems);
            ret.prevObject = this;
            return ret;
          },

          /**
           * 以每一个匹配的元素作为上下文来执行一个函数。每次执行传递进来的函数时，函数中的this关键字都指向一个不同的DOM元素（每次都是一个不同的匹配元素）。
           * 在每次执行函数时，都会给函数传递一个表示作为执行环境的元素在匹配的元素集合中所处位置的数字值作为参数（从零开始的整型）。
           * 返回 'false' 将停止循环 (就像在普通的循环中使用 'break')。返回 'true' 跳至下一个循环(就像在普通的循环中使用'continue')。
           * @memberOf fly/jquery
           * @instance
           * @param  {Function}  callback - 为每个匹配元素规定运行的函数，(index: Number, value: *)，index：当前遍历对象所在数组中的索引，value: 当前遍历数组中的元素。
           * @return {jQuery}    jQuery实例对象
           */
          each: function(callback) {
            return jQuery.each(this, callback);
          },

          /**
           * 将一组元素转换成其他数组（不论是否是元素数组），生成包含返回值的新的 jQuery 对象。
           * @memberOf fly/jquery
           * @instance
           * @param  {Function} callback          - 给每个元素执行的函数。
           * @return {jQuery}   匹配函数后返回的 jQuery 封装数组。
           * @example
           * $("p").append( $("input").map(function(){ return $(this).val();}).get().join(", ") );
           */
          map: function(callback) {
            return this.pushStack(jQuery.map(this, function(elem, i) {
              return callback.call(elem, i, elem);
            }));
          },

          /**
           * 把匹配元素集合缩减为指定的指数范围的子集。
           * @memberOf fly/jquery
           * @instance
           * @param  {Number}   selector - 指示开始选取元素的位置。
           * @param  {Number}   end      - 指示结束选取元素的位置（不包括该位置的元素）。
           * @return {jQuery}   匹配后返回的 jQuery 封装数组。
           */
          slice: function() {
            return this.pushStack(slice.apply(this, arguments));
          },

          /**
           * 从指定选择器中选取带有指定 index 值的元素。
           * @memberOf fly/jquery
           * @instance
           * @param  {Number}  i - 规定元素的 index 值。
           * @return {jQuery}  返回指定的组中特定序号的元素。
           */
          eq: function(i) {
            var len = this.length,
              j = +i + (i < 0 ? len : 0);
            return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
          },

          /**
           * 结束当前链条中的最近的筛选操作，并将匹配元素集还原为之前的状态。
           * @memberOf fly/jquery
           * @instance
           * @return {jQuery}  还原至前一个状态。
           */
          end: function() {
            return this.prevObject || this.constructor();
          },

          push: arr.push,
          sort: arr.sort,
          splice: arr.splice
        };

        jQuery.fn.init = function(context) {
          return jQuery.parseHTML(context, document);
        };

        /**
         * 将两个或更多对象的内容合并到第一个对象。两种语法格式：
         *
         * jQuery.extend(target [, object1 ] [, objectN ])
         *
         * jQuery.extend([deep ], target, object1 [, objectN ])
         *
         * 当只有一个参数时，被扩展的对象是jQuery 本身。
         *
         * @param {Boolean} [deep] - 是否深度合并对象，默认为 false （浅拷贝）。
         * 当值设置为 true 表示深拷贝，如果后面合并对象有的属性目标对象中也有，会继续在查找这个相同的参数对象，
         * 比较参数中是否还有不一样的属性，如果有，将其继承到第一个对象，如果没有，则覆盖。
         * @param {Object} target    - 类型目标对象，其他对象的成员属性将被复制到该对象上。
         * @param {Object} [Object1] - 第一个被合并的对象。
         * @param {Object} [ObjectN] - 第N个被合并的对象。
         * @return  {Object} 返回扩展了其他对象后的目标对象（即 target）。
         *
         * @memberOf fly/jquery
         * @alias extend
         * @example
         * // 浅拷贝输出:
         * // {fly:{type: 'mvvm'}}
         *fly.$.extend({fly:{name: 'fly',type: 'js'}}, {fly:{type: 'mvvm'}});
         *
         * @example
         * // 深拷贝输出:
         * // {fly:{name: 'fly',type: 'mvvm'}}
         * fly.$.extend(true, {fly:{name: 'fly',type: 'js'}}, {fly:{type: 'mvvm'}});
         */
        jQuery.extend = function() {
          var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

          if (typeof target === "boolean") {
            deep = target;
            target = arguments[i] || {};
            i++;
          }

          if (typeof target !== "object" && !jQuery.isFunction(target)) {
            target = {};
          }

          if (i === length) {
            target = this;
            i--;
          }

          for (; i < length; i++) {
            if ((options = arguments[i]) != null) {
              for (name in options) {
                src = target[name];
                copy = options[name];
                if (target === copy) {
                  continue;
                }

                if (deep && copy && (jQuery.isPlainObject(copy) ||
                  (copyIsArray = jQuery.isArray(copy)))) {

                  if (copyIsArray) {
                    copyIsArray = false;
                    clone = src && jQuery.isArray(src) ? src : [];
                  } else {
                    clone = src && jQuery.isPlainObject(src) ? src : {};
                  }

                  target[name] = jQuery.extend(deep, clone, copy);

                } else if (copy !== undefined) {
                  target[name] = copy;
                }
              }
            }
          }

          return target;
        };

        jQuery.extend({

          /**
           * 一个空函数，此方法不接受任何参数。当你仅仅想要传递一个空函数的时候，就用他吧。这对一些插件作者很有用，当插件提供了一个可选的回调函数接口，
           * 那么如果调用的时候没有传递这个回调函数，就用jQuery.noop来代替执行。
           * @memberOf fly/jquery
           * @example
           * // function
           * console.log(typeof fly.$.noop);
           */
          noop: function() {},

          /**
           * 用于判断传入参数的类型是否为函数类型。注意：jQuery 1.3以后，在IE浏览器里，浏览器提供的函数比如'alert'还有 DOM 元素的方法比如 'getAttribute' 将不认为是函数
           * @memberOf fly/jquery
           * @param   {*} obj  - 需要判断类型的参数。
           * @return  {Boolean} 返回 true 表示是函数类型；返回 false 表示不是函数类型。
           * @example
           * // true
           * fly.$.isFunction(new Function());
           */
          isFunction: function(obj) {
            return jQuery.type(obj) === "function";
          },

          /**
           * 用于判断传入参数的类型是否为数组类型，用来指明对象是否是一个JavaScript数组（而不是类似数组的对象，如一个jQuery对象）。
           * @memberOf fly/jquery
           * @param   {*} obj  - 需要判断类型的参数。
           * @return  {Boolean} 返回 true 表示是数组类型；返回 false 表示不是数组类型。
           * @function
           * @example
           * // true
           * fly.$.isArray([]);
           */
          isArray: Array.isArray || function(obj) {
            return jQuery.type(obj) === "array";
          },

          /**
           * 用于判断传入参数是否是 Window 对象。
           * @memberOf fly/jquery
           * @param   {*} obj  - 用于测试是否为窗口的对象。
           * @return  {Boolean} 返回 true 表示是Window 对象；返回 false 表示不是Window 对象。
           * @example
           * // true
           * fly.$.isWindow(window);
           */
          isWindow: function(obj) {
            return obj != null && obj === obj.window;
          },

          /**
           * 用于判断传入参数是否是一个数字值。
           * @memberOf fly/jquery
           * @param   {*} obj  - 需要判断的参数。
           * @return  {Boolean} 返回 true 表示是传入的参数是一个数字值；返回 false 表示不是传入的参数是一个数字值。
           * @example
           * // false
           * fly.$.isNumeric({});
           * @example
           * // true
           * fly.$.isNumeric(123);
           */
          isNumeric: function(obj) {
            var type = jQuery.type(obj);
            return (type === "number" || type === "string") &&
              !isNaN(obj - parseFloat(obj));
          },

          /**
           * 用于判断传入参数是否是一个纯粹的对象。即判断该参数是不是通过 '{}' 和 'new Object' 创建的。
           * @memberOf fly/jquery
           * @param   {*} obj  - 需要判断的参数。
           * @return  {Boolean} 返回 true 表示是纯粹的对象；返回 false 表示不是纯粹的对象。
           * @example
           * // true
           * fly.$.isPlainObject({});
           */
          isPlainObject: function(obj) {
            if (jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow(obj)) {
              return false;
            }

            if (obj.constructor &&
              !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
              return false;
            }

            return true;
          },

          /**
           * 用于判断传入参数是否是一个空对象，不包含任何属性。
           * @memberOf fly/jquery
           * @param   {*} obj   - 用于测试是否为空对象。
           * @return  {Boolean} 返回 true 表示是空对象；返回 false 表示不是空对象。
           * @example
           * // true
           * fly.$.isEmptyObject({});
           */
          isEmptyObject: function(obj) {
            var name;
            for (name in obj) {
              return false;
            }
            return true;
          },

          /**
           * 用于判断传入参数的类型。如果对象是 undefined 或 null ，则返回相应的 'undefined' 或'null'。
           * @memberOf fly/jquery
           * @param   {*} obj - 需要确定类型的对象。
           * @return  {String} 对应的类型名称。
           * @example
           * // "null"
           * fly.$.type(null);
           * // "object"
           * fly.$.type({});
           */
          type: function(obj) {
            if (obj == null) {
              return obj + "";
            }

            return typeof obj === "object" || typeof obj === "function" ?
              class2type[toString.call(obj)] || "object" :
              typeof obj;
          },

          /**
           * 用于判断节点名称是否是指定的名字。
           * @memberOf fly/jquery
           * @param   {Object} elel - 判断的节点对象。
           * @param   {String} name - 节点名称。
           *     如果是元素节点，name 是标签名称；
           *     如果是属性节点，name 是属性名称；
           *     如果是文本节点，name 是#text；
           *     如果是文档节点，name 是#document；
           * @return {Boolean} 返回 true 表示是；返回 false 表示不是。
           * @example
           * // true
           * fly.$.nodeName(document.createElement('div'),'div');
           */
          nodeName: function(elem, name) {
            return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
          },

          /**
           * 一个通用的迭代函数，它可以用来无缝迭代对象和数组。数组和类似数组的对象通过一个长度属性（如一个函数的参数对象）来迭代数字索引，从0到length - 1。
           * 其他对象通过其属性名进行迭代。
           * @memberOf fly/jquery
           * @param  {(Array | Object)}   obj      - 需要遍历的对象。
           * @param  {Function}           callback - 为每个匹配元素规定运行的函数，(index: Number, value: *)，index：当前遍历对象所在数组中的索引，value: 当前遍历数组中的元素。
           * @return {(Array | Object)}   遍历的数组或对象。
           * @example
           * // 0a
           * // 1b
           * // 2c
           * fly.$.each(['a','b','c'],function(index,ele){console.log(index + ele)});
           */
          each: function(obj, callback) {
            var length, i = 0;

            if (isArrayLike(obj)) {
              length = obj.length;
              for (; i < length; i++) {
                if (callback.call(obj[i], i, obj[i]) === false) {
                  break;
                }
              }
            } else {
              for (i in obj) {
                if (callback.call(obj[i], i, obj[i]) === false) {
                  break;
                }
              }
            }

            return obj;
          },

          /**
           * 去掉字符串起始和结尾的空格。
           * @memberOf fly/jquery
           * @param   {String}   text - 需要去除首尾空格的字符串。
           * @return  {String}   去除了首尾空格的字符串。
           * @example
           * // "fly.js"
           * fly.$.trim(' fly.js ');
           */
          trim: function(text) {
            return text == null ? "" : (text + "").replace(rtrim, "");
          },

          /**
           * 将一个类数组对象转换为真正的数组对象。类数组对象是一个常规的对象，具有 lenth 属性，也可以通过下标获取对应的值，但不具有数组的内置方法（如push()等）。
           * @memberOf fly/jquery
           * @param   {Object} arr - 需要转换为数组的类数组对象。
           * @return  {Array} 转换后的数组对象。
           */
          makeArray: function(arr, results) {
            var ret = results || [];

            if (arr != null) {
              if (isArrayLike(Object(arr))) {
                jQuery.merge(ret,
                  typeof arr === "string" ? [arr] : arr
                );
              } else {
                push.call(ret, arr);
              }
            }

            return ret;
          },

          /**
           * 确定第一个参数在数组中的位置，从0开始计数(如果没有找到则返回 -1 )。
           * @memberOf fly/jquery
           * @param   {*}         elem    - 要查找的值。
           * @param   {Array}     arr     - 一个数组，通过它来查找。
           * @param   {Number}    i       - 数组索引值，表示从哪里在开始查找。默认值是0，这将查找整个数组。
           * @return  {Number}   并返回它的索引（如果没有找到，则返回-1。
           * @example
           * // 1
           * fly.$.inArray('second',['first','second','third']);
           */
          inArray: function(elem, arr, i) {
            return arr == null ? -1 : indexOf.call(arr, elem, i);
          },

          /**
           * 合并两个数组内容到第一个数组。
           * @memberOf fly/jquery
           * @param   {Array} first   - 第一个用于合并的数组，其中将会包含合并后的第二个数组的内容。
           * @param   {Array} second  - 第二个用于合并的数组，该数组不会被修改，其中的内容将会被合并到第一个数组中。
           * @return  {Array} 返回合并两个数组后的数组。
           * @example
           * // [1, 2, 3, 4]
           * fly.$.merge([1,2],[3,4]);
           */
          merge: function(first, second) {
            var len = +second.length,
              j = 0,
              i = first.length;

            for (; j < len; j++) {
              first[i++] = second[j];
            }

            first.length = i;

            return first;
          },

          /**
           * 使用过滤函数过滤数组元素。此函数至少传递两个参数：待过滤数组和过滤函数。过滤函数必须返回 true 以保留元素或 false 以删除元素，原始数组不受影响。
           * @memberOf fly/jquery
           * @param   {Array}     elems           - 待过滤数组。
           * @param   {Function}  callback        - 此函数将处理数组每个元素。第一个参数为当前元素，第二个参数而元素索引值。此函数应返回一个布尔值。
           *                                      另外，此函数可设置为一个字符串，当设置为字符串时，将视为“lambda-form”（缩写形式？），
           *                                      其中 a 代表数组元素，i 代表元素索引值。如“a > 0”代表“function(a){ return a > 0; }”。
           * @param   {Boolean}   [invert]        - 如设为 false（默认），将返回一个满足函数条件的元素组成的数组。如设为 true，将返回一个不满足函数条件的元素组成的数组。
           * @return  {Array}  返回符合参数设置的数组。
           * @example
           * // [1, 2]
           * fly.$.grep([1,2,3,4],function(n,i){return n < 3});
           * @example
           * // [3, 4]
           * fly.$.grep([1,2,3,4],function(n,i){return n < 3}, true);
           */
          grep: function(elems, callback, invert) {
            var callbackInverse,
              matches = [],
              i = 0,
              length = elems.length,
              callbackExpect = !invert;

            for (; i < length; i++) {
              callbackInverse = !callback(elems[i], i);
              if (callbackInverse !== callbackExpect) {
                matches.push(elems[i]);
              }
            }

            return matches;
          },

          /**
           * 将一个数组中的所有元素转换到另一个数组中。
           * @memberOf fly/jquery
           * @param   {Array}     elems           - 待转换数组或对象。
           * @param   {Function}  callback        - 为每个匹配元素规定运行的函数。
           * @param   {Object}    callback.elem   - 正在被检查的数组的元素。
           * @param   {Number}    callback.index  - 该元素的索引值。
           * @return  {Array}     转换后的值，该值会被映射到最终的结果数组中。
           * @example
           * // [2, 3, 4, 5]
           * var oldArr = [1,2,3,4],
           *     newArr = fly.$.map(oldArr,function(n,i){return n+1;});
           * console.log(newArr);
           */
          map: function(elems, callback, arg) {
            var length, value,
              i = 0,
              ret = [];

            if (isArrayLike(elems)) {
              length = elems.length;
              for (; i < length; i++) {
                value = callback(elems[i], i, arg);

                if (value != null) {
                  ret.push(value);
                }
              }

            } else {
              for (i in elems) {
                value = callback(elems[i], i, arg);

                if (value != null) {
                  ret.push(value);
                }
              }
            }

            return concat.apply([], ret);
          },

          guid: 1,

          /**
           * 接受一个函数，然后返回一个新函数，并且这个新函数始终保持了特定的上下文语境。
           * 这个方法通常在向一个元素上附加事件处理函数时，上下文语境实际是指向另一个对象的情况下使用。
           * @memberOf fly/jquery
           * @param   {Function}  fn      - 将要改变上下文语境的函数。
           * @param   {Object}    context - 函数的上下文语境(this)会被设置成这个 object 对象。
           * @return  {Function}
           */
          proxy: function(fn, context) {
            var tmp, args, proxy;

            if (typeof context === "string") {
              tmp = fn[context];
              context = fn;
              fn = tmp;
            }

            if (!jQuery.isFunction(fn)) {
              return undefined;
            }

            args = slice.call(arguments, 2);
            proxy = function() {
              return fn.apply(context || this, args.concat(slice.call(arguments)));
            };

            proxy.guid = fn.guid = fn.guid || jQuery.guid++;

            return proxy;
          },

          /**
           * 通过jQuery操作方法修改或过滤HTML字符串。
           * 这种方法很少需要直接调用，可以使用这个方法作为修改现有jQuery操作方法的一个切入点。
           * @memberOf fly/jquery
           * @param   {String} html - 需要操作的HTML字符串。
           * @return  被修改或过滤后的HTML字符串。
           */
          htmlPrefilter: function(html) {
            return html.replace(rxhtmlTag, "<$1></$2>");
          },

          /**
           * 根据绑定到匹配元素的给定的事件类型执行所有的处理程序和行为。
           * @memberOf fly/jquery
           * @param   {Array}             elems     - 待触发事件的对象。
           * @param   {String}            eventType - 一个包含JavaScript事件类型的字符串，比如click 或 submit。
           * @param   {(Array | Object)}  eventData - 传递给事件处理程序的额外参数。
           * @return  jQuery实例化对象
           */
          trigger: function(element, eventType, eventData) {
            element.dispatchEvent(new CustomEvent(eventType, {
              detail: eventData,
              bubbles: true,
              cancelable: true
            }));
            return this;
          },

          support: {}
        });

        var rxhtmlTag =
          /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,
          rsingleTag = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;

        var createHTMLDocument = (function() {
          var body;

          if (!document.implementation.createHTMLDocument) return false;

          body = document.implementation.createHTMLDocument("").body;
          body.innerHTML = "<form></form><form></form>";
          return body.childNodes.length === 2;
        })();

        /**
         * 解析html字符串：将HTML字符串解析为对应的DOM节点数组。
         * @memberOf fly/jquery
         * @alias parseHTML
         * @param   {String} data  - HTML字符串。
         * @return  {Object} 返回 jQuery 封装数组。
         */
        jQuery.parseHTML = function(data) {

          // Stop scripts or inline event handlers from being executed immediately
          // by using document.implementation
          var context = createHTMLDocument ?
            document.implementation.createHTMLDocument("") :
            document;

          var parsed = rsingleTag.exec(data);

          // Single tag
          if (parsed) {
            return [context.createElement(parsed[1])];
          }

          parsed = buildFragment([data], context);

          return jQuery.merge([], parsed.childNodes);
          // return parsed.childNodes[0];
        };

        jQuery.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(
            " "),
          function(i, name) {
            class2type["[object " + name + "]"] = name.toLowerCase();
          });

        /**
         * 用于判断对象是不是类数组对象。即拥有 length 属性且可通过索引值获取的对象。
         * @private
         * @param   {Object} obj - 待测对象。
         * @return {Boolean} 返回 true 表示是；返回 false 表示不是。
         */
        function isArrayLike(obj) {
          var length = !!obj && "length" in obj && obj.length,
            type = jQuery.type(obj);

          if (type === "function") {
            return false;
          }

          return type === "array" || length === 0 ||
            typeof length === "number" && length > 0 && (length - 1) in obj;
        }

        var rhtml = /<|&#?\w+;/,
          rtagName = /<([a-z][^\/\0>\x20\t\r\n\f]+)/i,
          rscriptType = /^$|\/(?:java|ecma)script/i;

        var wrapMap = {

          // Support: IE9
          option: [1, "<select multiple='multiple'>", "</select>"],

          // XHTML parsers do not magically insert elements in the
          // same way that tag soup parsers do. So we cannot shorten
          // this by omitting <tbody> or other required elements.
          thead: [1, "<table>", "</table>"],
          col: [2, "<table><colgroup>", "</colgroup></table>"],
          tr: [2, "<table><tbody>", "</tbody></table>"],
          td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],

          _default: [0, "", ""]
        };

        // Support: IE9
        wrapMap.optgroup = wrapMap.option;

        wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
        wrapMap.th = wrapMap.td;

        /**
         * 将数据转换成Dom元素并构建包含所有子节点的文档片段。
         * @private
         * @param   {Array}     elems   - 待转换的数组对象。可包含dom元素、HTML字符串及普通字符串
         * @param   {Object}    context - 上下文语境。
         * @return  {Object}    返回创建后的文档片段。
         */
        function buildFragment(elems, context) {
          var elem, tmp, tag, wrap, contains, j,
            fragment = context.createDocumentFragment(),
            nodes = [],
            i = 0,
            l = elems.length;

          for (; i < l; i++) {
            elem = elems[i];

            if (elem || elem === 0) {

              // Add nodes directly
              if (jQuery.type(elem) === "object") {

                // Support: Android<4.1, PhantomJS<2
                // push.apply(_, arraylike) throws on ancient WebKit
                jQuery.merge(nodes, elem.nodeType ? [elem] : elem);

                // Convert non-html into a text node
              } else if (!rhtml.test(elem)) {
                nodes.push(context.createTextNode(elem));

                // Convert html into DOM nodes
              } else {
                tmp = tmp || fragment.appendChild(context.createElement("div"));

                // Deserialize a standard representation
                tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase();
                wrap = wrapMap[tag] || wrapMap._default;
                tmp.innerHTML = wrap[1] + jQuery.htmlPrefilter(elem) + wrap[2];

                // Descend through wrappers to the right content
                j = wrap[0];
                while (j--) {
                  tmp = tmp.lastChild;
                }

                // Support: Android<4.1, PhantomJS<2
                // push.apply(_, arraylike) throws on ancient WebKit
                jQuery.merge(nodes, tmp.childNodes);

                // Remember the top-level container
                tmp = fragment.firstChild;

                // Ensure the created nodes are orphaned (#12392)
                tmp.textContent = "";
              }
            }
          }

          // Remove wrapper from fragment
          // fragment.textContent = "";
          fragment = context.createDocumentFragment();

          i = 0;
          while ((elem = nodes[i++])) {

            // Append to fragment
            fragment.appendChild(elem);

          }

          return fragment;
        }

        module.exports = jQuery;
      }, {}
    ],
    8: [
      function(_require, module, exports) {
        var fly = _require('./fly.core');

        _require('./fly.ajax');
        _require('./fly.binder');
        _require('./fly.component');
        _require('./fly.data');
        _require('./fly.format');
        _require('./fly.jquery');
        _require('./fly.model');
        _require('./fly.ndata');
        _require('./fly.observable');
        _require('./fly.router');
        _require('./fly.support');
        _require('./fly.template');
        _require('./fly.utils');

        fly.version = '1.2.6';
        module.exports = fly;
      }, {
        "./fly.ajax": 1,
        "./fly.binder": 2,
        "./fly.component": 3,
        "./fly.core": 4,
        "./fly.data": 5,
        "./fly.format": 6,
        "./fly.jquery": 7,
        "./fly.model": 9,
        "./fly.ndata": 10,
        "./fly.observable": 11,
        "./fly.router": 12,
        "./fly.support": 13,
        "./fly.template": 14,
        "./fly.utils": 15
      }
    ],
    9: [
      function(_require, module, exports) {
        /**
         * 数据模型
         * @author: huanzhang
         * @email: huanzhang@iflytek.com
         * @update: 2015-09-06
         */

        'use strict';

        /**
         * @namespace fly
         */

        var fly = _require('./fly.core'),
          ob = _require('./fly.observable'),
          format = _require('./fly.format'),
          ObservableObject = fly.ObservableObject,
          $ = fly.$,
          extend = $.extend,
          isArray = $.isArray,
          isEmptyObject = $.isEmptyObject,
          isPlainObject = $.isPlainObject;

        // 静态变量
        var STRING = 'string';

        function getFieldByName(obj, name) {
          var field,
            fieldName;

          for (fieldName in obj) {
            field = obj[fieldName];
            if (isPlainObject(field) && field.field && field.field === name) {
              return field;
            } else if (field === name) {
              return field;
            }
          }
          return null;
        }

        function equal(x, y) {
          if (x === y) {
            return true;
          }

          var xtype = $.type(x),
            ytype = $.type(y),
            field;

          if (xtype !== ytype) {
            return false;
          }

          if (xtype === "date") {
            return x.getTime() === y.getTime();
          }

          if (xtype !== "object" && xtype !== "array") {
            return false;
          }

          for (field in x) {
            if (!equal(x[field], y[field])) {
              return false;
            }
          }

          return true;
        }

        var parsers = {

          "number": function(value) {
            return parseFloat(value);
          },

          "date": function(value) {
            return format.parseDate(value);
          },

          "boolean": function(value) {
            if (typeof value === STRING) {
              return value.toLowerCase() === "true";
            }
            return value != null ? !!value : value;
          },

          "string": function(value) {
            return value != null ? (value + "") : value;
          },

          "default": function(value) {
            return value;
          }
        };

        var defaultValues = {
          "string": "",
          "number": 0,
          "date": new Date(),
          "boolean": false,
          "default": ""
        };

        /**
         * 数据模型的基类，继承了 Observable 及 ObservableObject（即观察者对象）的方法和属性，并提供设置和更新数据的接口。
         * @see 父类接口请查看 fly.observable.js 模块
         * @memberOf fly
         * @class
         * @alias fly.Model
         * @example
         * var model = new fly.Model();
         */
        var Model = ObservableObject.extend({

          /**
           * 初始函数，继承父类（ Observable 及 ObservableObject 即观察者对象）的方法和属性。
           * @memberOf fly.Model.prototype
           * @param  {Object} data - 数据对象，当传入值为空时会自动捕获通过 define 方法定义的数据及配置。
           */
          ctor: function(data) {
            var that = this,
              initializers = that._initializers;

            if (!data || isEmptyObject(data)) {
              data = extend({}, that.defaults, data);

              if (initializers) {
                for (var idx = 0; idx < initializers.length; idx++) {
                  var name = initializers[idx];
                  data[name] = that.defaults[name]();
                }
              }
            }

            that._super(data);

            that.dirty = false;

            if (that.idField) {
              that.id = that.get(that.idField);

              if (that.id === undefined) {
                that.id = that._defaultId;
              }
            }
          },

          /**
           * 判断属性是否可被序列化，如果是 fly 内部自定义的属性是不可被序列化的，
           * 如：'uid'、'_events'、'dirty'、'_super'等。
           * @memberOf fly.Model.prototype
           * @param   {String} field - 对象属性名称
           * @example
           * // false
           * new fly.Model().shouldSerialize('_super')
           * @return {Boolean} 返回true，表示可以；返回false，表示不可以。
           */
          shouldSerialize: function(field) {
            return this._super(field) &&
              field !== "uid" &&
              !(this.idField !== "id" && field === "id") &&
              field !== "dirty" &&
              field !== "_accessors";
          },

          /**
           * 获取缓存中的值，如果有则返回缓存值，没有则返回本身。
           * @memberOf fly.Model.prototype
           * @private
           * @param   {String}          field - 需要设置的对象名称
           * @param   {String | Object} value - 需要设置的值
           */
          _parse: function(field, value) {
            var that = this,
              fieldName = field,
              fields = (that.fields || {}),
              parse;

            field = fields[field];
            if (!field) {
              field = getFieldByName(fields, fieldName);
            }
            if (field) {
              parse = field.parse;
              if (!parse && field.type) {
                parse = parsers[field.type.toLowerCase()];
              }
            }

            return parse ? parse(value) : value;
          },

          /**
           * 判断数据的事件操作的动作，更新数据脏检测属性，
           * 当事件动作是add 或者 remove 的时候，脏检测属性设置为 true。
           * @memberOf fly.Model.prototype
           * @private
           * @param   {Object} e - 数据对象
           */
          _notifyChange: function(e) {
            var action = e.action;

            if (action == 'add' || action == 'remove') {
              this.dirty = true;
            }
          },

          /**
           * 判断数据对象中的属性是否可编辑。
           * @memberOf fly.Model.prototype
           * @param   {String}  field - 属性名称
           * @return  {Boolean} 返回 true 表示可设置，返回 false 表示不可设置。
           */
          editable: function(field) {
            field = (this.fields || {})[field];
            return field ? field.editable !== false : true;
          },

          /**
           * 设置模型数据中的单个属性值。
           * 设置值首先会获取缓存中的数据，当赋值数据与缓存数据不一样时才执行赋值操作。
           * @memberOf fly.Model.prototype
           * @param   {String}          field - 需要设置的对象名称
           * @param   {String | Object} value - 需要设置的值
           */
          set: function(field, value, initiator) {
            var that = this;

            if (that.editable(field)) {
              value = that._parse(field, value);

              if (!equal(value, that.get(field))) {
                that.dirty = true;
                ObservableObject.fn.set.call(this, field, value, initiator);
              }
            }
          },

          /**
           * 替换或添加模型的数据，
           * 当原数据更新时，则替换；当新数据更新时，则添加。
           * @memberOf fly.Model.prototype
           * @param   {Object} data - 新的模型数据
           */
          accept: function(data) {
            var that = this,
              parent = function() {
                return that;
              },
              field;

            for (field in data) {
              var value = data[field];

              if (field.charAt(0) != "_") {
                value = that.wrap(data[field], field, parent);
              }

              that._set(field, value);
            }

            if (that.idField) {
              that.id = that.get(that.idField);
            }

            that.dirty = false;
          },

          /**
           * 判断当前 id 属性值与原始 id 属性值是否相同。
           * 当前 id 属性值：通过 get(id) 方法获取，若有，则取值，若没有，则取模型构造函数中的原始 id 值；
           * 原始 id 属性值：通过 define 方法构造模型时获取的 id 属性值。
           * @memberOf fly.Model.prototype
           * @return {Boolean} 返回 true 表示相同；返回 false 表示不同。
           */
          isNew: function() {
            return this.id === this._defaultId;
          }
        });


        /**
         * 数据模型实例的构造函数，支持定义属性和方法，可以通过 new 关键字来返回一个实例。
         * 支持输入2个参数：base 和 options；当输入一个参数时表示options。
         * @see 案例请参考：{@link http://www.flyui.cn/v1/docs/advance/model.html}
         *
         * @param  {Object}         base           -  实例模型的父类，可不填，默认为 Model 基类
         * @param  {Object}         options        -  数据模型的配置参数
         * @param  {Object | Array} options.fields -  数据模型属性配置，放置数据的属性
         * @param  {String} [options.fields.type = 'string'] -  属性的类型，支持定义为：'string'（字符串类型）、'number'（数字类型）、'data'（日期类型）、'boolean'（布尔类型）
         * @param  {String} [options.fields.field]           - 属性名称，未定义的直接取外部属性名
         * @param  {*} [options.fields.defaultValue]         - 属性的默认值，当实例化的数据模型未传入对应属性值的时候赋值
         * @param  {Function} [options.fields.parse]         - 属性的取值方法，当属性值更新的时候执行相应的取值操作
         * @param  {Function} [options.functionName]         - 数据模型方法，方法名称自定义
         * @return {Object} 定义后的数据模型。
         * @memberOf fly.Model
         * @alias define
         */
        Model.define = function(base, options) {

          if (options === undefined) {
            options = base;
            base = Model;
          }

          var model,
            proto = extend({
              defaults: {}
            }, options),
            name,
            field,
            type,
            value,
            idx,
            length,
            fields = {},
            originalName,
            id = proto.id,
            functionFields = [];

          if (id) {
            proto.idField = id;
          }

          if (proto.id) {
            delete proto.id;
          }

          if (id) {
            proto.defaults[id] = proto._defaultId = "";
          }

          if (isArray(proto.fields)) {
            for (idx = 0, length = proto.fields.length; idx < length; idx++) {
              field = proto.fields[idx];
              if (typeof field === STRING) {
                fields[field] = {};
              } else if (field.field) {
                fields[field.field] = field;
              }
            }
            proto.fields = fields;
          }

          for (name in proto.fields) {
            field = proto.fields[name];
            type = field.type || "default";
            value = null;
            originalName = name;

            name = typeof(field.field) === STRING ? field.field : name;

            if (!field.nullable) {
              value = proto.defaults[originalName !== name ? originalName : name] = field.defaultValue !==
                undefined ? field.defaultValue : defaultValues[type.toLowerCase()];

              if (typeof value === "function") {
                functionFields.push(name);
              }
            }

            if (options.id === name) {
              proto._defaultId = value;
            }

            proto.defaults[originalName !== name ? originalName : name] = value;

            field.parse = field.parse || parsers[type];
          }

          if (functionFields.length > 0) {
            proto._initializers = functionFields;
          }

          model = base.extend(proto);
          model.define = function(options) {
            return Model.define(model, options);
          };

          if (proto.fields) {
            model.fields = proto.fields;
            model.idField = proto.idField;
          }

          return model;
        };

        fly.Model = Model;
        module.exports = Model;

      }, {
        "./fly.core": 4,
        "./fly.format": 6,
        "./fly.observable": 11
      }
    ],
    10: [
      function(_require, module, exports) {
        'use strict';

        /**
         * @namespace fly
         */
        var fly = _require('./fly.core'),
          Model = _require('./fly.model'),
          DataSource = _require('./fly.data'),
          $ = fly.$,
          Deferred = $.Deferred,
          extend = $.extend,
          proxy = $.proxy,
          slice = [].slice;

        var STRING = 'string',
          CHANGE = 'change',
          ERROR = 'error';

        /**
         * 树数据源的基类，是对 DataSource（即数据源）的方法和属性的拓展，同时更新了数据移除、添加、获取等方法。
         * 新更新的方法名称与数据源对应的方法名称相同，只是在内部，因树数据源数据的特点进行了特殊处理。
         * @see 父类接口请查看 fly.data.js 模块；Demo应用请查看 {@link http://www.flyui.cn/v1/docs/component/Tree.html}
         * @memberOf fly
         * @class
         * @alias fly.ndata
         */
        var NodeDataSource = DataSource.extend({
          /**
           * 初始函数，继承父类（DataSource 即数据源）的方法和属性。
           * @memberOf fly.ndata.prototype
           * @param  {Object | Array} options - 数据对象
           */
          ctor: function(options) {
            if (!options) return;

            var node = Node.define({
              children: options
            });

            this._super(extend(true, {}, {
              modelBase: node,
              model: node
            }, options));

            this._attachBubbleHandlers();
          },

          /**
           * 数据加载失败事件绑定。
           * @private
           * @memberOf fly.ndata.prototype
           */
          _attachBubbleHandlers: function() {
            var that = this;

            that._data.bind(ERROR, function(e) {
              that.trigger(ERROR, e);
            });
          },

          /**
           * 移除树数据源中的某个指定的数据成员。
           * @memberOf fly.ndata.prototype
           * @param  {Object | Array} node - 需要移除的节点数据成员。
           * @return {Object} 移除需要删除数据成员后的树数据源。
           */
          remove: function(node) {
            var parentNode = node.parentNode(),
              dataSource = this,
              result;

            if (parentNode && parentNode._initChildren) {
              dataSource = parentNode.children;
            }

            result = dataSource._super.remove(node);

            if (parentNode && !dataSource.data().length) {
              parentNode.hasChildren = false;
            }

            return result;
          },

          /**
           * 数据读取成功之后执行一系列操作。
           * @see 具体可参考 fly.data.js 中的 success 方法。
           * @memberOf fly.ndata.prototype
           * @function
           * @param  {Object} data - 数据模型对象。
           */
          success: dataMethod("success"),

          /**
           * 替换树数据源的数据模型。
           * @memberOf fly.ndata.prototype
           * @param  {Array} value - 用来替换数据源的数据。
           * @function
           * @return {Object} 包含新数据对象的树数据源。
           */
          data: dataMethod("data"),

          /**
           * 插入新的数据成员到已知的树数据源中，并可指定插入的位置。
           * @memberOf fly.ndata.prototype
           * @param  {Number} index - 需要插入的下标位置，位置取值范围在0 - length-1(总数)之间。
           * @param  {Object} model - 新的数据对象。
           * @return {Object} 插入新的数据成员后的树数据源。
           */
          insert: function(index, model) {
            var parentNode = this.parent();

            if (parentNode && parentNode._initChildren) {
              parentNode.hasChildren = true;
              parentNode._initChildren();
            }

            return this._super(index, model);
          },

          /**
           * 获取树数据源中的成员数据。
           * @param   {String} id - 对应字段名的值
           * @param   {String} [key] 字段名，若不填则取对应成员数据的uid属性进行判断。
           * @return  {Object} 符合条件的成员数据。
           * @memberOf fly.ndata.prototype
           */
          get: function(value, field) {
            var idx, length, node, data, children;

            node = this._super(value, field);

            if (node) {
              return node;
            }

            data = this._data;

            if (!data) {
              return;
            }

            for (idx = 0, length = data.length; idx < length; idx++) {
              children = data[idx].children;

              if (!(children instanceof NodeDataSource)) {
                continue;
              }

              node = children['get'](value, field);

              if (node) {
                return node;
              }
            }
          }
        });


        var Node = Model.define({
          idField: "id",

          ctor: function(value) {
            if (!value) return;

            var that = this,
              hasChildren = that.hasChildren || value && value.hasChildren,
              childrenField = "items",
              childrenOptions = {};

            if (value.children instanceof Array) {
              value.items = value.children;
              delete value.children;
            }

            that._super(value);

            if (typeof that.children === STRING && that.children != 'children') {
              childrenField = that.children;
            }

            childrenOptions = {
              childrenField: childrenField,
              model: {
                hasChildren: hasChildren,
                id: that.idField,
                fields: that.fields
              }
            };

            if (typeof that.children !== STRING) {
              extend(childrenOptions, that.children);
            }

            childrenOptions.data = value;

            if (!hasChildren) {
              hasChildren = childrenOptions.childrenField;
            }

            if (typeof hasChildren === STRING) {
              hasChildren = fly.getter(hasChildren);
            }

            if ($.isFunction(hasChildren)) {
              that.hasChildren = !!hasChildren.call(that, that);
            }

            that._childrenOptions = childrenOptions;

            if (that.hasChildren) {
              that._initChildren();
            }

            that._loaded = !!(value && (value[childrenField] || value._loaded));
          },

          _initChildren: function() {
            var that = this;
            var children, transport, parameterMap;

            if (!(that.children instanceof NodeDataSource)) {
              children = that.children = new NodeDataSource(that._childrenOptions);

              transport = children.transport;
              parameterMap = transport.parameterMap;

              transport.parameterMap = function(data, type) {
                data[that.idField || "id"] = that.id;

                if (parameterMap) {
                  data = parameterMap(data, type);
                }

                return data;
              };

              children.parent = function() {
                return that;
              };

              children.bind(CHANGE, function(e) {
                e.node = e.node || that;
                that.trigger(CHANGE, e);
              });

              children.bind(ERROR, function(e) {
                var collection = that.parent();

                if (collection) {
                  e.node = e.node || that;
                  collection.trigger(ERROR, e);
                }
              });

              that._updateChildrenField();
            }
          },

          append: function(model) {
            this._initChildren();
            this.loaded(true);
            this.children.add(model);
          },

          hasChildren: false,

          level: function() {
            var parentNode = this.parentNode(),
              level = 0;

            while (parentNode && parentNode.parentNode) {
              level++;
              parentNode = parentNode.parentNode ? parentNode.parentNode() : null;
            }

            return level;
          },

          _updateChildrenField: function() {
            var fieldName = this._childrenOptions.childrenField;

            this[fieldName || "items"] = this.children.data();
          },

          _childrenLoaded: function() {
            this._loaded = true;

            this._updateChildrenField();
          },

          /**
           * 返回 Deferred (延迟)的Promise（承诺）对象。
           * @see fly.ajax.js
           * @memberOf ndata
           * @private
           */
          load: function() {
            var options = {};
            var method = "_query";
            var children, promise;

            if (this.hasChildren) {
              this._initChildren();

              children = this.children;

              options[this.idField || "id"] = this.id;

              if (!this._loaded) {
                children._data = undefined;
                method = "read";
              }

              children.one(CHANGE, proxy(this._childrenLoaded, this));

              promise = children[method](options);
            } else {
              this.loaded(true);
            }

            return promise || Deferred().resolve().promise();
          },

          parentNode: function() {
            var array = this.parent();

            return array.parent();
          },

          loaded: function(value) {
            if (value !== undefined) {
              this._loaded = value;
            } else {
              return this._loaded;
            }
          },

          shouldSerialize: function(field) {
            return this._super(field) &&
              field !== "children" &&
              field !== "_loaded" &&
              field !== "hasChildren" &&
              field !== "_childrenOptions";
          }
        });

        function dataMethod(name) {
          return function() {
            var data = this._data,
              result = DataSource.fn[name].apply(this, slice.call(arguments));

            if (this._data != data) {
              this._attachBubbleHandlers();
            }

            return result;
          };
        }

        fly.ndata = fly.nodeDataSource = function(object) {
          if (!(object instanceof NodeDataSource)) {
            object = new NodeDataSource(object);
          }
          return object;
        };

        fly.NodeDataSource = NodeDataSource;
        module.exports = NodeDataSource;
      }, {
        "./fly.core": 4,
        "./fly.data": 5,
        "./fly.model": 9
      }
    ],
    11: [
      function(_require, module, exports) {
        /**
         * @file 观察者对象
         * @author huanzhang
         */

        'use strict';

        /**
         * @namespace fly
         */

        // 依赖
        var fly = _require('./fly.core'),
          Class = fly.Class,
          $ = fly.$,
          proxy = $.proxy,
          noop = $.noop;

        // 数据对象
        var data = {};
        var slice = [].slice;
        var objectToString = {}.toString;

        // 静态变量
        var FUNCTION = 'function',
          STRING = 'string',
          CHANGE = 'change',
          REMOVE = 'remove',
          ADD = 'add',
          GET = 'get',
          OBJ = '[object Object]',
          ARR = '[object Array]';

        /**
         * 观察者(事件驱动模型)，observable（监控属性），监控属性的意义就是它是被监控的，其他的代码可以订阅其变化的通知。
         * 构建观察者基类，为后续 ObservableObject 和 ObservableArray 继承使用。
         * @class
         * @memberOf fly
         * @alias fly.Observable
         */
        var Observable = Class.extend({

          /**
           * Observable 类的构造函数。
           * @memberOf fly.Observable.prototype
           */
          ctor: function() {
            this._events = {};
          },

          /**
           * 注册监听事件,监听的事件存储在_event中。
           * @param  {(String | Array | Object)}   eventName - 事件名称，可以是字符串、数组和对象。
           * @param  {Function} handlers - 事件，可以是函数或函数map。
           * @param  {Boolean}  one - 是否只执行一次。
           * @return {Object}   观察者对象。
           * @memberOf fly.Observable.prototype
           */
          bind: function(eventName, handlers, one) {
            var that = this,
              idx = 0,
              idt,
              events,
              original,
              handler,
              handlersIsFunction = typeof handlers === FUNCTION,
              eventNames = typeof eventName === STRING ? [
                eventName
              ] :
              eventName,
              length = eventNames.length;

            if (handlers === undefined) {
              for (idt in eventName) {
                that.bind(idt, eventName[idt]);
              }
              return that;
            }

            for (; idx < length; idx++) {
              eventName = eventNames[idx];

              handler = handlersIsFunction ? handlers : handlers[
                eventName];

              if (handler) {
                if (one) {
                  original = handler;
                  handler = function() {
                    that.unbind(eventName, handler);
                    original.apply(that, arguments);
                  };
                  handler.original = original;
                }
                events = that._events[eventName] = that._events[
                  eventName] || [];
                events.push(handler);
              }
            }

            return that;
          },

          /**
           * 注册事件，并且该事件只执行一次。该函数二次封装bind方法，明确指定绑定句柄执行一次后销毁。
           * @param  {(String | Array | Object)}   eventName - 事件名称，可以是字符串或数组。
           * @param  {Function} handlers - 事件，可以是函数或函数map。
           * @return {Object}   观察者对象。
           * @memberOf fly.Observable.prototype
           */
          one: function(eventNames, handlers) {
            return this.bind(eventNames, handlers, true);
          },

          /**
           * 注册事件，并且该事件放到队列最前面。
           * @param  {(String | Array | Object)}   eventName - 事件名称，可以是字符串或数组。
           * @param  {Function} handlers - 事件，可以是函数或函数map。
           * @return {Object}   观察者对象。
           * @memberOf fly.Observable.prototype
           */
          first: function(eventName, handlers) {
            var that = this,
              idx = 0,
              events,
              handler,
              handlersIsFunction = typeof handlers === FUNCTION,
              eventNames = typeof eventName === STRING ? [
                eventName
              ] :
              eventName,
              length = eventNames.length;

            for (; idx < length; idx++) {
              eventName = eventNames[idx];

              handler = handlersIsFunction ? handlers : handlers[
                eventName];

              if (handler) {
                events = that._events[eventName] = that._events[
                  eventName] || [];
                events.unshift(handler);
              }
            }

            return that;
          },

          /**
           * 触发指定事件。
           * @param  {String}  eventName - 事件名称。
           * @param  {Event}   e - Event对象，对象代表事件的状态，比如事件在其中发生的元素、键盘按键的状态、鼠标的位置、鼠标按钮的状态。 事件通常与函数结合使用，函数不会在事件发生前被执行！
           * @return {Boolean} 返回事件是否被阻止，内部扩展event.isDefalutPrevented()
           * @memberOf fly.Observable.prototype
           */
          trigger: function(eventName, e) {
            var that = this,
              events = that._events[eventName],
              idx,
              length;

            if (events) {
              e = e || {};
              e.sender = that;
              e._defaultPrevented = false;
              e.preventDefault = function() {
                this._defaultPrevented = true;
              };
              e.isDefaultPrevented = function() {
                return this._defaultPrevented === true;
              };
              events = events.slice();

              for (idx = 0, length = events.length; idx < length; idx++) {
                events[idx].call(that, e);
              }

              return e._defaultPrevented === true;
            }

            return false;
          },

          /**
           * 注销绑定事件。
           * @param  {(String | Undefined)}   eventName - 事件名称，如果事件名称为undefined,则默认注销所有的绑定事件。
           * @param  {Function} handler - 销毁指定eventName中的handler事件（同一个事件名称可以绑定多个事件），若 undefined，则默认销毁所有的事件，这里可以只注销其中一个。
           * @return {Object} 观察者对象。
           * @memberOf fly.Observable.prototype
           */
          unbind: function(eventName, handler) {
            var that = this,
              events = that._events[eventName],
              idx;

            if (eventName === undefined) {
              that._events = {};
            } else if (events) {
              if (handler) {
                for (idx = events.length - 1; idx >= 0; idx--) {
                  if (events[idx] === handler || events[idx].original ===
                    handler) {
                    events.splice(idx, 1);
                  }
                }
              } else {
                that._events[eventName] = [];
              }
            }

            return that;
          }
        });

        /**
         * 监听对象变化，继承observable基类的方法，并在此基础上封装实现特有方法。
         * @class
         * @augments {Observable}
         * @memberOf fly
         * @alias fly.ObservableObject
         */
        var ObservableObject = Observable.extend({

          /**
           * ObservableObject类的构造函数，对当前传入对象进行循环遍历每个属性，将其挂载到实例对象上， 对于嵌套对象，递归构造实例对象
           * @param {Object} value - 包含ObservableObject的一些属性和方法
           * @memberOf fly.ObservableObject.prototype
           */
          ctor: function(value) {
            var that = this,
              member,
              field,
              parent = function() {
                return that;
              };

            if (value === undefined) return;

            that._super();

            for (field in value) {
              member = value[field];

              if (!fly.isDOM(member) && typeof member === "object" && member && !member.getTime &&
                field.charAt(0) != "_") {
                member = that.wrap(member, field, parent);
              }

              that[field] = member;
            }

            that.uid = fly.guid();
          },

          /**
           * 是否需要序列化,判断当前传入参数是否是需要序列化，过滤掉不满足要求的字段或者对象。
           * 当且仅当传入字段在实例对象中，其值不等于_event和_super，并且当前属性对应的值不是Function返回true， 该方法用于forEach和toJSON方法中调用。
           * @param   {String}  field - 表示属性名的字符串
           * @returns {Boolean}
           * @memberOf fly.ObservableObject.prototype
           */
          shouldSerialize: function(field) {
            return this.hasOwnProperty(field) && field !== "_events" &&
              field !== "_super" && typeof this[field] !== FUNCTION &&
              field !== "uid";
          },

          /**
           * 遍历实例对象自身，并调用shouldSerialize方法过滤掉不满足要求的字段信息。 将当前对象的值和字段名称作为参数传递给回调函数。
           * @param {Function} f - 回调函数
           * @memberOf fly.ObservableObject.prototype
           */
          forEach: function(f) {
            for (var i in this) {
              if (this.shouldSerialize(i)) {
                f(this[i], i);
              }
            }
          },

          /**
           * JSON格式化，将ObservableObject转换成JSON对象，并调用shouldSerialize方法过滤掉不满足要求的字段信息。
           * 对于属性值是ObservableObject和ObservableArray的嵌套对象，使用递归方式进行格式转换。
           * @returns {object} 移除fly底层添加方法属性的对象
           * @memberOf fly.ObservableObject.prototype
           */
          toJSON: function(keepUid) {
            var result = {},
              value, field;

            for (field in this) {
              if (this.shouldSerialize(field, keepUid)) {
                value = this[field];

                if (value instanceof ObservableObject || value instanceof ObservableArray) {
                  value = value.toJSON(keepUid);
                }

                result[field] = value;
              }
            }

            return result;
          },

          /**
           * 根据传入的属性名在ObservableObject对象中获取与之对应的属性值。底层调用fly全局方法fly.getter方法，构造并缓存取值方法。
           * @param  {String} field - 表示属性名的字符串
           * @return {*} 该属性对应的值
           * @memberOf fly.ObservableObject.prototype
           */
          get: function(field) {
            var that = this,
              result;

            that.trigger(GET, {
              field: field
            });

            if (field === 'this') {
              result = that;
            } else {
              result = fly.getter(field, true)(that);
            }

            return result;
          },

          /**
           * @private
           */
          _set: function(field, value) {
            var that = this;
            var composite = field.indexOf(".") >= 0;

            if (composite) {
              var paths = field.split("."),
                path = "";

              while (paths.length > 1) {
                path += paths.shift();
                var obj = fly.getter(path, true)(that);
                if (obj instanceof ObservableObject) {
                  obj.set(paths.join("."), value);
                  return composite;
                }
                path += ".";
              }
            }

            fly.setter(field)(that, value);

            return composite;
          },

          /**
           * 设置ObservableObject对象中指定属性名的属性值
           * @param {String} field - 待设置值的属性名
           * @param {*} value - 属性名对应的值
           * @memberOf fly.ObservableObject.prototype
           */
          set: function(field, value) {
            var that = this,
              composite = field.indexOf(".") >= 0,
              current = fly.getter(field, true)(that);

            if (current !== value) {

              if (!that.trigger("set", {
                field: field,
                value: value
              })) {
                if (!composite) {
                  value = that.wrap(value, field, function() {
                    return that;
                  });
                }
                if (!that._set(field, value) || field.indexOf("(") >=
                  0 || field.indexOf("[") >= 0) {
                  that.trigger(CHANGE, {
                    field: field
                  });
                }
              }
            }
          },

          /**
           * 返回父级上下文的函数
           * @type {Function}
           * @memberOf fly.ObservableObject.prototype
           */
          parent: noop,

          /**
           * 对传入的对象或者数组，分别递归调用ObservableObject或者ObservableArray构造实例对象， 绑定get和change事件或者change事件
           * @param  {(Object | Array)} object 标识带处理的对象或数组
           * @param  {String} field - 标识属性名的字符串
           * @param  {Function} parent - 返回上下文的函数，用于记录监听事件执行上下文。
           * @return {(ObservableObject | ObservableArray)}
           * @memberOf fly.ObservableObject.prototype
           */
          wrap: function(object, field, parent) {
            var that = this,
              type = objectToString.call(object);

            if (object != null && (type === OBJ || type === ARR)) {
              var isObservableArray = object instanceof ObservableArray;
              var isDataSource = object instanceof fly.DataSource;

              if (type === OBJ && !isDataSource && !
                isObservableArray) {

                if (!(object instanceof ObservableObject)) {
                  object = new ObservableObject(object);
                }

                if (object.parent() != parent()) {
                  object.bind(GET, eventHandler(that, GET, field,
                    true));
                  object.bind(CHANGE, eventHandler(that, CHANGE,
                    field, true));
                }
              } else if (type === ARR || isObservableArray ||
                isDataSource) {
                if (!isObservableArray && !isDataSource) {
                  object = new ObservableArray(object);
                }

                if (object.parent() != parent()) {
                  object.bind(CHANGE, eventHandler(that, CHANGE,
                    field, false));
                }
              }

              object.parent = parent;
            }

            return object;
          }
        });

        /**
         * 监听数组变化，继承observable基类的方法，并在此基础上封装实现特有方法。
         * @class
         * @augments {Observable}
         * @memberOf fly
         * @alias fly.ObservableArray
         */
        var ObservableArray = Observable.extend({

          /**
           * ObservableArray类的构造函数，继承基类Observable的方法，初始化参数。
           * @param {Array} array - 待监听数组。
           * @param {ObservableObject} type - 数据类型。
           * @memberOf fly.ObservableArray.prototype
           */
          ctor: function(array, type) {
            var that = this;
            if (!array) return;
            that.type = type || ObservableObject;
            that._super();
            that.length = array.length;
            that.wrapAll(array, that);
          },

          /**
           * 根据索引在ObservableArray实例对象中查找并返回对应的元素。
           * @param  {Number} index - 表示数组索引。
           * @return {ObservableObject}
           * @memberOf fly.ObservableArray.prototype
           */
          at: function(index) {
            return this[index];
          },

          /**
           * 把ObservableArray实例对象转化为JSON对象。
           * @param  {Boolean} keepUid - 是否保留UID属性。
           * @return {Obejct} 纯净的JSON对象。
           * @memberOf fly.ObservableArray.prototype
           */
          toJSON: function(keepUid) {
            var idx, length = this.length,
              value, json = new Array(length);

            for (idx = 0; idx < length; idx++) {
              value = this[idx];

              if (value instanceof ObservableObject) {
                value = value.toJSON(keepUid);
              }

              json[idx] = value;
            }

            return json;
          },

          /**
           * 返回父级上下文的函数。
           * @type {Function}
           * @memberOf fly.ObservableArray.prototype
           */
          parent: noop,

          /**
           * 循环遍历数据对象，对数组元素进行监听处理。
           * @param  {Array} source - 带转换的数组。
           * @param  {Array} target - 用于存储转换后的数组对象。
           * @return {Array}
           * @memberOf fly.ObservableArray.prototype
           */
          wrapAll: function(source, target) {
            var that = this,
              idx,
              length,
              parent = function() {
                return that;
              };

            target = target || [];

            for (idx = 0, length = source.length; idx < length; idx++) {
              target[idx] = that.wrap(source[idx], parent);
            }

            return target;
          },

          /**
           * 对指定的数组元素，根据数据类型进行转换并监听change事件。
           * @param  {Object} object - 待处理的数组元素。
           * @param  {Function} parent - 返回ObservableArray实例对象的方法。
           * @return {Object}
           * @memberOf fly.ObservableArray.prototype
           */
          wrap: function(object, parent) {
            var that = this,
              observable;

            if (object !== null && objectToString.call(object) === OBJ) {
              observable = object instanceof that.type || object instanceof fly.Model;

              if (!observable) {
                object = object instanceof ObservableObject ?
                  object.toJSON() : object;
                object = new that.type(object);
              }

              object.parent = parent;

              object.bind(CHANGE, function(e) {
                that.trigger(CHANGE, {
                  field: e.field,
                  node: e.node,
                  index: e.index,
                  items: e.items || [this],
                  action: e.node ? (e.action ||
                    "itemloaded") : "itemchange"
                });
              });
            }

            return object;
          },

          /**
           * 新增元素到当前ObservableArray实例数组的最后位置。
           * @return {(ObservableArray | ObservableObject)}  新增到ObservableArray实例对象的元素。
           * @memberOf fly.ObservableArray.prototype
           */
          push: function() {
            var index = this.length,
              items = this.wrapAll(arguments),
              result;

            result = [].push.apply(this, items);

            this.trigger(CHANGE, {
              action: ADD,
              index: index,
              items: items
            });

            return result;
          },

          /**
           * 连接指定的数组到当前ObservableArray实例数组。
           * @param  {Array} arr - 待连接到ObservableArray实例对象的数组。
           * @return {ObservableArray}
           * @memberOf fly.ObservableArray.prototype
           */
          concat: function(arr) {
            var index = this.length,
              items = this.wrapAll(arr),
              result;

            result = [].push.apply(this, items);

            this.trigger(CHANGE, {
              action: ADD,
              index: index,
              items: items
            });

            return result;
          },

          /**
           * 从ObservableArray实例对象返回选定的元素。
           * @type {Function}
           * @memberOf fly.ObservableArray.prototype
           */
          slice: slice,

          /**
           * 对ObservableArray实例对象的元素进行排序。
           * @type {Function}
           * @memberOf fly.ObservableArray.prototype
           * @example
           * // 实例化对象
           * var observableArray = new fly.ObservableArray([5,3,1,4,6]);
           * // 输出：'[5, 3, 1, 4, 6]
           * console.log(observableArray);
           * // 输出：'[1, 3, 4, 5, 6]
           * console.log(observableArray.sort());
           * // 输出：'[6, 5, 4, 3, 1]
           * observableArray.sort(function(a, b) { return a < b;});
           */
          sort: [].sort,

          /**
           * 把数组的所有元素放入一个字符串。元素通过指定的分隔符进行分隔。
           * @type {Function}
           * @memberOf fly.ObservableArray.prototype
           * @example
           * // 实例化对象
           * var observableArray = new fly.ObservableArray([5,3,1,4,6]);
           *
           * // 输出：'5|3|1|4|6'
           * console.log(observableArray.join('|'));
           */
          join: [].join,

          /**
           * 删除并返回ObservableArray实例对象的最后一个元素。把数组长度减 1，并且返回它删除的元素的值。如果数组已经为空，则pop()不改变数组，并返回undefined值。
           * @return {(Observable | ObservableObject | ObservableArray)} ObservableArray实例对象最后一个元素。
           * @memberOf fly.ObservableArray.prototype
           */
          pop: function() {
            var length = this.length,
              result = [].pop.apply(this);

            if (length) {
              this.trigger(CHANGE, {
                action: REMOVE,
                index: length - 1,
                items: [result]
              });
            }

            return result;
          },

          /**
           * 向/从ObservableArray实例对象中添加/删除项目，然后返回被删除的项目。
           * @param  {Number} index - 规定添加/删除项目的位置，使用负数可从数组结尾处规定位置。
           * @param  {Number} howMany - 要删除的项目数量。如果设置为 0，则不会删除项目。
           * @param  {*} item - 向数组添加的新项目。
           * @return {(Observable | ObservableObject | ObservableArray)} 包含被删除项目的新数组，如果有的话。
           * @memberOf fly.ObservableArray.prototype
           */
          splice: function(index, howMany, item) {
            var items = this.wrapAll(slice.call(arguments, 2)),
              result, i, len;

            result = [].splice.apply(this, [index, howMany].concat(
              items));

            if (result.length) {
              this.trigger(CHANGE, {
                action: REMOVE,
                index: index,
                items: result
              });

              for (i = 0, len = result.length; i < len; i++) {
                if (result[i] && result[i].children) {
                  result[i].unbind(CHANGE);
                }
              }
            }

            if (item) {
              this.trigger(CHANGE, {
                action: ADD,
                index: index,
                items: items
              });
            }
            return result;
          },

          /**
           * 删除并返回ObservableArray实例对象的第一个元素。如果ObservableArray实例对象是空的，那么 shift() 方法将不进行任何操作，返回 undefined 值。
           * 请注意，该方法不创建新ObservableArray实例对象，而是直接修改原有的ObservableArray实例对象。
           * @return {(Observable | ObservableObject | ObservableArray)} ObservableArray实例对象原来的第一个元素的值。
           * @memberOf fly.ObservableArray.prototype
           */
          shift: function() {
            var length = this.length,
              result = [].shift.apply(this);

            if (length) {
              this.trigger(CHANGE, {
                action: REMOVE,
                index: 0,
                items: [result]
              });
            }

            return result;
          },

          /**
           * 向ObservableArray实例对象的开头添加一个或更多元素，并返回新的长度。
           * @return {Number} ObservableArray实例对象新长度。
           * @memberOf fly.ObservableArray.prototype
           */
          unshift: function() {
            var items = this.wrapAll(arguments),
              result;

            result = [].unshift.apply(this, items);

            this.trigger(CHANGE, {
              action: ADD,
              index: 0,
              items: items
            });

            return result;
          },

          /**
           * 返回元素在ObservableArray实例对象中的索引位置。若存在，则返回索引位置，否则返回-1。
           * @param  {(Observable | ObservableObejct | ObservableArray)} item - 待索引的数组元素。
           * @return {Number} 待检索的元素索引位置。
           * @memberOf fly.ObservableArray.prototype
           */
          indexOf: function(item) {
            var that = this,
              idx,
              length;

            for (idx = 0, length = that.length; idx < length; idx++) {
              if (that[idx] === item) {
                return idx;
              }
            }
            return -1;
          },

          /**
           * 循环遍历ObservableArray实例对象，并在循环过程中执行callback。
           * @param  {Function} callback - 遍历数组每一项执行回调函数。
           * @memberOf fly.ObservableArray.prototype
           */
          forEach: function(callback) {
            var idx = 0,
              length = this.length;

            for (; idx < length; idx++) {
              callback(this[idx], idx, this);
            }
          },

          /**
           * 循环遍历ObservableArray实例对象，并在循环过程中执行callback，并将执行结果放入新的数组。
           * @param  {Function} callback - 循环遍历ObservableArray实例对象，执行的callback。
           * @return {Array} 符合要求的ObservableArray实例对象元素数组。
           * @memberOf fly.ObservableArray.prototype
           */
          map: function(callback) {
            var idx = 0,
              result = [],
              length = this.length;

            for (; idx < length; idx++) {
              result[idx] = callback(this[idx], idx, this);
            }

            return result;
          },

          /**
           * 循环遍历ObservableArray实例对象，并在循环过程中执行callback，将符合callback执行结果的数据放入新的数组。
           * @param  {Function} callback - 循环遍历ObservableArray实例对象，执行的callback。
           * @return {Array} 符合要求的ObservableArray实例对象元素数组。
           * @memberOf fly.ObservableArray.prototype
           */
          filter: function(callback) {
            var idx = 0,
              result = [],
              item,
              length = this.length;

            for (; idx < length; idx++) {
              item = this[idx];
              if (callback(item, idx, this)) {
                result[result.length] = item;
              }
            }

            return result;
          },

          /**
           * 循环遍历ObservableArray实例对象，并在循环过程中执行callback，返回符合callback执行结果的元素。
           * @param  {Function} callback - 循环遍历ObservableArray实例对象，执行的callback。
           * @return {(Observable | ObservableObject | ObservableArray)} 符合要求的ObservableArray实例对象元素。
           * @memberOf fly.ObservableArray.prototype
           */
          find: function(callback) {
            var idx = 0,
              item,
              length = this.length;

            for (; idx < length; idx++) {
              item = this[idx];
              if (callback(item, idx, this)) {
                return item;
              }
            }
          },

          /**
           * 循环遍历ObservableArray实例对象，并在循环过程中执行callback，遇到执行callback为false元素，直接停止循环遍历，返回false。
           * @param  {Function} callback - 循环遍历ObservableArray实例对象，执行的callback。
           * @return {Boolean} 循环遍历ObservableArray实例对象执行callback均为true，则返回true，否则返回false。
           * @memberOf fly.ObservableArray.prototype
           */
          every: function(callback) {
            var idx = 0,
              item,
              length = this.length;

            for (; idx < length; idx++) {
              item = this[idx];
              if (!callback(item, idx, this)) {
                return false;
              }
            }

            return true;
          },

          /**
           * 循环遍历ObservableArray实例对象，并在循环过程中执行callback，callback返回值为true元素，直接停止循环遍历，返回true，否则返回false。
           * @param  {Function} callback - 循环遍历ObservableArray实例对象，执行的callback。
           * @return {Boolean} 循环遍历ObservableArray实例对象，callback返回值为true元素，直接停止循环遍历，返回true，否则返回false。
           * @memberOf fly.ObservableArray.prototype
           */
          some: function(callback) {
            var idx = 0,
              item,
              length = this.length;

            for (; idx < length; idx++) {
              item = this[idx];
              if (callback(item, idx, this)) {
                return true;
              }
            }

            return false;
          },

          /**
           * 从ObservableArray实例对象中删除指定的元素。
           * @param {*} item - 需要删除的项。
           * @memberOf fly.ObservableArray.prototype
           */
          remove: function(item) {
            var idx = this.indexOf(item);

            if (idx !== -1) {
              this.splice(idx, 1);
            }
          },

          /**
           * 置空ObservableArray实例对象。
           * @memberOf fly.ObservableArray.prototype
           */
          empty: function() {
            this.splice(0, this.length);
          }

        });

        /**
         * 懒加载监听数组对象。继承ObservableArray类的方法，并在此基础上封装实现特有方法。
         * @class
         * @augments {ObservableArray}
         * @memberOf fly
         * @alias fly.LazyObservableArray
         */
        var LazyObservableArray = ObservableArray.extend({

          /**
           * LazyObservableArray类的构造函数，继承基类ObservableArray的方法，初始化参数。
           * @param {Array} array - 待监听数组。
           * @param {ObservableObject} type - 数据类型。
           * @memberOf fly.LazyObservableArray.prototype
           */
          ctor: function(data, type) {

            this.type = type || ObservableObject;

            for (var idx = 0; idx < data.length; idx++) {
              this[idx] = data[idx];
            }

            this.length = idx;
            this._parent = proxy(function() {
              return this;
            }, this);
          },

          /**
           * 根据索引在LazyObservableArray实例对象中查找并返回对应的元素。
           * @param  {Number} index - 表示数组索引。
           * @return {LazyObservableArray}
           * @memberOf fly.LazyObservableArray.prototype
           */
          at: function(index) {
            var item = this[index];

            if (!(item instanceof this.type)) {
              item = this[index] = this.wrap(item, this._parent);
            } else {
              item.parent = this._parent;
            }

            return item;
          }
        });


        /**
         * 事件处理器。
         * @param   {Object}   context - 事件上下文。
         * @param   {String}   type    - 事件名称。
         * @param   {String}   field   - 字段名。
         * @param   {Boolean}  prefix  - 是否需要预处理。
         * @returns {Function}
         * @private
         */
        function eventHandler(context, type, field, prefix) {
          return function(e) {
            var event = {},
              key;

            for (key in e) {
              event[key] = e[key];
            }

            if (prefix) {
              event.field = field + '.' + e.field;
            } else {
              event.field = field;
            }

            if (type == CHANGE && context._notifyChange) {
              context._notifyChange(event);
            }

            context.trigger(type, event);
          };
        }

        fly.Observable = Observable;
        fly.ObservableObject = ObservableObject;
        fly.ObservableArray = ObservableArray;
        fly.LazyObservableArray = LazyObservableArray;


        /**
         * 隐式实例化。
         * @param   {Object} object
         * @returns {Object} viewmodel
         * @private
         */
        fly.observable = function(object) {
          if (!(object instanceof ObservableObject)) {
            object = new ObservableObject(object);
          }
          return object;
        };

        module.exports = Observable;
      }, {
        "./fly.core": 4
      }
    ],
    12: [
      function(_require, module, exports) {
        /**
         * @file 路由
         * @author huanzhang
         */

        /**
         * @namespace fly
         */

        var fly = _require('./fly.core'),
          Observable = _require('./fly.observable'),
          utils = _require('./fly.utils');

        var CHANGE = "change",
          BACK = "back",
          SAME = "same",
          INIT = "init",
          ROUTE_MISSING = "routeMissing",
          $ = fly.$,
          Class = fly.Class,
          support = fly.support,
          window = fly.win,
          location = window.location,
          history = window.history,
          CHECK_URL_INTERVAL = 50,
          BROKEN_BACK_NAV = support.browser.ie,
          hashStrip = /^#*/,
          optionalParam = /\((.*?)\)/g,
          namedParam = /(\(\?)?:\w+/g,
          splatParam = /\*\w+/g,
          escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g,
          document = window.document,
          parseQueryStringParams = fly.parseQueryStringParams;

        function hashDelimiter(bang) {
          return bang ? "#!" : "#";
        }

        function locationHash(hashDelimiter) {
          var href = location.href;

          if (hashDelimiter === "#!" && href.indexOf("#") > -1 && href.indexOf("#!") < 0) {
            return null;
          }

          return href.split(hashDelimiter)[1] || "";
        }

        function stripRoot(root, url) {
          if (url.indexOf(root) === 0) {
            return (url.substr(root.length)).replace(/\/\//g, '/');
          } else {
            return url;
          }
        }

        /**
         * 封装扩展window.history(对象包含用户在浏览器窗口中访问过的URL)的类，解决在不同浏览器或终端兼容性问题
         * @class
         * @ignore
         */
        var HistoryAdapter = Class.extend({

          /**
           * 构造函数
           * @memberOf HistoryAdapter.prototype
           */
          ctor: function() {},

          back: function() {
            if (BROKEN_BACK_NAV) {
              setTimeout(function() {
                history.back();
              });
            } else {
              history.back();
            }
          },

          forward: function() {
            if (BROKEN_BACK_NAV) {
              setTimeout(function() {
                history.forward();
              });
            } else {
              history.forward();
            }
          },

          length: function() {
            return history.length;
          },

          replaceLocation: function(url) {
            location.replace(url);
          }
        });

        /**
         * 扩展封装HTML5新特性History.pushState（允许用户逐条添加历史记录条目）的类，
         * 注意history.pushState()方法永远不会触发hashchange事件，即便新的地址只变更了hash。
         * @class
         * @ignore
         */
        var PushStateAdapter = HistoryAdapter.extend({

          /**
           * @memberOf PushStateAdapter.prototype
           * @param  {String} root - 示协议的字符串
           */
          ctor: function(root) {
            this.root = root;
          },

          /**
           * 向History添加历史记录条目，浏览器不会在调用pushState()方法后加载该地址，但之后，可能会试图加载，例如用户重启浏览器。
           * 新的URL不一定是绝对路径；如果是相对路径，它将以当前URL为基准；传入的URL与当前URL应该是同源的，
           * 否则，pushState()会抛出异常。该参数是可选的；不指定的话则为文档当前URL。
           * @memberOf PushStateAdapter.prototype
           * @param  {String} to - 表示新的历史条目地址
           */
          navigate: function(to) {
            history.pushState({}, document.title, absoluteURL(to, this.root));
          },

          /**
           * 修改当前历史记录条目，这个方法有时会很有用，当你需要对某些用户行为作反应而更新一个state对象或者当前history实体时，
           * 可以使用它来更新state对象或者当前history实体的url
           * @memberOf PushStateAdapter.prototype
           * @param  {String} to - 表示已经存在的历史条目地址
           */
          replace: function(to) {
            history.replaceState({}, document.title, absoluteURL(to, this.root));
          },

          /**
           * 移除URL协议头
           * @memberOf PushStateAdapter.prototype
           * @param  {String} url - 表示地址URL的字符串
           * @return {String} 移除URL协议头的字符串
           */
          normalize: function(url) {
            return stripRoot(this.root, url);
          },

          /**
           * 返回当前location的pathname和search部分
           * @memberOf PushStateAdapter.prototype
           * @return {String}
           */
          current: function() {
            var current = location.pathname;

            if (location.search) {
              current += location.search;
            }

            return stripRoot(this.root, current);
          },

          /**
           * 监听popstate事件，每当激活的历史记录发生变化时，都会触发popstate事件。
           * 如果被激活的历史记录条目是由pushState所创建，或是被replaceState方法影响到的，popstate事件的状态属性将包含历史记录的状态对象的一个拷贝。
           * @memberOf PushStateAdapter.prototype
           * @param  {Function} callback - 事件触发执行回调函数
           * @todo 待实现优化
           */
          change: function(callback) {
            // $(window).bind("popstate.fly", callback);
          },

          /**
           * 解除绑定的popstate事件
           * @memberOf PushStateAdapter.prototype
           * @todo 待实现优化
           */
          stop: function() {
            // $(window).unbind("popstate.fly");
          },

          /**
           * 根据当前配置信息，将新的地址添加History历史记录条目
           * @memberOf PushStateAdapter.prototype
           * @param {Object} options - 包含协议/HASH分隔符的配置信息
           * @param {String} options.root - 表示URL协议头的字符串
           * @param {String} options.hashBang - 表示HASH分隔符的字符串
           */
          normalizeCurrent: function(options) {
            var fixedUrl,
              root = options.root,
              pathname = location.pathname,
              hash = locationHash(hashDelimiter(options.hashBang));

            if (root === pathname + "/") {
              fixedUrl = root;
            }

            if (root === pathname && hash) {
              fixedUrl = absoluteURL(hash.replace(hashStrip, ''), root);
            }

            if (fixedUrl) {
              history.pushState({}, document.title, fixedUrl);
            }
          }
        });

        function fixHash(url) {
          return url.replace(/^(#)?/, "#");
        }

        function fixBang(url) {
          return url.replace(/^(#(!)?)?/, "#!");
        }

        /**
         * 封装扩展对HASH操作的类，继承HistoryAdapter类
         * @class
         * @arguments {HistoryAdapter}
         * @ignore
         */
        var HashAdapter = HistoryAdapter.extend({

          /**
           * @memberOf HashAdapter.prototype
           * @param {Boolean} bang - 标识当前HASH是否使用Hashbang模式
           */
          ctor: function(bang) {
            this._id = fly.guid();
            this.prefix = hashDelimiter(bang);
            this.fix = bang ? fixBang : fixHash;
          },

          /**
           * 设置当前location.hash为指定的值
           * @memberOf HashAdapter.prototype
           * @param  {String} hash - 表示HASH值的字符串
           */
          navigate: function(hash) {
            location.hash = this.fix(hash);
          },

          /**
           * 用一个新文档取代当前文档，该方法不会在History对象中生成一个新的记录，当使用该方法时，新的URL将覆盖History对象中的当前记录
           * @memberOf HashAdapter.prototype
           * @param  {String} hash - 表示HASH的字符串
           */
          replace: function(hash) {
            this.replaceLocation(this.fix(hash));
          },

          /**
           * 获取指定URL中的HASH值，若不存在匹配的HASH前缀，则返回URL
           * @memberOf HashAdapter.prototype
           * @param  {String} url - 表示URL地址的字符串
           * @return {String} URL或者HASH值
           */
          normalize: function(url) {
            if (url.indexOf(this.prefix) < 0) {
              return url;
            } else {
              return url.split(this.prefix)[1];
            }
          },

          /**
           * 监听HASH变化事件，当URL的片段标识符更改时，将触发hashchange事件 (跟在＃符号后面的URL部分，包括＃符号)，
           * 若当前浏览器不支持hashchange事件，使用setInterval模拟
           * @memberOf HashAdapter.prototype
           * @param  {Function} callback - HASH改变触发事件
           */
          change: function(callback) {
            if (support.hashChange) {
              fly.on(window, 'hashchange.' + this._id, callback);
            } else {
              this._interval = setInterval(callback, CHECK_URL_INTERVAL);
            }
          },

          /**
           * 解除绑定的hashchange事件，对于不支持hashchange事件的浏览器，直接清除定时器
           * @memberOf HashAdapter.prototype
           */
          stop: function() {
            fly.off(window, 'hashchange.' + this._id, callback);
            clearInterval(this._interval);
          },

          /**
           * 获取当前location.href中的HASH值
           * @memberOf HashAdapter.prototype
           * @return {String} 表示HASH值的字符串
           */
          current: function() {
            return locationHash(this.prefix);
          },

          /**
           * 调用location.replace方法根据配置生成的URL，替换当前文档
           * @memberOf HashAdapter.prototype
           * @param  {Object} options - 生成URL的配置文件
           * @param  {String} options.root - URL中不包含HASH的部分
           * @param {Boolean} options.pushState - 是否支持向历史记录新增地址
           * @return {Boolean}
           */
          normalizeCurrent: function(options) {
            var pathname = location.pathname,
              root = options.root;

            if (options.pushState && root !== pathname) {
              this.replaceLocation(root + this.prefix + stripRoot(root, pathname));
              return true; // browser will reload at this point.
            }

            return false;
          }
        });

        /**
         * 扩展封装Histroy操作的类
         * @class
         * @memberOf fly
         * @augments {Observable}
         * @alias fly.History
         */
        var History = Observable.extend({

          /**
           * 初始化路由规则，监听事件
           * @param {Object} options - 初始化配置参数
           * @param {String} options.root - URL根目录
           * @param {Boolean} options.hasBang - 是否启用HTML5 HashBang模式
           * @param {Boolean} options.pushState - 是否支持向历史记录新增地址
           * @memberOf fly.History.prototype
           */
          start: function(options) {
            options = options || {};

            this.bind([CHANGE, BACK, SAME], options);

            if (this._started) {
              return;
            }

            this._started = true;

            options.root = options.root || "/";

            var adapter = this.createAdapter(options),
              current;

            // adapter may reload the document
            if (adapter.normalizeCurrent(options)) {
              return;
            }

            current = adapter.current();

            $.extend(this, {
              adapter: adapter,
              root: options.root,
              historyLength: adapter.length(),
              current: current,
              locations: [current]
            });

            adapter.change($.proxy(this, "_checkUrl"));
          },

          /**
           * 根据配置参数适配PushStateAdapter和HashAdapter
           * @param {Object} options - 初始化配置参数
           * @param {String} options.root - URL根目录
           * @param {Boolean} options.hasBang - 是否启用HTML5 HashBang模式
           * @param {Boolean} options.pushState - 是否支持想历史记录新增地址
           * @return {(PushStateAdapter | HashAdapter)}
           * @memberOf fly.History.prototype
           */
          createAdapter: function(options) {
            return support.pushState && options.pushState ? new PushStateAdapter(options.root) :
              new HashAdapter(options.hashBang);
          },

          /**
           * 解除绑定监听HASH变化的事件
           * @memberOf fly.History.prototype
           */
          stop: function() {
            if (!this._started) {
              return;
            }
            this.adapter.stop();
            this.unbind(CHANGE);
            this._started = false;
          },

          /**
           * 绑定change事件，并执行指定的回调函数
           * @param  {Function} callback - change事件触发后执行的回调函数
           * @memberOf fly.History.prototype
           */
          change: function(callback) {
            this.bind(CHANGE, callback);
          },

          /**
           * 使用指定的URL替换本地的地址
           * @param  {String} url - 新的文档地址
           * @param  {Boolean} silent - 静默状态下不进行页面的跳转
           * @memberOf fly.History.prototype
           */
          replace: function(url, silent) {

            this._navigate(to, silent, function(adapter) {
              adapter.replace(to);
              this.locations[this.locations.length - 1] = this.current;
            });
          },

          /**
           * 设置当前location.hash为指定的值
           * @param  {String} to - 表示HASH值的字符串
           * @param  {Boolean} silent - 静默状态下不进行页面的跳转
           * @memberOf fly.History.prototype
           */
          navigate: function(to, silent) {
            if (to === "#:back") {
              this.backCalled = true;
              this.adapter.back();
              return;
            }

            this._navigate(to, silent, function(adapter) {
              adapter.navigate(to);
              this.locations.push(this.current);
            });
          },

          /**
           * 设置URL替换和HASH值预处理函数
           * @param  {String}   to - 表示URL或者HASH值的字符串
           * @param  {Boolean}   silent - 静默状态下不进行页面的跳转
           * @param  {Function} callback - 预处理后执行的回调函数
           * @private
           * @memberOf fly.History.prototype
           */
          _navigate: function(to, silent, callback) {
            var adapter = this.adapter;

            to = adapter.normalize(to);

            if (this.current === to || this.current === decodeURIComponent(to)) {
              this.trigger(SAME);
              return;
            }

            if (!silent) {
              if (this.trigger(CHANGE, {
                url: to
              })) {
                return;
              }
            }

            this.current = to;

            callback.call(this, adapter);

            this.historyLength = adapter.length();
          },

          /**
           * 根据当前配置参数执行back或change事件，并对locations数组进行增删操作
           * @private
           * @memberOf fly.History.prototype
           */
          _checkUrl: function() {
            var adapter = this.adapter,
              current = adapter.current(),
              newLength = adapter.length(),
              navigatingInExisting = this.historyLength === newLength,
              back = current === this.locations[this.locations.length - 2] &&
              navigatingInExisting,
              backCalled = this.backCalled,
              prev = this.current;

            if (current === null || this.current === current || this.current ===
              decodeURIComponent(current)) {
              return true;
            }

            this.historyLength = newLength;
            this.backCalled = false;

            this.current = current;

            if (back && this.trigger("back", {
              url: prev,
              to: current
            })) {
              adapter.forward();
              this.current = prev;
              return;
            }

            if (this.trigger(CHANGE, {
              url: current,
              backButtonPressed: !backCalled
            })) {
              if (back) {
                adapter.forward();
              } else {
                adapter.back();
                this.historyLength--;
              }
              this.current = prev;
              return;
            }

            if (back) {
              this.locations.pop();
            } else {
              this.locations.push(current);
            }
          }
        });

        function namedParamReplace(match, optional) {
          return optional ? match : '([^\/]+)';
        }

        function routeToRegExp(route, ignoreCase) {
          return new RegExp('^' + route
            .replace(escapeRegExp, '\\$&')
            .replace(optionalParam, '(?:$1)?')
            .replace(namedParam, namedParamReplace)
            .replace(splatParam, '(.*?)') + '$', ignoreCase ? "i" : "");
        }

        function stripUrl(url) {
          return url.replace(/(\?.*)|(#.*)/g, "");
        }

        /**
         * 封装路由操作的类
         * @class Route
         * @ignore
         */
        var Route = Class.extend({

          /**
           * Route构造函数
           * @memberOf Route.prototype
           * @param  {RegExp} route - 表示路由规则的正则表达式
           * @param  {Function} callback - 路由规则执行回调函数
           * @param  {Boolean}  ignoreCase - 路由规则是否区分大小写
           */
          ctor: function(route, callback, ignoreCase) {
            if (!(route instanceof RegExp)) {
              route = routeToRegExp(route, ignoreCase);
            }

            this.route = route;
            this._callback = callback;
          },

          /**
           * 检测URL是否匹配路由规则执行的回调函数
           * @memberOf Route.prototype
           * @private
           * @param  {String} url - 表示地址URL的字符串
           */
          callback: function(url) {
            var params,
              idx = 0,
              length,
              queryStringParams = parseQueryStringParams(url);

            url = stripUrl(url);
            params = this.route.exec(url).slice(1);
            length = params.length;

            for (; idx < length; idx++) {
              if (typeof params[idx] !== 'undefined') {
                params[idx] = decodeURIComponent(params[idx]);
              }
            }

            params.push(queryStringParams);

            this._callback.apply(null, params);
          },

          /**
           * 检测URL是否匹配路由规则，若匹配执行相关函数
           * @memberOf Route.prototype
           * @param  {String} url - 表示地址URL的字符串
           * @return {Boolean}
           */
          worksWith: function(url) {
            if (this.route.test(stripUrl(url))) {
              this.callback(url);
              return true;
            } else {
              return false;
            }
          }
        });


        var history = fly.history = new History();

        /**
         * 封装路由操作方法类
         * @class
         * @memberOf fly
         * @augments {Observable}
         * @alias fly.Router
         */
        var Router = Observable.extend({

          /**
           * @memberOf fly.Router.prototype
           * @param {Object}  options            - 路由配置信息
           * @param {Boolean} options.pushState  - 是否支持向历史记录新增地址
           * @param {Boolean} options.hashBang   - 是否使用hashBang模式
           * @param {String}  options.root       - 表示根目录的字符串
           * @param {Boolean} options.ignoreCase - 是否忽略大小写
           */
          ctor: function(options) {
            if (!options) {
              options = {};
            }

            this._super();

            this.routes = [];
            this.pushState = options.pushState;
            this.hashBang = options.hashBang;
            this.root = options.root;
            this.ignoreCase = options.ignoreCase !== false;

            this.bind([INIT, ROUTE_MISSING, CHANGE, SAME], options);
          },

          /**
           * 解除绑定change/same/back事件
           * @memberOf fly.Router.prototype
           */
          destroy: function() {
            history.unbind(CHANGE, this._urlChangedProxy);
            history.unbind(SAME, this._sameProxy);
            history.unbind(BACK, this._backProxy);
            this.unbind();
          },

          /**
           * 初始化路由规则，监听事件
           * @memberOf fly.Router.prototype
           */
          start: function() {
            var that = this,
              sameProxy = function() {
                that._same();
              },
              backProxy = function(e) {
                that._back(e);
              },
              urlChangedProxy = function(e) {
                that._urlChanged(e);
              };

            history.start({
              same: sameProxy,
              change: urlChangedProxy,
              back: backProxy,
              pushState: that.pushState,
              hashBang: that.hashBang,
              root: that.root
            });

            var initEventObject = {
              url: history.current || "/",
              preventDefault: $.noop
            };

            if (!that.trigger(INIT, initEventObject)) {
              that._urlChanged(initEventObject);
            }

            this._urlChangedProxy = urlChangedProxy;
            this._backProxy = backProxy;
          },

          /**
           * 创建Route类实例对象，用于缓存路由信息，并存储在数组
           * @memberOf fly.Router.prototype
           * @param  {RegExp}   route    - 表示路由规则的正则表达式
           * @param  {Function} callback - 检测URL是否匹配路由规则执行的回调函数
           */
          route: function(route, callback) {
            this.routes.push(new Route(route, callback, this.ignoreCase));
          },

          /**
           * 设置当前location.hash为指定的值
           * @memberOf fly.Router.prototype
           * @param  {String}  to     - 表示HASH值的字符串
           * @param  {Boolean} silent - 静默状态下不进行页面的跳转
           */
          navigate: function(url, silent) {
            fly.history.navigate(url, silent);
          },

          /**
           * 使用指定的URL替换本地的地址
           * @memberOf fly.Router.prototype
           * @param  {String}  url    - 新的文档地址
           * @param  {Boolean} silent - 静默状态下不进行页面的跳转
           */
          replace: function(url, silent) {
            fly.history.replace(url, silent);
          },

          /**
           * 触发back事件
           * @private
           * @memberOf fly.Router.prototype
           * @param {Object} e - Event对象
           */
          _back: function(e) {
            if (this.trigger(BACK, {
              url: e.url,
              to: e.to
            })) {
              e.preventDefault();
            }
          },

          /**
           * 触发same事件
           * @private
           * @memberOf fly.Router.prototype
           */
          _same: function(e) {
            this.trigger(SAME);
          },

          /**
           * URL改变事件
           * @private
           * @memberOf fly.Router.prototype
           * @param  {Object} e - Event对象
           */
          _urlChanged: function(e) {
            var url = e.url;

            if (!url) {
              url = "/";
            }

            if (this.trigger(CHANGE, {
              url: e.url,
              params: parseQueryStringParams(e.url),
              backButtonPressed: e.backButtonPressed
            })) {
              e.preventDefault();
              return;
            }

            var idx = 0,
              routes = this.routes,
              route,
              length = routes.length;

            for (; idx < length; idx++) {
              route = routes[idx];

              if (route.worksWith(url)) {
                return;
              }
            }

            if (this.trigger(ROUTE_MISSING, {
              url: url,
              params: parseQueryStringParams(url),
              backButtonPressed: e.backButtonPressed
            })) {
              e.preventDefault();
            }
          }
        });

        History.HistoryAdapter = HistoryAdapter;
        History.HashAdapter = HashAdapter;
        History.PushStateAdapter = PushStateAdapter;
        fly.History = History;
        fly.Router = Router;
        var history = fly.history = new History();

        module.exports = Router;
      }, {
        "./fly.core": 4,
        "./fly.observable": 11,
        "./fly.utils": 15
      }
    ],
    13: [
      function(_require, module, exports) {
        /**
         * @file 特性检测，仅供flyjs内部使用，对外不暴露全局属性或方法
         * @author huanzhang
         */

        'use strict';

        var support = {},
          STRING = 'string',

          // 滚动条宽度
          __scrollbar;

        var fragment = document.createDocumentFragment(),
          div = fragment.appendChild(document.createElement("div")),
          input = document.createElement("input");

        var transitions = support.transitions = false,
          transforms = support.transforms = false;

        // Support: Android 4.0-4.3
        // Check state lost if the name is set (#11217)
        // Support: Windows Web Apps (WWA)
        // `name` and `type` must use .setAttribute for WWA (#14901)
        input.setAttribute("type", "radio");
        input.setAttribute("checked", "checked");
        input.setAttribute("name", "t");

        div.appendChild(input);

        /**
         * 监视DOM改变, mutationobserver提供了一种能在某个范围内的DOM树发生变化时作出适当反应的能力.
         * 该API设计用来替换掉在DOM3事件规范中引入的Mutation事件
         * @memberOf support
         * @type {Function}
         */
        support.mutationobserver = window.MutationObserver ||
          window.WebKitMutationObserver || null;

        // 是否支持html5
        /**
         * 检测当前浏览器或终端是否支持HTML5，若支持，该值为true，否则为false。
         * @memberOf support
         * @type {Boolean}
         */
        support.html5 = (function() {
          var i = document.createElement('input'),
            result;
          i.setAttribute('type', 'range');
          result = i.type != 'text';
          i = null;
          return result;
        })();

        /**
         * 检测当前浏览器或终端是否支持触屏，若支持，该值为true，否则为false。
         * @memberOf support
         * @type {Boolean}
         */
        support.touch = (
          ('ontouchstart' in document) ||
          (window.DocumentTouch && document instanceof window.DocumentTouch) || //非IE
          (window.navigator.msPointerEnabled && window.navigator.msMaxTouchPoints > 0) || //IE 10
          (window.navigator.pointerEnabled && window.navigator.maxTouchPoints > 0) || //IE >=11
          false
        );

        // 识别浏览器
        support.browser = (function() {
          var browser = {},
            userAgent = navigator.userAgent;
          if (userAgent.indexOf("Opera") > -1) {
            browser.opera = 1;
          } else if (userAgent.indexOf("Firefox") > -1) {
            browser.firefox = 1;
          } else if (userAgent.indexOf("Chrome") > -1) {
            browser.chrome = 1;
          } else if (userAgent.indexOf("Safari") > -1) {
            browser.safari = 1;
          } else if (!!window.ActiveXObject || "ActiveXObject" in window) {
            new RegExp("MSIE (\\d+\\.\\d+);").test(userAgent);
            // IE应该只到11了
            browser.ie = parseInt(RegExp.$1 || 11);
          }
          return browser;
        })();

        // 识别操作系统
        support.os = (function() {
          var os = {},
            ua = navigator.userAgent;
          var funcs = [

            function() { //wechat
              var wechat = ua.match(/(MicroMessenger)\/([\d\.]+)/i);
              if (wechat) { //wechat
                os.wechat = {
                  version: wechat[2].replace(/_/g, '.')
                };
              }
              return false;
            },
            function() { //android
              var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
              if (android) {
                os.android = true;
                os.version = android[2];
                os.isBadAndroid = !(/Chrome\/\d/.test(window.navigator.appVersion));
              }
              return os.android === true;
            },
            function() { //ios
              var iphone = ua.match(/(iPhone\sOS)\s([\d_]+)/);
              if (iphone) { //iphone
                os.ios = os.iphone = true;
                os.version = iphone[2].replace(/_/g, '.');
              } else {
                var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
                if (ipad) { //ipad
                  os.ios = os.ipad = true;
                  os.version = ipad[2].replace(/_/g, '.');
                }
              }
              return os.ios === true;
            }
          ];
          for (var i = 0, l = funcs.length; i < l; i++) {
            if (funcs[i]()) break;
          }
          return os;
        })();

        // 获取滚动条宽度
        support.scrollbar = function(refresh) {
          var div, result;

          if (!isNaN(__scrollbar) && !refresh) {
            return __scrollbar;
          }

          div = document.createElement('div');
          div.style.cssText =
            'overflow:scroll;overflow-x:hidden;zoom:1;clear:both;display:block';
          div.innerHTML = '&nbsp;';
          document.body.appendChild(div);

          result = div.offsetWidth - div.scrollWidth;
          document.body.removeChild(div);
          div = null;
          return result;
        };

        // Support: Android<4.2
        // Older WebKit doesn't clone checked state correctly in fragments
        support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked;

        // Support: IE<=11+
        // Make sure textarea (and checkbox) defaultValue is properly cloned
        div.innerHTML = "<textarea>x</textarea>";
        support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;
        support.dataset = !!div.dataset;

        // 是否可以直接删除扩展
        support.deleteExpando = (function() {
          var a = document.createElement('a');
          try {
            delete a.test;
          } catch (e) {
            a = null;
            return false;
          }
          a = null;
          return true;
        })();

        for (var i = 0, pres = ["Moz", "webkit", "O", "ms"]; i < pres.length; i++) {
          var prefix = pres[i].toString(),
            hasTransitions = typeof div.style[prefix + "Transition"] === STRING;

          if (hasTransitions || typeof div.style[prefix + "Transform"] === STRING) {
            var lowPrefix = prefix.toLowerCase();

            transforms = {
              css: (lowPrefix != "ms") ? "-" + lowPrefix + "-" : "",
              prefix: prefix,
              event: (lowPrefix === "o" || lowPrefix === "webkit") ? lowPrefix : ""
            };

            if (hasTransitions) {
              transitions = transforms;
              transitions.event = transitions.event ? transitions.event + "TransitionEnd" :
                "transitionend";
            }

            break;
          }
        }

        div = null;

        support.transforms = transforms;
        support.transitions = transitions;

        module.exports = support;
      }, {}
    ],
    14: [
      function(_require, module, exports) {
        /**
         * 模板引擎
         * 来自artTemplate3.0.0
         * @author: huanzhang
         * @email: huanzhang@iflytek.com
         * @update: 2015-07-01
         */

        'use strict';

        // core
        var fly = _require('./fly.core');

        var escapeMap = {
          '<': '&#60;',
          '>': '&#62;',
          '"': '&#34;',
          "'": '&#39;',
          '&': '&#38;'
        };

        // 静态分析模板变量
        var KEYWORDS =
          // 关键字
          'break,case,catch,continue,debugger,default,delete,do,else,false' +
          ',finally,for,function,if,in,instanceof,new,null,return,switch,this' +
          ',throw,true,try,typeof,var,void,while,with'

        // 保留字
        +',abstract,boolean,byte,char,class,const,double,enum,export,extends' +
          ',final,float,goto,implements,import,int,interface,long,native' +
          ',package,private,protected,public,short,static,super,synchronized' +
          ',throws,transient,volatile'

        // ECMA 5 - use strict
        + ',arguments,let,yield'

        + ',undefined';

        var REMOVE_RE =
          /\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|"(?:[^"\\]|\\[\w\W])*"|'(?:[^'\\]|\\[\w\W])*'|\s*\.\s*[$\w\.]+/g;
        var SPLIT_RE = /[^\w$]+/g;
        var KEYWORDS_RE = new RegExp(["\\b" + KEYWORDS.replace(/,/g, '\\b|\\b') + "\\b"]
          .join('|'), 'g');
        var NUMBER_RE = /^\d[^,]*|,\d[^,]*/g;
        var BOUNDARY_RE = /^,+|,+$/g;
        var SPLIT2_RE = /^$|,+/;

        var toString = function(value, scope) {

          if (typeof value !== 'string') {
            var type = typeof value;
            if (type === 'number') {
              value += '';
            } else if (type === 'function') {
              value = toString(value.call(scope || value));
            } else {
              value = '';
            }
          }

          return value;

        };

        var escapeFn = function(s) {
          return escapeMap[s];
        };

        var escapeHTML = function(content, scope) {
          return toString(content, scope)
            .replace(/&(?![\w#]+;)|[<>"']/g, escapeFn);
        };

        var isArray = Array.isArray || function(obj) {
          return ({}).toString.call(obj) === '[object Array]';
        };

        var each = function(data, callback) {
          var i, len;
          if (isArray(data)) {
            for (i = 0, len = data.length; i < len; i++) {
              callback.call(data, data[i], i, data);
            }
          } else {
            for (i in data) {
              callback.call(data, data[i], i);
            }
          }
        };


        /**
         * 模板
         * @param   {String} filename 模板名
         * @param   {Object, String} content  数据 如果为字符串则编译并缓存编译结果
         * @returns {String, Function} 渲染好的HTML字符串或者渲染方法
         */
        var template = function(filename, content) {
          return filename.indexOf('<') != -1 ? compile(filename) : (typeof content ===
            'string' ?
            compile(content, {
              filename: filename
            }) : renderFile(filename, content));
        };

        /**
         * 设置全局配置
         * @param {String} name  名称
         * @param {Any}    value 值
         */
        template.config = function(name, value) {
          defaults[name] = value;
        };

        // 默认设置
        var defaults = template.defaults = {
          openTag: '<%', // 逻辑语法开始标签
          closeTag: '%>', // 逻辑语法结束标签
          escape: true, // 是否编码输出变量的 HTML 字符
          cache: true, // 是否开启缓存（依赖 options 的 filename 字段）
          compress: false, // 是否压缩输出
          parser: null // 自定义语法格式器 @see: template-syntax.js
        };

        // 缓存
        var cacheStore = template.cache = {};

        /**
         * 渲染模板
         * @name    template.render
         * @param   {String}    模板
         * @param   {Object}    数据
         * @return  {String}    渲染好的字符串
         */
        template.render = function(source, options) {
          return compile(source, options);
        };

        /**
         * 渲染模板(根据模板名)
         * @name    template.render
         * @param   {String}    模板名
         * @param   {Object}    数据
         * @return  {String}    渲染好的字符串
         */
        var renderFile = template.renderFile = function(filename, data) {
          var fn = template.get(filename) || showDebugInfo({
            filename: filename,
            name: 'Render Error',
            message: 'Template not found'
          });
          return data ? fn(data) : fn;
        };

        /**
         * 获取编译缓存（可由外部重写此方法）
         * @param   {String}    模板名
         * @param   {Function}  编译好的函数
         */
        template.get = function(filename) {

          var cache;

          if (cacheStore[filename]) {
            // 使用内存缓存
            cache = cacheStore[filename];
          } else if (typeof document === 'object') {
            // 加载模板并编译
            var elem = document.getElementById(filename);

            if (elem) {
              var source = (elem.value || elem.innerHTML)
                .replace(/^\s*|\s*$/g, '');
              cache = compile(source, {
                filename: filename
              });
            }
          }

          return cache;
        };

        var utils = template.utils = {

          $helpers: {},

          $include: renderFile,

          $string: toString,

          $escape: escapeHTML,

          $each: each

        };

        /**
         * 添加模板辅助方法
         * @name    template.helper
         * @param   {String}    名称
         * @param   {Function}  方法
         */
        template.helper = function(name, helper) {
          helpers[name] = helper;
        };

        var helpers = template.helpers = utils.$helpers;

        /**
         * 模板错误事件（可由外部重写此方法）
         * @name    template.onerror
         * @event
         */
        template.onerror = function(e) {
          var message = 'Template Error\n\n';
          for (var name in e) {
            message += '<' + name + '>\n' + e[name] + '\n\n';
          }

          if (typeof console === 'object') {
            console.error(message);
          }
        };


        /**
         * 模板调试器
         * @param   {Object} e event
         * @returns {String}   调试函数
         */
        var showDebugInfo = function(e) {

          template.onerror(e);

          return function() {
            return '{Template Error}';
          };
        };

        /**
         * 编译模板
         * @param   {String}    模板字符串
         * @param   {Object}    编译选项
         *
         *      - openTag       {String}
         *      - closeTag      {String}
         *      - filename      {String}
         *      - escape        {Boolean}
         *      - compress      {Boolean}
         *      - debug         {Boolean}
         *      - cache         {Boolean}
         *      - parser        {Function}
         *
         * @return  {Function}  渲染方法
         */
        var compile = template.compile = function(source, options) {

          // 合并默认配置
          options = options || {};
          for (var name in defaults) {
            if (options[name] === undefined) {
              options[name] = defaults[name];
            }
          }

          var filename = options.filename;

          try {
            var Render = compiler(source, options);
          } catch (e) {
            e.filename = filename || 'anonymous';
            e.name = 'Syntax Error';
            return showDebugInfo(e);
          }

          // 对编译结果进行一次包装
          function render(data) {
            try {
              return new Render(data, filename) + '';
            } catch (e) {
              // 运行时出错后自动开启调试模式重新编译
              if (!options.debug) {
                options.debug = true;
                return compile(source, options)(data);
              }
              return showDebugInfo(e)();
            }
          }

          render.prototype = Render.prototype;
          render.toString = function() {
            return Render.toString();
          };

          if (filename && options.cache) {
            cacheStore[filename] = render;
          }

          return render;
        };

        // 数组迭代
        var forEach = utils.$each;

        // 获取变量
        function getVariable(code) {
          return code
            .replace(REMOVE_RE, '')
            .replace(SPLIT_RE, ',')
            .replace(KEYWORDS_RE, '')
            .replace(NUMBER_RE, '')
            .replace(BOUNDARY_RE, '')
            .split(SPLIT2_RE);
        };


        // 字符串转义
        function stringify(code) {
          return "'" + code
            // 单引号与反斜杠转义
            .replace(/('|\\)/g, '\\$1')
            // 换行符转义(windows + linux)
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n') + "'";
        }


        function compiler(source, options) {

          var debug = options.debug;
          var openTag = options.openTag;
          var closeTag = options.closeTag;
          var parser = options.parser;
          var compress = options.compress;
          var escape = options.escape;

          var line = 1;
          var uniq = {
            $data: 1,
            $filename: 1,
            $utils: 1,
            $helpers: 1,
            $out: 1,
            $line: 1
          };

          var isNewEngine = ''.trim; // '__proto__' in {}
          var replaces = isNewEngine ? ["$out='';", "$out+=", ";", "$out"] : [
            "$out=[];", "$out.push(", ");", "$out.join('')"
          ];

          var concat = isNewEngine ? "$out+=text;return $out;" :
            "$out.push(text);";

          var print = "function(){" + "var text=''.concat.apply('',arguments);" +
            concat + "}";

          var include = "function(filename,data){" + "data=data||$data;" +
            "var text=$utils.$include(filename,data,$filename);" + concat + "}";

          var headerCode = "'use strict';" +
            "var $utils=this,$helpers=$utils.$helpers," + (debug ? "$line=0," :
              "");

          var mainCode = replaces[0];

          var footerCode = "return new String(" + replaces[3] + ");"

          // html与逻辑语法分离
          forEach(source.split(openTag), function(code) {
            code = code.split(closeTag);

            var $0 = code[0];
            var $1 = code[1];

            // code: [html]
            if (code.length === 1) {
              mainCode += html($0);

              // code: [logic, html]
            } else {
              mainCode += logic($0);
              if ($1) {
                mainCode += html($1);
              }
            }
          });

          var code = headerCode + mainCode + footerCode;

          // 调试语句
          if (debug) {
            code = "try{" + code + "}catch(e){" + "throw {" +
              "filename:$filename," + "name:'Render Error'," +
              "message:e.message," + "line:$line," + "source:" + stringify(
                source) + ".split(/\\n/)[$line-1].replace(/^\\s+/,'')" +
              "};" + "}";
          }

          try {
            var Render = new Function("$data", "$filename", code);
            Render.prototype = utils;
            return Render;
          } catch (e) {
            e.temp = "function anonymous($data,$filename) {" + code + "}";
            throw e;
          }

          // 处理 HTML 语句
          function html(code) {

            // 记录行号
            line += code.split(/\n/).length - 1;

            // 压缩多余空白与注释
            if (compress) {
              code = code
                .replace(/\s+/g, ' ')
                .replace(/<!--[\w\W]*?-->/g, '');
            }

            if (code) {
              code = replaces[1] + stringify(code) + replaces[2] + "\n";
            }

            return code;
          }


          // 处理逻辑语句
          function logic(code) {
            var thisLine = line;
            if (parser) {
              // 语法转换插件钩子
              code = parser(code, options);
            } else if (debug) {
              // 记录行号
              code = code.replace(/\n/g, function() {
                line++;
                return "$line=" + line + ";";
              });
            }

            // 输出语句. 编码: <%=value%> 不编码:<%=#value%>
            // <%=#value%> 等同 v2.0.3 之前的 <%==value%>
            if (code.indexOf('=') === 0) {
              var escapeSyntax = escape && !/^=[=#]/.test(code);
              code = code.replace(/^=[=#]?|[\s;]*$/g, '');
              // 对内容编码
              if (escapeSyntax) {
                var name = code.replace(/\s*\([^\)]+\)/, '');
                // 排除 utils.* | include | print
                if (!utils[name] && !/^(include|print)$/.test(name)) {
                  code = "$escape(" + code + (code && ", $data") + ")";
                }

                // 不编码
              } else {
                code = "$string(" + code + ")";
              }

              code = replaces[1] + code + replaces[2];
            }

            if (debug) {
              code = "$line=" + thisLine + ";" + code;
            }

            // 提取模板中的变量名
            forEach(getVariable(code), function(name) {

              // name 值可能为空，在安卓低版本浏览器下
              if (!name || uniq[name]) {
                return;
              }

              var value;

              // 声明模板变量
              // 赋值优先级:
              // [include, print] > utils > helpers > data
              if (name === 'print') {
                value = print;
              } else if (name === 'include') {
                value = include;
              } else if (utils[name]) {
                value = "$utils." + name;
              } else if (helpers[name]) {
                value = "$helpers." + name;
              } else {
                value = "$data." + name;
              }

              headerCode += name + "=" + value + ",";
              uniq[name] = true;
            });

            return code + "\n";
          }
        };

        // 定义模板引擎的语法
        defaults.openTag = '{{';
        defaults.closeTag = '}}';


        var filtered = function(js, filter) {
          var parts = filter.split(':');
          var name = parts.shift();
          var args = parts.join(':') || '';

          if (args) {
            args = ', ' + args;
          }

          return '$helpers.' + name + '(' + js + args + ')';
        }

        defaults.parser = function(code, options) {

          // var match = code.match(/([\w\$]*)(\b.*)/);
          // var key = match[1];
          // var args = match[2];
          // var split = args.split(' ');
          // split.shift();

          code = code.replace(/^\s/, '');

          var split = code.split(' ');
          var key = split.shift();
          var args = split.join(' ');

          switch (key) {

            case 'if':
              code = 'if(' + args + '){';
              break;
            case 'else':
              if (split.shift() === 'if') {
                split = ' if(' + split.join(' ') + ')';
              } else {
                split = '';
              }
              code = '}else' + split + '{';
              break;
            case '/if':
              code = '}';
              break;
            case 'each':
              var object = split[0] || '$data';
              var as = split[1] || 'as';
              var value = split[2] || '$value';
              var index = split[3] || '$index';
              var param = value + ',' + index;

              if (as !== 'as') {
                object = '[]';
              }

              code = '$each(' + object + ',function(' + param + '){';
              break;
            case '/each':
              code = '});';
              break;
            case 'echo':
              code = 'print(' + args + ');';
              break;
            case 'print':
            case 'include':
              code = key + '(' + split.join(',') + ');';
              break;
            default:
              // 过滤器（辅助方法）
              // {{value | filterA:'abcd' | filterB}}
              // >>> $helpers.filterB($helpers.filterA(value, 'abcd'))
              // TODO: {{ddd||aaa}} 不包含空格
              if (/^\s*\|\s*[\w\$]/.test(args)) {
                var escape = true;

                // {{#value | link}}
                if (code.indexOf('#') === 0) {
                  code = code.substr(1);
                  escape = false;
                }

                var i = 0;
                var array = code.split('|');
                var len = array.length;
                var val = array[i++];

                for (; i < len; i++) {
                  val = filtered(val, array[i]);
                }

                code = (escape ? '=' : '=#') + val;

                // 即将弃用 {{helperName value}}
              } else if (template.helpers[key]) {

                code = '=#' + key + '(' + split.join(',') + ');';

                // 内容直接输出 {{value}}
              } else {

                code = '=' + code;
              }
              break;
          }

          return code;
        };

        fly.template = template;

        module.exports = template;

      }, {
        "./fly.core": 4
      }
    ],
    15: [
      function(_require, module, exports) {
        /**
         * 常用工具集合
         * @author: huanzhang
         * @email: huanzhang@iflytek.com
         * @update: 2015-06-01 15:20
         */

        'use strict';

        /**
         * @namespace fly
         * @type {Object}
         */

        // 依赖core
        var fly = _require("./fly.core");

        var $ = fly.$,
          support = fly.support,
          window = fly.win,
          slice = [].slice,
          location = window.location,
          _modCache;

        // 正则表达式
        var rclass = /[\t\r\n\f]/g,
          dashRegExp = /([A-Z])/g,
          jsonRegExp = /^\s*(?:\{(?:.|\r\n|\n)*\}|\[(?:.|\r\n|\n)*\])\s*$/,
          jsonFormatRegExp = /^\{(\d+)(:[^\}]+)?\}|^\[[A-Za-z_]*\]$/,
          numberRegExp = /^(\+|-?)\d+(\.?)\d*$/,
          rnotwhite = /\S+/g,
          translateRE = /translate(?:3d)?\((.+?)\)/,
          translateMatrixRE = /matrix(3d)?\((.+?)\)/;

        // 一些常量
        var CHARACTER = 'character',
          PLACEHOLDER = 'placeholder',
          STRING = 'string';

        function type(obj) {
          var t;
          if (obj == null) {
            t = String(obj);
          } else {
            t = Object.prototype.toString.call(obj).toLowerCase();
            t = t.substring(8, t.length - 1);
          }
          return t;
        }

        /**
         * 从当前文档对象location中获取查询条件location.search，并使用正则匹配截取对应查询字段，获取查询的值
         * @memberOf fly
         * @param  {String} name - 参数名
         * @return {String} 参数值，若没有该参数，则返回''
         * @example
         * fly.getQueryString('name');
         */
        fly.getQueryString = function(name) {
          var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
          var r = location.search.substr(1).match(reg);
          if (r != null) {
            return unescape(r[2]);
          }
          return '';
        };


        /**
         * 格式化url中的参数
         * @memberOf fly
         * @param  {String} url - 表示URL的字符串或者String对象实例
         * @return {Obejct} key/value键值对
         * @example
         * fly.parseQueryStringParams('http://www.flyui.com?version=1.0&author=hz);
         */
        fly.parseQueryStringParams = function(url) {
          var queryString = url.split('?')[1] || "",
            params = {},
            paramParts = queryString.split(/&|=/),
            length = paramParts.length,
            idx = 0;

          for (; idx < length; idx += 2) {
            if (paramParts[idx] !== "") {
              params[decodeURIComponent(paramParts[idx])] = decodeURIComponent(paramParts[idx +
                1]);
            }
          }

          return params;
        };

        /**
         * 获取Hash值
         * @memberOf fly
         * @returns {String} hash
         * @example
         * fly.getHash();
         */
        fly.getHash = function() {
          return location.hash.slice(1);
        };

        /**
         * 获取时间戳
         * @memberOf fly
         * @function
         * @return {Number} 当前的时间戳
         * @example
         * fly.now();
         */
        fly.now = Date.now || function() {
          return new Date().getTime();
        };

        /**
         * 在控制台输出调试内容
         * @memberOf fly
         */
        fly.debug = function() {
          var flag = (window.localStorage || {}).debug,
            args = slice.call(arguments),
            style = 'color: #bada55',
            mod = args.shift(),
            re = new RegExp(mod.replace(/[.\/\\]/g, function(m) {
              return '\\' + m;
            }));
          mod = '%c' + mod;
          if (flag && flag === '*' || re.test(flag)) {
            if (_modCache !== mod) {
              console.groupEnd(_modCache, style);
              console.group(_modCache = mod, style);
            }
            if (/string|number|boolean/.test(type(args[0]))) {
              args[0] = '%c' + args[0];
              args.splice(1, 0, style);
            }
            console.log.apply(console, args);
          }
        };

        /**
         * SetTimeout封装
         * @memberOf fly
         * @param {(Function|String)} fn -     delay毫秒之后执行的函数或者函数名
         * @param {Number}            when    - delay毫秒
         * @param {Object}            context - 执行的函数的上下文
         * @param {*}                 data    - 执行函数的传参
         * @return                    {Object}
         */
        fly.later = function(fn, when, context, data) {
          when = when || 0;
          var m = fn;
          var d = data;
          var f;
          var r;

          if (typeof fn === 'string') {
            m = context[fn];
          }

          f = function() {
            m.apply(context, $.isArray(d) ? d : [d]);
          };

          r = setTimeout(f, when);

          return {
            id: r,
            cancel: function() {
              clearTimeout(r);
            }
          };
        };

        /**
         * 注意！！！
         * 即将废弃
         * 获取最高层级的window
         * @memberOf fly
         */
        fly.top = function() {
          var top = window,
            test = function(name) {
              var doc;
              try {
                doc = window[name].document; // 跨域|无权限
                doc.getElementsByTagName; // chrome 本地安全限制
              } catch (e) {
                return false;
              }

              return window[name].fly &&
                doc.getElementsByTagName('frameset').length === 0;
            };

          if (test('top')) {
            top = window.top;
          } else if (test('parent')) {
            top = window.parent;
          }

          return top;
        }();

        /**
         * 获取计算后的样式（最终使用的CSS属性值）
         * @memberOf fly
         * @param   {Object} element    - DOM
         * @param   {Array}  properties - 属性
         * @returns {Object} 样式对象
         */
        fly.getComputedStyles = function(element, properties) {
          var defaultView = document.defaultView,
            styles = {},
            computedStyle;

          if (defaultView && defaultView.getComputedStyle) {
            computedStyle = defaultView.getComputedStyle(element, '');

            if (properties) {
              $.each(properties, function(idx, value) {
                styles[value] = computedStyle.getPropertyValue(value);
              });
            }
          } else {
            computedStyle = element.currentStyle;

            if (properties) {
              $.each(properties, function(idx, value) {
                styles[value] = computedStyle[value.replace(/\-(\w)/g, function(
                  strMatch, g1) {
                  return g1.toUpperCase();
                })];
              });
            }
          }

          if ($.isEmptyObject(styles)) {
            styles = computedStyle;
          }

          return styles;
        };

        /**
         * 设置元素处于聚焦状态
         * @memberOf fly
         * @param  {Object} element - DOM element
         * @example
         * fly.focus(document.getElementById('userNameInput'));
         */
        fly.focus = function(element) {
          if (support.os.ios) {
            setTimeout(function() {
              element.focus();
            }, 10);
          } else {
            element.focus();
          }
        };

        /**
         * 触发事件
         * @memberOf fly
         * @param  {Object} element   - DOM element
         * @param  {String} eventType - 表示事件类型的字符串或者String实例化对象
         * @param  {Object} eventData - 初始化事件对象传递的参数或者配置
         * @return {Object}
         * @example
         * fly.trigger(document.getElementById('button'), 'click', {name: 'fly'});
         */
        fly.trigger = function(element, eventType, eventData) {
          element.dispatchEvent(new CustomEvent(eventType, {
            detail: eventData,
            bubbles: true,
            cancelable: true
          }));
          return this;
        };

        /**
         * 获取指定元素的Style
         * @memberOf fly
         * @param   {Object} element  - 用于获取计算样式的Element
         * @param   {String} property - CSS属性
         * @return  {String}
         */
        fly.getStyles = function(element, property) {
          var styles = element.ownerDocument.defaultView.getComputedStyle(element, null);
          if (property) {
            return styles.getPropertyValue(property) || styles[property];
          }
          return styles;
        };

        /**
         * 转换3D坐标
         * @memberOf fly
         * @param   {String} translateString - 包含3D坐标系的字符串
         * @param   {Object} position        - 包含x/y/z轴坐标信息的对象
         * @returns {Object}
         */
        fly.parseTranslate = function(translateString, position) {
          var result = translateString.match(translateRE || '');
          if (!result || !result[1]) {
            result = ['', '0,0,0'];
          }
          result = result[1].split(",");
          result = {
            x: parseFloat(result[0]),
            y: parseFloat(result[1]),
            z: parseFloat(result[2])
          };
          if (position && result.hasOwnProperty(position)) {
            return result[position];
          }
          return result;
        };

        /**
         * 转换3D坐标矩阵
         * @memberOf fly
         * @param   {String} translateString - 包含3D坐标矩阵的字符串
         * @param   {String} position        - 表示位置的字符串
         * @returns {Object}
         */
        fly.parseTranslateMatrix = function(translateString, position) {
          var matrix = translateString.match(translateMatrixRE);
          var is3D = matrix && matrix[1];
          if (matrix) {
            matrix = matrix[2].split(",");
            if (is3D === "3d")
              matrix = matrix.slice(12, 15);
            else {
              matrix.push(0);
              matrix = matrix.slice(4, 7);
            }
          } else {
            matrix = [0, 0, 0];
          }
          var result = {
            x: parseFloat(matrix[0]),
            y: parseFloat(matrix[1]),
            z: parseFloat(matrix[2])
          };
          if (position && result.hasOwnProperty(position)) {
            return result[position];
          }
          return result;
        };

        /**
         * 当前元素是否可滚动
         * @memberOf fly
         * @param   {Object} - element DOM
         * @returns {Boolean} 是则支持，否则不支持
         * @example
         * fly.isScrollable(document.getElementById('grid'));
         */
        fly.isScrollable = function(element) {
          return fly.getComputedStyles(element, ['overflow']).overflow != 'visible';
        };

        /**
         * 返回当前获得焦点的元素
         * @memberOf fly
         * @returns {Object} DOM
         * @example
         * fly.activeElement();
         */
        fly.activeElement = function() {
          try {
            return document.activeElement;
          } catch (e) {
            return document.documentElement.activeElement;
          }
        };

        /**
         * 阻止默认动作
         * @memberOf fly
         * @param {Object} e - 事件对象
         * @example
         * fly.preventDefault();
         */
        fly.preventDefault = function(e) {
          e.preventDefault();
        }

        /**
         * 销毁vm绑定的组件
         * @memberOf fly
         * @todo 待实现
         * @param {Object} element
         */
        fly.destroy = function(element) {
          // TODO
        };

        /**
         * 绑定事件
         * @memberOf fly
         * @param {Object}   element - 绑定事件的DOM元素
         * @param {String}   event   - 事件名称
         * @param {Function} handler - 事件回调
         * @example
         * fly.on(document.getElementById('button'), 'click', function() {console.log('Binding the click on button');})
         */
        fly.on = function(element, event, handler) {
          if (arguments.length == 2) {
            handler = event;
            event = element;
            element = this;
          }
          if (element.addEventListener) {
            element.addEventListener(event, handler, false);
          } else {
            if (event == 'input') {
              event = 'propertychange';
            }
            element.attachEvent('on' + event, handler);
          }
        };

        /**
         * 接触绑定事件
         * @memberOf fly
         * @param  {Object} element   - 绑定事件的DOM元素
         * @param  {String} event     - 解除事件名称
         * @param  {Function} handler - 解除事件回调
         * @example
         * fly.off(document.getElementById('button'), 'click', function() {console.log('Unbind the click on button');})
         */
        fly.off = function(element, event, handler) {
          if (arguments.length == 2) {
            handler = event;
            event = element;
            element = this;
          }
          if (element.removeEventListener) {
            element.removeEventListener(event, handler);
          } else {
            if (event == 'input') {
              event = 'propertychange';
            }
            element.detachEvent('on' + event, handler);
          }
        };

        /**
         * 对指定的DOM元素添加class样式
         * @memberOf fly
         * @param {Object} element - DOM 元素
         * @param {String} value   - 表示class的字符串
         * @example
         * fly.addClass(document.getElementById('button'), 'info');
         */
        fly.addClass = function(element, value) {
          var classes, cur, curValue, clazz, j, finalValue, i = 0;

          if (support.html5) {
            element.classList.add(value);
            return;
          }

          classes = value.match(rnotwhite) || [];
          curValue = getClass(element);
          cur = element.nodeType === 1 &&
            (" " + curValue + " ").replace(rclass, " ");

          if (cur) {
            j = 0;
            while ((clazz = classes[j++])) {
              if (cur.indexOf(" " + clazz + " ") < 0) {
                cur += clazz + " ";
              }
            }

            finalValue = $.trim(cur);
            if (curValue !== finalValue) {
              element.setAttribute("class", finalValue);
            }
          }
        };

        /**
         * 移除指定DOM元素的class样式
         * @memberOf fly
         * @param  {Object} element - DOM元素
         * @param  {String} value   - 表示class的字符串
         * @example
         * fly.removeClass(document.getElementById('button'), 'info');
         */
        fly.removeClass = function(element, value) {
          var classes, cur, curValue, clazz, j, finalValue, i = 0;

          if (support.html5) {
            element.classList.remove(value);
            return;
          }

          classes = value.match(rnotwhite) || [];
          curValue = getClass(element);
          cur = element.nodeType === 1 &&
            (" " + curValue + " ").replace(rclass, " ");

          if (cur) {
            j = 0;
            while ((clazz = classes[j++])) {

              while (cur.indexOf(" " + clazz + " ") > -1) {
                cur = cur.replace(" " + clazz + " ", " ");
              }
            }

            finalValue = $.trim(cur);
            if (curValue !== finalValue) {
              element.setAttribute("class", finalValue);
            }
          }
        };

        /**
         * 删除元素属性
         * @memberOf fly
         * @param {Object} element - DOM元素
         * @param {String} key     - 表示元素属性的字符串
         */
        fly.deleteExpando = function(element, key) {
          if (typeof element == STRING) {
            key = element;
            element = this;
          }
          if (support.deleteExpando) {
            delete element[key];
          } else if (element.removeAttribute) {
            element.removeAttribute(key);
          } else {
            element[key] = null;
          }
        };

        /**
         * 获取指定元素上自定义的Data(data-*)属性
         * @memberOf fly
         * @param  {Object} element - DOM元素
         * @return {Object} DOMString映射表，对每一个自定义的数据属性都有一个实体与之对应
         * @example
         * fly.dataset(document.getElementById('cache'));
         */
        fly.dataset = function(element) {
          if (support.dataset) {
            return element.dataset;
          } else {
            var attrs = element.attributes,
              expense = {},
              i, j;
            for (i = 0, j = attrs.length; i < j; i++) {
              if (attrs[i].name.substring(0, 5) == 'data-') {
                expense[attrs[i].name.substring(5)] = attrs[i].value;
              }
            }
            return expense;
          }
        };

        fly.getTemplate = function(element) {
          var html = element.innerHTML;
          html = fly.$.trim(html.replace(
            /^\s*\<script[^>]+>|^\s*<!--|-->\s*$|<\/script>\s*$/gi, ''));
          return html;
        };

        /**
         * 获取元素className
         * @param   {object} elem 目标元素
         * @returns {string} className
         */
        function getClass(elem) {
          return elem.getAttribute && elem.getAttribute('class') || '';
        }


        /**
         * 函数节流
         * 创建并返回一个像节流阀一样的函数，当重复调用函数的时候，最多每隔 wait 毫秒调用一次该函数。
         * 对于想控制一些触发频率较高的事件有帮助。
         * 如果你想禁用第一次首先执行的话，传递 {leading: false}
         * 还有如果你想禁用最后一次执行的话，传递 {trailing: false}
         * 来自underscore
         * @memberOf fly
         * @param   {Function} func    - 要执行的函数
         * @param   {Number}   wait    - 频度时间
         * @param   {Object}   options - 配置参数
         * @returns {Function} 已节流的函数
         */
        fly.throttle = function(func, wait, options) {
          var context, args, result;
          var timeout = null;
          var previous = 0;
          if (!options) options = {};
          var later = function() {
            previous = options.leading === false ? 0 : fly.now();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
          };
          return function() {
            var now = fly.now();
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
              if (timeout) {
                clearTimeout(timeout);
                timeout = null;
              }
              previous = now;
              result = func.apply(context, args);
              if (!timeout) context = args = null;
            } else if (!timeout && options.trailing !== false) {
              timeout = setTimeout(later, remaining);
            }
            return result;
          };
        };

        /**
         * 函数防反跳
         * 将延迟函数的执行(真正的执行)在函数最后一次调用时刻的 wait 毫秒之后
         * 来自underscore
         * @memberOf fly
         * @param   {Function} func      - 要执行的函数
         * @param   {Number}   wait      - 等待的时间
         * @param   {Boolean}  immediate - 为 true 时会在 wait 时间间隔的开始调用这个函数
         * @returns {Function} 函数的防反跳版本
         */
        fly.debounce = function(func, wait, immediate) {
          var timeout, args, context, timestamp, result;

          var later = function() {
            var last = fly.now() - timestamp;
            if (last < wait && last >= 0) {
              timeout = setTimeout(later, wait - last);
            } else {
              timeout = null;
              if (!immediate) {
                result = func.apply(context, args);
                if (!timeout) context = args = null;
              }
            }
          };

          return function() {
            context = this;
            args = arguments;
            timestamp = fly.now();
            var callNow = immediate && !timeout;
            if (!timeout) timeout = setTimeout(later, wait);
            if (callNow) {
              result = func.apply(context, args);
              context = args = null;
            }

            return result;
          };
        };

        /**
         * 处理url
         * @memberOf fly
         * @param   {String} url - 原始url
         * @returns {String} 完整url
         * @example
         * fly.absoluteURL('getUserInformation.do', )
         */
        fly.absoluteURL = function(path, pathPrefix) {
          if (!pathPrefix) {
            return path;
          }

          if (path + "/" === pathPrefix) {
            path = pathPrefix;
          }

          var regEx = new RegExp("^" + pathPrefix, "i");

          if (!regEx.test(path)) {
            path = pathPrefix + "/" + path;
          }

          return location.protocol + '//' + (location.host + "/" + path).replace(/\/\/+/g,
            '/');
        };

        /**
         * 解析元素指定的属性值
         * @memberOf fly
         * @param   {Object} element - DOM元素
         * @param   {String} option - 属性
         * @returns {*}      解析后的值
         */
        fly.parseOption = function(element, option) {
          var value;

          if (option.indexOf('data') === 0) {
            option = option.substring(4);
            option = option.charAt(0).toLowerCase() + option.substring(1);
          }

          option = option.replace(dashRegExp, "-$1").toLowerCase();
          value = element.getAttribute("data-" + option);

          if (value === null) {
            value = undefined;
          } else if (value === "null") {
            value = null
          } else if (value === "true") {
            value = true;
          } else if (value === "false") {
            value = false;
          } else if (numberRegExp.test(value)) {
            value = parseFloat(value);
          } else if (jsonRegExp.test(value) && !jsonFormatRegExp.test(value)) {
            value = new Function("return (" + value + ")")();
          }

          return value;
        };

        /**
         * 解析元素属性值
         * @memberOf fly
         * @param   {Object} element - DOM元素
         * @param   {Object} options - 需要解析的参数
         * @returns {Object} 解析后的值
         * @example
         * fly.parseOptions(document.getElementById('menu'), 'width')
         */
        fly.parseOptions = function(element, options) {
          var result = {},
            placeholder = element.getAttribute(PLACEHOLDER),
            option,
            value;

          for (option in options) {
            value = fly.parseOption(element, option);

            if (value !== undefined) {
              /*if (templateRegExp.test(option)) {
                value = fly.template($("#" + value).html());
            }*/
              result[option] = value;
            }
          }

          if (options[PLACEHOLDER] && placeholder && !result[PLACEHOLDER]) {
            result[PLACEHOLDER] = placeholder;
          }

          return result;
        };

        /**
         * 计算字符串的字节长度
         * @memberOf fly
         * @param   {String} str - 需要计算长度的字符串
         * @returns {Number} 字节长度
         * @example
         * console.log(fly.getByTeLen('Hello Fly'));
         */
        fly.getByteLen = function(str) {
          var len = 0,
            str = str || '',
            l = str.length,
            i = 0;
          for (; i < l; i++) {
            var code = str.charCodeAt(i);
            if (code >= 0 && code <= 128) {
              len += 1;
            } else {
              len += 2;
            }
          }
          return len;
        };

        /**
         * 判断是否是DOM对象
         * @memberOf fly
         * @param   {Object}  obj - 需要检查的对象
         * @returns {Boolean}
         * @example
         * fly.isDOM(document.getElementById('button'));
         */
        fly.isDOM = function(obj) {
          if (typeof HTMLElement === 'object') {
            return obj instanceof HTMLElement;
          } else {
            return obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName ===
              'string';
          }
        };


        /**
         * 在输入框中选取字符
         * @memberOf fly
         * @param   {Number} start - 选中内容开始位置
         * @param   {Number} end   - 选中位置结束位置
         * @returns {Object} 当前操作的DOM元素
         * @example
         * fly.selectRange(document.getElementById('input'), 1, 10)
         */
        fly.selectRange = function(element, start, end) {
          var range;
          if (arguments.length == 2) {
            end = start;
            start = element;
            element = this;
          }
          element = element[0] || element;
          if (element.createTextRange) {
            range = element.createTextRange();
            range.collapse(true);
            range.moveEnd(CHARACTER, end);
            range.moveStart(CHARACTER, start);
            range.select();
          } else {
            element.focus();
            element.setSelectionRange(start, end);
          }
          return element;
        };
      }, {
        "./fly.core": 4
      }
    ]
  }, {}, [8])(8)
});

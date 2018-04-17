'use strict';
var $ = require('jquery');
var fly = require('fly');
var drag = require('./drag.js');

var $win = $(window),
    $doc = $(document),
    proxy = $.proxy,
    extend = $.extend;

var NAME = 'Dialog';

// 类名变量
var className = 'popup';

// 当前的dialog
var current = null;

// 层级高度
var zIndex = 1024;

// 背景遮罩样式
var backdropDefaultCss = {
    position: 'fixed',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    userSelect: 'none'
};

// 模板（使用 table 解决 IE7 宽度自适应的 BUG）
// js 使用 i="***" 属性识别结构，其余的均可自定义
var innerHTML = __inline('dialog.tpl');

// 弹出框
var popupElement = function() {
    return $('<div />').css({
        display: 'none',
        position: 'absolute',
        outline: 0
    }).attr('tabindex', '-1').html(innerHTML).appendTo('body');
};

// 背景遮罩
var mask = function() {
    return $('<div />').css({
        opacity: .5,
        background: '#000'
    });
};

// 默认设置
var defaults = fly.ui.defaults[NAME] = {

    /** 是否自动聚焦 */
    autofocus: true,

    // 对齐方式
    align: 'bottom left',

    // 是否固定定位
    fixed: false,

    // 设置遮罩背景颜色
    backdropBackground: '#000',

    // 设置遮罩透明度
    backdropOpacity: 0.5,

    // 消息内容
    content: '<span class="dialog-loading">Loading..</span>',

    // 标题
    title: '',

    // 对话框状态栏区域 HTML 代码
    statusbar: '',

    // 自定义按钮
    button: null,

    // 确定按钮回调函数
    ok: null,

    // 取消按钮回调函数
    cancel: null,

    // 确定按钮文本
    okValue: '确定',

    // 取消按钮文本
    cancelValue: '取消',

    cancelDisplay: true,

    // 内容宽度
    width: '',

    // 内容高度
    height: '',

    // 内容与边界填充距离
    padding: '',

    // 皮肤-自定义class
    skin: '',

    // 是否支持快捷关闭（点击遮罩层自动关闭）
    quickClose: false
};

var Dialog = fly.Component.extend({

    name: 'Dialog',

    options: defaults,

    ctor: function(element, options) {
        // 修复弹窗事件丢失的问题 by pang.ziqin
        this.xoptions = options;

        this._super(element, options);

        this.__popup = this.$element;
        this.__backdrop = this.__mask = mask();
        this._popup = this.__popup;

        this.options.id = this.options.id || fly.guid();

        // 浮层 DOM 节点
        this.node = this.__popup[0];

        // 遮罩 DOM 节点
        this.backdrop = this.__backdrop[0];

        // 判断对话框是否删除
        this.destroyed = false;

        // 判断对话框是否显示
        this.open = false;

        // close 返回值
        this.returnValue = '';

        this.create();
    },

    events: ['close'],

    create: function() {
        var that = this;
        var options = this.options;
        options = options.toJSON ? options.toJSON() : options;
        var originalOptions = options.original;
        var $popup = this.element;
        var $backdrop = $(this.backdrop);

        $.each(that.xoptions, function(name, value) {
            if (typeof that[name] === 'function') {
                that[name](value);
            } else {
                //that[name] = value;
            }
        });

        // 更新 zIndex 全局配置  && options.zIndex > zIndex  // 层级无限叠加 会有问题的
        if (options.zIndex ) {
            zIndex = options.zIndex;
        }


        // 关闭按钮
        this._$('close')
            // .css('display', options.cancel === false ? 'none' : '')
            .attr('title', options.cancelValue)
            .on('click', function(event) {
                that._trigger('cancel');
                event.preventDefault();
            });


        // 添加视觉参数
        this._$('dialog').addClass(options.skin);
        this._$('body').css('padding', options.padding).scroll(function(e){
            // console.log('scrolling');
            $doc.trigger('scroll');
        });


        // 点击任意空白处关闭对话框
        if (options.quickClose) {
            $backdrop
                .on(
                    'onmousedown' in document ? 'mousedown' : 'click',
                    function() {
                        that._trigger('cancel');
                        return false; // 阻止抢夺焦点
                    });
        }


        // 遮罩设置
        this.bind('show', function() {
            $backdrop.css({
                opacity: 0,
                background: options.backdropBackground
            }).animate({
                opacity: options.backdropOpacity
            }, 150);
        });


        // ESC 快捷键关闭对话框
        this._esc = function(event) {
            var target = event.target;
            var nodeName = target.nodeName;
            var rinput = /^input|textarea$/i;
            var isTop = current === that;
            var keyCode = event.keyCode;

            // 避免输入状态中 ESC 误操作关闭
            if (!isTop || rinput.test(nodeName) && target.type !== 'button') {
                return;
            }

            if (keyCode === fly.keys.ESC) {
                that._trigger('cancel');
            }
        };

        $doc.on('keydown', this._esc);
        this.bind('remove', function() {
            $doc.off('keydown', this._esc);
            delete dialog.list[options.id];
        });

        this.oncreate();

        return this;
    },

    oncreate: function() {
        var that = this;
        var options = that.options;
        var originalOptions = options.original;

        // 页面地址
        var url = options.url;
        // 页面加载完毕的事件
        var oniframeload = options.oniframeload;

        var $iframe;


        if (url) {
            options.padding = 0;

            $iframe = $('<iframe />');

            $iframe.attr({
                    src: url,
                    name: options.id,
                    width: '100%',
                    height: '100%',
                    allowtransparency: 'yes',
                    frameborder: 'no',
                    scrolling: 'yes'
                })
                .on('load', function() {
                    var test;

                    try {
                        // 跨域测试
                        test = $iframe[0].contentWindow.frameElement;
                    } catch (e) {}

                    if (test) {

                        if (!options.width) {
                            that.width($iframe.contents().width());
                        }

                        if (!options.height) {
                            that.height($iframe.contents().height());
                        }

                        // 屏蔽回退键
                        $iframe.contents().on('keydown', that._backspace);
                    }

                    oniframeload && oniframeload.call(that);
                });

            that.bind('beforeremove', function() {

                // 重要！需要重置iframe地址，否则下次出现的对话框在IE6、7无法聚焦input
                // IE删除iframe后，iframe仍然会留在内存中出现上述问题，置换src是最容易解决的方法
                $iframe.attr('src', 'about:blank').remove();


            }, false);

            that.content($iframe[0]);

            that.iframeNode = $iframe[0];

        }


        // 对于子页面呼出的对话框特殊处理
        // 如果对话框配置来自 iframe
        if (!(originalOptions instanceof Object)) {

            var un = function() {
                that.close().remove();
            };

            // 找到那个 iframe
            for (var i = 0; i < frames.length; i++) {
                try {
                    if (originalOptions instanceof frames[i].Object) {
                        // 让 iframe 刷新的时候也关闭对话框，
                        // 防止要执行的对象被强制收回导致 IE 报错：“不能执行已释放 Script 的代码”
                        $(frames[i]).one('unload', un);
                        break;
                    }
                } catch (e) {}
            }
        }


        // 拖拽支持
        $(that.node).on(drag.types.start, '[i=title]', function(event) {
            // 排除气泡类型的对话框
            if (!that.follow) {
                that.focus();
                drag.create(that.node, event);
            }
        });

    },

    /**
     * 显示浮层
     * @param   {HTMLElement, Event}  指定位置（可选）
     */
    show: function(anchor) {

        if (this.destroyed) {
            return this;
        }

        var that = this,
            popup = this.__popup,
            backdrop = this.__backdrop,
            options = this.options;

        this.__activeElement = this.__getActive();
        this.open = true;
        this.follow = anchor || this.follow;


        // 初始化 show 方法
        if (!this.__ready) {

            // .addClass(className)
            popup
                .attr('role', options.modal ? 'alertdialog' : 'dialog')
                .css('position', options.fixed ? 'fixed' : 'absolute');

            $win.on('resize', proxy(this.reset, this));

            // 模态浮层的遮罩
            if (options.modal) {
                var backdropCss = extend(backdropDefaultCss, {
                    zIndex: zIndex
                });

                popup.addClass(className + '-modal');

                backdrop
                    .css(backdropCss)
                    .attr({
                        tabindex: '0'
                    })
                    .on('focus', proxy(this.focus, this));

                // 锁定 tab 的焦点操作
                this.__mask = backdrop
                    .clone(true)
                    .attr('style', '')
                    .insertAfter(popup);

                backdrop
                    .addClass(className + '-backdrop')
                    .insertBefore(popup);

                this.__ready = true;
            }

            if (!popup.html()) {
                popup.html(this.innerHTML);
            }
        }


        popup
            .addClass(className + '-show')
            .show();

        backdrop.show();

        this.reset().focus();
        this.trigger('show');
        $doc.on('keydown', this._backspace);

        return this;
    },

    _backspace: function(e){
        var e = e || event,
            currKey = e.keyCode || e.which || e.charCode;
        if(currKey == fly.keys.BACKSPACE){
            var elem = e.srcElement || e.currentTarget,
                name = elem.nodeName;
            if((name == 'INPUT' || name == 'TEXTAREA') && !elem.getAttribute('readonly')) {
                return true;
            } else {
                if(e.returnValue){
                    e.returnValue = false ;
                }
                e.preventDefault && e.preventDefault();
                return false;
            }
        }
    },

    /** 显示模态浮层。参数参见 show() */
    showModal: function() {
        this.options.modal = true;
        return this.show.apply(this, arguments);
    },


    /** 关闭浮层 */
    close: function(result) {

        if (!this.destroyed && this.open) {

            if (result !== undefined) {
                this.returnValue = result;
            }

            this.trigger('close');

            this.__popup.hide().removeClass(className + '-show');
            this.__backdrop.hide();
            this.open = false;

            // 恢复焦点
            if (this.options.backfocus !== false) {
                this.blur();
            }
        }

        $doc.off('keydown', this._backspace);
        return this;
    },


    /** 销毁浮层 */
    destroy: function() {

        if (this.destroyed) {
            return this;
        }

        this.trigger('beforeremove');

        if (current === this) {
            current = null;
        }

        this._$('body').find('.widget').each(function(){
            var c = this.handler;
            c && c.destroy();
        });

        // 从 DOM 中移除节点
        this.__popup.remove();
        this.__backdrop.remove();
        this.__mask.remove();

        if (this.iframeNode && this.iframeNode.parentNode) {
            this.iframeNode.parentNode.removeChild(this.iframeNode);
        }

        // 这里dom都删除了，无需再调用destroy
        // this._super.destroy();

        $win.off('resize', this.reset);

        this.trigger('remove');

        for (var i in this) {
            delete this[i];
        }

        return this;
    },


    /** 重置位置 */
    reset: function() {

        var elem = this.follow;

        if (elem) {
            this.__follow(elem);
        } else {
            this.__center();
        }

        this.trigger('reset');

        return this;
    },


    /** 让浮层获取焦点 */
    focus: function() {

        var node = this.node;
        var popup = this.__popup;
        var index = zIndex++;

        if (current && current !== this) {
            current.blur(false);
        }

        // 检查焦点是否在浮层里面
        if (!$.contains(node, this.__getActive())) {
            var autofocus = popup.find('[autofocus]')[0];

            if (!this._autofocus && autofocus) {
                this._autofocus = true;
            } else {
                autofocus = node;
            }

            this.__focus(autofocus);
        }

        // 设置叠加高度
        popup.css('zIndex', index);

        current = this;
        popup.addClass(className + '-focus');

        this.trigger('focus');

        return this;
    },


    /** 让浮层失去焦点。将焦点退还给之前的元素，照顾视力障碍用户 */
    blur: function() {

        var activeElement = this.__activeElement;
        var isBlur = arguments[0];


        if (isBlur !== false) {
            this.__focus(activeElement);
        }

        this._autofocus = false;
        this.__popup.removeClass(className + '-focus');
        this.trigger('blur');

        return this;
    },


    // 对元素安全聚焦
    __focus: function(elem) {
        // 防止 iframe 跨域无权限报错
        // 防止 IE 不可见元素报错
        try {
            // ie11 bug: iframe 页面点击会跳到顶部
            if (this.options.autofocus && !/^iframe$/i.test(elem.nodeName)) {
                elem.focus();
            }
        } catch (e) {}
    },


    // 获取当前焦点的元素
    __getActive: function() {
        try { // try: ie8~9, iframe #26
            var activeElement = document.activeElement;
            var contentDocument = activeElement.contentDocument;
            var elem = contentDocument && contentDocument.activeElement ||
                activeElement;
            return elem;
        } catch (e) {}
    },


    // 居中浮层
    __center: function() {

        var popup = this.__popup;
        var fixed = this.options.fixed;
        var dl = fixed ? 0 : $doc.scrollLeft();
        var dt = fixed ? 0 : $doc.scrollTop();
        var ww = $win.width();
        var wh = $win.height();
        var ow = popup.width();
        var oh = popup.height();
        var left = (ww - ow) / 2 + dl;
        var top = (wh - oh) * 382 / 1000 + dt; // 黄金比例
        var style = popup[0].style;
        var style = popup[0].style;

        style.left = Math.max(parseInt(left), dl) + 'px';
        style.top = Math.max(parseInt(top), dt) + 'px';
    },


    // 指定位置 @param    {HTMLElement, Event}  anchor
    __follow: function(anchor) {

        var $elem = anchor.parentNode && $(anchor);
        var popup = this.__popup;


        if (this.__followSkin) {
            popup.removeClass(this.__followSkin);
        }


        // 隐藏元素不可用
        if ($elem) {
            var o = $elem.offset();
            if (o.left * o.top < 0) {
                return this.__center();
            }
        }

        var that = this;
        var fixed = this.options.fixed;

        var winWidth = $win.width();
        var winHeight = $win.height();
        var docLeft = $doc.scrollLeft();
        var docTop = $doc.scrollTop();


        var popupWidth = popup.width();
        var popupHeight = popup.height();
        var width = $elem ? $elem.outerWidth() : 0;
        var height = $elem ? $elem.outerHeight() : 0;
        var offset = this.__offset(anchor);
        var x = offset.left;
        var y = offset.top;
        var left = fixed ? x - docLeft : x;
        var top = fixed ? y - docTop : y;


        var minLeft = fixed ? 0 : docLeft;
        var minTop = fixed ? 0 : docTop;
        var maxLeft = minLeft + winWidth - popupWidth;
        var maxTop = minTop + winHeight - popupHeight;


        var css = {};
        var align = this.options.align.split(' ');
        var newClassName = className + '-';
        var reverse = {
            top: 'bottom',
            bottom: 'top',
            left: 'right',
            right: 'left'
        };
        var name = {
            top: 'top',
            bottom: 'top',
            left: 'left',
            right: 'left'
        };


        var temp = [{
            top: top - popupHeight,
            bottom: top + height,
            left: left - popupWidth,
            right: left + width
        }, {
            top: top,
            bottom: top - popupHeight + height,
            left: left,
            right: left - popupWidth + width
        }];


        var center = {
            left: left + width / 2 - popupWidth / 2,
            top: top + height / 2 - popupHeight / 2
        };


        var range = {
            left: [minLeft, maxLeft],
            top: [minTop, maxTop]
        };


        // 超出可视区域重新适应位置
        $.each(align, function(i, val) {

            // 超出右或下边界：使用左或者上边对齐
            if (temp[i][val] > range[name[val]][1]) {
                val = align[i] = reverse[val];
            }

            // 超出左或右边界：使用右或者下边对齐
            if (temp[i][val] < range[name[val]][0]) {
                align[i] = reverse[val];
            }

        });


        // 一个参数的情况
        if (!align[1]) {
            name[align[1]] = name[align[0]] === 'left' ? 'top' : 'left';
            temp[1][align[1]] = center[name[align[1]]];
        }


        //添加follow的css, 为了给css使用
        newClassName += align.join('-') + ' ' + className + '-follow';

        that.__followSkin = newClassName;


        if ($elem) {
            popup.addClass(newClassName);
        }


        css[name[align[0]]] = parseInt(temp[0][align[0]]);
        css[name[align[1]]] = parseInt(temp[1][align[1]]);
        popup.css(css);

    },


    // 获取元素相对于页面的位置（包括iframe内的元素）
    // 暂时不支持两层以上的 iframe 套嵌
    __offset: function(anchor) {

        var isNode = anchor.parentNode;
        var offset = isNode ? $(anchor).offset() : {
            left: anchor.pageX,
            top: anchor.pageY
        };


        anchor = isNode ? anchor : anchor.target;
        var ownerDocument = anchor.ownerDocument;
        var defaultView = ownerDocument.defaultView || ownerDocument.parentWindow;

        if (defaultView == window) { // IE <= 8 只能使用两个等于号
            return offset;
        }

        // {Element: Ifarme}
        var frameElement = defaultView.frameElement;
        var $ownerDocument = $(ownerDocument);
        var docLeft = $ownerDocument.scrollLeft();
        var docTop = $ownerDocument.scrollTop();
        var frameOffset = $(frameElement).offset();
        var frameLeft = frameOffset.left;
        var frameTop = frameOffset.top;

        return {
            left: offset.left + frameLeft - docLeft,
            top: offset.top + frameTop - docTop
        };
    },

    /**
     * 设置内容
     * @param    {String, HTMLElement}   内容
     */
    content: function(html) {

        var $content = this._$('content');

        // HTMLElement
        if (typeof html === 'object') {
            html = $(html);
            $content.empty('').append(html.show());
            this.bind('beforeremove', function() {
                $('body').append(html.hide());
            });
        } else {
            $content.html(html);
        }

        return this.reset();
    },

    /**
     * 设置标题
     * @param    {String}   标题内容
     */
    title: function(text) {
        this._$('title').text(text);
        this._$('header')[text ? 'show' : 'hide']();
        return this;
    },


    /** 设置宽度 */
    width: function(value) {
        this._$('content').css('width', value);
        return this.reset();
    },


    /** 设置高度 */
    height: function(value) {
        this._$('content').css('height', value);
        return this.reset();
    },


    /**
     * 设置按钮组
     * @param   {Array, String}
     * Options: value, callback, autofocus, disabled
     */
    button: function(args) {
        args = args || [];
        var that = this;
        var html = '';
        var number = 0;
        this.callbacks = {};


        if (typeof args === 'string') {
            html = args;
            number++;
        } else {
            $.each(args, function(i, val) {

                var id = val.id = val.id || val.value;
                var style = '';
                that.callbacks[id] = val.callback;


                if (val.display === false) {
                    style = ' style="display:none"';
                } else {
                    number++;
                }

                html +=
                    '<button' + ' type="button"' + ' i-id="' + id + '"' + style +
                    (val.disabled ? ' disabled' : '') + (val.autofocus ?
                        ' autofocus class="dialog-autofocus"' : '') + '>' + val
                    .value + '</button>';

                that._$('button')
                    .on('click', '[i-id=' + id + ']', function(event) {
                        
                        var $this = $(this);
                        if (!$this.attr('disabled')) { // IE BUG
                            that._trigger(id);
                        }

                        event.preventDefault();
                    });
            });
        }

        this._$('button').html(html);
        this._$('footer')[number ? 'show' : 'hide']();

        return this;
    },


    statusbar: function(html) {
        this._$('statusbar')
            .html(html)[html ? 'show' : 'hide']();

        return this;
    },


    _$: function(i) {
        return this._popup.find('[i=' + i + ']');
    },


    // 触发按钮回调函数
    _trigger: function(id) {
        var fn = this.callbacks[id];

        return typeof fn !== 'function' || fn.call(this) !== false ?
            this.close().destroy() : this;
    }

});

Dialog.popup = popupElement;

var dialog = function(options, ok, cancel) {
    var originalOptions = options = options || {};


    if (typeof options === 'string' || options.nodeType === 1) {

        options = {
            content: options
        };
    }


    options = $.extend(true, {}, defaults, options);
    options.original = originalOptions;

    var id = options.id = options.id || fly.guid();
    var api = dialog.get(id);


    // 如果存在同名的对话框对象，则直接返回
    if (api) {
        return api.focus();
    }


    // 快捷关闭支持：点击对话框外快速关闭对话框
    if (options.quickClose) {
        options.modal = true;
        options.backdropOpacity = 0;
    }


    // 按钮组
    if (!$.isArray(options.button)) {
        options.button = [];
    }

    // 确定按钮
    if (ok !== undefined) {
        options.ok = ok;
    }

    if (options.ok) {
        options.button.push({
            id: 'ok',
            value: options.okValue,
            callback: options.ok,
            autofocus: true
        });
    }


    // 取消按钮
    if (cancel !== undefined) {
        options.cancel = cancel;
    }

    if (options.cancel) {
        options.button.push({
            id: 'cancel',
            value: options.cancelValue,
            callback: options.cancel,
            display: options.cancelDisplay
        });
    }

    return dialog.list[id] = new Dialog(popupElement(), options);
};

dialog.getCurrent = function() {
    return current;
};

dialog.list = {};

dialog.get = function(id) {

    // 从 iframe 传入 window 对象
    if (id && id.frameElement) {
        var iframe = id.frameElement;
        var list = dialog.list;
        var api;
        for (var i in list) {
            api = list[i];
            if (api.node.getElementsByTagName('iframe')[0] === iframe) {
                return api;
            }
        }
        // 直接传入 id 的情况
    } else if (id) {
        return dialog.list[id];
    }

};

fly.dialog = dialog;
module.exports = Dialog;
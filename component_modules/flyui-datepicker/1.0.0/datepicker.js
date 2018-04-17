/**
 * 日期选择框
 * @author: huanzhang
 * @email: huanzhang@iflytek.com
 * @update: 2015-09-28
 */

'use strict';
var $ = require('jquery');
var fly = require('fly');
// 依赖模块
var Calender = require('calender');
var Popup = require('popup');


var extend = $.extend,
    proxy = $.proxy,
    activeElement = fly.activeElement;

var NAME = 'DatePicker',
    NS = '.' + fly.NS + NAME,
    UNSELECTED = 'unselectable="on"',
    DISABLED = "disabled",
    READONLY = "readonly",
    FOCUSED = "state-focused",
    DEFAULT = "state-default",
    STATEDISABLED = "state-disabled",
    SELECTED = "state-selected",
    STATEHOVER = "state-hover",
    TABINDEX = "tabindex",
    OPEN = 'open',
    CLOSE = 'close',
    CHANGE = 'change',
    HOVEREVENTS = "mouseenter" + NS + " mouseleave" + NS;

var defaults = fly.ui.defaults[NAME] = {
    name: '',
    enabled: true,
    format: 'yyyy-MM-dd',
    minDate: -Infinity,
    maxDate: Infinity,
    placeholder: '请选择'
};

var DatePicker = module.exports = fly.Component.extend({

    name: NAME,

    options: defaults,

    template: fly.template(__inline('datepicker.tpl')),

    ctor: function (element, options) {
        var that = this;

        that._super(element, options);
        that.options.placeholder = that.options.placeholder || that.$element.attr('placeholder');
        that.onlyTimes = !/(y+)|(M+)|(d+)/.test(that.options.format);
        that._wrapper();
        that._calender();
        that._popup();
        that._enable();
    },

    events: [
        CHANGE,
        'focus',
        'blur'
    ],

    _wrapper: function () {
        var that = this,
            element = that.$element,
            SELECTOR = "span.input",
            wrapper,
            span,
            input;

        that._focused = that.wrapper = wrapper = element;

        span = that.span = wrapper.find('span.input');
        input = that.input = wrapper.find('input:hidden');

        // 默认显示占位符
        that.span.text(that.options.placeholder);

        // 验证目标元素
        input.data('target', span).attr({role: NAME, name: that.options.name});
        that._inputWrapper = $(wrapper.children()[0]);
    },

    _calender: function () {
        var that = this,
            options = that.options;
            options = options.toJSON ? options.toJSON() : options;
        var calenderDom = $('<div/>');
        that.calenderWrapper = $('<div/>').appendTo('body')
            .addClass('calendar-container').append(calenderDom);
        that.calender = new Calender(calenderDom, extend({}, options));
        that.calender.bind('ok', proxy(that._okHandler, that))
                     .bind('clear', proxy(that._cancelHandler, that))
    },

    _popup: function () {
        var that = this,
            options = that.options;
            options = options.toJSON ? options.toJSON() : options;
        that.popup = new Popup(that.calenderWrapper, extend({}, options.popup, {
            anchor: that.wrapper,
            animation: that.options.animation
        }));
    },

    _focusHandler: function () {
        this.wrapper.focus();
    },

    _focusinHandler: function (e) {
        this._inputWrapper.addClass(FOCUSED);
        this._prevent = false;
        this.trigger('focus', e);
    },

    _focusoutHandler: function (e) {
        var that = this;
        var isIFrame = window.self !== window.top;

        if (!that._prevent) {
            if (isIFrame) {
                that._change();
            } else {
                that._blur();
            }

            that._inputWrapper.removeClass(FOCUSED);
            that._prevent = true;
            this.trigger('blur', e);
        }
    },

    _wrapperMousedown: function () {
        this._prevent = false;
    },

    _wrapperClick: function (e) {
        e.preventDefault();
        this.popup.unbind("activate", this._focusInputHandler);
        this._focused = this.wrapper;
        this._toggle();
    },

    _toggle: function (open, preventFocus) {
        var that = this;

        open = open !== undefined ? open : !that.popup.visible();

        if (!preventFocus && that._focused[0] !== activeElement()) {
            that._focused.focus();
        }

        that[open ? OPEN : CLOSE]();
    },

    _toggleHover: function (e) {
        $(e.currentTarget).toggleClass(STATEHOVER, e.type === "mouseenter");
    },

    _editable: function (options) {
        var that = this;
        var element = that.$element;
        var disable = options.disable;
        var readonly = options.readonly;
        var wrapper = that.wrapper.off(NS);
        var inputWrapper = that._inputWrapper.off(HOVEREVENTS);

        if (!readonly && !disable) {
            element.removeAttr(DISABLED).removeAttr(READONLY);

            inputWrapper
                .addClass(DEFAULT)
                .removeClass(STATEDISABLED)
                .on(HOVEREVENTS, that._toggleHover);

            wrapper
                .attr(TABINDEX, wrapper.data(TABINDEX))
                .on("mousedown" + NS, proxy(that._wrapperMousedown, that))
                .on("click" + NS, proxy(that._wrapperClick, that))
            /*.on("focusin" + NS, proxy(that._focusinHandler, that))
             .on("focusout" + NS, proxy(that._focusoutHandler, that))*/;

        } else if (disable) {
            wrapper.removeAttr(TABINDEX);
            inputWrapper
                .addClass(STATEDISABLED)
                .removeClass(DEFAULT);
        } else {
            inputWrapper
                .addClass(DEFAULT)
                .removeClass(STATEDISABLED);
        }

        element.attr(DISABLED, disable)
            .attr(READONLY, readonly);
    },

    _okHandler: function (data) {
      	// 手动调用  _focusoutHandler 地方 要触发change by pang.ziqin
        this._prevent = false;
        this.span.text(data.result);
        this.$element.val(data.result);
        this.input.val(data.result); // fixed valiate
        this._focusoutHandler();
        this.close();
    },

    _cancelHandler: function () {
      	// 手动调用  _focusoutHandler 地方 要触发change by pang.ziqin
        this._prevent = false;
        this.span.text(this.options.placeholder);
        this.$element.val('');
        this.input.val(''); // fixed valiate
        this._focusoutHandler();
        this.close();
    },

    _blur: function () {
        this._change();
        this.close();
    },

    _change: function () {
        var that = this,
            value = that.value();

        if (value !== that._old) {
            that._old = value;
            that.$element.trigger(CHANGE);
            that.trigger(CHANGE);
        }
    },

    _enable: function () {
        var that = this,
            options = that.options,
            disabled = that.$element.is("[disabled]");

        if (options.enable !== undefined) {
            options.enabled = options.enable;
        }

        if (!options.enabled || disabled) {
            that.enable(false);
        } else {
            that.readonly(that.$element.is("[readonly]"));
        }
    },

    enable: function (enable) {
    
        this._editable({
            readonly: false,
            disable: !(enable = enable === undefined ? true : enable)
        });
    },

    readonly: function (readonly) {
        this._editable({
            readonly: readonly === undefined ? true : readonly,
            disable: false
        });
    },

    value: function (value) {
        if (value === undefined) {
            return this.calender.value();
        } else if (!value) {
            this._cancelHandler();
        }
        this.calender.value(value);
    },

    open: function () {
        var that = this;

        if (that.popup.visible()) {
            return;
        }

        that.popup.open();
        // that.calender._fillDays();
        that.calender[that.onlyTimes ? '_fillTimes': '_fillDays']();
    },

    close: function () {
        this.popup.close();
    },

    destroy: function () {
        this._super();
    }

});

fly.component(DatePicker);

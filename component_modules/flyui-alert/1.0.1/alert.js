'use strict';

var container;

var fly = require('fly'),
    $ = require('jquery'),
    animated = require('animated');

var Alert = fly.Component.extend({
    name: 'Alert',
    options: {
        content: '提示信息',
        icon: '', // icon-message
        autoClose: 0, // 自动关闭的延时时间
        closable: true, // 是否显示关闭按钮
        closeTitle: '关闭',
        closeText: '',  // 自定义关闭按钮
        type: 'info',  // 'info', 'success', 'danger', 'warning'
        animation: {
            open: {
                effects: "slideIn:down",
                transition: true,
                duration: 200
            },
            close: {
                effects: 'fade:out',
                transition: true,
                duration: 100
            }
        },
        onclose: null
    },
    template: fly.template(__inline('alert.tpl')),
    ctor: function(element, options){
        var that = this;
        that._super(element, options);
        options = that.options;

        that.$element.addClass('alert-' + options.type)
            .on('click', 'button.close', function(e) {
            that.close();
            that.trigger('onclose');
            that.options.onclose && that.options.onclose(e);
        });

        that.open();

        if (that.options.autoClose) {
            setTimeout(function(){
                that.close();
            }, that.options.autoClose);
        }
    },

    open: function () {
        this.$element.flyAnimate(this.options.animation.open);
    },

    close: function () {
        var that = this;
        that.$element.flyAnimate($.extend(true, that.options.animation.close, {
            complete: function() {
                that.$element.remove();
            }
        }));
    }
});

var alert = fly.alert = function(options) {
    var element;
    if (typeof options === 'string') {
        options = {
            content: options
        };
    }
    $('.alert-container').empty();
    element = $('<div></div>').prependTo(getContainer());
    return new Alert(element, $.extend({
        autoClose: 3000
    }, options));
};

function getContainer() {
    if (!container) {
        container = $('.alert-container');
        if (container.length == 0) {
            container = $('<div class="alert-container" />').appendTo($('body'));
        }
    }
    return container;
}

fly.component(Alert);
module.exports = Alert;
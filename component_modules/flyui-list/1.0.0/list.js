'use strict';
var $ = require('jquery');
var fly = require('fly');
var $ = $ || fly.$,
    NAME = 'List',
    NS = '.' + fly.NS + NAME,
    CHANGE = 'change',
    DATABOUND = 'dataBound',
    DATABINDING = 'dataBinding',
    CLICK = 'click',
    proxy = $.proxy,
    template = fly.template;

var defaults = fly.ui.defaults[NAME] = {
    autoBind: true,
    selectable: false,
    navigatable: false,
    label: 'div',
    template: '<li></li>'
};

var List = module.exports = fly.Component.extend({

    name: NAME,

    options: defaults,
    
    template: '<div></div>',

    ctor: function (element, options) {
        var that = this,
            tpl = element.innerHTML,
            label = options.label;

        // 存在自定义模板
        if (tpl && !options.template) {
            options.template = tpl;
        }

        if (element.nodeName === 'LIST') {
            that.template = template('<' + (label || 'div') + '></' + (label || 'div') + '>');
        }

        that._super(element, options);

        that._templates();

        fly.notify(that);
    },

    events: [
        CHANGE,
        DATABINDING,
        DATABOUND
    ],

    setOptions: function (options) {
        this._super(options);
        this._templates();
    },

    _templates: function () {
        var options = this.options;
        // 默认模板
        this.itemTemplate = template(options.template);
    },

    items: function (id) {
        var items = this.element.children,
            length = items.length,
            idx = 0;

        if (typeof(id) === 'number') {
            return items[id];
        } else if (typeof(id) === 'string') {
            for (; idx < length; idx++) {
                if (items[idx].getAttribute('data-uid') === id) {
                    return items[idx];
                }
            }
        } else {
            return items;
        }

        return null;
    },

    refresh: function (e) {
        var that = this,
            view = that.dataSource.view(),
            length = view.length,
            template = that.itemTemplate,
            html = '';

        e = e || {};

        switch(e.action) {
            case 'itemchange':
                if (that._hasBindingTarget()) {
                    break;
                }

                var data = e.items[0],
                    item = that.items(data.uid),
                    newItem = $(template(data))[0];

                if (!item) break;

                that.trigger(DATABINDING, { 
                    removedItems: item
                });

                newItem.setAttribute('data-uid', data.uid);
                that.element.replaceChild(newItem, item);

                that.trigger('itemChange', {
                    item: newItem,
                    data: data
                });
                break;

            case 'add':
                var data = e.items[0],
                    newItem = $(template(data))[0];

                newItem.setAttribute('data-uid', data.uid);
                that.element.appendChild(newItem);

                that.trigger(DATABOUND, { 
                    addedItems: [newItem],
                    addedDataItems: e.items
                });
                break;

            case 'remove':
                var data = e.items[0],
                    item = that.items(data.uid);

                that.trigger(DATABINDING, { 
                    removedItems: [item]
                });
                that.element.removeChild(item);
                break;

            default:
                if (that.trigger(DATABINDING, { 
                    action: e.action || 'rebind', 
                    items: e.items, 
                    index: e.index 
                })) {
                    return;
                }

                for (var idx = 0; idx < length; idx++) {
                    html += template(view[idx]);
                }

                that.element.innerHTML = html;

                for (var idx = 0; idx < length; idx++) {
                    that.element.children[idx].setAttribute('data-uid', view[idx].uid);
                }

                that.trigger(DATABOUND);
        }
    },

    destroy: function () {
        var that = this;

        that._super();

        that._unbindDataSource();
    }

});

fly.component(List);
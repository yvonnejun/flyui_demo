
var fly = require('fly');
var _panel, _model;

var Router = fly.Router.extend({

  ctor: function (view, navigation) {
    this._super();
    this.pageView = view;
    this.navigation = navigation || {
      load: function() {},
      unload: function() {}
    };
    this.views = {
      '404': 'pages/404'
    };
    this.pages = [];
  },

  empty: function (dom) {
    while (dom.hasChildNodes()) {
      dom.removeChild(dom.firstChild);
    }
  },

  has: function (name) {
    return this.views.hasOwnProperty(name);
  },

  hasOpen: function (page) {
    return this.pages.find(function (item) {
      return item instanceof page;
    });
  },

  register: function (name) {
    if (!this.has(name)) {
      this.views[name] = 'pages' + name;
    }
  },

  title: function (title) {
    document.title = title;
  },

  back: function () {
    var locations = fly.history.locations;
    if (locations.length < 2) {
      this.navigate('');
    } else {
      window.history.go(-1);
    }
  },

  load: function (context, type) {
    var that = this, name, wrapper, prev, current;

    if (typeof (context) === 'string') {
      context = {
        page: context
      }
    }

    name = context.page;
    name = that.has(name) ? name : '404';

    // _panel && panel.close(_panel);

    if (fly.$.isPlainObject(type)) {
      if (type.type === 'modal') {
        // TODO
      }
      return;
    } else if (fly.isDOM(type)) {
      // 在指定容器中打开
      wrapper = type;
    } else {
      // 默认打开方式
      wrapper = that.pageView;
    }

    // 模块加载
    require.async(that.views[name] || name, function (Page) {
      var pageDom, pageComponent, navigation = Page.fn.navigation, length;

      if ((current = that.hasOpen(Page)) && (prev = that.pages.pop()) && current !== prev) {
        that.navigation.unload(prev, current);
        prev.element.parentNode.removeChild(prev.element);
        return;
      }

      if (!navigation || (navigation && navigation.backButton == false)) {
        that.empty(wrapper);
        while(that.pages.length) {
          that.pages[0].destroy();
          that.pages.splice(0, 1);
        }
      }

      length = that.pages.length;
      pageDom = document.createElement('div');
      wrapper.appendChild(pageDom);
      pageComponent = new Page(pageDom, {
        params: context.queryParams,
        navigator: that.navigation
      });
      that.navigation.load(pageComponent, length && that.pages[length - 1]);
      that.pages.push(pageComponent);
    });
  },

  panel: function (name, type) {
    var that = this,
      wrapper = document.createElement('div'),
      overlay = document.createElement('div');
    type = type || {};
    overlay.classList.add('panel-overlay');
    wrapper.classList.add('panel');
    document.body.appendChild(overlay);
    document.body.appendChild(wrapper);
    _panel = {
      style: type,
      overlay: overlay,
      wrapper: wrapper
    };

    require.async(name, function (Page) {
      var pageComponent = new Page(wrapper, {
        navigator: that.navigation
      });
      _panel.component = pageComponent;
      panel.open(_panel);
    });
  }
});

module.exports = Router;
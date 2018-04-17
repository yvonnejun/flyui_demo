(function(global) {
	'use strict';

	var win = global,
		slice = Array.prototype.slice,
		localStorage = win.localStorage,
		head = document.head || document.getElementsByTagName('head')[0],
		ua = win.navigator.userAgent.toLowerCase(),
		proto = {},
		scrat = create(proto),
        HASH = '__FLY_HASH__';

	var TYPE_RE = /\.(js|css)(?=[?&,]|$)/i;

	scrat.options = {
		prefix: '__FLY__',
		cache: false,
		hash: '',
		timeout: 15, // seconds
		alias: {}, // key - name, value - id
		deps: {}, // key - id, value - name/id
		vasts: {}, // 多端适配
		urlPattern: null, // '/path/to/resources/%s'
		comboPattern: null, // '/path/to/combo-service/%s' or function (ids) { return url; }
		combo: false,
		maxUrlLength: 2000 // approximate value of combo url's max length (recommend 2000)
	};
	scrat.cache = {}; // key - id
	scrat.traceback = null;

	function inArray(search, array) {
		for (var i in array) {
			if (array[i] == search) {
				return true;
			}
		}
		return false;
	}

	/**
	 * 获取当前设备
	 * @return {Object}
	 */
	var device = (function() {
		var device = {
			find: function(needle) {
				return ua.indexOf(needle) !== -1;
			},
			windows: function() {
				return this.find('windows');
			},
			ios: function() {
				return this.iphone() || this.ipod() || this.ipad();
			},
			iphone: function() {
				return this.find('iphone') && !this.windows();
			},
			ipad: function() {
				return this.find('ipad');
			},
			ipod: function() {
				return this.find('ipod');
			},
			android: function() {
				return !this.windows() && this.find('android');
			},
			androidPhone: function() {  // 安卓手机
				return this.android() && this.find('mobile');
			},
			androidTablet: function() {  // 安卓平板电脑
				return this.android() && !this.find('mobile');
			},
			windowsPhone: function() {
				return this.windows() && this.find('phone');
			},
			windowsTablet: function() {
				return this.windows() && (this.find('touch') && !this.windowsPhone());
			},
			fxos: function() {  // Firefox OS
				return (this.find('(mobile;') || this.find('(tablet;')) && this.find('; rv:');
			},
			fxosPhone: function() {
				return this.fxos() && this.find('mobile');
			},
			fxosTablet: function() {
				return this.fxos() && this.find('tablet');
			},
			meego: function() { 
				return this.find('meego');
			},
			mobile: function() {
				return this.androidPhone() || this.iphone() || 
					this.iphone() || this.ipod() ||
					this.windowsPhone() ||
					this.fxosPhone() || this.meego();
			},
			tablet: function() {
				return this.ipad() || 
					this.androidTablet() ||
					this.windowsTablet() ||
					this.fxosTablet();
			},
			desktop: function() {
				return !this.tablet() && !this.mobile();
			},
			wechat: function() {
				return this.find('MicroMessenger');
			},
			croods: function() {  // 移动平台
				return this.find('iflytek_mmp');
			}
		};
		return {
			type: device.mobile() ? 'phone' : 
				(device.tablet() ? 'pad' : ''),
			platform: device.wechat() ? 'wx' : 
				(device.croods() ? 'croods' : 
				(device.ios() ? 'ios' :
				(device.android() ? 'android' : '')))
		};
	})();

	/**
	 * 获取当前设备的多端适配最适方案
	 * @return {Object}
	 */
	var getVast = function (vasts) {
		if (({}.toString).call(vasts) !== '[object Array]') {
			return false;
		}
		if (inArray(device.platform, vasts)) {
			return device.platform;
		}
		if (inArray(device.type, vasts)) {
			return device.type;
		}
	};

	/**
	 * Mix obj to scrat.options
	 * @param {object} obj
	 */
	proto.config = function (obj) {
		var options = scrat.options;

		// debug('scrat.config', obj);
		each(obj, function (value, key) {
			var data = options[key],
				t = type(data);
			if (t === 'object') {
				each(value, function (v, k) {
					data[k] = v;
				});
			} else {
				if (t === 'array') value = data.concat(value);
				options[key] = value;
			}
		});

		// detect localStorage support and activate cache ability
		try {
			if (options.hash !== localStorage.getItem(HASH)) {
				scrat.clean();
				localStorage.setItem(HASH, options.hash);
			}
			options.cache = options.cache && !!options.hash;
		} catch (e) {
			options.cache = false;
		}

		// detect scrat=nocombo,nocache in location.search
		if (/\bscrat=([\w,]+)\b/.test(location.search)) {
			each(RegExp.$1.split(','), function (o) {
				switch (o) {
					case 'nocache':
						scrat.clean();
						options.cache = false;
						break;
					case 'nocombo':
						options.combo = false;
						break;
				}
			});
		}
		return options;
	};

	/**
	 * Require modules asynchronously with a callback
	 * @param {string|Array} names
	 * @param {function} onload
	 */
	proto.async = function (names, onload) {
		if (type(names) === 'string') names = [names];
		// debug('scrat.async', '_require [' + names.join(', ') + ']');

		var reactor = new scrat.Reactor(names, function () {
			var args = [];
			each(names, function (id) {
				args.push(_require(id));
			});
			if (onload) onload.apply(scrat, args);
			// debug('scrat.async', '[' + names.join(', ') + '] callback called');
		});
		reactor.run();
	};

	/**
	 * Define a JS module with a factory funciton
	 * @param {string} id
	 * @param {function} factory
	 */
	proto.define = function (id, factory) {
		// debug('scrat.define', '[' + id + ']');
		var options = scrat.options,
			res = scrat.cache[id];
		if (res) {
			res.factory = factory;
		} else {
			scrat.cache[id] = {
				id: id,
				loaded: true,
				factory: factory
			};
		}
		if (options.cache) {
			localStorage.setItem(options.prefix + id, factory.toString());
		}
	};

	/**
	 * Define a CSS module
	 * @param {string} id
	 * @param {string} css
	 * @param {boolean} [parsing=true]
	 */
	proto.defineCSS = function (id, css, parsing) {
		// debug('scrat.defineCSS', '[' + id + ']');
		var options = scrat.options;
		scrat.cache[id] = {
			id: id,
			loaded: true,
			rawCSS: css
		};
		if (parsing !== false) _requireCSS(id);
		if (options.cache) localStorage.setItem(options.prefix + id, css);
	};

	/**
	 * Get a defined module
	 * @param {string} id
	 * @returns {object} module
	 */
	proto.get = function (id) {
		/* jshint evil:true */
		// debug('scrat.get', '[' + id + ']');
		var options = scrat.options,
			type = fileType(id),
			res = scrat.cache[id],
			raw;
		if (res) {
			return res;
		} else if (options.cache) {
			raw = localStorage.getItem(options.prefix + id);
			if (raw) {
				if (type === 'js') {
					window['eval'].call(window, 'define("' + id + '",' + raw + ')');
				} else if (type === 'css') {
					scrat.defineCSS(id, raw, false);
				}
				scrat.cache[id].loaded = false;
				return scrat.cache[id];
			}
		}
		return null;
	};

	/**
	 * Clean module cache in localStorage
	 */
	proto.clean = function () {
		// debug('scrat.clean');
		try {
			each(localStorage, function (_, key) {
				if (~key.indexOf(scrat.options.prefix)) {
					localStorage.removeItem(key);
				}
			});
			localStorage.removeItem(HASH);
		} catch (e) { }
	};

	/**
	 * Get alias from specified name recursively
	 * @param {string} name
	 * @param {string|function} [alias] - set alias
	 * @returns {string} name
	 */
	proto.alias = function (name, alias) {
		var aliasMap = scrat.options.alias,
			vastMap = scrat.options.vasts,
			myVastName;

		if (arguments.length > 1) {
			aliasMap[name] = alias;
			return scrat.alias(name);
		}

		while (aliasMap[name] && name !== aliasMap[name]) {
			switch (type(aliasMap[name])) {
				case 'function':
					name = aliasMap[name](name);
					break;
				case 'string':
					name = aliasMap[name];
					break;
			}
		}

		if (myVastName = getVast(vastMap[name])) {
			name = name.replace(new RegExp('(.{' + name.lastIndexOf('.') + '})'), '$1.' + myVastName);
		}

		return name;
	};

	/**
	 * Load any types of resources from specified url
	 * @param {string} url
	 * @param {function|object} options
	 */
	proto.load = function (url, options) {
		if (type(options) === 'function') options = { onload: options };

		var t = options.type || fileType(url),
			isScript = t === 'js',
			isCss = t === 'css',
			isOldWebKit = +navigator.userAgent
				.replace(/.*AppleWebKit\/(\d+)\..*/, '$1') < 536,
			node = document.createElement(isScript ? 'script' : 'link'),
			supportOnload = 'onload' in node,
			tid,
			intId, 
			intTimer;

		node.onerror = function onerror() {
			clearTimeout(tid);
			clearInterval(intId);
			throw new Error('Error loading url: ' + url);
		};

		tid = setTimeout(node.onerror, (options.timeout || 15) * 1000);

		if (isScript) {
			node.type = 'text/javascript';
			node.async = 'async';
			node.src = url;
		} else {
			if (isCss) {
				node.type = 'text/css';
				node.rel = 'stylesheet';
			}
			node.href = url;
		}

		node.onload = node.onreadystatechange = function () {
			if (node && (!node.readyState ||
				/loaded|complete/.test(node.readyState))) {
				clearTimeout(tid);
				node.onload = node.onreadystatechange = null;
				if (isScript && head && node.parentNode) head.removeChild(node);
				if (options.onload) options.onload.call(scrat);
				node = null;
			}
		};

		// debug('scrat.load', '[' + url + ']');
		head.appendChild(node);

		// trigger onload immediately after nonscript node insertion
		if (isCss) {
			if (isOldWebKit || !supportOnload) {
				// debug('scrat.load', 'check css\'s loading status for compatible');
				intTimer = 0;
				intId = setInterval(function () {
					if ((intTimer += 20) > options.timeout || !node) {
						clearTimeout(tid);
						clearInterval(intId);
						return;
					}
					if (node.sheet) {
						clearTimeout(tid);
						clearInterval(intId);
						if (options.onload) options.onload.call(scrat);
						node = null;
					}
				}, 20);
			}
		} else if (!isScript) {
			if (options.onload) options.onload.call(scrat);
		}
	};

	proto.Reactor = function (names, callback) {
		this.length = 0;
		this.depends = {};
		this.depended = {};
		this.push.apply(this, names);
		this.callback = callback;
	};

	var rproto = scrat.Reactor.prototype;

	rproto.push = function () {
		var that = this,
			args = slice.call(arguments);

		function onload() {
			if (--that.length === 0) that.callback();
		}

		each(args, function (arg) {
			var id = scrat.alias(arg),
				type = fileType(id),
				res = scrat.get(id);

			if (!res) {
				res = scrat.cache[id] = {
					id: id,
					loaded: false,
					onload: []
				};
			} else if (that.depended[id] || res.loaded) return;

			that.depended[id] = 1;
			if (scrat.options.deps[id])
				that.push.apply(that, scrat.options.deps[id]);
			else
				that.push.apply(that);

			if ((type === 'css' && !res.rawCSS && !res.parsed) ||
				(type === 'js' && !res.factory && !res.exports)) {
				(that.depends[type] || (that.depends[type] = [])).push(res);
				++that.length;
				res.onload.push(onload);
			} else if (res.rawCSS) {
				_requireCSS(id);
			}
		});
	};

	function makeOnload(deps) {
		deps = deps.slice();
		return function () {
			each(deps, function (res) {
				res.loaded = true;
				while (res.onload.length) {
					var onload = res.onload.shift();
					onload.call(res);
				}
			});
		};
	}

	rproto.run = function () {
		var that = this,
			options = scrat.options,
			combo = options.combo,
			depends = this.depends;

		if (this.length === 0) return this.callback();
		// debug('reactor.run', depends);

		each(depends.unknown, function (res) {
			scrat.load(that.genUrl(res.id), function () {
				res.loaded = true;
			});
		});

		// debug('reactor.run', 'combo: ' + combo);
		if (combo) {
			each(['css', 'js'], function (type) {
				var urlLength = 0,
					ids = [],
					deps = [];

				each(depends[type], function (res, i) {
					if (urlLength + res.id.length < options.maxUrlLength) {
						urlLength += res.id.length;
						ids.push(res.id);
						deps.push(res);
					} else {
						scrat.load(that.genUrl(ids), makeOnload(deps));
						urlLength = res.id.length;
						ids = [res.id];
						deps = [res];
					}
					if (i === depends[type].length - 1) {
						scrat.load(that.genUrl(ids), makeOnload(deps));
					}
				});
			});
		} else {
			each((depends.css || []).concat(depends.js || []), function (res) {
				scrat.load(that.genUrl(res.id), function () {
					res.loaded = true;
					while (res.onload.length) {
						var onload = res.onload.shift();
						onload.call(res);
					}
				});
			});
		}
	};

	rproto.genUrl = function (ids) {
		if (type(ids) === 'string') ids = [ids];

		var options = scrat.options,
			url = options.combo && options.comboPattern || options.urlPattern;

		if (options.cache && fileType(ids[0]) === 'css') {
			each(ids, function (id, i) {
				ids[i] = id + '.js';
			});
		}

		switch (type(url)) {
			case 'string':
				url = url.replace('%s', ids.join(','));
				break;
			case 'function':
				url = url(ids);
				break;
			default:
				url = ids.join(',');
		}

		return url + (~url.indexOf('?') ? '&' : '?') + options.hash;
	};

	/**
	 * Require another module in factory
	 * @param {string} name
	 * @returns {*} module.exports
	 */
	function _require(name) {
		var id = scrat.alias(name),
			module = scrat.get(id);

		if (fileType(id) !== 'js') return;
		if (!module) throw new Error(error(name));
		if (!module.exports) {
			if (type(module.factory) !== 'function') {
				throw new Error(error(name));
			}
			try {
				module.factory.call(scrat, _require, module.exports = {}, module);
			} catch (e) {
				e.id = id;
				throw (scrat.traceback = e);
			}
			delete module.factory;
			// debug('_require', '[' + id + '] factory called');
		}
		return module.exports;
	}

	// Mix scrat's prototype to _require
	each(proto, function (m, k) { _require[k] = m; });

	/**
	 * Parse CSS module
	 * @param {string} name
	 */
	function _requireCSS(name) {
		var id = scrat.alias(name),
			module = scrat.get(id);

		if (fileType(id) !== 'css') return;
		if (!module) throw new Error(error(name));
		if (!module.parsed) {
			if (type(module.rawCSS) !== 'string') {
				throw new Error(error(name));
			}
			var styleEl = document.createElement('style');
			head.appendChild(styleEl);
			styleEl.appendChild(document.createTextNode(module.rawCSS));
			delete module.rawCSS;
			module.parsed = true;
		}
	}

    function error(name) {
        return 'failed to _require "' + name + '"';
    }

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

	function each(obj, iterator, context) {
		if (typeof obj !== 'object') return;

		var i, l, t = type(obj);
		context = context || obj;
		if (t === 'array' || t === 'arguments' || t === 'nodelist') {
			for (i = 0, l = obj.length; i < l; i++) {
				if (iterator.call(context, obj[i], i, obj) === false) return;
			}
		} else {
			for (i in obj) {
				if (obj.hasOwnProperty(i)) {
					if (iterator.call(context, obj[i], i, obj) === false) return;
				}
			}
		}
	}

	function create(proto) {
		function Dummy() { }
		Dummy.prototype = proto;
		return new Dummy();
	}

	function fileType(str) {
		var ext = 'js';
		str.replace(TYPE_RE, function (m, $1) {
			ext = $1;
		});
		if (ext !== 'js' && ext !== 'css') ext = 'unknown';
		return ext;
	}

	if (!win.require) {
		win.require = scrat;
		win.define = scrat.define;
		win.defineCSS = scrat.defineCSS;
	}

})(window);
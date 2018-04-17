/**
 * 弹出框
 * @author: huanzhang
 * @email: huanzhang@iflytek.com
 * @update: 2015-09-08
 */

'use strict';
var $ = require('jquery');
var fly = require('fly');
var animated = require('animated'),
    proxy = $.proxy,
    extend = $.extend,
    $html = $('html'),
    $win = $(window);

// 静态变量
var NAME = 'Popup',
    NS = '.' + fly.NS + NAME,
    CLICK = 'click',
    OPEN = "open",
    CLOSE = "close",
    DEACTIVATE = "deactivate",
    ACTIVATE = "activate",
    CENTER = "center",
    LEFT = "left",
    RIGHT = "right",
    TOP = "top",
    BOTTOM = "bottom",
    ABSOLUTE = "absolute",
    HIDDEN = "hidden",
    BODY = "body",
    LOCATION = "location",
    POSITION = "position",
    VISIBLE = "visible",
    EFFECTS = "effects",
    ACTIVE = "state-active",
    ACTIVEBORDER = "state-border",
    ACTIVEBORDERREGEXP = /state-border-(\w+)/,
    ACTIVECHILDREN = ".picker-wrap, .dropdown-wrap, .link",
    MOUSEDOWN = "down",
    SCROLL = "scroll",
    RESIZE_SCROLL = "resize scroll",
    styles = [
        "font-size",
        "font-family",
        "font-stretch",
        "font-style",
        "font-weight",
        "line-height"
    ];

var eventRegEx = /([^ ]+)/g,
    percentRegExp = /%/;

var defaults = fly.ui.defaults[NAME] = {
    toggleEvent: "click",
    origin: BOTTOM + " " + LEFT,
    position: TOP + " " + LEFT,
    anchor: '',
    appendTo: null,
    collision: "flip fit",
    viewport: '',
    copyAnchorStyles: true,
    autosize: false,
    modal: false,
    adjustSize: {
        width: 0,
        height: 0
    },
    animation: {
        open: {
            effects: "slideIn:down",
            transition: true,
            duration: 200
        },
        close: {
            duration: 100,
            hide: true
        }
    }
};

var directions = {
    left: {
        reverse: RIGHT
    },
    right: {
        reverse: LEFT
    },
    down: {
        reverse: "up"
    },
    up: {
        reverse: "down"
    },
    top: {
        reverse: BOTTOM
    },
    bottom: {
        reverse: TOP
    },
    "in": {
        reverse: "out"
    },
    out: {
        reverse: "in"
    }
};

var eventMap = {
    down: "touchstart mousedown",
    move: "mousemove touchmove",
    up: "mouseup touchend touchcancel",
    cancel: "mouseleave touchcancel"
};

var contains = function(container, target) {
    return container === target || $.contains(container, target);
};

var getEventMap = function(e) {
    return (eventMap[e] || e);
};

var applyEventMap = function(events, ns) {
    events = events.replace(eventRegEx, getEventMap);

    if (ns) {
        events = events.replace(eventRegEx, "$1." + ns);
    }

    return events;
};

function wrap(element, autosize) {
    var percentage;

    if (!element.parent().hasClass("animation-container")) {
        var width = element[0].style.width,
            height = element[0].style.height,
            percentWidth = percentRegExp.test(width),
            percentHeight = percentRegExp.test(height);

        percentage = percentWidth || percentHeight;

        if (!percentWidth && (!autosize || (autosize && width))) {
            width = element.outerWidth();
        }
        if (!percentHeight && (!autosize || (autosize && height))) {
            height = element.outerHeight();
        }

        element.wrap(
            $("<div/>")
            .addClass("animation-container")
            .css({
                width: width,
                height: height
            }));

        if (percentage) {
            element.css({
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                mozBoxSizing: "border-box",
                webkitBoxSizing: "border-box"
            });
        }
    } else {
        var wrapper = element.parent(".animation-container"),
            wrapperStyle = wrapper[0].style;

        if (wrapper.is(":hidden")) {
            wrapper.show();
        }

        percentage = percentRegExp.test(wrapperStyle.width) || percentRegExp.test(wrapperStyle.height);

        if (!percentage) {
            wrapper.css({
                width: element.outerWidth(),
                height: element.outerHeight(),
                boxSizing: "content-box",
                mozBoxSizing: "content-box",
                webkitBoxSizing: "content-box"
            });
        }
    }

    if ($.browser.msie && Math.floor($.browser.version) <= 7) {
        element.css({
            zoom: 1
        });
    }

    return element.parent();
}


// 按钮组件
var Popup = fly.Component.extend({

    name: NAME,

    ctor: function(element, options) {
        var that = this,
            parentPopup,
            _anchor,
            _viewport;

        options = options || {};

        if (options.anchor && typeof options.anchor != 'string') {
            _anchor = options.anchor;
            delete options.anchor;
        };
        if (options.anchor && typeof options.viewport != 'string') {
            _viewport = options.viewport;
            delete options.viewport;
        };

        that._super(element, options);

        element = that.$element;
        options = that.options;

        that.options.anchor = _anchor || BODY;
        that.options.viewport = _viewport || window;

        that.collisions = options.collision ? options.collision.split(" ") : [];
        that.downEvent = applyEventMap(MOUSEDOWN, fly.guid());

        if (that.collisions.length === 1) {
            that.collisions.push(that.collisions[0]);
        }

        parentPopup = $(that.options.anchor).closest(".popup");
        options.appendTo = $($(options.appendTo)[0] || parentPopup[0] || BODY);

        // addClass("popup reset")
        element.hide()
            .addClass("popup")
            .css({
                position: ABSOLUTE
            })
            .appendTo(options.appendTo)
            .on("mouseenter" + NS, function() {
                that._hovered = true;
            })
            .on("mouseleave" + NS, function() {
                that._hovered = false;
            });

        that.wrapper = $();

        if (options.animation === false) {
            options.animation = {
                open: {
                    effects: {}
                },
                close: {
                    hide: true,
                    effects: {}
                }
            };
        }

        extend(options.animation.open, {
            complete: function() {
                that.wrapper.css({
                    overflow: VISIBLE
                });
                that._activated = true;
                that._trigger(ACTIVATE);
            }
        });

        extend(options.animation.close, {
            complete: function() {
                that._animationClose();
            }
        });

        that._mousedownProxy = function(e) {
            that._mousedown(e);
        };

        that._resizeProxy = function(e) {
            that._resize(e);
        };

        if (options.toggleTarget) {
            $(options.toggleTarget).on(options.toggleEvent + NS, proxy(that.toggle,
                that));
        }
    },

    events: [
        OPEN,
        ACTIVATE,
        CLOSE,
        DEACTIVATE
    ],

    options: defaults,

    _animationClose: function() {
        var that = this,
            options = that.options;

        that.wrapper.hide();

        var location = that.wrapper.data(LOCATION),
            anchor = $(options.anchor),
            direction, dirClass;

        if (location) {
            that.wrapper.css(location);
        }

        if (options.anchor != BODY) {
            direction = ((anchor.attr("class") || "").match(ACTIVEBORDERREGEXP) || ["",
                "down"
            ])[1];
            dirClass = ACTIVEBORDER + "-" + direction;

            anchor
                .removeClass(dirClass)
                .children(ACTIVECHILDREN)
                .removeClass(ACTIVE)
                .removeClass(dirClass);

            that.$element.removeClass(ACTIVEBORDER + "-" + directions[direction].reverse);
        }

        that._closing = false;
        that._trigger(DEACTIVATE);
    },

    destroy: function() {
        var that = this,
            options = that.options,
            element = that.$element.off(NS),
            parent;

        that._super();

        if (options.toggleTarget) {
            $(options.toggleTarget).off(NS);
        }

        if (!options.modal) {
            $html.unbind(that.downEvent, that._mousedownProxy);
            that._scrollableParents().unbind(SCROLL, that._resizeProxy);
            $win.unbind(RESIZE_SCROLL, that._resizeProxy);
        }

        fly.destroy(that.$element.children());
        element.removeData();

        if (options.appendTo[0] === document.body) {
            parent = element.parent(".animation-container");

            if (parent[0]) {
                parent.remove();
            } else {
                element.remove();
            }
        }
    },

    open: function(x, y) {
        var that = this,
            fixed = {
                isFixed: !isNaN(parseInt(y, 10)),
                x: x,
                y: y
            },
            element = that.$element,
            options = that.options,
            direction = "down",
            animation, wrapper,
            anchor = $(options.anchor);

        if (!that.visible()) {
            // if (options.copyAnchorStyles) {
            //     element.css(fly.getComputedStyles(anchor[0], styles));
            // }

            if (element.data("animating") || that._trigger(OPEN)) {
                return;
            }

            that._activated = false;

            if (!options.modal) {
                $html.unbind(that.downEvent, that._mousedownProxy)
                    .bind(that.downEvent, that._mousedownProxy);

                that._scrollableParents()
                    .unbind(SCROLL, that._resizeProxy)
                    .bind(SCROLL, that._resizeProxy);
                $win.unbind(RESIZE_SCROLL, that._resizeProxy)
                    .bind(RESIZE_SCROLL, that._resizeProxy);
            }

            that.wrapper = wrapper = wrap(element, options.autosize)
                .css({
                    overflow: HIDDEN,
                    display: "block",
                    position: ABSOLUTE
                });

            wrapper.css(POSITION);

            if ($(options.appendTo)[0] == document.body) {
                wrapper.css(TOP, "-10000px");
            }

            animation = extend(true, {}, options.animation.open);
            that.flipped = that._position(fixed);

            direction = animation.effects.slideIn ? animation.effects.slideIn.direction :
                direction;

            if (options.anchor != BODY) {
                var dirClass = ACTIVEBORDER + "-" + direction;

                element.addClass(ACTIVEBORDER + "-" + directions[direction].reverse);

                anchor
                    .addClass(dirClass)
                    .children(ACTIVECHILDREN)
                    .addClass(ACTIVE)
                    .addClass(dirClass);
            }

            element.data(EFFECTS, animation.effects).stop(true).flyAnimate(animation);
        }
    },

    toggle: function() {
        var that = this;

        that[that.visible() ? CLOSE : OPEN]();
    },

    visible: function() {
        return this.$element.is(":" + VISIBLE);
    },

    close: function(skipEffects) {
        var that = this,
            options = that.options,
            wrap,
            animation, openEffects, closeEffects;

        if (that.visible()) {
            wrap = (that.wrapper[0] ? that.wrapper : wrap(that.$element).hide());

            if (that._closing || that._trigger(CLOSE)) {
                return;
            }

            // Close all inclusive popups.
            that.$element.find(".popup").each(function() {
                var that = $(this),
                    popup = that.data("flyPopup");

                if (popup) {
                    popup.close(skipEffects);
                }
            });

            $html.unbind(that.downEvent, that._mousedownProxy);
            that._scrollableParents().unbind(SCROLL, that._resizeProxy);
            $win.unbind(RESIZE_SCROLL, that._resizeProxy);

            if (skipEffects) {
                animation = {
                    hide: true,
                    effects: {}
                };
            } else {
                animation = extend(true, {}, options.animation.close);
                openEffects = that.$element.data(EFFECTS);
                closeEffects = animation.effects;

                if (!closeEffects && !$.isEmptyObject(closeEffects) && openEffects && $
                    .isEmptyObject(
                        openEffects)) {
                    animation.effects = openEffects;
                    animation.reverse = true;
                }

                that._closing = true;
            }

            that.$element.stop();
            wrap.css({
                overflow: HIDDEN
            });
            that.$element.flyAnimate(animation);
        }
    },

    _trigger: function(ev) {
        return this.trigger(ev, {
            type: ev
        });
    },

    _resize: function(e) {
        var that = this;

        if (e.type === "resize") {
            clearTimeout(that._resizeTimeout);
            that._resizeTimeout = setTimeout(function() {
                that._position();
                that._resizeTimeout = null;
            }, 50);
        } else {
            if (!that._hovered || (that._activated && that.$element.hasClass(
                    "list-container"))) {
                that.close();
            }
        }
    },

    _mousedown: function(e) {
        var that = this,
            container = that.$element,
            options = that.options,
            anchor = $(options.anchor)[0],
            toggleTarget = options.toggleTarget,
            target = e.target,
            popup = $(target).closest(".popup");

        e.stopPropagation();
        popup = popup[0];
        if (popup && popup !== container) {
            return false;
        }

        // This MAY result in popup not closing in certain cases.
        if ($(e.target).closest("a").data("rel") === "popover") {
            return false;
        }

        if (!contains(container, target) && !contains(anchor, target) && !(toggleTarget &&
                contains($(toggleTarget)[0], target))) {
            that.close();
        }
    },

    _fit: function(position, size, viewPortSize) {
        var output = 0;

        if (position + size > viewPortSize) {
            output = viewPortSize - (position + size);
        }

        if (position < 0) {
            output = -position;
        }

        return output;
    },

    _flip: function(offset, size, anchorSize, viewPortSize, origin, position, boxSize) {
        var output = 0;
        boxSize = boxSize || size;

        if (position !== origin && position !== CENTER && origin !== CENTER) {
            if (offset + boxSize > viewPortSize) {
                output += -(anchorSize + size);
            }

            if (offset + output < 0) {
                output += anchorSize + size;
            }
        }
        return output;
    },

    _scrollableParents: function() {
        return $(this.options.anchor)
            .parentsUntil("body")
            .filter(function(index, element) {
                return fly.isScrollable(element);
            });
    },

    _position: function(fixed) {
        var that = this,
            element = that.$element.css(POSITION, ""),
            wrapper = that.wrapper,
            options = that.options,
            viewport = $(options.viewport),
            viewportOffset = viewport.offset(),
            anchor = $(options.anchor),
            origins = options.origin.toLowerCase().split(" "),
            positions = options.position.toLowerCase().split(" "),
            collisions = that.collisions,
            siblingContainer, parents,
            parentZIndex, zIndex = 10002,
            isWindow = !!((viewport[0] == window) && window.innerWidth),
            idx = 0,
            length, viewportWidth, viewportHeight;

        // $(window).height() uses documentElement to get the height
        viewportWidth = isWindow ? window.innerWidth : viewport.width();
        viewportHeight = isWindow ? window.innerHeight : viewport.height();

        if (isWindow && document.documentElement.offsetWidth - document.documentElement
            .clientWidth > 0) {
            viewportWidth -= fly.support.scrollbar();
        }

        siblingContainer = anchor.parents().filter(wrapper.siblings());

        if (siblingContainer[0]) {
            parentZIndex = Math.max(Number(siblingContainer.css("zIndex")), 0);

            // set z-index to be more than that of the container/sibling
            // compensate with more units for window z-stack
            if (parentZIndex) {
                zIndex = parentZIndex + 10;
            } else {
                parents = anchor.parentsUntil(siblingContainer);
                for (length = parents.length; idx < length; idx++) {
                    parentZIndex = Number($(parents[idx]).css("zIndex"));
                    if (parentZIndex && zIndex < parentZIndex) {
                        zIndex = parentZIndex + 10;
                    }
                }
            }
        }

        wrapper.css("zIndex", zIndex);

        if (fixed && fixed.isFixed) {
            wrapper.css({
                left: fixed.x,
                top: fixed.y
            });
        } else {
            wrapper.css(that._align(origins, positions));
        }

        var pos = wrapper.position(),
            offset = wrapper.offset(),
            anchorParent = anchor.offsetParent().parent(
                ".animation-container,.popup"); // If the parent is positioned, get the current positions

        if (anchorParent.length) {
            pos = wrapper[POSITION]();
            offset = wrapper.offset();
        }

        if (viewport[0] === window) {
            offset.top -= (window.pageYOffset || document.documentElement.scrollTop ||
                0);
            offset.left -= (window.pageXOffset || document.documentElement.scrollLeft ||
                0);
        } else {
            offset.top -= viewportOffset.top;
            offset.left -= viewportOffset.left;
        }

        // Needed to reset the popup location after every closure - fixes the resize bugs.
        if (!that.wrapper.data(LOCATION)) {
            wrapper.data(LOCATION, extend({}, pos));
        }

        var offsets = extend({}, offset),
            location = extend({}, pos),
            adjustSize = options.adjustSize;

        if (collisions[0] === "fit") {
            location.top += that._fit(offsets.top, wrapper.outerHeight() + adjustSize.height,
                viewportHeight);
        }

        if (collisions[1] === "fit") {
            location.left += that._fit(offsets.left, wrapper.outerWidth() + adjustSize.width,
                viewportWidth);
        }

        var flipPos = extend({}, location);

        if (collisions[0] === "flip") {
            location.top += that._flip(offsets.top, element.outerHeight(), anchor.outerHeight(),
                viewportHeight, origins[0], positions[0], wrapper.outerHeight()
            );
        }

        if (collisions[1] === "flip") {
            location.left += that._flip(offsets.left, element.outerWidth(), anchor.outerWidth(),
                viewportWidth, origins[1], positions[1], wrapper.outerWidth()
            );
        }

        element.css(POSITION, ABSOLUTE);
        wrapper.css(location);

        return (location.left != flipPos.left || location.top != flipPos.top);
    },

    _align: function(origin, position) {
        var that = this,
            element = that.wrapper,
            anchor = $(that.options.anchor),
            verticalOrigin = origin[0],
            horizontalOrigin = origin[1],
            verticalPosition = position[0],
            horizontalPosition = position[1],
            anchorOffset = anchor.offset(),
            appendTo = $(that.options.appendTo),
            appendToOffset,
            width = element.outerWidth(),
            height = element.outerHeight(),
            anchorWidth = anchor.outerWidth(),
            anchorHeight = anchor.outerHeight(),
            top = anchorOffset.top,
            left = anchorOffset.left,
            round = Math.round;

        if (appendTo[0] != document.body) {
            appendToOffset = appendTo.offset();
            top -= appendToOffset.top;
            left -= appendToOffset.left;
        }


        if (verticalOrigin === BOTTOM) {
            top += anchorHeight;
        }

        if (verticalOrigin === CENTER) {
            top += round(anchorHeight / 2);
        }

        if (verticalPosition === BOTTOM) {
            top -= height;
        }

        if (verticalPosition === CENTER) {
            top -= round(height / 2);
        }

        if (horizontalOrigin === RIGHT) {
            left += anchorWidth;
        }

        if (horizontalOrigin === CENTER) {
            left += round(anchorWidth / 2);
        }

        if (horizontalPosition === RIGHT) {
            left -= width;
        }

        if (horizontalPosition === CENTER) {
            left -= round(width / 2);
        }

        return {
            top: top,
            left: left
        };
    }
});

fly.component(Popup);
module.exports = Popup;
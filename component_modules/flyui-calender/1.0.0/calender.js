/**
 * 日历组件
 * @author: huanzhang
 * @email: huanzhang@iflytek.com
 * @update: 2015-09-28
 */

'use strict';

var $ = require('jquery');
var fly = require('fly');

// 依赖模块
var NAME = 'Calender',
    CLICK = 'click.' + NAME,
    ACTIVE = 'active',
    STRING = 'string',
    DISABLED = 'disabled',
    each = $.each,
    proxy = $.proxy,
    objectToString = {}.toString;

var months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    days = ['日', '一', '二', '三', '四', '五', '六'],
    modes = ['days', 'years', 'months', 'times'],
    modeTime = {
        'days': 86400000,
        'hours': 3600000,
        'minutes': 60000,
        'seconds': 1000
    },
    modeMapping = {
        'years': '年',
        'months': '月',
        'times': '时间'
    };

var hourReg = /H+/,
    dateReg = /^\d/;

var defaults = fly.ui.defaults[NAME] = {
    format: 'yyyy-MM-dd',
    minDate: -Infinity,
    maxDate: Infinity,
    weekStart: 0
};

var isLeapYear = function (year) {
    return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
};

var getDaysInMonth = function (year, month) {
    return [31, (isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
};

var toUpperCase = function (str) {
    return str.replace(/^[a-z]/, function (m) {
        return m.toUpperCase();
    });
};

var headerTemplate = fly.template(__inline('header.tpl'));

var bodyTemplate = fly.template(__inline('body.tpl'));

var footerTemplate = fly.template(__inline('footer.tpl'));

var Calender = module.exports = fly.Component.extend({

    name: NAME,

    options: defaults,

    template: fly.template('<div class="calender"></div>'),

    ctor: function (element, options) {
        var that = this,
            date = new Date(),
            level = 0,
            format;
        if (!element) return;
        // 处理一下每周开始日期  by pang.ziqin 
        var daystr = days.join('').substring(options.weekStart || 0, 7) + days.join('').substring(0, options.weekStart || 0) ;
            days = daystr.split('');

        that._super(element, options);
        options = that.options;
        format = that.options.format;

        if (options.value) {
            date = fly.formatDate(options.value);
        }

        if (format.indexOf('y') > -1) level = 1;
        if (format.indexOf('M') > -1) level = 2;
        if (format.indexOf('d') > -1) level = 3;
        if (format.indexOf('H') > -1) level = 4;
        if (format.indexOf('m') > -1) level = 5;
        if (format.indexOf('s') > -1) level = 6;
        that.level = level;

        that.date = date;
        that.viewDate = new Date(date);
        that.now = fly.now();
        that.selectDate = '';

        // 判断是否渲染年月日
        that.onlyTimes = !/(y+)|(M+)|(d+)/.test(format);
        that._wrapper();

        if (that.onlyTimes) {
            that._fillTimes();
            that.times.show();
        } else {
            that._fillDays();
            that.days.show();
        }
    },

    events: [
        'ok',
        'clear'
    ],

    _wrapper: function () {
        var that = this,
            mode;

        that.wrapper = that.$element;
        mode = that.onlyTimes ? ['times']: modes;

        each(mode, function (i, item) {
            that[item] = $('<div class="calender-' + item + '" />').appendTo(
                that.wrapper).hide();
            that._createHeader(item).appendTo(that[item]);
            that._createBody(item).appendTo(that[item]);
            that._createFooter(item).appendTo(that[item]);
        });
    },

    _min: function () {
        var minDate = this.options.minDate,
            min = -Infinity;

        if (this.__min) {
            return this.__min;
        }

        if (objectToString.call(minDate) === '[object Date]') {
            min = minDate.getTime();
        } else if (typeof minDate === STRING) {
            if (minDate.indexOf('||') > 0) {
                min = this._sort(minDate.split('||'));
            } else if (minDate.indexOf('&&') > 0) {
                min = this._sort(minDate.split('&&'), true);
            } else {
                min = this._sort([minDate]);
            }
        }
        this.__min = min;
        return min;
    },

    _max: function () {
        var maxDate = this.options.maxDate,
            max = Infinity;

        if (this.__max) {
            return this.__max;
        }

        if (objectToString.call(maxDate) === '[object Date]') {
            max = maxDate.getTime();
        } else if (typeof maxDate === STRING) {
            if (maxDate.indexOf('||') > 0) {
                max = this._sort(maxDate.split('||'), true);
            } else if (maxDate.indexOf('&&') > 0) {
                max = this._sort(maxDate.split('&&'));
            } else {
                max = this._sort([maxDate]);
            }
        }
        this.__max = max;
        return max;
    },

    _sort: function (dates, desc) {
        var that = this, newdates = [], newdate, dateWidget;
        each(dates, function (i, item) {
            item = $.trim(item);
            if (!item ) {
                return true;
            };
            newdate = fly.formatDate(item);
            dateWidget = document.getElementById(item);
            if (item === '$now') {
                newdates.push(that.now);
            } else if (newdate.getTime && newdate.getTime()) {
                newdates.push(newdate.getTime());
            } else if (dateWidget) {
                dateWidget = dateWidget.flyCalender || dateWidget.flyDatePicker || dateWidget.handler;
                if (dateWidget) {
                    newdate = fly.formatDate(dateWidget.value());
                    newdate && newdates.push(newdate.getTime());
                }
            }
        });
        newdates.sort();
        return newdates[desc ? newdates.length - 1 : 0]
    },

    _date: function () {
        this.date = this.date || new Date();
        return this.date;
    },

    _createHeader: function (mode) {
        var that = this,
            date = that.date,
            header;

        header = $(headerTemplate({
            name: modeMapping[mode],
            menu: (mode == 'days') ? true : false,
            time: (mode == 'days' && that.level > 3) ? that._getTime() : false
        }));

        if (mode == 'days') {
            header.on(CLICK, '.next', proxy(that._nextMonth, that))
                .on(CLICK, '.prev', proxy(that._prevMonth, that))
                .on(CLICK, '.year', proxy(that._switch, that, 'years'))
                .on(CLICK, '.month', proxy(that._switch, that, 'months'))
                .on(CLICK, '.time', proxy(that._switch, that, 'times'));
        }
        return header;
    },

    _createBody: function (mode) {
        var that = this,
            body = $(bodyTemplate({
                mode: mode,
                days: days,
                level: that.level
            })),
            itemName = mode.substring(0, mode.length - 1);
        if (mode == 'times') {
            body.find('.dow').css('paddingRight', fly.support.scrollbar());
            body.on(CLICK, 'li', proxy(that._selectTime, that));
        } else {
            body.on(CLICK, 'td.' + itemName + ':not(.disabled)', proxy(
                that['_select' + toUpperCase(itemName)], that));
            if (mode == 'years') {
                body.on(CLICK, '.next span', proxy(that._nextYears, that))
                    .on(CLICK, '.prev span', proxy(that._prevYears, that));
            }
        }
        return body;
    },

    _createFooter: function (mode) {
        var that = this,
            date = that.date,
            now = '今天',
            ok = false,
            clear = false,
            _now = toUpperCase(mode.substring(0, mode.length - 1)),
            footer;
        if (mode == 'years') {
            now = '今年';
        } else if (mode == 'months') {
            now = '本月';
        } else if (mode == 'times') {
            now = '此刻';
            ok = '选择';
        } else {
            if (that.level > 3) now = '此刻';
            ok = '确定';
            clear = '清除';
        }

        footer = $(footerTemplate({
            now: now,
            ok: ok,
            clear: clear
        })).on(CLICK, '.now', proxy(that['_now' + _now], that));

        if (mode == 'times') {
            footer.on(CLICK, '.ok', proxy(that._okTime, that));
        } else if (mode == 'days') {
            footer.on(CLICK, '.ok', proxy(that._ok, that))
                .on(CLICK, '.cancel', proxy(that._clear, that));
        }

        return footer;
    },

    _fillDays: function () {
        var that = this,
            date = that.date,
            options = that.options,
            viewDate = that.viewDate,
            viewYear = viewDate.getFullYear(),
            viewMonth = viewDate.getMonth(),
            currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            prevMonth = new Date(viewYear, viewMonth - 1, 28),
            day = getDaysInMonth(prevMonth.getFullYear(), prevMonth.getMonth()),
            nextMonth,
            rows = [],
            row,
            clsName;

        that.__min = null;
        that.__max = null;

        that.days.find('.year').text(viewYear + '年');
        that.days.find('.month').text((viewMonth + 1) + '月');

        prevMonth.setDate(day);
        prevMonth.setDate(day - (prevMonth.getDay() - options.weekStart + 7) % 7);
        nextMonth = new Date(prevMonth.valueOf());
        nextMonth.setDate(nextMonth.getDate() + 42);
        nextMonth = nextMonth.valueOf();

        while (prevMonth.valueOf() < nextMonth) {
            if (prevMonth.getDay() === options.weekStart) {
                row = $('<tr>');
                rows.push(row);
            }
            clsName = '';
            if (prevMonth.getFullYear() < viewYear ||
                (prevMonth.getFullYear() == viewYear &&
                    prevMonth.getMonth() < viewMonth)) {
                clsName += ' old';
            } else if (prevMonth.getFullYear() > viewYear ||
                (prevMonth.getFullYear() == viewYear &&
                    prevMonth.getMonth() > viewMonth)) {
                clsName += ' new';
            }
            if (prevMonth.valueOf() === currentDate.valueOf()) {
                clsName += ' ' + ACTIVE;
            }
            if ((prevMonth.valueOf() + modeTime.days) <= that._min()) {
                clsName += ' ' + DISABLED;
            }
            if (prevMonth.valueOf() >= that._max()) {
                clsName += ' ' + DISABLED;
            }
            row.append('<td class="day' + clsName + '"><span>' + prevMonth.getDate() +
                '</span></td>');
            prevMonth.setDate(prevMonth.getDate() + 1);
        }
        that.days.find('tbody').empty().append(rows);
    },

    _fillYears: function () {
        var date = this.date,
            year = date.getFullYear(),
            viewDate = this.viewDate,
            viewYear = viewDate.getFullYear(),
            displayNumber = 10,
            html = '',
            i = 0;

        // 修复日期整除的时候  年份少了10年的问题 by pan.ziqin
        var isDivided = viewYear % 10;
        viewYear = parseInt(!isDivided ? (viewYear - 1)/ displayNumber  :  (viewYear / displayNumber) , 10) * displayNumber;
        for (; i < displayNumber + 2; i++) {
            if (i % 3 == 0) html += '<tr>';
            if (i == 0) {
                html += '<td class="prev" unselectable="on">' +
                    '<span><i class="icon icon-left"></i> 往前</span></td>';
            } else if (i == displayNumber + 1) {
                html += '<td class="next" unselectable="on">' +
                    '<span>往后 <i class="icon icon-right"></i></span></td>';
            } else {
                viewYear++;
                html += '<td class="year' + (year === viewYear ? (' ' + ACTIVE) : '') + '">' +
                    '<span>' + viewYear + '</span></td>'
            }
            if ((i + 1) % 3 == 0) html += '</tr>';
        }
        this.years.find('tbody').empty().append(html);
    },

    _fillMonths: function () {
        var viewMonth = this.viewDate.getMonth(),
            rows = [],
            row,
            l = months.length,
            i = 0;
        for (; i < l; i++) {
            if (i % 3 == 0) {
                row = $('<tr>');
                rows.push(row);
            }
            row.append('<td data-month="' + i + '" class="month' + (i === viewMonth ? (
                ' ' + ACTIVE) : '') + '"><span>' +
                months[i] + '</span></td>');
        }
        this.months.find('tbody').empty().append(rows);
    },

    _getTime: function () {
        var date = this.date,
            format = this.options.format,
            time = '';
        if (format.indexOf('HH') > -1) time += this._parseTime(date.getHours());
        if (format.indexOf('mm') > -1) time += ':' + this._parseTime(date.getMinutes());
        if (format.indexOf('ss') > -1) time += ':' + this._parseTime(date.getSeconds());
        return time;
    },

    _parseTime: function (t) {
        return (t < 10 ? '0' : '') + t;
    },

    _fillTime: function () {
        this.days && this.days.find('.time').text(this._getTime());
    },

    _fillTimes: function () {
        var that = this,
            html = '<tr>';
        if (that.level >= 4) {
            html += that._createTimes('hours');
        }
        if (that.level >= 5) {
            html += that._createTimes('minutes');
        }
        if (that.level >= 6) {
            html += that._createTimes('seconds');
        }
        html += '</tr>';
        that.times.find('tbody').empty().append(html);
        that._scrollToNowTime();
    },

    _scrollToNowTime: function () {
        this.times.find('ul').each(function (i, item) {
            $(item).scrollTop($(item).find('.active').position().top);
        });
    },

    _createTimes: function (mode) {
        var that = this,
            viewDate = this.viewDate,
            item = mode.substring(0, mode.length - 1),
            targetTime = new Date(viewDate),
            total = 60,
            viewTime,
            isActive,
            isDisabled,
            html = '<td class="time"><ul>',
            i = 0;

        that.__min = null;
        that.__max = null;
        viewTime = viewDate['get' + toUpperCase(mode)]();

        if (mode == 'hours') {
            targetTime.setMinutes(0);
            targetTime.setSeconds(0);
            targetTime.setMilliseconds(0);
            total = 24;
        } else if (mode == 'minutes') {
            targetTime.setSeconds(0);
            targetTime.setMilliseconds(0);
        }

        for (; i < total; i++) {
            targetTime['set' + toUpperCase(mode)](i);
            isActive = i === viewTime ? (' ' + ACTIVE) : '';
            isDisabled = ((targetTime.valueOf() + modeTime[mode]) <= that._min() || targetTime.valueOf() > that._max()) ? (' ' + DISABLED) : '';
            html += '<li class="' + item + isActive + isDisabled + '">' +
                this._parseTime(i) +
                '</li>';
        }

        html += '</ul></td>';
        return html;
    },

    _nextMonth: function () {
        var month = this.viewDate.getMonth() + 1,
            newDate = new Date(this.viewDate);
        newDate.setMonth(month);
        if (newDate.getMonth() != month) {
            this.viewDate.setDate(1);
            this.date.setDate(1);
        }
        this.viewDate.setMonth(month);
        this.date.setMonth(month);
        this._fillDays();
    },

    _prevMonth: function () {
        var month = this.viewDate.getMonth() - 1;
        this.viewDate.setMonth(month);
        this.date.setMonth(month);
        this._fillDays();
    },

    _nextYears: function () {
        // 修复日期整除的时候  年份少了10年的问题 by pan.ziqin
        var _oldYear = this.viewDate.getFullYear();
        _oldYear = _oldYear % 10 == 0 ? (_oldYear - 1) : _oldYear;
        this.viewDate.setFullYear(Math.floor(_oldYear/10) * 10 + 11);
        this._fillYears();
    },

    _prevYears: function () {
        // 修复日期整除的时候  年份少了10年的问题 by pan.ziqin
        var _oldYear = this.viewDate.getFullYear();
        _oldYear = _oldYear % 10 == 0 ? (_oldYear - 1) : _oldYear;
        this.viewDate.setFullYear(Math.floor(_oldYear/10) * 10 - 9);
        this._fillYears();
    },

    _switch: function (mode) {
        var that = this,
            modz;

        modz = that.onlyTimes ? ['times']: modes;
        each(modz, function (i, item) {
            if (mode == item) {
                that[item].show();
                that['_fill' + toUpperCase(item)]();
            } else {
                that[item].hide();
            }
        });
    },

    _selectDay: function (e) {
        var that = this, $day, day;

        if (typeof e == 'number') {
            day = e;
        } else {
            $day = $(e.target);
            if (!$day.is('td')) $day = $day.parent();
            day = parseInt($day.text());
            $day.addClass(ACTIVE);
            that.days.find('.' + ACTIVE).not($day).removeClass(ACTIVE);
            if ($day.hasClass('old')) {
                this._prevMonth();
            } else if ($day.hasClass('new')) {
                this._nextMonth();
            }
        }

        this.viewDate.setDate(day);
        this.date.setDate(day);
        if (this.level <= 3) this._ok(e);
    },

    _selectYear: function (e) {
        var that = this, $year, year;

        if (typeof e == 'number') {
            year = e;
        } else {
            $year = $(e.target);
            if (!$year.is('td')) $year = $year.parent();
            year = parseInt($year.text());
            $year.addClass(ACTIVE);
            that.years.find('.' + ACTIVE).not($year).removeClass(ACTIVE);
        }

        that.viewDate.setFullYear(year);
        that.date.setFullYear(year);
        if (that.level <= 1) that._ok(e);
        else that._switch('months');
    },

    _selectMonth: function (e) {
        var that = this, $month, month;

        if (typeof e == 'number') {
            month = e;
        } else {
            $month = $(e.target);
            if (!$month.is('td')) $month = $month.parent();
            $month.addClass(ACTIVE);
            month = $month.data('month')
            that.months.find('.' + ACTIVE).not($month).removeClass(ACTIVE);
        }

        that.viewDate.setMonth(month);
        that.date.setMonth(month);
        if (that.level <= 2) that._ok(e);
        else that._switch('days');
    },

    _selectTime: function (e) {
        var $time = $(e.target),
            time = parseInt($time.text()),
            type = 'hours';
        if ($time.hasClass('minute')) type = 'minutes';
        if ($time.hasClass('second')) type = 'seconds';
        $time.addClass(ACTIVE).siblings().removeClass(ACTIVE);
        this.viewDate['set' + toUpperCase(type)](time);
        this.date['set' + toUpperCase(type)](time);
        this._fillTime();
    },

    _okTime: function (e) {
        // 时分秒
        if (this.onlyTimes) {
            var time = this._getTime();
            this.selectDate = time;
            this.trigger('ok', {
                event: e,
                date: this.date,
                result: time
            });
        } else {
            this._switch('days');
        }
    },

    // 根据时分创建日期对象，默认使用系统当前的年月日
    _createDateFromHour: function(value) {
        var match = value.split(':'),
            date = new Date();

        date.setHours(parseInt(match[0], 10));
        date.setMinutes(parseInt(match[1], 10));
        return date;
    },

    // 从字符中解析数字创建日期
    _createDateFromString: function(value) {
        var args = value.match(/[1-9][0-9]*/g),
            date = new Date(),
            l;

        if (!args.length) {
            return date;
        }
        // 判断首个是否是年，不是，自动补全系统时间
        if (args[0].length !== 4) {
            args.unshift(date.getDate());
            args.unshift(date.getMonth());
            args.unshift(date.getFullYear());
        }

        switch(args.length) {
            case 1: return String(args[0]).length === 4 ? new Date(args[0], 1, 1) : new Date(args[0]);
            case 2: return new Date(args[0], args[1] - 1, 1);  // 只指定年月，默认补全天为1
            case 3: return new Date(args[0], args[1] - 1, args[2]);
            case 4: return new Date(args[0], args[1] - 1, args[2], args[3], 0, 0, 0);
            case 5: return new Date(args[0], args[1] - 1, args[2], args[3], args[4], 0, 0);
            case 6: return new Date(args[0], args[1] - 1, args[2], args[3], args[4], args[5], 0);
            case 7: return new Date(args[0], args[1] - 1, args[2], args[3], args[4], args[5], args[6]);
            default: return date;
        }
    },
    value: function (value) {
        if (value === undefined) {
            return this.selectDate;
        }

        if (this.onlyTimes) {
            this.date = value ? this._createDateFromHour(value) : new Date();
            this.viewDate = value ? this._createDateFromHour(value) : new Date();
            this.selectDate = value;
            this._switch('times');
        } else {
            this.date = value ? this._createDateFromString(value) : new Date();
            this.viewDate = value ? this._createDateFromString(value) : new Date();
            this.selectDate = value;
            this._switch('days');
            this._fillDays();
            this._fillTime();
        }
        value && this._ok();
    },

    /*
     * new Date(year, month[, day[, hour[, minutes[, seconds[, milliseconds]]]]]);
     * 如果提供了至少两个参数，其余的参数均会默认设置为1（如果没有提供day参数）或者0。
     */
    _formatDate: function(date, format) {
        var maps = {
                'y+': date.getFullYear(),
                'M+': date.getMonth(),
                'd+': date.getDate(),
                'H+': date.getHours(),
                'm+': date.getMinutes(),
                's+': date.getSeconds(),
            },
            match = format.match(/(y+)|(M+)|(d+)|(H+)|(m+)|(s+)/g),
            l,
            args = [];

        // 判断首个是否是年，若不是，默认补全年月日
        if (!/(y+)/.test(match[0])) {
            match.unshift('dd');
            match.unshift('MM');
            match.unshift('yy');
        }
        l = match.length;
        for (var i = 0; i < l; i++) {
            args.push(maps[match[i].substring(0, 1) + '+']);
        }
        
        switch(l) {
            case 1: return String(args[0]).length === 4 ? new Date(args[0], 1, 1) : new Date(args[0]);
            case 2: return new Date(args[0], args[1], 1);  // 只指定年月，默认补全天为1
            case 3: return new Date(args[0], args[1], args[2]);
            case 4: return new Date(args[0], args[1], args[2], args[3], 0, 0, 0);
            case 5: return new Date(args[0], args[1], args[2], args[3], args[4], 0, 0);
            case 6: return new Date(args[0], args[1], args[2], args[3], args[4], args[5], 0);
            case 7: return new Date(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
            default:
                return new Date();
        }
    },

    _ok: function (e) {
        var options = this.options,
            newFormat = options.format.replace(/-/g, '/'),
            // newDate = new Date(fly.formatDate(this.date, newFormat)),
            // minDate = new Date(fly.formatDate(new Date(this._min()), newFormat)),
            // maxDate = new Date(fly.formatDate(new Date(this._max()), newFormat));
            newDate = this._formatDate(this.date, newFormat),
            minDate = this._formatDate(new Date(this._min()), newFormat),
            maxDate = this._formatDate(new Date(this._max()), newFormat);
        if (newDate.getTime() < minDate.getTime() || newDate.getTime() > maxDate.getTime()) {
            return false;
        }
        this.selectDate = fly.formatDate(newDate, options.format);
        this.trigger('ok', {
            event: e,
            date: newDate,
            result: this.selectDate
        });
    },

    _clear: function (e) {
        this.selectDate = '';
        this.trigger('clear', {
            event: e
        });
    },

    _nowDay: function (e) {
        this.date = new Date();
        this.viewDate = new Date();
        this._ok(e);
    },

    _nowYear: function (e) {
        this._selectYear(new Date().getFullYear());
    },

    _nowMonth: function (e) {
        this._selectMonth(new Date().getMonth());
    },

    _nowTime: function (e) {
        var date = new Date();
        this.viewDate.setHours(date.getHours());
        this.viewDate.setMinutes(date.getMinutes());
        this.viewDate.setSeconds(date.getSeconds());
        this.date.setHours(date.getHours());
        this.date.setMinutes(date.getMinutes());
        this.date.setSeconds(date.getSeconds());
        this._fillTime();
        if (this.onlyTimes) {
            this._switch('times');
        } else {
            this._switch('days');
        }
    },

    destroy: function () {
        this._super();
    }

});

fly.component(Calender);

'use strict';

var express = require('express'),
    meta = require('../package.json'),
    router = express.Router(),
    path = '/public/' + meta.name + '/' + meta.version + '/';
    
/**
 * 首页
 */
router.get('/', function (req, res, next) {
    req.url = path + 'index.html';
    next();
});

/**
 * 一般页面
 */
router.get('/:path', function (req, res, next) {
    req.url = path + req.params.path + '.html';
    next();
});

/**
 * 数据模拟
 */
router.get('/mock/:path', function (req, res, next) {
    req.url = '/' + path + 'mock/' + req.params.path + '.json';
    next();
});

module.exports = router;
'use strict';

var http = require('http');

// 记录日志
var log = function () {
  var now = new Date().toISOString();
  arguments[0] = '[' + now + '] ' + arguments[0];
  console.log.apply(console, arguments);
};

// 获取请求的headers，去掉host和connection
var getHeader = function (req) {
  var ret = {};
  for (var i in req.headers) {
    if (!/host|connection/i.test(i)) {
      ret[i] = req.headers[i];
    }
  }
  return ret;
};

// 获取请求的路径
var getPath = function (req) {
  var url = req.url;
  if (url.substr(0, 7).toLowerCase() === 'http://') {
    var i = url.indexOf('/', 7);
    if (i !== -1) {
      url = url.substr(i);
    }
  }
  return url;
};

// 代理请求
var counter = 0;
var onProxy = function (req, res) {
  counter++;
  var num = counter;
  var opt = {
    host: req.headers.host,
    path: getPath(req),
    method: req.method,
    headers: getHeader(req)
  };

  log('#%d\t%s http://%s%s', num, req.method, opt.host, opt.path);

  var req2 = http.request(opt, function (res2) {
    res.writeHead(res2.statusCode, res2.headers);
    res2.pipe(res);
    res2.on('end', function () {
      log('#%d\tEND', num);
    });
  });

  if (/POST|PUT/i.test(req.method)) {
    req.pipe(req2);
  } else {
    req2.end();
  }
  
  req2.on('error', function (err) {
    log('#%d\tERROR: %s', num, err.stack);
    res.end(err.stack);
  });
};
'use strict';

const assert = require('assert');
const debug = require('debug')('koa-grace:vhost');
const compose = require('koa-compose');

function graceVhost(host, app) {
  assert.ok(!!host, 'at least need a vhost');

  let vhosts = [];

  // {
  //     host: 'www.example.com',
  //     app: koaapp
  // }
  if (host.host && host.app) {
    host = host.host;
    app = host.app;
  }

  // 'www.example.com', koaapp
  if (checkParams(host, app)) {
    vhosts.push({
      host: host,
      app: app
    });
  } else if (checkHost(host)) {
    vhosts = host;
  }

  if (!vhosts.length) throw new Error('vhost error');

  // compose the app's middleware to one middleware
  vhosts.forEach(function(vhost) {
    debug('register vhost: %s', vhost.host);
    vhost.middleware = compose(vhost.app.middleware);
  });

  // 用以缓存vhost记录
  let hostCache = {};
  return function* vhost(next) {
    // 当前的hostname,不含端口号
    let host = this.hostname;
    // 限制只取第一层级的PATH
    let path = this.path.split('/')[1] || '';

    // 获取当前的hostpath
    let hostPath = host + '/' + path;
    let vhost = hostCache[hostPath];

    if (!vhost) {
      // 设置匹配缓存
      let mapCache;

      vhosts.some((item) => {
        let isSubpath = ~item.host.indexOf('/');

        if (isSubpath && item.host === hostPath) {
          // 如果当前item.host配置是子目录模式，且等于hostPath，则不再往下查找，return true
          mapCache = item;
          return true;
        } else if (!isSubpath && item.host === host) {
          // 如果当前item.host配置不是子目录模式，且等于host，则继续查找更适合的条件，return false
          mapCache = item;
          return false;
        } else {
          return false;
        }
      });

      if (mapCache) {
        vhost = hostCache[hostPath] = mapCache;
        debug('matched host: %s', mapCache.host);
      }
    }

    if (!vhost) {
      debug('there is no host match to ' + this.request.headers.host + this.request.url);
      this.body = 'error: there is no host matched!';

      return yield * next;
    }

    // merge vhost.app.context to current context
    Object.assign(this, vhost.app.context);

    if (vhost) return yield * vhost.middleware.call(this, next);

    yield * next;
  }
};

function isRegExp(obj) {
  return obj.constructor && obj.constructor.name === 'RegExp';
};

function checkParams(host, app) {
  return (typeof host === 'string' || isRegExp(host)) && app && app.middleware && Array.isArray(app.middleware);
};

function checkHost(host) {

  if (!Array.isArray(host)) {
    return false;
  }

  return host.every(function(vhost) {

    let ret = !!vhost && checkParams(vhost.host, vhost.app);

    debug('vhost: %s check %s', vhost.host, ret ? 'success' : 'failed');

    return ret;
  });
};

module.exports = graceVhost;

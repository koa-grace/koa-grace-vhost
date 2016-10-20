'use strict';

const koa = require('koa');
const Router = require('koa-router');
const vhost = require('../index');

let app = koa();

let vhosts = ['127.0.0.1', 'localhost','localhost/test','127.0.0.1/test'];

vhosts = vhosts.map(function(item) {
  try {
    let vapp = koa();

    let API = new Router();
    API.get('/', function*() {
      this.body = 'hello';
    });
    API.get('/test', function*() {
      this.body = 'test';
    });
    vapp.use(API.routes());
    return {
      host: item,
      app: vapp
    };
  } catch (e) {
    console.log('vhost error %s', e.message);
    return;
  }
}).filter(function(item) {
  return !!item;
});
app.use(vhost(vhosts));

app.listen(3000, function() {
  console.log('Listening on 3000!');
});
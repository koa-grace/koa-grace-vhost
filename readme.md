## koa-grace-vhost



### Install

    $ npm install koa-grace-vhost --save

### Usage

```
router(app, options)
```
- app: {Object} koa instance.
- options: {Object|String->root}
  - root: {String} router directory

### Example

**File tree**

```
├── app.js
└── controller
    ├── deal
    │   ├── index.js
    │   └── refund.js
    ├── index.js
    └── test.js
```


**app.js**

```
var koa = require('koa');
var router = require('koa-grace-vhost');

app.use(router(app, {
  root: './example/controller'
}));

app.listen(3000);
```

### Test

    npm test

### License

MIT
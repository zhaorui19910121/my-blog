require("babel-register"); // just used for develop 

const Koa = require('koa');
const Router = require('koa-router');
const fs = require('fs');
const path = require('path');
const LRU = require('lru-cache')
const { createBundleRenderer } = require('vue-server-renderer');

const { apiRouter } = require('./router');
const { srcPath } = require('../constants');
const { setupDevServer, getClientManifest } = require('../build/setup-dev-server');

const server = new Koa();
const router = new Router();
const template = fs.readFileSync(path.resolve(srcPath, './index.template.html'), 'utf-8');


// clientManifest是webpack的VueSSRClientPlugin插件生成的vue-ssr-client-manifest.json文件，这个文件需要异步获取，当webpack打包完成后通过promise回调的方式传递回来
// clientManifest会自动将webpack打包生成的bundle注入到template当中，取代htmlwebpackplugin
// 由于clientManifest是通过回调函数异步获取，在webpack compiler编译完成后会resolve该值
async function getRender() {
  const [ clientManifest, bundle ] = await setupDevServer(server);
  const renderer = createBundleRenderer(bundle, {
    template,
    clientManifest,
    cache: LRU({ // 组件实例缓存，缓存15分钟.大多数时候不应该也不需要缓存组件实例，一般的应用场景是在v-for中重复出现的组件需要缓存一下。
      max: 10000, 
      maxAge: 1000 * 60 * 15,
    }),
  });

  return renderer;
}

const rendererPromise = getRender();
let renderer;

// 创建缓存
const microCache = LRU({
  max: 100,
  maxAge: 1000,
});

router.get('*', async ctx => {
  const { url } = ctx.request;

  // fix renderToString没有返回promise
  function render(renderer) {
    let resolve;
    const promise = new Promise(r => resolve = r);

    const html = microCache.get(url);
    if (html) {
      console.log('catch hit!')
      resolve(html);
    } else {
      const context = {
        title: 'vue ssr',
        url,
      };

      renderer.renderToString(context, (err, html) => {
        resolve(html);
        microCache.set(url, html);
      });  
    }

    return promise;
  }

  renderer = await rendererPromise;
  const res = await render(renderer); 
  ctx.status = 200;
  ctx.body = res;
});


server.use(apiRouter.routes());
server.use(router.routes());

server.listen(3000);

console.log('start-quick is starting at port 3000')
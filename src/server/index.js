const fs = require("fs");
const path = require("path");
const Router = require('koa-router')
const send = require('koa-send')
const router = new Router()

const resolve = file => path.resolve(__dirname, file);


// 第 2 步：获得一个createBundleRenderer
const { createBundleRenderer } = require("vue-server-renderer");

const bundle = require("../../dist/vue-ssr-server-bundle.json");

const clientManifest = require("../../dist/vue-ssr-client-manifest.json");

const renderer = createBundleRenderer(bundle, {
  runInNewContext: false, // bundle 代码将与服务器进程在同一个 global 上下文中运行
  template: fs.readFileSync(resolve("./index.template.html"), "utf-8"),
  clientManifest: clientManifest // 客户端构建 manifest
});

function renderToString(context) {
  return new Promise((resolve, reject) => {
    renderer.renderToString(context, (err, html) => {
      err ? reject(err) : resolve(html);
    });
  });
}

// 第 3 步：添加一个中间件来处理所有请求
const handleRequest = async (ctx, next) => {
  const url = ctx.path

  if (url.includes('.')) {
    console.log(`proxy ${url}`)
    return await send(ctx, url, {root: path.resolve(__dirname,'../dist')})
  }

  ctx.res.setHeader("Content-Type", "text/html");
  const context = {
    title: "ssr test",
    url
  };
  // 将 context 数据渲染为 HTML
  const html = await renderToString(context);
  ctx.body = html;
}
router.get('*', handleRequest)
module.exports = router
import createApp from './app';

/*
  这个文件是服务端的入口，将会给bundle renderer调用用于服务端渲染
  所以在这个函数的内部，我们将会创建vue实例，根据请求的url获取匹配的组件，并异步的获取组件所需的数据，最后返回一个vue实例的promise
  
*/
export default context => {
  let resolve;
  const promise = new Promise(r => { resolve = r; });

  const { app, router } = createApp();
  const { url } = context;
  
  // 想要导航到不同的 URL，则使用 router.push 方法。这个方法会向 history 栈添加一个新的记录
  // 设置服务器端 router 的位置
  router.push(url);
  router.onReady(() => {
    // 获取路由所匹配的组件
    const matchedComponents = router.getMatchedComponents();

    // 获取组件所需要的数据
  });

  
  // return promise;
  return app;
}
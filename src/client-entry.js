import createApp from 'app';

const { app, router, store } = createApp();

console.log('window.__INITIAL_STATE__:', window.__INITIAL_STATE__);
if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__);
}

app.$mount('#app');
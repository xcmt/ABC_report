const { createApp } = Vue;

const app = createApp(App);

app.component('vulnerability-library', VulnerabilityLibrary);

app.use(router);
app.use(ElementPlus);

app.mount('#app');
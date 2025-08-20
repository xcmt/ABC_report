const routes = [
  { path: '/', component: Home },
  { path: '/guide', component: Guide },
];

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
});
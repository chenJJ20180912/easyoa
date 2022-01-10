import Vue from 'vue'
import App from './App.vue'
import anEasyToolkit from "an-easy-toolkit";
import VueRouter from "vue-router"
import router from "@/router/index"
import _ from "lodash"
import 'ant-design-vue/dist/antd.css';
import Antd from 'ant-design-vue';

Vue.config.productionTip = false


Vue.prototype._ = _
Vue.prototype.$anEasyToolkit = anEasyToolkit;
Vue.use(VueRouter)
Vue.use(Antd)

new Vue({
  render: h => h(App),
  router
}).$mount('#app')


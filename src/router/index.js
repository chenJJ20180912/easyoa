import VueRouter from "vue-router";

const routes = [
    {
        path: '/',
        name: '/',
        redirect:'/index'
    }, {
        path: '/login',
        name: 'login',
        component: resolve => require(["@/pages/login.vue"], resolve),
        meta: {
            title: '用户登录',
            isWhite: true,
        }
    }, {
        path: '/index',
        name: 'index',
        component: resolve => require(["@/pages/index.vue"], resolve),
        meta: {
            title: '用户登录',
            isWhite: true,
        }
    }
]


const router = new VueRouter({})
router.addRoutes(routes);
router.beforeEach((to,from,next)=>{
    next()
})


export default router

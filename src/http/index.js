import axios from "axios";
import router from "@/router";
// 请求超时 请求头
axios.defaults.timeout = 100000;
axios.defaults.headers.post["Content-Type"] = "application/json;charset=UTF-8";

// 对所有 axios 请求做处理
axios.defaults.withCredentials = true;
/**
 * 加载框的配置
 */
export const loadingConfig = {};

function loadingConfigReset(loadingConfig) {
    loadingConfig.message = "加载中...";
    loadingConfig.forbidClick = true;
    loadingConfig.overlay = true;
    loadingConfig.duration = 0;
    loadingConfig.className = "popToast";
    // 绑定重置函数
    loadingConfig.reset = () => loadingConfigReset(loadingConfig);
}

loadingConfigReset(loadingConfig);

let loading;

function startLoading() {
}

function endLoading() {
    loading.clear();
}

let needLoadingRequestCount = 0;

export function showFullScreenLoading() {
    if (needLoadingRequestCount === 0) {
        startLoading();
    }
    needLoadingRequestCount++;
}

export function tryHideFullScreenLoading() {
    if (needLoadingRequestCount <= 0) return;
    needLoadingRequestCount--;
    if (needLoadingRequestCount === 0) {
        endLoading();
    }
}

// 请求拦截器
axios.interceptors.request.use(
    config => {
        return config
    },
    error => {
        tryHideFullScreenLoading();
        return Promise.error(error);
    }
);

// 响应拦截器
axios.interceptors.response.use(
    response => {
        if (response.status === 200) {
            if (response.data === '__LOGOUT') {
                // 跳转登录页
                router.push({path: '/login'})
                return Promise.reject(response);
            }
            return Promise.resolve(response.data);
        } else {
            return Promise.reject(response);
        }
    },
    // 服务器状态码不是200的情况
    (error) => {
        throw error
    }
);

/**
 * get方法，对应get请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 */
export function get(url, params) {
    return new Promise((resolve, reject) => {
        axios
            .get(url, {
                params: params
            })
            .then(res => {
                resolve(res);
            })
            .catch(err => {
                reject(err);
            });
    });
}


/**
 * post方法，对应post请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 */
export function postForm(url, params) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        Object.keys(params).forEach(key=>{
            const val = params[key]
            if(typeof val === 'object'){
                formData.append(key,JSON.stringify(val))
            }else{
                formData.append(key,val)
            }
        })
        axios
            .post(url, formData, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                }
            })
            .then(res => {
                resolve(res);
            })
            .catch(err => {
                reject(err);
            });
    });
}

export function jsonPost(url, params) {
    return new Promise((resolve, reject) => {
        axios
            .post(url, params)
            .then(res => {
                resolve(res);
            })
            .catch(err => {
                reject(err);
            });
    });
}

/**
 * 封装patch请求
 * @param url
 * @param params
 * @returns {Promise}
 */
export function patch(url, params) {
    return new Promise((resolve, reject) => {
        axios.patch(url, params).then(
            response => {
                resolve(response);
            },
            err => {
                reject(err);
            }
        );
    });
}

/**
 * put 请求
 * @param  url
 * @param  params
 */
export function put(url, params) {
    return new Promise((resolve, reject) => {
        axios.put(url, params).then(
            response => {
                resolve(response);
            },
            err => {
                reject(err);
            }
        );
    });
}




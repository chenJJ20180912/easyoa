/**
 * 设置当前用户
 * @param user
 */
import cacheUtils from "an-easy-toolkit/src/data/cacheUtils";

// 修改缓存的配置
// 使用localStorage 进行存储
cacheUtils.storageProvider = localStorage

export function setCurUser(user) {
    cacheUtils.putCache("system", "user", user)
}

/**
 *  获取当前用户
 * @returns {*}
 */
export function getCurUser() {
    return cacheUtils.getCache("system", "user")
}

/**
 * 保存用户自定义的配置
 * @param key
 * @param value
 */
export function setUserConfig(key, value) {
    cacheUtils.putCache("userConfig", key, value)
}

/**
 * 设置用户自定义的配置
 * @param key
 * @returns {*}
 */
export function getUserConfig(key) {
    return cacheUtils.getCache("userConfig", key)
}



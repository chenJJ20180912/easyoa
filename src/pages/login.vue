<template>
  <div class="login-container">
    <a-form-model class="login-form" layout="horizontal" :model="loginForm" @submit="doLogin"
                  @submit.native.prevent>
      <a-form-model-item>
        <a-input v-model="loginForm.code" placeholder="请输入工号">
          <a-icon slot="prefix" type="user" style="color:rgba(0,0,0,.25)"/>
        </a-input>
      </a-form-model-item>
      <a-form-model-item>
        <a-input v-model="loginForm.pwd" type="password" placeholder="请输入密码">
          <a-icon slot="prefix" type="lock" style="color:rgba(0,0,0,.25)"/>
        </a-input>
      </a-form-model-item>
      <a-form-model-item>
        <div class="footer">
          <span class="rememberPwd">
            记住密码: <a-switch v-model="loginForm.remember"/>
          </span>
          <span class="toolbar">
            <a-button
                type="primary"
                html-type="submit"
                :disabled="loginForm.code === '' || loginForm.pwd === ''"
            >
              登录
            </a-button>
          </span>
        </div>
      </a-form-model-item>
    </a-form-model>
  </div>
</template>

<script>
import {login} from "@/http/api";
import {getCurUser, getUserConfig, setUserConfig} from "@/cache";

export default {
  name: "login",
  data() {
    return {
      loginForm: {
        code: '',// 用户名
        pwd: '',// 密码
        remember: true,// 记住密码
      },
    }
  },
  mounted() {
    // 尝试从缓存中获取配置
    const loginConfig = getUserConfig("login")
    if (loginConfig && loginConfig.remember) {
      const user = getCurUser()
      if (user.code) {
        this.loginForm = user
      }
      this.$set(this.loginForm,"remember",true)
    }
  },
  methods: {
    // 进行登录
    doLogin() {
      login(this.loginForm.code, this.loginForm.pwd).then(() => {
        // 持有缓存
        if (this.loginForm.remember) {
          setUserConfig("login", {
            remember: true,
          })
        }
        // 登录之后自动跳转首页
        this.$router.push({
          path: '/index'
        })
      })
    }
  }
}
</script>

<style scoped lang="scss">

.login-container {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #959393;

  .login-form {
    left: 50%;
    top: 50%;
    position: absolute;
    transform: translate(-50%, -50%);
    background-color: #ffff;
    padding: 30px;
    border-radius: 20px;
    width: 360px;
    height: 240px;

    .footer {
      display: flex;

      span {
        display: inline-block;
        width: 50%;
      }

      .rememberPwd {
        text-align: left;
      }

      .toolbar {
        text-align: right;
      }
    }
  }
}

</style>

const path = require('path');
module.exports = {
    publicPath: '',
    outputDir: process.env.outputDir,
    // outputDir:'workFlow',
    lintOnSave: false,
    configureWebpack: {
        plugins: [],
        devtool: process.env.NODE_ENV === "production" ? 'false' : 'source-map',
        performance: {
            hints: false
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            } // 别名配置
        },
        optimization: {
            splitChunks: {
                chunks: 'all',
            }
        }
    },
    transpileDependencies: [],
    productionSourceMap: false, //防止源码泄露
    devServer: {
        host: '0.0.0.0',
        open: 'Google Chrome',
        port: 8000,
        https: false,
        hotOnly: false,
        proxy: {
            '/seeyon': {
                target: 'http://oa.wsdinfo.com',
                changeOrigin: true
            }
        }
    },
};
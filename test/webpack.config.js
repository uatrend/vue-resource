const Webpack = require('webpack');

module.exports = {

    mode: 'development',

    entry: __dirname + '/index.js',

    output: {
        path: __dirname + '/',
        filename: 'specs.js'
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader'
            }
        ]
    },

    plugins: [
        new Webpack.DefinePlugin({
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: true
        })
    ]

};

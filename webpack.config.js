const path = require('path');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    watch: true,
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'babel-loader',
                exclude: /node_modules/,
                sideEffects: true,
            },
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            terserOptions: {
                parse: {
                    ecma: 8
                },
                compress: {
                    ecma: 5,
                    warnings: false,
                    comparisons: false,
                    inline: 2
                },
                mangle: {
                    safari10: true
                },
                output: {
                    ecma: 5,
                    comments: false,
                    ascii_only: true
                }
            },
            parallel: true
        })],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    output: {
        filename: 'project.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    plugins: [
        new LodashModuleReplacementPlugin(),
    ]
};

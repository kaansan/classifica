require("extract-text-webpack-plugin");
const path = require('path')

module.exports = {
    devtool: 'source-map',
    entry: "./src/index.js",
    output: {
        path: path.join(__dirname, "/dist"),
        filename: "index_bundle.js"
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-react']
                }
            }
        }, {
            test: /\.css$/,
            use: ExtractTextPlugin.extract(
                {
                    fallback: 'style-loader',
                    use: ['css-loader']
                }
            )
        },
        {
            test: /\.(png|jpg|gif)$/,
            use: [
                {
                    loader: 'file-loader'
                }
            ]
        }
        ]
    },
    plugins: [
        new HtmlWebPackPlugin({
            hash: true,
            filename: "index.html",  //target html
            template: "./src/index.html" //source html
        }),
        new ExtractTextPlugin({ filename: 'css/style.css' })
    ]
}

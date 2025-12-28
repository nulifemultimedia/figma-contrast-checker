const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    ui: './src/ui.tsx',
    code: './src/code.ts'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/ui.html',
      filename: 'ui.html',
      chunks: ['ui'],
      inject: 'body'
    }),
    new HtmlInlineScriptPlugin({
      scriptMatchPattern: [/ui\.js$/]
    })
  ]
};


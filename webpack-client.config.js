const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  target: "web",
  entry: {
    client: ["./src/client/index.js"],
  },
  output: {
    path: path.resolve(__dirname, "./dist/client"),
    filename: "index.js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      hash: true,
      template: path.resolve(__dirname, "/public/index.html"),
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: "./public/assets", to: "./assets" }],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(gltf|glb)$/i,
        use: [
          {
            loader: "file-loader",
          },
        ],
      },
    ],
  },
  devServer: {
    watchContentBase: true,
    compress: true,
    port: 9001,
  },
  devtool: "inline-source-map",
};

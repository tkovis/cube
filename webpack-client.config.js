const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

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
  ],
  devServer: {
    watchContentBase: true,
    compress: true,
    port: 9001,
  },
  devtool: "inline-source-map",
};

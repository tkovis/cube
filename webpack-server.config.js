const path = require("path");
const nodeExternals = require("webpack-node-externals");
module.exports = {
  target: "node",
  entry: {
    app: ["./src/index.js"],
  },
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "index.js",
  },
  externals: [nodeExternals()],
};

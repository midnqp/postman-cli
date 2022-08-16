const {resolve} = require('path')
module.exports = {
  mode: "production",
  entry: "./dist/src/index.js",
  target: "node",
  output: {
    path: resolve(__dirname, "dist", "webpack"),
    chunkFormat: "commonjs",
  },
};

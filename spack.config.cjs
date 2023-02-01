// See https://swc.rs/docs/configuration/bundling
const { config } = require("@swc/core/spack");

module.exports = config({
  target: "node",
  entry: {
    worker: __dirname + "/src/worker.ts",
  },
  output: {
    path: __dirname + "/dist",
  },
  module: {},
});

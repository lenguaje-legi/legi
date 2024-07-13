const nodeResolve = require('rollup-plugin-node-resolve')

module.exports = {
  input: 'fuente/guiones/inicio.js',
  plugins: [
    nodeResolve()
  ],
  sourceMap: true,
  output: {
    file: 'fuente/compilación.js',
    sourcemap: true
  }
}

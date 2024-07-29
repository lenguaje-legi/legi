import { nodeResolve } from '@rollup/plugin-node-resolve'
import nodeGlobals from 'rollup-plugin-node-globals'
import commonjs from '@rollup/plugin-commonjs'

export default {
  input: 'fuente/guiones/inicio.js',
  plugins: [
    nodeResolve(),
    commonjs(),
    nodeGlobals()
  ],
  sourceMap: true,
  output: {
    file: 'fuente/compilación.js',
    sourcemap: true
  }
}

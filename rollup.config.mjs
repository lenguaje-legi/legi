import { readdir, rm } from 'node:fs/promises'
import { extname } from 'node:path'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import nodeGlobals from 'rollup-plugin-node-globals'
import commonjs from '@rollup/plugin-commonjs'

let módulos = await readdir('fuente/guiones/módulos', { recursive: true })

módulos = módulos.filter(módulo => {
  return extname(módulo) === '.js'
})

await rm('fuente/módulos-de-node', { recursive: true })

export default módulos.map(módulo => {
  return {
    input: `fuente/guiones/módulos/${módulo}`,
    plugins: [
      nodeResolve(),
      commonjs(),
      nodeGlobals()
    ],
    sourceMap: true,
    output: {
      file: `fuente/módulos-de-node/${módulo}`,
      sourcemap: true
    }
  }
})

import EditarPropiedades from './EditarPropiedades.js'
import Visualizar from './Visualizar.js'
import van from 'vanjs-core'
import { get, set, lowerFirst } from 'lodash-es'
import { Código } from '../inicio.js'
const { div, button } = van.tags

export default ({ tipo, indicador }) => {
  return div(
    button({
      onclick: () => {
        console.log(`Se agregó un tipo: ${tipo}`)

        let valor

        if (tipo === 'Función') {
          valor = []
        }

        if (tipo === 'Lista') {
          valor = []
        }

        if (tipo === 'Número') {
          valor = 0
        }

        if (tipo === 'Texto') {
          valor = ''
        }

        if (tipo === 'Lógica') {
          valor = true
        }

        const nuevoTipo = get(Código.val, indicador.toSpliced(-1)).toSpliced(indicador.at(-1), 0, {
          tipo,
          valor
        })

        set(Código.val, indicador.toSpliced(-1), nuevoTipo)

        Visualizar()
        EditarPropiedades({ tipo, indicador })
        document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('creado')
        document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('seleccionado')
        setTimeout(() => {
          document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.remove('seleccionado')
        }, 250)
        setTimeout(() => {
          document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('seleccionado')
        }, 500)
        setTimeout(() => {
          document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.remove('creado')
        }, 1000)
      }
    }, `Agregar ${lowerFirst(tipo)}`)
  )
}

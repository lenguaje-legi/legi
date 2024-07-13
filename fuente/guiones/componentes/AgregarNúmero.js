import EditarPropiedades from './EditarPropiedades.js'
import Visualizar from './Visualizar.js'
import van from 'vanjs-core'
import { get, set } from 'lodash-es'
import { Código } from '../inicio.js'
const { div, button } = van.tags

export default ({ indicador }) => {
  return div(
    button({
      onclick: () => {
        console.log('Se agregó un número')

        const tipo = 'Número'
        const nuevoNúmero = get(Código.val, indicador.toSpliced(-1)).toSpliced(indicador.at(-1), 0, {
          tipo,
          valor: 0
        })

        set(Código.val, indicador.toSpliced(-1), nuevoNúmero)

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
    }, 'Agregar número')
  )
}

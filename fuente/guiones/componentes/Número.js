import Seleccionar from './Seleccionar.js'
import van from 'vanjs-core'
const { div, pre } = van.tags

export default ({ bloquesDeEspacios, indicador, valor, asignación }) => {
  const tipo = 'Número'

  if (asignación) {
    valor = `$${asignación} = ${valor}`
  }

  valor = `${'    '.repeat(bloquesDeEspacios)}${valor};`

  return div(
    {
      'data-indicador': JSON.stringify(indicador),
      class: 'Número',
      onclick: (click) => {
        Seleccionar({ click, indicador, tipo })
      }
    },
    pre(valor)
  )
}

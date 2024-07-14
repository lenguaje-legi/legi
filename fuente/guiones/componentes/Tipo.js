import Seleccionar from './Seleccionar.js'
import van from 'vanjs-core'
import { get } from 'lodash-es'
import { Código } from '../inicio.js'
const { div, pre } = van.tags

export default ({ bloquesDeEspacios, indicador, valor, asignación }) => {
  const tipo = get(Código.val, indicador).tipo

  if (asignación) {
    valor = `$${asignación} = ${valor}`
  }

  if (tipo === 'Número') {
    valor = `${'    '.repeat(bloquesDeEspacios)}${valor};`
  }

  if (tipo === 'Texto') {
    valor = `${'    '.repeat(bloquesDeEspacios)}<<<_\n${(() => {
      if (valor === '') {
        return ''
      }

      valor = valor.split('\n').map(valor => {
        return `${'    '.repeat(bloquesDeEspacios + 1)}${valor}`
      })

      return valor.join('\n')
    })()}\n${'    '.repeat(bloquesDeEspacios + 1)}_;`
  }

  return div(
    {
      'data-indicador': JSON.stringify(indicador),
      class: tipo,
      onclick: (click) => {
        Seleccionar({ click, indicador, tipo })
      }
    },
    pre(valor)
  )
}

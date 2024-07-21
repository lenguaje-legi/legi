import van from 'vanjs-core'
import { Código } from '../../inicio.js'
import { get } from 'lodash-es'
const { pre, span } = van.tags

export default ({ bloquesDeEspacios, indicador, valor }) => {
  const número = get(Código.val, indicador)

  let devolver = ''

  if (número.devolver) {
    devolver = 'return '
  }

  return pre(
    span(
      {
        class: 'bloque-de-espacios'
      },
          `${'    '.repeat(bloquesDeEspacios)}`
    ),
    span(
      {
        class: 'devolver'
      },
      devolver
    ),
    valor,
    span(
      {
        class: 'punto-y-coma'
      },
      ';'
    )
  )
}

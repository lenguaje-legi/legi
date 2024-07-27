import van from 'vanjs-core'
import { get } from 'lodash-es'
import { Código } from '../../inicio.js'
const { pre, span } = van.tags

export default ({ bloquesDeEspacios, indicador, valor }) => {
  const contexto = get(Código.val, indicador)

  return pre(
    span(
      {
        class: 'bloque-de-espacios'
      },
          `${'    '.repeat(bloquesDeEspacios + 1)}`
    ),
    span(
      {
        class: 'ruido signo-de-dólar'
      },
      '$'
    ),
    contexto.valor.nombre
  )
}

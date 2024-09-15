import van from 'vanjs-core'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import { get } from 'lodash-es'
import { Código } from '../inicio.js'
const { pre, span } = van.tags

export default ({ bloquesDeEspacios, indicador, valor }) => {
  const contexto = get(Código.val, indicador)

  return pre(
    BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios + 1 }),
    span(
      {
        class: 'ruido signo-de-dólar'
      },
      '$'
    ),
    contexto.valor.nombre
  )
}

import van from 'vanjs-core'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import { Código } from '../inicio.js'
const { pre, span } = van.tags

export default ({ bloquesDeEspacios, indicador, valor }) => {
  const contexto = Código.obtener({
    propiedad: indicador
  })

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

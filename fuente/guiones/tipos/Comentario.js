import van from 'vanjs-core'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
const { pre, span } = van.tags

export default ({ bloquesDeEspacios, valor }) => {
  return valor.split('\n').map(valor => {
    return pre(
      BloqueDeEspacios({ bloquesDeEspacios }),
      span(
        {
          class: 'signo-de-número'
        },
        '# '
      ),
      valor
    )
  })
}

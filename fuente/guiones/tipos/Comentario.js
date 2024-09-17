import van from 'vanjs-core'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import Estilo from '../Estilo.js'
const { pre, span } = van.tags

Estilo({
  nombre: 'Comentario',
  css: {
    '#visualización': {

      '.legi': {

        ' .Comentario': {
          paddingBottom: '1.3rem',

          '::before': {
            content: '"💬"'
          },

          ' pre': {
            borderBottom: '1px solid rgba(100, 100, 100, 0.2)'
          }
        }
      }
    }
  }
})

export default ({ bloquesDeEspacios, valor }) => {
  return valor.split('\n').map(valor => {
    return pre(
      BloqueDeEspacios({ bloquesDeEspacios }),
      span(
        {
          class: 'ruido signo-de-número'
        },
        '# '
      ),
      valor
    )
  })
}

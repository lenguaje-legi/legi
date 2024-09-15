import van from 'vanjs-core'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import SignoDeDevolver from '../signos/SignoDeDevolver.js'
import SignoDeAsignación from '../signos/SignoDeAsignación.js'
import SignoDeCierre from '../signos/SignoDeCierre.js'
import Estilo from '../Estilo.js'
import { Código } from '../inicio.js'
import { get } from 'lodash-es'
const { pre, span } = van.tags

Estilo({
  nombre: 'Nulo',
  css: {
    '#visualización': {

      ' .Nulo': {
        color: 'rgb(150, 100, 255)'
      },

      '.legi': {

        ' .Nulo': {

          ' .valor': {
            color: 'transparent',

            '::before': {
              content: '"👻"',
              color: '#fff'
            }
          }
        }
      }
    }
  }
})

export default ({ bloquesDeEspacios, indicador, valor }) => {
  const legi = document.querySelector('#visualización').classList.contains('legi')
  const lógica = get(Código.val, indicador)

  return pre(
    BloqueDeEspacios({ bloquesDeEspacios }),
    SignoDeDevolver(lógica),
    SignoDeAsignación(lógica),
    span(
      {
        class: `valor${(() => {
          if (legi) {
            return ' nulo'
          }

          return ''
        })()}`
      },
      'null'
    ),
    SignoDeCierre({ indicador })
  )
}

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
  nombre: 'Lógica',
  reglas: {
    '#visualización': {

      ' .Lógica': {
        color: 'rgb(255, 150, 100)'
      },

      '.legi': {

        ' .Lógica': {

          ' .valor': {
            color: 'transparent'
          },

          ' .falso': {

            '::before': {
              content: '"❌"',
              color: '#fff'
            }
          },

          ' .verdadero': {

            '::before': {
              content: '"✔️"',
              color: '#fff'
            }
          }
        }
      }
    }
  }
})

export default ({ bloquesDeEspacios, indicador, valor }) => {
  const lógica = get(Código.val, indicador)

  return pre(
    BloqueDeEspacios({ bloquesDeEspacios }),
    SignoDeDevolver(lógica),
    SignoDeAsignación(lógica),
    span(
      {
        class: `valor ${(() => {
          if (valor) {
            return 'verdadero'
          }

          return 'falso'
        })()}`
      },
      valor
    ),
    SignoDeCierre({ indicador })
  )
}

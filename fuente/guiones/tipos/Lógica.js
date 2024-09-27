import Componente from '../Componente.js'
import Estilo from '../Estilo.js'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import SignoDeDevolver from '../signos/SignoDeDevolver.js'
import SignoDeAsignación from '../signos/SignoDeAsignación.js'
import SignoDeCierre from '../signos/SignoDeCierre.js'
import { Código } from '../inicio.js'
import { get } from 'lodash-es'

const { identificadorDelComponente, elemento: _ } = Componente()

Estilo({
  identificadorDelComponente,
  reglas: {
    color: 'rgb(255, 150, 100)',

    '.valor': {

      '.legi': {
        color: 'transparent',

        '.falso': {

          '::before': {
            content: '"❌"',
            color: '#fff'
          }
        },

        '.verdadero': {

          '::before': {
            content: '"✔️"',
            color: '#fff'
          }
        }
      }
    }
  }
})

export default ({ bloquesDeEspacios, indicador, valor }) => {
  const lógica = get(Código.val, indicador)

  return _('pre',
    BloqueDeEspacios({ bloquesDeEspacios }),
    SignoDeDevolver(lógica),
    SignoDeAsignación(lógica),
    _('span',
      {
        class: {
          valor: true,
          legi: document.querySelector('#visualización').classList.contains('legi'),
          verdadero: valor,
          falso: !valor
        }
      },
      valor
    ),
    SignoDeCierre({ indicador })
  )
}

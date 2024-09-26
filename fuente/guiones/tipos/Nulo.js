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
    '.nulo': {
      color: 'transparent',

      '::before': {
        content: '"👻"',
        color: '#fff'
      }
    }
  }
})

export default ({ bloquesDeEspacios, indicador }) => {
  const legi = document.querySelector('#visualización').classList.contains('legi')
  const nulo = get(Código.val, indicador)

  let clase = 'valor'

  if (legi) {
    clase = `${clase} nulo`
  }

  return _('pre',
    BloqueDeEspacios({ bloquesDeEspacios }),
    SignoDeDevolver(nulo),
    SignoDeAsignación(nulo),
    _('span',
      {
        class: clase
      },
      'null'
    ),
    SignoDeCierre({ indicador })
  )
}

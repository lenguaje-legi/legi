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
    color: 'rgb(100, 255, 255)',

    '.valor': {

      '.legi': {
        border: '1px solid'
      }
    }
  }
})

export default ({ bloquesDeEspacios, indicador, valor }) => {
  const legi = document.querySelector('#visualización').classList.contains('legi')
  const número = get(Código.val, indicador)

  let clase = 'valor'

  if (legi) {
    clase = `${clase} legi`
  }

  return _('pre',
    BloqueDeEspacios({ bloquesDeEspacios }),
    SignoDeDevolver(número),
    SignoDeAsignación(número),
    _('span',
      {
        class: clase
      },
      valor
    ),
    SignoDeCierre({ indicador })
  )
}

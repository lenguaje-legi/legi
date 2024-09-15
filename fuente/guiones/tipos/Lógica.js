import van from 'vanjs-core'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import SignoDeDevolver from '../signos/SignoDeDevolver.js'
import SignoDeAsignación from '../signos/SignoDeAsignación.js'
import SignoDeCierre from '../signos/SignoDeCierre.js'
import { Código } from '../inicio.js'
import { get } from 'lodash-es'
const { pre, span } = van.tags

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

import van from 'vanjs-core'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import SignoDeDevolver from '../signos/SignoDeDevolver.js'
import SignoDeAsignación from '../signos/SignoDeAsignación.js'
import SignoDeCierre from '../signos/SignoDeCierre.js'
import { Código } from '../inicio.js'
import { get } from 'lodash-es'
const { pre, span } = van.tags

export default ({ bloquesDeEspacios, indicador, valor }) => {
  const número = get(Código.val, indicador)

  return pre(
    BloqueDeEspacios({ bloquesDeEspacios }),
    SignoDeDevolver(número),
    SignoDeAsignación(número),
    span(
      {
        class: 'valor'
      },
      valor
    ),
    SignoDeCierre({ indicador })
  )
}

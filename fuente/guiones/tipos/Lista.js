import { get } from 'lodash-es'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import SignoDeDevolver from '../signos/SignoDeDevolver.js'
import SignoDeAsignación from '../signos/SignoDeAsignación.js'
import SignoDeCierre from '../signos/SignoDeCierre.js'
import Tipo from './Tipo.js'
import { Código } from '../inicio.js'
import van from 'vanjs-core'
const { pre, span } = van.tags

export default ({ bloquesDeEspacios, indicador }) => {
  bloquesDeEspacios = bloquesDeEspacios + 1

  const lista = get(Código.val, indicador)

  const código = lista.valor.map(({ valor }, indicadorDelElemento) => {
    const código = []
    código.push(Tipo({
      bloquesDeEspacios,
      indicador: [...indicador, 'valor', indicadorDelElemento],
      valor
    }))

    código.push(Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'valor', indicadorDelElemento + 1] }))

    return código
  })

  return [
    pre(
      BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
      SignoDeDevolver(lista),
      SignoDeAsignación(lista),
      span(
        {
          class: 'valor corchete'
        },
        '['
      )
    ),
    Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'valor', 0] }),
    código,
    pre(
      BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
      span(
        {
          class: 'corchete'
        },
        ']'
      ),
      SignoDeCierre({ indicador })
    )
  ]
}

import { get } from 'lodash-es'
import Tipo from '../Tipo.js'
import { Código } from '../../inicio.js'
import van from 'vanjs-core'
const { pre, span } = van.tags

export default ({ bloquesDeEspacios, indicador }) => {
  bloquesDeEspacios = bloquesDeEspacios + 1

  const función = get(Código.val, indicador)

  let devolver = ''

  if (función.devolver) {
    devolver = 'return '
  }

  const código = función.valor.map(({ valor }, indicadorDelElemento) => {
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
      span(
        {
          class: 'bloque-de-espacios'
        },
          `${'    '.repeat(bloquesDeEspacios - 1)}`
      ),
      span(
        {
          class: 'devolver'
        },
        devolver
      ),
      span(
        {
          class: 'función'
        },
        'function'
      ),
      span(
        {
          class: 'paréntesis'
        },
        ' ()'
      ),
      span(
        {
          class: 'llave'
        },
        ' {'
      )
    ),
    Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'valor', 0] }),
    código,
    pre(
      span(
        {
          class: 'bloque-de-espacios'
        },
          `${'    '.repeat(bloquesDeEspacios - 1)}`
      ),
      span(
        {
          class: 'llave'
        },
        '}'
      ),
      span(
        {
          class: 'punto-y-coma'
        },
        ';'
      )
    )
  ]
}

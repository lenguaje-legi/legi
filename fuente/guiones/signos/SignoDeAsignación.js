import van from 'vanjs-core'
import { Código } from '../inicio.js'
import { get } from 'lodash-es'
const { span } = van.tags

export default ({ asignación }) => {
  if (!asignación) {
    return null
  }

  return [
    span(
      {
        class: 'ruido signo-de-dólar'
      },
      '$'
    ),
    span(
      {
        class: 'asignación'
      },
      `${get(Código.val, [...JSON.parse(asignación), 'valor', 'nombre'])}`
    ),
    span(
      {
        class: 'signo-de-asignación'
      },
      span(
        {
          class: 'ruido'
        },
        ' = '
      )
    )
  ]
}

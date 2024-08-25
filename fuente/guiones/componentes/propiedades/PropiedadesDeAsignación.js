import ActualizarPropiedad from '../ActualizarPropiedad'
import { Código } from '../../inicio'
import { get } from 'lodash-es'
import van from 'vanjs-core'
const { div, select, option } = van.tags

export default ({ indicador }) => {
  const { contexto } = get(Código.val, indicador.slice(0, -2))

  if (!contexto) {
    return
  }

  return div(
    div(
      select(
        {
          'data-propiedad': JSON.stringify([...indicador, 'asignación']),
          name: 'asignación',
          onchange: ({ target }) => {
            console.log('Se confirmó un cambio')
            ActualizarPropiedad({ indicador, target })
          }
        },
        option(''),
        contexto.map((contexto, indicadorDelContexto) => {
          const valor = JSON.stringify([...indicador.slice(0, -2), 'contexto', indicadorDelContexto])
          return option(
            {
              value: valor,
              selected: (() => {
                return valor === get(Código.val, [...indicador, 'asignación'])
              })()
            },
            contexto.valor.nombre
          )
        })
      )
    )
  )
}

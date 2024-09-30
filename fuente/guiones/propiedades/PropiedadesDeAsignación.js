import van from '../../módulos-de-node/vanjs/van.js'
import ActualizarPropiedad from '../acciones/ActualizarPropiedad.js'
import ErrorDeAsignación from '../errores/ErrorDeAsignación.js'
import { Código } from '../inicio.js'
const { div, select, option } = van.tags

export default ({ indicador }) => {
  const Tipo = Código.obtener({
    propiedad: indicador
  })

  const { tipo } = Tipo
  const { contexto } = Código.obtener({
    propiedad: indicador.slice(0, -2)
  })

  if (!contexto) {
    return
  }

  let error = ''

  if (ErrorDeAsignación({ indicador })) {
    error = 'error'
  }

  return div(
    div(
      select(
        {
          class: error,
          'data-propiedad': JSON.stringify([...indicador, 'asignación']),
          name: 'asignación',
          onchange: ({ target }) => {
            console.log('Se confirmó un cambio')
            target.classList.remove('error')
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
                return valor === Código.obtener({
                  propiedad: [...indicador, 'asignación']
                })
              })(),
              disabled: (() => {
                if (tipo === 'Instancia') {
                  return contexto.valor.tipo !== Tipo.devuelve
                }

                return contexto.valor.tipo !== tipo
              })()
            },
            contexto.valor.nombre
          )
        })
      )
    )
  )
}

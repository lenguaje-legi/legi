import ActualizarPropiedad from '../acciones/ActualizarPropiedad.js'
import Visualizar from '../acciones/Visualizar.js'
import imprimir from '../funciones/imprimir.js'
import { Código } from '../inicio.js'
import { get, set } from 'lodash-es'
import van from 'vanjs-core'
const { p, div, select, option } = van.tags

export default ({ indicador }) => {
  const funciones = [
    {
      nombre: 'imprimir',
      ...imprimir()
    }
  ]

  const { instancia } = get(Código.val, indicador)

  if (instancia) {
    const { devuelve } = funciones.find(función => función.nombre === instancia)
    return p(devuelve)
  }

  return [
    div(
      {
        class: 'propiedad'
      },
      p('Función'),
      select(
        {
          'data-propiedad': JSON.stringify([...indicador, 'instancia']),
          name: 'instancia',
          onchange: ({ target }) => {
            console.log('Se confirmó un cambio')
            ActualizarPropiedad({ indicador, target })
            const { instancia } = get(Código.val, indicador)
            const { devuelve, contexto } = funciones.find(función => función.nombre === instancia)
            set(
              Código.val,
              [...indicador, 'devuelve'],
              devuelve
            )
            set(
              Código.val,
              [...indicador, 'contexto'],
              contexto
            )
            Visualizar()
          }
        },
        option(''),
        funciones.map((función) => {
          return option(
            {
              value: función.nombre
            },
            función.nombre
          )
        })
      )
    )
  ]
}

import ActualizarPropiedad from '../acciones/ActualizarPropiedad.js'
import Visualizar from '../acciones/Visualizar.js'
import imprimir from '../funciones/imprimir.js'
import { Código } from '../inicio.js'
import van from 'vanjs-core'
const { p, div, select, option } = van.tags

export default ({ indicador }) => {
  const funciones = [
    {
      nombre: 'imprimir',
      ...imprimir()
    }
  ]

  const { instancia } = Código.obtener({
    propiedad: indicador
  })

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
            const { instancia } = Código.obtener({
              propiedad: indicador
            })

            const { devuelve, contexto } = funciones.find(función => función.nombre === instancia)
            Código.establecer({
              propiedad: [...indicador, 'devuelve'],
              valor: devuelve
            })

            Código({
              propiedad: [...indicador, 'contexto'],
              valor: contexto
            })
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

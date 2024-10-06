import Componente from '../Componente.js'
import ActualizarPropiedad from '../acciones/ActualizarPropiedad.js'
import Visualizar from '../acciones/Visualizar.js'
import imprimir from '../funciones/imprimir.js'
import { Código } from '../inicio.js'

const { elemento } = Componente()

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
    return elemento({
      etiqueta: 'p',
      elementos: devuelve
    })
  }

  return [
    elemento({
      etiqueta: 'div',
      atributos: {
        class: 'propiedad'
      },
      elementos: [
        elemento({
          etiqueta: 'p',
          elementos: 'Función'
        }),
        elemento({
          etiqueta: 'select',
          atributos: {
            dataPropiedad: JSON.stringify([...indicador, 'instancia']),
            name: 'instancia'
          },
          eventos: {
            change: ({ target }) => {
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

              Código.establecer({
                propiedad: [...indicador, 'contexto'],
                valor: contexto
              })
              Visualizar()
            }
          },
          elementos: [
            elemento({
              etiqueta: 'option',
              elementos: ''
            }),
            funciones.map((función) => {
              return elemento({
                etiqueta: 'option',
                atributos: {
                  value: función.nombre
                },
                elementos: [
                  función.nombre
                ]
              })
            })
          ]
        })
      ]
    })
  ]
}

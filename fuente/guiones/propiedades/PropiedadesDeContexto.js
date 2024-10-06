import Componente from '../Componente.js'
import ActualizarPropiedad from '../acciones/ActualizarPropiedad.js'
import { Código } from '../inicio.js'

const { elemento } = Componente()

export default ({ indicador }) => {
  let valor
  let confirmado = false

  const Tipo = Código.obtener({
    propiedad: indicador
  })

  return [
    elemento({
      etiqueta: 'div',
      atributos: {
        class: 'propiedad'
      },
      elementos: [
        elemento({
          etiqueta: 'p',
          elementos: 'Nombre'
        }),
        elemento({
          etiqueta: 'input',
          atributos: {
            value: Tipo.valor.nombre,
            dataPropiedad: JSON.stringify([...indicador, 'valor', 'nombre'])
          },
          eventos: {
            focus: ({ target }) => {
              valor = target.value
              console.log('Se inició un cambio')
            },
            focusout: ({ target }) => {
              if (valor === target.value) {
                return
              }
              if (confirmado) {
                confirmado = false
                return
              }
              console.log('Se aplicó un cambio')
              ActualizarPropiedad({ indicador, valor, target })
            },
            keyup: ({ target, key }) => {
              if (key !== undefined && key !== 'Enter') {
                return
              }

              confirmado = true
              target.blur()
              if (valor === target.value) {
                return
              }
              console.log('Se confirmó un cambio')
              ActualizarPropiedad({ indicador, valor, target })
            }
          }
        })
      ]
    }),
    (() => {
      return [
        'Función',
        'Lista',
        'Lógica',
        'Número',
        'Texto',
        'Nulo'
      ].map((tipo) => {
        return elemento({
          etiqueta: 'div',
          atributos: {
            class: 'elección'
          },
          elementos: [
            elemento({
              etiqueta: 'input',
              atributos: {
                type: 'radio',
                name: 'tipo',
                checked: Tipo.valor.tipo === tipo,
                value: tipo,
                dataPropiedad: JSON.stringify([...indicador, 'valor', 'tipo'])
              },
              eventos: {
                change: ({ target }) => {
                  console.log('Se confirmó un cambio')
                  ActualizarPropiedad({ indicador, valor, target })
                }
              }
            }),
            elemento({
              etiqueta: 'span',
              atributos: {
                class: 'marca'
              },
              eventos: {
                click: ({ target }) => {
                  target.parentNode.childNodes[0].click()
                }
              }
            }),
            elemento({
              etiqueta: 'p',
              elementos: tipo
            })
          ]
        })
      })
    })()
  ]
}

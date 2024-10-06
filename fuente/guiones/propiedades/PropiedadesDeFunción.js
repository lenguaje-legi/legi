import Componente from '../Componente.js'
import ActualizarPropiedad from '../acciones/ActualizarPropiedad.js'
import { Código } from '../inicio.js'

const { elemento } = Componente()

export default ({ indicador }) => {
  let valor

  const Tipo = Código.obtener({
    propiedad: indicador
  })

  return [
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
                name: 'devuelve',
                checked: Tipo.devuelve === tipo,
                value: tipo,
                dataPropiedad: JSON.stringify([...indicador, 'devuelve'])
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

import Componente from '../Componente.js'
import ActualizarPropiedad from '../acciones/ActualizarPropiedad.js'
import { Código } from '../inicio.js'

const { elemento } = Componente()

export default ({ indicador }) => {
  const Tipo = Código.obtener({
    propiedad: indicador
  })

  return elemento({
    etiqueta: 'div',
    atributos: {
      class: 'lógica'
    },
    elementos: [
      elemento({
        etiqueta: 'fieldset',
        elementos: [
          elemento({
            etiqueta: 'div',
            atributos: {
              class: 'elección'
            },
            elementos: [
              elemento({
                etiqueta: 'input',
                atributos: {
                  dataPropiedad: JSON.stringify([...indicador, 'valor']),
                  type: 'radio',
                  name: 'lógica',
                  checked: (() => {
                    if (Tipo.valor === true) {
                      return true
                    }
                  })(),
                  value: true
                },
                eventos: {
                  change: ({ target }) => {
                    console.log('Se confirmó un cambio')
                    if (target.checked) {
                      target.value = true
                    }
                    ActualizarPropiedad({ indicador, target })
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
                elementos: 'Verdadero'
              })
            ]
          }),
          elemento({
            etiqueta: 'div',
            atributos: {
              class: 'elección'
            },
            elementos: [
              elemento({
                etiqueta: 'input',
                atributos: {
                  dataPropiedad: JSON.stringify([...indicador, 'valor']),
                  type: 'radio',
                  name: 'lógica',
                  checked: (() => {
                    if (Tipo.valor === false) {
                      return true
                    }
                  })(),
                  value: false
                },
                eventos: {
                  change: ({ target }) => {
                    console.log('Se confirmó un cambio')
                    if (target.checked) {
                      target.value = false
                    }
                    ActualizarPropiedad({ indicador, target })
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
                elementos: 'Falso'
              })
            ]
          })
        ]
      })
    ]
  })
}

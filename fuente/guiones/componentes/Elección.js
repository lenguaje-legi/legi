import Componente from '../Componente.js'

const { elemento } = Componente()

export default (opciones) => {
  return elemento({
    etiqueta: 'fieldset',
    elementos: [
      opciones.map(opción => {
        const { nombre, valor, seleccionado, alSeleccionar } = opción

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
                name: 'visualización',
                checked: seleccionado,
                value: valor
              },
              eventos: {
                change: (evento) => alSeleccionar(evento)
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
              elementos: nombre
            })
          ]
        })
      })
    ]
  })
}

import van from '../../módulos-de-node/vanjs/van.js'
const { p, span, div, fieldset, input } = van.tags

export default (opciones) => {
  return fieldset(
    opciones.map(opción => {
      const { nombre, valor, seleccionado, alSeleccionar } = opción

      return div(
        {
          class: 'elección'
        },
        input({
          type: 'radio',
          name: 'visualización',
          checked: seleccionado,
          value: valor,
          onchange: (evento) => alSeleccionar(evento)
        }),
        span({
          class: 'marca',
          onclick: ({ target }) => {
            target.parentNode.childNodes[0].click()
          }
        }),
        p(nombre)
      )
    })
  )
}

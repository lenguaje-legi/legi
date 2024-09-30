import van from '../../módulos-de-node/vanjs/van.js'
import ActualizarPropiedad from '../acciones/ActualizarPropiedad.js'
import { Código } from '../inicio.js'
const { p, div, span, fieldset, input } = van.tags

export default ({ indicador }) => {
  const Tipo = Código.obtener({
    propiedad: indicador
  })

  return div(
    {
      class: 'lógica'
    },
    fieldset(
      div(
        {
          class: 'elección'
        },
        input({
          'data-propiedad': JSON.stringify([...indicador, 'valor']),
          type: 'radio',
          name: 'lógica',
          checked: (() => {
            if (Tipo.valor === true) {
              return true
            }
          })(),
          value: true,
          onchange: ({ target }) => {
            console.log('Se confirmó un cambio')
            if (target.checked) {
              target.value = true
            }
            ActualizarPropiedad({ indicador, target })
          }
        }),
        span({
          class: 'marca',
          onclick: ({ target }) => {
            target.parentNode.childNodes[0].click()
          }
        }),
        p('Verdadero')
      ),
      div(
        {
          class: 'elección'
        },
        input({
          'data-propiedad': JSON.stringify([...indicador, 'valor']),
          type: 'radio',
          name: 'lógica',
          checked: (() => {
            if (Tipo.valor === false) {
              return true
            }
          })(),
          value: false,
          onchange: ({ target }) => {
            console.log('Se confirmó un cambio')
            if (target.checked) {
              target.value = false
            }
            ActualizarPropiedad({ indicador, target })
          }
        }),
        span({
          class: 'marca',
          onclick: ({ target }) => {
            target.parentNode.childNodes[0].click()
          }
        }),
        p('Falso')
      )
    )
  )
}

import ActualizarPropiedad from '../acciones/ActualizarPropiedad.js'
import { Código } from '../inicio.js'
import { get } from 'lodash-es'
import van from 'vanjs-core'
const { p, div, fieldset, input } = van.tags

export default ({ indicador }) => {
  const Tipo = get(Código.val, indicador)

  return div(
    {
      class: 'lógica'
    },
    fieldset(
      div(
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
        p('Verdadero')
      ),
      div(
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
        p('Falso')
      )
    )
  )
}

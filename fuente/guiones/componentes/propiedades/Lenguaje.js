import ActualizarPropiedad from '../ActualizarPropiedad'
import van from 'vanjs-core'
const { p, h2, div, fieldset, input } = van.tags
const visualización = document.querySelector('#visualización')

export default ({ indicador }) => {
  return [
    h2(
      {
        class: 'tipo'
      },
      'Visualización'
    ),
    div(
      {
        class: 'lógica'
      },
      fieldset(
        div(
          input({
            type: 'radio',
            name: 'visualización',
            checked: (() => {
              if (visualización.classList.contains('legi')) {
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
          p('Legi')
        ),
        div(
          input({
            type: 'radio',
            name: 'visualización',
            checked: (() => {
              if (!visualización.classList.contains('legi')) {
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
          p('PHP')
        )
      )
    )
  ]
}

import ActualizarPropiedad from '../acciones/ActualizarPropiedad.js'
import { Código } from '../inicio.js'
import van from 'vanjs-core'
const { p, div, input, span } = van.tags

export default ({ indicador }) => {
  let valor
  let confirmado = false

  const Tipo = Código.obtener({
    propiedad: indicador
  })

  return [
    div(
      {
        class: 'propiedad'
      },
      p('Nombre'),
      input({
        value: Tipo.valor.nombre,
        'data-propiedad': JSON.stringify([...indicador, 'valor', 'nombre']),
        onfocus: ({ target }) => {
          valor = target.value
          console.log('Se inició un cambio')
        },
        onfocusout: ({ target }) => {
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
        onkeyup: ({ target, key }) => {
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
      })
    ),
    (() => {
      return [
        'Función',
        'Lista',
        'Lógica',
        'Número',
        'Texto',
        'Nulo'
      ].map((tipo) => {
        return div(
          {
            class: 'elección'
          },
          input({
            type: 'radio',
            name: 'tipo',
            checked: Tipo.valor.tipo === tipo,
            value: tipo,
            'data-propiedad': JSON.stringify([...indicador, 'valor', 'tipo']),
            onchange: ({ target }) => {
              console.log('Se confirmó un cambio')
              ActualizarPropiedad({ indicador, valor, target })
            }
          }),
          span({
            class: 'marca',
            onclick: ({ target }) => {
              target.parentNode.childNodes[0].click()
            }
          }),
          p(tipo)
        )
      })
    })()
  ]
}

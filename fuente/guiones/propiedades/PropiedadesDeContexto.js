import ActualizarPropiedad from '../acciones/ActualizarPropiedad.js'
import { Código } from '../inicio.js'
import { get } from 'lodash-es'
import van from 'vanjs-core'
const { p, div, input, span } = van.tags

export default ({ indicador }) => {
  let valor
  let confirmado = false

  const Tipo = get(Código.val, indicador)

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
      return Object.keys(Tipo.valor.tipos).map((tipo, indicadorDePropiedad) => {
        return div(
          {
            class: 'verificación'
          },
          input({
            type: 'checkbox',
            checked: Tipo.valor.tipos[Object.keys(Tipo.valor.tipos)[indicadorDePropiedad]],
            value: Tipo.valor.tipos[Object.keys(Tipo.valor.tipos)[indicadorDePropiedad]],
            'data-propiedad': JSON.stringify([...indicador, 'valor', 'tipos', tipo]),
            onchange: ({ target }) => {
              console.log('Se confirmó un cambio')
              if (target.checked) {
                target.value = true
              }
              if (!target.checked) {
                target.value = false
              }
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

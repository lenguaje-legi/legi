import AgregarTipo from './AgregarTipo.js'
import Visualizar from './Visualizar.js'
import van from 'vanjs-core'
import { capitalize, get } from 'lodash-es'
import { Código } from '../inicio.js'
const { add } = van
const { p, h2, div, fieldset, input, textarea, span } = van.tags

export default ({ tipo, indicador } = {}) => {
  const propiedades = document.querySelector('#propiedades')
  propiedades.innerHTML = ''

  let editarPropiedades

  const actualizarPropiedad = ({ valor, propiedad, target }) => {
    if (target.value === 'true' || target.value === 'false') {
      get(Código.val, indicador)[propiedad] = target.value === 'true'
    }

    if (get(Código.val, indicador).tipo === 'Número') {
      if (target.value.trim() === '' || isNaN(target.value)) {
        target.value = valor
        return null
      }

      target.value = Number(target.value)
    }

    if (target.value !== 'true' && target.value !== 'false') {
      get(Código.val, indicador)[propiedad] = target.value
    }

    Visualizar()
    document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('editado')
    document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('seleccionado')
    setTimeout(() => {
      document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.remove('seleccionado')
    }, 100)
    setTimeout(() => {
      document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('seleccionado')
    }, 250)
    setTimeout(() => {
      document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.remove('editado')
    }, 350)
  }

  if (tipo === undefined) {
    editarPropiedades = div()
  }

  if (tipo === 'Nueva línea') {
    editarPropiedades = div(
      AgregarTipo({
        tipo: 'Función',
        indicador
      }),
      AgregarTipo({
        tipo: 'Lista',
        indicador
      }),
      AgregarTipo({
        tipo: 'Número',
        indicador
      }),
      AgregarTipo({
        tipo: 'Texto',
        indicador
      }),
      AgregarTipo({
        tipo: 'Lógica',
        indicador
      })
    )
  }

  if (tipo !== undefined && tipo !== 'Nueva línea') {
    editarPropiedades = Object.keys(get(Código.val, indicador)).map(propiedad => {
      let valor
      let confirmado = false
      const { tipo } = get(Código.val, indicador)

      if (typeof get(Código.val, indicador)[propiedad] === 'object') {
        return null
      }

      if (propiedad === 'tipo') {
        return h2(
          {
            class: 'tipo'
          },
          get(Código.val, indicador)[propiedad]
        )
      }

      if (propiedad === 'devolver') {
        return div(
          {
            class: 'verificación'
          },
          input({
            type: 'checkbox',
            checked: get(Código.val, indicador)[propiedad],
            value: get(Código.val, indicador)[propiedad],
            onchange: ({ target }) => {
              console.log('Se confirmó un cambio')
              if (target.checked) {
                target.value = true
              }
              if (!target.checked) {
                target.value = false
              }
              actualizarPropiedad({ valor, propiedad, target })
            }
          }),
          span({
            class: 'marca',
            onclick: ({ target }) => {
              target.parentNode.childNodes[0].click()
            }
          }),
          p(capitalize(propiedad))
        )
      }

      if (tipo === 'Lógica') {
        return div(
          {
            class: 'lógica'
          },
          fieldset(
            div(
              input({
                type: 'radio',
                name: 'lógica',
                checked: (() => {
                  if (get(Código.val, indicador)[propiedad] === true) {
                    return true
                  }
                })(),
                value: true,
                onchange: ({ target }) => {
                  console.log('Se confirmó un cambio')
                  if (target.checked) {
                    target.value = true
                  }
                  actualizarPropiedad({ valor, propiedad, target })
                }
              }),
              p('Cierto')
            ),
            div(
              input({
                type: 'radio',
                name: 'lógica',
                checked: (() => {
                  if (get(Código.val, indicador)[propiedad] === false) {
                    return true
                  }
                })(),
                value: false,
                onchange: ({ target }) => {
                  console.log('Se confirmó un cambio')
                  if (target.checked) {
                    target.value = false
                  }
                  actualizarPropiedad({ valor, propiedad, target })
                }
              }),
              p('Falso')
            )
          )
        )
      }

      let casilla = input

      if (tipo === 'Texto') {
        casilla = textarea
      }

      setTimeout(() => {
        if (tipo === 'Texto' && propiedad === 'valor') {
          const casilla = document.querySelector(`#propiedades [data-propiedad='${propiedad}']`)
          casilla.style.height = ''
          casilla.style.height = `${casilla.scrollHeight}px`
        }
      }, 0)

      return div(
        {
          class: 'propiedad'
        },
        p(capitalize(propiedad)),
        casilla({
          value: get(Código.val, indicador)[propiedad],
          'data-propiedad': propiedad,
          oninput: ({ target }) => {
            if (tipo === 'Texto' && propiedad === 'valor') {
              target.style.height = ''
              target.style.height = `${target.scrollHeight}px`
            }
          },
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
            actualizarPropiedad({ valor, propiedad, target })
          },
          onkeydown: event => {
            if (tipo !== 'Texto') {
              return
            }

            const { key, shiftKey } = event
            if (key === 'Enter' && shiftKey) {
              event.preventDefault()
            }
          },
          onkeyup: ({ target, key, shiftKey }) => {
            if (tipo === 'Texto' && (key === 'Enter' && !shiftKey)) {
              return
            }

            if (key !== undefined && key !== 'Enter') {
              return
            }
            confirmado = true
            target.blur()
            if (valor === target.value) {
              return
            }
            console.log('Se confirmó un cambio')
            actualizarPropiedad({ valor, propiedad, target })
          }
        })
      )
    })
  }

  add(propiedades, editarPropiedades)
}

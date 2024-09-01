import AgregarTipo from './AgregarTipo.js'
import ActualizarPropiedad from './ActualizarPropiedad.js'
import PropiedadesDeContexto from '../propiedades/PropiedadesDeContexto.js'
import PropiedadesDeLógica from '../propiedades/PropiedadesDeLógica.js'
import PropiedadesDeAsignación from '../propiedades/PropiedadesDeAsignación.js'
import van from 'vanjs-core'
import { capitalize, get } from 'lodash-es'
import { Código } from '../inicio.js'
import Lenguaje from '../propiedades/Lenguaje.js'
const { add } = van
const { p, h2, div, input, textarea, span } = van.tags

export default ({ tipo, indicador } = {}) => {
  const propiedades = document.querySelector('#propiedades')
  propiedades.innerHTML = ''

  let editarPropiedades

  let Tipo = get(Código.val, indicador)
  if (!Tipo) {
    Tipo = {}
  }

  let últimoElemento = get(Código.val, indicador.slice(0, -1))
  if (últimoElemento) {
    últimoElemento = últimoElemento.at(-1)
  }

  if (!últimoElemento) {
    últimoElemento = {
      devolver: false
    }
  }

  const esLaRaíz = JSON.stringify(indicador) === '[]'
  let esElÚltimoElemento
  let esLaÚltimaNuevaLínea

  if (!esLaRaíz && JSON.stringify(indicador) !== '[0]' && JSON.stringify(indicador) !== '[0,"contexto",0]') {
    esElÚltimoElemento = get(Código.val, indicador.slice(0, -1)).length === indicador.at(-1) + 1
    esLaÚltimaNuevaLínea = get(Código.val, indicador.slice(0, -1)).length === indicador.at(-1)
  }

  if (tipo === undefined) {
    editarPropiedades = Lenguaje({ indicador })
  }

  if (tipo === 'Nueva línea') {
    if (esLaÚltimaNuevaLínea && últimoElemento.devolver) {
      return null
    }

    if (indicador.slice(0, -1).at(-1) !== 'contexto') {
      editarPropiedades = div(
        [
          'Función',
          'Lista',
          'Número',
          'Texto',
          'Lógica',
          'Comentario'
        ].map(tipo => {
          return AgregarTipo({
            tipo,
            indicador
          })
        })
      )
    }

    if (indicador.slice(0, -1).at(-1) === 'contexto') {
      editarPropiedades = div(
        AgregarTipo({
          tipo: 'Contexto',
          indicador
        })
      )
    }
  }

  if (tipo !== undefined && tipo !== 'Nueva línea') {
    editarPropiedades = Object.keys(Tipo).map(propiedad => {
      let valor
      let confirmado = false
      const { tipo } = Tipo

      if (typeof Tipo[propiedad] === 'object' && tipo !== 'Contexto') {
        return null
      }

      if (propiedad === 'tipo') {
        return h2(
          {
            class: 'tipo'
          },
          Tipo[propiedad]
        )
      }

      if (propiedad === 'devolver') {
        if (JSON.stringify(indicador) === '[0]' || !esElÚltimoElemento) {
          return null
        }

        const elementoSuperior = get(Código.val, indicador.slice(0, -2))
        let elElementoSuperiorEsUnaLista = false
        if (elementoSuperior.tipo === 'Lista') {
          elElementoSuperiorEsUnaLista = true
        }

        if (elElementoSuperiorEsUnaLista) {
          return null
        }

        return div(
          {
            class: 'verificación'
          },
          input({
            'data-propiedad': JSON.stringify([...indicador, propiedad]),
            type: 'checkbox',
            checked: Tipo[propiedad],
            value: Tipo[propiedad],
            onchange: ({ target }) => {
              console.log('Se confirmó un cambio')
              if (target.checked) {
                target.value = true
              }
              if (!target.checked) {
                target.value = false
              }
              ActualizarPropiedad({ indicador, valor, propiedad, target })
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

      if (tipo === 'Contexto') {
        return PropiedadesDeContexto({ indicador, propiedad })
      }

      if (propiedad === 'asignación') {
        return PropiedadesDeAsignación({ indicador })
      }

      if (tipo === 'Lógica') {
        return PropiedadesDeLógica({ indicador })
      }

      let casilla = input

      if (tipo === 'Texto' || tipo === 'Comentario') {
        casilla = textarea
      }

      setTimeout(() => {
        if (tipo === 'Texto' && propiedad === 'valor') {
          const casilla = document.querySelector(`#propiedades [data-propiedad='${JSON.stringify([...indicador, 'valor'])}']`)
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
          value: Tipo[propiedad],
          'data-propiedad': JSON.stringify([...indicador, propiedad]),
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
            ActualizarPropiedad({ indicador, valor, propiedad, target })
          },
          onkeydown: event => {
            if (tipo !== 'Texto' && tipo !== 'Comentario') {
              return
            }

            const { key, shiftKey } = event
            if (key === 'Enter' && shiftKey) {
              event.preventDefault()
            }
          },
          onkeyup: ({ target, key, shiftKey }) => {
            if ((tipo === 'Texto' || tipo === 'Comentario') && (key === 'Enter' && !shiftKey)) {
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
            ActualizarPropiedad({ indicador, valor, target })
          }
        })
      )
    })
  }

  add(propiedades, editarPropiedades)
}

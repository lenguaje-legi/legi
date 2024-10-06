import Componente from '../Componente.js'
import { capitalize } from '../../módulos-de-node/lodash.js'
import AgregarTipo from './AgregarTipo.js'
import ActualizarPropiedad from './ActualizarPropiedad.js'
import PropiedadesDeContexto from '../propiedades/PropiedadesDeContexto.js'
import PropiedadesDeLógica from '../propiedades/PropiedadesDeLógica.js'
import PropiedadesDeAsignación from '../propiedades/PropiedadesDeAsignación.js'
import PropiedadesDeInstancia from '../propiedades/PropiedadesDeInstancia.js'
import PropiedadesDeFunción from '../propiedades/PropiedadesDeFunción.js'
import { Código } from '../inicio.js'
import Lenguaje from '../propiedades/Lenguaje.js'

const { elemento, anidarElementos } = Componente()

export default ({ tipo, indicador } = {}) => {
  const propiedades = document.querySelector('#propiedades')
  propiedades.innerHTML = ''

  let editarPropiedades

  let Tipo = Código.obtener({
    propiedad: indicador
  })

  if (!Tipo) {
    Tipo = {}
  }

  let últimoElemento = Código.obtener({
    propiedad: indicador.slice(0, -1)
  })

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
    esElÚltimoElemento = Código.obtener({
      propiedad: indicador.slice(0, -1)
    }).length === indicador.at(-1) + 1

    esLaÚltimaNuevaLínea = Código.obtener({
      propiedad: indicador.slice(0, -1)
    }).length === indicador.at(-1)
  }

  if (tipo === undefined) {
    editarPropiedades = Lenguaje({ indicador })
  }

  if (tipo === 'Nueva línea') {
    if (esLaÚltimaNuevaLínea && últimoElemento.devolver) {
      return null
    }

    if (indicador.slice(0, -1).at(-1) !== 'contexto') {
      editarPropiedades = elemento({
        etiqueta: 'div',
        elementos: [
          'Nulo',
          'Instancia',
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
      })
    }

    if (indicador.slice(0, -1).at(-1) === 'contexto') {
      editarPropiedades = elemento({
        etiqueta: 'div',
        elementos: AgregarTipo({
          tipo: 'Contexto',
          indicador
        })
      })
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
        return elemento({
          etiqueta: 'h2',
          atributos: {
            class: 'tipo'
          },
          elementos: Tipo[propiedad]
        })
      }

      if (propiedad === 'devolver') {
        if (JSON.stringify(indicador) === '[0]' || !esElÚltimoElemento) {
          return null
        }

        const elementoSuperior = Código.obtener({
          propiedad: indicador.slice(0, -2)
        })

        let elElementoSuperiorEsUnaLista = false
        if (elementoSuperior.tipo === 'Lista') {
          elElementoSuperiorEsUnaLista = true
        }

        if (elElementoSuperiorEsUnaLista) {
          return null
        }

        return elemento({
          etiqueta: 'div',
          atributos: {
            class: 'verificación'
          },
          elementos: [
            elemento({
              etiqueta: 'input',
              atributos: {
                dataPropiedad: JSON.stringify([...indicador, propiedad]),
                type: 'checkbox',
                checked: Tipo[propiedad],
                value: Tipo[propiedad]
              },
              eventos: {
                change: ({ target }) => {
                  console.log('Se confirmó un cambio')
                  if (target.checked) {
                    target.value = true
                  }
                  if (!target.checked) {
                    target.value = false
                  }
                  ActualizarPropiedad({ indicador, valor, propiedad, target })
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
              elementos: capitalize(propiedad)
            })
          ]
        })
      }

      if (tipo === 'Contexto') {
        return PropiedadesDeContexto({ indicador, propiedad })
      }

      if (propiedad === 'asignación') {
        return PropiedadesDeAsignación({ indicador })
      }

      if (tipo === 'Función') {
        return PropiedadesDeFunción({ indicador, propiedad })
      }

      if (propiedad === 'valor' && tipo === 'Instancia') {
        return null
      }

      if (propiedad === 'instancia' && Tipo.instancia === '') {
        return PropiedadesDeInstancia({ indicador, propiedad })
      }

      if (propiedad === 'instancia' && Tipo.instancia !== '') {
        return null
      }

      if (propiedad === 'devuelve' && Tipo.instancia !== '') {
        return PropiedadesDeInstancia({ indicador, propiedad })
      }

      if (propiedad === 'devuelve' && Tipo.instancia === '') {
        return null
      }

      if (tipo === 'Lógica') {
        return PropiedadesDeLógica({ indicador })
      }

      let casilla = propiedades => {
        return elemento({
          etiqueta: 'input',
          atributos: {
            value: Tipo[propiedad],
            dataPropiedad: JSON.stringify([...indicador, propiedad])
          },
          ...propiedades
        })
      }

      if (tipo === 'Texto' || tipo === 'Comentario') {
        casilla = propiedades => {
          return elemento({
            etiqueta: 'textarea',
            atributos: {
              dataPropiedad: JSON.stringify([...indicador, propiedad])
            },
            ...propiedades,
            elementos: Tipo[propiedad]
          })
        }
      }

      setTimeout(() => {
        if (tipo === 'Texto' && propiedad === 'valor') {
          const casilla = document.querySelector(`#propiedades [data-propiedad='${JSON.stringify([...indicador, 'valor'])}']`)
          casilla.style.height = ''
          casilla.style.height = `${casilla.scrollHeight}px`
        }
      }, 0)

      return elemento({
        etiqueta: 'div',
        atributos: {
          class: 'propiedad'
        },
        elementos: [
          elemento({
            etiqueta: 'p',
            elementos: capitalize(propiedad)
          }),
          casilla({
            eventos: {
              input: ({ target }) => {
                if (tipo === 'Texto' && propiedad === 'valor') {
                  target.style.height = ''
                  target.style.height = `${target.scrollHeight}px`
                }
              },
              focus: ({ target }) => {
                valor = target.value
                console.log('Se inició un cambio')
              },
              focusout: ({ target }) => {
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
              keydown: event => {
                if (tipo !== 'Texto' && tipo !== 'Comentario') {
                  return
                }

                const { key, shiftKey } = event
                if (key === 'Enter' && shiftKey) {
                  event.preventDefault()
                }
              },
              keyup: ({ target, key, shiftKey }) => {
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
            }
          })
        ]
      })
    })
  }

  anidarElementos({
    elemento: propiedades,
    elementos: editarPropiedades
  })
}

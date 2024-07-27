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

  let esElÚltimoElemento
  let esLaÚltimaNuevaLínea
  const esLaRaíz = JSON.stringify(indicador) === '[]'

  if (!esLaRaíz && JSON.stringify(indicador) !== '[0]' && JSON.stringify(indicador) !== '[0,"contexto",0]') {
    esElÚltimoElemento = get(Código.val, indicador.slice(0, -1)).length === indicador.at(-1) + 1
    esLaÚltimaNuevaLínea = get(Código.val, indicador.slice(0, -1)).length === indicador.at(-1)
  }

  const visualización = document.querySelector('#visualización')

  const actualizarPropiedad = ({ valor, propiedad, target }) => {
    if (target.value === 'true' || target.value === 'false') {
      if (esLaRaíz) {
        const visualizarLegi = target.value === 'true'
        if (!visualizarLegi) {
          visualización.classList.remove('legi')
        }

        if (visualizarLegi) {
          visualización.classList.add('legi')
        }
      }

      if (Tipo.tipo === 'Contexto') {
        Tipo[propiedad].tipos[Object.keys(Tipo[propiedad].tipos)[target.dataset.propiedad]] = target.value === 'true'
      }

      if (Tipo.tipo !== 'Contexto') {
        Tipo[propiedad] = target.value === 'true'
      }
    }

    if (Tipo.tipo === 'Número' && propiedad === 'valor') {
      if (target.value.trim() === '' || isNaN(target.value)) {
        target.value = valor
        return null
      }

      target.value = Number(target.value)
    }

    if (target.value !== 'true' && target.value !== 'false') {
      if (Tipo.tipo === 'Contexto') {
        Tipo[propiedad][target.dataset.propiedad] = target.value
      }

      if (Tipo.tipo !== 'Contexto') {
        Tipo[propiedad] = target.value
      }
    }

    Visualizar()
    if (!esLaRaíz) {
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
  }

  if (tipo === undefined) {
    editarPropiedades = [
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
                actualizarPropiedad({ target })
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
                actualizarPropiedad({ target })
              }
            }),
            p('PHP')
          )
        )
      )
    ]
  }

  if (tipo === 'Nueva línea') {
    if (esLaÚltimaNuevaLínea && últimoElemento.devolver) {
      return null
    }

    if (indicador.slice(0, -1).at(-1) !== 'contexto') {
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
        }),
        AgregarTipo({
          tipo: 'Comentario',
          indicador
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

      if (tipo === 'Contexto') {
        return [
          div(
            {
              class: 'propiedad'
            },
            p('Nombre'),
            input({
              value: Tipo[propiedad].nombre,
              'data-propiedad': 'nombre',
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
              onkeyup: ({ target, key, shiftKey }) => {
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
          ),
          (() => {
            return Object.keys(Tipo[propiedad].tipos).map((tipo, indicador) => {
              return div(
                {
                  class: 'verificación'
                },
                input({
                  type: 'checkbox',
                  checked: Tipo[propiedad].tipos[Object.keys(Tipo[propiedad].tipos)[indicador]],
                  value: Tipo[propiedad].tipos[Object.keys(Tipo[propiedad].tipos)[indicador]],
                  'data-propiedad': indicador,
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
                p(tipo)
              )
            })
          })()
        ]
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
                  if (Tipo[propiedad] === true) {
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
              p('Verdadero')
            ),
            div(
              input({
                type: 'radio',
                name: 'lógica',
                checked: (() => {
                  if (Tipo[propiedad] === false) {
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

      if (tipo === 'Texto' || tipo === 'Comentario') {
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
          value: Tipo[propiedad],
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
            actualizarPropiedad({ valor, propiedad, target })
          }
        })
      )
    })
  }

  add(propiedades, editarPropiedades)
}

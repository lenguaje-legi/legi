import Seleccionar from './Seleccionar.js'
import van from 'vanjs-core'
import { get } from 'lodash-es'
import { Código } from '../inicio.js'
const { div, pre, span } = van.tags

const Tipo = ({ tipo, bloquesDeEspacios, indicador, valor, asignación }) => {
  if (!tipo) {
    tipo = get(Código.val, indicador).tipo
  }

  if (asignación) {
    valor = `$${asignación} = ${valor}`
  }

  if (tipo === 'Función') {
    bloquesDeEspacios = bloquesDeEspacios + 1

    const función = get(Código.val, indicador)

    let devolver = ''

    if (función.devolver) {
      devolver = 'return '
    }

    const código = función.valor.map(({ valor }, indicadorDelElemento) => {
      const código = []
      código.push(Tipo({
        bloquesDeEspacios,
        indicador: [...indicador, 'valor', indicadorDelElemento],
        valor
      }))

      código.push(Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'valor', indicadorDelElemento + 1] }))

      return código
    })

    valor = [
      pre(
        span(
          {
            class: 'bloque-de-espacios'
          },
          `${'    '.repeat(bloquesDeEspacios - 1)}`
        ),
        span(
          {
            class: 'devolver'
          },
          devolver
        ),
        span(
          {
            class: 'función'
          },
          'function'
        ),
        span(
          {
            class: 'paréntesis'
          },
          ' ()'
        ),
        span(
          {
            class: 'llave'
          },
          ' {'
        )
      ),
      Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'valor', 0] }),
      código,
      pre(
        span(
          {
            class: 'bloque-de-espacios'
          },
          `${'    '.repeat(bloquesDeEspacios - 1)}`
        ),
        span(
          {
            class: 'llave'
          },
          '}'
        ),
        span(
          {
            class: 'punto-y-coma'
          },
          ';'
        )
      )
    ]
  }

  if (tipo === 'Número' || tipo === 'Lógica') {
    valor = pre(
      span(
        {
          class: 'bloque-de-espacios'
        },
        `${'    '.repeat(bloquesDeEspacios)}`
      ),
      valor,
      span(
        {
          class: 'punto-y-coma'
        },
        ';'
      )
    )
  }

  if (tipo === 'Texto') {
    valor = [
      pre(
        span(
          {
            class: 'bloque-de-espacios'
          },
          '    '.repeat(bloquesDeEspacios)
        ),
        span(
          {
            class: 'inicio-de-texto'
          },
          '<<<_'
        )
      ),
      (() => {
        if (valor === '') {
          return ''
        }

        valor = valor.split('\n').map(valor => {
          return pre(
            {
              class: 'texto'
            },
            span(
              {
                class: 'bloque-de-espacios'
              },
              '    '.repeat(bloquesDeEspacios + 1)
            ),
            valor
          )
        })

        return valor
      })(),
      pre(
        span(
          {
            class: 'bloque-de-espacios'
          },
          '    '.repeat(bloquesDeEspacios + 1)
        ),
        span(
          {
            class: 'final-de-texto'
          },
          '_'
        ),
        span(
          {
            class: 'punto-y-coma'
          },
          ';'
        )
      )
    ]
  }

  return div(
    {
      'data-indicador': (() => {
        if (tipo === 'Nueva línea') {
          return ''
        }
        return JSON.stringify(indicador)
      })(),
      class: `Tipo ${tipo.replaceAll(' ', '-')}`,
      onclick: (click) => {
        Seleccionar({ click, indicador, tipo })
      }
    },
    valor
  )
}

export default Tipo

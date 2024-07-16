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
        `${devolver}function () {`
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
        '};'
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
      `${valor};`
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
        '<<<_'
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
        {
          class: 'texto'
        },
        span(
          {
            class: 'bloque-de-espacios'
          },
          '    '.repeat(bloquesDeEspacios + 1)
        ),
        '_;'
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

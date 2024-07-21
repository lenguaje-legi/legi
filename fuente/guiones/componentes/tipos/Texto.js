import van from 'vanjs-core'
import { Código } from '../../inicio.js'
import { get } from 'lodash-es'
const { pre, span } = van.tags

export default ({ bloquesDeEspacios, indicador, valor }) => {
  const texto = get(Código.val, indicador)

  let devolver = ''

  if (texto.devolver) {
    devolver = 'return '
  }

  return [
    pre(
      span(
        {
          class: 'bloque-de-espacios'
        },
        '    '.repeat(bloquesDeEspacios)
      ),
      span(
        {
          class: 'devolver'
        },
        devolver
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

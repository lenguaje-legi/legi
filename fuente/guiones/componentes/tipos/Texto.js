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

  const elementoSuperior = get(Código.val, indicador.slice(0, -2))
  let elElementoSuperiorEsUnaLista = false
  if (elementoSuperior && elementoSuperior.tipo === 'Lista') {
    elElementoSuperiorEsUnaLista = true
  }

  return [
    pre(
      span(
        {
          class: 'bloque-de-espacios'
        },
        '    '.repeat(bloquesDeEspacios)
      ),
      (() => {
        if (!devolver) {
          return null
        }

        return span(
          {
            class: 'ruido devolver'
          },
          devolver
        )
      })(),
      span(
        {
          class: 'ruido valor inicio-de-texto'
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
          class: 'ruido final-de-texto'
        },
        '_'
      ),
      (() => {
        if (elElementoSuperiorEsUnaLista) {
          const elementosEnLaLista = elementoSuperior.valor.filter(elemento => {
            return elemento.tipo !== 'Comentario'
          })

          const esElÚltimoElemento = get(Código.val, indicador) === elementosEnLaLista.at(-1)

          if (esElÚltimoElemento) {
            return null
          }
          return span(
            {
              class: 'ruido coma'
            },
            ','
          )
        }

        return span(
          {
            class: 'ruido punto-y-coma'
          },
          ';'
        )
      })()
    )
  ]
}

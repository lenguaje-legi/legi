import { get } from 'lodash-es'
import Tipo from '../Tipo.js'
import { Código } from '../../inicio.js'
import van from 'vanjs-core'
const { pre, span } = van.tags

export default ({ bloquesDeEspacios, indicador }) => {
  bloquesDeEspacios = bloquesDeEspacios + 1

  const lista = get(Código.val, indicador)

  let devolver = ''

  if (lista.devolver) {
    devolver = 'return '
  }

  const código = lista.valor.map(({ valor }, indicadorDelElemento) => {
    const código = []
    código.push(Tipo({
      bloquesDeEspacios,
      indicador: [...indicador, 'valor', indicadorDelElemento],
      valor
    }))

    código.push(Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'valor', indicadorDelElemento + 1] }))

    return código
  })

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
          `${'    '.repeat(bloquesDeEspacios - 1)}`
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
          class: 'valor corchete'
        },
        '['
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
          class: 'corchete'
        },
        ']'
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

import SignoDeAsignación from '../signos/SignoDeAsignación.js'
import Tipo from '../Tipo.js'
import { get } from 'lodash-es'
import { Código } from '../../inicio.js'
import van from 'vanjs-core'
const { pre, span } = van.tags

export default ({ bloquesDeEspacios, indicador }) => {
  bloquesDeEspacios = bloquesDeEspacios + 1

  const función = get(Código.val, indicador)

  const { asignación } = función

  let devolver = ''

  if (función.devolver) {
    devolver = 'return '
  }

  const contexto = función.contexto.map(({ valor }, indicadorDelElemento) => {
    const código = []
    código.push(Tipo({
      bloquesDeEspacios,
      indicador: [...indicador, 'contexto', indicadorDelElemento],
      valor
    }))

    código.push(Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'contexto', indicadorDelElemento + 1] }))

    return código
  })

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

  const elementoSuperior = get(Código.val, indicador.slice(0, -2))
  let elElementoSuperiorEsUnaLista = false
  if (elementoSuperior && elementoSuperior.tipo === 'Lista') {
    elElementoSuperiorEsUnaLista = true
  }

  return [
    pre(
      span(
        {
          class: 'ruido bloque-de-espacios'
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
      SignoDeAsignación({ asignación }),
      span(
        {
          class: 'ruido valor función'
        },
        'function'
      )
    ),
    pre(
      span(
        {
          class: 'ruido bloque-de-espacios'
        },
          `${'    '.repeat(bloquesDeEspacios)}`
      ),
      span(
        {
          class: 'contexto'
        },
        span(
          {
            class: 'ruido'
          },
          '/* '
        ),
        'contexto ',
        span(
          {
            class: 'ruido'
          },
          '*/ '
        )
      ),
      span(
        {
          class: 'paréntesis-de-apertura'
        },
        '('
      )
    ),
    Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'contexto', 0] }),
    contexto,
    pre(
      span(
        {
          class: 'ruido bloque-de-espacios'
        },
          `${'    '.repeat(bloquesDeEspacios)}`
      ),
      span(
        {
          class: 'paréntesis-de-cierre'
        },
        ')'
      ),
      span(
        {
          class: 'ruido llave'
        },
        ' {'
      )
    ),
    Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'valor', 0] }),
    código,
    pre(
      span(
        {
          class: 'ruido bloque-de-espacios'
        },
          `${'    '.repeat(bloquesDeEspacios - 1)}`
      ),
      span(
        {
          class: 'ruido llave'
        },
        '}'
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

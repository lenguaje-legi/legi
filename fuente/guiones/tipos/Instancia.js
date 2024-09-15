import imprimir from '../funciones/imprimir.js'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import SignoDeDevolver from '../signos/SignoDeDevolver.js'
import SignoDeAsignación from '../signos/SignoDeAsignación.js'
import SignoDeCierre from '../signos/SignoDeCierre.js'
import van from 'vanjs-core'
import { get } from 'lodash-es'
import { Código } from '../inicio.js'
const { pre, span, style } = van.tags

const instancias = {
  imprimir
}

export default ({ bloquesDeEspacios, indicador }) => {
  const legi = document.querySelector('#visualización').classList.contains('legi')

  bloquesDeEspacios = bloquesDeEspacios + 1

  const función = get(Código.val, indicador)
  const { instancia } = función

  return (() => {
    if (!instancias[instancia]) {
      return [
        (() => {
          if (legi) {
            return style(`
              [data-indicador='${JSON.stringify(indicador)}']
              .ruido {
                margin-left: -0.9rem;
              }
            `)
          }
        })(),
        pre(
          BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
          SignoDeDevolver(función),
          SignoDeAsignación(función),
          span(
            {
              class: 'ruido'
            },
            '# '
          ),
          span('(')
        ),
        pre(
          BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
          span(
            {
              class: 'ruido'
            },
            '# '
          ),
          span(')'),
          SignoDeCierre({ indicador })
        )
      ]
    }

    return imprimir().valor({ bloquesDeEspacios, indicador })
  })()
}

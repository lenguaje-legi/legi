import imprimir from '../funciones/imprimir.js'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import SignoDeDevolver from '../signos/SignoDeDevolver.js'
import SignoDeAsignación from '../signos/SignoDeAsignación.js'
import SignoDeCierre from '../signos/SignoDeCierre.js'
import Estilo from '../Estilo.js'
import van from 'vanjs-core'
import { get } from 'lodash-es'
import { Código } from '../inicio.js'
const { pre, span, style } = van.tags

const instancias = {
  imprimir
}

Estilo({
  nombre: 'Instancia',
  css: {
    '#visualización': {

      ' .Instancia': {
        paddingBottom: '1.2rem !important',

        ' .instancia': {
          color: 'rgb(100, 100, 255)'
        },

        '> pre': {
          ':last-of-type': {
            color: 'rgb(100, 100, 255)'
          }
        }
      },

      '.legi': {

        ' .Instancia': {

          ' .instancia': {
            position: 'absolute',
            color: 'transparent',

            '+ pre': {
              paddingTop: '1.3rem'
            }
          },

          '> pre': {

            ':last-of-type': {
              position: 'absolute',
              color: 'transparent'
            }
          }
        }
      }

    }
  }
})

export default ({ bloquesDeEspacios, indicador }) => {
  const legi = document.querySelector('#visualización').classList.contains('legi')

  bloquesDeEspacios = bloquesDeEspacios + 1

  const función = get(Código.val, indicador)
  const { instancia } = función

  return (() => {
    const estilo = () => {
      if (legi) {
        return style(`
          [data-indicador='${JSON.stringify(indicador)}']
          .instancia::before {
            content: '${'    '.repeat(bloquesDeEspacios - 1)}▶️ ${instancia}';
            color: rgb(255, 100, 150);
            margin-left: -${(bloquesDeEspacios - 1) * 2.5}rem;
            filter: hue-rotate(250deg);
          }
        `)
      }
    }

    if (!instancias[instancia]) {
      return [
        estilo(),
        pre(
          {
            class: 'instancia'
          },
          BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
          SignoDeDevolver(función),
          SignoDeAsignación(función),
          span(
            {
              class: 'ruido'
            },
            '# ('
          )
        ),
        pre(
          BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
          span(
            {
              class: 'ruido'
            },
            '# )'
          ),
          SignoDeCierre({ indicador })
        )
      ]
    }

    return [
      estilo(),
      imprimir().valor({ bloquesDeEspacios, indicador })
    ]
  })()
}

import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import SignoDeDevolver from '../signos/SignoDeDevolver.js'
import SignoDeAsignación from '../signos/SignoDeAsignación.js'
import SignoDeCierre from '../signos/SignoDeCierre.js'
import Tipo from '../tipos/Tipo.js'
import { get } from 'lodash-es'
import { Código } from '../inicio.js'
import van from 'vanjs-core'
const { pre, span, style } = van.tags

export default () => {
  return {
    devuelve: 'Nulo',
    contexto: [
      {
        tipo: 'Texto',
        nombre: 'texto',
        valor: ''
      }
    ],
    valor: ({ bloquesDeEspacios, indicador }) => {
      const función = get(Código.val, indicador)
      const { contexto } = función

      const legi = document.querySelector('#visualización').classList.contains('legi')

      return [
        (() => {
          if (legi) {
            return style(`
              [data-indicador='${JSON.stringify(indicador)}']
              .instancia::before {
                content: '▶️ imprimir';
                color: #fff;
                filter: hue-rotate(250deg);
              }
            `)
          }
        })(),
        pre(
          {
            class: 'instancia'
          },
          pre(
            BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
            SignoDeDevolver(función),
            SignoDeAsignación(función),
            span('(function ($texto) {')
          ),
          pre(
            BloqueDeEspacios({ bloquesDeEspacios }),
            span('print($texto);')
          ),
          pre(
            BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
            span('})(...[')
          )
        ),
        (() => {
          return contexto.map((contexto, indicadorDelElemento) => {
            return pre(
              BloqueDeEspacios({ bloquesDeEspacios }),
              span(`'${contexto.nombre}'`),
              span(
                {
                  class: 'signo-de-asignación'
                },
                span(
                  {
                    class: 'ruido'
                  },
                  ' => '
                )
              ),
              Tipo({
                bloquesDeEspacios,
                indicador: [...indicador, 'contexto', indicadorDelElemento],
                valor: contexto.valor
              })
            )
          })
        })(),
        pre(
          BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
          span('])'),
          SignoDeCierre({ indicador })
        )
      ]
    }
  }
}

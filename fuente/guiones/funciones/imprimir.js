import van from '../../módulos-de-node/vanjs/van.js'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import SignoDeDevolver from '../signos/SignoDeDevolver.js'
import SignoDeAsignación from '../signos/SignoDeAsignación.js'
import SignoDeCierre from '../signos/SignoDeCierre.js'
import Tipo from '../tipos/Tipo.js'
import { Código } from '../inicio.js'
const { pre, span } = van.tags

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
      const función = Código.obtener({
        propiedad: indicador
      })

      const { contexto } = función

      return [
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
            {
              style: `margin-left: ${(bloquesDeEspacios - 1) * 2.5}rem;`
            },
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
              {
                style: 'margin-left: 2.5rem;'
              },
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

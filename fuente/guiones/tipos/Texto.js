import van from 'vanjs-core'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import SignoDeDevolver from '../signos/SignoDeDevolver.js'
import SignoDeAsignación from '../signos/SignoDeAsignación.js'
import SignoDeCierre from '../signos/SignoDeCierre.js'
import Estilo from '../Estilo.js'
import { Código } from '../inicio.js'
import { get } from 'lodash-es'
const { pre, span } = van.tags

Estilo({
  nombre: 'Texto',
  css: {
    '#visualización': {

      ' .Texto': {
        color: 'rgb(255, 255, 100)'
      }
    }
  }
})

export default ({ bloquesDeEspacios, indicador, valor }) => {
  const texto = get(Código.val, indicador)

  return [
    pre(
      BloqueDeEspacios({ bloquesDeEspacios }),
      SignoDeDevolver(texto),
      SignoDeAsignación(texto),
      span(
        {
          class: 'ruido valor inicio-de-texto'
        },
        '<<<_'
      )
    ),
    (() => {
      if (valor === '' || valor === undefined) {
        return ''
      }

      valor = valor.split('\n').map(valor => {
        return pre(
          {
            class: 'texto'
          },
          BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios + 1 }),
          valor
        )
      })

      return valor
    })(),
    pre(
      BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios + 1 }),
      span(
        {
          class: 'ruido final-de-texto'
        },
        '_'
      ),
      SignoDeCierre({ indicador })
    )
  ]
}

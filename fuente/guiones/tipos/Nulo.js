import Componente from '../Componente.js'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import SignoDeDevolver from '../signos/SignoDeDevolver.js'
import SignoDeAsignación from '../signos/SignoDeAsignación.js'
import SignoDeCierre from '../signos/SignoDeCierre.js'
import { Código } from '../inicio.js'
import { get } from 'lodash-es'

const { estilo, elemento } = Componente()

estilo({
  reglas: {
    '.nulo': {
      color: 'transparent',

      '::before': {
        content: '"👻"',
        color: '#fff'
      }
    }
  }
})

export default ({ bloquesDeEspacios, indicador }) => {
  const nulo = get(Código.val, indicador)

  return elemento({
    etiqueta: 'pre',
    elementos: [
      BloqueDeEspacios({ bloquesDeEspacios }),
      SignoDeDevolver(nulo),
      SignoDeAsignación(nulo),
      elemento({
        etiqueta: 'span',
        atributos: {
          class: {
            valor: true,
            nulo: document.querySelector('#visualización').classList.contains('legi')
          }
        },
        elementos: 'null'
      }),
      SignoDeCierre({ indicador })

    ]
  })
}

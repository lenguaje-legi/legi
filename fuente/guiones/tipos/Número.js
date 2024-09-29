import Componente from '../Componente.js'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import SignoDeDevolver from '../signos/SignoDeDevolver.js'
import SignoDeAsignación from '../signos/SignoDeAsignación.js'
import SignoDeCierre from '../signos/SignoDeCierre.js'
import { Código } from '../inicio.js'

const { estilo, elemento } = Componente()

estilo({
  reglas: {
    color: 'rgb(100, 255, 255)',

    '.valor': {

      '.legi': {
        border: '1px solid'
      }
    }
  }
})

export default ({ bloquesDeEspacios, indicador, valor }) => {
  const número = Código.obtener({
    propiedad: indicador
  })

  return elemento({
    etiqueta: 'pre',
    elementos: [
      BloqueDeEspacios({ bloquesDeEspacios }),
      SignoDeDevolver(número),
      SignoDeAsignación(número),
      elemento({
        etiqueta: 'span',
        atributos: {
          class: {
            valor: true,
            legi: document.querySelector('#visualización').classList.contains('legi')
          }
        },
        elementos: valor
      }),
      SignoDeCierre({ indicador })
    ]
  })
}

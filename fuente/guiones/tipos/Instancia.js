import Componente from '../Componente.js'
import imprimir from '../funciones/imprimir.js'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import SignoDeDevolver from '../signos/SignoDeDevolver.js'
import SignoDeAsignación from '../signos/SignoDeAsignación.js'
import SignoDeCierre from '../signos/SignoDeCierre.js'
import { Código } from '../inicio.js'

const { estilo, elemento } = Componente()

estilo({
  reglas: {
    '.instancia': {

      '::before': {
        content: '"▶️"',
        color: 'rgb(255, 100, 150)',
        filter: 'hue-rotate(250deg)'
      }
    }
  }
})

const instancias = {
  imprimir
}

export default ({ bloquesDeEspacios, indicador }) => {
  bloquesDeEspacios = bloquesDeEspacios + 1

  const función = Código.obtener({
    propiedad: indicador
  })
  const { instancia } = función

  return (() => {
    if (!instancias[instancia]) {
      return [
        elemento({
          etiqueta: 'pre',
          atributos: {
            class: 'instancia'
          },
          elementos: [
            BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
            SignoDeDevolver(función),
            SignoDeAsignación(función),
            elemento({
              etiqueta: 'span',
              atributos: {
                class: 'ruido'
              },
              elementos: '# ('
            })
          ]
        }),
        elemento({
          etiqueta: 'pre',
          elementos: [
            BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
            elemento({
              etiqueta: 'span',
              atributos: {
                class: 'ruido'
              },
              elementos: '# )'
            }),
            SignoDeCierre({ indicador })
          ]
        })
      ]
    }

    return [
      imprimir().valor({ bloquesDeEspacios, indicador })
    ]
  })()
}

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
    color: 'rgb(255, 255, 100)',

    '.inicio-de-texto': {
      color: 'rgba(255, 255, 0, 0.2)',

      '.legi': {

        '::before': {
          color: '#fff',
          content: '"✏️"'
        }
      }
    },

    '.texto': {
      marginLeft: '2.5rem',

      '.legi': {
        borderBottom: '1px solid rgba(150, 150, 0, 0.2)'
      }
    },

    '.final-de-texto': {
      color: 'rgba(255, 255, 0, 0.2)',
      marginLeft: '2.5rem'
    }
  }
})

export default ({ bloquesDeEspacios, indicador, valor }) => {
  const texto = get(Código.val, indicador)
  const legi = document.querySelector('#visualización').classList.contains('legi')

  return [
    elemento({
      etiqueta: 'pre',
      elementos: [
        BloqueDeEspacios({ bloquesDeEspacios }),
        SignoDeDevolver(texto),
        SignoDeAsignación(texto),
        elemento({
          etiqueta: 'span',
          atributos: {
            class: {
              ruido: true,
              valor: true,
              inicioDeTexto: true,
              legi
            }
          },
          elementos: '<<<_'
        })
      ]
    }),
    (() => {
      if (valor === '' || valor === undefined) {
        return ''
      }

      valor = valor.split('\n').map(valor => {
        return elemento({
          etiqueta: 'pre',
          atributos: {
            class: {
              texto: true,
              legi
            }
          },
          elementos: [
            BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios + 1 }),
            valor
          ]
        })
      })

      return valor
    })(),
    elemento({
      etiqueta: 'pre',
      elementos: [
        BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios + 1 }),
        elemento({
          etiqueta: 'span',
          atributos: {
            class: [
              'ruido',
              'final-de-texto'
            ]
          },
          elementos: '_'
        }),
        SignoDeCierre({ indicador })
      ]
    })
  ]
}

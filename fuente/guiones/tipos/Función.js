import Componente from '../Componente.js'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import SignoDeDevolver from '../signos/SignoDeDevolver.js'
import SignoDeAsignación from '../signos/SignoDeAsignación.js'
import SignoDeCierre from '../signos/SignoDeCierre.js'
import Tipo from './Tipo.js'
import { Código } from '../inicio.js'

const { estilo, elemento } = Componente()

estilo({
  global: true,
  reglas: {
    '#visualización': {

      ' .Función': {

        ' .contexto': {
          color: 'rgba(0, 255, 255, 0.2)'
        },

        ' .función': {
          color: 'rgb(100, 100, 255)'
        }
      },

      '.legi': {

        ' .Función': {

          ' .función': {

            '::before': {
              content: '"▶️"',
              color: '#fff'
            }
          }
        }
      }
    }
  }
})

export default ({ bloquesDeEspacios, indicador }) => {
  bloquesDeEspacios = bloquesDeEspacios + 1

  const función = Código.obtener({
    propiedad: indicador
  })

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

  return [
    elemento({
      etiqueta: 'pre',
      elementos: [
        BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
        SignoDeDevolver(función),
        SignoDeAsignación(función),
        elemento({
          etiqueta: 'span',
          atributos: {
            class: [
              'ruido',
              'valor',
              'función'
            ]
          },
          elementos: 'function'
        })
      ]
    }),
    elemento({
      etiqueta: 'pre',
      atributos: {
        style: 'margin-left: 2.5rem;'
      },
      elementos: [
        BloqueDeEspacios({ bloquesDeEspacios }),
        elemento({
          etiqueta: 'span',
          atributos: {
            class: 'contexto'
          },
          elementos: [
            elemento({
              etiqueta: 'span',
              atributos: {
                class: 'ruido'
              },
              elementos: '/* '
            }),
            'contexto ',
            elemento({
              etiqueta: 'span',
              atributos: {
                class: 'ruido'
              },
              elementos: '*/ '
            })
          ]
        }),
        elemento({
          etiqueta: 'span',
          atributos: {
            class: 'paréntesis-de-apertura'
          },
          elementos: '('
        })
      ]
    }),
    Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'contexto', 0] }),
    contexto,
    elemento({
      etiqueta: 'pre',
      elementos: [
        BloqueDeEspacios({ bloquesDeEspacios }),
        elemento({
          etiqueta: 'span',
          atributos: {
            style: 'margin-left: 2.5rem;',
            class: 'paréntesis-de-cierre'
          },
          elementos: ')'
        }),
        elemento({
          etiqueta: 'span',
          atributos: {
            class: [
              'ruido',
              'llave'
            ]
          },
          elementos: ' {'
        })
      ]
    }),
    Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'valor', 0] }),
    código,
    elemento({
      etiqueta: 'pre',
      elementos: [
        BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
        elemento({
          etiqueta: 'span',
          atributos: {
            class: [
              'ruido',
              'llave'
            ]
          },
          elementos: '}'
        }),
        SignoDeCierre({ indicador })
      ]
    })
  ]
}

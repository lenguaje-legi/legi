import Componente from '../Componente.js'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import SignoDeDevolver from '../signos/SignoDeDevolver.js'
import SignoDeAsignación from '../signos/SignoDeAsignación.js'
import SignoDeCierre from '../signos/SignoDeCierre.js'
import Tipo from '../tipos/Tipo.js'
import { Código } from '../inicio.js'

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
      const { estilo, elemento } = Componente()

      estilo({
        reglas: {
          color: 'rgb(100, 100, 255)',

          '.legi': {
            color: 'transparent',

            ' *': {
              color: 'transparent'
            }
          },

          '.instancia': {

            '.legi': {
              position: 'absolute',

              '+ pre': {
                paddingTop: '1.3rem'
              },

              '::before': {
                content: `"${'    '.repeat(bloquesDeEspacios - 1)}▶️ imprimir"`,
                color: 'rgb(255, 100, 150)',
                marginLeft: `-${(bloquesDeEspacios - 1) * 2.5}rem`,
                filter: 'hue-rotate(250deg)'
              }
            }
          }
        }
      })

      const función = Código.obtener({
        propiedad: indicador
      })

      const { contexto } = función
      const legi = document.querySelector('#visualización').classList.contains('legi')

      return [
        elemento({
          etiqueta: 'pre',
          atributos: {
            class: {
              instancia: true,
              legi
            }
          },
          elementos: [
            elemento({
              etiqueta: 'pre',
              elementos: [
                BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
                SignoDeDevolver(función),
                SignoDeAsignación(función),
                elemento({
                  etiqueta: 'span',
                  elementos: '(function ($texto) {'
                })
              ]
            }),
            elemento({
              etiqueta: 'pre',
              atributos: {
                style: `margin-left: ${(bloquesDeEspacios - 1) * 2.5}rem;`
              },
              elementos: [
                BloqueDeEspacios({ bloquesDeEspacios }),
                elemento({
                  etiqueta: 'span',
                  elementos: 'print($texto);'
                })
              ]
            }),
            elemento({
              etiqueta: 'pre',
              elementos: [
                BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
                elemento({
                  etiqueta: 'span',
                  elementos: '})(...['
                })
              ]
            })
          ]
        }),
        (() => {
          return contexto.map((contexto, indicadorDelElemento) => {
            return elemento({
              etiqueta: 'pre',
              atributos: {
                style: 'margin-left: 2.5rem;'
              },
              elementos: [
                BloqueDeEspacios({ bloquesDeEspacios }),
                elemento({
                  etiqueta: 'span',
                  elementos: `'${contexto.nombre}'`
                }),
                elemento({
                  etiqueta: 'span',
                  atributos: {
                    class: 'signo-de-asignación'
                  },
                  elementos: elemento({
                    etiqueta: 'span',
                    atributos: {
                      class: 'ruido'
                    },
                    elementos: ' => '
                  })
                }),
                Tipo({
                  bloquesDeEspacios,
                  indicador: [...indicador, 'contexto', indicadorDelElemento],
                  valor: contexto.valor
                })

              ]
            })
          })
        })(),
        elemento({
          etiqueta: 'pre',
          elementos: [
            BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
            elemento({
              etiqueta: 'span',
              atributos: {
                class: {
                  legi
                }
              },
              elementos: '])'
            }),
            SignoDeCierre({ indicador })
          ]
        })
      ]
    }
  }
}

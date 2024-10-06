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

      '.legi': {

        ' .Lista': {

          '> pre': {

            ':first-of-type': {

              '::before': {
                content: '"📃"',
                color: '#fff'
              }
            }
          }
        }
      }
    }
  }
})

export default ({ bloquesDeEspacios, indicador }) => {
  bloquesDeEspacios = bloquesDeEspacios + 1

  const lista = Código.obtener({
    propiedad: indicador
  })

  const código = lista.valor.map(({ valor }, indicadorDelElemento) => {
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
        SignoDeDevolver(lista),
        SignoDeAsignación(lista),
        elemento({
          etiqueta: 'span',
          atributos: {
            class: [
              'ruido',
              'corchete'
            ]
          },
          elementos: '['
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
              'corchete'
            ]
          },
          elementos: ']'
        }),
        SignoDeCierre({ indicador })
      ]
    })
  ]
}

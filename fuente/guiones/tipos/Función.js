import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import SignoDeDevolver from '../signos/SignoDeDevolver.js'
import SignoDeAsignación from '../signos/SignoDeAsignación.js'
import SignoDeCierre from '../signos/SignoDeCierre.js'
import Tipo from './Tipo.js'
import Estilo from '../Estilo.js'
import { Código } from '../inicio.js'
import van from 'vanjs-core'
const { pre, span } = van.tags

Estilo({
  nombre: 'Función',
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
    pre(
      BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
      SignoDeDevolver(función),
      SignoDeAsignación(función),
      span(
        {
          class: 'ruido valor función'
        },
        'function'
      )
    ),
    pre(
      {
        style: 'margin-left: 2.5rem;'
      },
      BloqueDeEspacios({ bloquesDeEspacios }),
      span(
        {
          class: 'contexto'
        },
        span(
          {
            class: 'ruido'
          },
          '/* '
        ),
        'contexto ',
        span(
          {
            class: 'ruido'
          },
          '*/ '
        )
      ),
      span(
        {
          class: 'paréntesis-de-apertura'
        },
        '('
      )
    ),
    Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'contexto', 0] }),
    contexto,
    pre(
      BloqueDeEspacios({ bloquesDeEspacios }),
      span(
        {
          style: 'margin-left: 2.5rem;',
          class: 'paréntesis-de-cierre'
        },
        ')'
      ),
      span(
        {
          class: 'ruido llave'
        },
        ' {'
      )
    ),
    Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'valor', 0] }),
    código,
    pre(
      BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
      span(
        {
          class: 'ruido llave'
        },
        '}'
      ),
      SignoDeCierre({ indicador })
    )
  ]
}

import Seleccionar from './Seleccionar.js'
import van from 'vanjs-core'
import { get } from 'lodash-es'
import { Código } from '../inicio.js'
import Función from './tipos/Función.js'
import Lista from './tipos/Lista.js'
import Lógica from './tipos/Lógica.js'
import Número from './tipos/Número.js'
import Texto from './tipos/Texto.js'
const { div } = van.tags

export default ({ tipo, bloquesDeEspacios, indicador, valor, asignación }) => {
  if (!tipo) {
    tipo = get(Código.val, indicador).tipo
  }

  if (asignación) {
    valor = `$${asignación} = ${valor}`
  }

  if (tipo === 'Función') {
    valor = Función({ bloquesDeEspacios, indicador })
  }

  if (tipo === 'Lista') {
    valor = Lista({ bloquesDeEspacios, indicador })
  }

  if (tipo === 'Lógica') {
    valor = Lógica({ bloquesDeEspacios, valor })
  }

  if (tipo === 'Número') {
    valor = Número({ bloquesDeEspacios, valor })
  }

  if (tipo === 'Texto') {
    valor = Texto({ bloquesDeEspacios, valor })
  }

  return div(
    {
      'data-indicador': (() => {
        if (tipo === 'Nueva línea') {
          return ''
        }
        return JSON.stringify(indicador)
      })(),
      class: `Tipo ${tipo.replaceAll(' ', '-')}`,
      onclick: (click) => {
        Seleccionar({ click, indicador, tipo })
      }
    },
    valor
  )
}

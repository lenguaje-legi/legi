import Seleccionar from '../acciones/Seleccionar.js'
import van from 'vanjs-core'
import { get } from 'lodash-es'
import { Código } from '../inicio.js'
import Nulo from './Nulo.js'
import Instancia from './Instancia.js'
import Función from './Función.js'
import Contexto from './Contexto.js'
import Lista from './Lista.js'
import Lógica from './Lógica.js'
import Número from './Número.js'
import Texto from './Texto.js'
import Comentario from './Comentario.js'
import ErrorDeAsignación from '../errores/ErrorDeAsignación.js'
const { div } = van.tags

export default ({ tipo, bloquesDeEspacios, indicador, valor, asignación }) => {
  if (!tipo) {
    tipo = get(Código.val, indicador).tipo
  }

  if (asignación) {
    valor = `$${asignación} = ${valor}`
  }

  if (tipo === 'Nulo') {
    valor = Nulo({ bloquesDeEspacios, indicador })
  }

  if (tipo === 'Instancia') {
    valor = Instancia({ bloquesDeEspacios, indicador })
  }

  if (tipo === 'Función') {
    valor = Función({ bloquesDeEspacios, indicador, valor })
  }

  if (tipo === 'Contexto') {
    valor = Contexto({ bloquesDeEspacios, indicador, valor })
  }

  if (tipo === 'Lista') {
    valor = Lista({ bloquesDeEspacios, indicador })
  }

  if (tipo === 'Lógica') {
    valor = Lógica({ bloquesDeEspacios, indicador, valor })
  }

  if (tipo === 'Número') {
    valor = Número({ bloquesDeEspacios, indicador, valor })
  }

  if (tipo === 'Texto') {
    valor = Texto({ bloquesDeEspacios, indicador, valor })
  }

  if (tipo === 'Comentario') {
    valor = Comentario({ bloquesDeEspacios, valor })
  }

  let error = ''

  if (tipo !== 'Nueva línea' && ErrorDeAsignación({ indicador })) {
    error = 'error '
  }

  return div(
    {
      'data-indicador': (() => {
        if (tipo === 'Nueva línea') {
          return ''
        }
        return JSON.stringify(indicador)
      })(),
      class: `${error}Tipo ${tipo.replaceAll(' ', '-')}`,
      onclick: (click) => {
        Seleccionar({ click, indicador, tipo })
      }
    },
    valor
  )
}

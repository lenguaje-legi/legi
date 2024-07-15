import Seleccionar from './Seleccionar.js'
import van from 'vanjs-core'
import { get } from 'lodash-es'
import { Código } from '../inicio.js'
const { div, pre } = van.tags

const Tipo = ({ tipo, bloquesDeEspacios, indicador, valor, asignación }) => {
  if (!tipo) {
    tipo = get(Código.val, indicador).tipo
  }

  if (asignación) {
    valor = `$${asignación} = ${valor}`
  }

  if (tipo === 'Ámbito') {
    bloquesDeEspacios = bloquesDeEspacios + 1

    const ámbito = get(Código.val, indicador)

    let devolver = ''

    if (ámbito.devolver) {
      devolver = 'return '
    }

    const código = ámbito.código.map(({ tipo, valor }, indicadorDelElemento) => {
      const código = []
      código.push(Tipo({
        bloquesDeEspacios,
        indicador: [...indicador, 'código', indicadorDelElemento],
        valor
      }))

      código.push(Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'código', indicadorDelElemento + 1] }))

      return código
    })

    valor = [
      pre(`${devolver}function () {`),
      Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'código', 0] }),
      código,
      pre('};')
    ]
  }

  if (tipo === 'Número') {
    valor = pre(`${'    '.repeat(bloquesDeEspacios)}${valor};`)
  }

  if (tipo === 'Texto') {
    valor = pre(`${'    '.repeat(bloquesDeEspacios)}<<<_\n${(() => {
      if (valor === '') {
        return ''
      }

      valor = valor.split('\n').map(valor => {
        return `${'    '.repeat(bloquesDeEspacios + 1)}${valor}`
      })

      return valor.join('\n')
    })()}\n${'    '.repeat(bloquesDeEspacios + 1)}_;`)
  }

  if (tipo === 'Lógica') {
    valor = pre(`${'    '.repeat(bloquesDeEspacios)}${valor};`)
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

export default Tipo

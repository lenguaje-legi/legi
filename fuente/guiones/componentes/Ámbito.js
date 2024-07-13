import NuevaLínea from './NuevaLínea.js'
import Seleccionar from './Seleccionar.js'
import Número from './Número.js'
import { Código } from '../inicio.js'
import van from 'vanjs-core'
import { get } from 'lodash-es'
const { div, pre } = van.tags

export default ({ bloquesDeEspacios, indicador }) => {
  bloquesDeEspacios = bloquesDeEspacios + 1

  const ámbito = get(Código.val, indicador)

  let devolver = ''

  if (ámbito.devolver) {
    devolver = 'return '
  }

  const código = ámbito.código.map(({ tipo, valor }, indicadorDelElemento) => {
    const código = []
    if (tipo === 'Número') {
      código.push(Número({
        bloquesDeEspacios,
        indicador: [...indicador, 'código', indicadorDelElemento],
        valor
      }))
    }

    código.push(NuevaLínea({ bloquesDeEspacios, indicador: [...indicador, 'código', indicadorDelElemento + 1] }))

    return código
  })

  return div(
    {
      'data-indicador': JSON.stringify(indicador),
      class: 'Ámbito',
      onclick: click => {
        Seleccionar({ click, indicador })
      }
    },
    pre(`${devolver}function () {`),
    NuevaLínea({ bloquesDeEspacios, indicador: [...indicador, 'código', 0] }),
    código,
    pre('};')
  )
}

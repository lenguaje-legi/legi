import Seleccionar from './Seleccionar.js'
import van from 'vanjs-core'
const { div } = van.tags

export default ({ bloquesDeEspacios, indicador }) => {
  const tipo = 'Nueva línea'

  return div(
    {
      class: 'Nueva-línea',
      onclick: click => {
        Seleccionar({ click, indicador, tipo })
      }
    }
  )
}

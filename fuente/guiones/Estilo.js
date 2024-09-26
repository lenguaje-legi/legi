import van from 'vanjs-core'
import CSS from './CSS.js'
const { add } = van
const { style } = van.tags

export default ({ identificadorDelComponente, nombre, reglas }) => {
  const estilo = document.querySelector(`#estilo-${nombre}`)

  if (identificadorDelComponente) {
    nombre = identificadorDelComponente
  }

  if (estilo) {
    return null
  }

  add(document.body, style(
    {
      id: `estilo-${nombre}`
    },
    CSS({
      reglas,
      identificadorDelComponente
    })
  ))
}

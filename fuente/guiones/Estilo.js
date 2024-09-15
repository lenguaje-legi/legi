import van from 'vanjs-core'
import CSS from './CSS.js'
const { add } = van
const { style } = van.tags

export default ({ nombre, css }) => {
  const estilo = document.querySelector(`#${nombre}-estilo`)

  if (estilo) {
    return null
  }

  add(document.body, style(
    {
      id: `${nombre}-estilo`
    },
    CSS(css)
  ))
}

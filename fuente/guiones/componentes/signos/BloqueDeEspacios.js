import van from 'vanjs-core'
const { span } = van.tags

export default ({ bloquesDeEspacios }) => {
  return span(
    {
      class: 'ruido bloque-de-espacios'
    },
    `${'    '.repeat(bloquesDeEspacios)}`
  )
}

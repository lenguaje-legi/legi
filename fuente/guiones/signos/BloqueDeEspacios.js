import van from 'vanjs-core'
const { span } = van.tags

export default ({ bloquesDeEspacios }) => {
  if (bloquesDeEspacios === 0) {
    return null
  }

  return [...Array(bloquesDeEspacios).keys()].map(() => {
    return span(
      {
        class: 'bloque-de-espacios'
      },
      '    '
    )
  })
}

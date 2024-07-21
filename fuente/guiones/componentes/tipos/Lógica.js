import van from 'vanjs-core'
const { pre, span } = van.tags

export default ({ bloquesDeEspacios, valor }) => {
  return pre(
    span(
      {
        class: 'bloque-de-espacios'
      },
          `${'    '.repeat(bloquesDeEspacios)}`
    ),
    valor,
    span(
      {
        class: 'punto-y-coma'
      },
      ';'
    )
  )
}

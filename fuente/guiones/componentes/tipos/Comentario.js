import van from 'vanjs-core'
const { pre, span } = van.tags

export default ({ bloquesDeEspacios, valor }) => {
  return valor.split('\n').map(valor => {
    return pre(
      span(
        {
          class: 'bloque-de-espacios'
        },
        '    '.repeat(bloquesDeEspacios)
      ),
      span(
        {
          class: 'signo-de-número'
        },
        '# '
      ),
      valor
    )
  })
}

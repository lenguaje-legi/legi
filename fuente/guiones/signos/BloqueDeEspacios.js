import Componente from '../Componente'

const { estilo, elemento } = Componente()

estilo({
  reglas: {
    marginLeft: '-2.5rem'
  }
})

export default ({ bloquesDeEspacios }) => {
  if (bloquesDeEspacios === 0) {
    return null
  }

  return [...Array(bloquesDeEspacios).keys()].map(() => {
    return elemento({
      etiqueta: 'span',
      atributos: {
        class: 'bloque-de-espacios'
      },
      elementos: '    '
    }
    )
  })
}

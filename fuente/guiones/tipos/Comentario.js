import Componente from '../Componente.js'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'

const { estilo, elemento } = Componente()

estilo({
  reglas: {
    '.legi': {
      paddingBottom: '1.3rem',

      ' .comentario': {
        marginLeft: '-1.3rem'
      },

      '::before': {
        content: '"💬"'
      },

      ' pre': {
        borderBottom: '1px solid rgba(100, 100, 100, 0.2)',
        marginLeft: '1.3rem'
      }
    }
  }
})

export default ({ bloquesDeEspacios, valor }) => {
  return elemento({
    etiqueta: 'pre',
    atributos: {
      class: {
        legi: document.querySelector('#visualización').classList.contains('legi')
      }
    },
    elementos: (() => {
      return valor.split('\n').map(valor => {
        return elemento({
          etiqueta: 'pre',
          elementos: [
            BloqueDeEspacios({ bloquesDeEspacios }),
            elemento({
              etiqueta: 'span',
              atributos: {
                class: 'ruido signo-de-número'
              },
              elementos: '# '
            }),
            elemento({
              etiqueta: 'span',
              atributos: {
                class: 'comentario'
              },
              elementos: valor
            })
          ]
        })
      })
    })()
  })
}

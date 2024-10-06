import Componente from '../Componente.js'
import { Código } from '../inicio.js'

const { elemento } = Componente()

export default ({ asignación }) => {
  if (!asignación) {
    return null
  }

  return [
    elemento({
      etiqueta: 'span',
      atributos: {
        class: [
          'ruido',
          'signo-de-dólar'
        ]
      },
      elementos: '$'
    }),
    elemento({
      etiqueta: 'span',
      atributos: {
        class: 'asignación'
      },
      elementos: `${Código.obtener({
        propiedad: [...JSON.parse(asignación), 'valor', 'nombre']
      })}`
    }),
    elemento({
      etiqueta: 'span',
      atributos: {
        class: 'signo-de-asignación'
      },
      elementos: elemento({
        etiqueta: 'span',
        atributos: {
          class: 'ruido'
        },
        elementos: ' = '
      })
    })
  ]
}

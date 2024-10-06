import Componente from '../Componente.js'
import BloqueDeEspacios from '../signos/BloqueDeEspacios.js'
import { Código } from '../inicio.js'

const { elemento } = Componente()

export default ({ bloquesDeEspacios, indicador, valor }) => {
  const contexto = Código.obtener({
    propiedad: indicador
  })

  return elemento({
    etiqueta: 'pre',
    elementos: [
      BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios + 1 }),
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
      contexto.valor.nombre
    ]
  })
}

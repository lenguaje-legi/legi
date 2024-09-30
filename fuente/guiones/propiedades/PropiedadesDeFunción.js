import van from '../../módulos-de-node/vanjs/van.js'
import ActualizarPropiedad from '../acciones/ActualizarPropiedad.js'
import { Código } from '../inicio.js'
const { p, div, input, span } = van.tags

export default ({ indicador }) => {
  let valor

  const Tipo = Código.obtener({
    propiedad: indicador
  })

  return [
    (() => {
      return [
        'Función',
        'Lista',
        'Lógica',
        'Número',
        'Texto',
        'Nulo'
      ].map((tipo) => {
        return div(
          {
            class: 'elección'
          },
          input({
            type: 'radio',
            name: 'devuelve',
            checked: Tipo.devuelve === tipo,
            value: tipo,
            'data-propiedad': JSON.stringify([...indicador, 'devuelve']),
            onchange: ({ target }) => {
              console.log('Se confirmó un cambio')
              ActualizarPropiedad({ indicador, valor, target })
            }
          }),
          span({
            class: 'marca',
            onclick: ({ target }) => {
              target.parentNode.childNodes[0].click()
            }
          }),
          p(tipo)
        )
      })
    })()
  ]
}

import Componente from '../Componente.js'
import ActualizarPropiedad from '../acciones/ActualizarPropiedad.js'
import Elección from '../componentes/Elección.js'

const { elemento } = Componente()

export default ({ indicador }) => {
  const visualización = document.querySelector('#visualización')

  return [
    elemento({
      etiqueta: 'h2',
      atributos: {
        class: 'tipo'
      },
      elementos: 'Visualización'
    }),
    Elección([
      {
        nombre: 'Legi',
        valor: true,
        seleccionado: (() => {
          if (visualización.classList.contains('legi')) {
            return true
          }
        })(),
        alSeleccionar: ({ target }) => {
          console.log('Se confirmó un cambio')
          if (target.checked) {
            target.value = true
          }
          ActualizarPropiedad({ indicador, target })
        }
      },
      {
        nombre: 'PHP',
        valor: false,
        seleccionado: (() => {
          if (!visualización.classList.contains('legi')) {
            return true
          }
        })(),
        alSeleccionar: ({ target }) => {
          console.log('Se confirmó un cambio')
          if (target.checked) {
            target.value = false
          }
          ActualizarPropiedad({ indicador, target })
        }
      }
    ])
  ]
}

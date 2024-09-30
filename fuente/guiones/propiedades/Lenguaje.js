import van from '../../módulos-de-node/vanjs/van.js'
import ActualizarPropiedad from '../acciones/ActualizarPropiedad.js'
import Elección from '../componentes/Elección.js'
const { h2 } = van.tags
const visualización = document.querySelector('#visualización')

export default ({ indicador }) => {
  return [
    h2(
      {
        class: 'tipo'
      },
      'Visualización'
    ),
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

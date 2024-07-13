import van from 'vanjs-core'
import Ámbito from './Ámbito.js'
const { add } = van

export default () => {
  const visualización = document.querySelector('#visualización')
  visualización.innerHTML = ''
  add(visualización, Ámbito({
    bloquesDeEspacios: 0,
    indicador: [0],
    nivel: 0
  }))
}

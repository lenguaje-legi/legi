import van from 'vanjs-core'
import Tipo from './Tipo.js'
const { add } = van

export default () => {
  const visualización = document.querySelector('#visualización')
  visualización.innerHTML = ''
  add(visualización, Tipo({
    bloquesDeEspacios: 0,
    indicador: [0]
  }))
}

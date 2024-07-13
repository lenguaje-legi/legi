import Visualizar from './componentes/Visualizar.js'
import van from 'vanjs-core'

export const Código = van.state([
  {
    tipo: 'Ámbito',
    devolver: true,
    código: []
  }
])

export const Acción = van.state('')

Visualizar()

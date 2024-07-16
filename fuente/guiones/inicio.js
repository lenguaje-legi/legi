import Visualizar from './componentes/Visualizar.js'
import van from 'vanjs-core'

export const Código = van.state([
  {
    tipo: 'Función',
    devolver: true,
    valor: []
  }
])

export const Acción = van.state('')

Visualizar()

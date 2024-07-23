import Visualizar from './componentes/Visualizar.js'
import van from 'vanjs-core'

export const Código = van.state([
  {
    tipo: 'Función',
    devolver: true,
    contexto: [],
    valor: []
  }
])

export const Acción = van.state('')

Visualizar()

import Visualizar from './componentes/Visualizar.js'
import van from 'vanjs-core'
import Seleccionar from './componentes/Seleccionar.js'

export const Código = van.state([
  {
    tipo: 'Función',
    devolver: true,
    contexto: [],
    valor: []
  }
])

export const Acción = van.state('')

const visualización = document.querySelector('#visualización')
visualización.onclick = click => {
  Seleccionar({ click, indicador: [] })
}

Visualizar()

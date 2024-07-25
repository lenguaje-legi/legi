import EditarPropiedades from './EditarPropiedades.js'
import { Código } from '../inicio.js'
import { get } from 'lodash-es'

let selección

export default ({ click, indicador, tipo }) => {
  click.stopPropagation()
  let elemento
  if (click.target.classList.contains('Nueva-línea')) {
    elemento = click.target
  }
  if (!elemento) {
    elemento = document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`)
  }

  if (selección === elemento) {
    return
  }

  selección = elemento
  console.log('Se hizo una selección')

  const seleccionado = document.querySelector('.seleccionado')
  if (seleccionado) {
    seleccionado.classList.remove('seleccionado')
  }

  if (!tipo) {
    tipo = get(Código.val, indicador)
  }

  const esLaRaíz = JSON.stringify(indicador) === '[]'

  if (!esLaRaíz) {
    elemento.classList.add('seleccionado')
  }

  EditarPropiedades({ tipo, indicador })
}

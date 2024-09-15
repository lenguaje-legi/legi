import Visualizar from './Visualizar.js'
import { Código } from '../inicio.js'
import { set, get } from 'lodash-es'
const visualización = document.querySelector('#visualización')

export default ({ indicador, valor, target }) => {
  const esLaRaíz = JSON.stringify(indicador) === '[]'

  let Tipo = get(Código.val, indicador)
  if (!Tipo) {
    Tipo = {}
  }

  if (target.value === 'true' || target.value === 'false') {
    if (esLaRaíz) {
      const visualizarLegi = target.value === 'true'
      if (!visualizarLegi) {
        visualización.classList.remove('legi')
      }

      if (visualizarLegi) {
        visualización.classList.add('legi')
      }
    }

    if (!esLaRaíz) {
      set(
        Código.val,
        JSON.parse(target.dataset.propiedad),
        target.value === 'true'
      )
    }
  }

  if (Tipo.tipo === 'Número' && JSON.parse(target.dataset.propiedad).at(-1) === 'valor') {
    if (target.value.trim() === '' || isNaN(target.value)) {
      target.value = valor
      return null
    }

    target.value = Number(target.value)
  }

  if (target.value !== 'true' && target.value !== 'false') {
    if (target.tagName !== 'SELECT' && (target.value.trim() === '' || target.value.trim() === valor)) {
      target.value = valor
      return null
    }

    set(
      Código.val,
      JSON.parse(target.dataset.propiedad),
      target.value
    )
  }

  Visualizar()
  if (!esLaRaíz) {
    document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('editado')
    document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('seleccionado')
    setTimeout(() => {
      document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.remove('seleccionado')
    }, 100)
    setTimeout(() => {
      document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('seleccionado')
    }, 250)
    setTimeout(() => {
      document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.remove('editado')
    }, 350)
  }
}

import van from 'vanjs-core'
import { get } from 'lodash-es'
import { Código } from '../inicio.js'
const { span } = van.tags

export default ({ indicador }) => {
  const elementoSuperior = get(Código.val, indicador.slice(0, -2))
  let elElementoSuperiorEsUnaLista = false
  if (elementoSuperior && (elementoSuperior.tipo === 'Lista' || elementoSuperior.tipo === 'Instancia')) {
    elElementoSuperiorEsUnaLista = true
  }

  if (elElementoSuperiorEsUnaLista) {
    let esElÚltimoElemento = false
    if (elementoSuperior.tipo !== 'Instancia') {
      const elementosEnLaLista = elementoSuperior.valor.filter(elemento => {
        return elemento.tipo !== 'Comentario'
      })

      esElÚltimoElemento = get(Código.val, indicador) === elementosEnLaLista.at(-1)
    }

    if (elementoSuperior.tipo === 'Instancia') {
      esElÚltimoElemento = get(Código.val, indicador) === get(Código.val, indicador.slice(0, -2)).contexto.at(-1)
    }

    if (esElÚltimoElemento) {
      return null
    }
    return span(
      {
        class: 'ruido coma'
      },
      ','
    )
  }

  return span(
    {
      class: 'ruido punto-y-coma'
    },
    ';'
  )
}

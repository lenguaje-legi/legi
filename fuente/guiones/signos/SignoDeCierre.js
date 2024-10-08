import Componente from '../Componente.js'
import { Código } from '../inicio.js'

const { elemento } = Componente()

export default ({ indicador }) => {
  const elementoSuperior = Código.obtener({
    propiedad: indicador.slice(0, -2)
  })

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

      esElÚltimoElemento = Código.obtener({
        propiedad: indicador
      }) === elementosEnLaLista.at(-1)
    }

    if (elementoSuperior.tipo === 'Instancia') {
      esElÚltimoElemento = Código.obtener({
        propiedad: indicador
      }) === Código.obtener({
        propiedad: indicador.slice(0, -2)
      }).contexto.at(-1)
    }

    if (esElÚltimoElemento) {
      return null
    }
    return elemento({
      etiqueta: 'span',
      atributos: {
        class: 'ruido coma'
      },
      elementos: ','
    })
  }

  return elemento({
    etiqueta: 'span',
    atributos: {
      class: 'ruido punto-y-coma'
    },
    elementos: ';'
  })
}

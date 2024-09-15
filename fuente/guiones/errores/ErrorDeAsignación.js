import { Código } from '../inicio.js'
import { get } from 'lodash-es'

export default ({ indicador }) => {
  const { tipo, asignación, devuelve } = get(Código.val, indicador)
  if (!asignación) {
    return
  }

  const contexto = get(Código.val, JSON.parse(asignación))

  if (contexto) {
    if (tipo === 'Instancia') {
      return contexto.valor.tipo !== devuelve
    }

    return contexto.valor.tipo !== tipo
  }
}

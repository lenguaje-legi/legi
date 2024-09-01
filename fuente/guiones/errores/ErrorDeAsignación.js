import { Código } from '../inicio.js'
import { get } from 'lodash-es'

export default ({ indicador }) => {
  const { tipo, asignación } = get(Código.val, indicador)
  if (!asignación) {
    return
  }

  const contexto = get(Código.val, JSON.parse(asignación))

  if (contexto) {
    return !contexto.valor.tipos[tipo]
  }
}

import { Código } from '../inicio.js'

export default ({ indicador }) => {
  const { tipo, asignación, devuelve } = Código.obtener({
    propiedad: indicador
  })

  if (!asignación) {
    return
  }

  const contexto = Código.obtener({
    propiedad: JSON.parse(asignación)
  })

  if (contexto) {
    if (tipo === 'Instancia') {
      return contexto.valor.tipo !== devuelve
    }

    return contexto.valor.tipo !== tipo
  }
}

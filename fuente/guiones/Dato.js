import { get, set } from 'lodash-es'

export default ({ valor }) => {
  let valorDelDato = valor
  const indicadorDelDato = crypto.randomUUID()
  let propiedadActualizada
  const evento = new CustomEvent(`actualización-${indicadorDelDato}`, {
    propiedadActualizada: () => propiedadActualizada
  })

  return {
    indicadorDelDato,
    obtener: (propiedades) => {
      let propiedad

      if (propiedades) {
        propiedad = propiedades.propiedad
      }
      if (propiedad) {
        return get(valorDelDato, propiedad)
      }

      if (!propiedad) {
        return valorDelDato
      }
    },
    establecer: ({ propiedad, valor }) => {
      if (propiedad) {
        set(valorDelDato, propiedad, valor)
        propiedadActualizada = propiedad
      }

      if (!propiedad) {
        valorDelDato = valor
      }

      const blanco = new EventTarget()
      blanco.dispatchEvent(evento)
    }
  }
}

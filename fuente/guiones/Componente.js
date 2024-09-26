import van from 'vanjs-core'

export default () => {
  const identificadorDelComponente = crypto.randomUUID()

  return {
    identificadorDelComponente,
    elemento: (etiqueta, ...propiedades) => {
      if (typeof propiedades[0] === 'object' && !Array.isArray(propiedades[0])) {
        propiedades[0]['data-componente'] = identificadorDelComponente
      }

      if (typeof propiedades[0] !== 'object' || Array.isArray(propiedades[0])) {
        propiedades = [{ 'data-componente': identificadorDelComponente }].concat(propiedades)
      }

      return van.tags[etiqueta](...propiedades)
    }
  }
}

import van from 'vanjs-core'

export default () => {
  const identificadorDelComponente = crypto.randomUUID()

  return {
    identificadorDelComponente,
    elemento: (etiqueta, ...propiedades) => {
      if (typeof propiedades[0] === 'object' && !Array.isArray(propiedades[0])) {
        propiedades[0]['data-componente'] = identificadorDelComponente
        if (propiedades[0].class) {
          if (Array.isArray(propiedades[0].class)) {
            propiedades[0].class = propiedades[0].class.join(' ')
          }

          if (typeof propiedades[0].class === 'object' && !Array.isArray(propiedades[0].class)) {
            propiedades[0].class = Object.keys(propiedades[0].class).reduce((acarreo, clase) => {
              if (propiedades[0].class[clase]) {
                return `${acarreo} ${clase}`
              }

              return acarreo
            })
          }
        }
      }

      if (typeof propiedades[0] !== 'object' || Array.isArray(propiedades[0])) {
        propiedades = [{ 'data-componente': identificadorDelComponente }].concat(propiedades)
      }

      return van.tags[etiqueta](...propiedades)
    }
  }
}

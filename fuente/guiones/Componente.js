import van from 'vanjs-core'
import Estilo from './Estilo'
import { kebabCase } from 'lodash-es'

export default () => {
  const identificadorDelComponente = crypto.randomUUID()

  return {
    identificadorDelComponente,
    elemento: ({ etiqueta, atributos, elementos }) => {
      if (!atributos) {
        atributos = {}
      }

      atributos['data-componente'] = identificadorDelComponente

      if (atributos.class) {
        if (Array.isArray(atributos.class)) {
          atributos.class = atributos.class.join(' ')
        }

        if (typeof atributos.class === 'object' && !Array.isArray(atributos.class)) {
          atributos.class = Object.keys(atributos.class).reduce((acarreo, clase) => {
            if (atributos.class[clase]) {
              return `${acarreo} ${kebabCase(clase)}`
            }

            return acarreo
          })
        }
      }

      return van.tags[etiqueta](atributos, elementos)
    },
    estilo: ({ reglas }) => {
      Estilo({
        identificadorDelComponente,
        reglas
      })
    }
  }
}

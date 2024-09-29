import Estilo from './Estilo'
import { kebabCase } from 'lodash-es'

const anidarElementos = ({ elemento, elementos }) => {
  if (elementos instanceof HTMLElement) {
    elemento.append(elementos)
  }

  if (typeof elementos === 'string') {
    elemento.append(document.createTextNode(elementos))
  }

  if (Array.isArray(elementos)) {
    elementos.forEach(elementoHijo => {
      anidarElementos({
        elemento,
        elementos: elementoHijo
      })
    })
  }
}

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

      const elemento = document.createElement(etiqueta)

      if (atributos) {
        Object.keys(atributos).forEach(atributo => {
          elemento.setAttribute(atributo, atributos[atributo])
        })
      }

      if (elementos) {
        anidarElementos({ elemento, elementos })
      }

      return elemento
    },
    estilo: ({ reglas }) => {
      Estilo({
        identificadorDelComponente,
        reglas
      })
    }
  }
}

import kebabCase from '../módulos-de-node/lodash/kebabCase.js'

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

const estilo = ({ reglas, identificadorDelComponente, reglasAnidadas }) => {
  if (!reglasAnidadas) {
    if (Object.keys(reglas).find(regla => typeof reglas[regla] === 'string')) {
      return estilo({
        identificadorDelComponente,
        reglas: {
          '': {
            ...reglas
          }
        },
        reglasAnidadas: true
      })
    }
  }

  if (!identificadorDelComponente) {
    identificadorDelComponente = ''
  }

  return Object.keys(reglas).map(selector => {
    let selectorConComponente = selector

    if (identificadorDelComponente) {
      selectorConComponente = `${selector}[data-componente="${identificadorDelComponente}"]`
    }

    return `
        ${selectorConComponente} {
          ${Object.keys(reglas[selector]).map(regla => {
      if (typeof reglas[selector][regla] === 'object') {
        let selectorAnidado = regla
        const reglasAnidadas = {}

        if (identificadorDelComponente && !selectorAnidado.includes('::') && !selectorAnidado.startsWith('.')) {
          selectorAnidado = `${selectorAnidado}[data-componente="${identificadorDelComponente}"]`
        }

        reglasAnidadas[`&${selectorAnidado}`] = reglas[selector][regla]

        return estilo({ reglas: reglasAnidadas, reglasAnidadas: true })
      }

      return `${kebabCase(regla)}: ${reglas[selector][regla]};\n`
    }).join('')}
        }
      `
  }).join('')
}

export default () => {
  const identificadorDelComponente = crypto.randomUUID()

  const elemento = ({ etiqueta, atributos, elementos }) => {
    if (!atributos) {
      atributos = {}
    }

    atributos['data-componente'] = identificadorDelComponente

    if (atributos.class) {
      if (Array.isArray(atributos.class)) {
        atributos.class = atributos.class.join(' ')
      }

      if (typeof atributos.class === 'object' && !Array.isArray(atributos.class)) {
        atributos.class = Object.keys(atributos.class).reduce(
          (acarreo, clase) => {
            if (atributos.class[clase]) {
              return `${acarreo} ${kebabCase(clase)}`
            }

            return acarreo
          },
          ''
        )
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
  }

  return {
    identificadorDelComponente,
    elemento,
    estilo: ({ global, reglas }) => {
      document.head.appendChild(elemento({
        etiqueta: 'style',
        elementos: estilo({
          reglas,
          identificadorDelComponente: (() => {
            if (global) {
              return ''
            }

            return identificadorDelComponente
          })()
        })
      }))
    }
  }
}

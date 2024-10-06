import { kebabCase } from '../módulos-de-node/lodash.js'

const anidarElementos = ({ elemento, elementos }) => {
  if (elementos instanceof HTMLElement) {
    elemento.append(elementos)
  }

  if (['string', 'number', 'boolean'].find(tipo => typeof elementos === tipo)) {
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

const estilo = ({ reglas, identificadorDelComponente, reglasAnidadas, bloquesDeEspacios }) => {
  if (!bloquesDeEspacios) {
    bloquesDeEspacios = 0
  }

  if (!reglasAnidadas) {
    if (Object.keys(reglas).find(regla => typeof reglas[regla] === 'string')) {
      return estilo({
        identificadorDelComponente,
        reglas: {
          '': {
            ...reglas
          }
        },
        reglasAnidadas: true,
        bloquesDeEspacios
      })
    }
  }

  if (!identificadorDelComponente) {
    identificadorDelComponente = ''
  }

  return Object.keys(reglas).map(selector => {
    let selectorConComponente = selector

    if (identificadorDelComponente && !selectorConComponente.includes('data-componente') && !selectorConComponente.includes('::') && !selectorConComponente.trimStart().startsWith('&.')) {
      selectorConComponente = `${selector}[data-componente="${identificadorDelComponente}"]`
    }

    return `${selectorConComponente} {\n${Object.keys(reglas[selector]).map(regla => {
      if (typeof reglas[selector][regla] === 'object') {
        let selectorAnidado = regla
        const reglasAnidadas = {}

        if (identificadorDelComponente && !selectorAnidado.includes('::') && !selectorAnidado.startsWith('.')) {
          selectorAnidado = `${selectorAnidado}[data-componente="${identificadorDelComponente}"]`
        }

        reglasAnidadas[`\n${'    '.repeat(bloquesDeEspacios + 1)}&${selectorAnidado}`] = reglas[selector][regla]

        return estilo({
          reglas: reglasAnidadas,
          identificadorDelComponente,
          reglasAnidadas: true,
          bloquesDeEspacios: bloquesDeEspacios + 1
        })
      }

      return `${'    '.repeat(bloquesDeEspacios + 1)}${kebabCase(regla)}: ${reglas[selector][regla]};\n`
    }).join('')}${'    '.repeat(bloquesDeEspacios)}}\n`
  }).join('')
}

export default () => {
  const identificadorDelComponente = crypto.randomUUID()

  const elemento = ({ etiqueta, atributos, eventos, elementos }) => {
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

    Object.keys(atributos).forEach(atributo => {
      if (atributos[atributo] !== undefined) {
        elemento.setAttribute(kebabCase(atributo), atributos[atributo])
      }
    })

    if (eventos) {
      Object.keys(eventos).forEach(evento => {
        elemento.addEventListener(evento, eventos[evento])
      })
    }

    if (elementos !== undefined) {
      anidarElementos({ elemento, elementos })
    }

    return elemento
  }

  return {
    identificadorDelComponente,
    elemento,
    estilo: ({ global, textoPlano, reglas }) => {
      const estiloCompilado = estilo({
        reglas,
        identificadorDelComponente: (() => {
          if (global) {
            return ''
          }

          return identificadorDelComponente
        })()
      })

      if (textoPlano) {
        return estiloCompilado
      }

      anidarElementos({
        elemento: document.head,
        elementos: elemento({
          etiqueta: 'style',
          elementos: estiloCompilado
        })
      })
    },
    anidarElementos
  }
}

import { kebabCase } from 'lodash-es'

const CSS = ({ reglas, identificadorDelComponente, reglasAnidadas }) => {
  if (!reglasAnidadas) {
    if (Object.keys(reglas).find(regla => typeof reglas[regla] === 'string')) {
      return CSS({
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

              return CSS({ reglas: reglasAnidadas, reglasAnidadas: true })
            }

            return `${kebabCase(regla)}: ${reglas[selector][regla]};\n`
          }).join('')}
        }
      `
  }).join('')
}

export default CSS

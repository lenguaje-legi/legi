const CSS = css => {
  return Object.keys(css).map(selector => {
    return `
        ${selector} {
          ${Object.keys(css[selector]).map(regla => {
            if (typeof css[selector][regla] === 'object') {
              const cssAnidado = {}

              cssAnidado[`&${regla}`] = css[selector][regla]

              return CSS(cssAnidado)
            }
            return `${regla}: ${css[selector][regla]};\n`
          }).join('')}
        }
      `
  }).join('')
}

export default CSS

import van from '../../módulos-de-node/vanjs/van.js'
const { span } = van.tags

export default ({ devolver }) => {
  if (!devolver) {
    devolver = ''
  }

  if (devolver) {
    devolver = 'return '
  }

  if (!devolver) {
    return null
  }

  return span(
    {
      class: 'ruido devolver'
    },
    devolver
  )
}

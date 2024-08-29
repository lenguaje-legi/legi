import van from 'vanjs-core'
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

import Componente from '../Componente.js'

const { elemento } = Componente()

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

  return elemento({
    etiqueta: 'span',
    atributos: {
      class: 'ruido devolver'
    },
    elementos: devolver
  })
}

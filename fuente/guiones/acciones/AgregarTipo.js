import Componente from '../Componente.js'
import { lowerFirst } from '../../módulos-de-node/lodash.js'
import EditarPropiedades from './EditarPropiedades.js'
import Visualizar from './Visualizar.js'
import { Código } from '../inicio.js'

const { elemento } = Componente()

export default ({ tipo, indicador }) => {
  return elemento({
    etiqueta: 'div',
    elementos: [
      elemento({
        etiqueta: 'button',
        eventos: {
          click: () => {
            console.log(`Se agregó un tipo: ${tipo}`)

            const propiedades = {
              tipo
            }

            if (tipo === 'Contexto') {
              propiedades.valor = {
                nombre: '',
                tipo: 'Nulo'
              }
            }

            if (tipo === 'Nulo') {
              propiedades.devolver = false
              propiedades.asignación = ''
              propiedades.contexto = []
            }

            if (tipo === 'Instancia') {
              propiedades.devolver = false
              propiedades.asignación = ''
              propiedades.instancia = ''
              propiedades.devuelve = ''
              propiedades.contexto = []
              propiedades.valor = () => {}
            }

            if (tipo === 'Función') {
              propiedades.devolver = false
              propiedades.asignación = ''
              propiedades.devuelve = 'Nulo'
              propiedades.contexto = []
              propiedades.valor = []
            }

            if (tipo === 'Lista') {
              propiedades.devolver = false
              propiedades.asignación = ''
              propiedades.valor = []
            }

            if (tipo === 'Número') {
              propiedades.devolver = false
              propiedades.asignación = ''
              propiedades.valor = 0
            }

            if (tipo === 'Texto') {
              propiedades.devolver = false
              propiedades.asignación = ''
              propiedades.valor = ''
            }

            if (tipo === 'Lógica') {
              propiedades.devolver = false
              propiedades.asignación = ''
              propiedades.valor = true
            }

            if (tipo === 'Comentario') {
              propiedades.valor = ''
            }

            const nuevoTipo = Código.obtener({
              propiedad: indicador.toSpliced(-1)
            }).toSpliced(indicador.at(-1), 0, propiedades)

            Código.establecer({
              propiedad: indicador.toSpliced(-1),
              valor: nuevoTipo
            })

            Visualizar()
            EditarPropiedades({ tipo, indicador })
            document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('creado')
            document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('seleccionado')
            setTimeout(() => {
              document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.remove('seleccionado')
            }, 250)
            setTimeout(() => {
              document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('seleccionado')
            }, 500)
            setTimeout(() => {
              document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.remove('creado')
            }, 1000)
          }
        },
        elementos: `Agregar ${lowerFirst(tipo)}`
      })
    ]
  })
}

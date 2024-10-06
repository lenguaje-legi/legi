import Componente from '../Componente.js'
import ActualizarPropiedad from '../acciones/ActualizarPropiedad.js'
import ErrorDeAsignación from '../errores/ErrorDeAsignación.js'
import { Código } from '../inicio.js'

const { elemento } = Componente()

export default ({ indicador }) => {
  const Tipo = Código.obtener({
    propiedad: indicador
  })

  const { tipo } = Tipo
  const { contexto } = Código.obtener({
    propiedad: indicador.slice(0, -2)
  })

  if (!contexto) {
    return
  }

  let error = ''

  if (ErrorDeAsignación({ indicador })) {
    error = 'error'
  }

  return ({
    etiqueta: 'div',
    elementos: [
      elemento({
        etiqueta: 'div',
        elementos: [
          elemento({
            etiqueta: 'select',
            atributos: {
              class: error,
              dataPropiedad: JSON.stringify([...indicador, 'asignación']),
              name: 'asignación'
            },
            eventos: {
              change: ({ target }) => {
                console.log('Se confirmó un cambio')
                target.classList.remove('error')
                ActualizarPropiedad({ indicador, target })
              }
            },
            elementos: [
              elemento({
                etiqueta: 'option',
                elementos: ''
              }),
              contexto.map((contexto, indicadorDelContexto) => {
                const valor = JSON.stringify([...indicador.slice(0, -2), 'contexto', indicadorDelContexto])
                return elemento({
                  etiqueta: 'option',
                  atributos: {
                    value: valor,
                    selected: (() => {
                      return valor === Código.obtener({
                        propiedad: [...indicador, 'asignación']
                      })
                    })(),
                    disabled: (() => {
                      if (tipo === 'Instancia') {
                        return contexto.valor.tipo !== Tipo.devuelve
                      }

                      return contexto.valor.tipo !== tipo
                    })()
                  },
                  elementos: contexto.valor.nombre
                })
              })
            ]
          })
        ]
      })
    ]
  })
}

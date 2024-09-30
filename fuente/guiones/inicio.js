import van from '../módulos-de-node/vanjs/van.js'
import fromString from '../módulos-de-node/php-array-reader/fromString.js'
import Visualizar from './acciones/Visualizar.js'
import Seleccionar from './acciones/Seleccionar.js'
import Estilo from './Estilo.js'
import Dato from './Dato.js'

const leerArchivo = async () => {
  try {
    const response = await fetch('/leer-archivo')
    const archivo = await response.text()
    return archivo
  } catch (error) {
    console.error(error)
  }
}

const escribirArchivo = async () => {
  try {
    await fetch('/escribir-archivo', {
      method: 'POST',
      body: JSON.stringify({
        contenido: document.querySelector('#salida').innerText
      })
    })
  } catch (error) {
    console.error(error)
  }
}

document.querySelector('#escribir-archivo').addEventListener('click', () => {
  escribirArchivo()
})

let php = await leerArchivo()

if (!php) {
  php = `
<?php

[
    [
        'tipo' => 'Función',
        'devolver' => true,
        'contexto' => [
            
        ],
        'valor' => [
            
        ]
    ]
];`
}

export const Código = Dato({
  valor: fromString(php)
})

export const Acción = van.state('')

const visualización = document.querySelector('#visualización')
visualización.onclick = click => {
  Seleccionar({ click, indicador: [] })
}

Visualizar()

Estilo({
  nombre: 'Visualización',
  reglas: {
    body: {
      fontFamily: '"0xProto"',
      margin: '0',
      color: '#fff',
      backgroundColor: '#000'
    },

    pre: {
      fontFamily: '"0xProto"',
      margin: '0'
    },

    '#visualización': {
      backgroundColor: 'rgb(75, 75, 75)',
      padding: '0.5rem',

      ' .seleccionado': {
        backgroundColor: '#993800'
      },

      ' .devolver': {
        color: 'rgb(255, 100, 100)'
      },

      ' .Nueva-línea': {
        padding: '0.25rem',
        backgroundColor: 'rgba(0, 25, 0, 0.2)'
      },

      ' .corchete': {
        color: 'rgb(100, 150, 255)'
      },

      ' .paréntesis-de-apertura': {
        color: 'rgba(255, 150, 0, 0.2)'
      },

      ' .paréntesis-de-cierre': {
        color: 'rgba(255, 150, 0, 0.2)'
      },

      ' .signo-de-número': {
        color: 'rgba(0, 255, 255, 0.2)'
      },

      ' .signo-de-dólar': {
        color: 'rgba(0, 255, 255, 0.2)'
      },

      '.legi': {

        ' .devolver': {

          '::before': {
            filter: 'hue-rotate(150deg)',
            color: '#fff',
            content: '"◀️"'
          }
        },

        ' .ruido': {
          color: 'transparent'
        },

        ' .signo-de-asignación': {

          '::before': {
            color: 'rgb(255, 100, 255)',
            content: '" : "'
          },

          '> .ruido': {
            marginLeft: '-2rem'
          }
        }
      }
    }
  }
})

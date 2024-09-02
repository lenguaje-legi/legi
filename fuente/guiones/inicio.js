import Visualizar from './acciones/Visualizar.js'
import van from 'vanjs-core'
import Seleccionar from './acciones/Seleccionar.js'
import { fromString } from 'php-array-reader'

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

export const Código = van.state(fromString(php))

export const Acción = van.state('')

const visualización = document.querySelector('#visualización')
visualización.onclick = click => {
  Seleccionar({ click, indicador: [] })
}

Visualizar()

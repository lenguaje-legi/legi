import Visualizar from './componentes/Visualizar.js'
import van from 'vanjs-core'
import Seleccionar from './componentes/Seleccionar.js'
import { fromString } from 'php-array-reader'

const php = `
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

export const Código = van.state(fromString(php))

export const Acción = van.state('')

const visualización = document.querySelector('#visualización')
visualización.onclick = click => {
  Seleccionar({ click, indicador: [] })
}

Visualizar()

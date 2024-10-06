import json2php from '../../módulos-de-node/json2php.js'
import Tipo from '../tipos/Tipo.js'
import { Código } from '../inicio.js'

export default () => {
  const visualización = document.querySelector('#visualización')
  visualización.innerHTML = ''
  visualización.appendChild(Tipo({
    bloquesDeEspacios: 0,
    indicador: [0]
  }))

  const salida = document.querySelector('#salida')
  salida.innerHTML = ''
  document.querySelector('#visualización').classList.add('salida')
  salida.innerText = `<?php\n\n${json2php.make({
    linebreak: '\n',
    indent: '    ',
    shortArraySyntax: true
  })(Código.obtener())};\n\n${visualización.innerText}\n`
  document.querySelector('#visualización').classList.remove('salida')
}

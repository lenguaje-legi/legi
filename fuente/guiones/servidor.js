const fastify = require('fastify')
const fs = require('node:fs')
const path = require('node:path')
const { archivo } = require('../../configuración.js')

const servidor = fastify()

servidor.register(require('@fastify/static'), {
  root: path.join(__dirname, '../')
})

servidor.get('/leer-archivo', (petición, respuesta) => {
  fs.readFile(archivo, 'utf8', (error, contenido) => {
    if (error) {
      console.error(error)
    }
    respuesta.send(contenido)
  })
})

servidor.post('/escribir-archivo', (petición, respuesta) => {
  const { contenido } = JSON.parse(petición.body)
  fs.writeFile(archivo, contenido, error => {
    if (error) {
      console.error(error)
    }
  })
})

servidor.listen({ port: 3000 }, (error) => {
  if (error) {
    fastify.log.error(error)
    process.exit(1)
  }
})

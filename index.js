const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const PORT = 4000

const app = express()

app.use('/', (req, res) => {
  res.send('<h1>It works</h1>')
})

const server = http.createServer(app)

const io = socketio(server, {
  cors: {
    origin: '*'
  }
})

io.on('connection', (socket) => {
  console.log('user connected!')
  socket.on('test', (payload) => {
    console.log(payload)
  })
  socket.on('pesan', (payload) => {
    console.log(payload)
    io.emit('response-pesan', payload)
  })
})

server.listen(PORT, () => {
  console.log('server running on port ' + PORT)
})
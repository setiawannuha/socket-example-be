const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const PORT = 4000

const { users, chat } = require('./data')

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
  // socket.on('test', (payload) => {
  //   console.log(payload)
  // })
  // socket.on('pesan', (payload) => {
  //   console.log(payload)
  //   io.emit('response-pesan', payload)
  // })

  socket.on('login', (username) => {
    const checkUser = users.filter((item) => {
      if(item.username === username){
        return item
      }
    })
    if(checkUser.length >= 1){
      io.emit('res-login', true)
    }else{
      io.emit('res-login', false)
    }
  })

  socket.on('join-room', (username) => {
    socket.join(username)
  })

  // listener get list users
  socket.on('get-list-users', (username) => {
    // sender response get list users
    const userFilter = users.filter((item) => {
      if(item.username !==  username){
        return item
      }
    })
    io.emit('res-get-list-users', userFilter)
  })

  // listener get list chat
  socket.on('get-list-chat', (user) => {
    // sender response get list chat
    // io.emit('res-get-list-chat', chat)
    const filterChat = chat.filter((item, i) => {
      if(
        (item.from === user.from && item.to === user.to) || 
        (item.from === user.to && item.to === user.from)
      ){
        return item
      }
    })
    io.to(user.from).emit('res-get-list-chat', filterChat)
  })

  //listener send message
  socket.on('send-message', (data) => {
    chat.push(data)
    const filterChat = chat.filter((item, i) => {
      if(
        (item.from === data.from && item.to === data.to) || 
        (item.from === data.to && item.to === data.from)
      ){
        return item
      }
    })
    // sender response get list chat
    io.to(data.from).emit('res-get-list-chat', filterChat)
    io.to(data.to).emit('res-get-list-chat', filterChat)
  })
})

server.listen(PORT, () => {
  console.log('server running on port ' + PORT)
})
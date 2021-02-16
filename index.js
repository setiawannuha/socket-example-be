const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const bodyParser = require('body-parser')
const cors = require('cors')
const db = require('./db')
const PORT = 4000

const { users, chat } = require('./data')

const app = express()
app.use(bodyParser.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('<h1>It works</h1>')
})
app.post('/login', (req, res) => {
  db.query(`SELECT * FROM users WHERE name='${req.body.name}' AND password='${req.body.password}'`, 
  (err, result) => {
    if(result.length >= 1){
      res.status(200).json(result)
    }else{
      res.status(404).json({msg: 'User not found'})
    }
  })
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

  // socket.on('login', (username) => {
  //   const checkUser = users.filter((item) => {
  //     if(item.username === username){
  //       return item
  //     }
  //   })
  //   if(checkUser.length >= 1){
  //     io.emit('res-login', true)
  //   }else{
  //     io.emit('res-login', false)
  //   }
  // })

  socket.on('join-room', (roomId) => {
    socket.join(roomId)
  })

  // listener get list users
  socket.on('get-list-users', (idUser, roomId) => {
    // sender response get list users
    // const userFilter = users.filter((item) => {
    //   if(item.username !==  username){
    //     return item
    //   }
    // })
    db.query(`SELECT * FROM users WHERE id != ${idUser}`, (err, result) => {
      io.to(roomId).emit('res-get-list-users', result)
    })
  })

  // listener get list chat
  socket.on('get-list-chat', (user) => {
    // sender response get list chat
    // io.emit('res-get-list-chat', chat)
    // const filterChat = chat.filter((item, i) => {
    //   if(
    //     (item.from === user.from && item.to === user.to) || 
    //     (item.from === user.to && item.to === user.from)
    //   ){
    //     return item
    //   }
    // })
    db.query(`SELECT chat.created_at, chat.from_id, chat.to_id, chat.message, user_from.name as from_name, user_from.room_id as from_room_id, user_to.room_id as to_room_id FROM chat LEFT JOIN users as user_from ON chat.from_id=user_from.id LEFT JOIN users as user_to ON chat.to_id = user_to.id 
    WHERE 
    (from_id='${user.id_from}' AND to_id='${user.id_to}') 
    OR 
    (from_id='${user.id_to}' AND to_id='${user.id_from}')`, (err, result) => {
      // console.log(result)
      io.to(user.room_id).emit('res-get-list-chat', result)
    })
  })

  //listener send message
  socket.on('send-message', (data) => {
    // console.log(data)
    // chat.push(data)
    // const filterChat = chat.filter((item, i) => {
    //   if(
    //     (item.from === data.from && item.to === data.to) || 
    //     (item.from === data.to && item.to === data.from)
    //   ){
    //     return item
    //   }
    // })
    db.query(`INSERT INTO chat 
    (from_id, to_id, message) VALUES 
    ('${data.from}','${data.to}','${data.msg}')`, (err, result) => {

      db.query(`SELECT chat.created_at, chat.from_id, chat.to_id, chat.message, user_from.name as from_name, user_from.room_id as from_room_id, user_to.room_id as to_room_id FROM chat LEFT JOIN users as user_from ON chat.from_id=user_from.id LEFT JOIN users as user_to ON chat.to_id = user_to.id 
      WHERE (from_id='${data.from}' AND to_id='${data.to}') OR 
      (from_id='${data.to}' AND to_id='${data.from}')`, (err, result) => {
        // console.log(result)
        // sender response get list chat
        io.to(result[0].from_room_id).emit('res-get-list-chat', result)
        io.to(result[0].to_room_id).emit('res-get-list-chat', result)
      })

    })
  })

  socket.on('send-broadcast', (data) => {
    const result = `${data.from} : ${data.msg}`
    socket.broadcast.emit('res-broadcast', result)
  })
})

server.listen(PORT, () => {
  console.log('server running on port ' + PORT)
})
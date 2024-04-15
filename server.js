const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const socketio = require('socket.io');
const app = require('./app');
const notification = require('./utils/notification');

// FUNCIONS
const normalizePort = (val) => {
  let port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
}
const onError = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  let bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}
const onListening = () => {
  let addr = server.address();
  let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.log('Listening on ' + bind);
  console.log('Notification service started');
}

//CONFIG SECURITY PORT
const port = normalizePort(process.env.PORT || '65080');
app.set('port', port);

//CONFIG VARIABLS ENVIROMENT
dotenv.config({ path: './config.env' });

//CONECTION DB
const DB = process.env.DATABASE.replace(
  '<DATABASE_PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successfully established');
});

// CREATE HTTP SERVER
const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
notification(io);
app.io = io;
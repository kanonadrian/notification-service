const jwtUtil = require('./jwUtil');
const AppError = require('./appError');
const socketUsersController = require('../controllers/socketUsersController');
const socketUsers = [];
const users = new Map();

class Connection {
    constructor(io, socket) {

      this.io = io;
      this.socket = socket;

      socket.on('init', ( data, callback ) => this.init( data, callback ));
      socket.on('disconnect', () => this.disconnect());
      socket.on('connect_error', (err) => {
          console.log(`connect_error due to ${err.message}`);
      });

    }
    init( data, callback ) {

      const socketId = this.socket.id;
      const user = users.get(socketId);
      const currentUser = {
        socketId: socketId,
        id: user._id,
        name: user.name,
        full_name: user.full_name,
        email: user.email,
        user_type: user.user_type,
        user_role: user.user_role,
        businessId: user.businessId
      }
      console.log('REGISTRA USUARIO: ', currentUser);
      socketUsersController.registerUser( currentUser )
      .then(( res ) => {

        if((user.user_role == 0 || user.user_role == 1) && user.user_type == 2){

          this.socket.join(`business_${ user.businessId }`);

        }
        callback({
          success: true,
          message: "SE REGISTRÓ EL USUARIO CORRECTAMENTE."
        });

      });
      
    }

    disconnect() {

      const socketId = this.socket.id;
      const user = users.get(socketId);
      const id = user._id;
      console.log('SE DESCONECTÓ: ', user);
      socketUsersController.removeUser(id)
      .then(( res ) => {
        users.delete(socketId);

      });

    }
}

const authHandler = async (socket, next) => {
    const { token = null } = socket.handshake.query || {};
    if (token) {
      try {

        const [authType, tokenValue] = token.trim().split(' ');
        if (authType !== 'Bearer') {
          throw next(new AppError('Expected a Bearer token', 401));
        }
  
        const sub = await jwtUtil.verifyToken(tokenValue);
  
        if (!sub || sub === undefined) {
          return next(new AppError('Invalid session', 401));
        }
        sub.token = tokenValue;
        console.log('CONNECT', sub);
        users.set(socket.id, sub);
      } catch (error) {
        console.log(error);
      }
    } else {
      return next(new AppError('No auth header found', 401));
    }
    next();
};

const getSocketIdForUserHandler = (userId) => {
    const user = socketUsers.find((d) => {
      return d.userId === userId;
    });
    if (user) {
      return user.socketId;
    }
    return undefined;
};

const notification = (io) => {

    io.use(authHandler);
    io.on('connection', (socket) => {
      new Connection(io, socket);
    });
    io.getSocketIdForUser = getSocketIdForUserHandler;

}
  
module.exports = notification;
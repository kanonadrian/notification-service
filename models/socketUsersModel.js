const mongoose = require('mongoose');

const socketUsersSchema = new mongoose.Schema({
    socketId: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    full_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    user_type: {
        type: String,
        required: true
    },
    user_role: {
        type: String,
        required: true
    },
    businessId: {
        type: String,
        required: true
    },
    createdAt: {
      type: Date,
      default: Date.now()
    }
  });

const SocketUsers = mongoose.model('SocketUsers', socketUsersSchema);
module.exports = SocketUsers;
const mongoose = require('mongoose');

const notificationsLogSchema = new mongoose.Schema({
  identifierId: {
    type: String
  },
  businessId: {
    type: String
  },
  type: {
    type: Number,
    //required: [true, 'Tipo registro es requerido!']
  },
  isUser: {
    type: Number
  },
  title: {
    type: String,
    //required: [true, 'Identificador es requerido!']
  },
  description: {
    type: String,
    //required: [true, 'Laa descripcion es requerida!']
  },
  data: {
    type: Object
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  notificationType: {
    type: Number
  },
  status:{
    type: Boolean,
    default: true
  }
});

const NotificationsLog = mongoose.model('NotificationsLog', notificationsLogSchema);

module.exports = NotificationsLog;
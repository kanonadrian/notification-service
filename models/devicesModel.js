const mongoose = require('mongoose');

const devicesSchema = new mongoose.Schema({
  businessId: {
    type: String,
    required: [true, 'Negocio es requerido!']
  },
  type: {
    type: Number,
    required: [true, 'Tipo registro es requerido!']
  },
  identifierId: {
    type: String,
    required: [true, 'Identificador es requerido!']
  },
  token: {
    type: String,
    required: [true, 'Token es requerido!']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }
});

const Brands = mongoose.model('Devices', devicesSchema);

module.exports = Brands;
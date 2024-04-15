const express = require('express');
const devicesController = require('../controllers/devicesController');

const router = express.Router();

router
  .route('/')
  .get(devicesController.getAll)
  .post(devicesController.registerDevice);

router.route('/:id').delete(devicesController.deviceDelete);


module.exports = router;

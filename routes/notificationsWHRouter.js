const express = require('express');
const notificationsController = require('../controllers/notificationsController');

const router = express.Router();

// SINGLE NOTIFICATION
router
  .route('/')
  .post(notificationsController.sendNotification)

router
  .route('/callCenter/')
  .post(notificationsController.sendNotificationCallCenter)

router
  .route('/corporative')
  .post(notificationsController.sendNotificationCallCenterCorporative)

router
  .route('/businessId/:businessId/notifications/')
  .get(notificationsController.getNotificationsCallcenter);

router
  .route('/notifications/:id')
  .patch(notificationsController.updateNotificationsCallcenter);


module.exports = router;
// const apm = require('elastic-apm-node').start({
//   serviceName: 'notification-service',
//   captureBody: 'all', 
//   serverUrl: 'http://187.162.64.86:8200',
//   //serverUrl: 'http://176.24.7.110:8200',
//   environment: 'production'
//   })

const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const AppError = require('./utils/appError');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const globalErrorHandler = require('./controllers/errorController');
const devicesRouter = require('./routes/devicesRouter');
const notificationsWHRouter = require('./routes/notificationsWHRouter');


const app = express();
const API_VERSION = process.env.API_VERSION;
const NAME_SERVICE = process.env.NAME_SERVICE;
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(cors());
app.options('*', cors());
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  req.io = app.io;
  req.requestTime = new Date().toISOString();
  next();
});
app.use(`/${NAME_SERVICE}/${API_VERSION}/devices/`, devicesRouter);
app.use(`/${NAME_SERVICE}/${API_VERSION}/wh`, notificationsWHRouter);
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);
module.exports = app;


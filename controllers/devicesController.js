const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Devices = require('../models/devicesModel');


exports.getAll = catchAsync(async (req, res, next) => {

  const docs = await Devices.find(); //.explain() statistics

  res.status(200).json({
    status: 'success',
    results: docs.length,
    data: { docs },
  });

});

exports.registerDevice = catchAsync(async (req, res, next) => {

  const { body } = req;
  let doc = {};
  const existDevice = await Devices.findOne({ identifierId: body.identifierId });

  if ( existDevice ) {

      doc = await Devices.findOneAndUpdate({ identifierId: body.identifierId }, { type: body.type , token:  body.token },{
          upsert: true,
          runValidators: true,
          new: true
      });

  } else {

    doc = await Devices.create(req.body);
    
  }

  res.status(200).json({
    status: 'sucess',
    data: { doc },
  });

});

exports.deviceDelete = catchAsync( async(req, res, next) => {

  const doc = await Devices.deleteOne({ _id: req.params.id});

  if (!doc) {
    return next(
      new AppError(`No data found with that ID`, 404)
    );
  }

  res.status(200).json({
    status: 'sucess',
    data: { doc },
  });


});


// const AppError = require('../utils/appError');
const SocketUsers = require('../models/socketUsersModel');

exports.registerUser = async ( currentUser ) => {

    let { id } = currentUser;

    const resUpsert = await SocketUsers.findOneAndUpdate( { id: id }, currentUser,
    { 
        upsert: true,
        new: true,
        runValidators: true
    });
    return resUpsert;

};

exports.removeUser = async ( id ) => {

    await SocketUsers.deleteMany({ id: id });
    return true;

};
const catchAsync = require('../utils/catchAsync');
const Devices = require('../models/devicesModel');
const notifyLog = require('../models/notificationsLogModel');
const { ONE_SIGNAL_CONFIG } = require("../config/app.config");
const pushNotificationService = require("../services/push-notification.services");
const SocketUsers = require('../models/socketUsersModel');
const jwtUtil = require('../utils/jwUtil');

// NOTIFICACION HTTPS

// SINGLE 
exports.sendNotification = catchAsync(async (req, res, next) => {

    const obj = JSON.parse(Buffer.from(req.body.message.data, 'base64').toString());
    if(obj && obj.identifierId){

        sendSocketNotification( obj, req );
        sendPushNotification( obj );
    }
    res.status(200).json({
        status: 'success' 
    });

});
// CALLCENTER 
exports.sendNotificationCallCenter = catchAsync(async (req, res, next) => {

    const obj = JSON.parse(Buffer.from(req.body.message.data, 'base64').toString());
    if( obj ){
        const { notificationType } = obj;
        switch (notificationType) {
            case 1:
                sendPushNotices( obj );
                break;
            case 2:
                sendPushClaimsCallcenter( obj );
                break;
            case 3:
                sendSocketAlert( obj, req );
                break;
            case 4:
                sendCallcenterTravelUpdate( obj, req );
                break;
            case 5:
                sendNotificationClaims( obj, req );
                break;
            default:
                console.log(`Notification Type not valid ( ${ notificationType } ).`);
                break;
        }
    }
    res.status(200).json({
        status: 'success' 
    });

});
// CALLCENTER OR CORPORATIVE STATUS VIAJE
exports.sendNotificationCallCenterCorporative = catchAsync(async (req, res, next) => {

    const obj = JSON.parse(
        Buffer.from(req.body.message.data, 'base64').toString()
    );
    if(obj){

        if(obj.data.requestType == 2 || obj.data.requestType == 3)
            notifyCallCenter(obj, req);

        if(obj.data.requestType == 4 || obj.data.requestType == 5)
            notifyCorporative(obj, req);

    }
    res.status(200).json({
        status: 'success' 
    });

});
// BANDEJA NOTIFICACIONES (CALLCENTER, PASAJERO, CONDUCTOR)
exports.getNotificationsCallcenter = catchAsync(async (req, res, next) => {
    const businessId = req.params.businessId;
    const token = req.headers.authorization.split(' ')[1];
    if(!token)
        return next(new AppError(`!Invalid Token`, 400));

    const verify = await jwtUtil.verifyToken(token);
    const identifierId = verify._id;
    const userType = verify.user_type * 1;
    const roleType = verify.user_role * 1;
    let filter = {}
    if(userType === 2 && (roleType === 0 || roleType === 1)){
        filter = {
            $and: [
                {
                  businessId: businessId,
                },
              ],
            $or:[
                {isUser: 0},{isUser:1, identifierId:identifierId}
            ]
        }
    }else{
        filter = {businessId: businessId, identifierId: identifierId}
    }
    const docs = await notifyLog.find(filter).sort({createdAt: -1});
    res.status(200).json({
        status: 'success',
        results: docs.length,
        data: { docs },
    });
});
// CAMBIO ESTATUS BANDEJA EN VISTO
exports.updateNotificationsCallcenter = catchAsync(async(req, res, next) => {

    const id = req.params.id;
    const update = {
        status: false
    }
    const doc = await notifyLog.findByIdAndUpdate(id,update);
    if(!doc)
        return next(new AppError(`No se encontro la notificacion`, 400));

    res.status(200).json({
        status: 'success',
      });
});









//FUNCIONES

// SEND SINGLE SOCKET NOTIFICACION
const sendSocketNotification = async( obj, req ) => {
    
    const { identifierId, notification = {}, data = {} } = obj;
    if( notification ){

        const { type, isUser, businessId, identifierId, title, description } = notification;
        const insert = {
            identifierId,
            businessId,
            type,
            isUser,
            title,
            description,
            notificationType: 1, //VIAJES
            data: data,
            createdAt: new Date()
        }
        await notifyLog.create(insert);
    }
    const res = await SocketUsers.findOne({ id: identifierId }, 'socketId'). limit(1);
    if( res ){
        const { socketId } = res;
        req.io.to(socketId).emit('travelNotification', obj);
    }else{
        console.log('El cliente no estaba conectado');
    }
};
// SEND SINGLE PUSH NOTIFICACION
const sendPushNotification = async ( obj ) => {

    const { identifierId, title } = obj;
    const device = await Devices.findOne({ identifierId: identifierId });
    if ( !device ) {

        console.log(`${ identifierId }, ESTE USUARIO NO ESTA REGISTRADO PARA EL ENVIO NOTIFICACINES PUSH.`);
        return false;
    }

    const { token } = device;
    const message = { 
        app_id: ONE_SIGNAL_CONFIG.APP_ID,
        contents: { "en": title },
        include_player_ids: [ token ],
        data: obj.data
    };
    pushNotificationService.sendNotification( message, (error, result)=> {
        if( error ){
            console.log(`ERROR AL ENVIAR LA NOTIFICACIÓN PUSH: ${ error }`);        
            return false;
        } else {
            console.log('SE ENVIÓ LA NOTICFICACION PUSH CON ÉXITO!', result);
        }        
    });

};
// CALLCENTER SOCKET PANIC ALERT
const sendSocketAlert = async( obj, req ) => {

    const { type, identifierId, businessId, data, notificationType, event } = obj;
    let title = '';
    let description = '';
    if( event === 'panicAlertReceived' ){
        title = `Alerta de pánico`;
        description = `Se activó una alerta de pánico desde ${ data.alertOrigin }`;
    } else {
        title = `Alerta de pánico`;
        description = `Se desactivó una alerta de pánico desde ${ data.alertOrigin }`;
    }
    data.title = title;
    const insert = {
        identifierId: identifierId,
        businessId: businessId,
        type: type,// 3 CALLCENTER
        isUser: 0, // 0 SEND ALL
        title: title,
        description: description,
        notificationType: notificationType, // 3 ALERTA DE PÁNICO
        data: data,
        createdAt: new Date()
    }
    await notifyLog.create(insert);
    req.io.to(`business_${businessId}`).emit(event, data);

}
// CALLCENTER UPDATE TRAVELS
const sendCallcenterTravelUpdate = async( obj, req ) => {

    const { createdUser } = obj;
    const res = await SocketUsers.findOne({ id: createdUser }, 'socketId'). limit(1);
    if( res ){
        const { socketId } = res;
        req.io.to(socketId).emit('travelUpdateNotification', obj);
    }else{
        console.log('El usuario de callcenter no está conectado');
    }

}

// CALLCENTER SOCKET CLAIMS
const sendNotificationClaims = async( data, req ) => {

    console.log('DATA_CLAIMS_CALLCENTER', data );
    const { notificationType, businessId, title, description, claimId } = data;
    const insert = {
        identifierId: businessId,
        businessId: businessId,
        type: 3, // LLEGA A CALLCENTER
        isUser: 0, // LLEGA A TODOS LOS USUARIOS CALLCENTER
        title: title,
        description: description,
        notificationType: notificationType, // 5 RECLAMACIONES
        data: {
            claimId: claimId,
        },
        createdAt: new Date()
    }
    notifyLog.create( insert );
    req.io.to(`business_${businessId}`).emit('claimsCallcenter', {});

};

const sendPushClaimsCallcenter = async( data ) => {

    console.log('DATA_CLAIMS_CLIENTS', data );
    const { title, description, type, identifierId, businessId, notificationType, claimId } = data;
    const insert = {
        identifierId: identifierId,
        businessId: businessId,
        type: type,
        isUser: 1,
        title: title,
        description: description,
        notificationType: notificationType, // 2 RECLAMACIONES
        data: {
            claimId: claimId
        },
        createdAt: new Date()
    }
    notifyLog.create( insert );

    const device = await Devices.findOne({ identifierId: identifierId });
    if ( !device ) {
        console.log(`${ identifierId }, ESTE USUARIO NO ESTA REGISTRADO PARA EL ENVIO NOTIFICACINES PUSH.`);
        return false;
    }
    const { token } = device;
    const message = { 
        app_id: ONE_SIGNAL_CONFIG.APP_ID,
        headings: { "en": title },
        contents: {
            "en": description
        },
        include_player_ids: [ token ],
    };
    pushNotificationService.sendNotification(message, (error, result)=> {
        if( error ){
            console.log(`ERROR AL ENVIAR LA NOTIFICACIÓN PUSH: ${ error }`);        
        } else {
            console.log('SE ENVIÓ LA NOTICFICACION PUSH CON ÉXITO!', result);
        }        
    });

}
// CALLCENTER SOCKET GENERAL NOTICES
const sendPushNotices = async( data ) => {

    console.log('SEND_SOCKET_NOTICES', data);
    const { title, description, type, business } = data;
    let device = [];
    let playerIds = [];
    let filter = {};
    if( type === '3' ){
        filter = {
            businessId: business
        };
    }else{
        filter = {
            type: type,
            businessId: business
        };
    }
    device = await Devices.find(filter);
    if( !device.length ){
        console.log(`NO HAY USUARIOS REGISTRADOS PARA NOTIFICACIÓN PUSH`);
        return false;
    }

    switch ( type ) {
        case '1':
            device.map( ( item ) => {
                playerIds.push( item.token );
                const insert = {
                    identifierId: item.identifierId,
                    businessId: business,
                    type: 1,
                    isUser: 1,
                    title: title,
                    description: description,
                    notificationType: 4, // NOTICIAS
                    data: {
                        title: title,
                        description: description,
                    },
                    createdAt: new Date()
                }
                notifyLog.create(insert);
            });
            break;
        case '2':
            device.map( ( item ) => {
                playerIds.push( item.token );
                const insert = {
                    identifierId: item.identifierId,
                    businessId: business,
                    type: 2,
                    isUser: 1,
                    title: title,
                    description: description,
                    notificationType: 4, // NOTICIAS
                    data: {
                        title: title,
                        description: description,
                    },
                    createdAt: new Date()
                }
                notifyLog.create(insert);
            });
            break;
        case '3':
            device.map( ( item ) => {
                playerIds.push( item.token );
                const insert = {
                    identifierId: item.identifierId,
                    businessId: business,
                    type: item.type,
                    isUser: 1,
                    title: title,
                    description: description,
                    notificationType: 4, // NOTICIAS
                    data: {
                        title: title,
                        description: description,
                    },
                    createdAt: new Date()
                }
                notifyLog.create(insert);
            });
            break;
        default:
            console.log('TIPO NO DISPONIBLE');
            break;
    }
    const message = { 
        app_id: ONE_SIGNAL_CONFIG.APP_ID,
        headings: { "en": title },
        contents: {
            "en": description
        },
        include_player_ids: playerIds,
    };
    console.log('MESSAGE', message);
    pushNotificationService.sendNotification( message, ( error ) => {
        if( error ){
            console.log(`ERROR AL ENVIAR LA NOTIFICACIÓN PUSH:`);        
        } else {
            console.log('SE ENVIÓ LA NOTICFICACION PUSH CON ÉXITO!');
        }        
    });
};

// CALLCENTER STATUS VIAJE
const notifyCallCenter = async(obj, req) => {
    const insert = {
        identifierId: obj.identifierId,
        businessId: obj.businessId,
        isUser: 0,
        type: obj.type,
        title: obj.title,
        description: obj.description,
        notificationType: 2, //SERVICIO CORPORATIVO
        data: obj.data,
        createdAt: new Date()
    }
    const doc = await notifyLog.create(insert);
    obj.notificationId = doc._id;
    req.io.to(`business_${obj.identifierId}`).emit('changeStatusCallcenter', obj);
}
// CORPORATIVE STATUS VIAJE
const notifyCorporative = async(obj, req) => {
    const insert = {
        identifierId: obj.identifierId,
        businessId: obj.businessId,
        isUser: 1,
        type: obj.type,
        title: obj.title,
        description: obj.description,
        notificationType: 2, //SERVICIO CORPORATIVO
        data: obj.data,
        createdAt: new Date()
    }
    const doc = await notifyLog.create(insert);
    obj.notificationId = doc._id;
    const res = await SocketUsers.findOne({ id: obj.identifierId }, 'socketId'). limit(1);
    if( res ){
        const { socketId } = res;
        req.io.to(socketId).emit('changeStatusCorporative', obj);
    }else{
        console.log('El cliente no estaba conectado');
    }

}
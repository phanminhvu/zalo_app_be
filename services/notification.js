const admin = require('firebase-admin');
const User = require('../models/user');

let initialized = false;

exports.init = async (req, res, next) => {
    if (!initialized) {
        const serviceAccount = require('./../quequan-prod-firebase-adminsdk.json');
        try {
            await admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            initialized = true;
        } catch (err) {
            console.log(err);
            return next(err);
        }
    }
    next();
};

exports.test = async (tokenDevice, title, content, status) => {
    const message = {
        notification: {
            title: title,
            body: content,
            // sound: 'notification.wav',
            // android_channel_id: "app.quequan.vn"
        },
        data: {
            status: status,
            sound: 'notification',
        },
        token: tokenDevice,
        android: {
            notification: {
                sound: 'notification.wav',
                channel_id: "app.quequan.vn"
            }
        },
        apns: {
            payload: {
                aps: {
                    sound: 'notification.wav'
                }
            }
        }
    };

    admin.messaging().send(message)
        .then((response) => {
            console.log('Gửi thông báo thành công:', response);
        })
        .catch((error) => {
            console.log('Gửi thông báo thất bại:', error);
        });
};

/*
* @param status create = 1; produce = 2; ship = 3; success = 4
*/
exports.send = async (storeId, userId,  title, content, status, channel = "ban-lam-viec") => {
    const usersWithStoreOne = await User.find({ 
        store: storeId, 
        tokenDevice: { $ne: null },
        _id: { $ne: userId }
    }, { 
        tokenDevice: 1 
    });

    const tokenDevices = usersWithStoreOne.map(user => user.tokenDevice).filter(token => !!token);

    const messages = tokenDevices.map(tokenDevice => {
        return {
            notification: {
                title: title,
                body: content,
                // sound: 'notification.wav',
                // android_channel_id: "app.quequan.vn"
            },
            data: {
                status: status,
                channel: channel,
                sound: 'notification',
            },
            token: tokenDevice,
            android: {
                notification: {
                    sound: 'notification.wav',
                    channel_id: "app.quequan.vn"
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'notification.wav'
                    }
                }
            }
        };
    });

    try {
        const sendPromises = messages.map(message => {
            return admin.messaging().send(message);
        });

        Promise.all(sendPromises)
        .then((responses) => {
            responses.forEach((response, index) => {
                console.log(`Gửi thông báo cho thiết bị ${tokenDevices[index]} thành công:`, response);
            });
        })
        .catch((error) => {
            console.log('Gửi thông báo thất bại:', error);
        });
    }
    catch (err) {
        console.log('Gửi thông báo thất bại:', err);
    }
};
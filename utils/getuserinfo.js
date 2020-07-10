const firebase = require('../database');

module.exports = async (userId) => {
    const userInfo = await (await firebase.database().ref(`users/${userId}`).once('value')).val();
    return userInfo;
}
const userSockets = [];

/*Summary: add new socket*/
function userJoin(socketId, userId, channelId) {
    const appendingUserSocket = { socketId: socketId, userId: userId, channelId: channelId };
    userSockets.push(appendingUserSocket);
    return appendingUserSocket;
}

/*Summary: find socket by socket ID*/
function getUserBySocketId(socketId) {
    return userSockets.find(userSocket => userSocket.socketId === socketId);
}

/*Summary: remove socket by socket ID*/
function userLeave(socketId) {
    const index = userSockets.findIndex(userSocket => userSocket.socketId === socketId);
    if (index !== -1){
        return userSockets.splice(index, 1)[0];
    }
}

/*Summary: get all socket ids by user ID*/
function getSocketsByUserId(userId){
    return userSockets.filter(userSocket => userSocket.userId === userId);
}

/*Summary: get the users in the group*/
function getRoomUsers(channelId){
    return userSockets.filter(userSocket => userSocket.channelId === channelId);
}

module.exports = {
    userJoin,
    getUserBySocketId,
    userLeave,
    getSocketsByUserId,
    getRoomUsers
}
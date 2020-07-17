const userSockets = [];

/*Summary: add new socket*/
function userJoin(socketId, userId, channelId) {
    const userSocket = { socketId: socketId, userId: userId, channelId: channelId };
    userSockets.push(userSocket);
    return userSocket;
}

/*Summary: find socket by socket ID*/
function getCurrentUser(socketId) {
    return userSockets.find(userSocket => userSocket.socketId === socketId);
}

/*Summary: remove socket by socket ID*/
function userLeave(socketId) {
    const index = userSockets.findIndex(userSocket => userSocket.socketId === socketId);
    if (index !== -1){
        return userSockets.splice(index, 1)[0];
    }
}

/*Summary: get the users in the group*/
function getRoomUsers(channelId){
    return userSockets.filter(userSocket => userSocket.channelId === channelId);
}

module.exports = {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
}
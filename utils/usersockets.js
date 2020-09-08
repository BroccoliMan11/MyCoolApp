const userSockets = [];

/*Summary: add new socket*/
exports.userJoin = (socketId, userId, channelId) => {
    const appendingUserSocket = { socketId: socketId, userId: userId, channelId: channelId };
    userSockets.push(appendingUserSocket);
    return appendingUserSocket;
}

/*Summary: find socket by socket ID*/
exports.getUserBySocketId = (socketId) => {
    return userSockets.find(userSocket => userSocket.socketId === socketId);
}

/*Summary: remove socket by socket ID*/
exports.userLeave = (socketId) => {
    const index = userSockets.findIndex(userSocket => userSocket.socketId === socketId);
    if (index !== -1){
        return userSockets.splice(index, 1)[0];
    }
}

/*Summary: get all socket ids by user ID*/
exports.getSocketsByUserId = (userId) => {
    return userSockets.filter(userSocket => userSocket.userId === userId);
}

/*Summary: get the users in the group*/
exports.getRoomUsers = (channelId) => {
    return userSockets.filter(userSocket => userSocket.channelId === channelId);
}
const socketio = require('socket.io');

//functions retrieved from other files
const { userJoin, userLeave, getUserBySocketId} = require('./utils/usersockets');
const { getUserInfo, getGroupMessagesFormatted } = require('./utils/dbretrieve');
const { addNewGroupMessage } = require('./utils/dbmanipulate');
const usersockets = require('./utils/usersockets');

let io;

function getSocketIO(){
    if (!io) console.error('io is not defined!');
    return io;
}

function initalizeSocketIO(server, sessionMiddleware){
    io = socketio(server);

    io.use((socket, next) => {
        sessionMiddleware(socket.request, {}, next);
    })

    io.use((socket, next) => {
        if (!socket.request.session.passport){
            socket.emit('noSession');
        }
        next();
    });

    io.on("connection", socket => {

        const userId = socket.request.session.passport.user;
        let selectedChannelId;

        /*Summary: listen if user joins the channel => add user socket => load messages*/
        socket.on('enterChannel', async (channelId) => {
            const userInfo = await getUserInfo(userId);
            if (!userInfo.groups.includes(channelId) && !Object.values(userInfo.friends).includes(channelId)) {
                return socket.emit('leaveUser', {message: 'you do not have access to this group or channel!'});
            }
            selectedChannelId = channelId;
            userJoin(socket.id, userId, selectedChannelId);
            socket.join(selectedChannelId);
            const messages = await getGroupMessagesFormatted(selectedChannelId, 50, undefined);
            socket.emit('loadMessages', messages);
        });

        /*Summary: listen if user sent a mesage => send back formatted message => add message to database*/
        socket.on('chatMessage', async (text) => {

            const userSocket = getUserBySocketId(socket.id);

            if (!userSocket || userSocket.channelId !== selectedChannelId){
                return socket.emit('leaveUser', {message: 'you do not have access to this group or channel!'});
            }

            if (text.trim() === '') return;
            if (text.length > 2000) return;

            const user = await getUserInfo(userSocket.userId);
            const currentTime = Date.now();

            const formattedMessage = { username: user.username, text: text.trimEnd(), time: currentTime }
            const unformattedMessage = { userId: user.id, text: text.trimEnd(), time: currentTime }

            io.to(userSocket.channelId).emit('message', formattedMessage);
            addNewGroupMessage(userSocket.channelId, unformattedMessage);
        });

        /*Summary: listen if user scrolls to top of message container => load more messages*/
        socket.on('scrolledTop', async (nextMessageId) => {
            const userSocket = getUserBySocketId(socket.id);

            if (!userSocket || userSocket.channelId !== selectedChannelId){
                return socket.emit('leaveUser', {message: 'you do not have access to this group or channel!'});
            }

            const messages = await getGroupMessagesFormatted(userSocket.channelId, 50, nextMessageId);
            socket.emit('loadMessages', messages);
        });

        socket.on('disconnect', () => {
            userLeave(socket.id);
        })
    });

}

module.exports = {
    getSocketIO,
    initalizeSocketIO
}

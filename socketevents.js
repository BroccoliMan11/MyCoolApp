const socketio = require('socket.io');

//functions retrieved from other files
const { userJoin, userLeave, getUserBySocketId, getSocketsByUserId} = require('./utils/usersockets');
const { getUserInfo, getChannelMessages } = require('./utils/dbretrieve');
const { addNewGroupMessage } = require('./utils/dbmanipulate');

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
        if (!socket.request.session.passport || !socket.request.session.passport.user){
            return socket.emit('noSession');
        }
        next();
    });

    //prevent flooding (spam)
    const { RateLimiterMemory } = require('rate-limiter-flexible');
    const rateLimiter = new RateLimiterMemory({
        points: 1,
        duration: 1,
        blockDuration: 1
    });

    io.on("connection", socket => {

        const userId = socket.request.session.passport.user; //the user's id
        let selectedChannelId; //the selected channel
        let currentMessageId; //the current message id

        /*Summary: listen if user joins the channel => add user socket => load messages*/
        socket.on('enterChannel', async (channelId) => {
            const userInfo = await getUserInfo(userId);
            if (!userInfo.groups.includes(channelId) && !Object.values(userInfo.friends).includes(channelId)) {
                return socket.emit('leaveUser', {message: 'you do not have access to this group or channel!'});
            }
            selectedChannelId = channelId;
            userJoin(socket.id, userId, selectedChannelId);
            socket.join(selectedChannelId);
            const messages = await getChannelMessages(selectedChannelId, 50, undefined, true);
            currentMessageId = messages.newMessageId;
            socket.emit('loadMessages', {...messages, onenter: true });
        });

        /*Summary: listen if user sent a mesage => send back formatted message => add message to database*/
        socket.on('chatMessage', async (text) => {
            try {
                await rateLimiter.consume(socket.handshake.address);
                const userSocket = getUserBySocketId(socket.id);
                if (!userSocket || userSocket.channelId !== selectedChannelId){
                    return socket.emit('leaveUser', {message: 'you do not have access to this group or channel!'});
                }
                if (text.trim() === '') return;
                if (text.length > 2000) return;
                const user = await getUserInfo(userSocket.userId);
                const currentTime = Date.now();
                const unformattedMessage = { userId: user.id, text: text.trimEnd(), time: currentTime }
                const newGroupMessage = await addNewGroupMessage(selectedChannelId, unformattedMessage);
                const formattedMessage = { messageId: newGroupMessage.id, user: { id: user.id, username: user.username } , text: text.trimEnd(), time: currentTime }
                io.to(userSocket.channelId).emit('message', formattedMessage);
            } catch (rejRes) {
                socket.emit('spam', { message: 'piss off! Stop spamming!'});
            }
        });

        /*Summary: listen if user scrolls to top of message container => load more messages*/
        socket.on('scrolledTop', async () => {
            const userSocket = getUserBySocketId(socket.id);
            if (!userSocket || userSocket.channelId !== selectedChannelId){
                return socket.emit('leaveUser', {message: 'you do not have access to this group or channel!'});
            }
            const messages = await getChannelMessages(selectedChannelId, 50, currentMessageId, false);
            currentMessageId = messages.newMessageId;
            socket.emit('loadMessages', { ...messages, onenter: false });
        });

        /*Summary: listen if user disconnects */
        socket.on('disconnect', () => {
            userLeave(socket.id);
        })
    });

}

module.exports = {
    getSocketIO,
    initalizeSocketIO
}

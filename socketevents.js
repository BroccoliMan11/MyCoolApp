const socketio = require('socket.io');

//functions retrieved from other files
const { userJoin, userLeave, getUserBySocketId, getSocketsByUserId} = require('./utils/usersockets');
const { getUserInfo, getChannelMessages } = require('./utils/dbretrieve');
const { addNewGroupMessage } = require('./utils/dbmanipulate');

let io;

const ADMIN_BOT_ID = "-MGRo94dVvYNLfCOxYDf";
const ADMIN_BOT_USERNAME = "ADMIN_BOT";

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
        blockDuration: 5
    });

    io.on("connection", socket => {

        const userId = socket.request.session.passport.user; //the user's id
        let selectedChannelId; //the selected channel
        let currentMessageId; //the current message id

        /*Summary: listen if user joins the channel => add user socket => load messages*/
        socket.on('enterChannel', async (channelId) => {
            const userInfo = await getUserInfo(userId);
            const includingGroup = userInfo.groups && userInfo.groups.includes(channelId);
            const includingFriendChannel = userInfo.friends && Object.values(userInfo.friends).includes(channelId);
            if (!includingGroup && !includingFriendChannel) {
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
                if (typeof text !== "string") return;
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

/* Summary: destroy sockets to prevent users from exchanging messages through a specific channel*/
function purgeChannelSockets(kickingUserId, groupId){
    const leavingUserSockets = getSocketsByUserId(kickingUserId);
    leavingUserSockets.forEach( userSocket => {
        io.sockets.connected[userSocket.socketId].emit('leaveUser', groupId);
        if (userSocket.channelId === groupId){
            io.sockets.connected[userSocket.socketId].leave(groupId);
            userLeave(userSocket.id);
        }
    });
}

/*Summary: sends a message to all users in the channel when an event would occur*/
async function sendAdminMessage(channelId, event, username = null) {
    let text;

    switch (event) {
        case "join": text = `"${username}" has joined the group!`; break;
        case "leave": text = `"${username}" has left the group!`; break;
        case "createdGroup": text = `Group channel created! Invite friends to start a community!`; break;
        case "createdDM": text = `DM channel created! Enter a message to start a conversation!`; break;
        case "kick": text = `"${username}" has been kicked from the group!`; break;
        case "promote": text = `"${username}" has been promoted as leader!`; break;
    }

    const time = Date.now();
    const unformattedMessage = { userId: ADMIN_BOT_ID, text, time }
    const newGroupMessage = await addNewGroupMessage(channelId, unformattedMessage);
    const formattedMessage = { messageId: newGroupMessage.id, user: { id: ADMIN_BOT_ID, username: ADMIN_BOT_USERNAME}, text, time }

    io.to(channelId).emit("message", formattedMessage);
}

/*Summary: tells users on client side that a member has joined the group (updates the memberlist component on the page)*/
async function addToMemberList(channelId, user) {
    io.to(channelId).emit("memberJoin", user);
}

/*Summary: tells users on client side that a member has left the group (updates the memberlist component on the page)*/
async function removeFromMemberList(channelId, userId) {
    io.to(channelId).emit("memberLeave", userId);
}

/*Summary: tells users on the client side that a member has updated their username (updates the memberlist component on the page)*/
async function updateMemberUsername(user, username) {
    const allGroups = user.groups;
    console.log(allGroups);
    allGroups.forEach(groupId => {
        io.to(groupId).emit("memberUsernameUpdate", { id: user.id, username });
    });
}

/*Summary: tells the promoted member that they are now leader by adding the "kick" button to their page */
async function updateFooterForLeader(groupId, userId) {
    const promotingSockets = getSocketsByUserId(userId);
    promotingSockets.forEach( userSocket => {
        if (userSocket.channelId === groupId) {
            io.sockets.connected[userSocket.socketId].emit("promote", groupId);
        }
    });
}

module.exports = {
    purgeChannelSockets,
    sendAdminMessage,
    addToMemberList,
    updateMemberUsername,
    updateFooterForLeader,
    removeFromMemberList,
    getSocketIO,
    initalizeSocketIO
}

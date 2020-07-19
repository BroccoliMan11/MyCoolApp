//functions retrieved from other files
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/usersockets');
const { getGroupInfo, getUserInfo, getGroupMessagesFormatted } = require('./utils/dbretrieve');
const { addNewGroupMessage } = require('./utils/dbmanipulate');

module.exports = (io) => {
    io.on("connection", socket => {
        /*Summary: listen if user joins the channel => add user socket => load messages*/
        socket.on('joinChannel', async ({userId, channelId}) => {
            const userSocket = userJoin(socket.id, userId, channelId);
            socket.join(userSocket.channelId);
            const messages = await getGroupMessagesFormatted(userSocket.channelId, 50, undefined);
            socket.emit('loadMessages', messages);
        });

        /*Summary: listen if user sent a mesage => send back formatted message => add message to database*/
        socket.on('chatMessage', async (text) => {

            if (text.trim() === '') return;
            if (text.length > 2000) return;

            const userSocket = getCurrentUser(socket.id);

            const user = await getUserInfo(userSocket.userId);
            const currentTime = Date.now();

            const formattedMessage = { username: user.username, text: text, time: currentTime }
            const unformattedMessage = { userId: user.id, text: text, time: currentTime }

            io.to(userSocket.channelId).emit('message', formattedMessage);
            addNewGroupMessage(userSocket.channelId, unformattedMessage);
        });

        /*Summary: listen if user scrolls to top of message container => load more messages*/
        socket.on('scrolledTop', async (nextMessageId) => {
            const userSocket = getCurrentUser(socket.id);
            const messages = await getGroupMessagesFormatted(userSocket.channelId, 50, nextMessageId);
            socket.emit('loadMessages', messages);
        });
    });
}

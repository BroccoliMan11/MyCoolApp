const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/usersockets');
const { getGroupInfo, getUserInfo, getGroupMessagesFormatted } = require('./utils/dbretrieve');
const { addNewGroupMessage } = require('./utils/dbmanipulate');

module.exports = (io) => {
    io.on("connection", socket => {
        socket.on('joinChannel', async ({userId, channelId}) => {
            const userSocket = userJoin(socket.id, userId, channelId);
            socket.join(userSocket.channelId);
            const messageLog = await getGroupMessagesFormatted(userSocket.channelId);
            if (messageLog) socket.emit('loadMessages', messageLog);
        });

        socket.on('chatMessage', async (text) => {
            if (text.trim() === '') return;
            if (text.length > 2000) return;

            const userSocket = getCurrentUser(socket.id);

            const user = await getUserInfo(userSocket.userId);
            const currentTime = Date.now();

            const formattedMessage = { username: user.username, text: text, time: currentTime }
            const unformattedMessage = { userId: user.id, text: text, time: currentTime }

            console.log(unformattedMessage);

            io.to(userSocket.channelId).emit('message', formattedMessage);
            addNewGroupMessage(userSocket.channelId, unformattedMessage);
        });
    });
}

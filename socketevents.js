
const firebase = require('./database');

const formatMessage = require('./utils/formatmessage');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/usersockets');

module.exports = (io) => {
    io.on("connection", socket => {
        socket.on('joinChannel', async ({user, channelId}) => {

            const userSocket = userJoin(socket.id, user, channelId);
            socket.join(userSocket.channelId);

            const channelMessageLogRef = await firebase.database().ref(`channels/${channelId}/messageLog`).once('value');
            if (channelMessageLogRef.exists()){
                const allMessages = Object.values(channelMessageLogRef.val());
                socket.emit('loadMessages', allMessages);
            }
            // socket.emit('message', formatMessage('BOT', 'Welcome to the chat!'));

            // socket.broadcast.to(user.channelId).emit('message', formatMessage('BOT', `A ${user.username} has joined the chat!`));
        });

        socket.on('chatMessage', (text) => {
            if (text.trim() === '') return;
            if (text.length > 2000) return;
            const userSocket = getCurrentUser(socket.id);
            const formattedMessage = formatMessage(userSocket.user, text);
            io.to(userSocket.channelId).emit('message', formattedMessage);
            firebase.database().ref(`channels/${userSocket.channelId}/messageLog`).push(formattedMessage);
        });

        socket.on('disconnect', () => {
            const userSocket = userLeave(socket.id);
            // if (user) {
            //     io.to(user.channelId).emit('message', formatMessage('BOT', `${user.username} has left the chat`));
            // }
        });
    });
}

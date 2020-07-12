const socket = io();

const messageContainer = document.querySelector('#message-container');
const messageForm = document.querySelector("#send-container");
const messageInput = document.querySelector("#message-input");

(async function joinChannel() {
    const selectedChannelId = window.location.pathname.split('/').pop();
    const response = await fetch('/getuserinfo');
    const user = await response.json();
    socket.emit('joinChannel', {userId: user.id, channelId: selectedChannelId});
})();

socket.on('message', async message => {
    console.log(message);
    const isAtBottom = (messageContainer.scrollHeight - messageContainer.scrollTop === messageContainer.clientHeight);
    outputMessage(message);
    if (isAtBottom){
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
});

socket.on('loadMessages', allMessages => {
    allMessages.forEach(message => outputMessage(message));
    messageContainer.scrollTop = messageContainer.scrollHeight;
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;
    socket.emit('chatMessage', message);
    messageInput.value = '';
    messageContainer.scrollTop = messageContainer.scrollHeight;
});

function outputMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.innerText = `${message.username} (${message.time.toString()}): ${message.text}`;
    messageContainer.append(messageElement);
}

function switchChannel(channelGroup, channelId){
    window.location.replace(`/${channelGroup}/all/${channelId}`);
}
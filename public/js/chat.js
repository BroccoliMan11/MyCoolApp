const socket = io();

const messageContainer = document.querySelector('#message-container');
const messageForm = document.querySelector("#send-container");
const messageInput = document.querySelector("#message-input");

let selectedMessageIndex = 0;

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

socket.on('loadMessages', (messages) => {
    selectedMessageIndex = messages.newMessageIndex;
    messages.nextGroupMessages.forEach(message => outputMessage(message));
    messageContainer.scrollTop = messageContainer.scrollHeight;
});

socket.on('loadMessagesFromTop', (messages) => {
    selectedMessageIndex = messages.newMessageIndex;
    messages.nextGroupMessages.forEach(message => outputMessage(message, true));
})

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;
    socket.emit('chatMessage', message);
    messageInput.value = '';
    messageContainer.scrollTop = messageContainer.scrollHeight;
});

messageContainer.addEventListener('scroll', () => {
    if (messageContainer.scrollTop === 0){
        socket.emit('scrolledTop', selectedMessageIndex);
    }
})

function outputMessage(message, insertToTop = false) {
    const messageElement = document.createElement('div');
    const timeOptions = { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit"}
    const timeString = new Date(message.time).toLocaleTimeString([], timeOptions);
    messageElement.innerText = `${message.username} (${timeString}): ${message.text}`;
    if (!insertToTop){
        messageContainer.appendChild(messageElement);
    } else {
        messageContainer.insertBefore(messageElement, messageContainer.firstElementChild);
    }
}

function switchChannel(channelGroup, channelId){
    window.location.replace(`/${channelGroup}/all/${channelId}`);
}
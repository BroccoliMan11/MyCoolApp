const socket = io();

const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");

let user;

async function addUser(){
    const res = await fetch('/userinfo');
    user = await res.json();
    // appendMessage(`${user.username} joined!`);
    socket.emit('new-user', user);
}
addUser();

socket.on('chat-message', data => {
    appendMessage(`${data.name}: ${data.message}`);
})

// socket.on('user-connected', name => {
//     appendMessage(`${name} connected`);
// })

// socket.on('user-disconnected', name =>{
//     appendMessage(`${name} disconnected`);
// })

messageForm.addEventListener('submit', e => {
    e.preventDefault();
    const message = messageInput.value;
    if (message.trim() === '') return;
    if (message.length > 2000) return;
    appendMessage(`${user.username}: ${message}`, true);
    socket.emit("send-chat-message", message);
    messageInput.value = '';
})

function appendMessage(message, isOwnMessage = false){
    const isAtBottom = 
    messageContainer.scrollHeight - messageContainer.scrollTop 
    == messageContainer.clientHeight;

    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageContainer.append(messageElement);

    if (isAtBottom || isOwnMessage) {
        messageContainer.scrollTo(0, messageContainer.scrollHeight);
    }
}

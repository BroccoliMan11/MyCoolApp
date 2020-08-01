const socket = io(); //socket emit and listen

const messageContainer = document.querySelector('#message-container'); //container to display messages in
const messageForm = document.querySelector("#send-container"); //the whole form to submit messages 
const messageInput = document.querySelector("#message-input"); //the actual messgae input textbox (inside "messageForm")
const loading = document.querySelector("#spinner-box"); //the spinning icon

/*Summary: join the channel*/
const selectedChannelId = window.location.pathname.split('/').pop();
socket.emit('enterChannel', selectedChannelId)

/*Summary: go to login page (when the user session does not exist)*/
socket.on('noSession', () => {
    window.location.href = '/login';
});

/*Summary: reload page to remove user from channel page*/
socket.on('leaveUser', () => {
    window.location.href = window.location.pathname.split('/').splice(0, 3).join('/');
});

/*Summary: listen if user was spamming*/
socket.on('spam', () => {
    $("#spam-modal").modal('show');
    messageInput.value = '';
});

/*Summary: append messages to message container*/
socket.on('message', message => {
    console.log(message);
    const isAtBottom = (messageContainer.scrollHeight - messageContainer.scrollTop === messageContainer.clientHeight);
    outputMessage(message, true);
    if (isAtBottom){
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
});

/*Summary: load messages into message container (appending to bottom)*/
socket.on('loadMessages', (messageLog) => {
    console.log(messageLog);
    if (messageLog.allMessagesLoaded){
        loading.style.display = "none";
    }
    const initialScrollHeight = messageContainer.scrollHeight;
    messageLog.messages.forEach(message => outputMessage(message, false));
    const finalScrollHeight = messageContainer.scrollHeight;
    if (messageLog.onenter){
        messageContainer.scrollTop = messageContainer.scrollHeight;
    } else {
        messageContainer.scrollTop = finalScrollHeight - initialScrollHeight;
    }
});

/*Sumary: message input send (textarea entered)*/
messageInput.addEventListener('keydown', (e) => {
    if (e.keyCode == 13){
        e.preventDefault();
        sendMessage();
    }
});

/*Summary: message input send (button submit)*/
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
});

/*Summary: send message, clear textarea and scroll to bottom*/
function sendMessage(){
    const message = messageInput.value;
    socket.emit('chatMessage', message);
    messageInput.value = '';
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

/*Summary: load extra messages*/
messageContainer.addEventListener('scroll', () => {
    if (messageContainer.scrollTop === 0){
        socket.emit('scrolledTop');
    }
})

/*Summary: append message to message container*/
function outputMessage(message, toBottom) {
    const messageElement = document.createElement('div');
    const messageHolder = document.createElement('p');
    const timeOptions = { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit"}
    const timeString = new Date(message.time).toLocaleTimeString([], timeOptions);
    messageElement.innerHTML = `<p style="margin:0"><span style="color:greenyellow;margin-right:0.25rem">${message.user.username}</span> <small style="color:lightgrey;margin-left:0.25rem">${timeString}</small></p>`;
    messageHolder.innerText = message.text;
    messageElement.append(messageHolder);
    if (toBottom) {
        messageContainer.append(messageElement);
    }else{
        messageContainer.insertBefore(messageElement, loading.nextSibling);
    }
}
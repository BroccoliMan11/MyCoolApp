const socket = io(); //socket emit and listen

const messageContainer = document.querySelector('#message-container'); //container to display messages in
const messageForm = document.querySelector("#send-container"); //the whole form to submit messages 
const messageInput = document.querySelector("#message-input"); //the actual messgae input textbox (inside "messageForm")
const loading = document.querySelector("#spinner-box"); //the spinning icon

//message index selected (used to see up to what index messgaes are loaded, this is for loading batches of messages)
let currentMessageId;

/*Summary: join the channel (In front end for now)*/
(async function joinChannel() {
    const selectedChannelId = window.location.pathname.split('/').pop();
    const response = await fetch('/getuserinfo');
    const user = await response.json();
    socket.emit('joinChannel', {userId: user.id, channelId: selectedChannelId});
})();

/*Summary: append messages to message container*/
socket.on('message', message => {
    const isAtBottom = (messageContainer.scrollHeight - messageContainer.scrollTop === messageContainer.clientHeight);
    outputMessage(message, true);
    if (isAtBottom){
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
});

/*Summary: load messages into message container (appending to bottom)*/
socket.on('loadMessages', (messages) => {
    console.log(messages);
    if (messages.oldestMessageReached){
        loading.style.display = "none";
    }
    const initialScrollHeight = messageContainer.scrollHeight;
    messages.nextGroupMessages.forEach(message => outputMessage(message, false));
    const finalScrollHeight = messageContainer.scrollHeight;
    if (!currentMessageId){
        messageContainer.scrollTop = messageContainer.scrollHeight;
    } else {
        messageContainer.scrollTop = finalScrollHeight - initialScrollHeight;
    }
    currentMessageId = messages.newMessageId;
});

messageInput.addEventListener('keydown', (e) => {
    if (e.keyCode == 13){
        e.preventDefault();
        sendMessage();
    }
});

/*Summary: message input send*/
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
});

function sendMessage(){
    const message = messageInput.value;
    socket.emit('chatMessage', message);
    messageInput.value = '';
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

/*Summary: load extra messages*/
messageContainer.addEventListener('scroll', () => {
    if (messageContainer.scrollTop === 0){
        socket.emit('scrolledTop', currentMessageId);
    }
})

/*Summary: append message to message container*/
function outputMessage(message, toBottom) {
    const messageElement = document.createElement('div');
    const messageHolder = document.createElement('p');
    const timeOptions = { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit"}
    const timeString = new Date(message.time).toLocaleTimeString([], timeOptions);
    messageElement.innerHTML = `<p style="margin:0"><span style="color:greenyellow;margin-right:0.25rem">${message.username}</span> <small style="color:lightgrey;margin-left:0.25rem">${timeString}</small></p>`;
    messageHolder.innerText = message.text;
    messageElement.append(messageHolder);
    // messageElement.innerText = `${message.username} (${timeString}): ${message.text}`;
    // messageElement.style.color = "white";
    if (toBottom) {
        messageContainer.append(messageElement);
    }else{
        messageContainer.insertBefore(messageElement, loading.nextSibling);
    }
}
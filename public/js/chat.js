const socket = io(); //socket emit and listen

const messageContainer = document.querySelector('#message-container'); //container to display messages in
const messageForm = document.querySelector("#send-container"); //the whole form to submit messages 
const messageInput = document.querySelector("#message-input"); //the actual messgae input textbox (inside "messageForm")
const loading = document.querySelector("#loading-spinner"); //the spinning icon

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
    const initialScrollHeight = messageContainer.scrollHeight;
    console.log(`initial scroll top: ${initialScrollHeight}`);
    messages.nextGroupMessages.forEach(message => outputMessage(message, false));
    const finalScrollHeight = messageContainer.scrollHeight;
    console.log(`final scroll top: ${finalScrollHeight}`);
    if (!currentMessageId){
        messageContainer.scrollTop = messageContainer.scrollHeight;
    } else {
        messageContainer.scrollTop = finalScrollHeight - initialScrollHeight;
        if (messages.oldestMessageReached){
            loading.remove();
        }
    }
    currentMessageId = messages.newMessageId;
});

/*Summary: message input send*/
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;
    socket.emit('chatMessage', message);
    messageInput.value = '';
    console.log(messageContainer.scrollTop);
    console.log(messageContainer.scrollHeight);
    messageContainer.scrollTop = messageContainer.scrollHeight;
    console.log(messageContainer.scrollTop);
    console.log(messageContainer.scrollHeight);
});

/*Summary: load extra messages*/
messageContainer.addEventListener('scroll', () => {
    if (messageContainer.scrollTop === 0){
        socket.emit('scrolledTop', currentMessageId);
    }
})

/*Summary: append message to message container*/
function outputMessage(message, toBottom) {
    const messageElement = document.createElement('div');
    const timeOptions = { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit"}
    const timeString = new Date(message.time).toLocaleTimeString([], timeOptions);
    messageElement.innerText = `${message.username} (${timeString}): ${message.text}`;
    messageElement.style.color = "white";
    if (toBottom) {
        messageContainer.append(messageElement);
    }else{
        messageContainer.insertBefore(messageElement, messageContainer.childNodes[2]);
    }
}
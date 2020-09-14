const socket = io(); //socket emit and listen

const messageContainer = document.querySelector('.message-log'); //container to display messages in
const messageForm = document.querySelector(".send-container"); //the whole form to submit messages 
const messageInput = document.querySelector(".message-input"); //the actual messgae input textbox (inside "messageForm")
const loading = document.querySelector(".message-log .spinner-box"); //the spinning icon

/*Summary: join the channel*/
const selectedChannelId = window.location.pathname.split('/').pop(); //if you change this variable the whole thing pops do don't
socket.emit('enterChannel', selectedChannelId)

/*Summary: go to login page (when the user session does not exist)*/
socket.on('noSession', () => {
    window.location.href = '/login';
});

/*Summary: reload page to remove user from channel page OR remove channel if it is not selected*/
socket.on('leaveUser', (channelId) => {
    console.log("leaving user!");
    if (channelId === selectedChannelId) {
        window.location.href = window.location.pathname.split('/').splice(0, 3).join('/');
    } else {
        const channelRemoving = document.querySelector(`.channels-container [channel_id=${channelId}]`);
        channelRemoving.remove();
    }
});

/*Summary: deletes member from members list when they leave*/
socket.on("memberLeave", (userId) => {
    const memberRemoving = document.querySelector(`.members-container [user_id=${userId}]`);
    memberRemoving.remove();
});

/*Summary: adds member to members list when they join */
socket.on("memberJoin", (user) => {
    const memberAdding = document.createElement("div");
    memberAdding.classList.add("list-group-item", "list-group-item-action");
    memberAdding.setAttribute("user_id", user.id);
    memberAdding.innerText = user.username
    const memberContainer = document.querySelector(".members-container");
    memberContainer.append(memberAdding);
});

/*Summary: updates member's username when it is changed*/
socket.on("memberUsernameUpdate", (user) => {
    const memberUpdating = document.querySelector(`.members-container [user_id=${user.id}]`);
    memberUpdating.innerText = user.username;
})

/*Summary: when the user is promoted */
socket.on("promote", (channelId) => {
    if (selectedChannelId === channelId) {
        const kickButton = document.createElement("button");
        kickButton.classList.add("btn", "btn-danger", "btn-sm");
        kickButton.style.marginLeft = "10px";
        kickButton.style.height = "20%";
        kickButton.setAttribute("data-toggle", "modal");
        kickButton.setAttribute("data-target", "#kick-modal");
        kickButton.innerText = "Kick";
        const footer = document.querySelector(".footer");
        footer.append(kickButton);
    }
}); 

/*Summary: listen if user was spamming*/
socket.on('spam', () => {
    $("#spam-modal").modal('show');
    messageInput.value = '';
});

/*Summary: append messages to message container*/
socket.on('message', message => {
    const isAtBottom = (messageContainer.scrollHeight - messageContainer.scrollTop === messageContainer.clientHeight);
    outputMessage(message, true);
    if (isAtBottom){
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
});

/*Summary: load messages into message container (appending to bottom)*/
socket.on('loadMessages', (messageLog) => {
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

    //entire message
    const messageElement = document.createElement('div');
    messageElement.style.padding = "10px";

    //title element
    const titleDiv = document.createElement('div');

    //name of user
    const nameSpan = document.createElement("span");
    nameSpan.style.color = "greenyellow";
    nameSpan.style.marginRight = "0.25rem";
    nameSpan.innerText = message.user.username;

    //date 
    const timeOptions = { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit"}
    const timeString = new Date(message.time).toLocaleTimeString([], timeOptions);
    const dateSmall = document.createElement("small");
    dateSmall.style.color = "lightgrey";
    dateSmall.style.marginLeft = "0.25rem";
    dateSmall.innerText = timeString;

    //add elements to title
    titleDiv.appendChild(nameSpan);
    titleDiv.appendChild(dateSmall);

    //add title to message element
    messageElement.append(titleDiv);

    //actual message
    const messageHolder = document.createElement("div");
    messageHolder.innerText = message.text;

    messageElement.append(messageHolder);

    if (toBottom) {
        messageContainer.append(messageElement);
    }else{
        messageContainer.insertBefore(messageElement, loading.nextSibling);
    }
}
function acceptFriendRequest(id){
    const xhttp = new XMLHttpRequest();
    xhttp.open('POST', `/friends/requests/accept/${id}`);
    xhttp.onload = function() {
        if (xhttp.status >= 200 && xhttp.status < 400){
            removeRequestDiv(id);
        }
    }
    xhttp.send();
}

function rejectFriendRequest(id){
    const xhttp = new XMLHttpRequest();
    xhttp.open('POST', `/friends/requests/reject/${id}`);
    xhttp.onload = function() {
        if (xhttp.status >= 200 && xhttp.status < 400){
            removeRequestDiv(id);
        }
    }
    xhttp.send();
}

function removeRequestDiv(id){
    const div = document.querySelector(`[user_id="${id}"]`);
    const requestContainer = document.querySelector("#request-container");
    requestContainer.removeChild(div);
    if (requestContainer.childElementCount === 0){
        requestContainer.textContent = "no friend requests"
    }
}
/*Summary: accept friend request
1. send POST request to server to accept friend request
2. if response is okay => remove the "div" element for the accepted request*/
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

/*Summary: reject friend request
1. send POST request to server to reject friend request
2. if response is okay => remove the "div" element for the rejected request*/
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

/*Summary: remove request "div" element 
Input: id = selected user id
1. remove DOM element here the tag "user_id" = "id"
2. if there is not friend request left => display text "No friend requests"
*/
function removeRequestDiv(id){
    const div = document.querySelector(`[user_id="${id}"]`);
    const requestContainer = document.querySelector("#request-container");
    requestContainer.removeChild(div);
    if (requestContainer.childElementCount === 0){
        requestContainer.textContent = "No friend requests"
    }
}
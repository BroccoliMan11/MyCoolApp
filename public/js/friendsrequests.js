/*Summary: accept friend request*/
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

/*Summary: reject friend request*/
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
Input: id = selected user id*/
function removeRequestDiv(id){
    const request = $(`[user_id="${id}"]`);
    const container = $("#requests-container");
    request.fadeOut(200, () => {
        request.remove();
        if (container.children().length === 0){
            container.text('No friend requests');
        }
    });
}


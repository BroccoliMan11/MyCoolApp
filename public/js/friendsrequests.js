/*Summary: accept friend request*/
async function acceptFriendRequest(id){
    const response = await fetch(`/friends/requests/accept/${id}`, { method: 'POST' });
    if (response.status < 200 || response.status >= 400){
        $("#invalid-request").modal('show');
    }
    removeRequestDiv(id);
}

/*Summary: reject friend request*/
async function rejectFriendRequest(id){
    const response = await fetch(`/friends/requests/reject/${id}`, { method: 'POST' });
    if (response.status < 200 || response.status >= 400){
        $("#invalid-request").modal('show');
    }
    removeRequestDiv(id);
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


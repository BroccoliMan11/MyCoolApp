function acceptGroupInvitation(id){
    const xhttp = new XMLHttpRequest();
    xhttp.open('POST', `/groups/invitations/accept/${id}`);
    xhttp.onload = function() {
        if (xhttp.status >= 200 && xhttp.status < 400){
            removeInvitationDiv(id);
        }
    }
    xhttp.send();
}

function rejectGroupInvitation(id){
    const xhttp = new XMLHttpRequest();
    xhttp.open('POST', `/groups/invitations/reject/${id}`);
    xhttp.onload = function() {
        if (xhttp.status >= 200 && xhttp.status < 400){
            removeInvitationDiv(id);
        }
    }
    xhttp.send();
}

function removeInvitationDiv(id){
    const div = document.querySelector(`[group_id="${id}"]`);
    const requestContainer = document.querySelector("#request-container");
    requestContainer.removeChild(div);
    if (requestContainer.childElementCount === 0){
        requestContainer.textContent = "no group requests"
    }
}
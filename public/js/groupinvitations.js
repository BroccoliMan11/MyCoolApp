/*Summary: accept group invitation*/
function acceptGroupInvitation(id){
    const xhttp = new XMLHttpRequest();
    xhttp.open('POST', `/groups/invitations/accept/${id}`);
    xhttp.onload = function() {
        if (!(xhttp.status >= 200 && xhttp.status < 400)){
            $("#invalidInvitation").modal('show');
        }
        removeInvitationDiv(id);
    }
    xhttp.send();
}

/*Summary: reject group invitation*/
function rejectGroupInvitation(id){
    const xhttp = new XMLHttpRequest();
    xhttp.open('POST', `/groups/invitations/reject/${id}`);
    xhttp.onload = function() {
        if (!(xhttp.status >= 200 && xhttp.status < 400)){
            $("#invalidInvitation").modal('show');
        }
        removeInvitationDiv(id);
    }
    xhttp.send();
}

/*Summary: remove invitation "div" element 
Input: id = selected group id*/
function removeInvitationDiv(id){
    const invitation = $(`[group_id="${id}"]`);
    const container = $("#invitations-container");
    invitation.fadeOut(200, () => {
        invitation.remove();
        if (container.children().length === 0){
            container.text('No group invitations');
        }
    });
}
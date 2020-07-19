/*Summary: accept group invitation
1. send POST request to server to accept group invitation
2. if response is okay => remove the "div" element for the accepted invitation*/
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

/*Summary: reject group invitation
1. send POST request to server to reject group invitation
2. if response is okay => remove the "div" element for the rejected invitation*/
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
Input: id = selected group id
1. remove DOM element here the tag "group_id" = "id"
2. if there is not group invitation left => display text "No group invitations"
*/
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
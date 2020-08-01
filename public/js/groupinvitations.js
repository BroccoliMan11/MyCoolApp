/*Summary: accept group invitation*/
async function acceptGroupInvitation(id){
    const response = await fetch(`/groups/invitations/accept/${id}`, { method: 'POST' });
    if (response.status < 200 || response.status >= 400){
        $("#invalid-invitation").modal('show');
    }
    removeInvitationDiv(id);
}

/*Summary: reject group invitation*/
async function rejectGroupInvitation(id){
    const response = await fetch(`/groups/invitations/reject/${id}`, { method: 'POST' });
    if (response.status < 200 || response.status >= 400){
        $("#invalid-invitation").modal('show');
    }
    removeInvitationDiv(id);
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
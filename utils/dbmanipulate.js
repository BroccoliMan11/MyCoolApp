//get dependecies
const db = require('../database');
const { getGroupInfo } = require('./dbretrieve');


/*Summary: creates a new user
Input: addingUserData = new user's details (OBJECT)
Output: new user's detail, including new ID (OBJECT)*/
async function createNewUser(addingUserData){
    const addedUserId = db.ref('users').push(addingUserData).key;
    return {...addingUserData, id: addedUserId };
}

/*Summary: adds both users as friends
Inputs: recieverId = ID of user who recieved the friend request (STRING)
        senderId = ID of user who sent the friend request (STRING)*/
async function acceptFriendRequest(recieverId, senderId) {
    const createChannelId = (await createNewChannel({ channelType: "DM" })).id;
    await db.ref(`users/${recieverId}/friends/${senderId}`).set(createChannelId);
    await db.ref(`users/${senderId}/friends/${recieverId}`).set(createChannelId);
    await removeFriendRequest(recieverId, senderId);
    return { id: createChannelId };
}

/*Summary: creates new channel
Input: addingChannelData = new channel's details (OBJECT)
Output: new channel's details, including new ID (OBJECT)*/
async function createNewChannel(addingChannelData){
    const addedChannelId = (await db.ref('channels').push(addingChannelData)).key;
    return { ...addingChannelData, id: addedChannelId };
}

/*Summary: join user to group
Inputs: addingUserId = ID of adding user (STRING)
        groupId = ID of group the user is joining (STRING)
        role = user's new role in the group (STRING)*/
async function joinGroup(addingUserId, groupId, role){
    await db.ref(`channels/${groupId}/members/${addingUserId}`).set(role);
    await db.ref(`users/${addingUserId}/groups/${groupId}`).set(true);
    await removeGroupInvitation(addingUserId, groupId);
}

/*Summary: remove user from group
Inputs: leavingId = ID of user leaving (SRING)
        groupId = ID of group (STRING)*/
async function leaveGroup(leavingUserId, groupId){
    await db.ref(`channels/${groupId}/members/${leavingUserId}`).remove();
    await db.ref(`users/${leavingUserId}/groups/${groupId}`).remove();
}

/*Summary: delete group
Inputs: groupId = ID of group deleting (STRING)*/
async function deleteGroup(groupId){
    const groupInfo = await getGroupInfo(groupId);
    const allGroupMemberIds = Object.keys(groupInfo.members);
    if (groupInfo.usersInvited){
        for (userId of groupInfo.usersInvited){
            await db.ref(`users/${userId}/groupInvitations/${groupId}`).remove();
        }
    }
    for (memberId of allGroupMemberIds){
        await leaveGroup(memberId, groupId);
    }
    await removeChannel(groupId);
}

/*Summary: change member's role in database
Inputs: groupId = ID of group (STRING)
        promotingId = ID of user promoting (STRING)
        role = user's new role (STRING)*/
async function promoteGroupMember(groupId, promotingId, newRole){
    await db.ref(`channels/${groupId}/members/${promotingId}`).set(newRole);
}

/*Summary: remove user's group invitation in database
Inputs: userId = ID of user removing invitation from (STRING)
        removingGroupId = group ID removing from invitations (STRING)*/
async function removeGroupInvitation(userId, removingGroupId){
    await db.ref(`users/${userId}/groupInvitations/${removingGroupId}`).remove();
    await db.ref(`channels/${removingGroupId}/usersInvited/${userId}`).remove();
}

/*Summary: remove channel from database
Inputs: removingChannelId = ID of channel removing (STRING)*/
async function removeChannel(removingChannelId){
    await db.ref(`channels/${removingChannelId}`).remove();
}

/*Summary: remove user's friend request in database
Inputs: recieverId = ID of user who recieved the request (STRING)
        senderId = ID of user who sent the request (STRING)*/
async function removeFriendRequest(recieverId, senderId) {
    await db.ref(`users/${recieverId}/friendRequests/${senderId}`).remove();
}

/*Summary: send friend request by adding to target user's friend requests in database
Inputs: recieverId = ID of user who will recieve request (STRING)
        senderId = ID of user sending the request (STRING)
 */
async function sendFriendReuest(recieverId, senderId){
    await db.ref(`users/${recieverId}/friendRequests/${senderId}`).set(true);
}

/*Summary: send group invitation by adding to target user's group invitations in database
Inputs: recieverId = ID of user who will recieve the invitation (STRING)
        gropuId = ID of group sending the invitation
 */
async function sendGroupInvitation(recieverId, groupId){
    await db.ref(`users/${recieverId}/groupInvitations/${groupId}`).set(true);
    await db.ref(`channels/${groupId}/usersInvited/${recieverId}`).set(true);
}

/*Summary remove user pair as friends
Inputs: userId = ID of first user (STRING)
        friendId = ID of second user (STRING)
        channelId = ID of both user's DM channel (STRING)*/
async function removeFriends(userId, friendId, channelId){
    await db.ref(`users/${userId}/friends/${friendId}`).remove();
    await db.ref(`users/${friendId}/friends/${userId}`).remove();
    await removeChannel(channelId);
}

/*Summary append new message to channel's messageLog in database
Input: groupId = ID of group which is having the message appended to it's messageLog (STRING)
       message = message data being appended (OBJECT) 
*/
async function addNewGroupMessage(groupId, message){
    const addedMessageId = await (db.ref(`channels/${groupId}/messageLog`).push(message)).key;
    return { ...message, id: addedMessageId }
}

module.exports = {
    createNewUser,
    createNewChannel,
    acceptFriendRequest,
    removeFriendRequest,
    removeGroupInvitation,
    sendFriendReuest,
    sendGroupInvitation,
    removeFriends,
    joinGroup,
    leaveGroup,
    deleteGroup,
    promoteGroupMember,
    addNewGroupMessage
}


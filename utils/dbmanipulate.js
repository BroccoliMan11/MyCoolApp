const db = require('../database');
const { getGroupInfo } = require('./dbretrieve');

async function createNewUser(addingUserData){
    const addedUserId =  db.ref('users').push(addingUserData).key;
    await db.ref(`users/${addedUserId}/id`).set(addedUserId);
    return {...addingUserData, id: addedUserId };
}

async function acceptFriendRequest(recieverId, senderId) {
    const createChannelId = (await createNewChannel({ channelType: "DM" })).id;
    db.ref(`users/${recieverId}/friends/${senderId}`).set(createChannelId);
    db.ref(`users/${senderId}/friends/${recieverId}`).set(createChannelId);
    removeFriendRequest(recieverId, senderId);
}

async function createNewChannel(addingchannelData){
    const addedChannelId = (await db.ref('channels').push(addingchannelData)).key;
    await db.ref(`channels/${addedChannelId}/id`).set(addedChannelId);
    return { ...addingchannelData, id: addedChannelId };
}

async function joinGroup(addingUserId, groupId, role){
    db.ref(`channels/${groupId}/members/${addingUserId}`).set(role);
    db.ref(`users/${addingUserId}/groups/${groupId}`).set(true);
}

async function leaveGroup(leavingUserId, groupId){
    db.ref(`channels/${groupId}/members/${leavingUserId}`).remove();
    db.ref(`users/${leavingUserId}/groups/${groupId}`).remove();
}

async function deleteGroup(groupId){
    const allGroupMemberIds = Object.keys((await getGroupInfo(groupId)).members);
    for await(memberId of allGroupMemberIds){
        await leaveGroup(memberId, groupId);
    }
    db.ref(`channels/${groupId}`).remove();
}

async function promoteGroupMember(groupId, promotingId, newRole){
    db.ref(`channels/${groupId}/members/${promotingId}`).set(newRole);
}

async function removeGroupInvitation(userId, removingGroupId){
    db.ref(`users/${userId}/groupInvitations/${removingGroupId}`).remove();
}

async function removeChannel(removingChannelId){
    db.ref(`channels/${removingChannelId}`).remove();
}

async function removeFriendRequest(recieverId, senderId) {
    db.ref(`users/${recieverId}/friendRequests/${senderId}`).remove();
}

async function sendFriendReuest(recieverId, senderId){
    db.ref(`users/${recieverId}/friendRequests/${senderId}`).set(true);
}

async function sendGroupInvitation(recieverId, groupId){
    db.ref(`users/${recieverId}/groupInvitations/${groupId}`).set(true);
}

async function removeFriends(userId, friendId, channelId){
    db.ref(`users/${userId}/friends/${friendId}`).remove();
    db.ref(`users/${friendId}/friends/${userId}`).remove();
    removeChannel(channelId);
}

async function addNewGroupMessage(groupId, message){
    db.ref(`channels/${groupId}/messageLog`).push(message);
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


const db = require('../database');

/*Summary: gets target user's info from database
Input: userId = ID of target user (STRING)
Output: target user's details (OBJECT)*/
async function getUserInfo (userId) {
    let userInfo = (await db.ref(`users/${userId}`).once('value')).val();
    return properFormatUserInfo(userInfo);
}

/* Summary: returns formmated user's info 
Input: userInfo = user info to be formatted (OBJECT)
Output: formatted user info (OBJECT)

NOTE: 
    Arrays are stored as dictionaries. 
    When two users edit an array at the same time, the indexing may be changed, therefore users could select wrong items.
    This function formats the dictionary into an array*/
function properFormatUserInfo (userInfo){
    if (userInfo.friendRequests) userInfo.friendRequests = Object.keys(userInfo.friendRequests);
    if (userInfo.groupInvitations) userInfo.groupInvitations = Object.keys(userInfo.groupInvitations);
    if (userInfo.groups) userInfo.groups = Object.keys(userInfo.groups);
    return userInfo;
}

/*Summary: gets target group's info from database
Input: groupId = ID of target group (STRING)
Output: target group's details (OBJECT)*/
async function getGroupInfo (groupId) {
    return (await db.ref(`channels/${groupId}`).once('value')).val();
}

/*Summary: formats user's friends dictionary into a list of user friends' details
Input: userFriends = user friends dictionary from database (DICTIONARY)
Output: formatted friend info list (ARRAY)*/
async function getFriendsInfoFormatted (userFriends) {
    return Promise.all(Object.entries(userFriends)
    .map(async ([friendId, channelId]) => {
        const friendInfo = await getUserInfo(friendId);
        return {...friendInfo, channelId: channelId};
    }));
}

/*Summary: get formatted friends' info from user's friend requests
Input: userFriendRequests = user friend request list (ARRAY)
Output: formatted request friends' info list (ARRAY) */
async function getFriendRequestsInfoFormatted (userFriendRequests) {
    return Promise.all(userFriendRequests.map(async (friendId) => {
        return await getUserInfo(friendId);
    }));
}

/*Summary: get formatted user groups' info
Input: userGroups = list of groups user belongs to (ARRAY)
Output: formmated groups' info list (ARRAY)
*/
async function getGroupsInfoFormatted (userGroups) {
    return Promise.all(userGroups.map(async (groupId) => {
        return await getGroupInfo(groupId);
    }));
}

/*Summary: get formatted info of groups that user got an invitation from
Input: userGroupsInvitations = user group invitation list (ARRAY)
Output: formatted groups' info list (ARRAY) */
async function getGroupInvitationsInfoFormatted (userGroupInvitations) {
    return Promise.all(userGroupInvitations.map(async (groupId) => {
        return await getGroupInfo(groupId);
    }));
}

/*Summary: get formatted info of target group's member list
Input: groupID = ID of targetted group (STRING)
Output: formatted info of target group's members (ARRAY)*/
async function getGroupMembersInfoFormatted (groupId) {
    const groupMemberIds = Object.keys((await getGroupInfo(groupId)).members);
    return Promise.all(groupMemberIds.map(async (memberId) => {
        return await getUserInfo(memberId);
    }));
}

/*Summary: get formatted info of all users in the database
Output: formated info of all users (ARRAY)*/
async function getAllUsersFormatted() {
    const allUsersInfo = Object.values((await db.ref('users').once('value')).val());
    if (!allUsersInfo) return undefined;
    return allUsersInfo.map( user => { return properFormatUserInfo(user) });
}

/*Summary: search all users if they have a certain username
Input: username = username searching (STRING)
Output: info of found user OR undefined (OBJECT)*/
async function findUserByUsername (username) {
    const allUsers = await getAllUsersFormatted();
    if (!allUsers) return undefined;
    return allUsers.find((user) => { return user.username === username });
}

/*Summary: search user friends if they have a certain username
Inputs: username = username searching (STRING)
       userFriends = user friend dictionary (DICTIONARY) 
Output: info of found user OR undefined (OBJECT)*/
async function findFriendByUsername (username, userFriends) {
    const friendsInfo = await getFriendsInfoFormatted(userFriends);
    return friendsInfo.find((user) => { return user.username === username });
}

/*Summary: search group members if they have a certain username
Inputs: username = username searching (STRING)
       groupId = ID of group searching in
Output: info of found user OR undefined (OBJECT)*/
async function findGroupMemberByUsername (groupId, username) {
    const allGroupMembers = await getGroupMembersInfoFormatted (groupId);
    return allGroupMembers.find((user) => { return user.username === username });
}

/*Summary: retrieve target group messages and format them
Inputs: groupID = ID of target group (STRING)
        currentMessageId = ID of oldest mesage loaded (STRING)
        amountLoading = amount of messages loading (INTEGER)
Output: messages to be loaded*/
async function getGroupMessagesFormatted (groupId, amountLoadng, currentMessageId) {
    const messageLog = (await getGroupInfo(groupId)).messageLog;
    if (!messageLog) return undefined;

    const savedMemberData = {};
    const nextGroupMessages = [];

    const allMessageIds = Object.keys(messageLog).reverse();

    if (currentMessageId == allMessageIds[allMessageIds.length - 1]){
        return { newMessageId: currentMessageId, nextGroupMessages: nextGroupMessages, oldestMessageReached: true };
    }

    const allMessageData = Object.values(messageLog).reverse();

    const startLoadIndex = (currentMessageId) ? allMessageIds.findIndex((id) => id === currentMessageId) + 1 : 0;

    let oldestMessageReached = false;
    let selectedMessageIndex;
    for (let offset = 0; offset < amountLoadng ; offset++){
        selectedMessageIndex = startLoadIndex + offset;
        if (selectedMessageIndex > allMessageIds.length - 1) 
        {
            oldestMessageReached = true;
            break;
        }
        const selectedMessage = allMessageData[selectedMessageIndex];
        if (!savedMemberData[selectedMessage.userId]){
            savedMemberData[selectedMessage.userId] = await getUserInfo(selectedMessage.userId);
        }
        nextGroupMessages.push({ 
            username: savedMemberData[selectedMessage.userId].username, 
            text: selectedMessage.text, 
            time: selectedMessage.time 
        });
    }
    
    const newMessageId = (oldestMessageReached) ? allMessageIds[allMessageIds.length - 1]: allMessageIds[selectedMessageIndex]
    return { newMessageId: newMessageId, nextGroupMessages: nextGroupMessages, oldestMessageReached }
}

module.exports = {
    getUserInfo,
    getGroupInfo,
    getFriendsInfoFormatted,
    getGroupsInfoFormatted,
    getFriendRequestsInfoFormatted,
    getGroupInvitationsInfoFormatted,
    getAllUsersFormatted,
    findUserByUsername,
    findFriendByUsername,
    findGroupMemberByUsername,
    getGroupMessagesFormatted
}
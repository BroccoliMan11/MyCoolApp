const db = require('../database');

/*Summary: gets target user's info from database
Input: userId = ID of target user (STRING)
Output: target user's details (OBJECT)*/
async function getUserInfo (userId) {
    const userRef = await db.ref(`users/${userId}`).once('value');
    const userInfo = FormatUserInfo(userRef.val());
    return { ...userInfo, id: userId }
}

/* Summary: returns formmated user's info 
Input: userInfo = user info to be formatted (OBJECT)
Output: formatted user info (OBJECT)

NOTE: 
    Arrays are stored as dictionaries. 
    When two users edit an array at the same time, the indexing may be changed, therefore users could select wrong items.
    This function formats the dictionary into an array*/
function FormatUserInfo (userValue){
    if (!userValue) return;
    let userInfo = Object.assign({}, userValue);
    if (userInfo.friendRequests) userInfo.friendRequests = Object.keys(userInfo.friendRequests);
    if (userInfo.groupInvitations) userInfo.groupInvitations = Object.keys(userInfo.groupInvitations);
    if (userInfo.groups) userInfo.groups = Object.keys(userInfo.groups);
    return userInfo;
}

/*Summary: gets target group's info from database
Input: groupId = ID of target group (STRING)
Output: target group's details (OBJECT)*/
async function getGroupInfo (groupId) {
    const groupRef = await db.ref(`channels/${groupId}`).once('value');
    const groupInfo = FormatGroupInfo(groupRef.val());
    return { ...groupInfo, id: groupId }
}

/* Summary: returns formmated group's info 
Input: groupInfo = group info to be formatted (OBJECT)
Output: formatted group info (OBJECT)*/
function FormatGroupInfo (groupVal){
    if (!groupVal) return;
    let groupInfo = Object.assign({}, groupVal);
    if (groupInfo.usersInvited) groupInfo.usersInvited = Object.keys(groupInfo.usersInvited);
    return groupInfo;
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
    const groupMemberIds = Object.keys((await db.ref(`channels/${groupId}/members`).once('value')).val());
    return Promise.all(groupMemberIds.map(async (memberId) => {
        return await getUserInfo(memberId);
    }));
}

/*Summary: search all users if they have a certain username
Input: username = username searching (STRING)
Output: info of found user OR undefined (OBJECT)*/
async function findUserByUsername (username) {
    const userFoundRef = (await db.ref('users').orderByChild('username').equalTo(username).once('value')).val();
    if (!userFoundRef) return;
    const id = Object.keys(userFoundRef)[0];
    const userInfo = FormatUserInfo(userFoundRef[id]);
    return {...userInfo, id: id}
}

/*Summary: search user friends if they have a certain username
Inputs: username = username searching (STRING)
       userFriends = user friend dictionary (DICTIONARY) 
Output: info of found user OR undefined (OBJECT)*/
async function findFriendByUsername (userFriends, username) {
    const userFound = await findUserByUsername(username);
    if (!userFound) return;
    if (!Object.keys(userFriends).includes(userFound.id)) return;
    return { ...userFound, channelId: userFriends[userFound.id] };
}

/*Summary: search group members if they have a certain username
Inputs: username = username searching (STRING)
       groupId = ID of group searching in
Output: info of found user OR undefined (OBJECT)*/
async function findGroupMemberByUsername (groupId, username) {
    const allGroupMembers = await getGroupMembersInfoFormatted (groupId);
    return allGroupMembers.find((user) => { return user.username === username });
}

/*Summary: gets messageLog data from database and formats it
Inputs: messages = raw message data
Output: formatted message data*/
async function formatMessages(messages){
    let formattedMessages = [];
    let loadedUsers = {};
    if (!messages) return [];
    for ([messageId, messageInfo] of Object.entries(messages)){
        if (!loadedUsers[messageInfo.userId]){
            loadedUsers[messageInfo.userId] = {
                id: messageInfo.userId,
                username: (await db.ref(`users/${messageInfo.userId}/username`).once('value')).val()
            };
        }
        formattedMessages.unshift({
            messageId: messageId,
            user: loadedUsers[messageInfo.userId],
            ...messageInfo
        });
    }
    return formattedMessages;
}

/*Summary: retrieve target group messages and format them
Inputs: groupID = ID of target group (STRING)
        currentMessageId = ID of oldest mesage loaded (STRING)
        amountLoading = amount of messages loading (INTEGER)
Output: messages to be loaded*/
async function getChannelMessages(channelId, amountLoading, currentMessageId){
    const messageRef = db.ref(`channels/${channelId}/messageLog`);
    let messages;
    if (!currentMessageId){
        messages = (await messageRef.orderByKey().limitToLast(amountLoading).once('value')).val();
    }else{
        messages = (await messageRef.orderByKey().endAt(currentMessageId).limitToLast(amountLoading + 1).once('value')).val();
        delete messages[currentMessageId];
    }
    const formattedMessages  = await formatMessages(messages);
    if (formattedMessages.length === 0){
        return {newMessageId: currentMessageId, messages: [], allMessagesLoaded: true}
    }
    const firstLoadedMessageId = formattedMessages[formattedMessages.length - 1].messageId;
    const firstMessage = (await messageRef.orderByKey().limitToFirst(1).once('value')).val();
    const firstMessageId = Object.keys(firstMessage)[0]
    const allMessagesLoaded = (!firstMessage || firstMessageId === firstLoadedMessageId) ? true : false;
    return { newMessageId: firstLoadedMessageId, messages: formattedMessages, allMessagesLoaded: allMessagesLoaded }
}

module.exports = {
    getUserInfo,
    getGroupInfo,
    getFriendsInfoFormatted,
    getGroupsInfoFormatted,
    getFriendRequestsInfoFormatted,
    getGroupInvitationsInfoFormatted,
    findUserByUsername,
    findFriendByUsername,
    findGroupMemberByUsername,
    getChannelMessages
}
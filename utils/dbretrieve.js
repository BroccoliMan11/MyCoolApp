const db = require('../database');

async function getUserInfo (userId) {
    let userInfo = (await db.ref(`users/${userId}`).once('value')).val();
    return properFormatUserInfo(userInfo);
}

function properFormatUserInfo (userInfo){
    if (userInfo.friendRequests) userInfo.friendRequests = Object.keys(userInfo.friendRequests);
    if (userInfo.groupInvitations) userInfo.groupInvitations = Object.keys(userInfo.groupInvitations);
    if (userInfo.groups) userInfo.groups = Object.keys(userInfo.groups);
    return userInfo;
}

async function getGroupInfo (groupId) {
    return (await db.ref(`channels/${groupId}`).once('value')).val();
}

async function getFriendsInfoFormatted (userFriends) {
    return Promise.all(Object.entries(userFriends)
    .map(async ([friendId, channelId]) => {
        const friendInfo = await getUserInfo(friendId);
        return {...friendInfo, channelId: channelId};
    }));
}

async function getFriendRequestsInfoFormatted (userFriendRequests) {
    return Promise.all(userFriendRequests.map(async (friendId) => {
        return await getUserInfo(friendId);
    }));
}

async function getGroupsInfoFormatted (userGroups) {
    return Promise.all(userGroups.map(async (groupId) => {
        return await getGroupInfo(groupId);
    }));
}

async function getGroupInvitationsInfoFormatted (userGroupInvitations) {
    return Promise.all(userGroupInvitations.map(async (groupId) => {
        return await getGroupInfo(groupId);
    }));
}

async function getGroupMembersInfoFormatted (groupId) {
    const groupMemberIds = Object.keys((await getGroupInfo(groupId)).members);
    return Promise.all(groupMemberIds.map(async (memberId) => {
        return await getUserInfo(memberId);
    }));
}

async function getAllUsersFormatted() {
    const allUsersInfo = Object.values((await db.ref('users').once('value')).val());
    if (!allUsersInfo) return undefined;
    return allUsersInfo.map( user => { return properFormatUserInfo(user) });
}

async function findUserByUsername (username) {
    const allUsers = await getAllUsersFormatted();
    if (!allUsers) return undefined;
    return allUsers.find((user) => { return user.username === username });
}

async function findFriendByUsername (username, userFriends) {
    const friendsInfo = await getFriendsInfoFormatted(userFriends);
    return friendsInfo.find((user) => { return user.username === username });
}

async function findGroupMemberByUsername (groupId, username) {
    const allGroupMembers = await getGroupMembersInfoFormatted (groupId);
    return allGroupMembers.find((user) => { return user.username === username });
}

async function getGroupMessagesFormatted (groupId) {
    const allGroupMessages = (await getGroupInfo(groupId)).messageLog
    if (!allGroupMessages) return undefined;
    return Promise.all(Object.values(allGroupMessages).map(async (message) => {
        const groupMember = await getUserInfo(message.userId);
        return { username: groupMember.username, text: message.text, time: message.time }
    }));
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
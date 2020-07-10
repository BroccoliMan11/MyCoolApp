const express = require('express');
const router = express.Router();

const firebase = require('../database');

const authenticationMiddleware = require('../utils/authmidfunc');
const getUserInfo = require('../utils/getuserinfo');
const getuserinfo = require('../utils/getuserinfo');

router.get('/groups', authenticationMiddleware(), (req, res) => {
    return res.redirect('/groups/all')
});

router.get('/groups/all', authenticationMiddleware(), async (req, res) => {
    const userInfo = await getUserInfo(req.user);

    if (!userInfo.groups) {
        return res.render('groupsall', { page: 'groups', subpage: 'all' });
    }

    const firstChannelId = Object.values(userInfo.groups)[0];
    return res.redirect(`/groups/all/${firstChannelId}`);
});

router.get('/groups/all/:channelId', authenticationMiddleware(), async (req, res) => {
    const selectedChannelId = req.params.channelId;
    const userInfo = await getUserInfo(req.user);

    if (!userInfo.groups){
        return res.render('groupsall', { page: 'groups', subpage: 'all' });
    }  

    const userGroupChannelIds = Object.values(userInfo.groups);

    if (!userGroupChannelIds.includes(selectedChannelId)){
        return res.status(404).send('You are not associated with that channel ID!');
    }

    const groupsInfo = await Promise.all(Object.values(userInfo.groups)
    .map(async (channelId) => {
        const groupInfo = await firebase.database().ref(`channels/${channelId}`).once('value')
        return groupInfo.val();
    }));

    const selectedGroupInfo = await (await firebase.database().ref(`channels/${selectedChannelId}`).once('value')).val();

    const role = selectedGroupInfo.members[userInfo.id];
    
    return res.render(
        'groupsall', 
        { 
            page: 'groups', 
            subpage: 'all', 
            groupsInfo: groupsInfo, 
            selectedChannelId: selectedChannelId,
            role: role
        }
    );
});

router.get('/groups/all/:channelId/invite', authenticationMiddleware(), (req, res) => {
    const selectedChannelId = req.params.channelId;
    return res.render('groupsinvite', { page: 'groups', subpage: 'all', selectedChannelId: selectedChannelId });
});

router.get('/groups/invitations', authenticationMiddleware(), async (req, res) => {
    const userInfo = await getUserInfo(req.user);

    if (!userInfo.groupInvitations){
        return res.render('groupsinvitations', { page: 'groups', subpage: 'invitations' });
    } 

    const inviteGroupsInfo = await Promise.all(Object.values(userInfo.groupInvitations).map(async (groupId) => {
        const groupInfo = await (await firebase.database().ref(`channels/${groupId}`).once('value')).val();
        return groupInfo
    }));

    return res.render('groupsinvitations', { page: 'groups', subpage: 'invitations', inviteGroupsInfo: inviteGroupsInfo });
});

router.get('/groups/create', authenticationMiddleware(), (req, res) => {
    return res.render('groupscreate', { page: 'groups', subpage: 'create' });
});

router.post('/groups/create', authenticationMiddleware(), (req, res) => {
    const groupName = req.body.groupName;
    const groupChannel = { name: groupName, channelType: 'Group', members: { [`${req.user}`]: 'leader'} };
    const groupAdding = firebase.database().ref('/channels').push(groupChannel);
    firebase.database().ref(`channels/${groupAdding.key}/id`).set(groupAdding.key);
    firebase.database().ref(`users/${req.user}/groups`).push(groupAdding.key);
    return res.render('groupscreate', { page: 'groups', subpage: 'create', successMessage: `${groupName} has been created!`});
});

router.post('/groups/all/:channelId/invite', authenticationMiddleware(), async (req, res) => {
    const selectedChannelId = req.params.channelId
    const usernameFinding = req.body.friendName
    const userInfo = await getuserinfo(req.user);

    if (!userInfo.groups){
        return res.status(404).send('You are currently in no groups!');
    }

    const userGroupChannelIds = Object.values(userInfo.groups);

    if (!userGroupChannelIds.includes(selectedChannelId)){
        return res.status(404).send(`You are not associated with any channel with an ID of ${selectedChannelId}!`);
    }

    if (!userInfo.friends){
        return res.render('groupsinvite', { page: 'groups', subpage: 'all', searchError: 'You have no friends to invite!', selectedChannelId: selectedChannelId });
    }

    let invitingFriendInfo;

    for (friendId of Object.keys(userInfo.friends)){
        const friendInfo = await getUserInfo(friendId);
        if (friendInfo.username === usernameFinding){
            invitingFriendInfo = friendInfo;
            break;
        }
    }

    if (!invitingFriendInfo){
        return res.render('groupsinvite', { page: 'groups', subpage: 'all', searchError: `${usernameFinding} is not in your friends list OR is not a valid user!`, selectedChannelId: selectedChannelId });
    }

    if (invitingFriendInfo.groupInvitations){
        if (Object.values(invitingFriendInfo.groupInvitations).includes(selectedChannelId)){
            return res.render('groupsinvite', { page: 'groups', subpage: 'all', searchError: `An invitation was already sent to ${usernameFinding}!`, selectedChannelId: selectedChannelId} );
        }
    }

    const groupMemberList = await (await firebase.database().ref(`channels/${selectedChannelId}/members`).once('value')).val();
    
    if (Object.keys(groupMemberList).includes(invitingFriendInfo.id)){
        return res.render('groupsinvite', { page: 'groups', subpage: 'all', searchError: `${usernameFinding} is already in this group!`, selectedChannelId: selectedChannelId} );
    }

    firebase.database().ref(`users/${invitingFriendInfo.id}/groupInvitations`).push(selectedChannelId);

    return res.render('groupsinvite', { page: 'groups', subpage: 'all', searchError: `${usernameFinding} was invited to the group!`, selectedChannelId: selectedChannelId });
});

function getKeyByValue(object, value){
    return Object.keys(object).find(key => object[key] === value);
}

async function removeFromGroupInvitations(userId, removingId)
{
    const userInfo = await getUserInfo(userId);
    const removingObjKey = getKeyByValue(userInfo.groupInvitations, removingId);
    firebase.database().ref(`users/${userId}/groupInvitations/${removingObjKey}`).remove();
}

router.post('/groups/invitations/accept/:groupId', authenticationMiddleware(), async (req, res) => {
    const groupId = req.params.groupId;
    const userInfo = await getUserInfo(req.user);

    if (!userInfo.groupInvitations){
        return res.status(404).send('You have no group invitations to accept!');
    }

    const userGroupInvitationIds = Object.values(userInfo.groupInvitations);

    if (!userGroupInvitationIds.includes(groupId)) {
        return res.status(404).send('Group ID is not in group invitations');
    }

    firebase.database().ref(`users/${req.user}/groups`).push(groupId);
    firebase.database().ref(`channels/${groupId}/members/${req.user}`).set('member');
    removeFromGroupInvitations(req.user, groupId);

    return res.status(200).send('Group was added to group list!');
});

router.post('/groups/invitations/reject/:groupId', authenticationMiddleware(), async (req, res) => {
    const groupId = req.params.groupId;
    const userInfo = await getUserInfo(req.user);

    if (!userInfo.groupInvitations){
        return res.status(404).send('You have no group invitations to reject!');
    }

    removeFromGroupInvitations(req.user, groupId);
    
    return res.status(200).send('Group was rejected');
});

router.get('/groups/all/:groupId/leave', authenticationMiddleware(), async (req, res) => {
    const groupId = req.params.groupId;
    const userInfo = await getUserInfo(req.user);

    if (!userInfo.groups){
        return res.status(404).send('You are currently in no group!');
    }

    const userGroupIds = Object.values(userInfo.groups);

    if (!userGroupIds.includes(groupId)){
        return res.status(404).send(`You are not associated with a group with ID of ${groupId}`);
    }

    const groupMemberListRef = await firebase.database().ref(`channels/${groupId}/members`).once('value');
    
    if (groupMemberListRef.val()[req.user] === 'leader'){
        const amountOfMembers = Object.entries(groupMemberListRef.val()).length;
        if (amountOfMembers > 1){
            return res.redirect(`/groups/all/${groupId}/leave/leaderselect`);
        } else {
            const removeObjKey = getKeyByValue(userInfo.groups, groupId);
            firebase.database().ref(`users/${req.user}/groups/${removeObjKey}`).remove();
            firebase.database().ref(`channels/${groupId}`).remove();
            return res.redirect('/groups/all');
        }
    }

    const removeObjKey = getKeyByValue(userInfo.groups, groupId);
    firebase.database().ref(`users/${req.user}/groups/${removeObjKey}`).remove();
    firebase.database().ref(`channels/${groupId}/members/${req.user}`).remove();

    return res.redirect('/groups/all');
});

router.get('/groups/all/:groupId/leave/leaderselect', authenticationMiddleware(), async (req, res) => {
    const groupId = req.params.groupId;

    const userInfo = await getUserInfo(req.user);

    if (!userInfo.groups){
        return res.status(404).send('You are currently in no group!');
    }

    const userGroupIds = Object.values(userInfo.groups);

    if (!userGroupIds.includes(groupId)){
        return res.status(404).send(`You are not associated with a group with ID of ${groupId}`);
    }

    const groupMemberListRef = 
    await firebase.database().ref(`channels/${groupId}/members`).once('value');

    if (groupMemberListRef.val()[req.user] !== 'leader'){
        return res.status(404).send(`You are not the leader of the group with ID of ${groupId}`);
    }

    return res.render('groupsleaveleaderselect', { page: 'groups', subpage: 'all', selectedChannelId: groupId });
});

router.post('/groups/all/:groupId/leave/leaderselect', authenticationMiddleware(), async(req, res) => {
    const groupId = req.params.groupId;

    const userInfo = await getUserInfo(req.user);

    if (!userInfo.groups){
        return res.status(404).send('You are currently in no group!');
    }

    const userGroupIds = Object.values(userInfo.groups);

    if (!userGroupIds.includes(groupId)){
        return res.status(404).send(`You are not associated with a group with ID of ${groupId}`);
    }

    const groupMemberListRef = 
    await firebase.database().ref(`channels/${groupId}/members`).once('value');

    if (groupMemberListRef.val()[req.user] !== 'leader'){
        return res.status(404).send(`You are not the leader of the group with ID of ${groupId}`);
    }

    const groupMemberName = req.body.groupMemberName;

    let promotingMemberId;

    for await (memberId of Object.keys(groupMemberListRef.val())){
        const memberInfo = await getUserInfo(memberId);
        if (memberInfo.username === groupMemberName){
            promotingMemberId = memberId;
            break;
        }
    }

    if (!promotingMemberId){
        return res.render(
            'groupsleaveleaderselect', 
            { 
                page: 'groups', 
                subpage: 'all', 
                selectedChannelId: groupId,  
                searchError: 'There is not member group member with that username!'
            }
        )
    }

    firebase.database().ref(`channels/${groupId}/members/${promotingMemberId}`).set('leader');

    const removeObjKey = getKeyByValue(userInfo.groups, groupId);
    firebase.database().ref(`users/${req.user}/groups/${removeObjKey}`).remove();
    firebase.database().ref(`channels/${groupId}/members/${req.user}`).remove();

    return res.redirect('/groups/all');
});

router.get('/groups/all/:groupId/kick', authenticationMiddleware(), async (req, res) => {
    const groupId = req.params.groupId;

    const userInfo = await getUserInfo(req.user);

    if (!userInfo.groups){
        return res.status(404).send('You are currently in no group!');
    }

    const userGroupIds = Object.values(userInfo.groups);

    if (!userGroupIds.includes(groupId)){
        return res.status(404).send(`You are not associated with a group with ID of ${groupId}`);
    }

    const groupMemberListRef = 
    await firebase.database().ref(`channels/${groupId}/members`).once('value');

    if (groupMemberListRef.val()[req.user] !== 'leader'){
        return res.status(404).send(`You are not the leader of the group with ID of ${groupId}`);
    }

    return res.render('groupskick', { page: 'groups', subpage: 'all', selectedChannelId: groupId });
});

router.post('/groups/all/:groupId/kick', authenticationMiddleware(), async (req, res) => {
    const groupId = req.params.groupId;

    const userInfo = await getUserInfo(req.user);

    if (!userInfo.groups){
        return res.status(404).send('You are currently in no group!');
    }

    const userGroupIds = Object.values(userInfo.groups);

    if (!userGroupIds.includes(groupId)){
        return res.status(404).send(`You are not associated with a group with ID of ${groupId}`);
    }

    const groupMemberListRef = 
    await firebase.database().ref(`channels/${groupId}/members`).once('value');

    if (groupMemberListRef.val()[req.user] !== 'leader'){
        return res.status(404).send(`You are not the leader of the group with ID of ${groupId}`);
    }

    const groupMemberName = req.body.groupMemberName;

    let kickingMemberInfo;

    for await (memberId of Object.keys(groupMemberListRef.val())){
        const memberInfo = await getUserInfo(memberId);
        if (memberInfo.username === groupMemberName){
            kickingMemberInfo = memberInfo;
            break;
        }
    }

    if (!kickingMemberInfo){
        return res.render('groupskick', { page: 'groups', subpage: 'all', selectedChannelId: groupId, searchError: `${groupMemberName} is not a valid user to kick!`});
    }

    firebase.database().ref(`channels/${groupId}/members/${kickingMemberInfo.id}`).remove();
    const removeObjKey = getKeyByValue(kickingMemberInfo.groups, groupId);
    console.log(removeObjKey);
    firebase.database().ref(`users/${kickingMemberInfo.id}/groups/${removeObjKey}`).remove(console.log('removed'));

    res.render('groupskick', { page: 'groups', subpage: 'all', selectedChannelId: groupId, searchError: `${groupMemberName} was kicked!`});
});

module.exports = router
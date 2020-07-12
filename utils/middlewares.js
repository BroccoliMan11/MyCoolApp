const db = require('../database');
const { getGroupInfo } = require('./dbretrieve');

function authenticationMiddleware() {
    return (req, res, next) => {
        if (req.isAuthenticated()) return next();
        return res.redirect('/login');
    };
}

function noGroups(){
    return (req, res, next) => {
        if (!req.user.groups){
            return res.status(404).send({ error: 'You are in no groups!' });
        }
        next();
    }
}

function notInGroup(){
    return (req, res, next) => {
        const selectedGroupId = req.params.groupId;
        const userGroupIds = Object.values(req.user.groups);
        if (!userGroupIds.includes(selectedGroupId)){
            return res.status(404).send({ 
                error: `You are not in a group with an ID of ${selectedGroupId}` 
            });
        }
        next();
    }
}

function notGroupLeader(){
    return async (req, res, next) => {
        const selectedGroupId = req.params.groupId;
        const selectedGroupMembers = (await getGroupInfo(selectedGroupId)).members;
        if (selectedGroupMembers[req.user.id] !== 'leader'){
            return res.status(404).send({ 
                error: `You are not the leader of the group with an ID of ${selectedGroupId}` 
            });
        }
        next();
    }
}

function noGroupInvitations(){
    return (req, res, next) => {
        if (!req.user.groupInvitations){
            return res.status(404).send({ error: 'You have no group invitations to accept!' });
        }
        next();
    }
}

function groupIdNotInInvitations() {
    return (req, res, next) => {
        const selectedGroupId = req.params.groupId;
        if (!req.user.groupInvitations.includes(selectedGroupId)){
            return res.status(404).send({
                error: `There is not group in your invitation list with an ID of ${groupId}!`
            });
        }
        next();
    };
}

function noFriends() {
    return (req, res, next) => {
        if (!req.user.friends){
            return res.status(404).send({
                error: 'You have no friends!'
            });
        }
        next();
    }
}

function notInDMChannel() {
    return (req, res, next) => {
        const selectedChannelId = req.params.channelId;
        const userDMChannelIds = Object.values(req.user.friends);
        if (!userDMChannelIds.includes(selectedChannelId)){
            return res.status(404).send({
                error: `You are not associated with a DM channel with an ID of ${selectedChannelId}`
            });
        }
        next();
    }
}

function noFriendRequests() {
    return (req, res, next) => {
        if (!req.user.friendRequests) {
            return res.status(404).send({
                error: `You have no friend requests!`
            });
        } 
        next();
    }
}

function idNotInFriendRequests(){
    return (req, res, next) => {
        const friendId = req.params.friendId;
        if (!req.user.friendRequests.includes(friendId)) {
            return res.status(404).send({
                error: `A friend with an ID of ${friendId} does not exist in your friend request list!`
            });
        } 
        next();
    }
}

module.exports = {
    authenticationMiddleware,
    noGroupInvitations,
    groupIdNotInInvitations,
    noGroups,
    notInGroup,
    notGroupLeader,
    noFriends,
    notInDMChannel,
    noFriendRequests,
    idNotInFriendRequests
}
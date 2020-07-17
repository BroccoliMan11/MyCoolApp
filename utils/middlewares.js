const db = require('../database');
const { getGroupInfo } = require('./dbretrieve');

/*Sumary: check if user is authenticated*/
function authenticationMiddleware() {
    return (req, res, next) => {
        if (req.isAuthenticated()) return next();
        return res.redirect('/login');
    };
}

/*Summary: check if user is not in a group*/
function noGroups(){
    return (req, res, next) => {
        if (!req.user.groups){
            return res.status(404).send({ error: 'You are in no groups!' });
        }
        next();
    }
}

/*Summary: check if user is not in target group */
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

/*Summary: check if user is not the leader of target group*/
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

/*Summary: check if user has no group invitations*/
function noGroupInvitations(){
    return (req, res, next) => {
        if (!req.user.groupInvitations){
            return res.status(404).send({ error: 'You have no group invitations to accept!' });
        }
        next();
    }
}

/*Summary: check if target group invited user*/
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

/*Summary: check if user has no friends*/
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

/*Summary: check if user is not associated with DM channel*/
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

/*Summary: check if user has no friend requests*/
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

/*Summary check if user ID is not in user's friend request list*/
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
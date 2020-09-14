//link these routes
const express = require('express');
const router = express.Router();

//middleware functions
const { authenticationMiddleware, noGroupInvitations, noGroups, 
    notInGroup, notGroupLeader, groupIdNotInInvitations } = require('../utils/middlewares');

//database functions
const { createNewChannel, joinGroup, sendGroupInvitation, 
    removeGroupInvitation, leaveGroup, deleteGroup, promoteGroupMember } = require('../utils/dbmanipulate');

const { getGroupsInfoFormatted, getGroupInfo, getGroupInvitationsInfoFormatted, 
    findFriendByUsername, findGroupMemberByUsername, getGroupMembersInfoFormatted} = require('../utils/dbretrieve');
const { purgeChannelSockets, sendAdminMessage, removeFromMemberList, addToMemberList, updateFooterForLeader } = require('../socketevents');

/*Summary: redirect to the first channel in user's group list*/
router.get('/all', authenticationMiddleware(), async (req, res) => {
    if (!req.user.groups) {
        return res.render('groupsall');
    }
    const firstChannelId = Object.values(req.user.groups)[0];
    return res.redirect(`/groups/all/${firstChannelId}`);
});

/*Summary: render selected group's page */
router.get('/all/:groupId', 

    authenticationMiddleware(), 
    noGroups(), 
    notInGroup(),  
    
    async(req, res) => {

        const selectedGroupId = req.params.groupId;
        const groupsInfo = await getGroupsInfoFormatted(req.user.groups);
        const selectedGroupInfo = await getGroupInfo(selectedGroupId);
        const groupMembersInfo = await getGroupMembersInfoFormatted(selectedGroupInfo.members);
        const userGroupRole = selectedGroupInfo.members[req.user.id];

        return res.render('groupsall', { 
                channelInfo: groupsInfo,
                selectedChannelId: selectedGroupId,
                groupMembersInfo: groupMembersInfo,
                role: userGroupRole
            }
        );
    }
);

/*Summary: render "/groups/invitations" page*/
router.get('/invitations', authenticationMiddleware(), async (req, res) => {
    if (!req.user.groupInvitations){
        return res.render('groupsinvitations'); 
    }
    const groupInvitationsInfo = await getGroupInvitationsInfoFormatted(req.user.groupInvitations);
    return res.render('groupsinvitations', { requestInfo: groupInvitationsInfo });
});

/*Summary: render "/groups/create" page*/
router.get('/create', authenticationMiddleware(), (req, res) => {
    return res.render('groupscreate');
});

/*Summary: create a new group*/
router.post('/create', authenticationMiddleware(), async (req, res) => {
    const { groupName } = req.body;

    if (!groupName) {
        return res.render("groupscreate", { errorMessage: "Group Name must not be empty!"});
    }

    if (typeof groupName !== "string") {
        return res.render("groupscreate", { errorMessage: "Group Name must be string!"});
    }

    if (groupName.length > 15 || groupName.length < 4) {
        return res.render("groupscreate", { errorMessage: "Group Name must be between 3-15 characters!"});
    }

    const creatingChannelData = { name: groupName, channelType: 'Group' };
    const createGroup = await createNewChannel(creatingChannelData);
    await joinGroup(req.user.id, createGroup.id, 'leader');
    await sendAdminMessage(createGroup.id, "createdGroup", req.user.username);
    return res.render('groupscreate', { successMessage: `${groupName} has been created!`});
});

/*Summary: invite friend to group*/
router.post('/all/:groupId/invite', 

    authenticationMiddleware(), 
    noGroups(), 
    notInGroup(), 
    
    async (req, res) => {
        const { groupId } = req.params;
        if (!req.user.friends){
            return res.status(403).json({ errorMessage: 'You do not have any friends to invite!' });
        }

        const { friendName } = req.body;

        if (!friendName) {
            return res.status(403).json({ errorMessage: "Username must not be empty!" })
        }
    
        if (typeof friendName !== "string") {
            return res.status(403).json({ errorMessage: "Username must be string!" });
        }

        const friendFoundByUsername = await findFriendByUsername(req.user.friends, friendName);
        if (!friendFoundByUsername){
            return res.status(403).json({ errorMessage: `${friendName} is not in your friends list!` });
        }

        const selectedGroup = await getGroupInfo(groupId);
        if (friendFoundByUsername.groupInvitations){
            const friendGroupIds = Object.values(friendFoundByUsername.groupInvitations);
            if (friendGroupIds.includes(groupId)){
                return res.status(403).json({ errorMessage: `An invitation for ${selectedGroup.name} was already sent to ${friendName}!` });
            }
        }

        if (selectedGroup.members[friendFoundByUsername.id]){
            return res.status(403).json({ errorMessage: `${friendName} is already in group "${selectedGroup.name}"!` });
        }

        await sendGroupInvitation(friendFoundByUsername.id, groupId);
        return res.status(200).json({ successMessage: `${friendName} was invited to group ${selectedGroup.name}!` });
    }
);

/*Summary: accept group invitation*/
router.post('/invitations/accept/:groupId', 

    authenticationMiddleware(), 
    noGroupInvitations(),
    groupIdNotInInvitations(),
    
    async (req, res) => {
        const { groupId } = req.params;
        await joinGroup(req.user.id, groupId, 'member');
        await sendAdminMessage(groupId, "join", req.user.username);
        await addToMemberList(groupId, { id: req.user.id, username: req.user.username });
        return res.status(200).send('Group was added to group list!');
    }
);

/*Summary: remove user's invitation to selected group */
router.post('/invitations/reject/:groupId', 

    authenticationMiddleware(),
    noGroupInvitations(),
    
    async (req, res) => {
        const { groupId } = req.params;
        await removeGroupInvitation(req.user.id, groupId);
        return res.status(200).send('Group was rejected');
    }
);

/*Summary: leave group*/
router.post('/all/:groupId/leave', 

    authenticationMiddleware(), 
    noGroups(),
    notInGroup(),

    async (req, res) => {
        const { groupId } = req.params;
        const selectedGroupMembers = (await getGroupInfo(groupId)).members
        if (selectedGroupMembers[req.user.id] === 'leader'){
            if (Object.entries(selectedGroupMembers).length > 1){
                return res.status(200).json({ promoteMember: true });
            } else {
                await purgeChannelSockets(req.user.id, groupId);
                await deleteGroup(groupId);
            }
        } else {
            await purgeChannelSockets(req.user.id, groupId);
            await leaveGroup(req.user.id, groupId);

            await sendAdminMessage(groupId, "leave", req.user.username)
            await removeFromMemberList(groupId, req.user.id);
        }
        return res.status(200).json({ promoteMember: false});
    }
);

/*Summary: select new group leader before leader leaves group*/
router.post('/all/:groupId/leave/leaderselect',

    authenticationMiddleware(), 
    noGroups(),
    notInGroup(),
    notGroupLeader(),

    async(req, res) => {

        const { groupId } = req.params;
        const { groupMemberName } = req.body;

        if (!groupMemberName) {
            return res.status(403).json({ errorMessage: "Group Member Name must not be empty!" });
        }

        if (typeof groupMemberName !== "string") {
            return res.status(403).json({ errorMessage: "Group Member Name must be string!" });
        }

        const groupInfo = await getGroupInfo(groupId);

        if (!groupInfo){
            return res.status(403).json({ errorMessage: "The group does not exist!" });
        }

        if (Object.keys(groupInfo.members).length === 1){
            return res.status(403).json({ errorMessage: "Cannot promote leader when theres no other user in group!"});
        }

        const promotingMemberFoundByUsername = await findGroupMemberByUsername(groupInfo.members, groupMemberName);
        if (!promotingMemberFoundByUsername){
            return res.status(403).json({ errorMessage: `There is no group member with a username of ${groupMemberName}!` });
        }

        if (promotingMemberFoundByUsername.id === req.user.id){
            return res.status(403).json({ errorMessage: 'You cannot promote yourself leader when leaving!' });
        }

        await promoteGroupMember(groupId, promotingMemberFoundByUsername.id, 'leader');
        await leaveGroup(req.user.id, groupId);
        await purgeChannelSockets(req.user.id, groupId);

        await sendAdminMessage(groupId, "promote", promotingMemberFoundByUsername.username);
        await sendAdminMessage(groupId, "leave", req.user.username);
        await removeFromMemberList(groupId, req.user.id);
        await updateFooterForLeader(groupId, promotingMemberFoundByUsername.id);

        return res.status(200).json({ successMessage: 'successfully promoted member and left group!'});
    }
);

/* Summary: kick member from selected group */
router.post('/all/:groupId/kick', 

    authenticationMiddleware(), 
    noGroups(),
    notInGroup(),
    notGroupLeader(),
    
    async (req, res) => {

        const { groupId } = req.params;
        const { groupMemberName } = req.body;

        if (!groupMemberName){
            return res.status(403).json({ errorMessage: "Group Member Name must not be empty!" });
        }

        if (typeof groupMemberName !== "string") {
            return res.status(403).json({ errorMessage: "Group Member Name must be string!" });
        }

        const groupInfo = await getGroupInfo(groupId);

        if (Object.keys(groupInfo.members).length === 1){
            return res.status(403).json({ errorMessage: "There's no one to kick!"});
        }

        const kickingMemberFoundByUsername = await findGroupMemberByUsername(groupInfo.members, groupMemberName);
        if (!kickingMemberFoundByUsername){
            return res.status(403).json({ errorMessage: `${groupMemberName} is not in this group!` });
        }

        if (kickingMemberFoundByUsername.id === req.user.id){
            return res.status(403).json({ errorMessage: `You cannot kick yourself!`});
        }

        await leaveGroup(kickingMemberFoundByUsername.id, groupId);
        await purgeChannelSockets(kickingMemberFoundByUsername.id, groupId);

        await sendAdminMessage(groupId, "kick", kickingMemberFoundByUsername.username);
        await removeFromMemberList(groupId, kickingMemberFoundByUsername.id);

        return res.status(200).json({ successMessage: `${groupMemberName} was kicked!` });
    }
);

module.exports = router
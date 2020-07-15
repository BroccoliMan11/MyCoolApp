const express = require('express');
const router = express.Router();

const { authenticationMiddleware, noGroupInvitations, noGroups, 
    notInGroup, notGroupLeader, groupIdNotInInvitations } = require('../utils/middlewares');

const { createNewChannel, joinGroup, sendGroupInvitation, 
    removeGroupInvitation, leaveGroup, deleteGroup, promoteGroupMember } = require('../utils/dbmanipulate');

const { getGroupsInfoFormatted, getGroupInfo, getGroupInvitationsInfoFormatted, 
    findFriendByUsername, findGroupMemberByUsername} = require('../utils/dbretrieve');

router.get('/', authenticationMiddleware(), (req, res) => {
    return res.redirect('/groups/all')
});

router.get('/all', authenticationMiddleware(), async (req, res) => {
    if (!req.user.groups) {
        return res.render('groupsall', { page: 'groups', subpage: 'all' });
    }
    const firstChannelId = Object.values(req.user.groups)[0];
    return res.redirect(`/groups/all/${firstChannelId}`);
});

router.get('/all/:groupId', 

    authenticationMiddleware(), 
    noGroups(), 
    notInGroup(),  
    
    async(req, res) => {

        const selectedGroupId = req.params.groupId;
        const groupsInfo = await getGroupsInfoFormatted(req.user.groups)
        const userGroupRole = (await getGroupInfo(selectedGroupId)).members[req.user.id];

        return res.render(
            'groupsall', 
            { 
                page: 'groups', 
                subpage: 'all', 
                groupsInfo: groupsInfo, 
                selectedChannelId: selectedGroupId,
                role: userGroupRole
            }
        );
    }
);

router.get('/all/:groupId/invite', 

    authenticationMiddleware(), 
    noGroups(), 
    notInGroup(), 
    
    (req, res) => {
        const selectedGroupId = req.params.groupId;
        return res.render('groupsinvite', { page: 'groups', subpage: 'all', selectedChannelId: selectedGroupId });
    }
);

router.get('/invitations', authenticationMiddleware(), async (req, res) => {
    if (!req.user.groupInvitations){
        return res.render('groupsinvitations', { page: 'groups', subpage: 'invitations' }); 
    }
    const groupInvitationsInfo = await getGroupInvitationsInfoFormatted(req.user.groupInvitations);
    return res.render(
        'groupsinvitations', 
        { 
            page: 'groups', 
            subpage: 'invitations', 
            inviteGroupsInfo: groupInvitationsInfo 
        }
    );
});

router.get('/create', authenticationMiddleware(), (req, res) => {
    return res.render('groupscreate', { page: 'groups', subpage: 'create' });
});

router.post('/create', authenticationMiddleware(), async (req, res) => {
    const groupName = req.body.groupName;
    const creatingChannelData = { name: groupName, channelType: 'Group' };
    const createGroup = await createNewChannel(creatingChannelData);
    await joinGroup(req.user.id, createGroup.id, 'leader');
    return res.render('groupscreate', { page: 'groups', subpage: 'create', successMessage: `${groupName} has been created!`});
});

router.post('/all/:groupId/invite', 

    authenticationMiddleware(), 
    noGroups(), 
    notInGroup(), 
    
    async (req, res) => {
        const selectedGroupId = req.params.groupId;
        if (!req.user.friends){
            return res.render(
                'groupsinvite', 
                { 
                    page: 'groups', 
                    subpage: 'all', 
                    errorMessage: 'You do not have any friends to invite!', 
                    selectedChannelId: selectedGroupId
                }
            );
        }
        const friendUsername = req.body.friendName;
        const friendFoundByUsername = await findFriendByUsername(friendUsername, req.user.friends);
        if (!friendFoundByUsername){
            return res.render(
                'groupsinvite', 
                { 
                    page: 'groups', 
                    subpage: 'all', 
                    errorMessage: `${friendUsername} is not in your friends list!`, 
                    selectedChannelId: selectedGroupId
                }
            );
        }
        const selectedGroup = await getGroupInfo(selectedGroupId);
        if (friendFoundByUsername.groupInvitations){
            const friendGroupIds = Object.values(friendFoundByUsername.groupInvitations);
            if (friendGroupIds.includes(selectedGroupId)){
                return res.render(
                    'groupsinvite', 
                    { 
                        page: 'groups', 
                        subpage: 'all', 
                        errorMessage: `An invitation for ${selectedGroup.name} was already sent to ${friendUsername}!`,
                        selectedChannelId: selectedGroupId
                    } 
                );
            }
        }
        if (selectedGroup.members[friendFoundByUsername.id]){
            return res.render(
                'groupsinvite', 
                { 
                    page: 'groups', 
                    subpage: 'all', 
                    errorMessage: `${friendUsername} is already in group "${selectedGroup.name}"!`, 
                    selectedChannelId: selectedGroupId
                } 
            );
        }
        sendGroupInvitation(friendFoundByUsername.id, selectedGroupId);
        return res.render(
            'groupsinvite', 
            { 
                page: 'groups', 
                subpage: 'all', 
                successMessage: `${friendUsername} was invited to group ${selectedGroup.name}!`, 
                selectedChannelId: selectedGroupId 
            }
        );
    }
);

router.post('/invitations/accept/:groupId', 

    authenticationMiddleware(), 
    noGroupInvitations(),
    groupIdNotInInvitations(),
    
    async (req, res) => {
        const selectedGroupId = req.params.groupId;
        await joinGroup(req.user.id, selectedGroupId, 'member');
        await removeGroupInvitation(req.user.id, selectedGroupId);
        return res.status(200).send('Group was added to group list!');
    }
);

router.post('/invitations/reject/:groupId', 

    authenticationMiddleware(),
    noGroupInvitations(),
    
    async (req, res) => {
        const selectedGroupId = req.params.groupId;
        await removeGroupInvitation(req.user.id, selectedGroupId);
        return res.status(200).send('Group was rejected');
    }
);

router.get('/all/:groupId/leave', 

    authenticationMiddleware(), 
    noGroups(),
    notInGroup(),

    async (req, res) => {
        const selectedGroupId = req.params.groupId;
        const selectedGroupMembers = (await getGroupInfo(selectedGroupId)).members
        if (selectedGroupMembers[req.user.id] === 'leader'){
            if (Object.entries(selectedGroupMembers).length > 1){
                return res.redirect(`/groups/all/${selectedGroupId}/leave/leaderselect`);
            } else {
                await deleteGroup(selectedGroupId);
            }
        } else {
            leaveGroup(req.user.id, selectedGroupId);
        }
        return res.redirect('/groups/all');
    }
);

router.get('/all/:groupId/leave/leaderselect', 

    authenticationMiddleware(), 
    noGroups(),
    notInGroup(),
    notGroupLeader(),
    
    (req, res) => {
        const selectedGroupId = req.params.groupId;
        return res.render(
            'groupsleaveleaderselect', 
            { 
                page: 'groups', 
                subpage: 'all', 
                selectedChannelId: selectedGroupId 
            }
        );
    }
);

router.post('/all/:groupId/leave/leaderselect',

    authenticationMiddleware(), 
    noGroups(),
    notInGroup(),
    notGroupLeader(),

    async(req, res) => {
        const selectedGroupId = req.params.groupId;
        const groupMemberUserame = req.body.groupMemberName;
        const promotingMemberFoundByUsername = await findGroupMemberByUsername(selectedGroupId, groupMemberUserame);
        if (!promotingMemberFoundByUsername){
            return res.render(
                'groupsleaveleaderselect', 
                { 
                    page: 'groups', 
                    subpage: 'all', 
                    selectedChannelId: selectedGroupId,  
                    errorMessage: `There is no group member with a username of ${groupMemberUserame} in group!`
                }
            );
        }
        if (promotingMemberFoundByUsername.id === req.user.id){
            return res.render(
                'groupsleaveleaderselect', 
                { 
                    page: 'groups', 
                    subpage: 'all', 
                    selectedChannelId: selectedGroupId,  
                    errorMessage: 'You cannot promote yourself leader when leaving!'
                }
            );
        }
        promoteGroupMember(selectedGroupId, promotingMemberFoundByUsername.id, 'leader');
        await leaveGroup(req.user.id, selectedGroupId);
        return res.redirect('/groups/all');
    }
);

router.get('/all/:groupId/kick', 

    authenticationMiddleware(), 
    noGroups(),
    notInGroup(),
    notGroupLeader(),

    async (req, res) => {
        const selectedGroupId = req.params.groupId;
        return res.render(
            'groupskick', 
            { 
                page: 'groups', 
                subpage: 'all', 
                selectedChannelId: selectedGroupId 
            }
        );
    }
);

router.post('/all/:groupId/kick', 

    authenticationMiddleware(), 
    noGroups(),
    notInGroup(),
    notGroupLeader(),
    
    async (req, res) => {
        const selectedGroupId = req.params.groupId;
        const groupMemberUsername = req.body.groupMemberName;
        const kickingMemberFoundByUsername = await findGroupMemberByUsername(selectedGroupId, groupMemberUsername);
        if (!kickingMemberFoundByUsername){
            return res.render(
                'groupskick', 
                { 
                    page: 'groups', 
                    subpage: 'all', 
                    selectedChannelId: selectedGroupId, 
                    errorMessage: `${groupMemberUsername} is not in this group!`
                }
            );
        }
        if (kickingMemberFoundByUsername.id === req.user.id){
            return res.render(
                'groupskick', 
                { 
                    page: 'groups', 
                    subpage: 'all', 
                    selectedChannelId: selectedGroupId, 
                    errorMessage: `You cannot kick yourself!`
                }
            );
        }
        leaveGroup(kickingMemberFoundByUsername.id, selectedGroupId);
        res.render(
            'groupskick', 
            { 
                page: 'groups', 
                subpage: 'all', 
                selectedChannelId: selectedGroupId, 
                successMessage: `${groupMemberUsername} was kicked!`
            }
        );
    }
);

module.exports = router
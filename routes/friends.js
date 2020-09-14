//link these routes
const express = require('express');
const router = express.Router();

//middlware functions
const { authenticationMiddleware, noFriends, notInDMChannel, idNotInFriendRequests, noFriendRequests } = require('../utils/middlewares');

//database functions
const { acceptFriendRequest, sendFriendReuest, removeFriends, removeFriendRequest } = require('../utils/dbmanipulate');

const { getFriendsInfoFormatted, getFriendRequestsInfoFormatted, findUserByUsername, findFriendByUsername } = require('../utils/dbretrieve');
const { purgeChannelSockets, sendAdminMessage } = require('../socketevents');

/*Summary: redirect to first DM channel*/
router.get('/all', authenticationMiddleware(), (req, res) => {
    if (!req.user.friends) {
        return res.render('friendsall');
    }
    const firstChannelId = Object.values(req.user.friends)[0];
    return res.redirect(`/friends/all/${firstChannelId}`);
});

/*Summary: render selected channel's page*/
router.get('/all/:channelId', 

    authenticationMiddleware(), 
    noFriends(),
    notInDMChannel(),

    async (req, res) => {
        const selectedChannelId = req.params.channelId;
        const friendsInfo = await getFriendsInfoFormatted(req.user.friends);
        return res.render('friendsall', { channelInfo: friendsInfo, selectedChannelId: selectedChannelId });
    }
);

/*Summary: render "requests" page*/
router.get('/requests', authenticationMiddleware(), async (req, res) => {
    if (!req.user.friendRequests){
        return res.render( 'friendsrequests');
    } 
    const friendRequestInfo = await getFriendRequestsInfoFormatted(req.user.friendRequests)
    return res.render( 'friendsrequests', { requestInfo: friendRequestInfo });
})

/*Summary render "add" page*/
router.get('/add', authenticationMiddleware(), (req, res) => {
    return res.render('friendsadd');
})

/*Summary: render "remove" page*/
router.get('/remove', authenticationMiddleware(), (req, res) => {
    return res.render('friendsremove');
});

/*Summary: accept friend request*/
router.post('/requests/accept/:friendId', 

    authenticationMiddleware(), 
    noFriendRequests(),
    idNotInFriendRequests(),

    async (req, res) => { 
        const friendId = req.params.friendId;
        const channel = await acceptFriendRequest(req.user.id, friendId);
        console.log(channel);
        await sendAdminMessage(channel.id, "createdDM");
        return res.status(200).send('user added to friend list!');
    }
);

/*Summary: reject friend request*/
router.post('/requests/reject/:friendId', 
    authenticationMiddleware(), 
    noFriendRequests(),
    idNotInFriendRequests(),

    async (req, res) => {
        const friendId = req.params.friendId;
        await removeFriendRequest(req.user.id, friendId);
        return res.status(200).send('user was rejected');
    }
);


/*Summary: send friend request*/
router.post('/add', authenticationMiddleware(), async (req, res) => {
    const { friendName } = req.body;

    if (!friendName) {
        return res.render('friendsadd', { errorMessage: "Username cannot be empty!" });
    }

    if (typeof friendName !== "string") {
        return res.render('friendsadd', { errorMessage: "Username must be string!" });
    }

    if (friendName === req.user.username){
        return res.render('friendsadd', {  errorMessage: 'You cannot add yourself!' });
    }
    const userFoundByUsername = await findUserByUsername(friendName);
    if (!userFoundByUsername){
        return res.render('friendsadd', { errorMessage: `Could not find user "${friendName}"!` });
    }
    if (req.user.friendRequests && req.user.friendRequests.includes(userFoundByUsername.id)) {
        return res.render( 'friendsadd', { errorMessage: `User "${friendName}" already sent you a friend request!` })
    }
    if (req.user.friends){
        const friendIds = Object.keys(req.user.friends);
        if (friendIds.includes(userFoundByUsername.id)){
            return res.render('friendsadd', { errorMessage: `You and user "${friendName}" are already friends!` });
        }
    }
    if (userFoundByUsername.friendRequests && userFoundByUsername.friendRequests.includes(req.user.id)){
        return res.render('friendsadd', { errorMessage: `You already sent a friend request to user "${friendName}"!` });
    }

    await sendFriendReuest(userFoundByUsername.id, req.user.id);
    return res.render('friendsadd', { successMessage: `Your friend request was sent to "${friendName}"!` });
});

/*Summary: remove friend*/
router.post('/remove', authenticationMiddleware(), async(req, res) => {
    const { friendName } = req.body;

    if (!friendName) {
        return res.render('friendsadd', { errorMessage: "Username cannot be empty!" });
    }

    if (typeof friendName !== "string") {
        return res.render('friendsadd', { errorMessage: "Username must be string!" });
    }

    if (!req.user.friends){
        return res.render( 'friendsremove', { errorMessage: 'You do not have any friends to remove!' });
    }

    const friendFoundByUsername = await findFriendByUsername(req.user.friends, friendName);

    if (!friendFoundByUsername){
        return res.render( 'friendsremove', { errorMessage: `User ${friendName} is not in your friends list!` });
    }

    await removeFriends(req.user.id, friendFoundByUsername.id, friendFoundByUsername.channelId);

    await purgeChannelSockets(friendFoundByUsername.id, friendFoundByUsername.channelId);

    return res.render('friendsremove', { successMessage: `User ${friendName} was removed from your friends list!` });
});

module.exports = router
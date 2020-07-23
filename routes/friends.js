//link these routes
const express = require('express');
const router = express.Router();

//middlware functions
const { authenticationMiddleware, noFriends, notInDMChannel, idNotInFriendRequests, noFriendRequests } = require('../utils/middlewares');

//database functions
const { acceptFriendRequest, sendFriendReuest, removeFriends, removeFriendRequest } = require('../utils/dbmanipulate');

const { getFriendsInfoFormatted, getFriendRequestsInfoFormatted, findUserByUsername, findFriendByUsername } = require('../utils/dbretrieve');


/*Summary: redirect to "/friends/all" page*/
router.get('/', authenticationMiddleware(), (req, res) => {
    return res.redirect('/friends/all');
});

/*Summary: redirect to first DM channel*/
router.get('/all', authenticationMiddleware(), (req, res) => {
    if (!req.user.friends) {
        return res.render('friendsall', { page: 'friends', subpage: 'all' });
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
        return res.render(
            'friendsall', 
            { 
                page: 'friends', 
                subpage: 'all', 
                friendsInfo: friendsInfo,
                selectedChannelId: selectedChannelId
            }
        );
    }
);

/*Summary: render "requests" page*/
router.get('/requests', authenticationMiddleware(), async (req, res) => {
    if (!req.user.friendRequests){
        return res.render( 'friendsrequests', { page: 'friends', subpage: 'requests' });
    } 
    const friendRequestInfo = await getFriendRequestsInfoFormatted(req.user.friendRequests)
    return res.render( 'friendsrequests', { page: 'friends', subpage: 'requests', requestFriendsInfo: friendRequestInfo });
})

/*Summary render "add" page*/
router.get('/add', authenticationMiddleware(), (req, res) => {
    return res.render('friendsadd', { page: 'friends', subpage: 'add' });
})

/*Summary: render "remove" page*/
router.get('/remove', authenticationMiddleware(), (req, res) => {
    return res.render('friendsremove', { page: 'friends', subpage: 'remove' });
});

/*Summary: accept friend request*/
router.post('/requests/accept/:friendId', 

    authenticationMiddleware(), 
    noFriendRequests(),
    idNotInFriendRequests(),

    async (req, res) => { 
        const friendId = req.params.friendId;
        await acceptFriendRequest(req.user.id, friendId);
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
        /*await*/ removeFriendRequest(req.user.id, friendId);
        return res.status(200).send('user was rejected');
    }
);


/*Summary: send friend request*/
router.post('/add', authenticationMiddleware(), async (req, res) => {
    const friendUsername = req.body.friendName;
    if (friendUsername === req.user.username){
        return res.render(
            'friendsadd', 
            { 
                page: 'friends', 
                subpage: 'add', 
                errorMessage: 'You cannot add yourself!' 
            }
        );
    }
    const userFoundByUsername = await findUserByUsername(friendUsername);
    if (!userFoundByUsername){
        return res.render(
            'friendsadd', 
            { 
                page: 'friends', 
                subpage: 'add', 
                errorMessage: `Could not find user "${friendUsername}"!`
            }
        );
    }
    if (req.user.friendRequests && req.user.friendRequests.includes(userFoundByUsername.id)) {
        return res.render(
            'friendsadd',
            {
                page: 'friends',
                subpage: 'add',
                errorMessage: `User "${friendUsername}" already sent you a friend request!`
            }
        )
    }
    if (req.user.friends){
        const friendIds = Object.keys(req.user.friends);
        if (friendIds.includes(userFoundByUsername.id)){
            return res.render(
                'friendsadd', 
                { 
                    page: 'friends', 
                    subpage: 'add', 
                    errorMessage: `You and user "${friendUsername}" are already friends!` 
                }
            );
        }
    }
    if (userFoundByUsername.friendRequests && userFoundByUsername.friendRequests.includes(req.user.id)){
        return res.render(
            'friendsadd', 
            { 
                page: 'friends', 
                subpage: 'all', 
                errorMessage: `You already sent a friend request to user "${friendUsername}"!` 
            }
        );
    }
    sendFriendReuest(userFoundByUsername.id, req.user.id);
    return res.render(
        'friendsadd', 
        { 
            page: 'friends', 
            subpage: 'add', 
            successMessage: `Your friend request was sent to "${friendUsername}"!` });
});

/*Summary: remove friend*/
router.post('/remove', authenticationMiddleware(), async(req, res) => {
    const friendUsername = req.body.friendName;
    if (!req.user.friends){
        return res.render(
            'friendsremove',
            {
                page: 'friends',
                subpage: 'remove',
                errorMessage: 'You do not have any friends to remove!'
            }
        )
    }
    const friendFoundByUsername = await findFriendByUsername(friendUsername, req.user.friends);
    if (!friendFoundByUsername){
        return res.render(
            'friendsremove', 
            { 
                page: 'friends', 
                subpage: 'remove',
                errorMessage: `User ${friendUsername} is not in your friends list!`
            }
        );
    }
    removeFriends(req.user.id, friendFoundByUsername.id, friendFoundByUsername.channelId);

    const { userLeave, getSocketsByUserId } = require('../utils/usersockets');
    const io = require('../socketevents').getSocketIO();

    const leavingUserSockets = getSocketsByUserId(friendFoundByUsername.id);

    leavingUserSockets.forEach( userSocket => {
        if (userSocket.channelId === friendFoundByUsername.channelId){
            io.sockets.connected[userSocket.socketId].emit('leaveUser', { message: 'you have been removed as a friend!' });
            io.sockets.connected[userSocket.socketId].leave(friendFoundByUsername.channelId);
            userLeave(userSocket.id);
        }
    });

    return res.render(
        'friendsremove',
        {
            page: 'friends',
            subpage: 'remove',
            successMessage: `User ${friendUsername} was removed from your friends list!`
        }
    )
});

module.exports = router
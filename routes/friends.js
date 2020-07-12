const express = require('express');
const router = express.Router();

const { authenticationMiddleware, noFriends, notInDMChannel, idNotInFriendRequests, noFriendRequests } = require('../utils/middlewares');

const { acceptFriendRequest, sendFriendReuest, removeFriends, removeFriendRequest } = require('../utils/dbmanipulate');

const { getFriendsInfoFormatted, getFriendRequestsInfoFormatted, 
    findUserByUsername, findFriendByUsername } = require('../utils/dbretrieve');

router.get('/friends', authenticationMiddleware(), (req, res) => {
    return res.redirect('/friends/all');
});

router.get('/friends/all', authenticationMiddleware(), (req, res) => {
    if (!req.user.friends) {
        return res.render('friendsall', { page: 'friends', subpage: 'all' });
    }
    const firstChannelId = Object.values(req.user.friends)[0];
    return res.redirect(`/friends/all/${firstChannelId}`);
});

router.get('/friends/all/:channelId', 

    authenticationMiddleware(), 
    noFriends(),
    notInDMChannel(),

    async (req, res) => {
        const friendsInfo = await getFriendsInfoFormatted(req.user.friends);
        return res.render('friendsall', { page: 'friends', subpage: 'all', friendsInfo: friendsInfo });
    }
);

router.get('/friends/requests', authenticationMiddleware(), async (req, res) => {
    if (!req.user.friendRequests){
        return res.render( 'friendsrequests', { page: 'friends', subpage: 'requests' });
    } 
    const friendRequestInfo = await getFriendRequestsInfoFormatted(req.user.friendRequests)
    return res.render( 'friendsrequests', { page: 'friends', subpage: 'requests', requestFriendsInfo: friendRequestInfo });
})

router.get('/friends/add', authenticationMiddleware(), (req, res) => {
    return res.render('friendsadd', { page: 'friends', subpage: 'add' });
})

router.get('/friends/remove', authenticationMiddleware(), (req, res) => {
    return res.render('friendsremove', { page: 'friends', subpage: 'remove' });
});

router.post('/friends/requests/accept/:friendId', 

    authenticationMiddleware(), 
    noFriendRequests(),
    idNotInFriendRequests(),

    async (req, res) => { 
        const friendId = req.params.friendId;
        await acceptFriendRequest(req.user.id, friendId);
        return res.status(200).send('user added to friend list!');
    }
);

router.post('/friends/requests/reject/:friendId', 

    authenticationMiddleware(), 
    noFriendRequests(),
    idNotInFriendRequests(),

    async (req, res) => {
        const friendId = req.params.friendId;
        /*await*/ removeFriendRequest(req.user.id, friendId);
        return res.status(200).send('user was rejected');
    }
);

router.post('/friends/add', authenticationMiddleware(), async (req, res) => {
    const friendUsername = req.body.friendName;
    if (friendUsername === req.user.username){
        return res.render('friendsadd', { page: 'friends', subpage: 'add', searchError: 'You cannot add yourself!' });
    }
    const userFoundByUsername = await findUserByUsername(friendUsername);
    if (!userFoundByUsername){
        return res.render('friendsadd', { page: 'friends', subpage: 'add', searchError: 'Could not find user!' });
    }
    if (req.user.friendRequests && 
        req.user.friendRequests.includes(userFoundByUsername.id)) {
        return res.render(
            'friendsadd',
            {
                page: 'friends',
                subpage: 'add',
                searchError: 'The user already sent you a request!'
            }
        )
    }
    if (req.user.friends){
        const friendIds = Object.keys(req.user.friends);
        if (friendIds.includes(userFoundByUsername.id)){
            return res.render('friendsadd', { page: 'friends', subpage: 'add', searchError: 'You are already friends!' });
        }
    }
    if (userFoundByUsername.friendRequests &&
        userFoundByUsername.friendRequests.includes(req.user.id)){
        return res.render(
            'friendsadd', 
            { 
                page: 'friends', 
                subpage: 'all', 
                searchError: 'You already sent a request to that user!' 
            }
        );
    }
    /*await*/ sendFriendReuest(userFoundByUsername.id, req.user.id);
    return res.render('friendsadd', { page: 'friends', subpage: 'add', searchError: 'Your request was sent!' });
});

router.post('/friends/remove', authenticationMiddleware(), async(req, res) => {
    const friendUsername = req.body.friendName;

    if (!req.user.friends){
        return res.render(
            'friendsremove',
            {
                page: 'friends',
                subpage: 'remove',
                searchError: 'You have no friends!'
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
                searchError: 'The user is not in your friends list!' 
            }
        );
    }
    /*await*/ removeFriends(req.user.id, friendFoundByUsername.id, friendFoundByUsername.channelId);
    return res.render(
        'friendsremove',
        {
            page: 'friends',
            subpage: 'remove',
            searchError: 'User was removed from your friends list!'
        }
    )
});

module.exports = router
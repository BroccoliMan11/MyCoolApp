const express = require('express');
const router = express.Router();

const firebase = require('../database');

const authenticationMiddleware = require('../utils/authmidfunc');
const getUserInfo = require('../utils/getuserinfo');
const { FieldValue } = require('@google-cloud/firestore');

router.get('/friends', authenticationMiddleware(), (req, res) => {
    return res.redirect('/friends/all');
});

router.get('/friends/all', authenticationMiddleware(), async (req, res) => {
    const userInfo = await getUserInfo(req.user);
    
    firebase.database().ref(`users/`).update({"Yeetus":FieldValue.arrayUnion("cya")});
    const yeetus = (await firebase.database().ref(`users/Yeetus`).once('value')).val().elements;
    console.log(yeetus);    

    if (!userInfo.friends) {
        return res.render('friendsall', { page: 'friends', subpage: 'all' });
    }

    const firstChannelId = Object.values(userInfo.friends)[0];
    return res.redirect(`/friends/all/${firstChannelId}`);
});

router.get('/friends/all/:channelId', authenticationMiddleware(), async (req, res) => {

    const selectedChannelId = req.params.channelId;
    const userInfo = await getUserInfo(req.user);

    if (!userInfo.friends){
        return res.render('friendsall', { page: 'friends', subpage: 'all' });
    }  

    const userDMChannelIds = Object.values(userInfo.friends);

    if (!userDMChannelIds.includes(selectedChannelId)){
        return res.status(404).send('You are not associated with that channel ID!');
    }

    const friendsInfo = await Promise.all(Object.entries(userInfo.friends)
    .map(async ([friendId, channelId]) => {
        const friendInfo = await getUserInfo(friendId);
        return {username: friendInfo.username, id: friendId, channelId: channelId};
    }));
    
    return res.render('friendsall', { page: 'friends', subpage: 'all', friendsInfo: friendsInfo });
});

router.get('/friends/requests', authenticationMiddleware(), async (req, res) => {
    const userInfo = await getUserInfo(req.user);

    if (!userInfo.friendRequests){
        return res.render( 'friendsrequests', { page: 'friends', subpage: 'requests' });
    } 

    const requestFriendsInfo = await Promise.all(Object.values(userInfo.friendRequests).map(async (friendId) => {
        const friendInfo = await getUserInfo(friendId);
        return friendInfo;
    }));

    return res.render( 'friendsrequests', { page: 'friends', subpage: 'requests', requestFriendsInfo: requestFriendsInfo });
})

router.get('/friends/add', authenticationMiddleware(), (req, res) => {
    return res.render('friendsadd', { page: 'friends', subpage: 'add' });
})

router.get('/friends/remove', authenticationMiddleware(), (req, res) => {
    return res.render('friendsremove', { page: 'friends', subpage: 'remove' });
});

function getKeyByValue(object, value){
    return Object.keys(object).find(key => object[key] === value);
}

async function removeFromFriendRequests(userInfo, removingId){
    const removingObjKey = getKeyByValue(userInfo.friendRequests, removingId);
    await firebase.database().ref(`users/${userInfo.id}/friendRequests/${removingObjKey}`).remove();
}

router.post('/friends/requests/accept/:friendId', authenticationMiddleware(), async (req, res) => {
    const friendId = req.params.friendId;
    const userInfo = await getUserInfo(req.user);

    const userFriendRequestIds = Object.values(userInfo.friendRequests);
    if (!userFriendRequestIds.includes(friendId)) {
        return res.status(404).send('user ID is not in friend requests');
    }

    const channel = { channelType: 'DM', messageLog: {} };
    const newChannelAdded = firebase.database().ref('channels/').push(channel);
    firebase.database().ref(`users/${req.user}/friends/${friendId}`).set(newChannelAdded.key);
    firebase.database().ref(`users/${friendId}/friends/${req.user}`).set(newChannelAdded.key)

    removeFromFriendRequests(userInfo, friendId);

    return res.status(200).send('user added to friend list!');
});

router.post('/friends/requests/reject/:friendId', authenticationMiddleware(), async (req, res) => {
    const rejectingFriendId = req.params.friendId;
    const userInfo = await getUserInfo(req.user);

    removeFromFriendRequests(userInfo, rejectingFriendId);
    
    return res.status(200).send('user was rejected');
});

router.post('/friends/add', authenticationMiddleware(), async (req, res) => {
    const usernameFinding = req.body.friendName;
    const userInfo = await getUserInfo(req.user);

    if (usernameFinding === userInfo.username){
        return res.render('friendsadd', { page: 'friends', subpage: 'add', searchError: 'You cannot add yourself!' });
    }

    const userAdding = 
        await firebase.database().ref('users/')
        .orderByChild('username').equalTo(usernameFinding)
        .once('value');

    if (!userAdding.exists()){
        return res.render('friendsadd', { page: 'friends', subpage: 'add', searchError: 'Could not find user!' });
    }
    const userAddingId = Object.keys(userAdding.val())[0];
    if (userInfo.friendRequests){
        const friendRequestIds = Object.values(userInfo.friendRequests);
        if (friendRequestIds.includes(userAddingId)){
            return res.render(
                'friendsadd', 
                { 
                    page: 'friends', 
                    subpage: 'add', 
                    searchError: 'The user already sent you a request!' 
                }
            );
        }
    }
    if (userInfo.friends){
        const friendIds = Object.keys(userInfo.friends);
        if (friendIds.includes(userAddingId)){
            return res.render('friendsadd', { page: 'friends', subpage: 'add', searchError: 'You are already friends!' });
        }
    }
    const userAddingInfo = await firebase.database().ref(`users/${userAddingId}`).once('value');
    if (userAddingInfo.val().friendRequests){
        const friendRequestIds = Object.values(userAddingInfo.friendRequests);
        if (friendRequestIds.includes(req.user)){
            return res.render(
                'friendsadd', 
                { 
                    page: 'friends', 
                    subpage: 'all', 
                    searchError: 'You already sent a request to that user!' 
                }
            );
        }
    }
    firebase.database().ref(`users/${userAddingId}/friendRequests/`).push(req.user)
    return res.render('friendsadd', { page: 'friends', subpage: 'add', searchError: 'Your request was sent!' });
});

router.post('/friends/remove', authenticationMiddleware(), async(req, res) => {
    const usernameFinding = req.body.friendName;
    const userInfo = await getUserInfo(req.user);

    if (!userInfo.friends){
        return res.render(
            'friendsremove',
            {
                page: 'friends',
                subpage: 'remove',
                searchError: 'You have no friends!'
            }
        )
    }

    const userRemoving = 
    await firebase.database().ref('users/')
    .orderByChild('username').equalTo(usernameFinding)
    .once('value');

    if (!userRemoving.exists()){
        return res.render(
            'friendsremove', 
            { 
                page: 'friends', 
                subpage: 'remove',
                searchError: 'There is no user with that username!' 
            }
        );
    }

    const userRemovingId = Object.keys(userRemoving.val())[0];
    const channelRemovingId = userInfo.friends[userRemovingId];
    const userFriendIds = Object.keys(userInfo.friends);

    if (!userFriendIds.includes(userRemovingId)){
        return res.render(
            'friendsremove',
            {
                page: 'friends',
                subpage: 'remove',
                searchError: 'The user is not in your friends list!'
            }
        )
    }

    firebase.database().ref(`users/${req.user}/friends/${userRemovingId}`).remove();
    firebase.database().ref(`users/${userRemovingId}/friends/${req.user}`).remove();
    firebase.database().ref(`channels/${channelRemovingId}`).remove();

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
import imagekit from "../configs/imageKit.js";
import User from "../models/User.js";
import fs from "fs"
import { getAuth, clerkClient } from '@clerk/express';
import Post from "../models/Post.js";
import Connection from "../models/connection.js";
import { inngest } from "../inngest/index.js";


// Get user data using userId

export const getUserData = async (req, res) => {
    try {
        const { userId } = getAuth(req);
        let user = await User.findById(userId);
        if (!user) {
            try {
                const clerkUser = await clerkClient.users.getUser(userId);
                if (clerkUser) {
                    const email = clerkUser.emailAddresses[0]?.emailAddress;
                    let username = email ? email.split('@')[0] : `user_${Math.floor(Math.random() * 10000)}`;
                    const existingUser = await User.findOne({ username });
                    if (existingUser) {
                        username = username + Math.floor(Math.random() * 10000);
                    }
                    const userData = {
                        _id: userId,
                        email: email || '',
                        full_name: (clerkUser.firstName || '') + " " + (clerkUser.lastName || ''),
                        profile_picture: clerkUser.imageUrl || '',
                        username
                    };
                    user = await User.create(userData);
                } else {
                    return res.json({ success: false, message: "User not found" });
                }
            } catch (clerkError) {
                console.error("Clerk fetch error:", clerkError);
                return res.json({ success: false, message: "User not found in database and failed to fetch from Clerk" });
            }
        }
        res.json({ success: true, user })
    }
    catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// update user data
export const updateUserData = async (req, res) => {
    try {
        const { userId } = getAuth(req);
        let { username, bio, location, full_name } = req.body;

        const tempUser = await User.findById(userId);

        !username && (username = tempUser.username)

        if (tempUser.username !== username) {
            const user = await User.findOne({ username })
            if (user) {
                // we will not change the username if it is already taken
                username = tempUser.username
            }
        }

        const updateData = {
            username,
            bio,
            location,
            full_name
        }

        const profile = req.files.profile && req.files.profile[0]
        const cover = req.files.cover && req.files.cover[0]

        if (profile) {
            const buffer = fs.readFileSync(profile.path)
            const response = await imagekit.upload({
                file: buffer,
                fileName: profile.originalname,
            })
            const url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '512' }
                ]
            })
            updateData.profile_picture = url;
        }

        if (cover) {
            const buffer = fs.readFileSync(cover.path)
            const response = await imagekit.upload({
                file: buffer,
                fileName: cover.originalname,
            })
            const url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '1280' }
                ]
            })
            updateData.cover_picture = url;
        }
        const user = await User.findByIdAndUpdate(userId, updateData, { new: true })

        res.json({ success: true, user, message: 'Profile updated successfully' })

    }
    catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Find Users using username, email, location, name

export const discoverUsers = async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const { input } = req.body;

        const allUsers = await User.find({
            $or: [
                { username: new RegExp(input, 'i') },
                { email: new RegExp(input, 'i') },
                { full_name: new RegExp(input, 'i') },
                { location: new RegExp(input, 'i') }
            ]
        })

        const filteredUsers = allUsers.filter(user => user._id !== userId);
        res.json({ success: true, users: filteredUsers })
    }
    catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//follow user
export const followUser = async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const { id } = req.body;

        const user = await User.findById(userId)

        if (user.following.includes(id)) {
            return res.json({ success: false, message: 'you are already following this user' })
        }

        user.following.push(id);
        await user.save()

        const toUser = await User.findById(id)
        toUser.followers.push(userId);
        await toUser.save();

        res.json({ success: true, message: "Followed successfully" })
    }
    catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//unfollow user

export const unfollowUser = async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const { id } = req.body;

        const user = await User.findById(userId)
        user.following = user.following.filter(user => user !== id);
        await user.save()

        const toUser = await User.findById(id)
        toUser.followers = toUser.followers.filter(user => user !== userId);
        await toUser.save();

        res.json({ success: true, message: "Unfollowed successfully" })
    }
    catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// send connection request
export const sendConnectionRequest = async (req, res) => {
    try {
        const { userId } = getAuth(req)
        const { id } = req.body;

        // check if user haas sent more than 20 connection requests in the last 24 hours
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const connectionRequests = await Connection.find({ from_user_id: userId, created_at: { $gt: last24Hours } })
        if (connectionRequests.length >= 20) {
            return res.json({ success: false, message: 'You have sent more than 20 connection requests in the last 24 hours' })
        }

        // check if users are already connected
        const connection = await Connection.findOne({
            $or: [
                {from_user_id: userId, to_user_id: id },
                {from_user_id: id, to_user_id: userId },
            ]
        })
        if (!connection) {
            const newConnection = await Connection.create({
                from_user_id: userId,
                to_user_id: id
            })

            await inngest.send({
                name: 'app/connection-request',
                data: {connectionId: newConnection._id}
            })

            return res.json({ success: true, message: 'Connection request sent successfully' })
        }
        else if (connection && connection.status === 'accepted') {
            return res.json({ success: false, message: 'you are already connected with this user' })
        }
        return res.json({ success: false, message: 'connection request pending' })
    }
    catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//Get User Connections

export const getUserConnections = async (req, res) => {
    try {
        const { userId } = getAuth(req)
        const user = await User.findById(userId).populate('connection followers following')
        console.log(user)

        const connections = user.connection
        const followers = user.followers
        const following = user.following

        const pendingConnections = (await Connection.find({ to_user_id: userId, status: 'pending' }).populate('from_user_id')).map(connection => connection.from_user_id)

        res.json({ success: true, connections, followers, following, pendingConnections })
    }
    catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Accept Connection Request

export const acceptConnectionRequest = async (req, res) => {
    try {
        const { userId } = getAuth(req)
        const { id } = req.body;

        const connection = await Connection.findOne({ from_user_id: id, to_user_id: userId })

        if (!connection) {
            return res.json({ success: false, message: 'Connection not found' });
        }

        const user = await User.findById(userId);
        user.connection.push(id);
        await user.save()

        const toUser = await User.findById(id);
        toUser.connection.push(userId);
        await toUser.save()

        connection.status = 'accepted'
        await connection.save()

        res.json({ success: true, message: 'Connection accepted successfully' })
    }
    catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
// Get User Profile

export const getUserProfiles = async (req, res) => {
    try {
        const { profileId } = req.body;
        const profile = await User.findById(profileId)
        if (!profile) {
            return res.json({ success: false, message: 'Profile not found' })
        }
        const posts = await Post.find({ user: profileId }).populate('user')
        res.json({ success: true, profile, posts })
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
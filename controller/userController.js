import bcrypt from "bcryptjs"
import User from "../Schema/userSchema.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import Conversation from "../Schema/conversationSchema.js";
import Message from "../Schema/MessageSchema.js";
export const register = async (req, res) => {

    let image = ''
    
    const { name, email, password, username, phone } = req.body;
    const uu = username.toLowerCase();
    const mm = email.toLowerCase();
if(req.file){
    image = req.file.path
}
    // Check for missing fields
    if (!name || !email || !password || !username || !phone || !image) {
        return res.json({ alert: "Please enter all fields" });
    }

    // Check for existing users by email, phone, or username
    const existingUser = await User.findOne({ username: uu }) || 
                         await User.findOne({ phone }) || 
                         await User.findOne({ email: mm });

    if (existingUser) {
        return res.json({ alert: "Email or username or phone already in use" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const user = new User({
        name,
        email: mm,
        password: hashedPassword,
        username: uu,
        phone,
        image:`uploads/${image}`
    });

    try {
        await user.save();
        res.json({ success: "User Registered" });
    } catch (err) {
        console.error(err);
        res.json({alert: "Error registering user" });
    }
};

export const loginUser = async (req, res) => {
    const { username, password } = req.query;
    const query = {};

    if (!username || !password) {
        return res.json({ alert: "All fields are required" });
    }

    if (username) {
        query.username = username.toLowerCase();
    }

    try {
        const user = await User.findOne(query)
            .populate('notifications.user', 'username image')

        if (!user) {
            return res.json({ alert: "User not found" });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({ id: user._id, username: user.username }, "Vishalshailjaloveisvishailja");
            return res.json({ success: user, token });
        } else {
            return res.json({ alert: "Invalid Password" });
        }

    } catch (error) {
        console.error(error);
        res.json({ alert: error.message });
    }
};




export const updateProfile = async (req, res) => {
    const {name,imge} = req.body
    let image = ''

    if(req.file){
        image = req.file.filename
    }else if(req.body.image){
        image = req.body.image
    }

    // Build the update object based on provided fields
    
    // Ensure to hash this if you're storing passwords!

    try {
        // Assuming you have the user's ID from the request, e.g., from a JWT token or session
        const userId = req.body._id; // Adjust this according to your auth setup

        // Update the user in the database
        const updatedUser = await User.findByIdAndUpdate(userId,{image:`uploads/${image}`,name:name}, { new: true, runValidators: true }) 
        .populate('notifications.user', 'username image')

        if (!updatedUser) {
            return res.json({ alert: "User not found" });
        }

        res.json({success:updatedUser});
    } catch (error) {
        console.error(error);
        res.json({ alert: "An error occurred while updating the profile." });
    }
};



// Example route
// app.post('/api/users/:userId/posts', createPost);


export const addLike = async (req, res) => {
    const { userId, postId } = req.params; // Assuming userId and postId are passed in the URL
    const {currentUserId} = req.body; // Get the ID of the user who is liking the post

    try {
        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.json({ alert: "User not found" });
        }

        // Find the post by its ID
        const post = user.posts.id(postId); // Assuming postId is the ObjectId of the post

        if (!post) {
            return res.json({ alert: "Post not found" });
        }

        // Ensure likes array is initialized
        if (!post.likes) {
            post.likes = [];
        }

        // Check if the user has already liked the post
        const likeIndex = post?.likes?.findIndex(like => like._id.equals(currentUserId));

        if (likeIndex !== -1) {
            // If already liked, remove the like
            post.likes.splice(likeIndex, 1);
            await user.save();
            return res.json({ remove: "Like removed successfully", post });
        } else {
            // If not liked, add the like
            post.likes.push({ user: currentUserId });
            await user.save();
            return res.json({ success: "Post liked successfully", post });
        }
    } catch (error) {
        console.error(error);
        res.json({ alert: "An error occurred while toggling the like." });
    }
};


// Example route
// app.post('/api/users/:userId/posts/:postId/like', addLike);

export const addComment = async (req, res) => {
    const { userId, postId } = req.params; // Assuming userId and postId are passed in the URL
    const { text,currentUserId } = req.body; // Get the comment text from the request body

    try {
        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.json({ alert: "User not found" });
        }

        // Find the post by its ID
        const post = user.posts.id(postId); // Assuming postId is the ObjectId of the post

        if (!post) {
            return res.json({ alert: "Post not found" });
        }

        // Create the comment object
        const comment = {
            user: currentUserId,
            text: text
        };

        // Add the comment to the post's comments array
        post.comments.push(comment);

        // Save the user document
        await user.save();

        res.json({ alert: "Comment added successfully", post });
    } catch (error) {
        console.error(error);
        res.json({ alert: "An error occurred while adding the comment." });
    }
};


export const viewPosts = async (req, res) => {
    const { userId } = req.params;

    try {
        // Find the user by ID
        const user = await User.findById(userId)
            .populate('posts.likes.user', 'username image') // Populate likes user info
            .populate('posts.comments.user', 'username image'); // Populate comments user info

        if (!user) {
            return res.json({ alert: "User not found" });
        }

        // Return the user's posts
        res.json({ posts: user.posts });
    } catch (error) {
        res.json({ alert: error.message });
    }
};

// Follow a user
export const followUser = async (req, res) => {
    const { userId, targetUserId } = req.params; // IDs of the user making the request and the user to follow

    try {
        const user = await User.findById(userId);
        const targetUser = await User.findById(targetUserId);

        if (!user || !targetUser) {
            return res.json({ alert: "User not found" });
        }

        // Add targetUser to user's following
        if (!user.following.includes(targetUserId)) {
            user.following.push(targetUserId);
            await user.save();
        }

        // Add user to targetUser's followers
        if (!targetUser.followers.includes(userId)) {
            targetUser.followers.push(userId);
            await targetUser.save();
        }

        res.json({ alert: "Followed successfully" });
    } catch (error) {
        res.json({ alert: error.message });
    }
};

// Unfollow a user
export const unfollowUser = async (req, res) => {
    const { userId, targetUserId } = req.params; // IDs of the user making the request and the user to unfollow

    try {
        const user = await User.findById(userId);
        const targetUser = await User.findById(targetUserId);

        if (!user || !targetUser) {
            return res.json({ alert: "User not found" });
        }

        // Remove targetUser from user's following
        user.following = user.following.filter(id => !id.equals(targetUserId));
        await user.save();

        // Remove user from targetUser's followers
        targetUser.followers = targetUser.followers.filter(id => !id.equals(userId));
        await targetUser.save();

        res.json({ alert: "Unfollowed successfully" });
    } catch (error) {
        res.json({ alert: error.message });
    }
};


export const viewProfile = async(req,res) =>{
    const {id} = req.params;
    try {
        const user = await User.findById(id).populate('following', "username image").populate('followers', "username image").populate('posts')
        if(!user) return res.json({alert: 'User not found'})
            res.json({success : user})

        
    } catch (error) {
        res.json({alert:error.message})
    }
}


export const createPost = async (req, res) => {
    const { _id } = req.params;
    const { description } = req.body;
    const image = req.file ? req.file.filename : '';

    try {
        const user = await User.findById(_id);
        if (!user) return res.status(404).json({ alert: "User not found" });

        // Create a new post object with an ID
        const newPost = {
            _id: new mongoose.Types.ObjectId(), // Create a new unique ID
            image,
            description: description || "",
            creator: user._id,
        };

        // Add the new post to the user's posts array
        user.posts.push(newPost);
        await user.save();

        // Create the feed entry using the same post
        const feedEntry = {
            post: newPost,
            createdBy: {
                userId: user._id,
                username: user.username,
                image: user.image,
            },
        };

        // Prepare bulk operations for followers
        const bulkOps = user.followers.map(followerId => ({
            updateOne: {
                filter: { _id: followerId },
                update: { $push: { feeds: feedEntry } },
            },
        }));

        // Execute bulk operations
        if (bulkOps.length > 0) {
            await User.bulkWrite(bulkOps);
        }

        res.json({ success: "Post created successfully", post: newPost });
    } catch (error) {
        console.error(error);
        res.status(500).json({ alert: "An error occurred while creating the post." });
    }
};



export const getFeeds = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id)
            .populate('following', "username image")
            .populate('followers', "username image")
            .populate({
                path: 'feeds.post',
                populate: { path: 'creator', select: "username _id image" }
            });

        if (!user) return res.json({ alert: 'User not found' });

        const feeds = user.feeds.map(feed => ({
            postId: feed.post._id,
            image: feed.post.image,
            likes: feed.post.likes,
            comments: feed.post.comments,
            description: feed.post.description,
            createdAt: feed.createdAt,
            createdBy: {
                userId: feed.createdBy.userId,
                username: feed.createdBy.username,
                image: feed.createdBy.image,
            },
        }));

        res.json({ success: true, feeds });
    } catch (error) {
        console.error(error);
        res.json({ alert: "An error occurred while fetching feeds." });
    }
};


export const getNotify = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id)
            .populate({
                path: 'notifications.user',
                select: 'username image' // Specify fields to include
            }).populate({
                path: 'notifications.post'
            });

        if (!user) {
            return res.json({ alert: "User not found." });
        }

        const notify = user.notifications;
        res.json({ success: notify });
    } catch (error) {
        console.error(error);
        res.json({ alert: "An error occurred while fetching notifications." });
    }
};



export const getConversations = async (req, res) => {
    const {id} = req.params; // Assume you have middleware to set req.user
    try {
        const conversations = await Conversation.find({
            participants: id
        }).populate('participants', 'username name image'); // Populate with user info

        res.json({ success: true, conversations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


// Assuming you have a Message model
export const getMessagesByConversationId = async (req, res) => {
    const { conversationId } = req.params;
    try {
      const messages = await Message.find({ conversationId })
        .populate('sender', 'username image') // Populate sender info if needed
        .sort({ createdAt: 1 }); // Sort messages by creation date
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
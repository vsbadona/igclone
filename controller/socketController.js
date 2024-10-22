// postController.js
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import User from '../Schema/userSchema.js'; // Adjust the import according to your structure
import { fileURLToPath } from 'url';
import Conversation from '../Schema/conversationSchema.js';
import Post from '../Schema/postSchema.js';
import Message from '../Schema/MessageSchema.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

export const createConversation = async (socket, io, user1Id, user2Id) => {
  try {
      // Validate user IDs
      if (!mongoose.Types.ObjectId.isValid(user1Id) || !mongoose.Types.ObjectId.isValid(user2Id)) {
          throw new Error('Invalid user IDs');
      }

      console.log('Attempting to create conversation between:', user1Id, user2Id);

      // Check if the conversation already exists
      let conversation = await Conversation.findOne({
          participants: { $all: [user1Id, user2Id] }
      }).populate('participants');

      if (!conversation) {
          // Create a new conversation
          conversation = new Conversation({
              participants: [user1Id, user2Id]
          });

          await conversation.save(); // Save the new conversation

          // Populate the newly created conversation's participants
          conversation = await Conversation.findById(conversation._id).populate('participants');

          // Save conversation ID in both users' schemas
          await User.findByIdAndUpdate(user1Id, { $addToSet: { conversations: conversation._id } });
          await User.findByIdAndUpdate(user2Id, { $addToSet: { conversations: conversation._id } });

          // Emit the populated conversation details to all clients
          io.emit('conversationCreated', conversation); // Emit populated conversation
      }else{

        socket.join(conversation._id); 
        // Emit the populated conversation details to the creating user
        socket.emit('conversationExists', conversation); // Emit populated conversation
      }

      // Join the conversation room
  } catch (error) {
      console.error('Error creating conversation:', { user1Id, user2Id, error });
  }
};



export const joinConversation = (socket, conversationId) => {
  socket.join(conversationId);
  console.log(`User joined conversation: ${conversationId}`);
};

export const sendMessage = async ({ conversationId, userId, text }) => {
  const message = new Message({ conversationId, sender: userId, text });
  await message.save();

  // Update last message in conversation
  const conversation = await Conversation.findById(conversationId);
  conversation.lastMessage = message._id;
  await conversation.save();

  return message; // Return the saved message
};


// Get all conversations for a user
export const getAllCon = async (socket, userId ) => {
  try {
    const user = await User.findById(userId).populate({
      path: 'conversations',
      populate: [
        { path: 'participants', select: 'username image' },
        { path: 'lastMessage' } // Populate lastMessage to access its content
      ],
    });

    const conversations = user.conversations.map(conversation => {
      const filteredParticipants = conversation.participants.filter(participant => participant._id.toString() !== userId);
      return {
        ...conversation.toObject(),
        participants: filteredParticipants,
      };
    });

    socket.emit('getallconv', { conversations });
  } catch (error) {
    socket.emit('alert', { message: error.message });
  }
};




export const createPost = async (socket,io, userId, { description, image }) => {
  try {
    const buffer = Buffer.from(new Uint8Array(image));
    const fileName = `${new mongoose.Types.ObjectId()}.jpg`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, buffer);
    const user = await User.findById(userId);
    if (!user) return;

    const newPost = new Post({
      _id: new mongoose.Types.ObjectId(),
      image: `/uploads/${fileName}`,
      description: description || "",
      likes: [],
      comments: [],
      createdAt: Date.now(),
      user: user._id,
    });

    await newPost.save();
    const populatedPost = await Post.findById(newPost._id).populate('user', 'username name image').populate('likes.user', 'username name image').populate('comments.user', 'username name image');

    // Emit the new post to all connected clients
    io.emit('postcreated', populatedPost);

  } catch (error) {
    console.error(error);
    throw new Error("An error occurred while creating the post.");
  }
};


export const likepost = async (socket, data, io) => {
    try {
        const post = await Post.findById(data.postId);
        if (!post) return;
        const user = await User.findById(data.userId);
        if (!user) return;

        const index = post.likes.findIndex(like => like?.user?.equals(user._id));

        if (index === -1) {
            // User is liking the post
            post.likes.push({ user: user._id }); // Store as an object
            await post.save();

            // Populate after saving
            const newPost = await Post.findById(post._id)
                .populate('user', 'username name image')
                .populate('likes.user', 'username name image')
                .populate('comments.user', 'username name image');

            // Send notification to the post owner
            const postOwner = await User.findById(newPost.user._id);
            if (postOwner) {
                postOwner.notifications.push({
                    user: user._id,
                    content: ` has liked your post`,
                    time: Date.now(),
                    post:post._id
                });
                await postOwner.save(); // Save the notification to the user
            }

            
            
            io.to(newPost?.user?._id.toString()).emit('notify', {
                content: `has liked your post`,
                user: user,
                post: newPost,
                time: Date.now(),

            });
            io.emit('likepost', newPost);
        } else {
            // User is unliking the post
            post.likes.splice(index, 1);
            await post.save();

            const newPost = await Post.findById(post._id)
                .populate('user', 'username name image')
                .populate('likes.user', 'username name image')
                .populate('comments.user', 'username name image');
            io.emit('unlikepost', newPost);
        }
    } catch (error) {
        console.error(error);
    }
};



export const getfeeds = async (socket, io) => {
  try {
      const feeds = await Post.find().populate('user', 'username name image').populate('likes.user', 'username name image').populate('comments.user', 'username name image'); // Populate userId from createdBy
      socket.emit('feeds', feeds); // Emit the populated feeds
  } catch (err) {
      console.error('Error fetching feeds:', err);
      socket.emit('error', { message: 'Failed to fetch feeds' });
  }
};


export const getUserPost = async(socket,data,io) =>{
  
  const {userId} = data;
  try {
    const userPosts = await Post.find({user: userId}).populate('user', 'username name image').populate('likes.user', 'username name image').populate('comments.user', 'username name image');
    socket.emit('getposts', userPosts);
    } catch (err) {
      console.error('Error fetching user posts:', err);
      socket.emit('error', { message: 'Failed to fetch user posts' });
      }
}


export const deletePost = async (socket, io, data) => {
  const { postId } = data;
  try {
      const deletedPost = await Post.findByIdAndDelete(postId);
      if (!deletedPost) {
          console.error('Post not found');
          return;
      }

      console.log(`Post ${postId} deleted. Emitting 'deletedpost' event.`);
      io.emit('deletedpost', postId); // This should be seen in the server logs
  } catch (err) {
      console.error('Error deleting post:', err);
  }
};


export const commentpost = async (socket, data, io) => {
  try {
    const post = await Post.findById(data.postId);
    if (!post) return;
    const user = await User.findById(data.userId);
    if (!user) return;
    
      // User is liking the post
      post.comments.push({ user: user._id,text:data?.text }); // Store as an object
      await post.save();
      
      // Populate after saving
      const newPost = await Post.findById(post._id).populate('user', 'username name image').populate('likes.user', 'username name image').populate('comments.user', 'username name image');

      const postOwner = await User.findById(newPost.user._id);
      if (postOwner) {
          postOwner.notifications.push({
              user: user._id,
              content: ` has commented on your post : ${data?.text}`,
              time: Date.now(),
              post:post._id
          });
          await postOwner.save(); // Save the notification to the user
      }

      io.to(newPost?.user?._id.toString()).emit('notify', {
          content: `has commented on your post : ${data?.text}`,
          user: user,
          post: newPost
      });
      io.emit('commentpost', newPost);
   
  } catch (error) {
    console.error(error);
  }
};


export const deletecomment = async (socket, data, io) => {
  try {
    const post = await Post.findById(data.postId);
    if (!post) return;

    const user = await User.findById(data.userId);
    if (!user) return;

    // Find the index of the comment to delete
    const index = post.comments.findIndex(comment => comment._id.equals(data.comment));

    if (index !== -1) {
      // Remove the comment
      post.comments.splice(index, 1);
      await post.save();

      // Populate the post to emit the updated state
      const newPost = await Post.findById(post._id)
        .populate('user', 'username name image')
        .populate('likes.user', 'username name image')
        .populate('comments.user', 'username name image');

      // Emit the updated post after comment deletion
      io.emit('deletecomment', newPost);
    }
  } catch (error) {
    console.error(error);
  }
};


export const viewProfile = async(socket, data, io) =>{
  try{
    const user = await User.findById(data.userId);
    io.emit('viewprofile', user);
    }catch(error){
      console.error(error);
      }
}


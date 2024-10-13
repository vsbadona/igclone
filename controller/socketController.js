// postController.js
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import User from '../Schema/userSchema.js'; // Adjust the import according to your structure
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

export const notifyFollowers = async (userId, newPost, io) => {
  const user = await User.findById(userId).populate('followers'); // Fetch followers
  const followers = user.followers.map(follower => follower._id.toString());

  const feedPost = {
    postId: newPost.post._id, // Create a new unique ID
      image: newPost.post.image, // Save the relative path to the image
      description: newPost.post.description,
      likes: [],
      comments: [],
      creator: user._id,
      createdBy: {
        userId: user._id,
        username: user.username,
        image: user.image,
      },
  }

  followers.forEach(followerId => {
    io.to(followerId).emit('newPost',feedPost);  // Emit new post to each follower's room
  });
};

export const createPost = async (userId, { description, image }, io) => {
  try {
    const buffer = Buffer.from(new Uint8Array(image));

    const fileName = `${new mongoose.Types.ObjectId()}.jpg`; // Change extension as needed
    const filePath = path.join(uploadsDir, fileName); // Specify your uploads directory

    // Save the image to the filesystem
    fs.writeFileSync(filePath, buffer); // Handle errors in a production app
    const user = await User.findById(userId);
    if (!user) return;

    // Create a new post object with an ID
    const newPost = {
      _id: new mongoose.Types.ObjectId(), // Create a new unique ID
      image: `/uploads/${fileName}`, // Save the relative path to the image
      description: description || "",
      likes: [],
      comments: [],
      creator: user._id,
      createdAt:Date.now()
    };

    // Add the new post to the user's posts array
    user.posts.push(newPost);
    await user.save();
    io.to(userId).emit('profilePost',newPost);
  
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

    await notifyFollowers(userId, feedEntry, io); // Notify followers
  } catch (error) {
    console.error(error);
    throw new Error("An error occurred while creating the post.");
  }
};

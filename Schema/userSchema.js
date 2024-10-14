import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  image: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  likes: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
  comments: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: { type: String, required: true }
  }]
});
export const Post = mongoose.model('Post', postSchema);


const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true },
    image: {
        type: String,
        default: "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
    },
    email: { type: String, required: true },
    phone: { type: Number, required: true },
    password: { type: String, required: true },
    posts: [postSchema],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    feeds: [{
        post: { type: postSchema },
        createdBy: {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            username: String,
            image: String
        },
        createdAt: { type: Date, default: Date.now }
    }],
    conversations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' ,user:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }}]

});

const User = mongoose.model("User", userSchema);
export default User;
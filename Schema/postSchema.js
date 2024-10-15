import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  image: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  likes: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
  comments: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: { type: String, required: true }
  }]
});
const Post = mongoose.model("Post", postSchema);
export default Post;
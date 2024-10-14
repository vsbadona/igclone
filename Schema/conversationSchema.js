import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  creator:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [{
    text: String,
    image: String,
    read: { type: Boolean, default: false },
    reciever: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }
  }]
});

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;

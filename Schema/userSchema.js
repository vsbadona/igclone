import mongoose from "mongoose";


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
    notifications:[{
        // user, action, content, time, image, postImage, button
        time:{ type: Date, default: Date.now },
        user:{
            type:mongoose.Schema.Types.ObjectId, ref: 'User' 
        },
        post:{
            type:mongoose.Schema.Types.ObjectId, ref: 'Post'
        },
        content:String,
    }],
    conversations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' ,user:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }}]

});

const User = mongoose.model("User", userSchema);
export default User;
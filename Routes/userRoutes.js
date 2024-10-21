import express from "express"
import multer from "multer"
import path from "path"
import { addComment, addLike, createPost, followUser, getConversations, getFeeds, getMessagesByConversationId, getNotify, loginUser, register, unfollowUser, updateProfile, viewPosts, viewProfile } from "../controller/userController.js";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null,  Date.now()+ path.extname(file.originalname));
    },
  });
  
  const upload = multer({ storage });

const Routes = express.Router();

Routes.get('/login',loginUser)
Routes.post('/register',upload.single('image'),register)
Routes.patch('/update-profile',upload.single('image'),updateProfile)
Routes.get('/view-profile/:id',viewProfile)
Routes.post('/create-post/:_id',upload.single('image'),createPost)
Routes.post('/addlike/:userId/:postId',addLike)
Routes.post('/addcomment/:userId/:postId',addComment)
Routes.get('/getposts/:userId',viewPosts)
Routes.get('/getfeeds/:id',getFeeds)
Routes.post('/follow/:userId/:targetUserId',followUser)
Routes.post('/unfollow/:userId/:targetUserId',unfollowUser)
Routes.get('/viewnotify/:id',getNotify)
Routes.get('/getconv/:id',getConversations)
Routes.get('/messages/:conversationId', getMessagesByConversationId);

export default Routes

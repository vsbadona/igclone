// socket.js
import { Server } from "socket.io";
import User from './Schema/userSchema.js'; // Adjust the import according to your structure
import {  commentpost, createConversation, createPost,deletecomment,deletePost,getAllCon, getfeeds, getUserPost, joinConversation, likepost, sendMessage, viewProfile } from "./controller/socketController.js";

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ['GET', 'POST'],
      credentials: true,
    }
  });

  io.on("connection", (socket) => {
    console.log("Connected to Socket", socket.id);

    socket.on('join', (data) => {
      const { userId } = data;
      if (userId) {
        socket.join(userId);  // Join a room named after userId
        console.log(`User with ID: ${userId} has joined their room`);
      }
    });

    socket.on('uploadPost', async (data) => {
      const { userId, description, image } = data;
      try {
        await createPost(socket,io, userId, { description, image }, io);
      } catch (error) {
        socket.emit('postError', { message: error.message });
      }
    });
    

    socket.on('getfeeds',async()=>getfeeds(socket,io))
    socket.on('getposts',async(data) => getUserPost(socket,data,io));

    socket.on('likepost',async(data)=>likepost(socket,data,io))
    socket.on('commentpost',async(data)=>commentpost(socket,data,io))
    socket.on('deletecomment',async(data)=>deletecomment(socket,data,io))
    socket.on('userprofile',async(data)=>viewProfile(socket,data,io))
  
    socket.on('searchUser',async({prompt}) =>{
      try {
        const users = await User.find({ username: new RegExp(prompt, 'i') });
      io.emit('searched', users);
      } catch (error) {
        console.log(error.message);
        
      }
    })

    socket.on('createConversation', ({ user1Id, user2Id }) =>  createConversation(socket, io, user1Id,user2Id));

    // Event for getting all conversations
    socket.on('join', ({ conversationId }) => {
      socket.join(conversationId);
      console.log(`User joined room: ${conversationId}`);
    });
    socket.on('getallconv', ({ userId}) =>  getAllCon(socket,userId));

    // Event for getting all conversations
    socket.on('join', ({ conversationId }) => {
      socket.join(conversationId);
      console.log(`User joined room: ${conversationId}`);
    });
  
    socket.on('chat message', async (msg) => {
      try {
        const message = await sendMessage(msg);
        // Emit the saved message to the room
        socket.to(msg.conversationId).emit('chat message', message);
      } catch (error) {
        console.error('Error saving message:', error);
      }
    });
  
    socket.on('typing', (data) => {
      socket.to(data.conversationId).emit('typing', { username: data.username });
    });
  
    socket.on('stop typing', (data) => {
      socket.to(data.conversationId).emit('stop typing');
    });
  
  socket.on('deletepost',(data) => deletePost(socket,io,data))

    socket.on("disconnect", () => {
      console.log(`User with socket ID: ${socket.id} has disconnected`);
    });

  });
};

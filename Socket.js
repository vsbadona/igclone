// socket.js
import { Server } from "socket.io";
import User from './Schema/userSchema.js'; // Adjust the import according to your structure
import {  commentpost, createConversation, createPost,deletecomment,deletePost,getAllCon, getfeeds, getUserPost, likepost, viewProfile } from "./controller/socketController.js";

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

    socket.on('createcon', (data) => createConversation(socket, io, data));

    // Event for getting all conversations
    socket.on('getAllCon', (data) => getAllCon(socket, data));

    
    socket.on('chat message', (msg) => {
      io.to(msg.room).emit('chat message', msg); // Send message to the specific room
  });

  socket.on('typing', (data) => {
      socket.to(data.room).emit('typing', data);
  });

  socket.on('stop typing', (data) => {
      socket.to(data.room).emit('stop typing', data);
  });

  socket.on('deletepost',(data) => deletePost(socket,io,data))

    socket.on("disconnect", () => {
      console.log(`User with socket ID: ${socket.id} has disconnected`);
    });

  });
};

// socket.js
import { Server } from "socket.io";
import User from './Schema/userSchema.js'; // Adjust the import according to your structure
import { createPost } from "./controller/socketController.js";

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
        await createPost(userId, { description, image }, io);
        socket.emit('postCreated', { message: 'Post created successfully' });
      } catch (error) {
        socket.emit('postError', { message: error.message });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User with socket ID: ${socket.id} has disconnected`);
    });
  });
};

import cors from "cors"
import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import userRoutes from "./Routes/userRoutes.js"
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from 'path';
import { initializeSocket } from "./Socket.js"
import http from "http"


const app = express()
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors({ origin: "*", credentials: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
dotenv.config()
app.use(cors())
app.use(express.json())
app.use('/',userRoutes)

const server = http.createServer(app)
initializeSocket(server)
const PORT = process.env.PORT || 5000
server.listen(PORT , ()=>{console.log(`App is listening on PORT:${PORT}`)})
mongoose.connect("mongodb+srv://Vishal123:Vishal123@cluster0.hwzrbs5.mongodb.net/insta?retryWrites=true&w=majority&appName=Cluster0")
const db = mongoose.connection
db.on("error",(err)=>{console.log(err.message,"Can't Connect TO Db");})
db.once("open",()=>{console.log("Connected To Db");})
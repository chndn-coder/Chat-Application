const express = require("express"); // Importing Express framework
const http = require("http"); // Importing Node.js HTTP module
const path = require("path"); // Importing Path module to handle file paths
const socketIo = require("socket.io"); // Importing Socket.io for real-time communication

const app = express(); // Creating an Express application
const server = http.createServer(app); // Creating an HTTP server using Express
const io = socketIo(server); // Attaching Socket.io to the server

const port = 5000; // Defining the port number

// Serve static files (like HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Handle request for the homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html")); // Send the index.html file when the user visits "/"
});

const users = {}; // Object to store active users
const rooms = {}; // Object to store active chat rooms

// When a client connects
io.on("connection", (socket) => {
    console.log("A user connected"); // Log when a new user connects

    // Handle user joining a room
    socket.on("join", ({ username, room }) => {
        socket.username = username; // Store username in the socket object
        socket.room = room; // Store room name in the socket object
        socket.join(room); // Join the specified chat room

        if (!rooms[room]) {
            rooms[room] = []; // If room doesn't exist, create an empty array
        }
        rooms[room].push(username); // Add user to the room

        // Send a welcome message to the user
        socket.emit("chat message", {
            username: "System",
            text: `Welcome ${username}!`,
            timestamp: new Date().toLocaleTimeString(),
        });

        // Notify other users in the room
        socket.to(room).emit("chat message", {
            username: "System",
            text: `${username} has joined the chat.`,
            timestamp: new Date().toLocaleTimeString(),
        });

        io.to(room).emit("update users", rooms[room]); // Send updated user list to the room
    });

    // Handle user switching rooms
    socket.on("switchRoom", ({ username, newRoom }) => {
        socket.leave(socket.room); // Leave the current room
        rooms[socket.room] = rooms[socket.room].filter((user) => user !== username); // Remove user from the old room

        socket.room = newRoom; // Update socket's room to the new room
        socket.join(newRoom); // Join the new room

        if (!rooms[newRoom]) {
            rooms[newRoom] = []; // If new room doesn't exist, create an empty array
        }
        rooms[newRoom].push(username); // Add user to the new room

        // Notify the user about the room change
        socket.emit("chat message", {
            username: "System",
            text: `You joined ${newRoom} room!`,
            timestamp: new Date().toLocaleTimeString(),
        });

        // Notify other users in the new room
        socket.to(newRoom).emit("chat message", {
            username: "System",
            text: `${username} has joined the chat.`,
            timestamp: new Date().toLocaleTimeString(),
        });

        io.to(newRoom).emit("update users", rooms[newRoom]); // Update user list in the new room
    });

    // Handling chat messages
    socket.on("chat message", (data) => {
        io.to(data.room).emit("chat message", { // Send message to all users in the room
            username: data.username,
            text: data.text,
            timestamp: new Date().toLocaleTimeString(),
        });
    });

    // Handle user disconnecting
    socket.on("disconnect", () => {
        if (rooms[socket.room]) { // If user was in a room
            rooms[socket.room] = rooms[socket.room].filter((user) => user !== socket.username); // Remove user from the room
            
            // Notify other users in the room
            io.to(socket.room).emit("chat message", {
                username: "System",
                text: `${socket.username} has left the chat.`,
                timestamp: new Date().toLocaleTimeString(),
            });

            io.to(socket.room).emit("update users", rooms[socket.room]); // Update user list
        }
        console.log("A user disconnected"); // Log disconnection
    });
});

// Start the server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`); // Log server URL
});

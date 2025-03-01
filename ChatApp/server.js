const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

const port = 5000;

// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname)));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('chat message', (data) => {
        io.emit('chat message', data);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

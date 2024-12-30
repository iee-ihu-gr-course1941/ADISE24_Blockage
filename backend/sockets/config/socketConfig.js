module.exports = (server) => {
    const io = require('socket.io')(server, {
        // maxHttpBufferSize: 1e8, // 100 MB we can upload to server (By Default = 1MB)
        // pingTimeout: 60000, // increate the ping timeout 
        // cors: {
        // origin: "*",
        // methods: [GET, POST],
        // },
    });
    return io;
}
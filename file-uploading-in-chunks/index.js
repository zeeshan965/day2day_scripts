// Server-side code
const express = require('express');
const app = express();
const PORT = process.env.PORT || 2000;
const {Server} = require("socket.io");
const fs = require('fs');
const path = require('path');

app.use(express.static('public'));
app.post('/upload', async (req, res) => {
    const dir = __dirname + '/uploads/' + req.headers['file-name'].replace(/\s+/g, '');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    const chunkIndex = req.headers['chunk-index'];
    const totalChunks = req.headers['total-chunks'];
    const extension = req.headers['file-extension'];
    let buffer = null, filename = '', chunks = [], totalBytesInBuffer = 0,
        fileName = `${generateRandomString(10)}_${Date.now()}.index.${chunkIndex}`;

    req.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk))
        totalBytesInBuffer += chunk.length;
    });

    req.on('end', () => {
        chunks = Buffer.concat(chunks, totalBytesInBuffer);
        filename = `${generateRandomString(10)}_${Date.now()}.${extension}`;
        const filePath = path.join(dir, filename);
        fs.writeFile(filePath, chunks, (err) => {
            if (err) console.error(err);
            else console.log(`Saved ${filename} to ${filePath}`);
        });
        res.send({status: 'success!'}).status(200);
    });


    /*if (totalChunks === '1') {
        fileName = `${generateRandomString(10)}_${Date.now()}.${extension}`;
        const filePath = path.join(dir, fileName);
        const writeStream = fs.createWriteStream(filePath, {flags: 'a'});
        req.on('data', (chunk) => {
            const buffer = Buffer.from(chunk, 'base64');
            writeStream.write(buffer)
        });
        req.on('end', () => {
            writeStream.end();
            console.log(`Saved ${fileName} to ${filePath}`);
            res.send({
                status: 'success!',
                message: `Chunk ${chunkIndex} saved to file: ${fileName} Filepath: ${filePath}`
            }).status(200);
        });
    }*/

    /*const filePath = path.join(dir, fileName);
    console.log(`Chunk ${chunkIndex} saved to file: ${fileName} Filepath: ${filePath}`);
    const writeStream = fs.createWriteStream(filePath, {flags: 'a'});
    req.on('data', (chunk) => writeStream.write(chunk));
    req.on('end', () => writeStream.end());*/
});

const server = app.listen(PORT, () => {
    console.log("Your app is listening on port " + server.address().port);
});

const io = new Server(server, {maxHttpBufferSize: 1e8});
io.on("connection", (socket) => {
    console.log("A user connected");
    socket.on("upload", (fileData, callback) => {
        console.log(fileData); // ArrayBuffer
    });
    socket.on('message', (data) => {
        console.log('message:', data);
    });
    socket.on("status", (data) => {
        console.log('status: ', data); // ArrayBuffer
    });

    // Handle client disconnection
    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

function generateRandomString(length) {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

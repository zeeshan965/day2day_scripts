// Server-side code
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
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

io.on('connection', (socket) => {
    socket.on('chunk', (data) => {
        const filePath = `uploads/${data.fileName}`;
        const fileStream = fs.createWriteStream(filePath, {flags: 'a'});

        fileStream.write(Buffer.from(data.data));
        fileStream.end();

        // Send acknowledgement back to client
        socket.emit('ack', {offset: data.chunkOffset});
    });
});

http.listen(2000, () => {
    console.log('Server is listening on port 2000');
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

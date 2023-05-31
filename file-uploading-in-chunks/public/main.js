const uploadForm = document.getElementById('uploadForm');
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const fileInput = document.getElementById("fileInput");
const loader = document.querySelector("#loader-overlay");
let socket, socketIo;
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    const file = fileInput.files[0];
    if (fileInput.files.length <= 0) return;

    loader.classList.toggle('hide');
    let start = 0, offset = 0;
    const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB chunk size
    const fileExtension = file.name.split('.').pop();
    const postType = document.querySelector('[name="type"]:checked').getAttribute('data-value');
    const chunks = breakFileIntoChunks(start, file, offset, CHUNK_SIZE);
    // console.log(chunks);
    // console.log('File Size: ', bytesToSize(file.size))
    console.log('Total chunk: ', chunks.length)
    for (let i = 0; i < chunks.length; i++) {
        if (postType === 'fetch') {
            await sendPostRequest(file, chunks, i, fileExtension)
            offset = progressToggle(offset, CHUNK_SIZE, file);
            if (chunks.length === (i + 1)) loader.classList.toggle('hide');
        } else {
            await sendChunkUsingSocket(file, chunks[i], i, fileExtension, chunks.length);
        }

    }

    console.log('File upload complete');

});

/**
 * @param file
 * @param chunk
 * @param i
 * @param fileExtension
 * @param chunksLength
 * @returns {Promise<boolean>}
 */
function sendChunkUsingSocket(file, chunk, i, fileExtension, chunksLength) {
    return new Promise((resolve, reject) => {
        const fileName = file.name.replaceAll(' ', '')
        const payload = `{"fileName":"${fileName}","chunkIndex":${i + 1},"fileExtension":"${fileExtension}","totalChunks":${chunksLength}}`;
        const reader = new FileReader();
        reader.onloadend = (e) => {
            const blob = e.target.result.split(',');
            const content = payload + '---chunk---' + blob[1];
            socket.send(content);
            resolve(true);
        };
        reader.readAsDataURL(chunk);
    });
}

//web socket server, running from PHP
//initWebSocket();

//web socket server, running from Node
initSocketIo();

/**
 * @param file
 * @param chunks
 * @param i
 * @param fileExtension
 * @returns {Promise<void>}
 */
async function sendPostRequest(file, chunks, i, fileExtension) {
    const formData = new FormData();
    formData.append('chunk', chunks[i], `${file.name}.${i}`);
    try {
        const url = '/upload'; //when using Node backend
        // const url = '/upload.php'; //when using PHP backend
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'file-name': file.name,
                'chunk-index': i + 1,
                'file-extension': fileExtension,
                'total-chunks': chunks.length
            },
        });
        if (response.ok) {
            const body = await response.json();
            console.log(body);
            return body;
        } else {
            console.error('Request failed');
        }
    } catch (error) {
        console.log('progress: ' + progressBar.value)
    }
}

/**
 * @param start
 * @param file
 * @param offset
 * @param CHUNK_SIZE
 * @returns {*[]}
 */
function breakFileIntoChunks(start, file, offset, CHUNK_SIZE) {
    const chunks = [];
    while (start < file.size) {
        const chunk = file.slice(start, start + CHUNK_SIZE);
        chunks.push(chunk);
        start += CHUNK_SIZE;
        offset = progressToggle(offset, CHUNK_SIZE, file, 'Preparing...');
    }
    return chunks;
}

/**
 * Initialize web sockets using php
 */
function initWebSocket() {
    const web_socket_uri = 'ws://localhost:3700';
    const conn = new WebSocket(web_socket_uri);
    conn.onerror = (event) => {
        console.error('WebSocket error:', event);
    };

    conn.onclose = (event) => {
        console.log('WebSocket onClose with code:', event.code);
    };

    conn.onopen = (event) => {
        console.log('WebSocket onOpen with code:', event);
    };

    // Connection opened
    conn.addEventListener("open", (event) => {
        console.log("Open event listener: ", event.type)
        socket = conn;
    });

    // Listen for messages
    conn.addEventListener("message", (event) => {
        console.log('onMessage with data:', event.data);
    });
}

/**
 * Initialize web sockets using php
 */
function initSocketIo() {
    //const web_socket_uri = 'ws://localhost:200';
    socketIo = io();

    socketIo.on("connect", () => {
        console.log("Connected to server");
        socketIo.emit('status', {message: 'hello world!'})
    });
    socketIo.on('message', (data) => {
        console.log('message: ', data);
    });
    socketIo.on("disconnect", () => {
        console.log("Disconnected from server");
    });
}

/**
 * @param offset
 * @param CHUNK_SIZE
 * @param file
 * @param text
 * @returns {*}
 */
function progressToggle(offset, CHUNK_SIZE, file, text = 'Uploading') {
    offset += CHUNK_SIZE;
    progressBar.value = Math.round((offset / file.size) * 100);
    progressText.innerText = text + ': ' + progressBar.value + '%';
    loader.classList.remove('hide');
    return offset;
}

/**
 * @param bytes
 * @returns {*}
 */
function bytesToSize(bytes) {
    const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'];
    const navigatorLocal = navigator.languages && navigator.languages.length >= 0 ? navigator.languages[0] : 'en-US'
    const unitIndex = Math.max(0, Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1));

    return Intl.NumberFormat(navigatorLocal, {
        style: 'unit', unit: units[unitIndex]
    }).format(bytes / (1024 ** unitIndex))
}
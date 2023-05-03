const uploadForm = document.getElementById('uploadForm');
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const fileInput = document.getElementById("fileInput");
const loader = document.querySelector("#loader-overlay");
const web_socket_uri = 'ws://localhost:3700';
let socket;
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    const file = fileInput.files[0];
    if (fileInput.files.length <= 0) return;

    loader.classList.toggle('hide');
    let start = 0, offset = 0;
    const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB chunk size
    const fileExtension = file.name.split('.').pop();
    const postType = document.querySelector('[name="type"]:checked').getAttribute('data-value');
    console.log(postType);
    const chunks = breakFileIntoChunks(start, file, offset, CHUNK_SIZE, fileExtension, postType);

    console.log('File Size: ', bytesToSize(file.size))
    console.log('Total chunk: ', chunks.length)

    if (postType === 'fetch') {
        for (let i = 0; i < chunks.length; i++) {
            await sendPostRequest(file, chunks, i, fileExtension)
            offset = progressToggle(offset, CHUNK_SIZE, file);
            if (chunks.length === (i + 1)) loader.classList.toggle('hide');
        }
    }


    console.log('File upload complete');

});

//web socket server, running from PHP
initWebSocket();

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
        //const url = '/upload'; //when using Node backend
        const url = '/upload.php'; //when using PHP backend
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
 * @param fileExtension
 * @param postType
 * @returns {*[]}
 */
function breakFileIntoChunks(start, file, offset, CHUNK_SIZE, fileExtension, postType) {
    const chunks = [];
    let chunkIndex = 0;

    while (start < file.size) {
        const chunk = file.slice(start, start + CHUNK_SIZE);
        chunks.push(chunk);
        start += CHUNK_SIZE;
        offset = progressToggle(offset, CHUNK_SIZE, file, 'Preparing...');

        if (postType === 'socket') {
            const reader = new FileReader();
            reader.readAsArrayBuffer(chunk);
            reader.onload = () => {
                socket.send(JSON.stringify({
                    file: {
                        'file-name': file.name,
                        'chunk-index': chunkIndex + 1,
                        'file-extension': fileExtension,
                        'total-chunks': chunks.length,
                        data: Array.from(new Uint8Array(reader.result))
                    }
                }));
                chunkIndex++;
            }
        }
    }
    return chunks;
}

/**
 * Initialize web sockets using php
 */
function initWebSocket() {

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

//const conn = io();
//while (offset < file.size) {
//const chunk = file.slice(offset, offset + CHUNK_SIZE);
//const chunkReader = new FileReader();

//chunkReader.readAsArrayBuffer(chunk);
/*chunkReader.onload = () => {
    const arrayBuffer = chunkReader.result;
    socket.emit('chunk', {
        data: arrayBuffer,
        fileName: file.name,
        fileType: file.type,
        chunkSize: CHUNK_SIZE,
        chunkOffset: offset,
        fileSize: file.size
    });
    offset += CHUNK_SIZE;

    // Update progress bar
    const percentComplete = Math.round((offset / file.size) * 100);
    progressBar.value = percentComplete;
};*/
//}


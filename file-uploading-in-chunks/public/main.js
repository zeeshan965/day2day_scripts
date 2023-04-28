const uploadForm = document.getElementById('uploadForm');
const progressBar = document.getElementById("progressBar")
const progressText = document.getElementById("progressText")
const fileInput = document.getElementById("fileInput")
const loader = document.querySelector("#loader-overlay")
const socket = io();

/**
 * @param offset
 * @param CHUNK_SIZE
 * @param file
 * @returns {*}
 */
function progressToggle(offset, CHUNK_SIZE, file, text = 'Uploading') {
    offset += CHUNK_SIZE;
    progressBar.value = Math.round((offset / file.size) * 100);
    progressText.innerText = text + ': ' + progressBar.value + '%';
    loader.classList.remove('hide');
    return offset;
}

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    const file = fileInput.files[0];
    if (fileInput.files.length <= 0) return;
    console.log(bytesToSize(file.size))
    loader.classList.toggle('hide');

    const CHUNK_SIZE = 1024 * 1024; // 10MB chunk size
    const chunks = [];
    let start = 0, offset = 0;

    while (start < file.size) {
        chunks.push(file.slice(start, start + CHUNK_SIZE));
        start += CHUNK_SIZE;
        offset = progressToggle(offset, CHUNK_SIZE, file, 'Preparing...');
    }
    offset = 0;
    console.log(chunks.length)
    const fileExtension = file.name.split('.').pop();
    for (let i = 0; i < chunks.length; i++) {
        const formData = new FormData();
        //console.log(`${file.name}.${i}`)
        formData.append('chunk', chunks[i], `${file.name}.${i}`);
        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'file-name': file.name,
                    'chunk-index': i,
                    'file-extension': fileExtension,
                    'total-chunks': chunks.length
                },
            });
            if (response.ok) {
                const body = await response.json();
                console.log(body);
                offset = progressToggle(offset, CHUNK_SIZE, file);
                if (chunks.length === (i + 1)) loader.classList.toggle('hide');
            } else {
                console.error('Request failed');
            }
        } catch (error) {
            console.log('progress: ' + progressBar.value)
        }
    }

    console.log('File upload complete');

});

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


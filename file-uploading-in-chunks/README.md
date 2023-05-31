## File Upload in Chunk
Following code base is to demonstrate how to upload file in chunks to a backend server and save it in chunks.

Select the file to upload, front end will break down the file in 5 mb chunks and upload to backend server.
During upload, it will show the progress of how much overall file is uploaded. 

if there is only one chunk it will save it as end file with the file extension. Otherwise, it will save the files with **chunk_*.ext** and when all the chunks are uploaded combine them to form one file and remove all the chunks.  

> **Note:** The script has backend implementations in Node Js and PHP

## File Structure
    ├── day2day_scripts
    |   ├── file-uploading-in-chunks
    |   |   ├── .gitignore
    |   |   └── composer.json
    |   |   └── composer.lock
    |   |   └── index.js
    |   |   └── package.json
    |   |   └── package-lock.json
    |   |   └── README.md
    |   |   ├── public
    |   |   |   ├── index.html
    |   |   |   └── main.js
    |   |   |   └── style.css
    |   |   |   └── upload.php
    |   |   |   └── UploadHandler.php
    |   |   |   └── web_socket.php
    |   |   ├── uploads
    |   |   |   └── /*
    |   |   ├── node_modules
    |   |   |   └── /*
    |   |   ├── vendor
    |   |   |   └── /*

## Front End:
To run the front end part of the application you need to run backend server in either PHP or Node.
 
> **Node:** For Node public directory is already configured you just need to serve the project
> 
> `nodemon index.js`

> **PHP:** Inside terminal goto public directory and run this command
>
> `php -S 127.0.0.1:8006`

## Back End:
For BackEnd I used Node and PHP, You can use any one of them.

### PHP:

**Node:** I used 5 mb size per chunk, so you might need to update your php configs.

Run composer install inside **file-uploading-in-chunks** directory.

```bash
//path to php.ini
/etc/php/8.1/cli

upload_max_filesize = 20M
post_max_size = 20M

//start the php server from public directory
php -S 127.0.0.1:8000

//comment out these two items for php
<script src="/socket.io/socket.io.js"></script>
initSocketIo();
```

#### Using Sockets

### Node:
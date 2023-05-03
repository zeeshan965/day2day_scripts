<?php

require dirname(__DIR__) . '/vendor/autoload.php';

use Ratchet\Http\HttpServer;
use Ratchet\Server\IoServer;
use Ratchet\WebSocket\WsServer;

spl_autoload_register(function ($className) {
    $path = __DIR__ . '/';
    $extension = '.php';
    $fullPath = $path . $className . $extension;
    include_once($fullPath);
});

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new UploadHandler()
        )
    ), 3700
);

$server->run();


//$app = new Ratchet\App('localhost', 8080);
//$app->route('/chat', new MyChat, array('*'));
//$app->route('/echo', new Ratchet\Server\EchoServer, array('*'));
//$app->run();

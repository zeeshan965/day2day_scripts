<?php

require dirname(__DIR__) . '/vendor/autoload.php';

use Ratchet\ConnectionInterface;
use Ratchet\MessageComponentInterface;

class UploadHandler implements MessageComponentInterface
{
    /** @var array $clients */
    protected $clients = [];

    /**
     * @param ConnectionInterface $conn
     * @return void
     */
    public function onOpen(ConnectionInterface $conn)
    {
        // Store the new connection in the list of clients
        $this->clients[$conn->resourceId] = $conn;
        dump("New connection! ({$conn->resourceId})");
    }

    /**
     * @param ConnectionInterface $from
     * @param $msg
     * @return void
     */
    public function onMessage(ConnectionInterface $from, $msg)
    {
        // The client will send the file in chunks, so we need to keep track of the chunks
        $data = json_decode($msg, true);
        $file = $data['file'];

        $fileName = $file['file-name'];
        $chunkIndex = $file['chunk-index'];
        $fileExtension = $file['file-extension'];
        $totalChunks = $file['total-chunks'];
        $fileName = str_replace(' ', '', $fileName);
        $file_tmp = $file['data'];
        dump($fileName, $chunkIndex, $totalChunks, $fileExtension);



        //$from->send(json_encode(['message' => $data['message']]));

        if (isset($data['name']) && isset($data['chunk']) && isset($data['totalChunks']) && isset($data['index'])) {
            // Save the chunk to a file on the server
            $fileName = $data['name'] . '_' . $data['index'];

            file_put_contents($fileName, base64_decode($data['chunk']));

            // If we've received all the chunks, combine them into a single file
            if (($data['index'] + 1) == $data['totalChunks']) {
                $finalFileName = $data['name'];

                for ($i = 0; $i < $data['totalChunks']; $i++) {
                    $chunkFileName = $data['name'] . '_' . $i;
                    $chunkData = file_get_contents($chunkFileName);
                    file_put_contents($finalFileName, $chunkData, FILE_APPEND);
                    unlink($chunkFileName);
                }

                // Notify the client that the file has been saved
                $from->send(json_encode(['status' => 'success']));
            }
        }
    }

    /**
     * @param ConnectionInterface $conn
     * @return void
     */
    public function onClose(ConnectionInterface $conn)
    {
        // Remove the connection from the list of clients
        unset($this->clients[$conn->resourceId]);

        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    /**
     * @param ConnectionInterface $conn
     * @param Exception $e
     * @return void
     */
    public function onError(ConnectionInterface $conn, Exception $e)
    {
        // Log any errors
        echo "An error has occurred: {$e->getMessage()}\n";

        $conn->close();
    }

}
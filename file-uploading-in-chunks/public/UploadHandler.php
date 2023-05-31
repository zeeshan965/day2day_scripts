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
        if (isset($msg)) {
            $data = explode("---chunk---", $msg);
            $fileData = json_decode($data[0] ?? '', true);
            $fileName = $fileData['fileName'];
            $chunkIndex = $fileData['chunkIndex'];
            $fileExtension = $fileData['fileExtension'];
            $totalChunks = $fileData['totalChunks'];
            $fileName = str_replace(' ', '', $fileName);
            $dir = dirname(__DIR__) . '/uploads/' . $fileName . '/';
            if (!file_exists($dir)) mkdir($dir, 0777, true);

            $content = base64_decode($data[1]);
            $target_file = $dir . basename('chunk_' . $chunkIndex . '.ext');
            if ($totalChunks === "1") $target_file = $dir . basename(uniqid() . '_' . $fileName);
            $finalFile = fopen($target_file, 'w');
            fwrite($finalFile, $content);
            fclose($finalFile);

            if ($totalChunks > 1 && $totalChunks === $chunkIndex) {
                $this->combineChunks($dir, $fileExtension, $fileName);
            }

        }


        //$from->send(json_encode(["status" => "Error uploading file"]));
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

    /**
     * @param $dir
     * @param $fileExtension
     * @param $fileName
     * @return void
     */
    public function combineChunks($dir, $fileExtension, $fileName): void
    {
        $finalFilePath = $dir . uniqid() . '_' . '_combined.' . $fileExtension;
        $chunkFilePrefix = 'chunk_';
        $chunkFileExt = '.ext';
        $chunkFiles = glob($dir . $chunkFilePrefix . '*' . $chunkFileExt);
        natsort($chunkFiles);
        $finalFile = fopen($finalFilePath, 'w');
        foreach ($chunkFiles as $chunkFile) {
            $chunkContent = file_get_contents($chunkFile);
            fwrite($finalFile, $chunkContent);
            unlink($chunkFile);
        }
        fclose($finalFile);
    }
}
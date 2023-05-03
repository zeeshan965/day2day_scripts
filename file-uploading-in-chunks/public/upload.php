<?php

require dirname(__DIR__) . '/vendor/autoload.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (!isset($_FILES["chunk"])) exit(send_response());

$file = $_FILES['chunk'];
$file_tmp = $file["tmp_name"];
$fileName = $_SERVER['HTTP_FILE_NAME'];
$chunkIndex = $_SERVER['HTTP_CHUNK_INDEX'];
$fileExtension = $_SERVER['HTTP_FILE_EXTENSION'];
$totalChunks = $_SERVER['HTTP_TOTAL_CHUNKS'];
$fileName = str_replace(' ', '', $fileName);

// Define the directory to save the file
// Create the directory if it doesn't exist
$dir = dirname(__DIR__) . '/uploads/' . $fileName . '/';
if (!file_exists($dir)) mkdir($dir, 0777, true);

$target_file = $dir . basename('chunk_' . $chunkIndex . '.ext');
if ($totalChunks === "1") $target_file = $dir . basename(uniqid() . '_' . $fileName . '.' . $fileExtension);
$status = move_uploaded_file($file_tmp, $target_file);

if ($totalChunks > 1 && $totalChunks === $chunkIndex) {
    combineChunks($dir, $fileExtension, $fileName);
}

exit($status ? json_encode(["status" => "File uploaded successfully"]) :
    json_encode(["status" => "Error uploading file"])
);

/**
 * @return string
 */
function send_response()
{
    http_response_code(500);
    $error = array("status" => "error", "message" => "something went wrong!");
    $json_error = json_encode($error);
    header('Content-Type: application/json');
    echo $json_error;
    return '';
}

/**
 * @param $dir
 * @param $fileExtension
 * @param $fileName
 * @return void
 */
function combineChunks($dir, $fileExtension, $fileName)
{
    $finalFilePath = $dir . uniqid() . '_' . $fileName . '_combined.' . $fileExtension;
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
    exit(json_encode(['status' => 'success']));
}
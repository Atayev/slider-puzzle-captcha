<?php
if (!isset($_GET['url'])) {
    http_response_code(400);
    echo 'URL is required';
    exit;
}

$url = $_GET['url'];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
$response = curl_exec($ch);

$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$header = substr($response, 0, $header_size);
$body = substr($response, $header_size);

curl_close($ch);

foreach (explode("\r\n", $header) as $header_line) {
    if (stripos($header_line, 'Content-Type:') === 0) {
        header($header_line);
        break;
    }
}

echo $body;
?>
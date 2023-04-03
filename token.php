<?php

function exception_error_handler($errno, $errstr, $errfile, $errline ) {
  throw new ErrorException($errstr, $errno, 0, $errfile, $errline);
}
set_error_handler("exception_error_handler");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: ' . $_SERVER['SERVER_NAME']);

$config = json_decode(file_get_contents('config.json'), true);
// Replace with your own subscription key and service region (e.g., "westus").
$azure_key = $config['azure_key'];
$azure_region = $config['azure_region'];
$openai_key = $config['openai_key'];
$ga_client_id = $config['ga_client_id'];
$firebase_config = $config['firebase_config'];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://' . $azure_region . '.api.cognitive.microsoft.com/sts/v1.0/issueToken');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, '{}');
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json', 'Ocp-Apim-Subscription-Key: ' . $azure_key)); 
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$azure_token = curl_exec($ch);

header('Content-Type: application/json');
print(json_encode([
  'azure_token' => $azure_token,
  'azure_region' => $azure_region,
  'openai_key' => $openai_key,
  'ga_client_id' => $ga_client_id,
  'firebase_config' => $firebase_config,
]));
?>

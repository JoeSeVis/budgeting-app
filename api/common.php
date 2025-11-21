<?php
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../utils/storage.php';

function json_response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function get_input() {
    return json_decode(file_get_contents('php://input'), true);
}

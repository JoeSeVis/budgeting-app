<?php
require_once 'common.php';

if (!isset($_SESSION['user_id'])) {
    json_response(['error' => 'Unauthorized'], 401);
}

$userId = $_SESSION['user_id'];
$settingsFile = $userId . '_settings.json';
$settings = get_json_data($settingsFile);

// Default settings
if (empty($settings)) {
    $settings = [
        'currency' => 'ZAR',
        'theme' => 'light'
    ];
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    if ($action === 'get_settings') {
        json_response($settings);
    }
}

if ($method === 'POST') {
    $input = get_input();
    
    if ($action === 'update_currency') {
        $settings['currency'] = $input['currency'];
        save_json_data($settingsFile, $settings);
        json_response(['success' => true]);
    }
    
    if ($action === 'update_settings') {
        $settings = array_merge($settings, $input);
        save_json_data($settingsFile, $settings);
        json_response(['success' => true]);
    }
}

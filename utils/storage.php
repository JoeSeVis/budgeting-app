<?php

define('DATA_DIR', __DIR__ . '/../data');

function get_json_data($filename) {
    $path = DATA_DIR . '/' . $filename;
    if (!file_exists($path)) {
        return [];
    }
    $content = file_get_contents($path);
    return json_decode($content, true) ?: [];
}

function save_json_data($filename, $data) {
    $path = DATA_DIR . '/' . $filename;
    // Use exclusive lock to prevent race conditions
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
}

function get_users() {
    $data = get_json_data('users.json');
    return $data['users'] ?? [];
}

function save_users($users) {
    save_json_data('users.json', ['users' => $users]);
}

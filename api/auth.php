<?php
require_once 'common.php';

$action = $_GET['action'] ?? '';

if ($action === 'check_session') {
    if (isset($_SESSION['user_id'])) {
        json_response(['user' => $_SESSION['username']]);
    } else {
        json_response(['user' => null]);
    }
}

function verify_google_token($token) {
    // Basic verification using Google's tokeninfo endpoint
    // In production, use a library like google-auth-library-php
    $url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . $token;
    
    // Use cURL instead of file_get_contents for better server compatibility
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($response === false) {
        return ['error' => 'Network error: ' . $curlError];
    }
    
    if ($httpCode !== 200) {
        return ['error' => 'HTTP error: ' . $httpCode];
    }
    
    $data = json_decode($response, true);
    
    if (isset($data['error'])) {
        return ['error' => 'Google API error: ' . ($data['error_description'] ?? $data['error'])];
    }
    
    // Check if audience matches your client ID (optional but recommended)
    // if ($data['aud'] !== 'YOUR_GOOGLE_CLIENT_ID') return null;
    
    return $data; // Returns payload with 'sub' (Google ID), 'email', etc.
}

if ($action === 'login') {
    $input = get_input();
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    if (!$username || !$password) {
        json_response(['error' => 'Username and password required'], 400);
    }

    $users = get_users();
    foreach ($users as $user) {
        if ($user['username'] === $username) {
            if (password_verify($password, $user['password_hash'] ?? '')) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                json_response(['success' => true]);
            } else {
                json_response(['error' => 'Invalid credentials'], 401);
            }
        }
    }

    json_response(['error' => 'Invalid credentials'], 401);
}

if ($action === 'register') {
    $input = get_input();
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    $security_question = $input['security_question'] ?? '';
    $security_answer = $input['security_answer'] ?? '';

    if (!$username || !$password || !$security_question || !$security_answer) {
        json_response(['error' => 'All fields are required'], 400);
    }

    $users = get_users();
    foreach ($users as $user) {
        if ($user['username'] === $username) {
            json_response(['error' => 'Username already exists'], 400);
        }
    }

    $newUser = [
        'id' => uniqid(),
        'username' => $username,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'security_question' => $security_question,
        'security_answer' => password_hash($security_answer, PASSWORD_DEFAULT), // Hash answer for security
        'created_at' => date('Y-m-d H:i:s')
    ];

    $users[] = $newUser;
    save_users($users);

    // Initialize user data
    save_json_data($newUser['id'] . '_data.json', [
        'income_categories' => ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other'],
        'expense_categories' => ['Food', 'Rent', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping'],
        'tags' => [],
        'transactions' => [],
        'recurring_transactions' => []
    ]);

    $_SESSION['user_id'] = $newUser['id'];
    $_SESSION['username'] = $newUser['username'];

    json_response(['success' => true]);
}

if ($action === 'get_security_question') {
    $username = $_GET['username'] ?? '';
    $users = get_users();
    
    foreach ($users as $user) {
        if ($user['username'] === $username) {
            if (isset($user['security_question'])) {
                json_response(['question' => $user['security_question']]);
            } else {
                json_response(['error' => 'No security question set for this user'], 400);
            }
        }
    }
    
    json_response(['error' => 'User not found'], 404);
}

if ($action === 'reset_password') {
    $input = get_input();
    $username = $input['username'] ?? '';
    $security_answer = $input['security_answer'] ?? '';
    $new_password = $input['new_password'] ?? '';
    
    if (!$username || !$security_answer || !$new_password) {
        json_response(['error' => 'All fields required'], 400);
    }
    
    $users = get_users();
    $userFound = false;
    
    foreach ($users as &$user) {
        if ($user['username'] === $username) {
            $userFound = true;
            if (password_verify($security_answer, $user['security_answer'] ?? '')) {
                $user['password_hash'] = password_hash($new_password, PASSWORD_DEFAULT);
                save_users($users);
                json_response(['success' => true]);
            } else {
                json_response(['error' => 'Incorrect security answer'], 401);
            }
        }
    }
    
    if (!$userFound) {
        json_response(['error' => 'User not found'], 404);
    }
}

if ($action === 'google_auth') {
    $input = get_input();
    $token = $input['token'] ?? '';
    
    $payload = verify_google_token($token);
    
    if (isset($payload['error'])) {
        json_response(['error' => $payload['error']], 401);
    }
    
    if (!$payload) {
        json_response(['error' => 'Invalid token'], 401);
    }
    
    $googleId = $payload['sub'];
    $users = get_users();
    
    foreach ($users as $user) {
        if (isset($user['google_id']) && $user['google_id'] === $googleId) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            json_response(['success' => true]);
        }
    }
    
    json_response(['status' => 'new_user']);
}

if ($action === 'google_register') {
    $input = get_input();
    $token = $input['token'] ?? '';
    $username = $input['username'] ?? '';
    
    if (!$username) {
        json_response(['error' => 'Username required'], 400);
    }
    
    $payload = verify_google_token($token);
    
    if (!$payload) {
        json_response(['error' => 'Invalid token'], 401);
    }
    
    $googleId = $payload['sub'];
    $users = get_users();
    
    // Check if username taken
    foreach ($users as $user) {
        if ($user['username'] === $username) {
            json_response(['error' => 'Username already exists'], 400);
        }
    }
    
    $newUser = [
        'id' => uniqid(),
        'username' => $username,
        'google_id' => $googleId,
        'email' => $payload['email'] ?? '',
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    $users[] = $newUser;
    save_users($users);
    
    // Initialize user data
    save_json_data($newUser['id'] . '_data.json', [
        'income_categories' => ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other'],
        'expense_categories' => ['Food', 'Rent', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping'],
        'tags' => [],
        'transactions' => [],
        'recurring_transactions' => []
    ]);
    
    $_SESSION['user_id'] = $newUser['id'];
    $_SESSION['username'] = $newUser['username'];
    
    json_response(['success' => true]);
}

if ($action === 'logout') {
    session_destroy();
    json_response(['success' => true]);
}

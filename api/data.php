<?php
require_once 'common.php';

if (!isset($_SESSION['user_id'])) {
    json_response(['error' => 'Unauthorized'], 401);
}

$userId = $_SESSION['user_id'];
$dataFile = $userId . '_data.json';
$data = get_json_data($dataFile);

// Migration: If old categories exist but new ones don't, migrate
if (isset($data['categories']) && !isset($data['expense_categories'])) {
    $data['expense_categories'] = $data['categories'];
    $data['income_categories'] = ['Salary', 'Freelance', 'Other'];
    unset($data['categories']);
    save_json_data($dataFile, $data);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    if ($action === 'get_all') {
        // Process recurring transactions
        $changed = false;
        if (!isset($data['recurring_transactions'])) {
            $data['recurring_transactions'] = [];
        }

        $today = new DateTime();
        $today->setTime(0, 0, 0);

        foreach ($data['recurring_transactions'] as &$rt) {
            $nextDue = new DateTime($rt['next_due_date']);
            $nextDue->setTime(0, 0, 0);

            while ($nextDue <= $today) {
                // Create transaction
                $transaction = [
                    'id' => uniqid(),
                    'date' => $nextDue->format('Y-m-d'),
                    'type' => $rt['type'],
                    'amount' => (float)$rt['amount'],
                    'category' => $rt['category'],
                    'tags' => $rt['tags'] ?? [],
                    'description' => $rt['description'] . ' (Recurring)',
                    'currency' => $rt['currency'] ?? 'ZAR'
                ];
                $data['transactions'][] = $transaction;

                // Calculate next due date based on frequency type
                $frequency = $rt['frequency'];
                
                if ($frequency === 'daily') {
                    $nextDue->add(new DateInterval('P1D'));
                } elseif ($frequency === 'weekly' || $frequency === 'biweekly') {
                    // Handle days_of_week array
                    $daysOfWeek = $rt['days_of_week'] ?? [1]; // Default to Monday
                    $interval = $frequency === 'biweekly' ? 'P2W' : 'P1W';
                    $nextDue->add(new DateInterval($interval));
                    
                    // Find next occurrence of selected days
                    $currentDay = (int)$nextDue->format('w');
                    $found = false;
                    for ($i = 0; $i < 7; $i++) {
                        if (in_array($currentDay, $daysOfWeek)) {
                            $found = true;
                            break;
                        }
                        $nextDue->add(new DateInterval('P1D'));
                        $currentDay = (int)$nextDue->format('w');
                    }
                } elseif ($frequency === 'monthly') {
                    // Specific day of each month
                    $dayOfMonth = $rt['day_of_month'] ?? 1;
                    if ($dayOfMonth === 0) {
                        // Last day of month
                        $nextDue->modify('last day of next month');
                    } else {
                        $nextDue->modify('first day of next month');
                        $nextDue->setDate(
                            $nextDue->format('Y'),
                            $nextDue->format('m'),
                            min($dayOfMonth, $nextDue->format('t')) // Handle months with fewer days
                        );
                    }
                } else {
                    // Default to monthly
                    $nextDue->add(new DateInterval('P1M'));
                }
                
                $rt['next_due_date'] = $nextDue->format('Y-m-d');
                $rt['last_run_date'] = $transaction['date'];
                $changed = true;
            }
        }

        if ($changed) {
            save_json_data($dataFile, $data);
        }

        json_response($data);
    }
}

if ($method === 'POST') {
    $input = get_input();

    if ($action === 'add_transaction') {
        $transaction = [
            'id' => uniqid(),
            'date' => $input['date'],
            'type' => $input['type'], // 'income' or 'expense'
            'amount' => (float)$input['amount'],
            'category' => $input['category'],
            'tags' => $input['tags'] ?? [],
            'description' => $input['description'] ?? '',
            'currency' => $input['currency'] ?? 'ZAR'
        ];
        $data['transactions'][] = $transaction;
        save_json_data($dataFile, $data);
        json_response($transaction);
    }

    if ($action === 'update_transaction') {
        $id = $input['id'];
        foreach ($data['transactions'] as &$t) {
            if ($t['id'] === $id) {
                $t['date'] = $input['date'];
                $t['type'] = $input['type'];
                $t['amount'] = (float)$input['amount'];
                $t['category'] = $input['category'];
                $t['tags'] = $input['tags'] ?? [];
                $t['description'] = $input['description'] ?? '';
                break;
            }
        }
        save_json_data($dataFile, $data);
        json_response(['success' => true]);
    }

    if ($action === 'delete_transaction') {
        $id = $input['id'];
        $data['transactions'] = array_values(array_filter($data['transactions'], function($t) use ($id) {
            return $t['id'] !== $id;
        }));
        save_json_data($dataFile, $data);
        json_response(['success' => true]);
    }

    if ($action === 'add_category') {
        $category = $input['category'];
        $type = $input['type'] ?? 'expense'; // Default to expense
        
        $key = ($type === 'income') ? 'income_categories' : 'expense_categories';
        
        if (!in_array($category, $data[$key])) {
            $data[$key][] = $category;
            save_json_data($dataFile, $data);
        }
        json_response(['success' => true]);
    }

    if ($action === 'delete_category') {
        $category = $input['category'];
        $type = $input['type'] ?? 'expense';

        $key = ($type === 'income') ? 'income_categories' : 'expense_categories';

        $data[$key] = array_values(array_filter($data[$key], function($c) use ($category) {
            return $c !== $category;
        }));
        save_json_data($dataFile, $data);
        json_response(['success' => true]);
    }

    if ($action === 'add_recurring_transaction') {
        $rt = [
            'id' => uniqid(),
            'type' => $input['type'],
            'amount' => (float)$input['amount'],
            'category' => $input['category'],
            'description' => $input['description'] ?? '',
            'frequency' => $input['frequency'], // daily, weekly, monthly, yearly, day_of_month, day_of_week, biweekly
            'next_due_date' => $input['date'], // Start date
            'tags' => $input['tags'] ?? [],
            'currency' => $input['currency'] ?? 'ZAR'
        ];
        
        // Add custom schedule fields if provided
        if (isset($input['day_of_month'])) {
            $rt['day_of_month'] = (int)$input['day_of_month'];
        }
        if (isset($input['day_of_week'])) {
            $rt['day_of_week'] = (int)$input['day_of_week'];
        }
        
        if (!isset($data['recurring_transactions'])) {
            $data['recurring_transactions'] = [];
        }
        $data['recurring_transactions'][] = $rt;
        save_json_data($dataFile, $data);
        json_response($rt);
    }
}

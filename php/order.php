<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require 'db.php';
// …далі твій код…



$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Невірні дані']);
    exit;
}

try {
    $pdo = getPDO();

    $stmt = $pdo->prepare('INSERT INTO orders (fullname, phone, email, city, warehouse, product_id) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $data['fullname'],
        $data['phone'],
        $data['email'],
        $data['city'],
        $data['warehouse'],
        $data['product_id']
    ]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>

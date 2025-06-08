<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require 'db.php';

// Дозволяємо лише POST-запити
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  header('Content-Type: application/json');
  echo json_encode(['error' => 'Method Not Allowed']);
  exit;
}

header('Content-Type: application/json');

// Зчитування JSON-даних
$data = json_decode(file_get_contents('php://input'), true);

// Перевірка обов’язкових полів
if (
  !$data ||
  empty(trim($data['name'])) ||
  empty(trim($data['text'])) ||
  !isset($data['rating']) ||
  !is_numeric($data['rating']) ||
  $data['rating'] < 1 ||
  $data['rating'] > 5
) {
  http_response_code(400);
  echo json_encode(['error' => 'Невірні дані']);
  exit;
}

try {
  $pdo = getPDO();

  $stmt = $pdo->prepare('INSERT INTO comments (name, text, rating, created_at) VALUES (?, ?, ?, NOW())');
  $stmt->execute([
    htmlspecialchars(trim($data['name'])),
    htmlspecialchars(trim($data['text'])),
    intval($data['rating'])
  ]);

  echo json_encode(['success' => true]);
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Помилка бази даних: ' . $e->getMessage()]);
}
?>

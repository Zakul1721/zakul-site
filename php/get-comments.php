
<?php
require 'db.php';

header('Content-Type: application/json; charset=utf-8');

try {
  $pdo = getPDO();

  $stmt = $pdo->query('SELECT * FROM comments ORDER BY created_at DESC');
  $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // Екранування імені та тексту
  foreach ($comments as &$comment) {
    $comment['name'] = htmlspecialchars($comment['name']);
    $comment['text'] = nl2br(htmlspecialchars($comment['text']));
    $comment['rating'] = intval($comment['rating']);
    $comment['created_at'] = date('Y-m-d H:i', strtotime($comment['created_at']));
  }

  echo json_encode($comments);
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
?>

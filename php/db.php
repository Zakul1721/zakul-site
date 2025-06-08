<?php
function getPDO()
{
  $host = 'localhost';
  $db = 'zakul_shop';         // Назва твоєї бази даних
  $user = 'zakul_user';         // Новий користувач, якого створив
  $pass = 'secure_password';   // Його пароль
  $charset = 'utf8mb4';

  $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
  $options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, // показувати помилки
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // повертає масив
    PDO::ATTR_EMULATE_PREPARES => false,
  ];

  try {
    return new PDO($dsn, $user, $pass, $options);
  } catch (PDOException $e) {
    throw new PDOException($e->getMessage(), (int) $e->getCode());
  }
}
?>
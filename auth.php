<?php
// auth.php - Gère Inscription, Login, Logout et Session
session_start();
header("Content-Type: application/json");

// Connexion BDD
$conn = new mysqli("localhost", "root", "", "quran_app");

$data = json_decode(file_get_contents('php://input'), true);
$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. INSCRIPTION
if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = $conn->real_escape_string($data['username']);
    $pass = password_hash($data['password'], PASSWORD_DEFAULT); // On crypte le mot de passe

    // Vérifier si l'utilisateur existe déjà
    $check = $conn->query("SELECT id FROM users WHERE username='$user'");
    if ($check->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Ce nom est déjà pris"]);
    } else {
        $sql = "INSERT INTO users (username, password) VALUES ('$user', '$pass')";
        if ($conn->query($sql)) {
            echo json_encode(["success" => true, "message" => "Compte créé ! Connectez-vous."]);
        } else {
            echo json_encode(["success" => false, "message" => "Erreur technique"]);
        }
    }
}

// 2. CONNEXION
if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = $conn->real_escape_string($data['username']);
    $pass = $data['password'];

    $result = $conn->query("SELECT id, username, password FROM users WHERE username='$user'");
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        // Vérification du mot de passe crypté
        if (password_verify($pass, $row['password'])) {
            $_SESSION['user_id'] = $row['id'];
            $_SESSION['username'] = $row['username'];
            echo json_encode(["success" => true, "username" => $row['username']]);
        } else {
            echo json_encode(["success" => false, "message" => "Mot de passe incorrect"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Utilisateur inconnu"]);
    }
}

// 3. VÉRIFIER SI ON EST CONNECTÉ (Pour le chargement de la page)
if ($action === 'check') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode(["logged_in" => true, "username" => $_SESSION['username']]);
    } else {
        echo json_encode(["logged_in" => false]);
    }
}

// 4. DÉCONNEXION
if ($action === 'logout') {
    session_destroy();
    echo json_encode(["success" => true]);
}

$conn->close();
?>
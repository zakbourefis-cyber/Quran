<?php
session_start();
header("Content-Type: application/json");
$conn = new mysqli("mysql-zakzik74.alwaysdata.net", "zakzik74", "Agbdlcid74300?", "zakzik74_quran_app");

$data = json_decode(file_get_contents('php://input'), true);
$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. INSCRIPTION (Modifié pour accepter l'avatar)
if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = $conn->real_escape_string($data['username']);
    $pass = password_hash($data['password'], PASSWORD_DEFAULT);
    
    // On récupère l'avatar choisi, sinon on met une valeur par défaut
    $avatar = isset($data['avatar']) ? $conn->real_escape_string($data['avatar']) : 'default';

    $check = $conn->query("SELECT id FROM users WHERE username='$user'");
    if ($check->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Ce nom est déjà pris"]);
    } else {
        // On insère l'avatar dans la base
        $sql = "INSERT INTO users (username, password, avatar_url) VALUES ('$user', '$pass', '$avatar')";
        if ($conn->query($sql)) {
            echo json_encode(["success" => true, "message" => "Compte créé !"]);
        } else {
            echo json_encode(["success" => false, "message" => "Erreur technique"]);
        }
    }
}

// 2. CONNEXION (Renvoie maintenant l'avatar)
if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = $conn->real_escape_string($data['username']);
    $pass = $data['password'];

    $result = $conn->query("SELECT id, username, password, avatar_url FROM users WHERE username='$user'");
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        if (password_verify($pass, $row['password'])) {
            $_SESSION['user_id'] = $row['id'];
            $_SESSION['username'] = $row['username'];
            $_SESSION['avatar_url'] = $row['avatar_url']; // On garde l'avatar en session
            
            echo json_encode([
                "success" => true, 
                "username" => $row['username'],
                "avatar" => $row['avatar_url']
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Mot de passe incorrect"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Utilisateur inconnu"]);
    }
}

// 3. VÉRIFICATION SESSION (Renvoie l'avatar sauvegardé)
if ($action === 'check') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            "logged_in" => true, 
            "username" => $_SESSION['username'],
            "avatar" => isset($_SESSION['avatar_url']) ? $_SESSION['avatar_url'] : 'default'
        ]);
    } else {
        echo json_encode(["logged_in" => false]);
    }
}

// 4. LOGOUT
if ($action === 'logout') {
    session_destroy();
    echo json_encode(["success" => true]);
}

$conn->close();
?>
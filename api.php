<?php
// api.php - Ce fichier sert de pont entre JS et MySQL

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

// 1. Connexion à la Base de Données
$host = "localhost";
$user = "root"; // Par défaut sur XAMPP
$pass = "";     // Par défaut vide sur XAMPP
$db   = "quran_app";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(["error" => "Erreur de connexion : " . $conn->connect_error]));
}

// 2. Récupérer les données envoyées par le JS
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// --- SCÉNARIO 1 : On demande la liste des favoris (GET) ---
if ($method === 'GET') {
    $result = $conn->query("SELECT surah_id FROM favorites");
    $favorites = [];
    
    while($row = $result->fetch_assoc()) {
        $favorites[] = (int)$row['surah_id'];
    }
    
    echo json_encode($favorites);
}

// --- SCÉNARIO 2 : On ajoute/enlève un favori (POST) ---
if ($method === 'POST') {
    $surahId = $input['surah_id'];

    // Vérifier si le favori existe déjà
    $check = $conn->query("SELECT id FROM favorites WHERE surah_id = $surahId");

    if ($check->num_rows > 0) {
        // Il existe -> On le supprime
        $conn->query("DELETE FROM favorites WHERE surah_id = $surahId");
        echo json_encode(["status" => "removed", "id" => $surahId]);
    } else {
        // Il n'existe pas -> On l'ajoute
        $conn->query("INSERT INTO favorites (surah_id) VALUES ($surahId)");
        echo json_encode(["status" => "added", "id" => $surahId]);
    }
}

$conn->close();
?>
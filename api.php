<?php
session_start(); // Important : pour savoir qui est connecté
header("Content-Type: application/json");

// Si pas connecté, on arrête tout de suite
if (!isset($_SESSION['user_id'])) {
    echo json_encode([]); // Renvoie liste vide
    exit;
}

$userId = $_SESSION['user_id'];
$conn = new mysqli("mysql-zakzik74.alwaysdata.net", "zakzik74", "Agbdlcid74300?", "zakzik74_quran_app");
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// --- GET : Récupérer MES favoris ---
if ($method === 'GET') {
    // On filtre par user_id
    $result = $conn->query("SELECT surah_id FROM favorites WHERE user_id = $userId");
    $favorites = [];
    while($row = $result->fetch_assoc()) $favorites[] = (int)$row['surah_id'];
    echo json_encode($favorites);
}

// --- POST : Ajouter/Supprimer UN DE MES favoris ---
if ($method === 'POST') {
    $surahId = (int)$input['surah_id'];

    // Vérifier s'il existe déjà POUR CET UTILISATEUR
    $check = $conn->query("SELECT id FROM favorites WHERE surah_id = $surahId AND user_id = $userId");

    if ($check->num_rows > 0) {
        $conn->query("DELETE FROM favorites WHERE surah_id = $surahId AND user_id = $userId");
    } else {
        $conn->query("INSERT INTO favorites (surah_id, user_id) VALUES ($surahId, $userId)");
    }
}
$conn->close();
?>
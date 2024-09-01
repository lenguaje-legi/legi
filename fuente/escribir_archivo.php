<?php

$configuración = require('../configuración.php');

$archivo = $configuración['archivo'];

$parámetros = json_decode(file_get_contents('php://input'), true); 

file_put_contents($archivo, $parámetros['contenido']);

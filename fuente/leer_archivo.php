<?php

$configuración = require('../configuración.php');

$archivo = $configuración['archivo'];

$fichero = file_get_contents($archivo);

print($fichero);

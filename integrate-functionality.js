#!/usr/bin/env node

/**
 * Script para integrar las funcionalidades de tarot en las páginas HTML
 *
 * Uso: node integrate-functionality.js
 */

const fs = require('fs');
const path = require('path');

// Páginas que necesitan las funcionalidades
const pagesToIntegrate = [
    'index.html',
    'tarot-reading.html',
    'yes-or-no-tarot.html',
    'love-tarot.html',
    'draw-cards.html',
    'fortune/daily.html',
    'fortune/yearly.html',
    'fortune/seasonal.html',
    'contact.html',
    'feedback.html',
    'oracle-cards.html'
];

// Contenedor específico para cada página
const pageContainers = {
    'tarot-reading.html': '<div id="tarot-reading-result"></div>',
    'yes-or-no-tarot.html': '<div id="yes-no-result"></div>',
    'love-tarot.html': '<div id="love-reading-result"></div>',
    'draw-cards.html': '<div id="drawn-cards-result"></div>',
    'fortune/daily.html': '<div id="daily-fortune-result"></div>',
    'fortune/yearly.html': '<div id="daily-fortune-result"></div>',
    'fortune/seasonal.html': '<div id="daily-fortune-result"></div>',
    'oracle-cards.html': '<div id="drawn-cards-result"></div>'
};

// El código a insertar antes de </body>
const integrationCode = `
    <!-- TAROTXD - Sistema de Funcionalidades -->
    <link rel="stylesheet" href="/tarot-styles.css">
    <script src="/tarot-functionality.js"></script>
`;

function integrateIntoPage(filePath) {
    const fullPath = path.join(__dirname, filePath);

    // Verificar si el archivo existe
    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  Archivo no encontrado: ${filePath}`);
        return false;
    }

    try {
        // Leer el archivo
        let content = fs.readFileSync(fullPath, 'utf8');

        // Verificar si ya tiene la integración
        if (content.includes('TAROTXD - Sistema de Funcionalidades')) {
            console.log(`✅ ${filePath} - Ya integrado`);
            return true;
        }

        // Agregar contenedor específico si es necesario
        const container = pageContainers[filePath];
        let modifiedContent = content;

        if (container) {
            // Buscar el último </div> antes de </body> y agregar el contenedor
            const bodyEndIndex = modifiedContent.lastIndexOf('</body>');
            if (bodyEndIndex !== -1) {
                modifiedContent =
                    modifiedContent.substring(0, bodyEndIndex) +
                    '\n    ' + container + '\n' +
                    modifiedContent.substring(bodyEndIndex);
            }
        }

        // Agregar el código de integración antes de </body>
        const bodyCloseIndex = modifiedContent.lastIndexOf('</body>');
        if (bodyCloseIndex === -1) {
            console.log(`⚠️  ${filePath} - No se encontró </body>`);
            return false;
        }

        modifiedContent =
            modifiedContent.substring(0, bodyCloseIndex) +
            integrationCode +
            modifiedContent.substring(bodyCloseIndex);

        // Guardar el archivo modificado
        fs.writeFileSync(fullPath, modifiedContent, 'utf8');
        console.log(`✅ ${filePath} - Integrado exitosamente`);
        return true;

    } catch (error) {
        console.error(`❌ Error integrando ${filePath}:`, error.message);
        return false;
    }
}

// Ejecutar integración
console.log('🎴 Iniciando integración de funcionalidades TAROTXD...\n');

let successCount = 0;
let failCount = 0;

pagesToIntegrate.forEach(page => {
    const success = integrateIntoPage(page);
    if (success) {
        successCount++;
    } else {
        failCount++;
    }
});

console.log('\n' + '='.repeat(60));
console.log(`✅ Integración completada: ${successCount} exitosas, ${failCount} fallidas`);
console.log('='.repeat(60));

console.log('\n📝 Próximos pasos:');
console.log('1. Abre cualquier página integrada en un navegador');
console.log('2. Abre la consola del navegador (F12)');
console.log('3. Verás mensajes de inicialización del sistema de tarot');
console.log('4. Prueba las funciones: TarotSystem.performTarotReading()');
console.log('\n🎴 ¡Disfruta de tu sitio de tarot funcional!\n');

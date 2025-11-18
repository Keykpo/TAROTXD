const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

async function capturePage() {
    console.log('Iniciando captura de Tarotap.com...');

    const browser = await puppeteer.launch({
        headless: 'new'
    });

    const page = await browser.newPage();

    // Configurar viewport
    await page.setViewport({
        width: 1920,
        height: 1080
    });

    console.log('Navegando a https://tarotap.com...');
    try {
        await page.goto('https://tarotap.com', {
            waitUntil: 'domcontentloaded',
            timeout: 90000
        });
    } catch (error) {
        console.log('Advertencia: timeout alcanzado, continuando de todas formas...');
    }

    console.log('Esperando que la página se renderice completamente...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Obtener el HTML completo renderizado
    const html = await page.content();

    console.log('Guardando HTML...');
    fs.writeFileSync('index.html', html, 'utf8');

    console.log('\nEstadísticas:');
    console.log(`- Tamaño del HTML: ${(html.length / 1024).toFixed(2)} KB`);
    console.log(`- Líneas: ${html.split('\n').length}`);

    await browser.close();
    console.log('\n✓ Captura completada!');
}

capturePage().catch(error => {
    console.error('Error durante la captura:', error);
    process.exit(1);
});

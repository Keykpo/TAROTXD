const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

console.log('📥 Descargando TODAS las imágenes faltantes...\n');

// Leer el reporte de imágenes rotas
const report = JSON.parse(fs.readFileSync('broken-images-report.json', 'utf8'));
const brokenUrls = report.uniqueBrokenUrls;

console.log(`Total de imágenes a procesar: ${brokenUrls.length}\n`);

// Función para decodificar URL
function decodeImageUrl(encodedUrl) {
    // Extraer el parámetro url= de /_next/image?url=...&w=...&q=...
    const match = encodedUrl.match(/\/_next\/image\?url=([^&]+)/);
    if (!match) return null;

    let imageUrl = decodeURIComponent(match[1]);

    // Si es una URL completa (https://...)
    if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
        return { type: 'external', url: imageUrl };
    }

    // Si es una ruta local (/avatar/, /images/, /tarot/, etc.)
    return { type: 'local', url: imageUrl };
}

// Función para descargar imagen
async function downloadImage(url, outputPath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Seguir redirect
                return downloadImage(response.headers.location, outputPath)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }

            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const file = fs.createWriteStream(outputPath);
            response.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve(outputPath);
            });

            file.on('error', (err) => {
                fs.unlink(outputPath, () => {});
                reject(err);
            });
        }).on('error', reject);
    });
}

// Procesar todas las imágenes
async function downloadAllMissing() {
    let downloaded = 0;
    let skipped = 0;
    let failed = 0;
    const downloadedList = [];

    for (const brokenUrl of brokenUrls) {
        const decoded = decodeImageUrl(brokenUrl);

        if (!decoded) {
            console.log(`⚠️  No se pudo decodificar: ${brokenUrl.substring(0, 80)}...`);
            failed++;
            continue;
        }

        let finalUrl, localPath;

        if (decoded.type === 'external') {
            // Imágenes externas (image.tarotap.com)
            finalUrl = decoded.url;
            const urlObj = new URL(finalUrl);
            const filename = path.basename(urlObj.pathname);
            localPath = path.join('images', 'external', filename);
        } else {
            // Imágenes locales
            const localUrl = decoded.url;

            // Determinar si ya existe con hash en _next/static/media/
            const filename = path.basename(localUrl);
            const possiblePaths = [
                localUrl.substring(1), // Quitar el / inicial
                path.join('_next', 'static', 'media', filename)
            ];

            // Verificar si ya existe
            let exists = false;
            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    console.log(`✓ Ya existe: ${p}`);
                    skipped++;
                    exists = true;
                    break;
                }
            }

            if (exists) continue;

            // Construir URL completa para descargar
            finalUrl = `https://tarotap.com${localUrl}`;
            localPath = localUrl.substring(1); // Quitar el /
        }

        // Verificar si ya existe
        if (fs.existsSync(localPath)) {
            console.log(`✓ Ya existe: ${localPath}`);
            skipped++;
            continue;
        }

        // Descargar
        try {
            console.log(`📥 Descargando: ${path.basename(localPath)}`);
            await downloadImage(finalUrl, localPath);
            console.log(`   ✓ Guardado: ${localPath}`);
            downloaded++;
            downloadedList.push({ url: finalUrl, path: localPath });

            // Pequeña pausa entre descargas
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.log(`   ✗ Error: ${error.message}`);
            failed++;
        }
    }

    console.log(`\n✅ Descarga completada!`);
    console.log(`   Descargadas: ${downloaded}`);
    console.log(`   Ya existían: ${skipped}`);
    console.log(`   Fallidas: ${failed}`);
    console.log(`   Total procesadas: ${brokenUrls.length}`);

    // Guardar lista de descargadas
    fs.writeFileSync(
        'downloaded-missing-images.json',
        JSON.stringify(downloadedList, null, 2)
    );
    console.log(`\n💾 Lista guardada en: downloaded-missing-images.json`);
}

downloadAllMissing().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
});

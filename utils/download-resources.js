const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Función para descargar un archivo
function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filepath);

        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Seguir redirecciones
                downloadFile(response.headers.location, filepath)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

// Función para crear directorios si no existen
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

async function downloadResources() {
    console.log('Iniciando descarga de recursos...');

    const browser = await puppeteer.launch({
        headless: 'new'
    });

    const page = await browser.newPage();

    // Crear directorios
    ensureDir('./assets/css');
    ensureDir('./assets/js');
    ensureDir('./assets/images');
    ensureDir('./assets/fonts');

    const resources = {
        css: new Set(),
        js: new Set(),
        images: new Set(),
        fonts: new Set()
    };

    // Interceptar requests
    await page.setRequestInterception(true);
    page.on('request', request => {
        const url = request.url();
        const resourceType = request.resourceType();

        try {
            const urlObj = new URL(url);

            if (resourceType === 'stylesheet' || url.includes('.css')) {
                resources.css.add(url);
            } else if (resourceType === 'script' || url.includes('.js')) {
                resources.js.add(url);
            } else if (resourceType === 'image' || /\.(jpg|jpeg|png|gif|svg|webp|ico)/.test(url)) {
                resources.images.add(url);
            } else if (resourceType === 'font' || /\.(woff|woff2|ttf|eot)/.test(url)) {
                resources.fonts.add(url);
            }
        } catch (e) {
            // URL inválida, ignorar
        }

        request.continue();
    });

    console.log('Navegando a la página...');
    try {
        await page.goto('https://tarotap.com', {
            waitUntil: 'domcontentloaded',
            timeout: 90000
        });
    } catch (error) {
        console.log('Continuando a pesar del timeout...');
    }

    await new Promise(resolve => setTimeout(resolve, 10000));

    await browser.close();

    console.log('\nRecursos encontrados:');
    console.log(`CSS: ${resources.css.size}`);
    console.log(`JS: ${resources.js.size}`);
    console.log(`Imágenes: ${resources.images.size}`);
    console.log(`Fuentes: ${resources.fonts.size}`);

    // Guardar URLs de recursos
    const resourcesObj = {
        css: Array.from(resources.css),
        js: Array.from(resources.js),
        images: Array.from(resources.images),
        fonts: Array.from(resources.fonts)
    };

    fs.writeFileSync('resources-list.json', JSON.stringify(resourcesObj, null, 2));
    console.log('\n✓ Lista de recursos guardada en resources-list.json');

    // Descargar CSS
    console.log('\nDescargando archivos CSS...');
    let count = 0;
    for (const url of resources.css) {
        try {
            const filename = `style-${count++}.css`;
            const filepath = path.join('./assets/css', filename);
            await downloadFile(url, filepath);
            console.log(`✓ ${filename}`);
        } catch (err) {
            console.log(`✗ Error descargando: ${url.substring(0, 50)}...`);
        }
    }

    // Descargar primeras 20 imágenes (para no saturar)
    console.log('\nDescargando primeras 20 imágenes...');
    count = 0;
    const imagesToDownload = Array.from(resources.images).slice(0, 20);
    for (const url of imagesToDownload) {
        try {
            const urlObj = new URL(url);
            const ext = path.extname(urlObj.pathname) || '.jpg';
            const filename = `image-${count++}${ext}`;
            const filepath = path.join('./assets/images', filename);
            await downloadFile(url, filepath);
            console.log(`✓ ${filename}`);
        } catch (err) {
            console.log(`✗ Error descargando imagen`);
        }
    }

    console.log('\n✓ Descarga completada!');
}

downloadResources().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});

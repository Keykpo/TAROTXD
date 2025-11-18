const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Función mejorada para descargar archivos con reintentos
async function downloadFile(url, filepath, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await downloadFileOnce(url, filepath);
            return true;
        } catch (err) {
            if (i === retries - 1) {
                console.log(`✗ Error descargando: ${path.basename(filepath)}`);
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

function downloadFileOnce(url, filepath) {
    return new Promise((resolve, reject) => {
        // Crear directorio si no existe
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filepath);

        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                fs.unlinkSync(filepath);
                downloadFileOnce(response.headers.location, filepath)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                fs.unlinkSync(filepath);
                reject(new Error(`Status code: ${response.statusCode}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
            reject(err);
        });
    });
}

async function deepClone() {
    console.log('🚀 Iniciando clonación profunda de Tarotap.com...\n');

    const browser = await puppeteer.launch({
        headless: 'new'
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Colecciones de recursos
    const resources = new Map();

    // Interceptar todas las requests
    await page.setRequestInterception(true);
    page.on('request', request => {
        const url = request.url();
        const resourceType = request.resourceType();

        // Guardar URL original y tipo
        if (!url.includes('data:') && !url.includes('blob:')) {
            resources.set(url, resourceType);
        }

        request.continue();
    });

    console.log('📡 Navegando a https://tarotap.com...');
    try {
        await page.goto('https://tarotap.com', {
            waitUntil: 'networkidle0',
            timeout: 120000
        });
    } catch (error) {
        console.log('⚠️  Timeout alcanzado, continuando...');
    }

    console.log('⏳ Esperando renderizado completo...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Scroll para cargar imágenes lazy
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.evaluate(() => {
        window.scrollTo(0, 0);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Obtener HTML
    const html = await page.content();
    await browser.close();

    console.log(`\n📊 Recursos encontrados: ${resources.size}`);

    // Categorizar recursos
    const categorized = {
        css: [],
        js: [],
        images: [],
        fonts: [],
        other: []
    };

    for (const [url, type] of resources.entries()) {
        if (url.includes('.css') || type === 'stylesheet') {
            categorized.css.push(url);
        } else if (url.includes('.js') || type === 'script') {
            categorized.js.push(url);
        } else if (type === 'image' || /\.(jpg|jpeg|png|gif|svg|webp|ico)/.test(url)) {
            categorized.images.push(url);
        } else if (type === 'font' || /\.(woff|woff2|ttf|eot|otf)/.test(url)) {
            categorized.fonts.push(url);
        } else {
            categorized.other.push(url);
        }
    }

    console.log(`\n📁 Recursos categorizados:`);
    console.log(`   CSS: ${categorized.css.length}`);
    console.log(`   JavaScript: ${categorized.js.length}`);
    console.log(`   Imágenes: ${categorized.images.length}`);
    console.log(`   Fuentes: ${categorized.fonts.length}`);
    console.log(`   Otros: ${categorized.other.length}`);

    // Crear directorios base
    const dirs = [
        '_next/static/chunks',
        '_next/static/css',
        '_next/static/media',
        '_next/image',
        'spreads',
        'images',
        'fonts',
        'scripts'
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    // Guardar HTML
    console.log('\n💾 Guardando HTML...');
    fs.writeFileSync('index.html', html, 'utf8');
    console.log('✓ index.html guardado');

    // Descargar CSS
    console.log(`\n📥 Descargando ${categorized.css.length} archivos CSS...`);
    let downloaded = 0;
    for (const url of categorized.css) {
        try {
            const urlObj = new URL(url);
            const localPath = urlObj.pathname.startsWith('/_next')
                ? `.${urlObj.pathname}`
                : path.join('assets/css', path.basename(urlObj.pathname));

            if (await downloadFile(url, localPath)) {
                downloaded++;
                process.stdout.write(`\r   Progreso: ${downloaded}/${categorized.css.length}`);
            }
        } catch (err) {
            // Ignorar errores de URL
        }
    }
    console.log(`\n✓ ${downloaded} archivos CSS descargados`);

    // Descargar JavaScript
    console.log(`\n📥 Descargando ${categorized.js.length} archivos JavaScript...`);
    downloaded = 0;
    for (const url of categorized.js) {
        try {
            const urlObj = new URL(url);
            const localPath = urlObj.pathname.startsWith('/_next')
                ? `.${urlObj.pathname}`
                : path.join('scripts', path.basename(urlObj.pathname));

            if (await downloadFile(url, localPath)) {
                downloaded++;
                process.stdout.write(`\r   Progreso: ${downloaded}/${categorized.js.length}`);
            }
        } catch (err) {
            // Ignorar errores
        }
    }
    console.log(`\n✓ ${downloaded} archivos JavaScript descargados`);

    // Descargar fuentes
    console.log(`\n📥 Descargando ${categorized.fonts.length} fuentes...`);
    downloaded = 0;
    for (const url of categorized.fonts) {
        try {
            const urlObj = new URL(url);
            const localPath = urlObj.pathname.startsWith('/_next')
                ? `.${urlObj.pathname}`
                : path.join('fonts', path.basename(urlObj.pathname));

            if (await downloadFile(url, localPath)) {
                downloaded++;
                process.stdout.write(`\r   Progreso: ${downloaded}/${categorized.fonts.length}`);
            }
        } catch (err) {
            // Ignorar errores
        }
    }
    console.log(`\n✓ ${downloaded} fuentes descargadas`);

    // Descargar imágenes (limitadas a las más importantes)
    console.log(`\n📥 Descargando imágenes...`);
    downloaded = 0;
    const imagesToDownload = categorized.images.slice(0, 100); // Limitar a 100
    for (const url of imagesToDownload) {
        try {
            const urlObj = new URL(url);
            let localPath;

            if (urlObj.pathname.startsWith('/_next/image')) {
                // Next.js image optimization - guardar con hash único
                const ext = '.jpg'; // Default
                localPath = path.join('_next/image', `img-${downloaded}${ext}`);
            } else if (urlObj.pathname.startsWith('/_next')) {
                // Asegurarse de que tiene extensión
                let pathname = urlObj.pathname;
                if (!path.extname(pathname)) {
                    pathname += '.jpg';
                }
                localPath = `.${pathname}`;
            } else if (urlObj.pathname.startsWith('/spreads')) {
                localPath = `.${urlObj.pathname}`;
            } else if (urlObj.hostname.includes('tarotap.com')) {
                const basename = path.basename(urlObj.pathname);
                const ext = path.extname(basename) || '.jpg';
                const name = path.basename(basename, ext);
                localPath = path.join('images', `${name || 'image-' + downloaded}${ext}`);
            } else {
                // Imágenes externas
                const ext = path.extname(urlObj.pathname) || '.jpg';
                localPath = path.join('images', `external-${downloaded}${ext}`);
            }

            if (await downloadFile(url, localPath)) {
                downloaded++;
                process.stdout.write(`\r   Progreso: ${downloaded}/${imagesToDownload.length}`);
            }
        } catch (err) {
            // Ignorar errores
        }
    }
    console.log(`\n✓ ${downloaded} imágenes descargadas`);

    // Guardar mapa de recursos
    const resourceMap = {
        total: resources.size,
        categorized: {
            css: categorized.css.length,
            js: categorized.js.length,
            images: categorized.images.length,
            fonts: categorized.fonts.length,
            other: categorized.other.length
        },
        urls: {
            css: categorized.css,
            js: categorized.js,
            images: categorized.images,
            fonts: categorized.fonts
        }
    };

    fs.writeFileSync('resource-map.json', JSON.stringify(resourceMap, null, 2));
    console.log('\n✓ Mapa de recursos guardado en resource-map.json');

    console.log('\n✅ Clonación profunda completada!');
    console.log('\n📝 Resumen:');
    console.log(`   - HTML: index.html`);
    console.log(`   - Estructura de carpetas creada`);
    console.log(`   - Recursos descargados y organizados`);
    console.log(`\n🌐 Abre http://localhost:3003 para ver el resultado`);
}

deepClone().catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
});

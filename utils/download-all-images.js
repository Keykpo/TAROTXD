const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Función mejorada para descargar archivos
async function downloadFile(url, filepath, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await downloadFileOnce(url, filepath);
            return true;
        } catch (err) {
            if (i === retries - 1) {
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

function downloadFileOnce(url, filepath) {
    return new Promise((resolve, reject) => {
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

async function downloadAllImages() {
    console.log('🖼️  Descargando TODAS las imágenes de Tarotap.com...\n');

    const browser = await puppeteer.launch({
        headless: 'new'
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Colecciones
    const allImages = new Set();
    const imageDetails = [];

    await page.setRequestInterception(true);
    page.on('request', request => {
        const url = request.url();
        const resourceType = request.resourceType();

        if (resourceType === 'image' || /\.(jpg|jpeg|png|gif|svg|webp|ico)/.test(url)) {
            allImages.add(url);
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
        console.log('⚠️  Continuando...');
    }

    console.log('⏳ Esperando carga completa...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Scroll múltiple para cargar lazy images
    for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extraer todas las imágenes del DOM también
    const domImages = await page.evaluate(() => {
        const images = [];

        // Tags img
        document.querySelectorAll('img').forEach(img => {
            if (img.src) images.push(img.src);
            if (img.srcset) {
                img.srcset.split(',').forEach(src => {
                    const url = src.trim().split(' ')[0];
                    if (url) images.push(url);
                });
            }
        });

        // Background images
        document.querySelectorAll('*').forEach(el => {
            const bg = window.getComputedStyle(el).backgroundImage;
            if (bg && bg !== 'none') {
                const matches = bg.match(/url\(['"]?([^'"]+)['"]?\)/g);
                if (matches) {
                    matches.forEach(match => {
                        const url = match.replace(/url\(['"]?([^'"]+)['"]?\)/, '$1');
                        images.push(url);
                    });
                }
            }
        });

        return images;
    });

    domImages.forEach(url => allImages.add(url));

    await browser.close();

    console.log(`\n📊 Total de imágenes encontradas: ${allImages.size}\n`);

    // Categorizar imágenes
    const categories = {
        nextStaticMedia: [],
        nextImage: [],
        spreads: [],
        external: [],
        local: [],
        favicon: []
    };

    for (const url of allImages) {
        try {
            const urlObj = new URL(url, 'https://tarotap.com');

            if (urlObj.pathname.includes('favicon') || urlObj.pathname.includes('icon')) {
                categories.favicon.push(url);
            } else if (urlObj.pathname.startsWith('/_next/static/media/')) {
                categories.nextStaticMedia.push(url);
            } else if (urlObj.pathname.startsWith('/_next/image')) {
                categories.nextImage.push(url);
            } else if (urlObj.pathname.startsWith('/spreads')) {
                categories.spreads.push(url);
            } else if (urlObj.hostname.includes('tarotap.com')) {
                categories.local.push(url);
            } else {
                categories.external.push(url);
            }
        } catch (e) {
            // URL relativa o inválida
        }
    }

    console.log('📁 Categorías encontradas:');
    console.log(`   - Next.js Static Media: ${categories.nextStaticMedia.length}`);
    console.log(`   - Next.js Image Optimization: ${categories.nextImage.length}`);
    console.log(`   - Spreads: ${categories.spreads.length}`);
    console.log(`   - Locales: ${categories.local.length}`);
    console.log(`   - Externas: ${categories.external.length}`);
    console.log(`   - Favicon/Iconos: ${categories.favicon.length}`);

    // Descargar Next.js Static Media
    console.log(`\n📥 Descargando imágenes de /_next/static/media/...`);
    let downloaded = 0;
    for (const url of categories.nextStaticMedia) {
        try {
            const urlObj = new URL(url, 'https://tarotap.com');
            const localPath = `.${urlObj.pathname}`;

            if (await downloadFile(url, localPath)) {
                downloaded++;
                console.log(`   ✓ ${path.basename(localPath)}`);
            }
        } catch (err) {}
    }
    console.log(`✓ ${downloaded}/${categories.nextStaticMedia.length} descargadas\n`);

    // Descargar spreads
    console.log(`📥 Descargando spreads...`);
    downloaded = 0;
    for (const url of categories.spreads) {
        try {
            const urlObj = new URL(url, 'https://tarotap.com');
            const localPath = `.${urlObj.pathname}`;

            if (await downloadFile(url, localPath)) {
                downloaded++;
                console.log(`   ✓ ${path.basename(localPath)}`);
            }
        } catch (err) {}
    }
    console.log(`✓ ${downloaded}/${categories.spreads.length} descargadas\n`);

    // Descargar Next.js Image Optimization (primeras 30)
    console.log(`📥 Descargando imágenes optimizadas de Next.js...`);
    downloaded = 0;
    const nextImagesToDownload = categories.nextImage.slice(0, 30);
    for (const url of nextImagesToDownload) {
        try {
            const urlObj = new URL(url, 'https://tarotap.com');

            // Extraer el nombre de imagen del query string
            const params = new URLSearchParams(urlObj.search);
            const imgUrl = params.get('url');

            if (imgUrl) {
                let filename = path.basename(imgUrl);
                if (!path.extname(filename)) {
                    filename += '.png';
                }
                const localPath = path.join('_next/static/media', filename);

                if (await downloadFile(url, localPath)) {
                    downloaded++;
                    console.log(`   ✓ ${filename}`);
                }
            }
        } catch (err) {}
    }
    console.log(`✓ ${downloaded}/${nextImagesToDownload.length} descargadas\n`);

    // Descargar imágenes locales
    console.log(`📥 Descargando imágenes locales...`);
    downloaded = 0;
    for (const url of categories.local) {
        try {
            const urlObj = new URL(url, 'https://tarotap.com');
            const localPath = `.${urlObj.pathname}`;

            if (await downloadFile(url, localPath)) {
                downloaded++;
                console.log(`   ✓ ${path.basename(localPath)}`);
            }
        } catch (err) {}
    }
    console.log(`✓ ${downloaded}/${categories.local.length} descargadas\n`);

    // Descargar imágenes externas (primeras 20)
    console.log(`📥 Descargando imágenes externas (primeras 20)...`);
    downloaded = 0;
    const externalToDownload = categories.external.slice(0, 20);
    for (const url of externalToDownload) {
        try {
            const urlObj = new URL(url);
            const ext = path.extname(urlObj.pathname) || '.jpg';
            const basename = path.basename(urlObj.pathname, ext);
            const filename = `${basename || 'external-' + downloaded}${ext}`;
            const localPath = path.join('images/external', filename);

            if (await downloadFile(url, localPath)) {
                downloaded++;
                console.log(`   ✓ ${filename}`);
            }
        } catch (err) {}
    }
    console.log(`✓ ${downloaded}/${externalToDownload.length} descargadas\n`);

    // Descargar favicon e iconos
    console.log(`📥 Descargando favicon e iconos...`);
    downloaded = 0;
    for (const url of categories.favicon) {
        try {
            const urlObj = new URL(url, 'https://tarotap.com');
            const localPath = `.${urlObj.pathname}`;

            if (await downloadFile(url, localPath)) {
                downloaded++;
                console.log(`   ✓ ${path.basename(localPath)}`);
            }
        } catch (err) {}
    }
    console.log(`✓ ${downloaded}/${categories.favicon.length} descargadas\n`);

    // Guardar mapa
    fs.writeFileSync('image-map.json', JSON.stringify({
        total: allImages.size,
        categories: {
            nextStaticMedia: categories.nextStaticMedia,
            nextImage: categories.nextImage,
            spreads: categories.spreads,
            local: categories.local,
            external: categories.external,
            favicon: categories.favicon
        }
    }, null, 2));

    console.log('✅ Descarga de imágenes completada!');
    console.log('\n📝 Mapa guardado en: image-map.json');
}

downloadAllImages().catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
});

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function cloneAllPages() {
    console.log('🌐 Clonando TODAS las páginas de Tarotap.com...\n');

    // Leer estructura del sitio
    const siteStructure = JSON.parse(fs.readFileSync('site-structure.json', 'utf8'));
    const pagesToClone = siteStructure.mainPagesToClone || [];

    console.log(`📋 Se van a clonar ${pagesToClone.length} páginas\n`);

    const browser = await puppeteer.launch({ headless: 'new' });
    const clonedPages = [];

    for (let i = 0; i < pagesToClone.length; i++) {
        const pagePath = pagesToClone[i];
        const url = `https://tarotap.com${pagePath}`;

        console.log(`[${i + 1}/${pagesToClone.length}] Clonando: ${pagePath}`);

        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });

            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            }).catch(() => {});

            await new Promise(resolve => setTimeout(resolve, 3000));

            const html = await page.content();

            // Crear estructura de carpetas
            const filePath = pagePath === '/' ? 'index.html' : `.${pagePath}.html`;
            const dir = path.dirname(filePath);

            if (dir !== '.' && !fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(filePath, html, 'utf8');
            clonedPages.push({
                path: pagePath,
                file: filePath,
                size: Math.round(html.length / 1024)
            });

            console.log(`   ✓ Guardado: ${filePath} (${Math.round(html.length / 1024)} KB)`);

            await page.close();

        } catch (error) {
            console.log(`   ✗ Error: ${error.message}`);
        }

        // Pequeña pausa entre páginas
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await browser.close();

    // Guardar índice de páginas
    fs.writeFileSync('pages-index.json', JSON.stringify(clonedPages, null, 2));

    console.log(`\n✅ Clonación completada!`);
    console.log(`\n📊 Resultados:`);
    console.log(`   Total de páginas clonadas: ${clonedPages.length}`);
    console.log(`   Tamaño total: ${clonedPages.reduce((sum, p) => sum + p.size, 0)} KB`);
    console.log(`\n📝 Índice guardado en: pages-index.json`);

    // Mostrar estructura
    console.log(`\n📁 Estructura de páginas:`);
    const grouped = {};
    clonedPages.forEach(p => {
        const category = p.path.split('/')[1] || 'root';
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(p.path);
    });

    Object.keys(grouped).sort().forEach(category => {
        console.log(`\n   ${category}/ (${grouped[category].length}):`);
        grouped[category].slice(0, 5).forEach(p => {
            console.log(`      • ${p}`);
        });
        if (grouped[category].length > 5) {
            console.log(`      ... y ${grouped[category].length - 5} más`);
        }
    });
}

cloneAllPages().catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
});

const puppeteer = require('puppeteer');
const fs = require('fs');
const { URL } = require('url');

async function analyzeLinks() {
    console.log('🔍 Analizando todos los links de Tarotap.com...\n');

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    console.log('📡 Navegando a https://tarotap.com...');
    await page.goto('https://tarotap.com', {
        waitUntil: 'networkidle0',
        timeout: 120000
    }).catch(() => console.log('⚠️  Continuando...'));

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Extraer todos los links
    const links = await page.evaluate(() => {
        const allLinks = [];

        document.querySelectorAll('a[href]').forEach(link => {
            allLinks.push({
                href: link.href,
                text: link.textContent.trim().substring(0, 50),
                type: 'link'
            });
        });

        // También buscar en botones
        document.querySelectorAll('button').forEach(btn => {
            const text = btn.textContent.trim();
            if (text) {
                allLinks.push({
                    text: text.substring(0, 50),
                    type: 'button'
                });
            }
        });

        return allLinks;
    });

    await browser.close();

    // Filtrar y categorizar
    const tarotapLinks = new Set();
    const externalLinks = new Set();
    const categories = {
        tarotReading: [],
        features: [],
        pricing: [],
        blog: [],
        auth: [],
        other: [],
        buttons: []
    };

    links.forEach(link => {
        if (link.type === 'button') {
            categories.buttons.push(link.text);
            return;
        }

        try {
            const url = new URL(link.href);

            if (url.hostname.includes('tarotap.com')) {
                const path = url.pathname;
                tarotapLinks.add(path);

                // Categorizar
                if (path.includes('reading') || path.includes('tarot') || path.includes('spread')) {
                    categories.tarotReading.push({ path, text: link.text });
                } else if (path.includes('pricing') || path.includes('plan')) {
                    categories.pricing.push({ path, text: link.text });
                } else if (path.includes('blog') || path.includes('article')) {
                    categories.blog.push({ path, text: link.text });
                } else if (path.includes('login') || path.includes('signup') || path.includes('auth')) {
                    categories.auth.push({ path, text: link.text });
                } else if (path !== '/' && path !== '') {
                    categories.other.push({ path, text: link.text });
                }
            } else {
                externalLinks.add(url.hostname);
            }
        } catch (e) {
            // URL inválida
        }
    });

    console.log('\n📊 ANÁLISIS DE LINKS:\n');
    console.log(`Total de links únicos en Tarotap: ${tarotapLinks.size}`);
    console.log(`Dominios externos: ${externalLinks.size}\n`);

    console.log('📁 CATEGORÍAS DE PÁGINAS:\n');

    console.log(`🎴 Lecturas de Tarot (${categories.tarotReading.length}):`);
    categories.tarotReading.slice(0, 10).forEach(link => {
        console.log(`   • ${link.path}`);
        if (link.text) console.log(`     "${link.text}"`);
    });
    if (categories.tarotReading.length > 10) {
        console.log(`   ... y ${categories.tarotReading.length - 10} más`);
    }

    console.log(`\n💰 Pricing/Planes (${categories.pricing.length}):`);
    categories.pricing.forEach(link => {
        console.log(`   • ${link.path} - "${link.text}"`);
    });

    console.log(`\n📝 Blog/Artículos (${categories.blog.length}):`);
    categories.blog.slice(0, 5).forEach(link => {
        console.log(`   • ${link.path}`);
    });
    if (categories.blog.length > 5) {
        console.log(`   ... y ${categories.blog.length - 5} más`);
    }

    console.log(`\n🔐 Auth (${categories.auth.length}):`);
    categories.auth.forEach(link => {
        console.log(`   • ${link.path} - "${link.text}"`);
    });

    console.log(`\n📄 Otras páginas (${categories.other.length}):`);
    categories.other.slice(0, 10).forEach(link => {
        console.log(`   • ${link.path} - "${link.text}"`);
    });

    console.log(`\n🔘 Botones principales (${Math.min(10, categories.buttons.length)}):`);
    categories.buttons.slice(0, 10).forEach(btn => {
        console.log(`   • "${btn}"`);
    });

    // Páginas principales a clonar
    const mainPages = [...new Set([
        ...categories.tarotReading.map(l => l.path),
        ...categories.pricing.map(l => l.path),
        ...categories.other.filter(l => !l.path.includes('/blog/')).map(l => l.path)
    ])].filter(p => p && p !== '/');

    console.log(`\n\n🎯 PÁGINAS PRINCIPALES RECOMENDADAS PARA CLONAR (${mainPages.length}):`);
    mainPages.slice(0, 15).forEach(path => {
        console.log(`   • ${path}`);
    });
    if (mainPages.length > 15) {
        console.log(`   ... y ${mainPages.length - 15} más`);
    }

    // Guardar resultado
    const result = {
        totalLinks: tarotapLinks.size,
        allPaths: Array.from(tarotapLinks),
        categories: {
            tarotReading: categories.tarotReading,
            pricing: categories.pricing,
            blog: categories.blog,
            auth: categories.auth,
            other: categories.other
        },
        mainPagesToClone: mainPages,
        externalDomains: Array.from(externalLinks)
    };

    fs.writeFileSync('site-structure.json', JSON.stringify(result, null, 2));
    console.log('\n✅ Estructura guardada en: site-structure.json');
}

analyzeLinks().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
});

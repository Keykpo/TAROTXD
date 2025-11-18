const fs = require('fs');
const path = require('path');

// Mapeo de imágenes conocidas
const imageMapping = {
    'tarotap.919fecf7.png': '_next/static/media/tarotap.919fecf7.png',
    'dailytarot.ae575183.png': '_next/static/media/dailytarot.ae575183.png',
    'one-card-600-400.c469af40.jpeg': '_next/static/media/one-card-600-400.c469af40.jpeg',
    'love-tarot.09c5f109.png': '_next/static/media/love-tarot.09c5f109.png',
    'draw-cards.59f118b0.png': '_next/static/media/draw-cards.59f118b0.png',
    'oracle-cards.2bb98b98.png': '_next/static/media/oracle-cards.2bb98b98.png',
    '1.39b4d552.jpg': '_next/static/media/1.39b4d552.jpg',
    '2.2937adda.jpg': '_next/static/media/2.2937adda.jpg',
    '3.e2fe09ff.jpg': '_next/static/media/3.e2fe09ff.jpg',
    '4.c7abc50d.jpg': '_next/static/media/4.c7abc50d.jpg',
    '5.7114ffcb.jpg': '_next/static/media/5.7114ffcb.jpg',
    '1735875345.webp': '_next/static/media/1735875345.webp',
    'chatgpt-reads-tarot-cards-future-unknown-398419.png': '_next/static/media/chatgpt-reads-tarot-cards-future-unknown-398419.png'
};

function fixImagePaths(html) {
    let fixed = html;
    let replacements = 0;

    // Pattern 1: /_next/image?url=%2F_next%2Fstatic%2Fmedia%2F{filename}&w=...&q=...
    Object.keys(imageMapping).forEach(filename => {
        const encodedFilename = encodeURIComponent(filename);

        // Reemplazar URLs con parámetros
        const pattern1 = new RegExp(`/_next/image\\?url=%2F_next%2Fstatic%2Fmedia%2F${encodedFilename.replace(/\./g, '\\.')}&w=\\d+&q=\\d+`, 'g');
        const before1 = fixed;
        fixed = fixed.replace(pattern1, `/${imageMapping[filename]}`);
        if (before1 !== fixed) replacements++;

        // Patrón alternativo sin encode
        const pattern2 = new RegExp(`/_next/image\\?url=/_next/static/media/${filename.replace(/\./g, '\\.')}&w=\\d+&q=\\d+`, 'g');
        const before2 = fixed;
        fixed = fixed.replace(pattern2, `/${imageMapping[filename]}`);
        if (before2 !== fixed) replacements++;

        // Pattern con URL simple
        const pattern3 = new RegExp(`/_next/image\\?url=%2F_next%2Fstatic%2Fmedia%2F${encodedFilename.replace(/\./g, '\\.')}`, 'g');
        const before3 = fixed;
        fixed = fixed.replace(pattern3, `/${imageMapping[filename]}`);
        if (before3 !== fixed) replacements++;
    });

    // Reemplazar imágenes de spreads
    fixed = fixed.replace(/\/_next\/image\?url=%2Fspreads%2F/g, '/spreads/');
    fixed = fixed.replace(/&w=\d+&q=\d+/g, '');

    return { html: fixed, replacements };
}

async function fixAllPages() {
    console.log('🔧 Corrigiendo rutas de imágenes en todas las páginas...\n');

    // Leer índice de páginas
    const pagesIndex = JSON.parse(fs.readFileSync('pages-index.json', 'utf8'));
    const allPages = [{ path: '/', file: 'index.html' }, ...pagesIndex];

    let totalReplacements = 0;
    let pagesFixed = 0;

    for (const pageInfo of allPages) {
        try {
            const filePath = pageInfo.file;

            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  Saltando ${filePath} (no existe)`);
                continue;
            }

            const html = fs.readFileSync(filePath, 'utf8');
            const { html: fixed, replacements } = fixImagePaths(html);

            if (replacements > 0) {
                fs.writeFileSync(filePath, fixed, 'utf8');
                console.log(`✓ ${filePath} - ${replacements} reemplazos`);
                pagesFixed++;
                totalReplacements += replacements;
            } else {
                console.log(`  ${filePath} - sin cambios`);
            }
        } catch (error) {
            console.log(`✗ Error en ${pageInfo.file}: ${error.message}`);
        }
    }

    console.log(`\n✅ Corrección completada!`);
    console.log(`   Páginas modificadas: ${pagesFixed}/${allPages.length}`);
    console.log(`   Total de reemplazos: ${totalReplacements}`);
    console.log(`\n💡 Las imágenes ahora deberían cargar correctamente!`);
}

fixAllPages().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
});

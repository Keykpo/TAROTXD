const fs = require('fs');
const path = require('path');

console.log('🔍 Buscando imágenes rotas en todas las páginas...\n');

// Obtener todas las páginas
const pagesIndex = JSON.parse(fs.readFileSync('pages-index.json', 'utf8'));
const allPages = [
    { path: '/', file: 'index.html' },
    ...pagesIndex
];

let totalBroken = 0;
const brokenByPage = [];
const uniqueBrokenUrls = new Set();

for (const pageInfo of allPages) {
    const filePath = pageInfo.file;

    if (!fs.existsSync(filePath)) continue;

    const html = fs.readFileSync(filePath, 'utf8');

    // Buscar imágenes con /_next/image?
    const brokenImages = html.match(/<img[^>]+src=["']([^"']*\/_next\/image\?[^"']+)["']/gi) || [];

    if (brokenImages.length > 0) {
        brokenByPage.push({
            page: pageInfo.path,
            file: filePath,
            count: brokenImages.length
        });
        totalBroken += brokenImages.length;

        // Extraer URLs únicas
        brokenImages.forEach(img => {
            const match = img.match(/src=["']([^"']+)["']/);
            if (match) uniqueBrokenUrls.add(match[1]);
        });
    }
}

console.log('📊 RESUMEN:\n');
console.log(`Total de páginas analizadas: ${allPages.length}`);
console.log(`Páginas con imágenes rotas: ${brokenByPage.length}`);
console.log(`Total de imágenes rotas: ${totalBroken}`);
console.log(`URLs únicas de imágenes rotas: ${uniqueBrokenUrls.size}\n`);

if (brokenByPage.length > 0) {
    console.log('📄 Páginas afectadas:\n');
    brokenByPage.forEach(p => {
        console.log(`   ${p.file} - ${p.count} imagen(es) rota(s)`);
    });

    console.log('\n🔗 URLs de imágenes rotas:\n');
    let i = 1;
    for (const url of uniqueBrokenUrls) {
        console.log(`   ${i}. ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`);
        i++;
    }
}

// Guardar reporte
const report = {
    timestamp: new Date().toISOString(),
    totalPages: allPages.length,
    pagesWithBrokenImages: brokenByPage.length,
    totalBrokenImages: totalBroken,
    uniqueBrokenUrls: Array.from(uniqueBrokenUrls),
    detailedReport: brokenByPage
};

fs.writeFileSync('broken-images-report.json', JSON.stringify(report, null, 2));
console.log('\n💾 Reporte guardado en: broken-images-report.json');

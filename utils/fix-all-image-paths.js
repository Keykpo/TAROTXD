const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigiendo TODAS las rutas de imágenes...\n');

// Función para decodificar y convertir URL de imagen
function fixImageUrl(imageUrl) {
    // Si no es una URL de /_next/image?, devolverla sin cambios
    if (!imageUrl.includes('/_next/image?')) {
        return imageUrl;
    }

    // Extraer el parámetro url= de /_next/image?url=...&w=...&q=...
    const match = imageUrl.match(/\/_next\/image\?url=([^&]+)/);
    if (!match) return imageUrl;

    let decodedUrl = decodeURIComponent(match[1]);

    // Si es URL completa externa (https://image.tarotap.com/...)
    if (decodedUrl.startsWith('https://image.tarotap.com/')) {
        const filename = path.basename(decodedUrl);
        return `/images/external/${filename}`;
    }

    // Si es URL local que ya empieza con /
    if (decodedUrl.startsWith('/')) {
        // Ya es la ruta correcta, solo quitar parámetros
        return decodedUrl;
    }

    return imageUrl;
}

// Función para corregir todas las imágenes en un HTML
function fixAllImagesInHtml(html) {
    let fixed = html;
    let replacements = 0;

    // Pattern: src="/_next/image?url=...&w=...&q=..."
    // También incluye versión con &amp;
    const pattern = /src=["'](\/_next\/image\?url=[^"']+)["']/g;

    fixed = fixed.replace(pattern, (match, imageUrl) => {
        const fixedUrl = fixImageUrl(imageUrl);
        if (fixedUrl !== imageUrl) {
            replacements++;
            return `src="${fixedUrl}"`;
        }
        return match;
    });

    // También corregir srcSet si existe
    const srcSetPattern = /srcSet=["']([^"']*\/_next\/image\?[^"']+)["']/g;
    fixed = fixed.replace(srcSetPattern, (match, srcSetValue) => {
        // srcSet puede tener múltiples URLs separadas por comas
        const fixedSrcSet = srcSetValue.split(',').map(item => {
            const parts = item.trim().split(' ');
            if (parts[0].includes('/_next/image?')) {
                parts[0] = fixImageUrl(parts[0]);
                replacements++;
            }
            return parts.join(' ');
        }).join(', ');

        return `srcSet="${fixedSrcSet}"`;
    });

    return { html: fixed, replacements };
}

async function fixAllPages() {
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
            const { html: fixed, replacements } = fixAllImagesInHtml(html);

            if (replacements > 0) {
                fs.writeFileSync(filePath, fixed, 'utf8');
                console.log(`✓ ${filePath} - ${replacements} correcciones`);
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
    console.log(`   Total de correcciones: ${totalReplacements}`);
    console.log(`\n💡 Las imágenes ahora deberían cargar correctamente!`);
    console.log(`\n🌐 Abre http://localhost:3004 para verificar`);
}

fixAllPages().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
});

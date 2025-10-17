const fs = require('fs');
const path = require('path');

console.log('📦 Post-build: Optimizando SPA + PWA...');

// Copiar archivos PWA al directorio out
const publicDir = path.join(__dirname, '../public');
const outDir = path.join(__dirname, '../out');

// Archivos a copiar
const filesToCopy = ['sw.js', 'manifest.json'];

filesToCopy.forEach(file => {
  const src = path.join(publicDir, file);
  const dest = path.join(outDir, file);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copiado: ${file}`);
  }
});

// Crear archivo _headers para Netlify/Vercel
const headersContent = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin

/sw.js
  Cache-Control: public, max-age=0, must-revalidate
  
/manifest.json
  Cache-Control: public, max-age=0, must-revalidate
  Content-Type: application/manifest+json

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable
`;

fs.writeFileSync(path.join(outDir, '_headers'), headersContent);
console.log('✓ Creado: _headers');

console.log('✅ Post-build completado!');

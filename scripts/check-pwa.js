// Script de verificación PWA
const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verificando configuración PWA...\n');

const publicDir = path.join(__dirname, '..', 'public');
const checks = [];

// Verificar manifest.json
const manifestPath = path.join(publicDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  checks.push({ name: 'Manifest.json', status: true, detail: `✅ Nombre: ${manifest.name}` });
  
  // Verificar íconos en manifest
  const hasPngIcons = manifest.icons?.some(icon => icon.type === 'image/png');
  checks.push({ name: 'Íconos PNG en manifest', status: hasPngIcons, detail: hasPngIcons ? '✅ Configurado' : '❌ Faltan PNG' });
} else {
  checks.push({ name: 'Manifest.json', status: false, detail: '❌ No existe' });
}

// Verificar Service Worker
const swPath = path.join(publicDir, 'sw.js');
checks.push({ name: 'Service Worker (sw.js)', status: fs.existsSync(swPath), detail: fs.existsSync(swPath) ? '✅ Existe' : '❌ No existe' });

// Verificar íconos PNG
const icons = [
  { file: 'icon-192.png', size: '192x192', purpose: 'PWA estándar' },
  { file: 'icon-512.png', size: '512x512', purpose: 'PWA alta resolución' },
  { file: 'apple-touch-icon.png', size: '180x180', purpose: 'iOS Safari' },
  { file: 'favicon-32x32.png', size: '32x32', purpose: 'Favicon' },
  { file: 'favicon-16x16.png', size: '16x16', purpose: 'Favicon pequeño' },
];

icons.forEach(({ file, size, purpose }) => {
  const iconPath = path.join(publicDir, file);
  const exists = fs.existsSync(iconPath);
  const sizeInfo = exists ? `${(fs.statSync(iconPath).size / 1024).toFixed(1)}KB` : 'N/A';
  checks.push({ 
    name: `${file} (${size})`, 
    status: exists, 
    detail: exists ? `✅ ${sizeInfo} - ${purpose}` : `❌ No existe - ${purpose}` 
  });
});

// Mostrar resultados
console.log('📋 Resultados de verificación:\n');
checks.forEach(({ name, status, detail }) => {
  const icon = status ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  console.log(`   ${detail}\n`);
});

// Resumen
const passed = checks.filter(c => c.status).length;
const total = checks.length;
const percentage = ((passed / total) * 100).toFixed(0);

console.log('━'.repeat(50));
console.log(`\n📊 Resumen: ${passed}/${total} verificaciones pasadas (${percentage}%)\n`);

if (passed === total) {
  console.log('🎉 ¡PWA configurada correctamente!');
  console.log('\n📱 Próximos pasos:');
  console.log('   1. npm run build');
  console.log('   2. vercel --prod');
  console.log('   3. Abrir en móvil y esperar 30 segundos\n');
} else {
  console.log('⚠️  Hay problemas en la configuración PWA');
  console.log('\n🔧 Solución:');
  console.log('   npm run generate-icons\n');
}

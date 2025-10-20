const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG base simplificado - Solo camarón para Aquagold
const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0077b6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#023e8a;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Fondo con esquinas redondeadas -->
  <rect width="512" height="512" rx="88" fill="url(#bgGradient)"/>
  
  <!-- Camarón estilizado centrado y más grande -->
  <g transform="translate(256, 256)" filter="url(#shadow)">
    <!-- Cuerpo principal del camarón -->
    <ellipse cx="0" cy="0" rx="120" ry="70" fill="white" opacity="0.98"/>
    
    <!-- Segmentos del cuerpo (líneas) -->
    <path d="M -40 -50 Q -40 0 -40 50 M -10 -55 Q -10 0 -10 55 M 20 -58 Q 20 0 20 58 M 50 -55 Q 50 0 50 55" 
          stroke="#0077b6" stroke-width="3" opacity="0.4" fill="none"/>
    
    <!-- Cabeza del camarón -->
    <ellipse cx="-85" cy="0" rx="35" ry="45" fill="white" opacity="0.96"/>
    
    <!-- Ojos -->
    <circle cx="-90" cy="-12" r="8" fill="#023e8a"/>
    <circle cx="-88" cy="-14" r="3" fill="white" opacity="0.9"/>
    
    <!-- Cola del camarón (abanico) -->
    <g transform="translate(120, 0)">
      <path d="M 0 -40 Q 15 -35 20 -25 Q 25 -15 25 0 Q 25 15 20 25 Q 15 35 0 40 Z" 
            fill="white" opacity="0.92"/>
      <path d="M 5 -30 L 30 -20 M 5 -15 L 35 -10 M 5 0 L 38 0 M 5 15 L 35 10 M 5 30 L 30 20" 
            stroke="#0077b6" stroke-width="2" opacity="0.5"/>
    </g>
    
    <!-- Antenas largas -->
    <g>
      <path d="M -110 -20 Q -130 -40 -140 -70 Q -145 -85 -145 -95" 
            stroke="white" stroke-width="4" fill="none" opacity="0.9" stroke-linecap="round"/>
      <path d="M -110 -10 Q -135 -25 -150 -50 Q -158 -65 -160 -75" 
            stroke="white" stroke-width="4" fill="none" opacity="0.9" stroke-linecap="round"/>
      
      <!-- Antenas cortas -->
      <path d="M -105 5 Q -125 -5 -135 -15" 
            stroke="white" stroke-width="3" fill="none" opacity="0.85" stroke-linecap="round"/>
      <path d="M -105 15 Q -120 10 -130 5" 
            stroke="white" stroke-width="3" fill="none" opacity="0.85" stroke-linecap="round"/>
    </g>
    
    <!-- Patas inferiores (6 patas) -->
    <g opacity="0.9">
      <path d="M -60 40 L -65 65 L -70 75" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M -30 45 L -32 70 L -35 85" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M 0 48 L 0 75 L -2 90" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M 30 48 L 32 75 L 35 90" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M 60 45 L 65 70 L 70 85" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M 85 40 L 92 65 L 98 75" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
    </g>
    
    <!-- Detalle de textura en el cuerpo -->
    <ellipse cx="-50" cy="0" rx="25" ry="35" fill="white" opacity="0.3"/>
    <ellipse cx="-10" cy="0" rx="30" ry="40" fill="white" opacity="0.2"/>
    <ellipse cx="30" cy="0" rx="35" ry="45" fill="white" opacity="0.2"/>
    <ellipse cx="70" cy="0" rx="30" ry="40" fill="white" opacity="0.3"/>
  </g>
  
  <!-- Burbujas decorativas sutiles -->
  <circle cx="100" cy="100" r="10" fill="white" opacity="0.15"/>
  <circle cx="420" cy="110" r="12" fill="white" opacity="0.12"/>
  <circle cx="450" cy="420" r="8" fill="white" opacity="0.15"/>
  <circle cx="80" cy="450" r="10" fill="white" opacity="0.12"/>
  <circle cx="130" cy="400" r="6" fill="white" opacity="0.1"/>
  <circle cx="380" cy="380" r="7" fill="white" opacity="0.13"/>
</svg>
`;

async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Guardar SVG base
  const svgPath = path.join(publicDir, 'icon-base.svg');
  fs.writeFileSync(svgPath, svgContent);
  console.log('✅ SVG base creado:', svgPath);
  
  // Generar PNGs en diferentes tamaños
  const sizes = [
    { size: 192, name: 'icon-192.png', purpose: 'PWA estándar' },
    { size: 512, name: 'icon-512.png', purpose: 'PWA alta resolución' },
    { size: 180, name: 'apple-touch-icon.png', purpose: 'iOS Safari' },
    { size: 32, name: 'favicon-32x32.png', purpose: 'Favicon' },
    { size: 16, name: 'favicon-16x16.png', purpose: 'Favicon pequeño' }
  ];
  
  for (const { size, name, purpose } of sizes) {
    try {
      const outputPath = path.join(publicDir, name);
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`✅ ${name} (${size}x${size}) creado - ${purpose}`);
    } catch (error) {
      console.error(`❌ Error creando ${name}:`, error.message);
    }
  }
  
  // Generar favicon.ico (16x16 + 32x32)
  try {
    const faviconPath = path.join(publicDir, 'favicon.ico');
    await sharp(Buffer.from(svgContent))
      .resize(32, 32)
      .toFormat('png')
      .toFile(faviconPath);
    console.log('✅ favicon.ico creado');
  } catch (error) {
    console.error('❌ Error creando favicon.ico:', error.message);
  }
  
  console.log('\n🎉 Todos los íconos PNG han sido generados exitosamente!');
  console.log('📱 Ahora la PWA debería ser instalable en dispositivos móviles');
}

// Ejecutar
generateIcons().catch(console.error);

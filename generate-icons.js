const fs = require('fs');

// SVG simple con texto "AR" (Aquagold Resistencias)
const createSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="${size * 0.5}" 
        font-weight="bold" fill="white">AR</text>
</svg>`;

// Guardar los SVG como iconos temporales
fs.writeFileSync('public/icon-192.svg', createSVG(192));
fs.writeFileSync('public/icon-512.svg', createSVG(512));

console.log('✅ Iconos SVG creados en public/');
console.log('📝 Nota: Son iconos temporales con las letras "AR"');

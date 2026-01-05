// scripts/verify-build.js
const fs = require('fs');
const path = require('path');

/**
 * Script de vérification post-build pour s'assurer que tous les fichiers
 * nécessaires au service worker FCM sont présents dans web/dist/
 */

const requiredFiles = [
  'web/dist/firebase-messaging-sw.js',
  'web/dist/firebase/firebase-app.js',
  'web/dist/firebase/firebase-messaging-sw.js',
];

console.log('[VERIFY] ===== Verifying Build Artifacts =====');

let allPresent = true;

for (const filePath of requiredFiles) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    console.log('[VERIFY] ✅', filePath, '-', stats.size, 'bytes');
    
    // Vérifier que ce n'est pas du HTML
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.trim().startsWith('<!DOCTYPE') || content.includes('<html>')) {
      console.error('[VERIFY] ❌ ERROR:', filePath, 'contains HTML instead of JavaScript!');
      allPresent = false;
    }
    
    // Vérifier qu'aucun fichier ne contient 'window.'
    if (content.includes('window.')) {
      console.error('[VERIFY] ❌ ERROR:', filePath, 'contains "window." which is not available in Service Workers!');
      allPresent = false;
    }
    
    // Vérifier qu'aucun fichier compat n'est présent
    if (filePath.includes('compat')) {
      console.error('[VERIFY] ❌ ERROR: Compat files should not be in dist!', filePath);
      console.error('[VERIFY] ❌ Compat files use "window" and are incompatible with Service Workers');
      allPresent = false;
    }
    
    // Vérifier qu'aucun fichier ne contient d'import vers le CDN gstatic
    if (content.includes('https://www.gstatic.com/firebasejs/')) {
      console.error('[VERIFY] ❌ ERROR:', filePath, 'contains CDN import! All imports must be local.');
      allPresent = false;
    }
  } else {
    console.error('[VERIFY] ❌ ERROR: Missing file:', filePath);
    allPresent = false;
  }
}

// Vérifier que le service worker principal est un module ES6 (pas importScripts)
const swPath = path.join(__dirname, '..', 'web', 'dist', 'firebase-messaging-sw.js');
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  // Le SW doit utiliser import (ES modules), pas importScripts
  if (swContent.includes('importScripts(')) {
    console.error('[VERIFY] ❌ ERROR: Service worker must use ES modules (import), not importScripts()!');
    console.error('[VERIFY] ❌ Service worker should be registered with type: "module"');
    allPresent = false;
  }
  
  if (!swContent.includes('import ')) {
    console.error('[VERIFY] ❌ ERROR: Service worker must use ES module imports (import ... from ...)');
    allPresent = false;
  }
  
  // Vérifier qu'il n'y a pas de compat dans le SW
  if (swContent.includes('compat')) {
    console.error('[VERIFY] ❌ ERROR: Service worker must not import compat files!');
    allPresent = false;
  }
  
  // Vérifier qu'il n'y a pas de window
  if (swContent.includes('window.')) {
    console.error('[VERIFY] ❌ ERROR: Service worker contains "window." which is not available!');
    allPresent = false;
  }
  
  // Vérifier qu'il y a un marqueur indiquant que c'est un module ES6
  if (!swContent.includes('type: "module"') && !swContent.includes('ES Module') && !swContent.includes('ESM')) {
    console.warn('[VERIFY] ⚠️ WARNING: Service worker should have a comment indicating it is an ES module');
  }
}

if (!allPresent) {
  console.error('[VERIFY] ❌ BUILD VERIFICATION FAILED');
  console.error('[VERIFY] ❌ Some required files are missing or invalid');
  process.exit(1);
}

// Vérifier qu'aucun fichier compat n'existe dans dist/firebase
const distFirebaseDir = path.join(__dirname, '..', 'web', 'dist', 'firebase');
if (fs.existsSync(distFirebaseDir)) {
  const distFiles = fs.readdirSync(distFirebaseDir);
  const compatFiles = distFiles.filter(f => f.includes('compat'));
  if (compatFiles.length > 0) {
    console.error('[VERIFY] ❌ ERROR: Compat files found in dist/firebase:', compatFiles);
    console.error('[VERIFY] ❌ Compat files use "window" and are incompatible with Service Workers');
    allPresent = false;
  }
  
  // Vérifier que les fichiers ESM requis sont présents
  const requiredEsmFiles = ['firebase-app.js', 'firebase-messaging-sw.js'];
  for (const esmFile of requiredEsmFiles) {
    const esmPath = path.join(distFirebaseDir, esmFile);
    if (!fs.existsSync(esmPath)) {
      console.error('[VERIFY] ❌ ERROR: Required ESM file missing:', esmFile);
      allPresent = false;
    } else {
      const esmContent = fs.readFileSync(esmPath, 'utf8');
      // Vérifier que c'est bien un module ES6
      if (!esmContent.includes('export') && !esmContent.includes('import')) {
        console.warn('[VERIFY] ⚠️ WARNING:', esmFile, 'may not be an ES module');
      }
    }
  }
}

if (!allPresent) {
  console.error('[VERIFY] ❌ BUILD VERIFICATION FAILED');
  console.error('[VERIFY] ❌ Some required files are missing or invalid');
  process.exit(1);
}

console.log('[VERIFY] ✅ All required files present and valid');
console.log('[VERIFY] ✅ Service worker is an ES module (uses import, not importScripts)');
console.log('[VERIFY] ✅ No compat files found');
console.log('[VERIFY] ✅ No "window." references found');
console.log('[VERIFY] ✅ No CDN imports found');
console.log('[VERIFY] ✅ Required ESM Firebase files present');
console.log('[VERIFY] ===== Build Verification Complete =====');


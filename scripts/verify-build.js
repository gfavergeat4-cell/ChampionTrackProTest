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

// Vérifier que le service worker principal est valide (classic OU module ES)
const swPath = path.join(__dirname, '..', 'web', 'dist', 'firebase-messaging-sw.js');
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  // Accepter soit classic (importScripts) soit module ES (import/export)
  const isClassicSW = swContent.includes('importScripts(');
  const isModuleSW = swContent.includes('import ') || swContent.includes('export ');
  const isHTML = swContent.trim().startsWith('<!DOCTYPE') || swContent.includes('<html>');
  
  if (isHTML) {
    console.error('[VERIFY] ❌ ERROR: Service worker contains HTML instead of JavaScript!');
    allPresent = false;
  } else if (!isClassicSW && !isModuleSW) {
    console.error('[VERIFY] ❌ ERROR: Service worker must use importScripts() (classic) OR import/export (module)!');
    allPresent = false;
  } else {
    const swType = isClassicSW ? 'classic (importScripts)' : 'ES module (import/export)';
    console.log(`[VERIFY] ✅ Service worker type: ${swType}`);
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
console.log('[VERIFY] ✅ Service worker is valid (classic or ES module)');
console.log('[VERIFY] ✅ No compat files found');
console.log('[VERIFY] ✅ No "window." references found');
console.log('[VERIFY] ✅ No CDN imports found');
console.log('[VERIFY] ✅ Required Firebase files present');
console.log('[VERIFY] ===== Build Verification Complete =====');


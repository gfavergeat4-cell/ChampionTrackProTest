# ChampionTrackPro - Audit Technique & Plan de Nettoyage

**Date:** 2026-01-03  
**Objectif:** Cartographier le repo, stabiliser le déploiement Vercel, préparer la présentation académique

---

## A) CARTOGRAPHIE DU REPO

### 1. FICHIERS CRITIQUES POUR VERCEL BUILD

#### Configuration Build (OBLIGATOIRE)
| Fichier | Rôle | Impact si supprimé |
|---------|------|-------------------|
| `package.json` | Dépendances, scripts build (`web:build`), config Expo | **BUILD CASSÉ** - Vercel ne peut pas installer les dépendances |
| `app.json` | Configuration Expo (nom, slug, version, assets) | **BUILD CASSÉ** - Expo ne peut pas générer le bundle web |
| `app.config.js` | Configuration dynamique Expo (entry point web: `index.web.js`) | **BUILD CASSÉ** - Point d'entrée web incorrect |
| `vercel.json` | Configuration Vercel (buildCommand, outputDirectory, routes, headers) | **DÉPLOIEMENT CASSÉ** - Routes SW et SPA incorrectes |
| `tsconfig.json` | Configuration TypeScript | Warnings TypeScript, mais build fonctionne |
| `babel.config.cjs` | Configuration Babel/Metro | **BUILD CASSÉ** - Transpilation JS/TS échoue |
| `metro.config.cjs` | Configuration Metro bundler | **BUILD CASSÉ** - Bundling Expo échoue |

#### Points d'Entrée (OBLIGATOIRE)
| Fichier | Rôle | Impact si supprimé |
|---------|------|-------------------|
| `index.js` | Point d'entrée React Native (iOS/Android) | **APP MOBILE CASSÉE** - Mais pas impact web |
| `index.web.js` | Point d'entrée Web (importe `web/App.web`) | **BUILD WEB CASSÉ** - Vercel ne peut pas démarrer l'app |
| `App.js` | Composant racine React Native | **APP CASSÉE** - Composant principal manquant |
| `web/App.web.js` | Composant racine Web | **BUILD WEB CASSÉ** - Point d'entrée web manquant |

#### Service Worker & Notifications (CRITIQUE POUR FCM)
| Fichier | Rôle | Impact si supprimé |
|---------|------|-------------------|
| `public/firebase-messaging-sw.js` | Service Worker ES module pour FCM | **NOTIFICATIONS CASSÉES** - SW non enregistré, pas de push |
| `public/firebase/firebase-app.js` | Module Firebase ESM (non-compat) | **SW CASSÉ** - Erreur "Cannot resolve module" |
| `public/firebase/firebase-messaging-sw.js` | Module Firebase Messaging ESM | **SW CASSÉ** - Erreur "Cannot resolve module" |
| `scripts/copy-service-worker.js` | Copie SW + Firebase modules vers `web/dist/` | **SW NON SERVI** - Fichiers absents en prod, 404 |
| `scripts/verify-build.js` | Vérifie présence fichiers SW après build | Warnings build, mais pas bloquant |

#### Configuration Firebase (OBLIGATOIRE)
| Fichier | Rôle | Impact si supprimé |
|---------|------|-------------------|
| `firebaseConfig.native.js` | Config Firebase React Native | **AUTH MOBILE CASSÉE** - Pas d'authentification iOS/Android |
| `web/firebaseConfig.web.ts` | Config Firebase Web | **AUTH WEB CASSÉE** - Pas d'authentification, pas de Firestore |
| `firebase.json` | Config Firebase CLI (Functions, Firestore rules) | **FUNCTIONS NON DÉPLOYÉES** - Mais pas impact build web |
| `firestore.rules` | Règles de sécurité Firestore | **SÉCURITÉ CASSÉE** - Accès non autorisés possibles |
| `firestore.indexes.json` | Index Firestore | **PERFORMANCES DÉGRADÉES** - Requêtes lentes |

#### Assets & Public (OBLIGATOIRE)
| Fichier/Dossier | Rôle | Impact si supprimé |
|----------------|------|-------------------|
| `assets/` | Images, icônes, splash screen | **UI CASSÉE** - Images manquantes, app fonctionne mais visuellement cassée |
| `public/assets/` | Assets statiques web | **UI CASSÉE** - Assets web manquants |
| `web/index.html` | Template HTML généré par Expo | Généré automatiquement, pas critique |

#### Code Source Principal (OBLIGATOIRE)
| Dossier | Rôle | Impact si supprimé |
|---------|------|-------------------|
| `src/` | Code source TypeScript/React | **APP CASSÉE** - Pas de composants, app vide |
| `src/services/webNotifications.ts` | Enregistrement SW + FCM token | **NOTIFICATIONS CASSÉES** - Pas d'enregistrement SW |
| `src/stitch_components/` | Composants UI principaux | **UI CASSÉE** - Écrans vides |
| `src/screens/` | Écrans React Native (legacy) | **NAVIGATION CASSÉE** - Si utilisés par App.js |
| `navigation/` | Navigation React Navigation | **NAVIGATION CASSÉE** - Pas de routing |

#### Scripts Build (OBLIGATOIRE)
| Fichier | Rôle | Impact si supprimé |
|---------|------|-------------------|
| `scripts/inject-metadata.js` | Injecte metadata SEO dans HTML | **SEO DÉGRADÉ** - Pas de meta tags, mais app fonctionne |
| `scripts/generate-og-image.js` | Génère image OG pour partage | **SEO DÉGRADÉ** - Pas d'image OG, mais app fonctionne |

---

### 2. FICHIERS "NICE TO HAVE" / DOCS

#### Documentation (Utile mais pas critique)
- `README.md` - Documentation projet (à mettre à jour)
- `DESIGN_SYSTEM_GUIDE.md` - Guide design system
- `TESTING_GUIDE.md` - Guide tests
- `FUNCTIONS_DEV_README.md` - Documentation Cloud Functions
- `WEB_PUSH_SETUP_VERIFICATION.md` - Guide setup notifications
- `VERCEL_DEPLOY.md` - Guide déploiement Vercel
- `BUILD_APK_GUIDE.md` - Guide build Android
- `RESPONSIVE_DESIGN_GUIDE.md` - Guide responsive
- Tous les autres `*.md` à la racine (guides de fix, solutions temporaires)

**Recommandation:** Déplacer dans `docs/` ou `_docs/`

---

### 3. FICHIERS LEGACY / TEST / À IGNORER

#### Fichiers de Test/Debug HTML (À SUPPRIMER)
- `import-calendar-*.html` (3 fichiers) - Tests import calendrier
- `test-*.html` (4 fichiers) - Tests Firestore, compilation, schedule
- `fix-events-now.html` - Fix temporaire
- `login-mobile.html` - Test login
- `questionnaire-mobile.html` - Test questionnaire
- `quick-firestore-test.html` - Test Firestore
- `reset-password.html` - Test reset password

**Recommandation:** Supprimer ou déplacer dans `_archive/tests-html/`

#### Scripts de Seed/Test (À ARCHIVER)
- `add-*.js` (8 fichiers) - Scripts d'ajout de données de test
- `seed-*.js` (7 fichiers) - Scripts de seed données
- `create-*.js` (4 fichiers) - Scripts création utilisateurs/admin
- `test-*.js` (3 fichiers) - Scripts de test
- `check-events.js` - Vérification événements
- `verify-*.js` (2 fichiers) - Vérifications données
- `list-teams.js` - Liste équipes
- `set-role.js` - Définition rôles

**Recommandation:** Déplacer dans `_archive/scripts-dev/` ou `tools/scripts/`

#### Scripts ICS/Import Legacy (À ARCHIVER)
- `import-*.js` (4 fichiers) - Import calendrier (legacy)
- `ics-server.js`, `firestore-ics-server.js` - Serveurs ICS (legacy)
- `proxy-ics-*.js` (3 fichiers) - Proxies ICS (legacy)
- `server-ics-import.js` - Serveur import ICS
- `simple-ics-server.js` - Serveur ICS simple
- `working-ics-server.js` - Serveur ICS fonctionnel

**Recommandation:** Déplacer dans `_archive/scripts-ics-legacy/`

#### Scripts Build Android Legacy (À ARCHIVER)
- `build-apk*.js` (4 fichiers) - Builds APK (legacy)
- `build-apk*.ps1` (3 fichiers) - Scripts PowerShell APK
- `build-android-bundle.js` - Build bundle Android
- `build-bundle-android.js` - Build bundle Android (duplicate)

**Recommandation:** Déplacer dans `_archive/scripts-android-legacy/`

#### Fichiers de Backup (À SUPPRIMER)
- `*.bak` (14 fichiers) - Backups automatiques
- `App.js.bak*` (4 fichiers) - Backups App.js
- `package.json.bak*` (2 fichiers) - Backups package.json
- `metro.config.*.bak` (2 fichiers) - Backups Metro
- `app.json.bak` - Backup app.json
- `backup-*/` (4 dossiers) - Dossiers de backup

**Recommandation:** Supprimer (sous contrôle Git, pas besoin de backups locaux)

#### Fichiers Disabled/Legacy (À ARCHIVER)
- `App.DISABLED.js` - App désactivée
- `App.test.js` - Test non utilisé
- `app.bak/` - Backup app
- `project_summary.txt` - Résumé projet (legacy)

**Recommandation:** Déplacer dans `_archive/disabled/`

#### Dossiers Build/Temp (IGNORÉS PAR GIT)
- `dist/` - Build local (généré)
- `web/dist/` - Build web (généré par Expo)
- `android-bundle/` - Bundle Android (généré)
- `temp-android-bundle/` - Temp Android (généré)
- `builds/` - Builds (généré)
- `node_modules/` - Dépendances (généré)
- `.expo/` - Cache Expo (généré)

**Recommandation:** Déjà dans `.gitignore`, pas d'action nécessaire

#### Dossiers de Contexte/Debug (À ARCHIVER)
- `cursor_context/` - Contexte Cursor AI
- `cursor_prompts/` - Prompts Cursor
- `debug/` - Fichiers debug
- `Design/` - Design files (si non utilisés)
- `tools/` - Outils (à vérifier contenu)

**Recommandation:** Déplacer dans `_archive/dev-tools/`

#### Fichiers de Configuration Legacy (À VÉRIFIER)
- `metro.config.js` - Config Metro (legacy, remplacé par `.cjs`)
- `metro.config.backup.js` - Backup Metro
- `app.config.js` vs `app.json` - Vérifier lequel est utilisé (les deux existent)

**Recommandation:** Vérifier quel fichier est actif, supprimer l'autre

---

## B) EXPLICATION TECHNIQUE DU PROJET

### Paragraphe Non-Technique (Pour Présentation Générale)

**ChampionTrackPro** est une application web de gestion d'entraînement pour athlètes et coachs. L'application permet aux coachs d'importer un calendrier d'entraînement (format ICS) et de créer des sessions pour leur équipe. Les athlètes visualisent leur planning, reçoivent des notifications pour chaque session, et remplissent un questionnaire de suivi (3 sliders) après chaque entraînement. Les données sont stockées dans une base de données cloud (Firebase Firestore) et l'application est déployée sur Vercel, une plateforme d'hébergement moderne qui déploie automatiquement l'application à chaque modification du code source.

### Paragraphe Technique (Niveau M2)

**Stack Technique:** L'application utilise **Expo** (framework React Native) avec **React Native Web** pour le rendu web, permettant un code unique pour mobile et web. Le code est écrit en **TypeScript** avec **React 19** et **React Native 0.81**. Le backend utilise **Firebase** (Auth pour l'authentification, Firestore pour la base de données NoSQL, Cloud Functions pour la logique serveur, FCM pour les notifications push). Le déploiement se fait via **Vercel** qui exécute le build via `npm run web:build` (Expo export → `web/dist/`).

**Pipeline de Déploiement:** GitHub push → Vercel détecte le push → Exécute `npm run web:build` → Expo export génère `web/dist/` → Scripts copient le Service Worker et modules Firebase → Vercel sert `web/dist/` comme site statique avec routing SPA (`vercel.json`).

**Architecture Données:** Les données proviennent de **Firestore** (collections: `users`, `teams`, `events`, `responses`). Le dashboard admin (`src/stitch_components/AdminDashboardNew.tsx`) lit les réponses des questionnaires depuis Firestore et affiche des visualisations. Les notifications FCM utilisent un **Service Worker** (module ES6) enregistré avec `type: "module"` pour gérer les push en background.

---

## C) PLAN DE NETTOYAGE SÛR

### Étape 1: Nettoyage Soft (Sans Suppression)

#### Actions Immédiates (Sans Risque)

```bash
# 1. Créer structure d'archive
mkdir -p _archive/{scripts-dev,scripts-ics-legacy,scripts-android-legacy,disabled,dev-tools,tests-html}
mkdir -p docs

# 2. Déplacer documentation
mv *.md docs/ 2>/dev/null || true
# Garder README.md à la racine

# 3. Déplacer scripts de test/dev
mv add-*.js _archive/scripts-dev/ 2>/dev/null || true
mv seed-*.js _archive/scripts-dev/ 2>/dev/null || true
mv create-*.js _archive/scripts-dev/ 2>/dev/null || true
mv test-*.js _archive/scripts-dev/ 2>/dev/null || true
mv check-events.js _archive/scripts-dev/ 2>/dev/null || true
mv verify-*.js _archive/scripts-dev/ 2>/dev/null || true
mv list-teams.js _archive/scripts-dev/ 2>/dev/null || true
mv set-role.js _archive/scripts-dev/ 2>/dev/null || true

# 4. Déplacer scripts ICS legacy
mv import-*.js _archive/scripts-ics-legacy/ 2>/dev/null || true
mv *ics*.js _archive/scripts-ics-legacy/ 2>/dev/null || true
mv proxy-ics*.js _archive/scripts-ics-legacy/ 2>/dev/null || true
mv server-ics*.js _archive/scripts-ics-legacy/ 2>/dev/null || true

# 5. Déplacer scripts Android legacy
mv build-apk*.js _archive/scripts-android-legacy/ 2>/dev/null || true
mv build-apk*.ps1 _archive/scripts-android-legacy/ 2>/dev/null || true
mv build-*-android*.js _archive/scripts-android-legacy/ 2>/dev/null || true

# 6. Déplacer fichiers HTML de test
mv *.html _archive/tests-html/ 2>/dev/null || true
# Exclure web/index.html et assets/og-image-template.html

# 7. Déplacer fichiers disabled
mv App.DISABLED.js _archive/disabled/ 2>/dev/null || true
mv App.test.js _archive/disabled/ 2>/dev/null || true
mv project_summary.txt _archive/disabled/ 2>/dev/null || true

# 8. Déplacer dossiers de contexte
mv cursor_context _archive/dev-tools/ 2>/dev/null || true
mv cursor_prompts _archive/dev-tools/ 2>/dev/null || true
mv debug _archive/dev-tools/ 2>/dev/null || true

# 9. Créer README dans _archive
echo "# Archive\n\nFichiers non-critiques pour le build Vercel.\n\n- scripts-dev/: Scripts de développement/test\n- scripts-ics-legacy/: Scripts import calendrier (legacy)\n- scripts-android-legacy/: Scripts build Android (legacy)\n- disabled/: Fichiers désactivés\n- dev-tools/: Outils de développement\n- tests-html/: Tests HTML isolés" > _archive/README.md
```

#### Créer README Principal

```markdown
# ChampionTrackPro

**The Training Intelligence**

## 🚀 Démarrage Rapide

### Développement Local
```bash
npm install
npm run web        # Démarre dev server web
npm run android    # Build Android
npm run ios        # Build iOS
```

### Build Production
```bash
npm run web:build  # Build pour Vercel (génère web/dist/)
```

## 📁 Structure du Projet

- `src/` - Code source TypeScript/React
- `public/` - Assets statiques (Service Worker, Firebase modules)
- `scripts/` - Scripts de build (copy-service-worker.js, verify-build.js)
- `web/` - Configuration web spécifique
- `docs/` - Documentation
- `_archive/` - Fichiers non-critiques (scripts legacy, tests)

## 🔧 Configuration

- `package.json` - Dépendances et scripts
- `app.json` / `app.config.js` - Configuration Expo
- `vercel.json` - Configuration Vercel (routes, headers)
- `firebase.json` - Configuration Firebase

## 📚 Documentation

Voir `docs/` pour les guides détaillés.

## 🏗️ Architecture

- **Frontend:** Expo + React Native Web + TypeScript
- **Backend:** Firebase (Auth, Firestore, Functions, FCM)
- **Deploy:** Vercel (GitHub → Auto-deploy)
```

---

### Étape 2: Nettoyage Hard (Après Tests)

#### Checklist de Tests AVANT Suppression

```bash
# 1. Build local
npm run web:build
# Vérifier: Pas d'erreurs, web/dist/ généré

# 2. Test Service Worker local
npm run web
# Ouvrir http://localhost:8081
# Console: navigator.serviceWorker.register("/firebase-messaging-sw.js", {type:"module"})
# Vérifier: Registration réussie, pas d'erreur

# 3. Test Vercel Preview
# Push sur branche test
# Vérifier: Build Vercel réussi
# Tester: Routes /firebase-messaging-sw.js et /firebase/* accessibles

# 4. Test Login
# Vérifier: Authentification Firebase fonctionne

# 5. Test Schedule Loading
# Vérifier: Données Firestore chargées, planning affiché
```

#### Actions Après Tests Réussis

```bash
# Supprimer fichiers .bak
find . -name "*.bak" -type f -delete
find . -name "*.bak-*" -type f -delete

# Supprimer dossiers backup
rm -rf backup-*
rm -rf app.bak

# Supprimer metro.config.js si metro.config.cjs existe et fonctionne
# (Vérifier d'abord que .cjs est utilisé)

# Supprimer app.json si app.config.js est utilisé (ou inversement)
# (Vérifier quel fichier est actif dans package.json/expo config)
```

---

## D) NOTIFICATIONS: ÉTAT ACTUEL + DIAGNOSTIC

### État Actuel (Dernière Modification)

**Service Worker:** Module ES6 (`public/firebase-messaging-sw.js`)
- ✅ Utilise `import` (pas `importScripts`)
- ✅ Enregistré avec `type: "module"` dans `src/services/webNotifications.ts`
- ✅ Importe modules Firebase ESM depuis `/firebase/firebase-app.js` et `/firebase/firebase-messaging-sw.js`
- ✅ Pas de référence à `window`

**Fichiers Firebase:**
- ✅ `public/firebase/firebase-app.js` (ESM, non-compat)
- ✅ `public/firebase/firebase-messaging-sw.js` (ESM, non-compat)
- ✅ Copiés vers `web/dist/firebase/` par `scripts/copy-service-worker.js`

**Configuration Vercel:**
- ✅ `vercel.json` route `/firebase-messaging-sw.js` et `/firebase/*` avant catch-all
- ✅ Headers corrects (Content-Type: application/javascript)

### Diagnostic Rapide

#### Test 1: Vérifier que le SW est servi
```javascript
// Dans console navigateur (prod)
fetch('/firebase-messaging-sw.js')
  .then(r => {
    console.log('Status:', r.status); // Doit être 200
    console.log('Content-Type:', r.headers.get('content-type')); // Doit être application/javascript
    return r.text();
  })
  .then(text => {
    console.log('SW contient "import":', text.includes('import ')); // Doit être true
    console.log('SW contient "firebase":', text.includes('firebase')); // Doit être true
    console.log('SW NE contient PAS "importScripts":', !text.includes('importScripts(')); // Doit être true
  });
```

**Résultat attendu:**
- Status: 200
- Content-Type: application/javascript
- SW contient "import": true
- SW NE contient PAS "importScripts": true

#### Test 2: Vérifier l'enregistrement du SW
```javascript
// Dans console navigateur (prod)
navigator.serviceWorker.register('/firebase-messaging-sw.js', { type: 'module', scope: '/' })
  .then(reg => {
    console.log('✅ Registration réussie');
    console.log('Scope:', reg.scope);
    console.log('Active:', !!reg.active);
    return navigator.serviceWorker.ready;
  })
  .then(reg => {
    console.log('✅ SW ready');
    return navigator.serviceWorker.getRegistrations();
  })
  .then(regs => {
    console.log('✅ Nombre de SW enregistrés:', regs.length); // Doit être 1
    regs.forEach((r, i) => {
      console.log(`SW #${i+1}:`, {
        scope: r.scope,
        activeState: r.active?.state, // Doit être "activated"
        scriptURL: r.active?.scriptURL
      });
    });
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
    console.error('Stack:', err.stack);
  });
```

**Résultat attendu:**
- Registration réussie
- Nombre de SW enregistrés: 1
- activeState: "activated"
- Pas d'erreur "window is not defined"

#### Test 3: Vérifier les fichiers Firebase
```javascript
// Dans console navigateur (prod)
Promise.all([
  fetch('/firebase/firebase-app.js').then(r => ({ name: 'firebase-app.js', status: r.status, type: r.headers.get('content-type') })),
  fetch('/firebase/firebase-messaging-sw.js').then(r => ({ name: 'firebase-messaging-sw.js', status: r.status, type: r.headers.get('content-type') }))
])
  .then(results => {
    results.forEach(r => {
      console.log(`${r.name}:`, {
        status: r.status, // Doit être 200
        contentType: r.type // Doit être application/javascript
      });
    });
  });
```

**Résultat attendu:**
- firebase-app.js: status 200, contentType application/javascript
- firebase-messaging-sw.js: status 200, contentType application/javascript

### Causes Probables si Échec

1. **SW non servi (404):**
   - Cause: `scripts/copy-service-worker.js` n'a pas copié le fichier
   - Fix: Vérifier que le script s'exécute dans `package.json` → `web:build`

2. **SW servi en HTML (200 mais contenu HTML):**
   - Cause: Route Vercel incorrecte, catch-all avant `/firebase-messaging-sw.js`
   - Fix: Vérifier `vercel.json` → rewrites (SW doit être AVANT catch-all)

3. **Erreur "window is not defined":**
   - Cause: Fichiers Firebase compat utilisés (contiennent `window`)
   - Fix: Vérifier que `public/firebase/` contient les fichiers ESM (pas compat)

4. **Erreur "Cannot resolve module":**
   - Cause: Fichiers Firebase non copiés vers `web/dist/firebase/`
   - Fix: Vérifier `scripts/copy-service-worker.js` copie bien les fichiers

5. **Registration échoue silencieusement:**
   - Cause: SW contient une erreur de syntaxe ou import échoue
   - Fix: Vérifier logs DevTools → Application → Service Workers → Errors

### Correctif Minimal si Problème

```bash
# 1. Vérifier que les fichiers existent
ls -la public/firebase-messaging-sw.js
ls -la public/firebase/firebase-app.js
ls -la public/firebase/firebase-messaging-sw.js

# 2. Rebuild local
npm run web:build

# 3. Vérifier que les fichiers sont dans web/dist/
ls -la web/dist/firebase-messaging-sw.js
ls -la web/dist/firebase/

# 4. Vérifier vercel.json
cat vercel.json | grep -A 5 "firebase-messaging-sw"

# 5. Push et vérifier build Vercel
git add .
git commit -m "Fix: Verify SW files"
git push
# Vérifier build Vercel → Logs
```

---

## RÉSUMÉ EXÉCUTIF

### Fichiers à NE JAMAIS SUPPRIMER
- `package.json`, `app.json`, `app.config.js`, `vercel.json`
- `index.js`, `index.web.js`, `App.js`, `web/App.web.js`
- `public/firebase-messaging-sw.js`, `public/firebase/*.js`
- `scripts/copy-service-worker.js`, `scripts/verify-build.js`
- `src/`, `navigation/`, `web/firebaseConfig.web.ts`
- `firebase.json`, `firestore.rules`

### Fichiers à ARCHIVER (Nettoyage Soft)
- Tous les `*.md` (sauf README.md) → `docs/`
- Scripts `add-*.js`, `seed-*.js`, `test-*.js` → `_archive/scripts-dev/`
- Scripts ICS legacy → `_archive/scripts-ics-legacy/`
- Scripts Android legacy → `_archive/scripts-android-legacy/`
- Fichiers HTML de test → `_archive/tests-html/`

### Fichiers à SUPPRIMER (Après Tests)
- Tous les `*.bak`
- Dossiers `backup-*`, `app.bak`
- `metro.config.js` (si `.cjs` fonctionne)

### Prochaines Étapes
1. ✅ Exécuter nettoyage soft (déplacer fichiers)
2. ✅ Tester build local + Vercel preview
3. ✅ Exécuter tests notifications (3 tests console)
4. ✅ Si tout OK → Nettoyage hard (supprimer .bak)
5. ✅ Mettre à jour README.md avec structure finale

---

**Rapport généré le:** 2026-01-03  
**Prochaine révision:** Après nettoyage soft + tests


# SB · Générer l'APK en 5 minutes (cloud build)

## Pourquoi le cloud ?
Compiler un APK Android nécessite ~3 GB d'outils (Android SDK, JDK 17, Gradle, build-tools…).
GitHub Actions le fait gratuitement pour toi en 5 min.

## Étapes (à faire UNE SEULE FOIS)

### 1. Crée un compte GitHub gratuit
👉 https://github.com/signup

### 2. Crée un nouveau dépôt
- Clique sur "+" → "New repository"
- Nom : `sb-app`
- Public ou Privé (peu importe)
- **NE PAS** cocher "Initialize with README"
- Clique "Create repository"

### 3. Pousse le code (depuis PowerShell dans `d:\sport`)

Vérifie que git est installé :
```powershell
git --version
```
Si non installé : https://git-scm.com/download/win

Puis (remplace `TON-USER` par ton pseudo GitHub) :
```powershell
cd d:\sport
git init
git add .
git commit -m "SB v1"
git branch -M main
git remote add origin https://github.com/TON-USER/sb-app.git
git push -u origin main
```

### 4. Récupère ton APK
- Va sur ton dépôt GitHub → onglet **Actions**
- Clique sur le build "Build SB APK" (vert ✓ après ~5 min)
- En bas → section **Artifacts** → télécharge **SB-apk**
- Dézippe → tu as **SB.apk**

### 5. Installe sur ton S25 Ultra
- Transfère `SB.apk` sur le téléphone (USB / Telegram / Drive)
- Ouvre le fichier → autorise "Sources inconnues" si demandé
- Installe
- L'app **SB** apparaît dans tes apps avec son icône 🎉

---

## Build local (alternative — long)
Si tu préfères installer Android Studio (~3 GB) :
1. https://developer.android.com/studio
2. Pendant l'installation, accepte le SDK
3. Ouvre `d:\sport\sb-apk\android` dans Android Studio
4. Build → Build Bundle(s) / APK(s) → Build APK(s)
5. APK généré dans `sb-apk/android/app/build/outputs/apk/debug/`

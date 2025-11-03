# Migration Resend - Guide Complet

## 📋 Contexte

Actuellement, l'application utilise **votre compte Resend** pour envoyer les notifications par email. Ce guide explique comment migrer vers **le compte Resend de votre client** quand il sera prêt.

---

## ⏰ Quand effectuer cette migration ?

**Avant la mise en production définitive chez votre client**, vous devrez :
1. Demander à votre client de créer son compte Resend
2. Récupérer sa clé API
3. Changer 2 lignes dans le fichier `.env`

---

## 🚀 Étape 1 : Votre client crée son compte Resend

### 1.1 Créer le compte
1. Aller sur : https://resend.com
2. Cliquer sur "Sign Up"
3. Créer un compte avec l'email professionnel du cabinet

### 1.2 Obtenir la clé API
1. Se connecter sur https://resend.com/api-keys
2. Cliquer sur "Create API Key"
3. Nom suggéré : `Grapho Production`
4. Permissions : **Full Access** (ou au minimum "Sending access")
5. Cliquer sur "Create"
6. **⚠️ IMPORTANT** : Copier la clé immédiatement (format : `re_xxxxxxxxxxxxx`)
7. La clé ne sera plus visible après fermeture de la fenêtre

---

## 🔧 Étape 2 : Mettre à jour la configuration

### 2.1 Modifier le fichier `.env`

Ouvrir le fichier `.env` sur le serveur de production et modifier **uniquement ces 2 lignes** :

```env
# Remplacer cette ligne :
VITE_RESEND_API_KEY=re_votre_ancienne_clé

# Par la nouvelle clé du client :
VITE_RESEND_API_KEY=re_nouvelle_clé_du_client


# Remplacer cette ligne :
VITE_ADMIN_EMAIL=votre@email.com

# Par l'email du cabinet :
VITE_ADMIN_EMAIL=cabinet@example.com
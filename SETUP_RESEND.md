# Configuration Resend pour l'envoi d'emails

## 📋 Prérequis

Vous devez avoir :
1. Un compte Resend.com avec une clé API
2. Supabase CLI installé localement
3. Accès au dashboard Supabase de votre projet

---

## 🚀 ÉTAPE 1 : Obtenir la clé API Resend

1. Allez sur https://resend.com/api-keys
2. Cliquez sur **"Create API Key"**
3. Nom : `Grapho Production`
4. Permissions : **Full Access**
5. Cliquez sur **"Create"**
6. **COPIEZ immédiatement** la clé (format : `re_xxxxxxxxxxxxx`)
   - ⚠️ Elle ne sera plus visible après !

---

## 🔧 ÉTAPE 2 : Configurer les secrets Supabase

### Option A : Via Supabase CLI (RECOMMANDÉ)

```bash
# 1. Se connecter à Supabase
supabase login

# 2. Lier votre projet
supabase link --project-ref votre-project-ref

# 3. Configurer les secrets
supabase secrets set RESEND_API_KEY=re_votre_cle_resend
supabase secrets set ADMIN_EMAIL=votre@email.com
supabase secrets set APP_NAME=Grapho
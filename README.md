Grapho# Grapho

Application web de gestion de cabinet de graphothérapie.

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)
![Netlify](https://img.shields.io/badge/Netlify-Deployed-00C7B7?logo=netlify)

## Présentation

Grapho est une solution complète pour la gestion d'un cabinet de graphothérapie. Elle permet au praticien de gérer ses clients, rendez-vous, documents et communications, tout en offrant aux clients un espace dédié pour suivre leur parcours.

## Fonctionnalités

### Site public

- **Accueil** : Présentation du cabinet et de la graphothérapie
- **Méthode** : Explication détaillée de l'approche thérapeutique
- **Tarifs** : Grille tarifaire des prestations
- **FAQ** : Réponses aux questions fréquentes
- **Contact** : Formulaire de contact et informations pratiques
- **Réservation en ligne** : Prise de rendez-vous avec calendrier interactif

### Espace Administration

| Fonctionnalité | Description |
|----------------|-------------|
| Tableau de bord | Vue d'ensemble, statistiques, prochains rendez-vous |
| Gestion clients | Liste, recherche, création, archivage |
| Fiche client | Informations, historique des séances, prescriptions |
| Documents | Upload, organisation, partage sécurisé |
| Messagerie | Communication avec les clients |
| Paramètres | Mot de passe, gestion des disponibilités |

### Espace Client

| Fonctionnalité | Description |
|----------------|-------------|
| Tableau de bord | Résumé et prochain rendez-vous |
| Mes rendez-vous | Liste et possibilité d'annulation |
| Mes documents | Accès aux documents partagés |
| Messagerie | Communication avec le praticien |
| Mes informations | Consultation des données personnelles |

### Système de réservation

- **Premier rendez-vous** (30 min) : Ouvert à tous, création de compte automatique
- **Séance de remédiation** (60 min) : Réservé aux clients existants
- **Gestion des disponibilités** : Horaires configurables (période scolaire / vacances)
- **Détection automatique** : Jours fériés français et vacances scolaires Zone B

## Stack technique

| Technologie | Usage |
|-------------|-------|
| React 18 + TypeScript | Interface utilisateur |
| Vite | Build et développement |
| Tailwind CSS | Styles |
| React Router v7 | Navigation |
| Supabase | Authentification, base de données, stockage |
| Supabase Edge Functions | Logique serveur (emails, admin) |
| Resend | Service d'envoi d'emails |
| Netlify | Hébergement et CDN |

## Installation

### Prérequis

- Node.js 18 ou supérieur
- npm
- Compte [Supabase](https://supabase.com)
- Compte [Resend](https://resend.com) (pour les emails)
- Compte [Netlify](https://netlify.com) (pour le déploiement)

### Installation locale

```bash
# Cloner le repository
git clone https://github.com/LDelorenzo41/Grapho.git
cd Grapho

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Lancer le serveur de développement
npm run dev


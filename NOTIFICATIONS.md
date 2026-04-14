# 🔔 Système de Notifications AmenNet

## Vue d'ensemble

Le système de notifications permet aux utilisateurs de recevoir des alertes en temps réel pour les événements importants sur la plateforme AmenNet.

## Types de Notifications

### 1. **Demande de Compagnon** 
- **Type:** `companion_request`
- **Déclencheur:** Quand quelqu'un vous envoie une demande de compagnon de foi
- **Format:** "Nouvelle demande de compagnon"
- **Icône:** 👥 (Users)
- **Couleur:** Bleu

### 2. **Acceptation de Demande**
- **Type:** `companion_accepted`
- **Déclencheur:** Quand quelqu'un accepte votre demande de compagnon de foi
- **Format:** "Demande acceptée"
- **Icône:** ✅ (CheckCircle2)
- **Couleur:** Vert

### 3. **Nouveau Message**
- **Type:** `new_message`
- **Déclencheur:** Quand vous recevez un message d'un compagnon de foi
- **Format:** "Nouveau message"
- **Icône:** 💬 (MessageCircle)
- **Couleur:** Orange (#F97316)

## Architecture

### Structure Firestore

```
users/{userId}/
  ├── notifications/ (sous-collection)
  │   └── {notificationId} (document)
  │       ├── type: string ('companion_request' | 'companion_accepted' | 'new_message')
  │       ├── title: string
  │       ├── message: string
  │       ├── fromUserId: string (optionnel)
  │       ├── fromUserName: string
  │       ├── read: boolean
  │       └── createdAt: timestamp
```

### Fichiers Créés

#### 1. **`src/pages/Notifications.jsx`**
Page complète pour afficher toutes les notifications avec:
- Liste des notifications avec pagination
- Marquage comme lue/non lue
- Suppression de notification
- Suppression en masse
- Formatage du temps relatif (il y a 5min, il y a 2h, etc.)
- Icônes colorées selon le type de notification
- Badges pour les notifications non lues

#### 2. **`src/services/notificationsService.js`**
Service utilitaire avec trois fonctions:
```javascript
createCompanionRequestNotification(recipientUserId, senderUserId, senderName)
createCompanionAcceptedNotification(recipientUserId, acceptorName)
createNewMessageNotification(recipientUserId, senderUserId, senderName, messagePreview)
```

### Intégrations

#### FaithCompanions.jsx
- ✅ Crée une notification quand vous envoyez une demande
- ✅ Crée une notification quand vous acceptez une demande

#### Chat.jsx
- ✅ Crée une notification quand vous envoyez un message
- ✅ Inclut un aperçu du message (100 caractères max)

#### DashboardLayout.jsx
- ✅ Onglet "Notifications" avec icône cloche
- ✅ Badge rouge pour les notifications non lues
- ✅ Compte en temps réel des notifications non lues

#### App.jsx
- ✅ Route `/dashboardLayout/notifications` vers Notifications.jsx

## Features

### 🔴 Badges de Notifications
- **Positon:** Onglet Notifications dans la navigation inférieure
- **Couleur:** Rouge (#EF4444)
- **Affichage:** Badge numérique avec le nombre de notifications non lues

### 📌 États de Notification
- **Non lue:** Fond blanc avec bordure orange (#F97316) à gauche
- **Lue:** Arrière-plan grisé (dépend du type)

### ⏱️ Timestamps
- Moins d'une minute: "À l'instant"
- Moins d'une heure: "5min", "30min"
- Moins d'un jour: "2h", "8h"
- Moins de 7 jours: "1j", "5j"
- Au-delà: Date au format français

### 🎨 Design
- Consistent avec la palette #F97316 (orange primaire)
- Icônes Lucide React
- Design responsive (mobile-first)
- Espacements Tailwind standard

## Fonctionnement Détaillé

### Création d'une Notification

1. **Demande de Compagnon:**
```javascript
// Dans FaithCompanions.jsx - handleSendRequest()
await createCompanionRequestNotification(
  targetUserId,              // Destinataire
  user.uid,                 // Qui envoie
  senderName               // Nom du demandeur
)
```

2. **Acceptation:**
```javascript
// Dans FaithCompanions.jsx - handleAcceptRequest()
await createCompanionAcceptedNotification(
  senderId,                // Qui a envoyé la demande
  acceptorName            // Nom de l'accepteur
)
```

3. **Message:**
```javascript
// Dans Chat.jsx - handleSendMessage()
await createNewMessageNotification(
  companion.id,           // Destinataire
  user.uid,              // Qui envoie
  senderName,            // Nom de l'expéditeur
  messagePreview         // Aperçu du message
)
```

### Lectures des Notifications
- Real-time `onSnapshot` sur `users/{userId}/notifications`
- Query: `where('read', '==', false)` pour les non lues
- Ordre: `orderBy('createdAt', 'desc')`

## Sécurité

### Règles Firestore
```javascript
// Notifications - Sous-collection
match /users/{userId}/notifications/{document=**} {
  allow read: if isOwner(userId);           // Seul le propriétaire peut lire
  allow create: if isAuthenticated();       // Tout utilisateur peut créer
  allow update: if isOwner(userId);         // Seul le propriétaire peut mettre à jour
  allow delete: if isOwner(userId);         // Seul le propriétaire peut supprimer
}
```

## Roadmap Futur

- [ ] Notifications push (navigateur/mobile)
- [ ] Email digest des notifications
- [ ] Paramètres de notification (activer/désactiver par type)
- [ ] Son de notification
- [ ] Notification de "typage" quand quelqu'un compose
- [ ] Notifications de like/commentaire sur une publication
- [ ] Notifications de partage

## Dépannage

### Les notifications ne s'affichent pas
1. Vérifier que les règles Firestore sont à jour (voir FIREBASE_RULES.md)
2. Vérifier que la fonction `createNotification*` est appelée après l'action
3. Vérifier la console pour les erreurs Firebase

### Les notifications non lues ne se comptent pas
1. Vérifier que le champ `read` est booléen et non string
2. Vérifier la query `where('read', '==', false)`

### Performance lente
1. Ajouter un index Firestore sur `(userId, read, createdAt)`
2. Limiter les notifications à 100 les plus récentes
3. Archiver les anciennes notifications (30 jours+)

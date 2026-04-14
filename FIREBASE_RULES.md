# Firebase Firestore Security Rules

## 📋 Configuration Recommandée

Ces règles de sécurité garantissent que **seuls les propriétaires** peuvent modifier/supprimer leurs données.

### 🔒 Copier dans Firestore Rules (Firebase Console)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Autorise l'authentification
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Vérifie que l'utilisateur est le propriétaire
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // USERS - Chaque utilisateur peut lire/écrire son propre document
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId) && request.resource.data.email == request.auth.token.email;
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId);
      
      // COMPANION REQUESTS - Sous-collection des demandes de compagnon
      match /companionRequests/{document=**} {
        allow read: if isOwner(userId);
        allow create: if isAuthenticated();
        allow delete: if isOwner(userId);
      }
      
      // OUTGOING REQUESTS - Sous-collection des demandes envoyées
      match /outgoingRequests/{document=**} {
        allow read: if isOwner(userId);
        allow create: if isAuthenticated();
        allow delete: if isOwner(userId);
      }
      
      // FAITH COMPANIONS - Sous-collection des compagnons de foi
      match /faithCompanions/{document=**} {
        allow read: if isOwner(userId);
        allow create: if isAuthenticated();
        allow delete: if isOwner(userId);
      }
      
      // NOTIFICATIONS - Sous-collection des notifications
      match /notifications/{document=**} {
        allow read: if isOwner(userId);
        allow create: if isAuthenticated();
        allow update: if isOwner(userId);
        allow delete: if isOwner(userId);
      }
    }
    
    // POSTS - Chacun peut lire, mais seul l'auteur peut modifier/supprimer
    match /posts/{postId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.authorId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.authorId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.authorId == request.auth.uid;
      
      // LIKES - Sous-collection des likes du post
      match /likes/{userId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() && request.auth.uid == userId;
        allow delete: if isAuthenticated() && request.auth.uid == userId;
      }
      
      // COMMENTS - Sous-collection des commentaires
      match /comments/{commentId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
        allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
        allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
        
        // COMMENT LIKES - Sous-collection des likes d'un commentaire
        match /likes/{userId} {
          allow read: if isAuthenticated();
          allow create: if isAuthenticated() && request.auth.uid == userId;
          allow delete: if isAuthenticated() && request.auth.uid == userId;
        }
      }
    }
    
    // CONVERSATIONS - Real-time chat
    match /conversations/{conversationId} {
      allow read: if isAuthenticated() && (conversationId.contains(request.auth.uid));
      allow create: if isAuthenticated();
      
      // MESSAGES - Sous-collection des messages
      match /messages/{messageId} {
        allow read: if isAuthenticated() && (conversationId.contains(request.auth.uid));
        allow create: if isAuthenticated() && request.resource.data.senderId == request.auth.uid;
        allow delete: if isAuthenticated() && resource.data.senderId == request.auth.uid;
      }
    }
    
    // SAVED POSTS - Chaque utilisateur peut sauvegarder/supprimer ses propres posts
    match /savedPosts/{document=**} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
  }
}
```

## 📍 Où les appliquer?

1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionner ton projet
3. Aller à **Firestore Database** > **Rules**
4. Remplacer les règles existantes par le code ci-dessus
5. Cliquer sur **Publish**

## ✅ Avantages de ces règles:

- ✅ Les utilisateurs ne peuvent **modifier que leurs données**
- ✅ Les **posts ne peuvent être supprimés que par l'auteur**
- ✅ Les **commentaires ne peuvent être supprimés que par le créateur**
- ✅ Protection contre les modifications non-autorisées
- ✅ Structure cohérente et maintenable

## 🧪 Test des règles:

Après la publication, tu peux tester directement dans Firebase Console:
- Essayer de modifier un post d'un autre utilisateur → ❌ Refusé
- Modifier ton propre post → ✅ Accepté
- Supprimer un commentaire d'un autre → ❌ Refusé
- Supprimer ton commentaire → ✅ Accepté

## 🔐 Sécurité Frontend vs Backend:

L'app a maintenant **deux niveaux de sécurité**:

1. **Frontend** (dans Feed.jsx): Vérifications client pour UX rapide
2. **Backend** (Firebase Rules): Vérifications serveur (impiratique)

Le backend empêche les utilisateurs malveillants de contourner les contrôles frontend.

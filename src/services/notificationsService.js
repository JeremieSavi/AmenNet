import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './fiebase'

/**
 * Créer une notification pour les demandes de compagnon
 */
export const createCompanionRequestNotification = async (recipientUserId, senderUserId, senderName) => {
  try {
    const notificationRef = doc(collection(db, 'users', recipientUserId, 'notifications'))
    await setDoc(notificationRef, {
      type: 'companion_request',
      title: 'Nouvelle demande de compagnon',
      message: `${senderName} vous a demandé d'être compagnon de foi`,
      fromUserId: senderUserId,
      fromUserName: senderName,
      read: false,
      createdAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Erreur création notification:', error)
  }
}

/**
 * Créer une notification pour l'acceptation de demande
 */
export const createCompanionAcceptedNotification = async (recipientUserId, acceptorName) => {
  try {
    const notificationRef = doc(collection(db, 'users', recipientUserId, 'notifications'))
    await setDoc(notificationRef, {
      type: 'companion_accepted',
      title: 'Demande acceptée',
      message: `${acceptorName} a accepté votre demande de compagnon de foi`,
      fromUserName: acceptorName,
      read: false,
      createdAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Erreur création notification:', error)
  }
}

/**
 * Créer une notification pour un nouveau message
 */
export const createNewMessageNotification = async (recipientUserId, senderUserId, senderName, messagePreview) => {
  try {
    const notificationRef = doc(collection(db, 'users', recipientUserId, 'notifications'))
    await setDoc(notificationRef, {
      type: 'new_message',
      title: 'Nouveau message',
      message: messagePreview || `${senderName} vous a envoyé un message`,
      fromUserId: senderUserId,
      fromUserName: senderName,
      read: false,
      createdAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Erreur création notification:', error)
  }
}

/**
 * Créer une notification pour un like sur un post
 */
export const createPostLikedNotification = async (recipientUserId, likerId, likerName, postContent) => {
  try {
    const notificationRef = doc(collection(db, 'users', recipientUserId, 'notifications'))
    await setDoc(notificationRef, {
      type: 'post_liked',
      title: '❤️ Votre post a été aimé',
      message: `${likerName} a aimé votre publication: "${postContent.substring(0, 50)}${postContent.length > 50 ? '...' : ''}"`,
      fromUserId: likerId,
      fromUserName: likerName,
      read: false,
      createdAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Erreur création notification:', error)
  }
}

/**
 * Créer une notification pour un commentaire sur un post
 */
export const createPostCommentedNotification = async (recipientUserId, commenterId, commenterName, postContent, commentContent) => {
  try {
    const notificationRef = doc(collection(db, 'users', recipientUserId, 'notifications'))
    await setDoc(notificationRef, {
      type: 'post_commented',
      title: '💬 Nouveau commentaire sur votre post',
      message: `${commenterName} a commenté: "${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}"`,
      fromUserId: commenterId,
      fromUserName: commenterName,
      read: false,
      createdAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Erreur création notification:', error)
  }
}

/**
 * Créer une notification quand une église publie
 */
export const createChurchPublishedNotification = async (recipientUserId, churchId, churchName, postContent, postCategory) => {
  try {
    const categoryEmoji = {
      spirituel: '✨',
      opportunites: '💼',
      evenements: '📅',
      temoignages: '💝'
    }[postCategory] || '📝'
    
    const notificationRef = doc(collection(db, 'users', recipientUserId, 'notifications'))
    await setDoc(notificationRef, {
      type: 'church_published',
      title: `${categoryEmoji} Nouvelle publication de ${churchName}`,
      message: postContent.substring(0, 80) + (postContent.length > 80 ? '...' : ''),
      fromUserId: churchId,
      fromUserName: churchName,
      postCategory: postCategory,
      read: false,
      createdAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Erreur création notification:', error)
  }
}

/**
 * Créer une notification quand une opportunité est publiée
 */
export const createOpportunityPublishedNotification = async (recipientUserId, opportunityId, authorName, opportunityTitle, opportunityType) => {
  try {
    const typeEmoji = {
      'Freelance': '💻',
      'Stage': '🎓',
      'Emploi': '💼',
      'Bénévolat': '🤝'
    }[opportunityType] || '🎯'
    
    const notificationRef = doc(collection(db, 'users', recipientUserId, 'notifications'))
    await setDoc(notificationRef, {
      type: 'opportunity_published',
      title: `${typeEmoji} Nouvelle opportunité de ${authorName}`,
      message: opportunityTitle.substring(0, 80) + (opportunityTitle.length > 80 ? '...' : ''),
      fromUserName: authorName,
      opportunityId: opportunityId,
      opportunityType: opportunityType,
      read: false,
      createdAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Erreur création notification opportunité:', error)
  }
}

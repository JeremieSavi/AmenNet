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

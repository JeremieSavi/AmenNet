import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  increment,
  query,
  where,
  onSnapshot
} from 'firebase/firestore'

import { db } from './fiebase'

/**
 * Toggle like sur une opportunité
 */
export const toggleOpportunityLike = async (opportunityId, userId) => {
  const likeRef = doc(db, 'opportunities', opportunityId, 'likes', userId)
  const oppRef = doc(db, 'opportunities', opportunityId)

  const likeDoc = await getDoc(likeRef)

  if (likeDoc.exists()) {
    // Retirer le like
    await deleteDoc(likeRef)
    await updateDoc(oppRef, {
      likes: increment(-1)
    })
    return false
  } else {
    // Ajouter le like
    await setDoc(likeRef, {
      userId,
      createdAt: new Date()
    })
    await updateDoc(oppRef, {
      likes: increment(1)
    })
    return true
  }
}

/**
 * Vérifier si une opportunité est aimée par l'utilisateur
 */
export const isOpportunityLiked = async (opportunityId, userId) => {
  const likeRef = doc(db, 'opportunities', opportunityId, 'likes', userId)
  const likeDoc = await getDoc(likeRef)
  return likeDoc.exists()
}

/**
 * Récupérer les likes d'une opportunité en temps réel
 */
export const listenOpportunityLikes = (opportunityId, callback) => {
  const likesRef = collection(db, 'opportunities', opportunityId, 'likes')

  return onSnapshot(likesRef, (snapshot) => {
    const likes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(likes.length)
  })
}

/**
 * Récupérer le nombre de likes
 */
export const getOpportunityLikesCount = async (opportunityId) => {
  const likesSnapshot = await getDocs(
    collection(db, 'opportunities', opportunityId, 'likes')
  )
  return likesSnapshot.size
}

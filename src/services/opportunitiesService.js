import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  where,
  updateDoc,
  getDoc,
  setDoc,
  increment
} from 'firebase/firestore'

import { db } from './fiebase'

/**
 * Créer une nouvelle opportunité
 */
export const createOpportunity = async (data, user, userData) => {
  try {
    const opportunityData = {
      title: data.title,
      description: data.description,
      type: data.type, // emploi, stage, bourse, investissement, formation
      location: data.location,
      link: data.link || null,
      deadline: data.deadline || null,
      authorId: user.uid,
      authorName: userData?.accountType === 'Église' ? userData.egliseName : `${userData?.prenom} ${userData?.nom}`,
      authorAccountType: userData?.accountType || 'Fidèle',
      authorEgliseName: userData?.egliseName || null,
      createdAt: serverTimestamp(),
      views: 0,
      saves: 0
    }

    return await addDoc(collection(db, 'opportunities'), opportunityData)
  } catch (error) {
    console.error('Erreur création opportunité:', error)
    throw error
  }
}

/**
 * Écouter les opportunités en temps réel
 */
export const listenOpportunities = (callback) => {
  const q = query(
    collection(db, 'opportunities'),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(q, (snapshot) => {
    const opportunities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }))
    callback(opportunities)
  })
}

/**
 * Supprimer une opportunité
 */
export const deleteOpportunity = async (opportunityId) => {
  try {
    await deleteDoc(doc(db, 'opportunities', opportunityId))
  } catch (error) {
    console.error('Erreur suppression opportunité:', error)
    throw error
  }
}

/**
 * Sauvegarder une opportunité
 */
export const saveOpportunity = async (userId, opportunityId) => {
  try {
    const saveRef = doc(db, 'savedOpportunities', `${userId}_${opportunityId}`)
    const saveSnap = await getDoc(saveRef)
    
    if (saveSnap.exists()) {
      await deleteDoc(saveRef)
      return false
    } else {
      await setDoc(saveRef, {
        userId,
        opportunityId,
        createdAt: serverTimestamp()
      })
      return true
    }
  } catch (error) {
    console.error('Erreur sauvegarde opportunité:', error)
    throw error
  }
}

/**
 * Vérifier si une opportunité est sauvegardée
 */
export const checkOpportunitySaved = async (userId, opportunityId) => {
  try {
    const saveRef = doc(db, 'savedOpportunities', `${userId}_${opportunityId}`)
    const saveSnap = await getDoc(saveRef)
    return saveSnap.exists()
  } catch (error) {
    console.error('Erreur vérification sauvegarde:', error)
    return false
  }
}

/**
 * Obtenir les opportunités sauvegardées d'un utilisateur
 */
export const getSavedOpportunities = async (userId) => {
  try {
    const q = query(
      collection(db, 'savedOpportunities'),
      where('userId', '==', userId)
    )
    const snapshot = await getDocs(q)
    
    const savedOps = await Promise.all(
      snapshot.docs.map(async (savedDoc) => {
        const opRef = doc(db, 'opportunities', savedDoc.data().opportunityId)
        const opSnap = await getDoc(opRef)
        return opSnap.exists() 
          ? { 
              id: savedDoc.data().opportunityId, 
              ...opSnap.data(),
              createdAt: opSnap.data().createdAt?.toDate?.() || new Date()
            } 
          : null
      })
    )
    
    return savedOps.filter(op => op !== null)
  } catch (error) {
    console.error('Erreur récupération opportunités sauvegardées:', error)
    return []
  }
}

/**
 * Incrémenter les vues d'une opportunité
 */
export const incrementOpportunityViews = async (opportunityId) => {
  try {
    await updateDoc(doc(db, 'opportunities', opportunityId), {
      views: increment(1)
    })
  } catch (error) {
    console.error('Erreur incrément vues:', error)
  }
}

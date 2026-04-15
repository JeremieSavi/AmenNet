import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  increment,
  getDoc,
  setDoc
} from 'firebase/firestore'

import { db } from './fiebase'

/**
 * Ajouter une question/commentaire à une opportunité
 */
export const addOpportunityQuestion = async (opportunityId, text, user, userData) => {
  const questionRef = await addDoc(
    collection(db, 'opportunities', opportunityId, 'questions'),
    {
      text,
      userId: user.uid,
      userName: userData?.accountType === 'Église' ? userData.egliseName : `${userData?.prenom} ${userData?.nom}`,
      userAccountType: userData?.accountType || 'Fidèle',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0
    }
  )

  // Incrémenter le compteur de questions
  const oppRef = doc(db, 'opportunities', opportunityId)
  await updateDoc(oppRef, {
    questions: increment(1)
  })

  return questionRef
}

/**
 * Écouter les questions en temps réel
 */
export const listenOpportunityQuestions = (opportunityId, callback) => {
  const q = query(
    collection(db, 'opportunities', opportunityId, 'questions'),
    orderBy('createdAt', 'asc')
  )

  return onSnapshot(q, (snapshot) => {
    const questions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(questions)
  })
}

/**
 * Supprimer une question
 */
export const deleteOpportunityQuestion = async (opportunityId, questionId) => {
  const questionRef = doc(db, 'opportunities', opportunityId, 'questions', questionId)
  await deleteDoc(questionRef)

  const oppRef = doc(db, 'opportunities', opportunityId)
  await updateDoc(oppRef, {
    questions: increment(-1)
  })
}

/**
 * Mettre à jour une question
 */
export const updateOpportunityQuestion = async (opportunityId, questionId, text) => {
  const questionRef = doc(db, 'opportunities', opportunityId, 'questions', questionId)
  return updateDoc(questionRef, {
    text,
    updatedAt: serverTimestamp()
  })
}

/**
 * Aimer une question
 */
export const toggleQuestionLike = async (opportunityId, questionId, userId) => {
  const likeRef = doc(db, 'opportunities', opportunityId, 'questions', questionId, 'likes', userId)
  const questionRef = doc(db, 'opportunities', opportunityId, 'questions', questionId)

  const likeDoc = await getDoc(likeRef)

  if (likeDoc.exists()) {
    await deleteDoc(likeRef)
    await updateDoc(questionRef, {
      likes: increment(-1)
    })
    return false
  } else {
    await setDoc(likeRef, {
      userId,
      createdAt: new Date()
    })
    await updateDoc(questionRef, {
      likes: increment(1)
    })
    return true
  }
}

/**
 * Récupérer le nombre de likes d'une question
 */
export const getQuestionLikesCount = async (opportunityId, questionId) => {
  const likesSnapshot = await getDocs(
    collection(db, 'opportunities', opportunityId, 'questions', questionId, 'likes')
  )
  return likesSnapshot.size
}

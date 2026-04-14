import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy
} from "firebase/firestore"

import { db } from "./fiebase"

export const toggleSavePost = async (postId, userId) => {
  const saveRef = doc(db, "savedPosts", `${userId}_${postId}`)
  const saveDoc = await getDoc(saveRef)

  if (saveDoc.exists()) {
    await deleteDoc(saveRef)
    return false
  } else {
    await setDoc(saveRef, {
      postId,
      userId,
      createdAt: new Date()
    })
    return true
  }
}

export const isPostSaved = async (postId, userId) => {
  const saveRef = doc(db, "savedPosts", `${userId}_${postId}`)
  const saveDoc = await getDoc(saveRef)
  return saveDoc.exists()
}

export const getSavedPosts = async (userId) => {
  const q = query(
    collection(db, "savedPosts"),
    where("userId", "==", userId)
  )
  return getDocs(q)
}

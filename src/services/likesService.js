import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  increment
} from "firebase/firestore"

import { db } from "./fiebase"

export const toggleLike = async (postId, userId) => {
  const likeRef = doc(db, "posts", postId, "likes", userId)
  const postRef = doc(db, "posts", postId)

  const likeDoc = await getDoc(likeRef)

  if (likeDoc.exists()) {
    await deleteDoc(likeRef)
    await updateDoc(postRef, {
      likes: increment(-1)
    })
    return false
  } else {
    await setDoc(likeRef, {
      userId,
      createdAt: new Date()
    })
    await updateDoc(postRef, {
      likes: increment(1)
    })
    return true
  }
}

export const isPostLiked = async (postId, userId) => {
  const likeRef = doc(db, "posts", postId, "likes", userId)
  const likeDoc = await getDoc(likeRef)
  return likeDoc.exists()
}

export const getLikes = async (postId) => {
  const likesSnapshot = await getDocs(
    collection(db, "posts", postId, "likes")
  )
  return likesSnapshot.docs.map(doc => doc.data())
}

export const getLikesCount = async (postId) => {
  const likesSnapshot = await getDocs(
    collection(db, "posts", postId, "likes")
  )
  return likesSnapshot.size
}

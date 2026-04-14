import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  where,
  runTransaction,
  getDoc
} from "firebase/firestore"

import { db } from "./fiebase"

export const createPost = async (content, user, imageUrl = null) => {
  return addDoc(collection(db, "posts"), {
    content,
    imageUrl,
    authorId: user.uid,
    authorName: user.displayName || user.email,
    authorAvatar: user.photoURL || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likes: 0,
    comments: 0,
    shares: 0,
    savedCount: 0
  })
}

export const listenPosts = (callback) => {
  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  )

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(posts)
  })
}

export const updatePost = async (postId, updates) => {
  const postRef = doc(db, "posts", postId)
  return updateDoc(postRef, {
    ...updates,
    updatedAt: serverTimestamp()
  })
}

export const deletePost = async (postId) => {
  const postRef = doc(db, "posts", postId)
  return deleteDoc(postRef)
}

export const getLikesCount = async (postId) => {
  const likesSnapshot = await getDocs(
    collection(db, "posts", postId, "likes")
  )
  return likesSnapshot.size
}

export const getCommentsCount = async (postId) => {
  const commentsSnapshot = await getDocs(
    collection(db, "posts", postId, "comments")
  )
  return commentsSnapshot.size
}

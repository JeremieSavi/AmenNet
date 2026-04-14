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
  increment
} from "firebase/firestore"

import { db } from "./fiebase"

export const addComment = async (postId, text, user, parentCommentId = null) => {
  const commentRef = await addDoc(
    collection(db, "posts", postId, "comments"),
    {
      text,
      userId: user.uid,
      userName: user.displayName || user.email,
      userAvatar: user.photoURL || null,
      parentCommentId: parentCommentId || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0
    }
  )

  const postRef = doc(db, "posts", postId)
  await updateDoc(postRef, {
    comments: increment(1)
  })

  return commentRef
}

export const listenComments = (postId, callback) => {
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  )

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(comments)
  })
}

export const deleteComment = async (postId, commentId) => {
  const commentRef = doc(db, "posts", postId, "comments", commentId)
  await deleteDoc(commentRef)

  const postRef = doc(db, "posts", postId)
  await updateDoc(postRef, {
    comments: increment(-1)
  })
}

export const updateComment = async (postId, commentId, text) => {
  const commentRef = doc(db, "posts", postId, "comments", commentId)
  return updateDoc(commentRef, {
    text,
    updatedAt: serverTimestamp()
  })
}

export const getCommentReplies = async (postId, parentCommentId) => {
  const commentsSnapshot = await getDocs(
    query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc")
    )
  )

  return commentsSnapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    .filter(comment => comment.parentCommentId === parentCommentId)
}

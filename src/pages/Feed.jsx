import React, { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../services/fiebase'
import { doc, getDoc, collection, addDoc, updateDoc, deleteDoc, increment, query, where, orderBy, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { Heart, MessageCircle, Share2, Bookmark, Loader, Send, Trash2, FileEdit, CheckCircle2 } from 'lucide-react'

function Feed() {
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [posts, setPosts] = useState([])
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editingPostId, setEditingPostId] = useState(null)
  const [postLikes, setPostLikes] = useState({})
  const [postSaved, setPostSaved] = useState({})
  const [expandedComments, setExpandedComments] = useState({})
  const [replyingTo, setReplyingTo] = useState(null)
  const [commentText, setCommentText] = useState({})
  const [replyText, setReplyText] = useState({})
  const [postAuthors, setPostAuthors] = useState({})
  const [postComments, setPostComments] = useState({})
  const [commentAuthors, setCommentAuthors] = useState({})
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentText, setEditingCommentText] = useState({})
  const [editingCommentLoading, setEditingCommentLoading] = useState(false)
  const [commentLikes, setCommentLikes] = useState({})

  // Récupérer l'utilisateur actuel
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        try {
          const userRef = doc(db, 'users', currentUser.uid)
          const userSnap = await getDoc(userRef)
          if (userSnap.exists()) {
            setUserData(userSnap.data())
          }
        } catch (error) {
          console.error("Erreur:", error)
        }
      }
    })
    return () => unsub()
  }, [])

  // Écouter les posts en temps réel
  useEffect(() => {
    const postsRef = collection(db, 'posts')
    const q = query(postsRef, orderBy('createdAt', 'desc'))
    
    const unsub = onSnapshot(q, async (snapshot) => {
      const fetchedPosts = []
      const authors = {}

      for (const docSnap of snapshot.docs) {
        const postData = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.() || new Date()
        }
        fetchedPosts.push(postData)

        // Récupérer les infos complètes de l'auteur
        if (!authors[postData.authorId]) {
          try {
            const authorRef = doc(db, 'users', postData.authorId)
            const authorSnap = await getDoc(authorRef)
            if (authorSnap.exists()) {
              authors[postData.authorId] = authorSnap.data()
            } else {
              authors[postData.authorId] = {
                nom: 'Utilisateur',
                prenom: 'Anonyme'
              }
            }
          } catch (error) {
            console.error("Erreur fetch auteur:", error)
            authors[postData.authorId] = { nom: 'Utilisateur', prenom: 'Anonyme' }
          }
        }
      }

      setPosts(fetchedPosts)
      setPostAuthors(authors)
    })

    return () => unsub()
  }, [])

  // Écouter les commentaires pour les posts expandus
  useEffect(() => {
    posts.forEach(post => {
      if (expandedComments[post.id]) {
        const commentsRef = collection(db, 'posts', post.id, 'comments')
        const q = query(commentsRef, orderBy('createdAt', 'asc'))
        
        const unsub = onSnapshot(q, (snapshot) => {
          const comments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date()
          }))
          setPostComments(prev => ({
            ...prev,
            [post.id]: comments
          }))
        })

        return () => unsub()
      }
    })
  }, [expandedComments, posts])

  // Charger les likes et saved posts
  useEffect(() => {
    if (user) {
      posts.forEach(post => {
        checkPostLike(post.id)
        checkPostSaved(post.id)
        
        // Charger les likes des commentaires du post
        if (postComments[post.id]) {
          postComments[post.id].forEach(comment => {
            checkCommentLike(post.id, comment.id)
          })
        }
      })
    }
  }, [posts, user, postComments])

  const checkPostLike = async (postId) => {
    if (user) {
      try {
        const likeRef = doc(db, 'posts', postId, 'likes', user.uid)
        const likeSnap = await getDoc(likeRef)
        setPostLikes(prev => ({
          ...prev,
          [postId]: likeSnap.exists()
        }))
      } catch (error) {
        console.error("Erreur check like:", error)
      }
    }
  }

  const checkPostSaved = async (postId) => {
    if (user) {
      try {
        const saveRef = doc(db, 'savedPosts', `${user.uid}_${postId}`)
        const saveSnap = await getDoc(saveRef)
        setPostSaved(prev => ({
          ...prev,
          [postId]: saveSnap.exists()
        }))
      } catch (error) {
        console.error("Erreur check saved:", error)
      }
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!postContent.trim()) {
      alert('Veuillez entrer du contenu')
      return
    }

    setLoading(true)
    try {
      if (editingPostId) {
        // Vérifier que l'utilisateur est l'auteur du post
        const post = posts.find(p => p.id === editingPostId)
        if (!post || post.authorId !== user.uid) {
          alert('⛔ Vous ne pouvez éditer que vos propres posts')
          setLoading(false)
          return
        }

        const postRef = doc(db, 'posts', editingPostId)
        await updateDoc(postRef, {
          content: postContent,
          updatedAt: serverTimestamp()
        })
        alert('✅ Post modifié avec succès')
        setEditingPostId(null)
      } else {
        await addDoc(collection(db, 'posts'), {
          content: postContent,
          authorId: user.uid,
          authorName: user.displayName || user.email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          likes: 0,
          comments: 0,
          shares: 0
        })
        alert('✅ Post publié avec succès')
      }
      setPostContent('')
      setShowCreatePost(false)
    } catch (error) {
      console.error("Erreur:", error)
      alert('❌ Erreur lors de la création du post')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId) => {
    if (!user) return
    try {
      const likeRef = doc(db, 'posts', postId, 'likes', user.uid)
      const postRef = doc(db, 'posts', postId)
      const likeSnap = await getDoc(likeRef)

      if (likeSnap.exists()) {
        await deleteDoc(likeRef)
        await updateDoc(postRef, { likes: increment(-1) })
      } else {
        await setDoc(likeRef, { createdAt: serverTimestamp() })
        await updateDoc(postRef, { likes: increment(1) })
      }
      checkPostLike(postId)
    } catch (error) {
      console.error("Erreur like:", error)
    }
  }

  const handleSavePost = async (postId) => {
    if (!user) return
    try {
      const saveRef = doc(db, 'savedPosts', `${user.uid}_${postId}`)
      const saveSnap = await getDoc(saveRef)

      if (saveSnap.exists()) {
        await deleteDoc(saveRef)
      } else {
        await setDoc(saveRef, {
          postId,
          userId: user.uid,
          createdAt: serverTimestamp()
        })
      }
      checkPostSaved(postId)
    } catch (error) {
      console.error("Erreur save:", error)
    }
  }

  const handleLikeComment = async (postId, commentId) => {
    if (!user) return
    try {
      const likeRef = doc(db, 'posts', postId, 'comments', commentId, 'likes', user.uid)
      const commentRef = doc(db, 'posts', postId, 'comments', commentId)
      const likeSnap = await getDoc(likeRef)

      if (likeSnap.exists()) {
        await deleteDoc(likeRef)
        await updateDoc(commentRef, { likes: increment(-1) })
      } else {
        await setDoc(likeRef, { createdAt: serverTimestamp() })
        await updateDoc(commentRef, { likes: increment(1) })
      }
      checkCommentLike(postId, commentId)
    } catch (error) {
      console.error("Erreur like commentaire:", error)
    }
  }

  const checkCommentLike = async (postId, commentId) => {
    if (!user) return
    try {
      const likeRef = doc(db, 'posts', postId, 'comments', commentId, 'likes', user.uid)
      const likeSnap = await getDoc(likeRef)
      const commentRef = doc(db, 'posts', postId, 'comments', commentId)
      const commentSnap = await getDoc(commentRef)
      
      const commentData = commentSnap.data()
      setCommentLikes(prev => ({
        ...prev,
        [`${postId}_${commentId}`]: likeSnap.exists(),
        [`${postId}_${commentId}_count`]: commentData?.likes || 0
      }))
    } catch (error) {
      console.error('Erreur vérification like:', error)
    }
  }

  const handleAddComment = async (postId) => {
    const text = commentText[postId]
    if (!text?.trim() || !user) return

    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        text,
        userId: user.uid,
        userName: userData?.prenom ? `${userData.prenom} ${userData.nom}` : user.email,
        userAvatar: user.photoURL || null,
        createdAt: serverTimestamp(),
        parentCommentId: null
      })

      await updateDoc(doc(db, 'posts', postId), {
        comments: increment(1)
      })

      setCommentText(prev => ({
        ...prev,
        [postId]: ''
      }))
    } catch (error) {
      console.error("Erreur commentaire:", error)
    }
  }

  const handleAddReply = async (postId, parentCommentId) => {
    const text = replyText[parentCommentId]
    if (!text?.trim() || !user) return

    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        text,
        userId: user.uid,
        userName: userData?.prenom ? `${userData.prenom} ${userData.nom}` : user.email,
        userAvatar: user.photoURL || null,
        createdAt: serverTimestamp(),
        parentCommentId: parentCommentId
      })

      await updateDoc(doc(db, 'posts', postId), {
        comments: increment(1)
      })

      setReplyText(prev => ({
        ...prev,
        [parentCommentId]: ''
      }))
      setReplyingTo(null)
    } catch (error) {
      console.error("Erreur réponse:", error)
    }
  }

  const handleDeletePost = async (postId) => {
    const post = posts.find(p => p.id === postId)
    
    // Vérifier que l'utilisateur est l'auteur
    if (!post || post.authorId !== user?.uid) {
      alert('⛔ Vous ne pouvez supprimer que vos propres posts')
      return
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.')) {
      try {
        await deleteDoc(doc(db, 'posts', postId))
        alert('✅ Post supprimé avec succès')
      } catch (error) {
        console.error("Erreur suppression:", error)
        alert('❌ Erreur lors de la suppression du post')
      }
    }
  }

  const handleDeleteComment = async (postId, commentId, commentUserId) => {
    // Vérifier que l'utilisateur est l'auteur du commentaire
    if (commentUserId !== user?.uid) {
      alert('⛔ Vous ne pouvez supprimer que vos propres commentaires')
      return
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      try {
        await deleteDoc(doc(db, 'posts', postId, 'comments', commentId))
        await updateDoc(doc(db, 'posts', postId), {
          comments: increment(-1)
        })
        alert('✅ Commentaire supprimé')
      } catch (error) {
        console.error("Erreur suppression commentaire:", error)
        alert('❌ Erreur lors de la suppression du commentaire')
      }
    }
  }

  const handleEditComment = (comment) => {
    // Vérifier que l'utilisateur est l'auteur
    if (comment.userId !== user?.uid) {
      alert('⛔ Vous ne pouvez éditer que vos propres commentaires')
      return
    }
    setEditingCommentId(comment.id)
    setEditingCommentText({ [comment.id]: comment.text })
  }

  const handleSaveCommentEdit = async (postId, commentId) => {
    const newText = editingCommentText[commentId]
    if (!newText?.trim()) {
      alert('Le commentaire ne peut pas être vide')
      return
    }

    setEditingCommentLoading(true)
    try {
      await updateDoc(doc(db, 'posts', postId, 'comments', commentId), {
        text: newText,
        updatedAt: serverTimestamp()
      })
      setEditingCommentId(null)
      setEditingCommentText({})
      alert('✅ Commentaire modifié avec succès')
    } catch (error) {
      console.error("Erreur modification commentaire:", error)
      alert('❌ Erreur lors de la modification du commentaire')
    } finally {
      setEditingCommentLoading(false)
    }
  }

  const handleCancelCommentEdit = () => {
    setEditingCommentId(null)
    setEditingCommentText({})
  }

  const getReplies = (comments, parentCommentId) => {
    return comments.filter(c => c.parentCommentId === parentCommentId)
  }

  const getMainComments = (comments) => {
    return comments.filter(c => !c.parentCommentId)
  }

  const handleEditPost = (post) => {
    // Vérifier que l'utilisateur est l'auteur
    if (post.authorId !== user?.uid) {
      alert('⛔ Vous ne pouvez éditer que vos propres posts')
      return
    }

    setPostContent(post.content)
    setEditingPostId(post.id)
    setShowCreatePost(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleShare = (postId) => {
    const link = `${window.location.origin}?postId=${postId}`
    navigator.clipboard.writeText(link)
    alert('Lien copié dans le presse-papiers!')
  }

  const getAuthorFullName = (post) => {
    const author = postAuthors[post.authorId]
    if (author?.prenom && author?.nom) {
      return `${author.prenom} ${author.nom}`
    }
    return post.authorName || 'Utilisateur'
  }

  const formatDate = (date) => {
    if (!date) return 'À l\'instant'
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}j`
    return date.toLocaleDateString('fr-FR')
  }

  return (
    <div className='bg-gray-50 min-h-screen pb-24'>
      <div className='max-w-2xl mx-auto space-y-4 p-4'>
        {/* Créer un post */}
        <div className='bg-white rounded-xl shadow-sm p-4 border border-gray-200'>
          <div className='flex space-x-4'>
            <div className='w-12 h-12 rounded-full bg-gradient-to-br from-[#F97316] to-orange-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0'>
              {userData?.prenom?.charAt(0) || user?.email?.charAt(0)}
            </div>
            <div className='flex-1'>
              {!showCreatePost ? (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className='w-full bg-gray-100 hover:bg-gray-200 text-left px-4 py-3 rounded-full text-gray-600 transition-colors font-medium'
                >
                  Qu'est-ce que tu penses, {userData?.prenom} ?
                </button>
              ) : (
                <form onSubmit={handleCreatePost} className='space-y-3'>
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder='Partage ta pensée...'
                    rows={5}
                    className='w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 resize-none font-medium'
                  />
                  <div className='flex space-x-2 justify-end'>
                    <button
                      type='button'
                      onClick={() => {
                        setShowCreatePost(false)
                        setPostContent('')
                        setEditingPostId(null)
                      }}
                      className='px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 font-semibold transition-colors'
                    >
                      Annuler
                    </button>
                    <button
                      type='submit'
                      disabled={loading}
                      className='px-6 py-2 bg-[#F97316] text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center space-x-2 font-semibold transition-colors'
                    >
                      {loading && <Loader className='w-4 h-4 animate-spin' />}
                      <span>{editingPostId ? 'Modifier' : 'Publier'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Affichage des posts */}
        {posts.length === 0 ? (
          <div className='bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200'>
            <p className='text-gray-500 text-lg'>Aucun post pour le moment. Soyez le premier à publier!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow'>
              {/* En-tête du post */}
              <div className='p-4 border-b border-gray-100 flex items-center justify-between'>
                <div className='flex items-center space-x-3 flex-1'>
                  <div className='w-12 h-12 rounded-full bg-gradient-to-br from-[#F97316] to-orange-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0'>
                    {getAuthorFullName(post)?.charAt(0)}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center space-x-2 flex-wrap'>
                      <p className='font-bold text-gray-900 text-sm md:text-base'>
                        {getAuthorFullName(post)}
                      </p>
                      {postAuthors[post.authorId]?.accountType === 'Église' && postAuthors[post.authorId]?.certified && (
                        <div className='flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-full'>
                          <CheckCircle2 className='w-4 h-4 text-blue-600' />
                          <span className='text-xs font-semibold text-blue-600'>Certifiée</span>
                        </div>
                      )}
                    </div>
                    <p className='text-xs text-gray-500'>
                      {formatDate(post.createdAt)}
                    </p>
                  </div>
                </div>

                {user?.uid === post.authorId && (
                  <div className='flex space-x-1'>
                    <button
                      onClick={() => handleEditPost(post)}
                      className='p-2 hover:bg-blue-100 rounded-full text-blue-600 transition-colors'
                      title='Modifier'
                    >
                      <FileEdit className='w-5 h-5' />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className='p-2 hover:bg-red-100 rounded-full text-red-600 transition-colors'
                      title='Supprimer'
                    >
                      <Trash2 className='w-5 h-5' />
                    </button>
                  </div>
                )}
              </div>

              {/* Contenu */}
              <div className='p-4'>
                <p className='text-gray-800 whitespace-pre-wrap leading-relaxed text-sm md:text-base'>
                  {post.content}
                </p>
              </div>

              {/* Statistiques */}
              <div className='px-4 py-2 bg-gray-50 text-xs text-gray-600 border-b border-gray-100 flex flex-wrap gap-4'>
                <span className='flex items-center gap-1'>❤️ <strong>{post.likes || 0}</strong> j'aime</span>
                <span className='flex items-center gap-1'>💬 <strong>{post.comments || 0}</strong> commentaire{post.comments !== 1 ? 's' : ''}</span>
                <span className='flex items-center gap-1'>↗️ <strong>{post.shares || 0}</strong> partage{post.shares !== 1 ? 's' : ''}</span>
              </div>

              {/* Boutons d'action */}
              <div className='px-4 py-2 grid grid-cols-4 gap-1 border-b border-gray-100'>
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center justify-center space-x-1 py-2 rounded-lg transition-colors font-medium text-sm ${
                    postLikes[post.id]
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${postLikes[post.id] ? 'fill-current' : ''}`} />
                  <span className='hidden sm:inline'>J'aime</span>
                </button>

                <button
                  onClick={() => setExpandedComments(prev => ({
                    ...prev,
                    [post.id]: !prev[post.id]
                  }))}
                  className='flex items-center justify-center space-x-1 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium text-sm'
                >
                  <MessageCircle className='w-5 h-5' />
                  <span className='hidden sm:inline'>Commenter</span>
                </button>

                <button
                  onClick={() => handleShare(post.id)}
                  className='flex items-center justify-center space-x-1 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium text-sm'
                >
                  <Share2 className='w-5 h-5' />
                  <span className='hidden sm:inline'>Partager</span>
                </button>

                <button
                  onClick={() => handleSavePost(post.id)}
                  className={`flex items-center justify-center space-x-1 py-2 rounded-lg transition-colors font-medium text-sm ${
                    postSaved[post.id]
                      ? 'text-orange-600 hover:bg-orange-50'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${postSaved[post.id] ? 'fill-current' : ''}`} />
                  <span className='hidden sm:inline'>Sauvegarder</span>
                </button>
              </div>

              {/* Section Commentaires */}
              {expandedComments[post.id] && (
                <div className='p-4 bg-gray-50 border-t border-gray-100 space-y-4'>
                  {/* Ajouter un commentaire */}
                  {user && (
                    <div className='flex space-x-3'>
                      <div className='w-8 h-8 rounded-full bg-gradient-to-br from-[#F97316] to-orange-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0'>
                        {userData?.prenom?.charAt(0) || user.email?.charAt(0)}
                      </div>
                      <div className='flex-1 flex gap-2'>
                        <input
                          type='text'
                          placeholder='Ajoute un commentaire...'
                          value={commentText[post.id] || ''}
                          onChange={(e) => setCommentText(prev => ({
                            ...prev,
                            [post.id]: e.target.value
                          }))}
                          className='flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent'
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className='px-3 py-2 bg-[#F97316] text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold'
                          title='Envoyer'
                        >
                          <Send className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Affichage des commentaires */}
                  <div className='space-y-4 max-h-96 overflow-y-auto'>
                    {(postComments[post.id] || []).length === 0 ? (
                      <p className='text-center text-gray-500 text-sm py-4'>Aucun commentaire pour le moment</p>
                    ) : (
                      getMainComments(postComments[post.id] || []).map((comment) => {
                        const replies = getReplies(postComments[post.id] || [], comment.id)
                        return (
                          <div key={comment.id} className='space-y-2'>
                            {/* Commentaire principal */}
                            <div className='flex space-x-3'>
                              <div className='w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0'>
                                {comment.userName?.charAt(0)}
                              </div>
                              <div className='flex-1 bg-white rounded-lg px-3 py-2 border border-gray-200 hover:shadow-sm transition'>
                                <p className='font-semibold text-sm text-gray-900'>{comment.userName}</p>
                                {editingCommentId === comment.id ? (
                                  <div className='mt-2 space-y-2'>
                                    <textarea
                                      value={editingCommentText[comment.id] || ''}
                                      onChange={(e) => setEditingCommentText(prev => ({
                                        ...prev,
                                        [comment.id]: e.target.value
                                      }))}
                                      className='w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
                                      rows='2'
                                    />
                                    <div className='flex gap-2'>
                                      <button
                                        onClick={() => handleSaveCommentEdit(post.id, comment.id)}
                                        disabled={editingCommentLoading}
                                        className='px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50'
                                      >
                                        Enregistrer
                                      </button>
                                      <button
                                        onClick={handleCancelCommentEdit}
                                        className='px-3 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500'
                                      >
                                        Annuler
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className='text-sm text-gray-800 mt-1'>{comment.text}</p>
                                    <div className='flex space-x-3 mt-2 text-xs'>
                                      <p className='text-gray-500'>{formatDate(comment.createdAt)}</p>
                                      {user && (
                                        <>
                                          <button
                                            onClick={() => handleLikeComment(post.id, comment.id)}
                                            className='text-gray-600 hover:text-red-600 font-medium flex items-center gap-1 transition-colors'
                                          >
                                            <Heart className={`w-3 h-3 ${commentLikes[`${post.id}_${comment.id}`] ? 'fill-red-600 text-red-600' : ''}`} />
                                            {commentLikes[`${post.id}_${comment.id}_count`] || comment.likes || 0}
                                          </button>
                                          <button
                                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                            className='text-blue-600 hover:text-blue-700 font-medium'
                                          >
                                            Répondre
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                              {user?.uid === comment.userId && (
                                <div className='flex gap-1'>
                                  <button
                                    onClick={() => handleEditComment(comment)}
                                    className='text-blue-600 hover:text-blue-700 transition-colors'
                                    title='Modifier'
                                  >
                                    <FileEdit className='w-4 h-4' />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(post.id, comment.id, comment.userId)}
                                    className='text-red-600 hover:text-red-700 transition-colors'
                                    title='Supprimer'
                                  >
                                    <Trash2 className='w-4 h-4' />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Champ de réponse */}
                            {replyingTo === comment.id && user && (
                              <div className='ml-8 flex space-x-2'>
                                <div className='w-6 h-6 rounded-full bg-gradient-to-br from-[#F97316] to-orange-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0'>
                                  {userData?.prenom?.charAt(0) || user.email?.charAt(0)}
                                </div>
                                <div className='flex-1 flex gap-1'>
                                  <input
                                    type='text'
                                    placeholder='Écris une réponse...'
                                    value={replyText[comment.id] || ''}
                                    onChange={(e) => setReplyText(prev => ({
                                      ...prev,
                                      [comment.id]: e.target.value
                                    }))}
                                    className='flex-1 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F97316]'
                                  />
                                  <button
                                    onClick={() => handleAddReply(post.id, comment.id)}
                                    className='px-2 py-1 bg-[#F97316] text-white text-xs rounded-lg hover:bg-orange-600 transition'
                                  >
                                    <Send className='w-3 h-3' />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Réponses imbriquées */}
                            {replies.length > 0 && (
                              <div className='ml-8 space-y-2 border-l-2 border-gray-200 pl-0'>
                                {replies.map((reply) => (
                                  <div key={reply.id} className='flex space-x-2'>
                                    <div className='w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0'>
                                      {reply.userName?.charAt(0)}
                                    </div>
                                    <div className='flex-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100'>
                                      <p className='font-semibold text-xs text-gray-900'>{reply.userName}</p>
                                      {editingCommentId === reply.id ? (
                                        <div className='mt-2 space-y-1'>
                                          <textarea
                                            value={editingCommentText[reply.id] || ''}
                                            onChange={(e) => setEditingCommentText(prev => ({
                                              ...prev,
                                              [reply.id]: e.target.value
                                            }))}
                                            className='w-full p-2 text-xs border border-gray-300 rounded font-small focus:outline-none focus:ring-1 focus:ring-[#F97316]'
                                            rows='1'
                                          />
                                          <div className='flex gap-1'>
                                            <button
                                              onClick={() => handleSaveCommentEdit(post.id, reply.id)}
                                              disabled={editingCommentLoading}
                                              className='px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50'
                                            >
                                              Enregistrer
                                            </button>
                                            <button
                                              onClick={handleCancelCommentEdit}
                                              className='px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500'
                                            >
                                              Annuler
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <p className='text-xs text-gray-800 mt-1'>{reply.text}</p>
                                          <div className='flex space-x-2 mt-1 text-xs'>
                                            <p className='text-gray-500'>{formatDate(reply.createdAt)}</p>
                                            {user && (
                                              <button
                                                onClick={() => handleLikeComment(post.id, reply.id)}
                                                className='text-gray-600 hover:text-red-600 font-medium flex items-center gap-1 transition-colors'
                                              >
                                                <Heart className={`w-3 h-3 ${commentLikes[`${post.id}_${reply.id}`] ? 'fill-red-600 text-red-600' : ''}`} />
                                                {commentLikes[`${post.id}_${reply.id}_count`] || reply.likes || 0}
                                              </button>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                    {user?.uid === reply.userId && (
                                      <div className='flex gap-1'>
                                        <button
                                          onClick={() => handleEditComment(reply)}
                                          className='text-blue-600 hover:text-blue-700 transition-colors'
                                          title='Modifier'
                                        >
                                          <FileEdit className='w-3 h-3' />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteComment(post.id, reply.id, reply.userId)}
                                          className='text-red-600 hover:text-red-700 transition-colors'
                                          title='Supprimer'
                                        >
                                          <Trash2 className='w-3 h-3' />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Feed
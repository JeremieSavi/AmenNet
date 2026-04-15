import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../services/fiebase'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  orderBy,
  serverTimestamp,
  getDocs,
  deleteDoc
} from 'firebase/firestore'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Send, Search, Trash2, ArrowLeft, Plus, Phone, Video, Info, X, EyeOff, Eye,
  Smile, Paperclip, MoreVertical, MessageCircle
} from 'lucide-react'
import { createNewMessageNotification } from '../services/notificationsService'

function Chat() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [companions, setCompanions] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768)

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
          console.error('Erreur récupération données utilisateur:', error)
        }
      } else {
        navigate('/login')
      }
    })
    return () => unsub()
  }, [navigate])

  // Vérifier si un contact est spécifié dans l'URL
  useEffect(() => {
    const withId = searchParams.get('with')
    if (withId && companions.length > 0) {
      const companion = companions.find(c => c.id === withId)
      if (companion) {
        handleStartChat(companion)
      }
    }
  }, [searchParams, companions])

  // Récupérer les compagnons de foi
  useEffect(() => {
    if (!user) return

    const companionsRef = collection(db, 'users', user.uid, 'faithCompanions')
    const unsub = onSnapshot(companionsRef, async (snapshot) => {
      const companionIds = snapshot.docs.map(doc => doc.id)

      const companionsData = await Promise.all(
        companionIds.map(async (uid) => {
          const userRef = doc(db, 'users', uid)
          const userSnap = await getDoc(userRef)
          return userSnap.exists() ? { id: uid, ...userSnap.data() } : null
        })
      )

      setCompanions(companionsData.filter(c => c !== null))
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  // Récupérer les conversations
  useEffect(() => {
    if (!user || companions.length === 0) return

    const conversationsData = []
    let loadedCount = 0

    companions.forEach(companion => {
      const convId = [user.uid, companion.id].sort().join('_')
      const messagesRef = collection(db, 'conversations', convId, 'messages')
      const q = query(messagesRef, orderBy('createdAt', 'desc'))
      
      const unsub = onSnapshot(q, (snapshot) => {
        if (snapshot.docs.length > 0) {
          const lastMessage = snapshot.docs[0].data()
          const newConv = {
            id: convId,
            companion: companion,
            lastMessage: lastMessage.text,
            lastMessageTime: lastMessage.createdAt,
            lastMessageFromMe: lastMessage.senderId === user.uid,
            messageCount: snapshot.size
          }
          
          conversationsData.push(newConv)
          const sorted = conversationsData.sort((a, b) => {
            const timeA = a.lastMessageTime?.toDate?.() || new Date(0)
            const timeB = b.lastMessageTime?.toDate?.() || new Date(0)
            return timeB - timeA
          })
          setConversations(sorted)
        }
        loadedCount++
      })

      return () => unsub()
    })
  }, [user, companions])

  // Charger les messages d'une conversation
  useEffect(() => {
    if (!selectedConversation || !user) return

    setLoadingMessages(true)
    const messagesRef = collection(db, 'conversations', selectedConversation.id, 'messages')
    const q = query(messagesRef, orderBy('createdAt', 'asc'))

    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })))
      setLoadingMessages(false)
      
      setTimeout(() => {
        const chatContainer = document.getElementById('messages-container')
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight
        }
      }, 100)
    })

    return () => unsub()
  }, [selectedConversation, user])

  // Envoyer un message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !user || !userData) return

    setSendingMessage(true)
    try {
      const messagesRef = collection(db, 'conversations', selectedConversation.id, 'messages')
      await setDoc(doc(messagesRef), {
        text: newMessage,
        senderId: user.uid,
        senderName: userData.accountType === 'Église' ? userData.egliseName : `${userData.prenom} ${userData.nom}`,
        createdAt: serverTimestamp()
      })

      const companion = selectedConversation.companion
      const senderName = userData.accountType === 'Église' 
        ? userData.egliseName 
        : `${userData.prenom} ${userData.nom}`
      const messagePreview = newMessage.length > 50 
        ? `${newMessage.substring(0, 50)}...` 
        : newMessage
      await createNewMessageNotification(companion.id, user.uid, senderName, messagePreview)

      setNewMessage('')
    } catch (error) {
      console.error('Erreur:', error)
      alert('⛔ Erreur lors de l\'envoi du message')
    } finally {
      setSendingMessage(false)
    }
  }

  // Démarrer une nouvelle conversation
  const handleStartChat = async (companion) => {
    const convId = [user.uid, companion.id].sort().join('_')
    const existingConv = conversations.find(c => c.id === convId)
    
    if (existingConv) {
      setSelectedConversation(existingConv)
    } else {
      const newConv = {
        id: convId,
        companion: companion,
        lastMessage: '',
        lastMessageTime: new Date(),
        lastMessageFromMe: false,
        messageCount: 0
      }
      setSelectedConversation(newConv)
    }
    setShowNewChat(false)
  }

  // Supprimer une conversation
  const handleDeleteConversation = async (convId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation?')) return

    try {
      const messagesRef = collection(db, 'conversations', convId, 'messages')
      const messages = await getDocs(messagesRef)
      
      for (const msgDoc of messages.docs) {
        await deleteDoc(msgDoc.ref)
      }
      
      setSelectedConversation(null)
    } catch (error) {
      console.error('Erreur:', error)
      alert('⛔ Erreur lors de la suppression')
    }
  }

  // Filtrer conversations
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    const name = conv.companion.accountType === 'Église' 
      ? conv.companion.egliseName 
      : `${conv.companion.prenom} ${conv.companion.nom}`
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Formater time relative
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate?.() || new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}j`
    return date.toLocaleDateString('fr-FR')
  }

  const getCompanionName = (companion) => {
    return companion.accountType === 'Église' 
      ? companion.egliseName 
      : `${companion.prenom} ${companion.nom}`
  }

  const getInitials = (companion) => {
    if (companion.accountType === 'Église') {
      return companion.egliseName.charAt(0)
    }
    return (companion.prenom?.charAt(0) + companion.nom?.charAt(0)).toUpperCase()
  }

  return (
    <div className='flex h-screen bg-gray-50'>
      {/* Liste des conversations (Desktop: 350px, Mobile: full) */}
      {(!isMobileView || !selectedConversation) && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className='w-full md:w-96 border-r border-gray-200 bg-white flex flex-col'
        >
          {/* Header de la liste */}
          <div className='p-4 border-b border-gray-200 space-y-3'>
            <div className='flex items-center justify-between'>
              <h1 className='text-2xl font-bold text-gray-900'>Messages</h1>
              {companions.length > 0 && (
                <motion.button
                  onClick={() => setShowNewChat(!showNewChat)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className='p-2 bg-[#F97316] text-white rounded-full hover:bg-orange-600'
                >
                  <Plus className='w-5 h-5' />
                </motion.button>
              )}
            </div>

            {/* Barre de recherche */}
            <div className='relative'>
              <Search className='absolute left-3 top-3 w-5 h-5 text-gray-400' />
              <input
                type='text'
                placeholder='Rechercher un message...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
              />
            </div>
          </div>

          {/* Onglets Nouveau Chat */}
          <AnimatePresence>
            {showNewChat && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='border-b border-gray-200 max-h-64 overflow-y-auto'
              >
                <div className='p-3 space-y-2'>
                  {companions
                    .filter(c => !conversations.find(conv => conv.companion.id === c.id))
                    .map(companion => (
                      <motion.button
                        key={companion.id}
                        onClick={() => handleStartChat(companion)}
                        whileHover={{ backgroundColor: '#f3f4f6' }}
                        className='w-full flex items-center gap-3 p-2 rounded-lg transition-colors'
                      >
                        <div className='w-10 h-10 rounded-full bg-gradient-to-br from-[#F97316] to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0'>
                          {getInitials(companion)}
                        </div>
                        <div className='flex-1 text-left'>
                          <p className='font-semibold text-sm text-gray-900'>
                            {getCompanionName(companion)}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Liste des conversations */}
          <div className='flex-1 overflow-y-auto'>
            {loading ? (
              <div className='flex items-center justify-center h-full'>
                <div className='w-8 h-8 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin'></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-full text-center p-4'>
                <MessageCircle className='w-12 h-12 text-gray-300 mb-2' />
                <p className='text-gray-600 font-medium'>Aucun message</p>
                <p className='text-sm text-gray-500'>Commencez une conversation!</p>
              </div>
            ) : (
              <div className='space-y-1 p-2'>
                {filteredConversations.map(conv => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedConversation(conv)}
                    className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id
                        ? 'bg-[#F97316] text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className='w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0'>
                      {getInitials(conv.companion)}
                    </div>
                    
                    <div className='flex-1 min-w-0'>
                      <p className='font-semibold text-sm line-clamp-1'>
                        {getCompanionName(conv.companion)}
                      </p>
                      <p className={`text-xs line-clamp-1 ${
                        selectedConversation?.id === conv.id ? 'text-orange-100' : 'text-gray-600'
                      }`}>
                        {conv.lastMessageFromMe && '👤 Vous: '}
                        {conv.lastMessage}
                      </p>
                    </div>

                    <div className='text-right text-xs flex-shrink-0'>
                      <p className={selectedConversation?.id === conv.id ? 'text-orange-100' : 'text-gray-500'}>
                        {getTimeAgo(conv.lastMessageTime)}
                      </p>
                    </div>

                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteConversation(conv.id)
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className='opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-600 transition-all'
                    >
                      <Trash2 className='w-4 h-4' />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Chat Area */}
      {selectedConversation ? (
        <motion.div
          key={selectedConversation.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='flex-1 flex flex-col'
        >
          {/* Header du chat */}
          <div className='bg-white border-b border-gray-200 p-4 flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              {isMobileView && (
                <motion.button
                  onClick={() => setSelectedConversation(null)}
                  whileHover={{ scale: 1.1 }}
                  className='p-2 hover:bg-gray-100 rounded'
                >
                  <ArrowLeft className='w-5 h-5' />
                </motion.button>
              )}
              
              <div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm'>
                {getInitials(selectedConversation.companion)}
              </div>
              
              <div>
                <h2 className='font-bold text-gray-900'>
                  {getCompanionName(selectedConversation.companion)}
                </h2>
                <p className='text-xs text-gray-500'>Compagnon de foi</p>
              </div>
            </div>

            <div className='flex gap-2'>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className='p-2 hover:bg-gray-100 rounded-full text-gray-600'
              >
                <Phone className='w-5 h-5' />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className='p-2 hover:bg-gray-100 rounded-full text-gray-600'
              >
                <Info className='w-5 h-5' />
              </motion.button>
            </div>
          </div>

          {/* Messages */}
          <div
            id='messages-container'
            className='flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white'
          >
            {loadingMessages ? (
              <div className='flex items-center justify-center h-full'>
                <div className='w-8 h-8 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin'></div>
              </div>
            ) : messages.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-full text-center'>
                <MessageCircle className='w-16 h-16 text-gray-200 mb-2' />
                <p className='text-gray-600 font-medium'>Commencez la conversation!</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isOwn = msg.senderId === user?.uid
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwn
                        ? 'bg-[#F97316] text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-900 rounded-bl-none'
                    }`}>
                      <p className='text-sm'>{msg.text}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-orange-100' : 'text-gray-600'}`}>
                        {new Date(msg.createdAt?.toDate?.() || msg.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>

          {/* Input Area */}
          <div className='bg-white border-t border-gray-200 p-4'>
            <form onSubmit={handleSendMessage} className='flex gap-2'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type='button'
                className='p-2 hover:bg-gray-100 rounded-full text-gray-600'
              >
                <Paperclip className='w-5 h-5' />
              </motion.button>

              <input
                type='text'
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder='Votre message...'
                className='flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#F97316]'
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type='button'
                className='p-2 hover:bg-gray-100 rounded-full text-gray-600'
              >
                <Smile className='w-5 h-5' />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type='submit'
                disabled={sendingMessage || !newMessage.trim()}
                className='p-2 bg-[#F97316] hover:bg-orange-600 rounded-full text-white disabled:opacity-50'
              >
                <Send className='w-5 h-5' />
              </motion.button>
            </form>
          </div>
        </motion.div>
      ) : (
        !isMobileView && (
          <div className='flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100'>
            <div className='text-center'>
              <MessageCircle className='w-20 h-20 text-gray-300 mx-auto mb-4' />
              <h2 className='text-2xl font-bold text-gray-600'>Sélectionnez une conversation</h2>
              <p className='text-gray-500 mt-2'>ou commencez une nouvelle</p>
            </div>
          </div>
        )
      )}
    </div>
  )
}

export default Chat

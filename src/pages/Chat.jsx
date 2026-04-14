import React, { useEffect, useState } from 'react'
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
import { useNavigate } from 'react-router-dom'
import { Send, Search, Trash2, ArrowLeft, Plus } from 'lucide-react'
import { createNewMessageNotification } from '../services/notificationsService'

function Chat() {
  const navigate = useNavigate()
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

  // Récupérer l'utilisateur actuel
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        // Récupérer les données de l'utilisateur
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
      // Créer ID de conversation (toujours dans le même ordre)
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
      
      // Scroll au dernier message
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
        senderName: user.email,
        createdAt: serverTimestamp()
      })

      // Créer une notification pour le destinataire
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
    
    // Vérifier si la conversation existe
    const existingConv = conversations.find(c => c.id === convId)
    if (existingConv) {
      setSelectedConversation(existingConv)
    } else {
      // Créer une nouvelle conversation
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
      const snapshot = await getDocs(messagesRef)
      
      // Supprimer tous les messages
      for (const msgDoc of snapshot.docs) {
        await deleteDoc(msgDoc.ref)
      }
      
      // Les données de la conversation se suppriment automatiquement
      setConversations(prev => prev.filter(c => c.id !== convId))
      if (selectedConversation?.id === convId) {
        setSelectedConversation(null)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('⛔ Erreur lors de la suppression')
    }
  }

  const filteredCompanions = showNewChat
    ? companions.filter(c => {
        const name = c.accountType === 'Église' 
          ? c.egliseName 
          : `${c.prenom} ${c.nom}`
        return name.toLowerCase().includes(searchQuery.toLowerCase())
      })
    : []

  const getCompanionName = (companion) => {
    return companion.accountType === 'Église' 
      ? companion.egliseName 
      : `${companion.prenom} ${companion.nom}`
  }

  const formatTime = (date) => {
    if (!date) return ''
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date) => {
    if (!date) return ''
    const d = date.toDate ? date.toDate() : new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Hier'
    } else {
      return d.toLocaleDateString('fr-FR')
    }
  }

  return (
    <div className='bg-gray-50 min-h-screen pb-24'>
      <div className='max-w-6xl mx-auto h-full flex gap-4 p-4'>
        {/* Liste des conversations */}
        <div className={`${selectedConversation && !window.innerWidth > 768 ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-96 bg-white rounded-xl shadow-sm border border-gray-200`}>
          {/* En-tête */}
          <div className='p-4 border-b border-gray-200 space-y-3'>
            <div className='flex items-center justify-between'>
              <h1 className='text-2xl font-bold text-gray-900'>Messages</h1>
              <button
                onClick={() => setShowNewChat(!showNewChat)}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              >
                <Plus className='w-5 h-5 text-[#F97316]' />
              </button>
            </div>

            {/* Recherche */}
            {!showNewChat && (
              <div className='relative'>
                <Search className='absolute left-3 top-3 w-4 h-4 text-gray-400' />
                <input
                  type='text'
                  placeholder='Rechercher un message...'
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm'
                />
              </div>
            )}
          </div>

          {/* Nouveau chat */}
          {showNewChat && (
            <div className='p-4 border-b border-gray-200 space-y-2 max-h-64 overflow-y-auto'>
              <div className='relative'>
                <Search className='absolute left-3 top-3 w-4 h-4 text-gray-400' />
                <input
                  type='text'
                  placeholder='Rechercher un compagnon...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm'
                  autoFocus
                />
              </div>
              {filteredCompanions.length === 0 ? (
                <p className='text-gray-500 text-sm text-center py-4'>Aucun compagnon trouvé</p>
              ) : (
                filteredCompanions.map(companion => (
                  <button
                    key={companion.id}
                    onClick={() => handleStartChat(companion)}
                    className='w-full text-left p-2 hover:bg-gray-100 rounded-lg transition-colors'
                  >
                    <p className='font-medium text-gray-900 text-sm'>{getCompanionName(companion)}</p>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Liste des conversations */}
          <div className='flex-1 overflow-y-auto'>
            {conversations.length === 0 ? (
              <div className='p-6 text-center text-gray-500'>
                <p className='text-sm'>Aucune conversation pour le moment</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                    selectedConversation?.id === conv.id
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex-1 min-w-0'>
                      <p className='font-semibold text-gray-900 truncate'>
                        {getCompanionName(conv.companion)}
                      </p>
                      <p className='text-sm text-gray-600 truncate'>
                        {conv.lastMessageFromMe && '✓ '}
                        {conv.lastMessage}
                      </p>
                    </div>
                    <div className='flex items-center gap-2 shrink-0'>
                      <p className='text-xs text-gray-500 whitespace-nowrap'>
                        {formatDate(conv.lastMessageTime)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteConversation(conv.id)
                        }}
                        className='p-1 hover:bg-red-100 text-red-600 rounded transition-colors'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zone de chat */}
        {selectedConversation ? (
          <div className='flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 min-h-96'>
            {/* En-tête du chat */}
            <div className='p-4 border-b border-gray-200 flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <button
                  onClick={() => setSelectedConversation(null)}
                  className='md:hidden p-2 hover:bg-gray-100 rounded-lg'
                >
                  <ArrowLeft className='w-5 h-5' />
                </button>
                <div>
                  <h2 className='font-bold text-gray-900'>
                    {getCompanionName(selectedConversation.companion)}
                  </h2>
                  <p className='text-xs text-gray-500'>
                    {messages.length} message{messages.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              id='messages-container'
              className='flex-1 overflow-y-auto p-4 space-y-3'
            >
              {loadingMessages ? (
                <div className='flex justify-center py-8'>
                  <div className='w-6 h-6 border-3 border-[#F97316] border-t-transparent rounded-full animate-spin'></div>
                </div>
              ) : messages.length === 0 ? (
                <div className='flex items-center justify-center h-full'>
                  <p className='text-gray-500 text-center'>
                    Commencez une nouvelle conversation
                  </p>
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.senderId === user?.uid
                          ? 'bg-[#F97316] text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className='text-sm whitespace-normal'>{msg.text}</p>
                      <p className={`text-xs mt-1 ${
                        msg.senderId === user?.uid
                          ? 'text-orange-100'
                          : 'text-gray-500'
                      }`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Formulaire d'envoi */}
            <div className='p-4 border-t border-gray-200'>
              <form onSubmit={handleSendMessage} className='flex gap-2'>
                <input
                  type='text'
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder='Écrivez un message...'
                  className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
                  disabled={sendingMessage}
                />
                <button
                  type='submit'
                  disabled={sendingMessage || !newMessage.trim()}
                  className='px-4 py-2 bg-[#F97316] text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50'
                >
                  <Send className='w-5 h-5' />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className='hidden md:flex flex-1 items-center justify-center bg-white rounded-xl shadow-sm border border-gray-200'>
            <p className='text-gray-500'>Sélectionnez une conversation pour commencer</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat

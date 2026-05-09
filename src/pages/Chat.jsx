import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../services/fiebase'
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  orderBy,
  serverTimestamp,
  where,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { Send, MessageCircle, Search, ArrowLeft, Edit2, Trash2, Check, X, Eye, Smile, Plus, Mic } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

function Chat() {
  const navigate = useNavigate()
  const { isDark } = useTheme()

  const [user, setUser] = useState(null)
  const [companions, setCompanions] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768)
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [showReactions, setShowReactions] = useState(null)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const reactions = ['👍', '❤️', '😂', '😢', '😡', '🔥', '✨', '🎉']

  // RESPONSIVE MOBILE VIEW
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // AUTO RESIZE TEXTAREA
  const handleInputChange = (e) => {
    setNewMessage(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }

  // AUTO SCROLL TO BOTTOM
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // AUTH
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) navigate('/login')
      else setUser(u)
    })
    return () => unsub()
  }, [navigate])

  // LOAD COMPANIONS
  useEffect(() => {
    if (!user) return

    return onSnapshot(
      collection(db, 'users', user.uid, 'faithCompanions'),
      async (snap) => {
        const data = await Promise.all(
          snap.docs.map(async (d) => {
            const u = await getDoc(doc(db, 'users', d.id))
            return { id: d.id, ...u.data() }
          })
        )
        setCompanions(data)
      }
    )
  }, [user])

  // AUTO SELECT FIRST CONVERSATION
  useEffect(() => {
    if (companions.length > 0 && !selectedConversation) {
      const convId = [user.uid, companions[0].id].sort().join('_')
      setSelectedConversation({ id: convId, companion: companions[0] })
    }
  }, [companions, user, selectedConversation])

  // LOAD MESSAGES
  useEffect(() => {
    if (!selectedConversation) return

    return onSnapshot(
      query(collection(db, 'conversations', selectedConversation.id, 'messages'), orderBy('createdAt', 'asc')),
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      }
    )
  }, [selectedConversation])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    await setDoc(
      doc(collection(db, 'conversations', selectedConversation.id, 'messages')),
      {
        text: newMessage,
        senderId: user.uid,
        createdAt: serverTimestamp(),
        isRead: false,
        readAt: null,
        isEdited: false,
        reactions: {}
      }
    )

    setNewMessage('')
  }

  const handleMarkAsRead = async (msgId) => {
    if (!selectedConversation) return
    await updateDoc(
      doc(db, 'conversations', selectedConversation.id, 'messages', msgId),
      {
        isRead: true,
        readAt: serverTimestamp()
      }
    )
  }

  const handleEditMessage = async (msgId) => {
    if (!selectedConversation || !editingText.trim()) return
    await updateDoc(
      doc(db, 'conversations', selectedConversation.id, 'messages', msgId),
      {
        text: editingText,
        isEdited: true
      }
    )
    setEditingId(null)
    setEditingText('')
  }

  const handleDeleteMessage = async (msgId) => {
    if (!selectedConversation) return
    await deleteDoc(
      doc(db, 'conversations', selectedConversation.id, 'messages', msgId)
    )
  }

  const handleAddReaction = async (msgId, emoji) => {
    if (!selectedConversation) return
    const msgRef = doc(db, 'conversations', selectedConversation.id, 'messages', msgId)
    const msg = messages.find(m => m.id === msgId)
    
    if (msg?.reactions?.[emoji]?.includes(user.uid)) {
      await updateDoc(msgRef, {
        [`reactions.${emoji}`]: arrayRemove(user.uid)
      })
    } else {
      await updateDoc(msgRef, {
        [`reactions.${emoji}`]: arrayUnion(user.uid)
      })
    }
    setShowReactions(null)
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp.toDate ? timestamp.toDate() : timestamp)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp.toDate ? timestamp.toDate() : timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Aujourd\'hui'
    if (date.toDateString() === yesterday.toDateString()) return 'Hier'
    return date.toLocaleDateString('fr-FR')
  }

  const shouldShowDateSeparator = (currentMsg, prevMsg, index) => {
    if (index === 0) return true
    if (!prevMsg) return true
    return formatDate(currentMsg.createdAt) !== formatDate(prevMsg.createdAt)
  }

  const handleSelectConversation = (companion) => {
    const convId = [user.uid, companion.id].sort().join('_')
    setSelectedConversation({ id: convId, companion })
    if (isMobileView) setIsMobileView(false)
  }

  return (
    <div className={`flex h-[calc(100vh-135px)] overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>

      {/* CONVERSATIONS LIST */}
      {(!isMobileView || !selectedConversation) && (
        <motion.div 
          initial={{ x: isMobileView && selectedConversation ? -400 : 0 }}
          animate={{ x: 0 }}
          className={`${isMobileView ? 'w-full' : 'w-96'} border-r flex flex-col ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
          
          {/* HEADER */}
          <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Messages</h1>
          </div>

          {/* SEARCH */}
          <div className={`p-3 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <Search size={18} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
              <input
                placeholder="Chercher..."
                className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
              />
            </div>
          </div>

          {/* COMPANIONS LIST */}
          <div className="flex-1 overflow-y-auto">
            {companions.length === 0 ? (
              <div className={`flex flex-col items-center justify-center h-full opacity-50 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <MessageCircle size={32} className="mb-2" />
                <p className="text-sm">Aucun compagnon</p>
              </div>
            ) : (
              companions.map((comp) => (
                <motion.div
                  key={comp.id}
                  onClick={() => handleSelectConversation(comp)}
                  className={`p-4 border-b cursor-pointer transition ${
                    selectedConversation?.companion.id === comp.id
                      ? isDark ? 'bg-slate-700' : 'bg-orange-50'
                      : isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                  } ${isDark ? 'border-slate-700' : 'border-gray-200'}`}
                  whileHover={{ x: 4 }}
                >
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{comp.prenom}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{comp.email}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>
        </motion.div>
      )}

      {/* CHAT AREA */}
      {selectedConversation && (
        <motion.div 
          initial={{ x: isMobileView ? 400 : 0 }}
          animate={{ x: 0 }}
          className={`${isMobileView ? 'w-full' : 'flex-1'} flex flex-col min-h-0`}>

          {/* HEADER */}
          <div className={`p-4 border-b flex-shrink-0 flex items-center gap-3 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
            {isMobileView && (
              <button onClick={() => setSelectedConversation(null)} className={isDark ? 'text-gray-300 hover:text-orange-400' : 'text-gray-600 hover:text-orange-500'} title="Retour">
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedConversation.companion.prenom}</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedConversation.companion.email}</p>
            </div>
          </div>

          {/* MESSAGES */}
          <div className={`flex-1 min-h-0 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
            {messages.length === 0 ? (
              <div className={`flex items-center justify-center h-full opacity-50 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <MessageCircle size={32} />
              </div>
            ) : (
              <>
                {messages.map((msg, index) => {
                  const prevMsg = index > 0 ? messages[index - 1] : null
                  const showDate = shouldShowDateSeparator(msg, prevMsg, index)

                  return (
                    <div key={msg.id}>
                      {/* DATE SEPARATOR */}
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                      )}

                      {/* MESSAGE */}
                      <motion.div
                        className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'} group mb-1`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onMouseEnter={() => msg.senderId !== user?.uid && handleMarkAsRead(msg.id)}
                      >
                        <div className="flex flex-col gap-1 max-w-sm">
                          {editingId === msg.id ? (
                            <div className={`rounded-xl p-3 ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`}>
                              <textarea
                                autoFocus
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border-2 ${isDark ? 'bg-slate-600 border-orange-500 text-white' : 'bg-white border-orange-400 text-gray-900'} focus:outline-none`}
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleEditMessage(msg.id)}
                                  className={`p-1.5 rounded ${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingId(null)
                                    setEditingText('')
                                  }}
                                  className={`p-1.5 rounded ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                className={`rounded-2xl px-4 py-2 group/msg relative ${
                                  msg.senderId === user?.uid
                                    ? isDark ?'bg-orange-600' : 'bg-orange-500 text-white'
                                    : isDark ? 'bg-slate-700 text-white' : 'bg-gray-200 text-gray-900'
                                }`}
                              >
                                <p className="break-words">{msg.text}</p>
                                {msg.isEdited && (
                                  <p className={`text-xs mt-1 ${msg.senderId === user?.uid ? 'text-orange-100' : isDark ? 'text-gray-300' : 'text-gray-400'}`}>
                                    (modifié)
                                  </p>
                                )}

                                {/* ACTIONS BUTTONS */}
                                <div className={`absolute ${msg.senderId === user?.uid ? 'right-full mr-2' : 'left-full ml-2'} bottom-0 flex gap-1 opacity-0 group-hover/msg:opacity-100 transition`}>
                                  {msg.senderId === user?.uid && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditingId(msg.id)
                                          setEditingText(msg.text)
                                        }}
                                        className={`p-1.5 rounded-full ${isDark ? 'bg-slate-600 hover:bg-slate-500' : 'bg-gray-300 hover:bg-gray-400'}`}
                                        title="Modifier"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMessage(msg.id)}
                                        className={`p-1.5 rounded-full ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-400 hover:bg-red-500'} text-white`}
                                        title="Supprimer"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </>
                                  )}
                                  <div className="relative group/emoji">
                                    <button
                                      className={`p-1.5 rounded-full ${isDark ? 'bg-slate-600 hover:bg-slate-500' : 'bg-gray-300 hover:bg-gray-400'}`}
                                      title="Ajouter une réaction"
                                    >
                                      <Smile size={14} />
                                    </button>
                                    <div className={`absolute bottom-full mb-2 left-0 hidden group-hover/emoji:flex flex-wrap gap-1 p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-white'} border ${isDark ? 'border-slate-600' : 'border-gray-300'} w-40`}>
                                      {reactions.map((emoji) => (
                                        <button
                                          key={emoji}
                                          onClick={() => handleAddReaction(msg.id, emoji)}
                                          className={`text-lg p-1 rounded hover:scale-125 transition ${msg?.reactions?.[emoji]?.includes(user.uid) ? 'bg-orange-500' : ''}`}
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* REACTIONS DISPLAY */}
                              {msg.reactions && Object.entries(msg.reactions).length > 0 && (
                                <div className={`flex flex-wrap gap-1 px-2 ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                                  {Object.entries(msg.reactions).map(([emoji, users]) => (
                                    users.length > 0 && (
                                      <div
                                        key={emoji}
                                        className={`text-sm px-2 py-1 rounded-full flex items-center gap-1 ${isDark ? 'bg-slate-700' : 'bg-gray-300'} cursor-pointer hover:scale-110 transition`}
                                        title={users.length === 1 ? '1 personne' : `${users.length} personnes`}
                                      >
                                        <span>{emoji}</span>
                                        <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{users.length}</span>
                                      </div>
                                    )
                                  ))}
                                </div>
                              )}

                              {/* TIME & READ STATUS */}
                              <div className={`flex items-center gap-1 text-xs px-2 ${isDark ? 'text-gray-400' : 'text-gray-600'} ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                                <span>{formatTime(msg.createdAt)}</span>
                                {msg.senderId === user?.uid && (
                                  <>
                                    {msg.isRead ? (
                                      <>
                                        <Eye size={12} className="text-blue-500" title={`Vu à ${formatTime(msg.readAt)}`} />
                                      </>
                                    ) : (
                                      <span className="text-gray-500">✓</span>
                                    )}
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  )
                })}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT FORM - WHATSAPP STYLE */}
          <form onSubmit={handleSendMessage} className={`p-4 border-t flex-shrink-0 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
            <div className="flex gap-2 items-center">
              
              {/* ATTACHMENT BUTTON */}
              <button
                type="button"
                className={`p-2.5 rounded-full flex-shrink-0 transition hover:scale-110 ${isDark ? 'text-orange-500 hover:bg-slate-700' : 'text-orange-600 hover:bg-gray-100'}`}
                title="Ajouter une pièce jointe"
              >
                <Plus size={24} />
              </button>

              {/* EMOJI BUTTON */}
              <button
                type="button"
                className={`p-2.5 rounded-full flex-shrink-0 transition hover:scale-110 ${isDark ? 'text-orange-500 hover:bg-slate-700' : 'text-orange-600 hover:bg-gray-100'}`}
                title="Ajouter un emoji"
              >
                <Smile size={24} />
              </button>

              {/* TEXT INPUT */}
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
                placeholder="Votre message..."
                rows={1}
                className={`flex-1 px-4 py-2.5 rounded-3xl border-0 font-medium transition resize-none max-h-32 ${isDark ? 'bg-slate-700 text-white placeholder-gray-300 focus:ring-2 focus:ring-orange-500' : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-orange-500'} focus:outline-none`}
              />

              {/* SEND/MIC BUTTON */}
              <button
                type="submit"
                className={`p-2.5 rounded-full flex-shrink-0 transition hover:scale-110 ${newMessage.trim() ? isDark ? 'text-orange-500 hover:text-orange-400' : 'text-orange-600 hover:text-orange-700' : isDark ? 'text-slate-500 hover:text-slate-400' : 'text-gray-400 hover:text-gray-500'}`}
                title={newMessage.trim() ? "Envoyer" : "Message vocal"}
              >
                {newMessage.trim() ? <Send size={24} /> : <Mic size={24} />}
              </button>

            </div>
          </form>
        </motion.div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Sélectionnez une conversation</p>
        </div>
      )}
    </div>
  )
}

export default Chat
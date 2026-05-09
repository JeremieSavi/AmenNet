import React, { useEffect, useState } from 'react'
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
  where
} from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { Send, MessageCircle, Search, ArrowLeft } from 'lucide-react'
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
        createdAt: serverTimestamp()
      }
    )

    setNewMessage('')
  }

  const handleSelectConversation = (companion) => {
    const convId = [user.uid, companion.id].sort().join('_')
    setSelectedConversation({ id: convId, companion })
    if (isMobileView) setIsMobileView(false)
  }

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>

      {/* CONVERSATIONS LIST */}
      {(!isMobileView || !selectedConversation) && (
        <div className={`w-full md:w-96 border-r flex flex-col ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
          
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
      )}

      {/* CHAT AREA */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col min-h-0">

          {/* HEADER */}
          <div className={`p-4 border-b flex-shrink-0 flex items-center gap-3 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
            {isMobileView && (
              <button onClick={() => setIsMobileView(true)} className={isDark ? 'text-gray-300' : 'text-gray-600'}>
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
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.senderId === user?.uid
                        ? isDark ? 'bg-orange-600' : 'bg-orange-500 text-white'
                        : isDark ? 'bg-slate-700 text-white' : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className={msg.senderId === user?.uid ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}>
                      {msg.text}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* INPUT FORM */}
          <form onSubmit={handleSendMessage} className={`p-4 flex gap-3 relative -top-20 border-t flex-shrink-0 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              className={`flex-1 px-4 py-2  rounded-lg border-2 font-medium transition ${isDark ? 'bg-slate-700 border-orange-500 text-white placeholder-gray-300 focus:border-orange-600' : 'bg-orange-50 border-orange-400 text-gray-900 placeholder-gray-600 focus:border-orange-600'} focus:outline-none`}
            />
            <button type="submit" className={`px-6 py-2 rounded-lg font-bold transition hover:scale-105 ${isDark ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
              <Send size={20} />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Sélectionnez une conversation</p>
        </div>
      )}
    </div>
  )
}

export default Chat
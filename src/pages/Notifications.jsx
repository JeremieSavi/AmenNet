import React, { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../services/fiebase'
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { Bell, Trash2, CheckCircle2, MessageCircle, Users, Heart, MessageSquare, Church } from 'lucide-react'

function Notifications() {
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  // Récupérer l'utilisateur actuel
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      }
    })
    return () => unsub()
  }, [])

  // Écouter les notifications en temps réel
  useEffect(() => {
    if (!user) return

    const notificationsRef = collection(db, 'users', user.uid, 'notifications')
    const q = query(notificationsRef, orderBy('createdAt', 'desc'))

    const unsub = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setNotifications(notifs)
      setLoading(false)
    })

    return () => unsub()
  }, [user])

  // Marquer comme lue
  const handleMarkAsRead = async (notificationId) => {
    if (!user) return
    try {
      await updateDoc(
        doc(db, 'users', user.uid, 'notifications', notificationId),
        { read: true }
      )
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Supprimer une notification
  const handleDeleteNotification = async (notificationId) => {
    if (!user) return
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notifications', notificationId))
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Supprimer toutes les notifications
  const handleDeleteAll = async () => {
    if (!user || notifications.length === 0) return
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications ?')) return

    try {
      for (const notif of notifications) {
        await deleteDoc(doc(db, 'users', user.uid, 'notifications', notif.id))
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Fonction pour obtenir le type d'icône basé sur le type de notification
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'companion_request':
        return <Users className='w-5 h-5 text-blue-600' />
      case 'companion_accepted':
        return <CheckCircle2 className='w-5 h-5 text-green-600' />
      case 'new_message':
        return <MessageCircle className='w-5 h-5 text-[#F97316]' />
      case 'post_liked':
        return <Heart className='w-5 h-5 text-red-600' />
      case 'post_commented':
        return <MessageSquare className='w-5 h-5 text-purple-600' />
      case 'church_published':
        return <Church className='w-5 h-5 text-amber-600' />
      default:
        return <Bell className='w-5 h-5 text-gray-600' />
    }
  }

  // Fonction pour obtenir la couleur du badge
  const getNotificationColor = (type) => {
    switch (type) {
      case 'companion_request':
        return 'bg-blue-50 border-blue-200'
      case 'companion_accepted':
        return 'bg-green-50 border-green-200'
      case 'new_message':
        return 'bg-orange-50 border-orange-200'
      case 'post_liked':
        return 'bg-red-50 border-red-200'
      case 'post_commented':
        return 'bg-purple-50 border-purple-200'
      case 'church_published':
        return 'bg-amber-50 border-amber-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  // Fonction pour formater la date
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `${diffMins}min`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}j`
    return date.toLocaleDateString('fr-FR')
  }

  if (loading) {
    return (
      <div className='bg-gray-50 min-h-screen pb-24 flex items-center justify-center'>
        <div className='text-gray-500'>Chargement...</div>
      </div>
    )
  }

  return (
    <div className='bg-gray-50 min-h-screen pb-24'>
      <div className='max-w-2xl mx-auto p-4 space-y-4'>
        {/* En-tête */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-0 z-30'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <Bell className='w-6 h-6 text-[#F97316]' />
              <h1 className='text-2xl font-bold text-gray-900'>Notifications</h1>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className='bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full'>
                  {notifications.filter(n => !n.read).length} nouvelle(s)
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className='text-red-600 hover:text-red-700 text-sm font-medium transition-colors'
              >
                Effacer tout
              </button>
            )}
          </div>
        </div>

        {/* Liste des notifications */}
        {notifications.length === 0 ? (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center'>
            <Bell className='w-12 h-12 text-gray-300 mx-auto mb-4' />
            <p className='text-gray-600 font-medium'>Aucune notification</p>
            <p className='text-sm text-gray-500 mt-1'>
              Vous recevrez une notification quand quelqu'un vous envoie une demande, accepte votre demande ou vous envoie un message.
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`rounded-xl shadow-sm border p-4 transition-all ${
                  notification.read
                    ? `${getNotificationColor(notification.type)}`
                    : `bg-white border-[#F97316] border-l-4`
                }`}
              >
                <div className='flex items-start space-x-4'>
                  <div className='flex-shrink-0 mt-1'>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notification.title}
                    </p>
                    <p className='text-gray-600 text-sm mt-1'>
                      {notification.message}
                    </p>
                    {notification.fromUserName && (
                      <p className='text-xs text-gray-500 mt-2'>
                        De: <span className='font-medium'>{notification.fromUserName}</span>
                      </p>
                    )}
                    <p className='text-xs text-gray-500 mt-2'>
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  <div className='flex-shrink-0 flex space-x-2'>
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className='text-gray-400 hover:text-[#F97316] transition-colors'
                        title='Marquer comme lue'
                      >
                        <CheckCircle2 className='w-5 h-5' />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className='text-gray-400 hover:text-red-600 transition-colors'
                      title='Supprimer'
                    >
                      <Trash2 className='w-5 h-5' />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications

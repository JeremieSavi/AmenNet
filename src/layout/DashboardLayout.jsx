import React, { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../services/fiebase'
import { doc, getDoc, collection, onSnapshot, query, where } from 'firebase/firestore'
import { User, Home, Briefcase, LogOut, Users, Bell, MessageCircle } from 'lucide-react'

function DashboardLayout() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [incomingRequestsCount, setIncomingRequestsCount] = useState(0)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)

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

  // Écouter les demandes de compagnons en attente
  useEffect(() => {
    if (!user) return

    const requestsRef = collection(db, 'users', user.uid, 'companionRequests')
    const unsub = onSnapshot(requestsRef, (snapshot) => {
      setIncomingRequestsCount(snapshot.size)
    })
    return () => unsub()
  }, [user])

  // Écouter les notifications non lues
  useEffect(() => {
    if (!user) return

    const notificationsRef = collection(db, 'users', user.uid, 'notifications')
    const q = query(notificationsRef, where('read', '==', false))
    const unsub = onSnapshot(q, (snapshot) => {
      setUnreadNotificationsCount(snapshot.size)
    })
    return () => unsub()
  }, [user])

  const getInitials = () => {
    if (userData) {
      return (userData.prenom?.charAt(0) + userData.nom?.charAt(0)).toUpperCase()
    }
    return user?.email?.charAt(0)?.toUpperCase()
  }

  const handleAvatarClick = () => {
    if (user) {
      navigate(`/profile/${user.uid}`)
    }
  }

  return (
    <div className='flex flex-col min-h-screen'>
      {/* En-tête */}
      <header className='bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40'>
        <div className='max-w-7xl mx-auto px-4 py-3 flex justify-between items-center'>
          <h1 className='text-2xl font-bold text-[#F97316]'>AmenNet</h1>
          <div className='relative'>
            <button
              onClick={handleAvatarClick}
              title='Voir mon profil'
              className='w-10 h-10 rounded-full bg-gradient-to-br from-[#F97316] to-orange-600 flex items-center justify-center text-white font-bold hover:shadow-lg transition-shadow cursor-pointer'
            >
              {getInitials()}
            </button>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className='flex-1'>
        <Outlet />
      </main>

      {/* Navigation mobile inférieure */}
      <nav className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl'>
        <div className='max-w-7xl mx-auto px-2 py-2 flex justify-around'>
          <NavLink
            to='/dashboardLayout'
            className={({ isActive }) =>
              `flex flex-col items-center space-y-1 px-6 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'text-[#F97316]'
                  : 'text-gray-600 hover:text-[#F97316]'
              }`
            }
          >
            <Home className='w-5 h-5' />
            <span className='text-xs font-medium hidden sm:inline'>Feed</span>
          </NavLink>

          <NavLink
            to='/dashboardLayout/opportunites'
            className={({ isActive }) =>
              `flex flex-col items-center space-y-1 px-6 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'text-[#F97316]'
                  : 'text-gray-600 hover:text-[#F97316]'
              }`
            }
          >
            <Briefcase className='w-5 h-5' />
            <span className='text-xs font-medium hidden sm:inline'>Opportunités</span>
          </NavLink>

          <NavLink
            to='/dashboardLayout/compagnons'
            className={({ isActive }) =>
              `flex flex-col items-center space-y-1 px-6 py-3 rounded-lg transition-colors relative ${
                isActive
                  ? 'text-[#F97316]'
                  : 'text-gray-600 hover:text-[#F97316]'
              }`
            }
          >
            <div className='relative'>
              <Users className='w-5 h-5' />
              {incomingRequestsCount > 0 && (
                <span className='absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center'>
                  {incomingRequestsCount}
                </span>
              )}
            </div>
            <span className='text-xs font-medium hidden sm:inline'>Compagnons</span>
          </NavLink>

          <NavLink
            to='/dashboardLayout/notifications'
            className={({ isActive }) =>
              `flex flex-col items-center space-y-1 px-6 py-3 rounded-lg transition-colors relative ${
                isActive
                  ? 'text-[#F97316]'
                  : 'text-gray-600 hover:text-[#F97316]'
              }`
            }
          >
            <div className='relative'>
              <Bell className='w-5 h-5' />
              {unreadNotificationsCount > 0 && (
                <span className='absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center'>
                  {unreadNotificationsCount}
                </span>
              )}
            </div>
            <span className='text-xs font-medium hidden sm:inline'>Notifications</span>
          </NavLink>

          <NavLink
            to='/dashboardLayout/chat'
            className={({ isActive }) =>
              `flex flex-col items-center space-y-1 px-6 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'text-[#F97316]'
                  : 'text-gray-600 hover:text-[#F97316]'
              }`
            }
          >
            <MessageCircle className='w-5 h-5' />
            <span className='text-xs font-medium hidden sm:inline'>Messages</span>
          </NavLink>

          <NavLink
            to='/dashboardLayout/profile'
            className={({ isActive }) =>
              `flex flex-col items-center space-y-1 px-6 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'text-[#F97316]'
                  : 'text-gray-600 hover:text-[#F97316]'
              }`
            }
          >
            <User className='w-5 h-5' />
            <span className='text-xs font-medium hidden sm:inline'>Profil</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}

export default DashboardLayout

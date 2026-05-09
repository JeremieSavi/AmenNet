import React, { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../services/fiebase'
import { doc, getDoc, collection, onSnapshot, query, where } from 'firebase/firestore'
import { User, Home, Briefcase, LogOut, Users, Bell, MessageCircle } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

function DashboardLayout() {
  const { isDark } = useTheme()
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

  return (
    <div className={isDark ? 'flex flex-col min-h-screen bg-slate-900' : 'flex flex-col min-h-screen bg-white'}>
      {/* En-tête */}
      <header className={isDark ? 'bg-slate-800 shadow-sm border-b border-slate-700 sticky top-0 z-40' : 'bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40'}>
        <div className='max-w-7xl mx-auto px-4 py-3 flex justify-between items-center'>
          <h1 className='text-2xl font-bold text-[#F97316]'>AmenNet</h1>
          <div className='relative'>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className='w-10 h-10 rounded-full bg-linear-to-br from-[#F97316] to-orange-600 flex items-center justify-center text-white font-bold hover:shadow-lg transition-shadow'
            >
              {getInitials()}
            </button>
            {showMenu && (
              <div className={isDark ? 'absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden z-50' : 'absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50'}>
                <div className={isDark ? 'p-4 border-b border-slate-700' : 'p-4 border-b border-gray-100'}>
                  <p className={isDark ? 'font-semibold text-gray-100' : 'font-semibold text-gray-900'}>
                    {userData?.prenom} {userData?.nom}
                  </p>
                  <p className={isDark ? 'text-xs text-gray-400' : 'text-xs text-gray-500'}>{user?.email}</p>
                </div>
                <nav className={isDark ? 'space-y-1 p-2' : 'space-y-1 p-2'}>
                  <NavLink
                    to='/dashboardLayout/profile'
                    onClick={() => setShowMenu(false)}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-[#F97316] text-white'
                          : isDark ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <User className='w-4 h-4' />
                    <span>Mon Profil</span>
                  </NavLink>
                </nav>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className='flex-1'>
        <Outlet />
      </main>

      {/* Navigation mobile inférieure */}
      <nav className={isDark ? 'fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 shadow-2xl' : 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl'}>
        <div className='max-w-7xl mx-auto px-2 py-2 flex justify-around'>
          <NavLink
            to='/dashboardLayout'
            className={({ isActive }) =>
              `flex flex-col items-center space-y-1 px-6 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'text-[#F97316]'
                  : isDark ? 'text-gray-400 hover:text-[#F97316]' : 'text-gray-600 hover:text-[#F97316]'
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
                  : isDark ? 'text-gray-400 hover:text-[#F97316]' : 'text-gray-600 hover:text-[#F97316]'
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
                  : isDark ? 'text-gray-400 hover:text-[#F97316]' : 'text-gray-600 hover:text-[#F97316]'
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
                  : isDark ? 'text-gray-400 hover:text-[#F97316]' : 'text-gray-600 hover:text-[#F97316]'
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
                  : isDark ? 'text-gray-400 hover:text-[#F97316]' : 'text-gray-600 hover:text-[#F97316]'
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
                  : isDark ? 'text-gray-400 hover:text-[#F97316]' : 'text-gray-600 hover:text-[#F97316]'
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

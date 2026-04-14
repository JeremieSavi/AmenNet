import React, { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../services/fiebase'
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, deleteDoc, getDocs } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Clock, CheckCircle2, X, Users, Briefcase, MapPin, Building2, Bell, MessageCircle } from 'lucide-react'
import { createCompanionRequestNotification, createCompanionAcceptedNotification } from '../services/notificationsService'

function FaithCompanions() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('discover') // 'discover' ou 'requests'
  const [incomingRequests, setIncomingRequests] = useState([])
  const [outgoingRequests, setOutgoingRequests] = useState(new Set())
  const [myCompanions, setMyCompanions] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [requestsLoading, setRequestsLoading] = useState({})

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

  // Récupérer tous les utilisateurs
  useEffect(() => {
    if (!user) return

    const usersQuery = collection(db, 'users')
    const unsub = onSnapshot(usersQuery, async (snapshot) => {
      const usersData = snapshot.docs
        .filter(doc => doc.id !== user.uid) // Exclure l'utilisateur actuel
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => {
          const nameA = a.accountType === 'Église' ? a.egliseName : `${a.prenom} ${a.nom}`
          const nameB = b.accountType === 'Église' ? b.egliseName : `${b.prenom} ${b.nom}`
          return nameA.localeCompare(nameB)
        })

      setAllUsers(usersData)
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  // Récupérer les demandes reçues
  useEffect(() => {
    if (!user) return

    const requestsRef = collection(db, 'users', user.uid, 'companionRequests')
    const unsub = onSnapshot(requestsRef, async (snapshot) => {
      const requestIds = snapshot.docs.map(doc => doc.id)
      
      // Récupérer les données de chaque demandeur
      const requestsData = await Promise.all(
        requestIds.map(async (uid) => {
          const userRef = doc(db, 'users', uid)
          const userSnap = await getDoc(userRef)
          return userSnap.exists() ? { id: uid, ...userSnap.data() } : null
        })
      )
      
      setIncomingRequests(requestsData.filter(r => r !== null))
    })
    return () => unsub()
  }, [user])

  // Récupérer les demandes envoyées
  useEffect(() => {
    if (!user) return

    const requestsRef = collection(db, 'users', user.uid, 'outgoingRequests')
    const unsub = onSnapshot(requestsRef, (snapshot) => {
      setOutgoingRequests(new Set(snapshot.docs.map(doc => doc.id)))
    })
    return () => unsub()
  }, [user])

  // Récupérer mes compagnons de foi
  useEffect(() => {
    if (!user) return

    const companionsRef = collection(db, 'users', user.uid, 'faithCompanions')
    const unsub = onSnapshot(companionsRef, (snapshot) => {
      setMyCompanions(new Set(snapshot.docs.map(doc => doc.id)))
    })
    return () => unsub()
  }, [user])

  // Filtrer les utilisateurs
  useEffect(() => {
    let filtered = allUsers

    if (searchQuery) {
      filtered = filtered.filter(u => {
        const name = u.accountType === 'Église' 
          ? u.egliseName?.toLowerCase() 
          : `${u.prenom} ${u.nom}`.toLowerCase()
        return name.includes(searchQuery.toLowerCase())
      })
    }

    setFilteredUsers(filtered)
  }, [allUsers, searchQuery])

  // Envoyer une demande de compagnon
  const handleSendRequest = async (targetUserId) => {
    if (!user || !userData) return

    setRequestsLoading(prev => ({ ...prev, [targetUserId]: true }))
    try {
      // Ajouter à mes demandes envoyées
      await setDoc(doc(db, 'users', user.uid, 'outgoingRequests', targetUserId), {
        sentAt: new Date()
      })

      // Ajouter aux demandes reçues de l'autre utilisateur
      await setDoc(doc(db, 'users', targetUserId, 'companionRequests', user.uid), {
        receivedAt: new Date()
      })

      // Créer une notification
      const senderName = userData.accountType === 'Église' 
        ? userData.egliseName 
        : `${userData.prenom} ${userData.nom}`
      await createCompanionRequestNotification(targetUserId, user.uid, senderName)
    } catch (error) {
      console.error('Erreur:', error)
      alert('⛔ Erreur lors de l\'envoi de la demande')
    } finally {
      setRequestsLoading(prev => ({ ...prev, [targetUserId]: false }))
    }
  }

  // Annuler une demande envoyée
  const handleCancelRequest = async (targetUserId) => {
    if (!user) return

    setRequestsLoading(prev => ({ ...prev, [targetUserId]: true }))
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'outgoingRequests', targetUserId))
      await deleteDoc(doc(db, 'users', targetUserId, 'companionRequests', user.uid))
    } catch (error) {
      console.error('Erreur:', error)
      alert('⛔ Erreur lors de l\'annulation')
    } finally {
      setRequestsLoading(prev => ({ ...prev, [targetUserId]: false }))
    }
  }

  // Accepter une demande
  const handleAcceptRequest = async (senderId) => {
    if (!user || !userData) return

    setRequestsLoading(prev => ({ ...prev, [senderId]: true }))
    try {
      // Ajouter comme compagnon de foi
      await setDoc(doc(db, 'users', user.uid, 'faithCompanions', senderId), {
        addedAt: new Date()
      })

      // Ajouter aussi de son côté
      await setDoc(doc(db, 'users', senderId, 'faithCompanions', user.uid), {
        addedAt: new Date()
      })

      // Supprimer la demande
      await deleteDoc(doc(db, 'users', user.uid, 'companionRequests', senderId))
      await deleteDoc(doc(db, 'users', senderId, 'outgoingRequests', user.uid))

      // Créer une notification d'acceptation
      const acceptorName = userData.accountType === 'Église' 
        ? userData.egliseName 
        : `${userData.prenom} ${userData.nom}`
      await createCompanionAcceptedNotification(senderId, acceptorName)
    } catch (error) {
      console.error('Erreur:', error)
      alert('⛔ Erreur lors de l\'acceptation')
    } finally {
      setRequestsLoading(prev => ({ ...prev, [senderId]: false }))
    }
  }

  // Refuser une demande
  const handleRejectRequest = async (senderId) => {
    if (!user) return

    setRequestsLoading(prev => ({ ...prev, [senderId]: true }))
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'companionRequests', senderId))
      await deleteDoc(doc(db, 'users', senderId, 'outgoingRequests', user.uid))
    } catch (error) {
      console.error('Erreur:', error)
      alert('⛔ Erreur lors du refus')
    } finally {
      setRequestsLoading(prev => ({ ...prev, [senderId]: false }))
    }
  }

  const getUserDisplayName = (u) => {
    if (u.accountType === 'Église') {
      return u.egliseName
    }
    return `${u.prenom} ${u.nom}`
  }

  const getUserSecondaryInfo = (u) => {
    if (u.accountType === 'Église') {
      return u.egliseAdresse
    }
    return u.profession
  }

  const getButtonState = (userId) => {
    if (myCompanions.has(userId)) return 'companion'
    if (outgoingRequests.has(userId)) return 'pending'
    return 'none'
  }

  const handleStartChat = (userId) => {
    navigate(`/dashboardLayout/chat?with=${userId}`)
  }

  return (
    <div className='bg-gray-50 min-h-screen pb-24'>
      <div className='max-w-4xl mx-auto p-4 space-y-6'>
        {/* En-tête */}
        <div className='bg-linear-to-r from-[#F97316] via-orange-500 to-orange-400 rounded-xl shadow-lg p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <Users className='w-8 h-8' />
              <h1 className='text-3xl font-bold'>Compagnons de Foi</h1>
            </div>
            {incomingRequests.length > 0 && (
              <div className='bg-red-500 rounded-full w-8 h-8 flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>{incomingRequests.length}</span>
              </div>
            )}
          </div>
          <p className='text-orange-100 mt-2'>Trouvez et connectez-vous avec d'autres fidèles</p>
        </div>

        {/* Onglets */}
        <div className='flex gap-2 border-b border-gray-200'>
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'discover'
                ? 'border-[#F97316] text-[#F97316]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className='w-4 h-4 inline mr-2' />
            Découvrir
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors relative ${
              activeTab === 'requests'
                ? 'border-[#F97316] text-[#F97316]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bell className='w-4 h-4 inline mr-2' />
            Demandes
            {incomingRequests.length > 0 && (
              <span className='absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                {incomingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab: Découvrir */}
        {activeTab === 'discover' && (
          <div className='space-y-6'>
            {/* Barre de recherche */}
            <div className='relative'>
              <Search className='absolute left-3 top-3 w-5 h-5 text-gray-400' />
              <input
                type='text'
                placeholder='Rechercher un utilisateur...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
              />
            </div>

            {/* Liste des utilisateurs */}
            {loading ? (
              <div className='text-center py-12'>
                <div className='w-8 h-8 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
                <p className='text-gray-600'>Chargement des utilisateurs...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center'>
                <Users className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                <p className='text-gray-600 font-medium'>Aucun utilisateur trouvé</p>
                <p className='text-sm text-gray-500 mt-1'>Essayez une autre recherche</p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {filteredUsers.map(u => {
                  const buttonState = getButtonState(u.id)
                  return (
                    <div key={u.id} className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition'>
                      <div className='bg-linear-to-r from-blue-50 to-blue-100 h-16'></div>
                      
                      <div className='p-4 space-y-3'>
                        {/* En-tête utilisateur */}
                        <div className='flex items-start justify-between -mt-10 mb-4'>
                          <div className='w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm shrink-0'>
                            {getUserDisplayName(u)?.charAt(0)}
                          </div>
                          {u.certified && u.accountType === 'Église' && (
                            <CheckCircle2 className='w-5 h-5 text-blue-600' />
                          )}
                        </div>

                        {/* Nom */}
                        <div
                          onClick={() => navigate(`/dashboardLayout/profile/${u.id}`)}
                          className='cursor-pointer'
                        >
                          <h3 className='text-lg font-bold text-gray-900 truncate hover:text-[#F97316] transition-colors'>
                            {getUserDisplayName(u)}
                          </h3>
                        </div>

                        {/* Info secondaire */}
                        {getUserSecondaryInfo(u) && (
                          <div className='flex items-start space-x-2 text-gray-700'>
                            {u.accountType === 'Église' ? (
                              <>
                                <MapPin className='w-4 h-4 text-[#F97316] mt-0.5 shrink-0' />
                                <p className='text-sm line-clamp-2'>{u.egliseAdresse}</p>
                              </>
                            ) : (
                              <>
                                <Briefcase className='w-4 h-4 text-[#F97316] mt-0.5 shrink-0' />
                                <p className='text-sm'>{u.profession}</p>
                              </>
                            )}
                          </div>
                        )}

                        {/* Bouton d'action */}
                        <div className='pt-2 border-t border-gray-100 space-y-2'>
                          {/* Bouton Message */}
                          <button
                            onClick={() => handleStartChat(u.id)}
                            className='w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-colors'
                          >
                            <MessageCircle className='w-4 h-4' />
                            <span>Envoyer un message</span>
                          </button>

                          {/* Bouton Compagnon de foi */}
                          {buttonState === 'companion' ? (
                            <button
                              disabled
                              className='w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-sm'
                            >
                              <CheckCircle2 className='w-4 h-4' />
                              <span>Compagnon de foi</span>
                            </button>
                          ) : buttonState === 'pending' ? (
                            <button
                              onClick={() => handleCancelRequest(u.id)}
                              disabled={requestsLoading[u.id]}
                              className='w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-sm'
                            >
                              <Clock className='w-4 h-4' />
                              <span>Demande en attente</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSendRequest(u.id)}
                              disabled={requestsLoading[u.id]}
                              className='w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[#F97316] text-white rounded-lg hover:bg-orange-600 font-semibold text-sm disabled:opacity-50'
                            >
                              <UserPlus className='w-4 h-4' />
                              <span>Ajouter comme compagnon</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Demandes */}
        {activeTab === 'requests' && (
          <div className='space-y-6'>
            {incomingRequests.length === 0 ? (
              <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center'>
                <Bell className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                <p className='text-gray-600 font-medium'>Aucune demande en attente</p>
                <p className='text-sm text-gray-500 mt-1'>Vous recevrez une notification quand quelqu'un vous demandera d'être compagnon de foi</p>
              </div>
            ) : (
              <div className='space-y-3'>
                {incomingRequests.map(request => (
                  <div key={request.id} className='bg-white rounded-xl shadow-sm border border-gray-200 p-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3 flex-1 min-w-0'>
                        <div className='w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0'>
                          {getUserDisplayName(request)?.charAt(0)}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h4 
                            onClick={() => navigate(`/dashboardLayout/profile/${request.id}`)}
                            className='font-semibold text-gray-900 truncate cursor-pointer hover:text-[#F97316] transition-colors'
                          >
                            {getUserDisplayName(request)}
                          </h4>
                          {getUserSecondaryInfo(request) && (
                            <p className='text-xs text-gray-500 truncate'>
                              {request.accountType === 'Église' ? (
                                <span className='flex items-center gap-1'>
                                  <MapPin className='w-3 h-3' />
                                  {request.egliseAdresse}
                                </span>
                              ) : (
                                <span className='flex items-center gap-1'>
                                  <Briefcase className='w-3 h-3' />
                                  {request.profession}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className='flex gap-2 ml-2 shrink-0'>
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={requestsLoading[request.id]}
                          className='flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm disabled:opacity-50'
                        >
                          <CheckCircle2 className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={requestsLoading[request.id]}
                          className='flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm disabled:opacity-50'
                        >
                          <X className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Statistiques */}
        {!loading && (
          <div className='grid grid-cols-3 gap-4'>
            <div className='bg-white rounded-xl shadow-sm p-4 border border-gray-200 text-center'>
              <p className='text-2xl font-bold text-[#F97316]'>{allUsers.length}</p>
              <p className='text-gray-600 text-sm font-medium'>Utilisateurs</p>
            </div>
            <div className='bg-white rounded-xl shadow-sm p-4 border border-gray-200 text-center'>
              <p className='text-2xl font-bold text-orange-600'>{outgoingRequests.size}</p>
              <p className='text-gray-600 text-sm font-medium'>Demandes envoyées</p>
            </div>
            <div className='bg-white rounded-xl shadow-sm p-4 border border-gray-200 text-center'>
              <p className='text-2xl font-bold text-green-600'>{myCompanions.size}</p>
              <p className='text-gray-600 text-sm font-medium'>Compagnons</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FaithCompanions

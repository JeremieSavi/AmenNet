import React, { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../services/fiebase'
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { MapPin, Building2, CheckCircle2, UserPlus, UserCheck, Search, Filter } from 'lucide-react'

function Opportunites() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [churches, setChurches] = useState([])
  const [filteredChurches, setFilteredChurches] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedQuartier, setSelectedQuartier] = useState('')
  const [quartiers, setQuartiers] = useState([])
  const [loadingFollow, setLoadingFollow] = useState({})
  const [followedChurches, setFollowedChurches] = useState(new Set())
  const [loading, setLoading] = useState(true)

  // Récupérer l'utilisateur actuel
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        navigate('/login')
      }
    })
    return () => unsub()
  }, [navigate])

  // Récupérer toutes les églises
  useEffect(() => {
    const churchesQuery = query(
      collection(db, 'users'),
      where('accountType', '==', 'Église')
    )
    const unsub = onSnapshot(churchesQuery, async (snapshot) => {
      const churchesData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => (a.egliseName || '').localeCompare(b.egliseName || ''))

      setChurches(churchesData)

      // Extraire les quartiers uniques
      const uniqueQuartiers = [...new Set(
        churchesData
          .map(c => c.egliseAdresse?.split(',')[1]?.trim())
          .filter(Boolean)
      )].sort()
      setQuartiers(uniqueQuartiers)

      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Récupérer les églises suivies par l'utilisateur
  useEffect(() => {
    if (user) {
      const companionsRef = collection(db, 'users', user.uid, 'faithCompanions')
      const unsub = onSnapshot(companionsRef, (snapshot) => {
        setFollowedChurches(new Set(snapshot.docs.map(doc => doc.id)))
      })
      return () => unsub()
    }
  }, [user])

  // Filtrer les églises
  useEffect(() => {
    let filtered = churches

    // Filtrer par recherche
    if (searchQuery) {
      filtered = filtered.filter(church =>
        church.egliseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        church.egliseAdresse?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filtrer par quartier
    if (selectedQuartier) {
      filtered = filtered.filter(church =>
        church.egliseAdresse?.includes(selectedQuartier)
      )
    }

    setFilteredChurches(filtered)
  }, [churches, searchQuery, selectedQuartier])

  // Toggler le suivi d'une église
  const handleFollowToggle = async (churchId) => {
    if (!user) return

    setLoadingFollow(prev => ({ ...prev, [churchId]: true }))
    try {
      if (followedChurches.has(churchId)) {
        // Retirer du suivi
        await deleteDoc(doc(db, 'users', user.uid, 'faithCompanions', churchId))
      } else {
        // Ajouter au suivi
        await setDoc(doc(db, 'users', user.uid, 'faithCompanions', churchId), {
          addedAt: new Date()
        })
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('⛔ Erreur lors de la mise à jour')
    } finally {
      setLoadingFollow(prev => ({ ...prev, [churchId]: false }))
    }
  }

  const navigateToProfile = (churchId) => {
    navigate(`/dashboardLayout/profile/${churchId}`)
  }

  return (
    <div className='bg-gray-50 min-h-screen pb-24'>
      <div className='max-w-4xl mx-auto p-4 space-y-6'>
        {/* En-tête */}
        <div className='bg-gradient-to-r from-[#F97316] via-orange-500 to-orange-400 rounded-xl shadow-lg p-6 text-white'>
          <div className='flex items-center space-x-3 mb-2'>
            <Building2 className='w-8 h-8' />
            <h1 className='text-3xl font-bold'>Églises & Opportunités</h1>
          </div>
          <p className='text-orange-100'>Découvrez les églises de votre communauté et trouvez vos compagnons de foi</p>
        </div>

        {/* Barre de recherche et filtres */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3'>
          {/* Recherche */}
          <div className='relative'>
            <Search className='absolute left-3 top-3 w-5 h-5 text-gray-400' />
            <input
              type='text'
              placeholder='Rechercher une église...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
            />
          </div>

          {/* Filtres par quartier */}
          {quartiers.length > 0 && (
            <div className='space-y-2'>
              <div className='flex items-center space-x-2 text-sm font-semibold text-gray-700'>
                <Filter className='w-4 h-4' />
                <span>Filtrer par quartier</span>
              </div>
              <div className='flex flex-wrap gap-2'>
                <button
                  onClick={() => setSelectedQuartier('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedQuartier === ''
                      ? 'bg-[#F97316] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Tous
                </button>
                {quartiers.map(quartier => (
                  <button
                    key={quartier}
                    onClick={() => setSelectedQuartier(quartier)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedQuartier === quartier
                        ? 'bg-[#F97316] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {quartier}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Liste des églises */}
        {loading ? (
          <div className='text-center py-12'>
            <div className='w-8 h-8 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
            <p className='text-gray-600'>Chargement des églises...</p>
          </div>
        ) : filteredChurches.length === 0 ? (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center'>
            <Building2 className='w-12 h-12 text-gray-300 mx-auto mb-4' />
            <p className='text-gray-600 font-medium'>Aucune église trouvée</p>
            <p className='text-sm text-gray-500 mt-1'>Essayez de modifier votre recherche ou vos filtres</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {filteredChurches.map(church => (
              <div
                key={church.id}
                className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition cursor-pointer group'
              >
                <div className='bg-gradient-to-r from-blue-50 to-blue-100 h-16'></div>
                
                <div className='p-4 space-y-3'>
                  {/* En-tête de l'église */}
                  <div className='flex items-start justify-between -mt-10 mb-4'>
                    <div className='w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm flex-shrink-0'>
                      {church.egliseName?.charAt(0)}
                    </div>
                    {church.certified && (
                      <div className='flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-full'>
                        <CheckCircle2 className='w-4 h-4 text-blue-600' />
                        <span className='text-xs font-semibold text-blue-600'>Certifiée</span>
                      </div>
                    )}
                  </div>

                  {/* Nom de l'église */}
                  <div>
                    <h3 
                      className='text-lg font-bold text-gray-900 truncate hover:text-[#F97316] transition-colors'
                      onClick={() => navigateToProfile(church.id)}
                    >
                      {church.egliseName}
                    </h3>
                  </div>

                  {/* Adresse */}
                  <div className='flex items-start space-x-2 text-gray-700'>
                    <MapPin className='w-4 h-4 text-[#F97316] mt-0.5 flex-shrink-0' />
                    <p className='text-sm line-clamp-2'>{church.egliseAdresse}</p>
                  </div>

                  {/* Bouton de suivi */}
                  <div className='pt-2 border-t border-gray-100'>
                    <button
                      onClick={() => handleFollowToggle(church.id)}
                      disabled={loadingFollow[church.id]}
                      className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors font-semibold text-sm ${
                        followedChurches.has(church.id)
                          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          : 'bg-[#F97316] text-white hover:bg-orange-600'
                      } disabled:opacity-50`}
                    >
                      {followedChurches.has(church.id) ? (
                        <>
                          <UserCheck className='w-4 h-4' />
                          <span>Suivi</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className='w-4 h-4' />
                          <span>Suivre</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistiques */}
        {!loading && churches.length > 0 && (
          <div className='grid grid-cols-3 gap-4'>
            <div className='bg-white rounded-xl shadow-sm p-4 border border-gray-200 text-center'>
              <p className='text-2xl font-bold text-[#F97316]'>{churches.length}</p>
              <p className='text-gray-600 text-sm font-medium'>Églises</p>
            </div>
            <div className='bg-white rounded-xl shadow-sm p-4 border border-gray-200 text-center'>
              <p className='text-2xl font-bold text-blue-600'>{quartiers.length}</p>
              <p className='text-gray-600 text-sm font-medium'>Quartiers</p>
            </div>
            <div className='bg-white rounded-xl shadow-sm p-4 border border-gray-200 text-center'>
              <p className='text-2xl font-bold text-green-600'>{followedChurches.size}</p>
              <p className='text-gray-600 text-sm font-medium'>Suivi</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Opportunites
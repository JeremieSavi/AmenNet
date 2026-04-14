import React, { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, db } from '../services/fiebase'
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot, orderBy, setDoc, deleteDoc, getDocs, collectionGroup } from 'firebase/firestore'
import { useNavigate, useParams } from 'react-router-dom'
import { LogOut, Edit2, Save, X, Mail, Briefcase, MapPin, User, Building2, CheckCircle2, UserPlus, UserCheck, Users } from 'lucide-react'

function Profile() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userPosts, setUserPosts] = useState([])
  const [savedPosts, setSavedPosts] = useState([])
  const [faithCompanions, setFaithCompanions] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followingLoading, setFollowingLoading] = useState(false)
  const [profileUserId, setProfileUserId] = useState(null)
  const [isOwnProfile, setIsOwnProfile] = useState(true)
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    profession: '',
    quatier: '',
    egliseName: '',
    egliseAdresse: ''
  })

  // Récupérer l'utilisateur actuel
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        // Initialiser le profileUserId
        setProfileUserId(userId || currentUser.uid)
        try {
          const userRef = doc(db, 'users', currentUser.uid)
          const userSnap = await getDoc(userRef)
          if (userSnap.exists()) {
            const data = userSnap.data()
            setUserData(data)
            setFormData({
              prenom: data.prenom || '',
              nom: data.nom || '',
              profession: data.profession || '',
              quatier: data.quatier || '',
              egliseName: data.egliseName || '',
              egliseAdresse: data.egliseAdresse || ''
            })

            // Écouter les posts de l'utilisateur en temps réel
            const postsQuery = query(
              collection(db, 'posts'),
              where('authorId', '==', currentUser.uid),
              orderBy('createdAt', 'desc')
            )
            const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
              setUserPosts(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })))
            })
            return () => unsubPosts()
          }
        } catch (error) {
          console.error("Erreur:", error)
        }
      } else {
        navigate('/login')
      }
    })
    return () => unsub()
  }, [navigate])

  // Charger les compagnons de foi
  useEffect(() => {
    if (user && profileUserId) {
      const companionsRef = collection(db, 'users', profileUserId, 'faithCompanions')
      const unsubCompanions = onSnapshot(companionsRef, async (snapshot) => {
        const companionIds = snapshot.docs.map(doc => doc.id)
        
        // Récupérer les données de chaque compagnon
        const companionsData = await Promise.all(
          companionIds.map(async (uid) => {
            const userRef = doc(db, 'users', uid)
            const userSnap = await getDoc(userRef)
            return userSnap.exists() ? { id: uid, ...userSnap.data() } : null
          })
        )
        
        setFaithCompanions(companionsData.filter(c => c !== null))
      })
      return () => unsubCompanions()
    }
  }, [user, profileUserId])

  // Vérifier si l'utilisateur actuel suit ce profil
  useEffect(() => {
    if (user && profileUserId && user.uid !== profileUserId) {
      setIsOwnProfile(false)
      const companionRef = doc(db, 'users', user.uid, 'faithCompanions', profileUserId)
      getDoc(companionRef).then(snapshot => {
        setIsFollowing(snapshot.exists())
      })
    } else if (user && profileUserId && user.uid === profileUserId) {
      setIsOwnProfile(true)
    }
  }, [user, profileUserId])

  // Charger les demandes reçues (seulement pour son propre profil)
  useEffect(() => {
    if (user && isOwnProfile) {
      const requestsRef = collection(db, 'users', user.uid, 'companionRequests')
      const unsub = onSnapshot(requestsRef, async (snapshot) => {
        const requestIds = snapshot.docs.map(doc => doc.id)
        
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
    }
  }, [user, isOwnProfile])

  // Charger les publications sauvegardées (seulement pour son propre profil)
  useEffect(() => {
    if (user && isOwnProfile) {
      const savedPostsQuery = query(
        collection(db, 'savedPosts'),
        where('userId', '==', user.uid),
        orderBy('savedAt', 'desc')
      )
      const unsub = onSnapshot(savedPostsQuery, async (snapshot) => {
        const savedPostsData = await Promise.all(
          snapshot.docs.map(async (savedDoc) => {
            try {
              const postRef = doc(db, 'posts', savedDoc.data().postId)
              const postSnap = await getDoc(postRef)
              return postSnap.exists() 
                ? { 
                    id: savedDoc.data().postId, 
                    ...postSnap.data(),
                    savedAt: savedDoc.data().savedAt
                  } 
                : null
            } catch (error) {
              console.error('Erreur chargement post sauvegardé:', error)
              return null
            }
          })
        )
        setSavedPosts(savedPostsData.filter(p => p !== null))
      })
      return () => unsub()
    }
  }, [user, isOwnProfile])

  // Ajouter/Retirer un compagnon de foi
  const handleFollowToggle = async () => {
    if (!user || !profileUserId) return
    
    setFollowingLoading(true)
    try {
      if (isFollowing) {
        // Retirer comme compagnon
        await deleteDoc(doc(db, 'users', user.uid, 'faithCompanions', profileUserId))
      } else {
        // Ajouter comme compagnon
        await setDoc(doc(db, 'users', user.uid, 'faithCompanions', profileUserId), {
          addedAt: new Date()
        })
      }
      setIsFollowing(!isFollowing)
    } catch (error) {
      console.error("Erreur:", error)
      alert('⛔ Erreur lors de la mise à jour')
    } finally {
      setFollowingLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      const userRef = doc(db, 'users', user.uid)
      const updateData = {
        prenom: formData.prenom,
        nom: formData.nom,
        profession: formData.profession,
        quatier: formData.quatier
      }

      // Ajouter les champs Église si applicable
      if (userData?.accountType === 'Église') {
        updateData.egliseName = formData.egliseName
        updateData.egliseAdresse = formData.egliseAdresse
      }

      await updateDoc(userRef, updateData)
      setUserData({ ...userData, ...updateData })
      setIsEditing(false)
      alert('Profil mis à jour avec succès!')
    } catch (error) {
      console.error("Erreur:", error)
      alert('Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      try {
        await signOut(auth)
        navigate('/login')
      } catch (error) {
        console.error("Erreur déconnexion:", error)
      }
    }
  }

  const getInitials = () => {
    return (formData.prenom?.charAt(0) + formData.nom?.charAt(0)).toUpperCase()
  }

  const getPostAuthorName = (post) => {
    // Si c'est une église, afficher le nom de l'église
    if (post?.authorAccountType === 'Église' && post?.authorEgliseName) {
      return post.authorEgliseName
    }
    // Sinon afficher autorName (prenom + nom)
    return post?.authorName || 'Utilisateur'
  }

  const formatDate = (date) => {
    if (!date) return 'À l\'instant'
    const d = new Date(date.toDate ? date.toDate() : date)
    return d.toLocaleDateString('fr-FR')
  }

  return (
    <div className='bg-gray-50 min-h-screen pb-24'>
      <div className='max-w-3xl mx-auto p-4 space-y-6'>
        {/* En-tête du profil */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
          {/* Bannière de fond */}
          <div className='h-28 bg-gradient-to-r from-[#F97316] via-orange-500 to-orange-400'></div>

          {/* Infos profil */}
          <div className='px-6 pb-6'>
            <div className='flex flex-col sm:flex-row sm:items-end sm:space-x-4 -mt-16 mb-6'>
              {/* Avatar */}
              <div className='w-32 h-32 rounded-full bg-gradient-to-br from-[#F97316] to-orange-600 flex items-center justify-center text-white font-bold text-5xl border-4 border-white shadow-lg flex-shrink-0'>
                {getInitials()}
              </div>

              <div className='flex-1 mt-4 sm:mt-0'>
                {!isEditing ? (
                  <div>
                    {userData?.accountType === 'Église' ? (
                      <>
                        <div className='flex items-center space-x-3 mb-2'>
                          <h1 className='text-3xl font-bold text-gray-900'>
                            {userData?.egliseName}
                          </h1>
                          {userData?.certified && (
                            <div className='flex items-center space-x-1 bg-blue-50 px-3 py-1 rounded-full'>
                              <CheckCircle2 className='w-5 h-5 text-blue-600' />
                              <span className='text-sm font-semibold text-blue-600'>Certifiée</span>
                            </div>
                          )}
                        </div>
                        {userData?.egliseAdresse && (
                          <p className='text-lg text-[#F97316] font-semibold flex items-center gap-2'>
                            <MapPin className='w-5 h-5' />
                            {userData.egliseAdresse}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <h1 className='text-3xl font-bold text-gray-900 mb-1'>
                          {formData.prenom} {formData.nom}
                        </h1>
                        {formData.profession && (
                          <p className='text-lg text-[#F97316] font-semibold flex items-center gap-2'>
                            <Briefcase className='w-5 h-5' />
                            {formData.profession}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {userData?.accountType === 'Église' ? (
                      <>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>Nom de l'Église</label>
                          <input
                            type='text'
                            name='egliseName'
                            value={formData.egliseName || ''}
                            onChange={handleInputChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
                            placeholder="Nom de l\'Église"
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>Adresse</label>
                          <input
                            type='text'
                            name='egliseAdresse'
                            value={formData.egliseAdresse || ''}
                            onChange={handleInputChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
                            placeholder="Adresse de l\'Église"
                          />
                        </div>
                      </>
                    ) : (
                      <div className='grid grid-cols-2 gap-3'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>Prénom</label>
                          <input
                            type='text'
                            name='prenom'
                            value={formData.prenom}
                            onChange={handleInputChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
                            placeholder='Prénom'
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>Nom</label>
                          <input
                            type='text'
                            name='nom'
                            value={formData.nom}
                            onChange={handleInputChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
                            placeholder='Nom'
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Boutons action */}
              <div className='flex flex-wrap gap-2 mt-4 sm:mt-0'>
                {!isEditing ? (
                  <>
                    {isOwnProfile ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className='flex items-center space-x-2 px-4 py-2 bg-[#F97316] text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold'
                      >
                        <Edit2 className='w-4 h-4' />
                        <span>Modifier</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleFollowToggle}
                        disabled={followingLoading}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-semibold ${
                          isFollowing
                            ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            : 'bg-[#F97316] text-white hover:bg-orange-600'
                        } disabled:opacity-50`}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className='w-4 h-4' />
                            <span>Compagnon suivi</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className='w-4 h-4' />
                            <span>Ajouter comme compagnon</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className='flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50'
                    >
                      <Save className='w-4 h-4' />
                      <span>Enregistrer</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setFormData({
                          prenom: userData?.prenom || '',
                          nom: userData?.nom || '',
                          profession: userData?.profession || '',
                          quatier: userData?.quatier || '',
                          egliseName: userData?.egliseName || '',
                          egliseAdresse: userData?.egliseAdresse || ''
                        })
                      }}
                      className='flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold'
                    >
                      <X className='w-4 h-4' />
                      <span>Annuler</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Infos supplémentaires */}
            {isEditing ? (
              <div className='space-y-3'>
                {userData?.accountType === 'Église' ? (
                  <>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Nom de l'Église</label>
                      <input
                        type='text'
                        name='egliseName'
                        value={formData.egliseName}
                        onChange={handleInputChange}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
                        placeholder="Nom de l\'Église"
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Adresse</label>
                      <input
                        type='text'
                        name='egliseAdresse'
                        value={formData.egliseAdresse}
                        onChange={handleInputChange}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
                        placeholder="Adresse de l\'Église"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Profession</label>
                      <input
                        type='text'
                        name='profession'
                        value={formData.profession}
                        onChange={handleInputChange}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
                        placeholder='Votre profession'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Quartier</label>
                      <input
                        type='text'
                        name='quatier'
                        value={formData.quatier}
                        onChange={handleInputChange}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
                        placeholder='Votre quartier'
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {userData?.accountType === 'Église' ? (
                  <>
                    {formData.egliseAdresse && (
                      <div className='flex items-center space-x-3 text-gray-700'>
                        <MapPin className='w-5 h-5 text-[#F97316]' />
                        <div>
                          <p className='text-xs text-gray-500'>Adresse</p>
                          <p className='font-medium'>{formData.egliseAdresse}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {formData.profession && (
                      <div className='flex items-center space-x-3 text-gray-700'>
                        <Briefcase className='w-5 h-5 text-[#F97316]' />
                        <div>
                          <p className='text-xs text-gray-500'>Profession</p>
                          <p className='font-medium'>{formData.profession}</p>
                        </div>
                      </div>
                    )}

                    {formData.quatier && (
                      <div className='flex items-center space-x-3 text-gray-700'>
                        <MapPin className='w-5 h-5 text-[#F97316]' />
                        <div>
                          <p className='text-xs text-gray-500'>Quartier</p>
                          <p className='font-medium'>{formData.quatier}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {user && (
                  <div className='flex items-center space-x-3 text-gray-700'>
                    <Mail className='w-5 h-5 text-[#F97316]' />
                    <div>
                      <p className='text-xs text-gray-500'>Email</p>
                      <p className='font-medium text-sm truncate'>{user.email}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className='grid grid-cols-3 gap-4'>
          <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-200 text-center hover:shadow-md transition'>
            <p className='text-3xl font-bold text-[#F97316] mb-2'>{userPosts.length}</p>
            <p className='text-gray-600 font-medium'>Publications</p>
          </div>
          <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-200 text-center hover:shadow-md transition'>
            <p className='text-3xl font-bold text-blue-600 mb-2'>{faithCompanions.length}</p>
            <p className='text-gray-600 font-medium'>Compagnons de foi</p>
          </div>
          <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-200 text-center hover:shadow-md transition'>
            <p className='text-3xl font-bold text-green-600 mb-2'>
              {isOwnProfile ? incomingRequests.length : (isFollowing ? '✓' : '—')}
            </p>
            <p className='text-gray-600 font-medium'>
              {isOwnProfile ? 'Demandes en attente' : (isFollowing ? 'Compagnon suivi' : 'Non compagnon')}
            </p>
          </div>
        </div>

        {/* Compagnons de Foi */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center space-x-2 mb-4'>
            <Users className='w-6 h-6 text-[#F97316]' />
            <h2 className='text-2xl font-bold text-gray-900'>Compagnons de Foi</h2>
            <span className='ml-auto bg-[#F97316] text-white px-3 py-1 rounded-full text-sm font-semibold'>
              {faithCompanions.length}
            </span>
          </div>
          {faithCompanions.length === 0 ? (
            <p className='text-gray-500 text-center py-8'>
              {isOwnProfile ? 'Aucun compagnon de foi pour le moment' : 'Cet utilisateur n\'a pas encore de compagnons'}
            </p>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {faithCompanions.map((companion) => (
                <div key={companion.id} className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 rounded-full bg-gradient-to-br from-[#F97316] to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0'>
                      {companion.accountType === 'Église' 
                        ? companion.egliseName?.charAt(0)
                        : (companion.prenom?.charAt(0) + companion.nom?.charAt(0)).toUpperCase()
                      }
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='font-semibold text-gray-900 truncate'>
                        {companion.accountType === 'Église' ? companion.egliseName : `${companion.prenom} ${companion.nom}`}
                      </p>
                      {companion.accountType === 'Église' ? (
                        <p className='text-xs text-gray-500 flex items-center gap-1'>
                          <Building2 className='w-3 h-3' />
                          {companion.egliseAdresse}
                        </p>
                      ) : (
                        <p className='text-xs text-gray-500 flex items-center gap-1'>
                          <Briefcase className='w-3 h-3' />
                          {companion.profession}
                        </p>
                      )}
                    </div>
                    {companion.certified && companion.accountType === 'Église' && (
                      <CheckCircle2 className='w-5 h-5 text-blue-600 flex-shrink-0' />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mes publications */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>Mes publications</h2>
          {userPosts.length === 0 ? (
            <p className='text-gray-500 text-center py-8'>Aucune publication pour le moment</p>
          ) : (
            <div className='space-y-4'>
              {userPosts.map((post) => (
                <div key={post.id} className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition'>
                  <p className='text-gray-800 line-clamp-2 mb-2'>{post.content}</p>
                  <div className='flex justify-between text-xs text-gray-500'>
                    <span>{formatDate(post.createdAt)}</span>
                    <div className='space-x-3'>
                      <span>❤️ {post.likes || 0}</span>
                      <span>💬 {post.comments || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Publications sauvegardées */}
        {isOwnProfile && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>Publications sauvegardées</h2>
            {savedPosts.length === 0 ? (
              <p className='text-gray-500 text-center py-8'>Aucune publication sauvegardée pour le moment</p>
            ) : (
              <div className='space-y-4'>
                {savedPosts.map((post) => (
                  <div key={post.id} className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <p className='text-gray-800 line-clamp-2 mb-2'>{post.content}</p>
                        <div className='flex items-center justify-between text-xs text-gray-500'>
                          <span>Par: <span className='font-medium text-gray-700'>{getPostAuthorName(post)}</span></span>
                          <span>{formatDate(post.createdAt)}</span>
                        </div>
                      </div>
                      <div className='ml-4 text-right text-xs'>
                        <div className='space-x-2'>
                          <span>❤️ {post.likes || 0}</span>
                          <span>💬 {post.comments || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section Déconnexion */}
        <div className='bg-white rounded-xl shadow-sm border border-red-200 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-bold text-gray-900'>Déconnexion</h3>
              <p className='text-sm text-gray-600 mt-1'>Quitter votre compte en sécurité</p>
            </div>
            <button
              onClick={handleLogout}
              className='flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold'
            >
              <LogOut className='w-4 h-4' />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile

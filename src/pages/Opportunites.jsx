import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../services/fiebase'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { 
  Briefcase, MapPin, Calendar, Clock, ExternalLink, Plus, Search, X, Trash2, Bookmark,
  AlertCircle, Heart, MessageCircle, Edit2, Check
} from 'lucide-react'
import { 
  createOpportunity, 
  listenOpportunities, 
  deleteOpportunity, 
  saveOpportunity,
  checkOpportunitySaved,
  updateOpportunity
} from '../services/opportunitiesService'
import {
  toggleOpportunityLike,
  isOpportunityLiked,
  listenOpportunityLikes
} from '../services/opportunitiesLikesService'
import {
  addOpportunityQuestion,
  listenOpportunityQuestions,
  deleteOpportunityQuestion,
  updateOpportunityQuestion,
  toggleQuestionLike
} from '../services/opportunitiesQuestionsService'
import { createOpportunityPublishedNotification } from '../services/notificationsService'

function Opportunites() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [filteredOpportunities, setFilteredOpportunities] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('tous')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [savedOpportunities, setSavedOpportunities] = useState(new Set())
  const [editingOppId, setEditingOppId] = useState(null)
  const [likedOpportunities, setLikedOpportunities] = useState(new Set())
  const [opportunityQuestions, setOpportunityQuestions] = useState({})
  const [opportunityLikes, setOpportunityLikes] = useState({})
  const [questionAnswers, setQuestionAnswers] = useState('')
  const [expandedQuestionsOppId, setExpandedQuestionsOppId] = useState(null)
  const [questionsCount, setQuestionsCount] = useState({})

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'emploi',
    location: '',
    deadline: '',
    link: ''
  })

  // Types d'opportunités
  const types = {
    emploi: { emoji: '💼', label: 'Emploi', color: 'blue' },
    stage: { emoji: '🎓', label: 'Stage', color: 'purple' },
    bourse: { emoji: '🏆', label: 'Bourse', color: 'amber' },
    investissement: { emoji: '📈', label: 'Investissement', color: 'green' },
    formation: { emoji: '📚', label: 'Formation', color: 'indigo' }
  }

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
          console.error('Erreur:', error)
        }
      } else {
        navigate('/login')
      }
    })
    return () => unsub()
  }, [navigate])

  // Écouter les opportunités en temps réel
  useEffect(() => {
    const unsub = listenOpportunities((oppList) => {
      setOpportunities(oppList)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Charger les opportunités sauvegardées
  useEffect(() => {
    if (user) {
      opportunities.forEach(async (opp) => {
        const isSaved = await checkOpportunitySaved(user.uid, opp.id)
        if (isSaved) {
          setSavedOpportunities(prev => new Set([...prev, opp.id]))
        }
      })
    }
  }, [user, opportunities])

  // Écouter les likes pour les opportunités
  useEffect(() => {
    if (!user || opportunities.length === 0) return

    const unsubscribers = []
    opportunities.forEach(opp => {
      const unsub = listenOpportunityLikes(opp.id, (count) => {
        setOpportunityLikes(prev => ({
          ...prev,
          [opp.id]: count
        }))
      })
      unsubscribers.push(unsub)
    })

    return () => unsubscribers.forEach(unsub => unsub())
  }, [opportunities])

  // Écouter les questions pour les opportunités
  useEffect(() => {
    if (expandedQuestionsOppId) {
      const unsub = listenOpportunityQuestions(expandedQuestionsOppId, (questions) => {
        setOpportunityQuestions(prev => ({
          ...prev,
          [expandedQuestionsOppId]: questions
        }))
      })
      return () => unsub()
    }
  }, [expandedQuestionsOppId])

  // Charger le nombre de questions pour toutes les opportunités
  useEffect(() => {
    if (opportunities.length === 0) return

    const unsubscribers = []
    opportunities.forEach(opp => {
      const unsub = listenOpportunityQuestions(opp.id, (questions) => {
        setQuestionsCount(prev => ({
          ...prev,
          [opp.id]: questions.length
        }))
      })
      unsubscribers.push(unsub)
    })

    return () => unsubscribers.forEach(unsub => unsub())
  }, [opportunities])

  // Filtrer les opportunités
  useEffect(() => {
    let filtered = opportunities

    if (searchQuery) {
      filtered = filtered.filter(opp =>
        opp.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.location?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedType !== 'tous') {
      filtered = filtered.filter(opp => opp.type === selectedType)
    }

    setFilteredOpportunities(filtered)
  }, [opportunities, searchQuery, selectedType])

  // Créer ou mettre à jour une opportunité
  const handleSaveOpportunity = async (e) => {
    e.preventDefault()
    if (!user || !userData) return

    if (!formData.title.trim() || !formData.description.trim()) {
      alert('⚠️ Veuillez remplir tous les champs requis')
      return
    }

    setSubmitting(true)
    try {
      if (editingOppId) {
        // Mettre à jour
        await updateOpportunity(editingOppId, formData)
        alert('✅ Opportunité mise à jour!')
        setEditingOppId(null)
      } else {
        // Créer et notifier
        const newOpp = await createOpportunity(formData, user, userData)
        
        // Notifier les compagnons du créateur
        try {
          const companionsRef = collection(db, 'users', user.uid, 'faithCompanions')
          const companionsDocs = await getDocs(companionsRef)
          
          for (const companionDoc of companionsDocs.docs) {
            const companionId = companionDoc.id
            await createOpportunityPublishedNotification(
              companionId,
              newOpp.id,
              userData?.accountType === 'Église' ? userData.egliseName : `${userData?.prenom} ${userData?.nom}`,
              formData.title,
              formData.type
            )
          }
        } catch (notificationError) {
          console.error('Erreur lors de l\'envoi des notifications:', notificationError)
        }
        
        alert('✅ Opportunité créée!')
      }
      setFormData({
        title: '',
        description: '',
        type: 'emploi',
        location: '',
        deadline: '',
        link: ''
      })
      setShowForm(false)
    } catch (error) {
      console.error('Erreur:', error)
      alert('⛔ Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  // Charger une opportunité pour l'édition
  const handleEditOpportunity = (opp) => {
    setFormData({
      title: opp.title,
      description: opp.description,
      type: opp.type,
      location: opp.location || '',
      deadline: opp.deadline || '',
      link: opp.link || ''
    })
    setEditingOppId(opp.id)
    setShowForm(true)
  }

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditingOppId(null)
    setFormData({
      title: '',
      description: '',
      type: 'emploi',
      location: '',
      deadline: '',
      link: ''
    })
    setShowForm(false)
  }

  // Supprimer une opportunité
  const handleDelete = async (oppId, authorId) => {
    if (user?.uid !== authorId) {
      alert('❌ Vous ne pouvez supprimer que vos propres opportunités')
      return
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette opportunité?')) {
      try {
        await deleteOpportunity(oppId)
        alert('✅ Opportunité supprimée')
      } catch (error) {
        alert('⛔ Erreur lors de la suppression')
      }
    }
  }

  // Toggler la sauvegarde
  const handleSaveToggle = async (oppId) => {
    if (!user) return
    try {
      const newSavedState = await saveOpportunity(user.uid, oppId)
      if (newSavedState) {
        setSavedOpportunities(prev => new Set([...prev, oppId]))
      } else {
        setSavedOpportunities(prev => {
          const newSet = new Set(prev)
          newSet.delete(oppId)
          return newSet
        })
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Toggler le like
  const handleLikeToggle = async (oppId) => {
    if (!user) return
    try {
      const newLikedState = await toggleOpportunityLike(oppId, user.uid)
      if (newLikedState) {
        setLikedOpportunities(prev => new Set([...prev, oppId]))
      } else {
        setLikedOpportunities(prev => {
          const newSet = new Set(prev)
          newSet.delete(oppId)
          return newSet
        })
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Ajouter une question
  const handleAddQuestion = async (oppId) => {
    if (!user || !userData || !questionAnswers.trim()) return

    try {
      await addOpportunityQuestion(oppId, questionAnswers, user, userData)
      setQuestionAnswers('')
    } catch (error) {
      console.error('Erreur:', error)
      alert('⛔ Erreur lors de l\'ajout de la question')
    }
  }

  // Supprimer une question
  const handleDeleteQuestion = async (oppId, questionId) => {
    try {
      await deleteOpportunityQuestion(oppId, questionId)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Aimer une question
  const handleLikeQuestion = async (oppId, questionId) => {
    if (!user) return
    try {
      await toggleQuestionLike(oppId, questionId, user.uid)
      // Rafraichir les questions
      const unsub = listenOpportunityQuestions(oppId, (questions) => {
        setOpportunityQuestions(prev => ({
          ...prev,
          [oppId]: questions
        }))
      })
      return unsub
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Démarrer une conversation avec l'auteur
  const handleStartChat = (authorId) => {
    navigate(`/dashboardLayout/chat?with=${authorId}`)
  }

  return (
    <div className='bg-gray-50 min-h-screen pb-24'>
      <div className='max-w-6xl mx-auto p-4 space-y-6'>
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='bg-gradient-to-r from-[#F97316] via-orange-500 to-orange-400 rounded-xl shadow-lg p-6 text-white'
        >
          <div className='flex items-center space-x-3 mb-2'>
            <Briefcase className='w-8 h-8' />
            <h1 className='text-3xl font-bold'>
              {editingOppId ? 'Modifier l\'opportunité' : 'Opportunités'}
            </h1>
          </div>
          <p className='text-orange-100'>
            {editingOppId ? 'Mettez à jour les détails' : 'Découvrez des emplois, stages, bourses, investissements et formations'}
          </p>
        </motion.div>

        {/* Bouton créer + Recherche + Filtres */}
        <div className='space-y-4'>
          {!editingOppId && (
            <div className='flex gap-3 flex-wrap'>
              <motion.button
                onClick={() => setShowForm(!showForm)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className='flex items-center space-x-2 bg-[#F97316] hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg'
              >
                <Plus className='w-5 h-5' />
                <span>Créer une opportunité</span>
              </motion.button>
            </div>
          )}

          {/* Formulaire */}
          <motion.div
            initial={false}
            animate={{ height: showForm ? 'auto' : 0, opacity: showForm ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className='overflow-hidden'
          >
            <form onSubmit={handleSaveOpportunity} className='bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-4'>
              <h3 className='text-xl font-bold text-gray-900 mb-4'>
                {editingOppId ? 'Modifier l\'opportunité' : 'Créer une opportunité'}
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <input
                  type='text'
                  placeholder='Titre*'
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
                  required
                />

                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
                >
                  {Object.entries(types).map(([key, { emoji, label }]) => (
                    <option key={key} value={key}>{emoji} {label}</option>
                  ))}
                </select>

                <input
                  type='text'
                  placeholder='Lieu'
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
                />

                <input
                  type='date'
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
                />

                <input
                  type='url'
                  placeholder='Lien de candidature'
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
                />
              </div>

              <textarea
                placeholder='Description*'
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows='4'
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
                required
              ></textarea>

              <div className='flex gap-3 justify-end'>
                <button
                  type='button'
                  onClick={handleCancelEdit}
                  className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold'
                >
                  Annuler
                </button>
                <button
                  type='submit'
                  disabled={submitting}
                  className='px-6 py-2 bg-[#F97316] hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50'
                >
                  {submitting ? 'Traitement...' : (editingOppId ? 'Mettre à jour' : 'Créer')}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Recherche et filtres */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-3 w-5 h-5 text-gray-400' />
              <input
                type='text'
                placeholder='Rechercher...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]'
              />
            </div>

            <div className='flex flex-wrap gap-2'>
              <motion.button
                onClick={() => setSelectedType('tous')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedType === 'tous'
                    ? 'bg-[#F97316] text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tous
              </motion.button>
              {Object.entries(types).map(([key, { emoji, label }]) => (
                <motion.button
                  key={key}
                  onClick={() => setSelectedType(key)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedType === key
                      ? 'bg-[#F97316] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {emoji} {label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Statistiques */}
        {!loading && opportunities.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className='grid grid-cols-2 md:grid-cols-5 gap-3'
          >
            {Object.entries(types).map(([key, { emoji, label }]) => {
              const count = opportunities.filter(opp => opp.type === key).length
              return (
                <div key={key} className='bg-white rounded-lg shadow-sm border border-gray-200 p-3 text-center hover:shadow-md transition'>
                  <p className='text-2xl'>{emoji}</p>
                  <p className='text-lg font-bold text-gray-900'>{count}</p>
                  <p className='text-xs text-gray-600'>{label}</p>
                </div>
              )
            })}
          </motion.div>
        )}

        {/* Liste des opportunités */}
        {loading ? (
          <div className='text-center py-12'>
            <div className='w-8 h-8 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
            <p className='text-gray-600'>Chargement des opportunités...</p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center'>
            <AlertCircle className='w-12 h-12 text-gray-300 mx-auto mb-4' />
            <p className='text-gray-600 font-medium'>Aucune opportunité trouvée</p>
            <p className='text-sm text-gray-500 mt-1'>Essayez de modifier vos filtres ou créez une nouvelle opportunité</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className='grid grid-cols-1 gap-4'
          >
            {filteredOpportunities.map((opp, idx) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow'
              >
                <div className='p-6 space-y-4'>
                  {/* En-tête */}
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center space-x-3 mb-2'>
                        <span className='text-3xl'>{types[opp.type]?.emoji}</span>
                        <div>
                          <h3 className='text-xl font-bold text-gray-900'>{opp.title}</h3>
                          <p className='text-sm text-gray-600'>{opp.authorName}</p>
                        </div>
                      </div>
                      <span className='inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full'>
                        {types[opp.type]?.label}
                      </span>
                    </div>

                    {/* Badges */}
                    <div className='flex flex-col gap-2 items-end'>
                      {savedOpportunities.has(opp.id) && (
                        <span className='px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full'>
                          ✓ Sauvegardé
                        </span>
                      )}
                      {user?.uid === opp.authorId && (
                        <span className='px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full'>
                          Votre publication
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className='text-gray-700 text-sm'>{opp.description}</p>

                  {/* Métadonnées */}
                  <div className='flex flex-wrap gap-4 text-sm text-gray-600 py-2 border-y border-gray-200'>
                    {opp.location && (
                      <div className='flex items-center space-x-1'>
                        <MapPin className='w-4 h-4 text-[#F97316]' />
                        <span>{opp.location}</span>
                      </div>
                    )}
                    {opp.deadline && (
                      <div className='flex items-center space-x-1'>
                        <Calendar className='w-4 h-4 text-[#F97316]' />
                        <span>{new Date(opp.deadline).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    {opp.createdAt && (
                      <div className='flex items-center space-x-1'>
                        <Clock className='w-4 h-4 text-gray-400' />
                        <span className='text-gray-500 text-xs'>
                          {new Date(opp.createdAt.toDate?.() || opp.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions principales */}
                  <div className='flex gap-3 flex-wrap pt-2'>
                    {opp.link && (
                      <a
                        href={opp.link}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center justify-center space-x-2 bg-[#F97316] hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors'
                      >
                        <ExternalLink className='w-4 h-4' />
                        <span>Postuler</span>
                      </a>
                    )}

                    {user && user.uid !== opp.authorId && (
                      <motion.button
                        onClick={() => handleStartChat(opp.authorId)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className='flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors'
                      >
                        <MessageCircle className='w-4 h-4' />
                        <span>Envoyer un message</span>
                      </motion.button>
                    )}

                    <motion.button
                      onClick={() => handleLikeToggle(opp.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center space-x-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                        likedOpportunities.has(opp.id)
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${likedOpportunities.has(opp.id) ? 'fill-current' : ''}`} />
                      <span>{opportunityLikes[opp.id] || 0}</span>
                    </motion.button>

                    <motion.button
                      onClick={() => setExpandedQuestionsOppId(
                        expandedQuestionsOppId === opp.id ? null : opp.id
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className='flex items-center space-x-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold transition-colors'
                    >
                      <MessageCircle className='w-4 h-4' />
                      <span>{questionsCount[opp.id] || 0}</span>
                    </motion.button>

                    <motion.button
                      onClick={() => handleSaveToggle(opp.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        savedOpportunities.has(opp.id)
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${savedOpportunities.has(opp.id) ? 'fill-current' : ''}`} />
                    </motion.button>

                    {user?.uid === opp.authorId && (
                      <>
                        <motion.button
                          onClick={() => handleEditOpportunity(opp)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors'
                        >
                          <Edit2 className='w-4 h-4' />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(opp.id, opp.authorId)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className='px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-semibold transition-colors'
                        >
                          <Trash2 className='w-4 h-4' />
                        </motion.button>
                      </>
                    )}
                  </div>

                  {/* Section Questions */}
                  {expandedQuestionsOppId === opp.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className='border-t pt-4 space-y-4'
                    >
                      {/* Formulaire pour poser une question */}
                      {user && (
                        <div className='space-y-2 bg-gray-50 p-3 rounded-lg'>
                          <textarea
                            placeholder='Posez votre question...'
                            value={questionAnswers}
                            onChange={(e) => setQuestionAnswers(e.target.value)}
                            rows='2'
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm'
                          ></textarea>
                          <button
                            onClick={() => handleAddQuestion(opp.id)}
                            disabled={!questionAnswers.trim()}
                            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm disabled:opacity-50'
                          >
                            Envoyer
                          </button>
                        </div>
                      )}

                      {/* Liste des questions */}
                      <div className='space-y-3'>
                        {(opportunityQuestions[opp.id] || []).length === 0 ? (
                          <p className='text-sm text-gray-500 text-center py-4'>Aucune question pour l\'instant</p>
                        ) : (
                          (opportunityQuestions[opp.id] || []).map(q => (
                            <div key={q.id} className='bg-gray-50 p-3 rounded-lg space-y-2'>
                              <div className='flex items-start justify-between gap-2'>
                                <div className='flex-1'>
                                  <p className='font-semibold text-sm text-gray-900'>{q.userName}</p>
                                  <p className='text-sm text-gray-700 mt-1'>{q.text}</p>
                                </div>
                              </div>

                              {/* Actions sur la question */}
                              <div className='flex gap-2 items-center pt-2'>
                                <motion.button
                                  onClick={() => handleLikeQuestion(opp.id, q.id)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className='flex items-center space-x-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100'
                                >
                                  <Heart className='w-3 h-3' />
                                  <span>{q.likes || 0}</span>
                                </motion.button>

                                {(user?.uid === q.userId || user?.uid === opp.authorId) && (
                                  <motion.button
                                    onClick={() => handleDeleteQuestion(opp.id, q.id)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className='px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200'
                                  >
                                    <X className='w-3 h-3' />
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Opportunites

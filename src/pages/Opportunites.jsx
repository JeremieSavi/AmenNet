import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../services/fiebase'
import { doc, getDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { 
  Briefcase, MapPin, Calendar, Clock, ExternalLink, Plus, Search, X, Trash2, Bookmark,
  ChevronDown, AlertCircle
} from 'lucide-react'
import { 
  createOpportunity, 
  listenOpportunities, 
  deleteOpportunity, 
  saveOpportunity,
  checkOpportunitySaved 
} from '../services/opportunitiesService'

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

  // Créer une opportunité
  const handleCreateOpportunity = async (e) => {
    e.preventDefault()
    if (!user || !userData) return

    if (!formData.title.trim() || !formData.description.trim()) {
      alert('⚠️ Veuillez remplir tous les champs requis')
      return
    }

    setSubmitting(true)
    try {
      await createOpportunity(formData, user, userData)
      setFormData({
        title: '',
        description: '',
        type: 'emploi',
        location: '',
        deadline: '',
        link: ''
      })
      setShowForm(false)
      alert('✅ Opportunité créée avec succès!')
    } catch (error) {
      console.error('Erreur:', error)
      alert('⛔ Erreur lors de la création')
    } finally {
      setSubmitting(false)
    }
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
            <h1 className='text-3xl font-bold'>Opportunités</h1>
          </div>
          <p className='text-orange-100'>Découvrez des emplois, stages, bourses, investissements et formations</p>
        </motion.div>

        {/* Bouton créer + Recherche + Filtres */}
        <div className='space-y-4'>
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

          {/* Formulaire */}
          <motion.div
            initial={false}
            animate={{ height: showForm ? 'auto' : 0, opacity: showForm ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className='overflow-hidden'
          >
            <form onSubmit={handleCreateOpportunity} className='bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-4'>
              <h3 className='text-xl font-bold text-gray-900 mb-4'>Créer une opportunité</h3>

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
                  onClick={() => setShowForm(false)}
                  className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold'
                >
                  Annuler
                </button>
                <button
                  type='submit'
                  disabled={submitting}
                  className='px-6 py-2 bg-[#F97316] hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50'
                >
                  {submitting ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Recherche et filtres */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4'>
            {/* Recherche */}
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

            {/* Filtres par type */}
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
                className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group'
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

                    {/* Badge sauvegardé */}
                    {savedOpportunities.has(opp.id) && (
                      <span className='px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full'>
                        ✓ Sauvegardé
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className='text-gray-700 text-sm line-clamp-2'>{opp.description}</p>

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

                  {/* Actions */}
                  <div className='flex gap-3 pt-2'>
                    {opp.link && (
                      <a
                        href={opp.link}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex-1 flex items-center justify-center space-x-2 bg-[#F97316] hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors'
                      >
                        <ExternalLink className='w-4 h-4' />
                        <span>Postuler</span>
                      </a>
                    )}

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
                      <Bookmark className='w-5 h-5' />
                    </motion.button>

                    {user?.uid === opp.authorId && (
                      <motion.button
                        onClick={() => handleDelete(opp.id, opp.authorId)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className='px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-semibold transition-colors'
                      >
                        <Trash2 className='w-5 h-5' />
                      </motion.button>
                    )}
                  </div>
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
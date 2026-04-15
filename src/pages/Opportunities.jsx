import React, { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../services/fiebase'
import { doc, getDoc } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { Plus, X, MapPin, Calendar, ExternalLink, Bookmark, Search, Filter, Briefcase, GraduationCap, Award, TrendingUp, Trash2, Clock } from 'lucide-react'
import { createOpportunity, listenOpportunities, deleteOpportunity, checkOpportunitySaved, saveOpportunity } from '../services/opportunitiesService'

function Opportunities() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [filteredOpportunities, setFilteredOpportunities] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('tous')
  const [searchTerm, setSearchTerm] = useState('')
  const [savedOpps, setSavedOpps] = useState({})
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'emploi',
    location: '',
    link: '',
    deadline: ''
  })

  const opportunityTypes = [
    { id: 'tous', label: 'Tous', icon: Briefcase, color: 'gray' },
    { id: 'emploi', label: 'Emploi', icon: Briefcase, color: 'blue' },
    { id: 'stage', label: 'Stage', icon: GraduationCap, color: 'purple' },
    { id: 'bourse', label: 'Bourse', icon: Award, color: 'emerald' },
    { id: 'investissement', label: 'Investissement', icon: TrendingUp, color: 'amber' },
    { id: 'formation', label: 'Formation', icon: GraduationCap, color: 'indigo' }
  ]

  // Récupérer l'utilisateur
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
      }
    })
    return () => unsub()
  }, [])

  // Écouter les opportunités
  useEffect(() => {
    const unsub = listenOpportunities((ops) => {
      setOpportunities(ops)
      applyFilters(ops, selectedType, searchTerm)
    })
    return () => unsub()
  }, [])

  // Vérifier les opportunités sauvegardées
  useEffect(() => {
    if (user) {
      const checkSavedStatus = async () => {
        const saved = {}
        for (const opp of opportunities) {
          const isSaved = await checkOpportunitySaved(user.uid, opp.id)
          saved[opp.id] = isSaved
        }
        setSavedOpps(saved)
      }
      checkSavedStatus()
    }
  }, [opportunities, user])

  const applyFilters = (opps, type, search) => {
    let filtered = opps

    if (type !== 'tous') {
      filtered = filtered.filter(opp => opp.type === type)
    }

    if (search.trim()) {
      filtered = filtered.filter(opp =>
        opp.title.toLowerCase().includes(search.toLowerCase()) ||
        opp.description.toLowerCase().includes(search.toLowerCase()) ||
        opp.location.toLowerCase().includes(search.toLowerCase())
      )
    }

    setFilteredOpportunities(filtered)
  }

  const handleFilterChange = (type) => {
    setSelectedType(type)
    applyFilters(opportunities, type, searchTerm)
  }

  const handleSearchChange = (e) => {
    const search = e.target.value
    setSearchTerm(search)
    applyFilters(opportunities, selectedType, search)
  }

  const handleCreateOpportunity = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Veuillez remplir les champs obligatoires')
      return
    }

    setLoading(true)
    try {
      await createOpportunity(formData, user, userData)
      alert('✅ Opportunité publiée avec succès!')
      setFormData({
        title: '',
        description: '',
        type: 'emploi',
        location: '',
        link: '',
        deadline: ''
      })
      setShowCreateForm(false)
    } catch (error) {
      console.error('Erreur:', error)
      alert('❌ Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOpportunity = async (oppId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette opportunité ?')) return

    try {
      await deleteOpportunity(oppId)
      alert('✅ Opportunité supprimée')
    } catch (error) {
      alert('❌ Erreur lors de la suppression')
    }
  }

  const handleToggleSave = async (oppId) => {
    try {
      await saveOpportunity(user.uid, oppId)
      setSavedOpps(prev => ({
        ...prev,
        [oppId]: !prev[oppId]
      }))
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    const d = date instanceof Date ? date : date.toDate()
    return d.toLocaleDateString('fr-FR')
  }

  const getTypeIcon = (type) => {
    const typeObj = opportunityTypes.find(t => t.id === type)
    const Icon = typeObj?.icon || Briefcase
    return Icon
  }

  const getTypeColor = (type) => {
    const colors = {
      emploi: 'bg-blue-50 text-blue-700 border-blue-200',
      stage: 'bg-purple-50 text-purple-700 border-purple-200',
      bourse: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      investissement: 'bg-amber-50 text-amber-700 border-amber-200',
      formation: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    }
    return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  return (
    <div className='bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen pb-24'>
      {/* Header avec animation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='bg-gradient-to-r from-[#F97316] to-orange-500 text-white p-6 shadow-lg'
      >
        <div className='max-w-4xl mx-auto'>
          <h1 className='text-4xl font-bold mb-2'>Opportunités</h1>
          <p className='text-orange-100'>Emplois, stages, bourses et investissements</p>
        </div>
      </motion.div>

      <div className='max-w-4xl mx-auto p-4 space-y-6'>
        {/* Bouton créer */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateForm(!showCreateForm)}
          className='w-full bg-gradient-to-r from-[#F97316] to-orange-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-shadow'
        >
          <Plus className='w-5 h-5' />
          <span>Publier une opportunité</span>
        </motion.button>

        {/* Formulaire création */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className='bg-white rounded-xl shadow-lg p-6 border border-gray-200'
          >
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-2xl font-bold text-gray-900'>Nouvelle opportunité</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              >
                <X className='w-5 h-5 text-gray-600' />
              </button>
            </div>

            <form onSubmit={handleCreateOpportunity} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Titre *</label>
                <input
                  type='text'
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder='Ex: Développeur React Senior'
                  className='w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder='Décrivez l\'opportunité en détail...'
                  rows={4}
                  className='w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 resize-none'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className='w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20'
                  >
                    <option value='emploi'>Emploi</option>
                    <option value='stage'>Stage</option>
                    <option value='bourse'>Bourse</option>
                    <option value='investissement'>Investissement</option>
                    <option value='formation'>Formation</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Localisation</label>
                  <input
                    type='text'
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder='Ex: Paris, France'
                    className='w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F97316]'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Date limite</label>
                  <input
                    type='date'
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className='w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F97316]'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Lien (candidature)</label>
                  <input
                    type='url'
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder='https://...'
                    className='w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F97316]'
                  />
                </div>
              </div>

              <div className='flex gap-2 justify-end pt-4 border-t border-gray-200'>
                <button
                  type='button'
                  onClick={() => setShowCreateForm(false)}
                  className='px-6 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors'
                >
                  Annuler
                </button>
                <button
                  type='submit'
                  disabled={loading}
                  className='px-6 py-2 bg-[#F97316] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors'
                >
                  {loading ? 'Publication...' : 'Publier'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Recherche et filtres */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className='space-y-4'
        >
          {/* Barre de recherche */}
          <div className='relative'>
            <Search className='absolute left-4 top-3 w-5 h-5 text-gray-400' />
            <input
              type='text'
              placeholder='Rechercher une opportunité...'
              value={searchTerm}
              onChange={handleSearchChange}
              className='w-full pl-12 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20'
            />
          </div>

          {/* Filtres par type */}
          <div className='flex flex-wrap gap-2'>
            {opportunityTypes.map((type) => (
              <motion.button
                key={type.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleFilterChange(type.id)}
                className={`flex items-center space-x-1 px-4 py-2 rounded-full font-semibold transition-all ${
                  selectedType === type.id
                    ? 'bg-[#F97316] text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-[#F97316]'
                }`}
              >
                <type.icon className='w-4 h-4' />
                <span>{type.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Affichage opportunités */}
        {filteredOpportunities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className='bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200'
          >
            <Briefcase className='w-16 h-16 text-gray-300 mx-auto mb-4' />
            <p className='text-gray-500 text-lg'>Aucune opportunité trouvée</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            className='space-y-4'
          >
            {filteredOpportunities.map((opp) => (
              <motion.div
                key={opp.id}
                variants={itemVariants}
                className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-3 mb-2'>
                      <div className={`p-2 rounded-lg ${getTypeColor(opp.type)}`}>
                        {React.createElement(getTypeIcon(opp.type), { className: 'w-5 h-5' })}
                      </div>
                      <h3 className='text-2xl font-bold text-gray-900'>{opp.title}</h3>
                    </div>
                    <p className='text-sm text-gray-600'>
                      Par <span className='font-semibold'>{opp.authorName}</span>
                    </p>
                  </div>

                  <div className='flex space-x-2'>
                    {user?.uid === opp.authorId && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteOpportunity(opp.id)}
                        className='p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors'
                        title='Supprimer'
                      >
                        <Trash2 className='w-5 h-5' />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleToggleSave(opp.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        savedOpps[opp.id]
                          ? 'bg-yellow-50 text-yellow-600'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                      title='Sauvegarder'
                    >
                      <Bookmark className='w-5 h-5' fill={savedOpps[opp.id] ? 'currentColor' : 'none'} />
                    </motion.button>
                  </div>
                </div>

                <p className='text-gray-700 mb-4'>{opp.description}</p>

                {/* Métadonnées */}
                <div className='flex flex-wrap gap-4 mb-4 text-sm text-gray-600'>
                  {opp.location && (
                    <div className='flex items-center space-x-1'>
                      <MapPin className='w-4 h-4 text-[#F97316]' />
                      <span>{opp.location}</span>
                    </div>
                  )}
                  {opp.deadline && (
                    <div className='flex items-center space-x-1'>
                      <Calendar className='w-4 h-4 text-[#F97316]' />
                      <span>Avant le {formatDate(opp.deadline)}</span>
                    </div>
                  )}
                  <div className='flex items-center space-x-1'>
                    <Clock className='w-4 h-4 text-gray-500' />
                    <span>{formatDate(opp.createdAt)}</span>
                  </div>
                </div>

                {/* Badge type */}
                <div className='mb-4'>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(opp.type)}`}>
                    {opportunityTypes.find(t => t.id === opp.type)?.label}
                  </span>
                </div>

                {/* Lien candidature */}
                {opp.link && (
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={opp.link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center space-x-2 text-[#F97316] hover:text-orange-600 font-semibold transition-colors'
                  >
                    <span>Candidater</span>
                    <ExternalLink className='w-4 h-4' />
                  </motion.a>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Statistiques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className='grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8'
        >
          {opportunityTypes.filter(t => t.id !== 'tous').map((type) => (
            <div
              key={type.id}
              className={`bg-white rounded-lg shadow-sm p-4 border-l-4 border-${type.color}-400 text-center`}
            >
              <p className='text-2xl font-bold text-gray-900'>
                {opportunities.filter(o => o.type === type.id).length}
              </p>
              <p className='text-sm text-gray-600'>{type.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default Opportunities
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

export default Opportunities

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, MessageCircle, Briefcase, Heart, Zap, Globe, ArrowRight,
  CheckCircle, Star, Sparkles, Shield, Flame, Share2, TrendingUp, Moon, Sun
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

function Landing() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()

  const features = [
    {
      icon: Users,
      title: 'Compagnons de Foi',
      description: 'Connectez-vous avec d\'autres croyants et construisez une communauté spirituelle forte.',
      color: 'from-blue-400 to-blue-600'
    },
    {
      icon: MessageCircle,
      title: 'Partage & Discussion',
      description: 'Participez à des conversations significatives et partagez vos témoignages inspirants.',
      color: 'from-purple-400 to-purple-600'
    },
    {
      icon: Briefcase,
      title: 'Opportunités',
      description: 'Découvrez des emplois, stages, formations et investissements spirituellement alignés.',
      color: 'from-green-400 to-green-600'
    },
    {
      icon: Heart,
      title: 'Église & Événements',
      description: 'Suivez les églises, participez à des événements et restez connecté avec votre communauté.',
      color: 'from-red-400 to-red-600'
    },
    {
      icon: MessageCircle,
      title: 'Messages Privés',
      description: 'Communiquez discrètement avec vos compagnons de foi via une messagerie sécurisée.',
      color: 'from-pink-400 to-pink-600'
    },
    {
      icon: Zap,
      title: 'Notifications Temps Réel',
      description: 'Restez à jour avec les notifications instantanées de toute l\'activité importante.',
      color: 'from-yellow-400 to-yellow-600'
    }
  ]

  const stats = [
    { number: '10K+', label: 'Utilisateurs Actifs' },
    { number: '500+', label: 'Églises' },
    { number: '1M+', label: 'Interactions' },
    { number: '24/7', label: 'Support' }
  ]

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
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  return (
    <div className={isDark ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen overflow-x-hidden' : 'bg-gradient-to-b from-white via-gray-50 to-gray-100 min-h-screen overflow-x-hidden'}>
      {/* Navigation */}
      <nav className={isDark ? 'fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 shadow-sm' : 'fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm'}>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between'>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className='flex items-center space-x-2'
          >
            <div className='w-10 h-10 rounded-full bg-gradient-to-br from-[#F97316] to-orange-600 flex items-center justify-center text-white font-bold text-xl'>
              A
            </div>
            <span className={isDark ? 'text-white font-bold text-xl hidden sm:inline' : 'text-gray-900 font-bold text-xl hidden sm:inline'}>AmenNet</span>
          </motion.div>

          <div className='flex gap-3 items-center'>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={isDark ? 'p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors' : 'p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors'}
            >
              {isDark ? (
                <Sun className='w-5 h-5 text-yellow-400' />
              ) : (
                <Moon className='w-5 h-5 text-slate-700' />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className={isDark ? 'px-6 py-2 text-gray-300 border border-[#F97316] rounded-lg hover:bg-[#F97316]/10 transition-colors font-semibold' : 'px-6 py-2 text-gray-700 border border-[#F97316] rounded-lg hover:bg-[#F97316]/10 transition-colors font-semibold'}
            >
              Se connecter
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/signin')}
              className='px-6 py-2 bg-gradient-to-r from-[#F97316] to-orange-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all font-semibold'
            >
              S'inscrire
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className='pt-32 pb-20 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            className='grid md:grid-cols-2 gap-12 items-center'
          >
            {/* Texte Hero */}
            <motion.div variants={itemVariants} className='space-y-6'>
              <div className='space-y-3'>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className='inline-flex items-center space-x-2 bg-[#F97316]/10 border border-[#F97316]/20 rounded-full px-4 py-2'
                >
                  <Sparkles className='w-4 h-4 text-[#F97316]' />
                  <span className='text-[#F97316] font-semibold text-sm'>Bienvenue sur AmenNet</span>
                </motion.div>

                <h1 className={isDark ? 'text-5xl md:text-6xl font-bold text-white leading-tight' : 'text-5xl md:text-6xl font-bold text-gray-900 leading-tight'}>
                  Connectez-vous avec votre{' '}
                  <span className='bg-gradient-to-r from-[#F97316] to-orange-400 bg-clip-text text-transparent'>
                    Communauté de Foi
                  </span>
                </h1>
              </div>

              <p className={isDark ? 'text-xl text-slate-300 leading-relaxed' : 'text-xl text-gray-700 leading-relaxed'}>
                Découvrez une plateforme révolutionnaire où la spiritualité, la communauté et l'opportunité se rencontrent. Rejoignez des milliers de fidèles et d'églises dans un espace de confiance et d'inspiration.
              </p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className='flex gap-4 pt-4 flex-wrap'
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 25px -5px rgba(249, 115, 22, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/signin')}
                  className='px-8 py-4 bg-gradient-to-r from-[#F97316] to-orange-600 text-white rounded-lg font-bold text-lg flex items-center space-x-2 hover:shadow-xl transition-all'
                >
                  <span>Commencer Maintenant</span>
                  <ArrowRight className='w-5 h-5' />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='px-8 py-4 border-2 border-[#F97316] text-[#F97316] rounded-lg font-bold text-lg hover:bg-[#F97316]/10 transition-colors'
                >
                  En Savoir Plus
                </motion.button>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                variants={itemVariants}
                className={isDark ? 'flex gap-6 pt-4 text-sm text-slate-300 flex-wrap' : 'flex gap-6 pt-4 text-sm text-gray-700 flex-wrap'}
              >
                <div className='flex items-center space-x-2'>
                  <Shield className='w-5 h-5 text-green-500' />
                  <span>100% Sécurisé</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <CheckCircle className='w-5 h-5 text-green-500' />
                  <span>Gratuit</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <Star className='w-5 h-5 text-green-500' />
                  <span>4.9/5 ⭐</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Illustration Hero */}
            <motion.div
              variants={itemVariants}
              className='relative hidden md:block'
            >
              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className='relative'
              >
                <div className='absolute inset-0 bg-gradient-to-r from-[#F97316]/10 to-blue-400/10 rounded-3xl blur-3xl'></div>
                <div className={isDark ? 'relative bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl p-8 border border-slate-600' : 'relative bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl p-8 border border-gray-300'}>
                  <div className='space-y-4'>
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className={isDark ? 'flex items-center space-x-3 p-3 bg-slate-600/50 rounded-lg' : 'flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200'}
                      >
                        <div className='w-3 h-3 rounded-full bg-[#F97316]'></div>
                        <div className={isDark ? 'h-2 bg-slate-500 rounded flex-1' : 'h-2 bg-gray-300 rounded flex-1'} style={{ width: `${60 + i * 15}px` }}></div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={isDark ? 'py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/50 border-y border-slate-700' : 'py-16 px-4 sm:px-6 lg:px-8 bg-white border-y border-gray-200'}>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            variants={containerVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true }}
            className='grid grid-cols-2 md:grid-cols-4 gap-8'
          >
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className='text-center'
              >
                <p className='text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#F97316] to-orange-400 bg-clip-text text-transparent'>
                  {stat.number}
                </p>
                <p className={isDark ? 'text-slate-300 text-sm md:text-base mt-2' : 'text-gray-600 text-sm md:text-base mt-2'}>{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className={isDark ? 'py-24 px-4 sm:px-6 lg:px-8 bg-slate-800/30' : 'py-24 px-4 sm:px-6 lg:px-8 bg-gray-50'}>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-16'
          >
            <h2 className={isDark ? 'text-4xl md:text-5xl font-bold text-white mb-4' : 'text-4xl md:text-5xl font-bold text-gray-900 mb-4'}>
              Fonctionnalités Extraordinaires
            </h2>
            <p className={isDark ? 'text-xl text-slate-300 max-w-2xl mx-auto' : 'text-xl text-gray-700 max-w-2xl mx-auto'}>
              Découvrez tout ce que AmenNet offre pour votre vie spirituelle et communautaire
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true }}
            className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'
          >
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  className={isDark ? 'bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-8 border border-slate-600 hover:border-[#F97316] transition-all group cursor-pointer hover:shadow-xl hover:shadow-orange-500/10' : 'bg-white rounded-xl p-8 border border-gray-200 hover:border-[#F97316] transition-all group cursor-pointer hover:shadow-xl hover:shadow-orange-500/10'}
                >
                  <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className='w-7 h-7 text-white' />
                  </div>
                  <h3 className={isDark ? 'text-xl font-bold text-white mb-3' : 'text-xl font-bold text-gray-900 mb-3'}>{feature.title}</h3>
                  <p className={isDark ? 'text-slate-300' : 'text-gray-700'}>{feature.description}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={isDark ? 'py-24 px-4 sm:px-6 lg:px-8 bg-slate-900' : 'py-24 px-4 sm:px-6 lg:px-8 bg-white'}>
        <div className='max-w-4xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='relative'
          >
            <div className='absolute inset-0 bg-gradient-to-r from-[#F97316]/20 to-blue-500/20 rounded-3xl blur-3xl'></div>
            <div className='relative bg-gradient-to-r from-[#F97316] to-orange-600 rounded-3xl p-12 md:p-16 text-center'>
              <Flame className='w-12 h-12 text-white mx-auto mb-4' />
              <h2 className='text-4xl md:text-5xl font-bold text-white mb-4'>
                Prêt à Rejoindre AmenNet?
              </h2>
              <p className='text-orange-100 text-lg mb-8 max-w-2xl mx-auto'>
                Rejoignez notre communauté mondiale de fidèles, d'églises et de partenaires spirituels dès aujourd'hui
              </p>
              <motion.div
                className='flex gap-4 justify-center flex-wrap'
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/signin')}
                  className='px-10 py-4 bg-white text-[#F97316] rounded-lg font-bold text-lg hover:shadow-xl transition-all'
                >
                  Créer un Compte
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login')}
                  className='px-10 py-4 border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white/10 transition-all'
                >
                  Se Connecter
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={isDark ? 'border-t border-slate-700 py-12 px-4 sm:px-6 lg:px-8 bg-slate-900' : 'border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8 bg-white'}>
        <div className='max-w-7xl mx-auto'>
          <div className='grid md:grid-cols-4 gap-8 mb-8'>
            <div>
              <div className='w-10 h-10 rounded-full bg-gradient-to-br from-[#F97316] to-orange-600 flex items-center justify-center text-white font-bold text-xl mb-3'>
                A
              </div>
              <p className={isDark ? 'text-slate-400' : 'text-gray-700'}>Connectez votre foi, inspirez votre communauté</p>
            </div>
            <div>
              <h4 className={isDark ? 'font-bold text-white mb-4' : 'font-bold text-gray-900 mb-4'}>Produit</h4>
              <ul className={isDark ? 'space-y-2 text-slate-400 text-sm' : 'space-y-2 text-gray-700 text-sm'}>
                <li><a href='#' className={isDark ? 'hover:text-white transition' : 'hover:text-[#F97316] transition'}>Fonctionnalités</a></li>
                <li><a href='#' className={isDark ? 'hover:text-white transition' : 'hover:text-[#F97316] transition'}>Tarifs</a></li>
                <li><a href='#' className={isDark ? 'hover:text-white transition' : 'hover:text-[#F97316] transition'}>Sécurité</a></li>
              </ul>
            </div>
            <div>
              <h4 className={isDark ? 'font-bold text-white mb-4' : 'font-bold text-gray-900 mb-4'}>Communauté</h4>
              <ul className={isDark ? 'space-y-2 text-slate-400 text-sm' : 'space-y-2 text-gray-700 text-sm'}>
                <li><a href='#' className={isDark ? 'hover:text-white transition' : 'hover:text-[#F97316] transition'}>Blog</a></li>
                <li><a href='#' className={isDark ? 'hover:text-white transition' : 'hover:text-[#F97316] transition'}>Support</a></li>
                <li><a href='#' className={isDark ? 'hover:text-white transition' : 'hover:text-[#F97316] transition'}>Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className={isDark ? 'font-bold text-white mb-4' : 'font-bold text-gray-900 mb-4'}>Légal</h4>
              <ul className={isDark ? 'space-y-2 text-slate-400 text-sm' : 'space-y-2 text-gray-700 text-sm'}>
                <li><a href='#' className={isDark ? 'hover:text-white transition' : 'hover:text-[#F97316] transition'}>Confidentialité</a></li>
                <li><a href='#' className={isDark ? 'hover:text-white transition' : 'hover:text-[#F97316] transition'}>Conditions</a></li>
                <li><a href='#' className={isDark ? 'hover:text-white transition' : 'hover:text-[#F97316] transition'}>Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className={isDark ? 'border-t border-slate-700 pt-8' : 'border-t border-gray-200 pt-8'}>
            <p className={isDark ? 'text-slate-400 text-center text-sm' : 'text-gray-700 text-center text-sm'}>
              © 2026 AmenNet. Tous droits réservés. • Construire une communauté de foi plus forte
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
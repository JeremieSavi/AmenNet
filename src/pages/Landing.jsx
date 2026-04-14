import React from 'react'
import { NavLink } from 'react-router-dom'
import { Heart, Users, MessageSquare, Globe, Zap, Shield } from 'lucide-react'

function Landing() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50'>
      {/* Navbar */}
      <nav className='bg-white shadow-sm sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 py-4 flex justify-between items-center'>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-[#F97316] to-orange-500 bg-clip-text text-transparent'>AmenNet</h1>
          <div className='flex space-x-3'>
            <NavLink to='/login' className='px-6 py-2 text-gray-700 font-semibold hover:text-[#F97316] transition-colors'>Se connecter</NavLink>
            <NavLink to='/signin' className='px-6 py-2 bg-[#F97316] text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-lg'>S'inscrire</NavLink>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className='max-w-7xl mx-auto px-4 py-20 text-center'>
        <div className='mb-8'>
          <h2 className='text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight'>
            Connectez-vous <span className='bg-gradient-to-r from-[#F97316] to-orange-500 bg-clip-text text-transparent'>Spirituellement</span>
          </h2>
          <p className='text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto'>
            Rejoignez une communauté chrétienne vibrante. Partagez votre foi, trouvez du soutien et grandissez ensemble dans votre foi.
          </p>
          <div className='flex flex-col sm:flex-row justify-center gap-4'>
            <NavLink to='/signin' className='px-8 py-4 bg-[#F97316] text-white rounded-xl font-bold text-lg hover:bg-orange-600 transition-all transform hover:scale-105 shadow-xl'>
              Commencer Maintenant
            </NavLink>
            <NavLink to='/login' className='px-8 py-4 border-2 border-[#F97316] text-[#F97316] rounded-xl font-bold text-lg hover:bg-orange-50 transition-all'>
              Déjà membre ?
            </NavLink>
          </div>
        </div>

        {/* Illustration avec emojis */}
        <div className='mt-16 grid grid-cols-3 md:grid-cols-6 gap-4 opacity-80'>
          <div className='text-6xl'>🙏</div>
          <div className='text-6xl'>💬</div>
          <div className='text-6xl'>❤️</div>
          <div className='text-6xl'>🤝</div>
          <div className='text-6xl'>📖</div>
          <div className='text-6xl'>✨</div>
        </div>
      </section>

      {/* Features Section */}
      <section className='bg-white py-20'>
        <div className='max-w-7xl mx-auto px-4'>
          <h3 className='text-4xl font-bold text-center text-gray-900 mb-16'>Pourquoi Rejoindre AmenNet ?</h3>
          
          <div className='grid md:grid-cols-3 gap-8'>
            {/* Feature 1 */}
            <div className='p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 hover:shadow-xl transition-shadow'>
              <div className='w-16 h-16 bg-[#F97316] rounded-xl flex items-center justify-center mb-4'>
                <Heart className='w-8 h-8 text-white' />
              </div>
              <h4 className='text-2xl font-bold text-gray-900 mb-3'>Partage Authentique</h4>
              <p className='text-gray-700'>Partage tes témoignages, tes prières et tes victoires spirituelles avec une communauté bienveillante.</p>
            </div>

            {/* Feature 2 */}
            <div className='p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-xl transition-shadow'>
              <div className='w-16 h-16 bg-[#F97316] rounded-xl flex items-center justify-center mb-4'>
                <Users className='w-8 h-8 text-white' />
              </div>
              <h4 className='text-2xl font-bold text-gray-900 mb-3'>Communauté Forte</h4>
              <p className='text-gray-700'>Connecte-toi avec d'autres fidèles, trouve un soutien mutuel et construis des amitiés durables.</p>
            </div>

            {/* Feature 3 */}
            <div className='p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-xl transition-shadow'>
              <div className='w-16 h-16 bg-[#F97316] rounded-xl flex items-center justify-center mb-4'>
                <Globe className='w-8 h-8 text-white' />
              </div>
              <h4 className='text-2xl font-bold text-gray-900 mb-3'>Événements Locaux</h4>
              <p className='text-gray-700'>Découvre les églises près de toi, les événements spirituels et les opportunités de service.</p>
            </div>

            {/* Feature 4 */}
            <div className='p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-xl transition-shadow'>
              <div className='w-16 h-16 bg-[#F97316] rounded-xl flex items-center justify-center mb-4'>
                <MessageSquare className='w-8 h-8 text-white' />
              </div>
              <h4 className='text-2xl font-bold text-gray-900 mb-3'>Discussions Vivantes</h4>
              <p className='text-gray-700'>Engage-toi dans des conversations significatives autour de versets, de questionnements spirituels.</p>
            </div>

            {/* Feature 5 */}
            <div className='p-8 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 hover:shadow-xl transition-shadow'>
              <div className='w-16 h-16 bg-[#F97316] rounded-xl flex items-center justify-center mb-4'>
                <Zap className='w-8 h-8 text-white' />
              </div>
              <h4 className='text-2xl font-bold text-gray-900 mb-3'>Inspiration Quotidienne</h4>
              <p className='text-gray-700'>Reçois des versets inspirants, des témoignages et du contenu spirituel édifiant chaque jour.</p>
            </div>

            {/* Feature 6 */}
            <div className='p-8 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:shadow-xl transition-shadow'>
              <div className='w-16 h-16 bg-[#F97316] rounded-xl flex items-center justify-center mb-4'>
                <Shield className='w-8 h-8 text-white' />
              </div>
              <h4 className='text-2xl font-bold text-gray-900 mb-3'>Espace Sûr</h4>
              <p className='text-gray-700'>Un environnement modéré et sécurisé où ta foi et tes valeurs sont respectées et protégées.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className='py-20 bg-gradient-to-r from-[#F97316] to-orange-500'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='grid md:grid-cols-4 gap-8 text-white'>
            <div className='text-center'>
              <p className='text-5xl font-bold mb-2'>5K+</p>
              <p className='text-orange-100 text-lg'>Membres Actifs</p>
            </div>
            <div className='text-center'>
              <p className='text-5xl font-bold mb-2'>50K+</p>
              <p className='text-orange-100 text-lg'>Messages Partagés</p>
            </div>
            <div className='text-center'>
              <p className='text-5xl font-bold mb-2'>200+</p>
              <p className='text-orange-100 text-lg'>Églises Connectées</p>
            </div>
            <div className='text-center'>
              <p className='text-5xl font-bold mb-2'>24/7</p>
              <p className='text-orange-100 text-lg'>Support Disponible</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 text-center'>
        <h3 className='text-4xl font-bold text-gray-900 mb-6'>Prêt à Rejoindre la Communauté ?</h3>
        <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>
          Crée ton compte en quelques secondes et commence à explorer, partager et grandir avec d'autres fidèles.
        </p>
        <NavLink to='/signin' className='inline-block px-10 py-4 bg-[#F97316] text-white rounded-xl font-bold text-lg hover:bg-orange-600 transition-all transform hover:scale-105 shadow-xl'>
          S'inscrire Gratuitement
        </NavLink>
      </section>

      {/* Footer */}
      <footer className='bg-gray-900 text-gray-300 py-12'>
        <div className='max-w-7xl mx-auto px-4 text-center'>
          <p className='mb-4 text-2xl font-bold text-orange-400'>AmenNet</p>
          <p className='mb-2'>Connecté par la Foi • Unie dans l'Amour</p>
          <p className='text-gray-500 text-sm'>© 2026 AmenNet. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
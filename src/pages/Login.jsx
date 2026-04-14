import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react'
import { auth } from '../services/fiebase';
import { useNavigate, NavLink } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Heart } from 'lucide-react'

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [rememberMe, setRememberMe] = useState(false)

    const handleChange = (e) => {
        setFormData({
            ...formData, [e.target.name]: e.target.value
        })
        setError('')
    }

    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true)
        setError('')

        if (!formData.email || !formData.password) {
            setError('Veuillez remplir tous les champs')
            setLoading(false)
            return
        }

        try {
            await signInWithEmailAndPassword(auth, formData.email, formData.password)
            navigate('/dashboardLayout')
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                setError('Utilisateur non trouvé. Veuillez vérifier votre email.')
            } else if (error.code === 'auth/wrong-password') {
                setError('Mot de passe incorrect. Veuillez réessayer.')
            } else if (error.code === 'auth/invalid-email') {
                setError('Adresse email invalide.')
            } else {
                setError(error.message)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 flex items-center justify-center p-4'>
            {/* Left Side - Branding & Feature */}
            <div className='hidden lg:flex lg:w-1/2 flex-col justify-center items-center pr-12'>
                <div className='text-center'>
                    <div className='mb-8'>
                        <Heart className='w-24 h-24 text-[#F97316] mx-auto animate-pulse' />
                    </div>

                    <h1 className='text-7xl font-bold bg-gradient-to-r from-[#F97316] to-orange-500 bg-clip-text text-transparent mb-4'>
                        AmenNet
                    </h1>
                    <p className='text-2xl text-gray-700 font-semibold mb-12'>
                        Bienvenue à la Maison
                    </p>

                    <div className='space-y-8 max-w-md mx-auto'>
                        <div className='bg-white rounded-xl p-6 shadow-lg border-l-4 border-[#F97316]'>
                            <p className='text-lg text-gray-800 font-semibold mb-2'>Connecté à Votre Foi</p>
                            <p className='text-gray-600'>Partage tes témoignages et grandit spirituellement avec une communauté bienveillante.</p>
                        </div>

                        <div className='bg-white rounded-xl p-6 shadow-lg border-l-4 border-[#F97316]'>
                            <p className='text-lg text-gray-800 font-semibold mb-2'>Découvre Ton Église</p>
                            <p className='text-gray-600'>Trouve les églises près de toi et connecte-toi avec d'autres fidèles de ta communauté.</p>
                        </div>

                        <div className='bg-white rounded-xl p-6 shadow-lg border-l-4 border-[#F97316]'>
                            <p className='text-lg text-gray-800 font-semibold mb-2'>Inspiration Quotidienne</p>
                            <p className='text-gray-600'>Reçois des versets, des prières et du soutien spirituel pour ta journée.</p>
                        </div>
                    </div>

                    <div className='mt-12 text-gray-600 italic'>
                        <p>"Celui qui entre par la porte est le berger des brebis" - Jean 10:2</p>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className='w-full lg:w-1/2 max-w-md'>
                <div className='bg-white rounded-2xl shadow-2xl p-8 border border-orange-100'>
                    <div className='text-center mb-8'>
                        <div className='inline-block p-4 bg-orange-50 rounded-full mb-4'>
                            <Heart className='w-8 h-8 text-[#F97316]' />
                        </div>
                        <h2 className='text-3xl font-bold text-gray-900 mb-2'>Connexion</h2>
                        <p className='text-gray-600'>Bienvenue, connecte-toi à ta communauté</p>
                    </div>

                    {error && (
                        <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
                            <p className='text-red-700 text-sm font-semibold'>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className='space-y-6'>
                        {/* Email */}
                        <div>
                            <label className='block text-sm font-semibold text-gray-700 mb-2'>Adresse Email</label>
                            <div className='relative'>
                                <Mail className='absolute left-4 top-3.5 w-5 h-5 text-gray-400' />
                                <input
                                    type="email"
                                    name='email'
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder='vous@exemple.com'
                                    className='w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all duration-200'
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className='block text-sm font-semibold text-gray-700 mb-2'>Mot de Passe</label>
                            <div className='relative'>
                                <Lock className='absolute left-4 top-3.5 w-5 h-5 text-gray-400' />
                                <input
                                    type="password"
                                    name='password'
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder='••••••••'
                                    className='w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all duration-200'
                                />
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className='flex items-center justify-between'>
                            <label className='flex items-center space-x-2 cursor-pointer'>
                                <input
                                    type='checkbox'
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className='w-4 h-4 rounded border-gray-300 text-[#F97316] cursor-pointer'
                                />
                                <span className='text-sm text-gray-700'>Se souvenir de moi</span>
                            </label>
                            <a href='#' className='text-sm text-[#F97316] hover:text-orange-600 font-semibold transition-colors'>
                                Mot de passe oublié ?
                            </a>
                        </div>

                        {/* Submit Button */}
                        <button
                            type='submit'
                            disabled={loading}
                            className='w-full px-6 py-3 bg-gradient-to-r from-[#F97316] to-orange-500 text-white rounded-lg font-bold text-lg hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2'
                        >
                            <span>{loading ? 'Connexion en cours...' : 'Se Connecter'}</span>
                            {!loading && <ArrowRight className='w-5 h-5' />}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className='relative my-8'>
                        <div className='absolute inset-0 flex items-center'>
                            <div className='w-full border-t border-gray-300'></div>
                        </div>
                        <div className='relative flex justify-center text-sm'>
                            <span className='px-2 bg-white text-gray-500'>Ou</span>
                        </div>
                    </div>

                    {/* Signup Link */}
                    <div className='text-center'>
                        <p className='text-gray-600'>
                            Pas encore membre ?{' '}
                            <NavLink to='/signin' className='font-bold text-[#F97316] hover:text-orange-600 transition-colors'>
                                S'inscrire maintenant
                            </NavLink>
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className='mt-8 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200'>
                        <p className='text-sm text-gray-700 text-center'>
                            <span className='font-semibold'>Besoin d'aide ?</span> Contacte notre support community@amennet.com
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
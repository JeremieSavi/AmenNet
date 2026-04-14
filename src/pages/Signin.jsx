import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react'
import { auth, db } from '../services/fiebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, NavLink } from 'react-router-dom';
import { Mail, Lock, User, MapPin, Briefcase, Heart, ArrowRight, Building2, Users } from 'lucide-react'

function Signin() {
    const [accountType, setAccountType] = useState('Fidèle') // Fidèle ou Église
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        profession: '',
        quatier: '',
        email: '',
        password: '',
        confirmPassword: '',
        egliseName: '', // Pour les comptes Église
        egliseAdresse: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e) => {
        setFormData({
            ...formData, [e.target.name]: e.target.value
        })
        setError('')
    }

    const navigate = useNavigate()

    const handleSignin = async (e) => {
        e.preventDefault();
        setLoading(true)
        setError('')

        // Validation
        if (!formData.nom.trim() || !formData.prenom.trim()) {
            setError('Veuillez entrer votre nom et prénom')
            setLoading(false)
            return
        }

        if (accountType === 'Église' && !formData.egliseName.trim()) {
            setError('Veuillez entrer le nom de votre église')
            setLoading(false)
            return
        }

        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères')
            setLoading(false)
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas')
            setLoading(false)
            return
        }

        try {
            const utilisateur = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
            const user = utilisateur.user

            const userData = {
                nom: formData.nom,
                prenom: formData.prenom,
                profession: formData.profession,
                quatier: formData.quatier,
                email: formData.email,
                createdAt: new Date(),
                accountType: accountType
            }

            // Si c'est un compte Église, ajouter les infos spécifiques
            if (accountType === 'Église') {
                userData.egliseName = formData.egliseName
                userData.egliseAdresse = formData.egliseAdresse
                userData.certified = false // À vérifier par un admin
            }

            await setDoc(doc(db, 'users', user.uid), userData)

            navigate('/dashboardLayout')
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 flex items-center justify-center p-4'>
            {/* Left Side - Branding */}
            <div className='hidden lg:flex lg:w-1/2 flex-col justify-center items-center pr-12'>
                <div className='text-center'>
                    <h1 className='text-7xl font-bold bg-gradient-to-r from-[#F97316] to-orange-500 bg-clip-text text-transparent mb-4'>
                        AmenNet
                    </h1>
                    <p className='text-2xl text-gray-700 font-semibold mb-8'>
                        La Communauté Chrétienne Qui Inspire
                    </p>
                    
                    <div className='space-y-6 mb-12'>
                        <div className='flex items-center space-x-4'>
                            <div className='w-12 h-12 bg-[#F97316] rounded-full flex items-center justify-center'>
                                <Heart className='w-6 h-6 text-white' />
                            </div>
                            <div className='text-left'>
                                <p className='font-bold text-gray-900'>Partage Authentique</p>
                                <p className='text-gray-600'>Exprime ta foi librement</p>
                            </div>
                        </div>

                        <div className='flex items-center space-x-4'>
                            <div className='w-12 h-12 bg-[#F97316] rounded-full flex items-center justify-center'>
                                <User className='w-6 h-6 text-white' />
                            </div>
                            <div className='text-left'>
                                <p className='font-bold text-gray-900'>Communauté Bienveillante</p>
                                <p className='text-gray-600'>Connecte avec d'autres fidèles</p>
                            </div>
                        </div>

                        <div className='flex items-center space-x-4'>
                            <div className='w-12 h-12 bg-[#F97316] rounded-full flex items-center justify-center'>
                                <MapPin className='w-6 h-6 text-white' />
                            </div>
                            <div className='text-left'>
                                <p className='font-bold text-gray-900'>Découvre Localement</p>
                                <p className='text-gray-600'>Trouve les églises près de toi</p>
                            </div>
                        </div>
                    </div>

                    <div className='bg-orange-100 border-l-4 border-[#F97316] p-6 rounded-lg'>
                        <p className='text-gray-800 italic'>
                            "Encouragez-vous les uns les autres et construisez-vous mutuellement, car c'est ce qui vous édifie." - 1 Thes 5:11
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className='w-full lg:w-1/2 max-w-md'>
                <div className='bg-white rounded-2xl shadow-2xl p-8 border border-orange-100'>
                    <h2 className='text-3xl font-bold text-gray-900 mb-2'>Créer un Compte</h2>
                    <p className='text-gray-600 mb-6'>Rejoins la communauté AmenNet aujourd'hui</p>

                    {error && (
                        <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
                            <p className='text-red-700 text-sm font-semibold'>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSignin} className='space-y-4'>
                        {/* Type de Compte Selection */}
                        <div className='mb-6'>
                            <label className='block text-sm font-semibold text-gray-700 mb-3'>Type de Compte *</label>
                            <div className='grid grid-cols-2 gap-3'>
                                {/* Fidèle */}
                                <button
                                    type='button'
                                    onClick={() => setAccountType('Fidèle')}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        accountType === 'Fidèle'
                                            ? 'border-[#F97316] bg-orange-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                >
                                    <Users className={`w-6 h-6 mx-auto mb-2 ${accountType === 'Fidèle' ? 'text-[#F97316]' : 'text-gray-400'}`} />
                                    <p className={`text-sm font-semibold ${accountType === 'Fidèle' ? 'text-[#F97316]' : 'text-gray-700'}`}>
                                        Fidèle
                                    </p>
                                    <p className='text-xs text-gray-500 mt-1'>Personnel</p>
                                </button>

                                {/* Église */}
                                <button
                                    type='button'
                                    onClick={() => setAccountType('Église')}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        accountType === 'Église'
                                            ? 'border-[#F97316] bg-orange-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                >
                                    <Building2 className={`w-6 h-6 mx-auto mb-2 ${accountType === 'Église' ? 'text-[#F97316]' : 'text-gray-400'}`} />
                                    <p className={`text-sm font-semibold ${accountType === 'Église' ? 'text-[#F97316]' : 'text-gray-700'}`}>
                                        Église
                                    </p>
                                    <p className='text-xs text-gray-500 mt-1'>Officiellement</p>
                                </button>
                            </div>
                        </div>

                        {/* Nom & Prénom */}
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                                    {accountType === 'Église' ? 'Responsable Prénom' : 'Prénom'} *
                                </label>
                                <div className='relative'>
                                    <User className='absolute left-3 top-3 w-5 h-5 text-gray-400' />
                                    <input
                                        type="text"
                                        name='prenom'
                                        value={formData.prenom}
                                        onChange={handleChange}
                                        placeholder='Jean'
                                        required
                                        className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all duration-200'
                                    />
                                </div>
                            </div>
                            <div>
                                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                                    {accountType === 'Église' ? 'Responsable Nom' : 'Nom'} *
                                </label>
                                <div className='relative'>
                                    <User className='absolute left-3 top-3 w-5 h-5 text-gray-400' />
                                    <input
                                        type="text"
                                        name='nom'
                                        value={formData.nom}
                                        onChange={handleChange}
                                        placeholder='Dupont'
                                        required
                                        className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all duration-200'
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Infos spécifiques Église */}
                        {accountType === 'Église' && (
                            <>
                                <div>
                                    <label className='block text-sm font-semibold text-gray-700 mb-2'>Nom de l'Église *</label>
                                    <div className='relative'>
                                        <Building2 className='absolute left-3 top-3 w-5 h-5 text-gray-400' />
                                        <input
                                            type="text"
                                            name='egliseName'
                                            value={formData.egliseName}
                                            onChange={handleChange}
                                            placeholder='Ex: Église de la Grâce'
                                            className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all duration-200'
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className='block text-sm font-semibold text-gray-700 mb-2'>Adresse de l'Église</label>
                                    <div className='relative'>
                                        <MapPin className='absolute left-3 top-3 w-5 h-5 text-gray-400' />
                                        <input
                                            type="text"
                                            name='egliseAdresse'
                                            value={formData.egliseAdresse}
                                            onChange={handleChange}
                                            placeholder='Ex: 123 Rue de la Foi'
                                            className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all duration-200'
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Profession & Quartier (seulement pour Fidèle) */}
                        {accountType === 'Fidèle' && (
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-semibold text-gray-700 mb-2'>Profession</label>
                                    <div className='relative'>
                                        <Briefcase className='absolute left-3 top-3 w-5 h-5 text-gray-400' />
                                        <input
                                            type="text"
                                            name='profession'
                                            value={formData.profession}
                                            onChange={handleChange}
                                            placeholder='Ex: Ingénieur'
                                            className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all duration-200'
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className='block text-sm font-semibold text-gray-700 mb-2'>Quartier</label>
                                    <div className='relative'>
                                        <MapPin className='absolute left-3 top-3 w-5 h-5 text-gray-400' />
                                        <input
                                            type="text"
                                            name='quatier'
                                            value={formData.quatier}
                                            onChange={handleChange}
                                            placeholder='Ex: Centre-Ville'
                                            className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all duration-200'
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className='block text-sm font-semibold text-gray-700 mb-2'>Email *</label>
                            <div className='relative'>
                                <Mail className='absolute left-3 top-3 w-5 h-5 text-gray-400' />
                                <input
                                    type="email"
                                    name='email'
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder='vous@exemple.com'
                                    required
                                    className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all duration-200'
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className='block text-sm font-semibold text-gray-700 mb-2'>Mot de Passe *</label>
                            <div className='relative'>
                                <Lock className='absolute left-3 top-3 w-5 h-5 text-gray-400' />
                                <input
                                    type="password"
                                    name='password'
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder='••••••••'
                                    required
                                    className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all duration-200'
                                />
                            </div>
                            <p className='text-xs text-gray-500 mt-1'>Au moins 6 caractères</p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className='block text-sm font-semibold text-gray-700 mb-2'>Confirmer le Mot de Passe *</label>
                            <div className='relative'>
                                <Lock className='absolute left-3 top-3 w-5 h-5 text-gray-400' />
                                <input
                                    type="password"
                                    name='confirmPassword'
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder='••••••••'
                                    required
                                    className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all duration-200'
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type='submit'
                            disabled={loading}
                            className='w-full mt-6 px-6 py-3 bg-gradient-to-r from-[#F97316] to-orange-500 text-white rounded-lg font-bold text-lg hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2'
                        >
                            <span>{loading ? 'Inscription en cours...' : 'S\'inscrire'}</span>
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

                    {/* Login Link */}
                    <div className='text-center'>
                        <p className='text-gray-600'>
                            Déjà membre ?{' '}
                            <NavLink to='/login' className='font-bold text-[#F97316] hover:text-orange-600 transition-colors'>
                                Se connecter
                            </NavLink>
                        </p>
                    </div>

                    {/* Terms */}
                    <p className='text-xs text-gray-500 text-center mt-6'>
                        En créant un compte, tu acceptes nos conditions d'utilisation et politique de confidentialité.
                    </p>

                    {/* Info Box pour Églises */}
                    {accountType === 'Église' && (
                        <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                            <p className='text-xs text-blue-700'>
                                <span className='font-semibold'>Note:</span> Les comptes Église nécessitent une vérification. Nous confirmerons votre inscription sous peu.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Signin
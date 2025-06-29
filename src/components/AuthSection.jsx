import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, ChalkboardTeacher, UserGraduate, Mail, Lock, Key, UserPlus, LogIn } from 'lucide-react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { ref, set, onValue } from 'firebase/database'
import { auth, database } from '../firebase/config'

const AuthSection = ({ showNotification }) => {
  const [showTeacherRegister, setShowTeacherRegister] = useState(false)
  const [showStudentRegister, setShowStudentRegister] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleTeacherLogin = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const email = formData.get('email').trim()
    const password = formData.get('password')

    if (!email || !password) {
      showNotification('Please fill in all fields', 'error')
      return
    }

    setLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const userRef = ref(database, `users/${userCredential.user.uid}`)
      
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val()
        if (userData && userData.role === 'teacher') {
          showNotification('Welcome back, Teacher! 🎓', 'success')
        } else {
          auth.signOut()
          showNotification('Access denied: Not a teacher account', 'error')
        }
        setLoading(false)
      }, { onlyOnce: true })
    } catch (error) {
      showNotification(`Login failed: ${error.message}`, 'error')
      setLoading(false)
    }
  }

  const handleStudentLogin = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const email = formData.get('email').trim()
    const password = formData.get('password')

    if (!email || !password) {
      showNotification('Please fill in all fields', 'error')
      return
    }

    setLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const userRef = ref(database, `users/${userCredential.user.uid}`)
      
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val()
        if (userData && userData.role === 'student') {
          showNotification('Welcome back, Student! 📚', 'success')
        } else {
          auth.signOut()
          showNotification('Access denied: Not a student account', 'error')
        }
        setLoading(false)
      }, { onlyOnce: true })
    } catch (error) {
      showNotification(`Login failed: ${error.message}`, 'error')
      setLoading(false)
    }
  }

  const handleTeacherRegister = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const email = formData.get('email').trim()
    const password = formData.get('password')
    const confirmPassword = formData.get('confirmPassword')

    if (!email || !password || !confirmPassword) {
      showNotification('Please fill in all fields', 'error')
      return
    }

    if (password.length < 6) {
      showNotification('Password must be at least 6 characters long', 'error')
      return
    }

    if (password !== confirmPassword) {
      showNotification('Passwords do not match', 'error')
      return
    }

    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await set(ref(database, `users/${userCredential.user.uid}`), {
        email,
        role: 'teacher',
        createdAt: Date.now(),
        displayName: email.split('@')[0]
      })
      showNotification('Teacher registration successful! Welcome aboard! 🎉', 'success')
      setShowTeacherRegister(false)
    } catch (error) {
      showNotification(`Registration failed: ${error.message}`, 'error')
    }
    setLoading(false)
  }

  const handleStudentRegister = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const email = formData.get('email').trim()
    const password = formData.get('password')
    const confirmPassword = formData.get('confirmPassword')

    if (!email || !password || !confirmPassword) {
      showNotification('Please fill in all fields', 'error')
      return
    }

    if (password.length < 6) {
      showNotification('Password must be at least 6 characters long', 'error')
      return
    }

    if (password !== confirmPassword) {
      showNotification('Passwords do not match', 'error')
      return
    }

    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await set(ref(database, `users/${userCredential.user.uid}`), {
        email,
        role: 'student',
        createdAt: Date.now(),
        displayName: email.split('@')[0]
      })
      showNotification('Student registration successful! Welcome! 🎉', 'success')
      setShowStudentRegister(false)
    } catch (error) {
      showNotification(`Registration failed: ${error.message}`, 'error')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 z-10"
      >
        <div className="flex items-center justify-center gap-4 mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="p-4 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 animate-glow"
          >
            <GraduationCap size={48} className="text-white" />
          </motion.div>
          <h1 className="text-6xl font-bold gradient-text">
            VEET Classroom
          </h1>
        </div>
        <p className="text-xl text-white/70 font-medium">
          Empowering Education Through Technology ✨
        </p>
      </motion.div>

      {/* Auth Cards */}
      <div className="grid md:grid-cols-2 gap-8 w-full max-width-4xl z-10">
        {/* Teacher Card */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card"
        >
          <div className="text-center mb-6">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 mb-4">
              <ChalkboardTeacher size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Teacher Portal</h2>
            <p className="text-white/60">Manage your classes and students</p>
          </div>

          {!showTeacherRegister ? (
            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="input-field pl-12"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="input-field pl-12"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <LogIn size={20} />
                {loading ? 'Signing in...' : 'Login as Teacher'}
              </button>
              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-white/60 mb-2">New teacher?</p>
                <button
                  type="button"
                  onClick={() => setShowTeacherRegister(true)}
                  className="text-primary-400 hover:text-primary-300 font-medium flex items-center gap-2 mx-auto transition-colors"
                >
                  <UserPlus size={16} />
                  Register
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleTeacherRegister} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="input-field pl-12"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="input-field pl-12"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  className="input-field pl-12"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <UserPlus size={20} />
                {loading ? 'Creating Account...' : 'Register Teacher'}
              </button>
              <button
                type="button"
                onClick={() => setShowTeacherRegister(false)}
                className="btn-outline w-full"
              >
                Back to Login
              </button>
            </form>
          )}
        </motion.div>

        {/* Student Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="card"
        >
          <div className="text-center mb-6">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-secondary-500 to-secondary-600 mb-4">
              <UserGraduate size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Student Portal</h2>
            <p className="text-white/60">Access your classes and assignments</p>
          </div>

          {!showStudentRegister ? (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="input-field pl-12"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="input-field pl-12"
                  required
                />
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="text"
                  name="classCode"
                  placeholder="Class Code (Optional)"
                  className="input-field pl-12"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <LogIn size={20} />
                {loading ? 'Signing in...' : 'Login as Student'}
              </button>
              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-white/60 mb-2">New student?</p>
                <button
                  type="button"
                  onClick={() => setShowStudentRegister(true)}
                  className="text-secondary-400 hover:text-secondary-300 font-medium flex items-center gap-2 mx-auto transition-colors"
                >
                  <UserPlus size={16} />
                  Register
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStudentRegister} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="input-field pl-12"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="input-field pl-12"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  className="input-field pl-12"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <UserPlus size={20} />
                {loading ? 'Creating Account...' : 'Register Student'}
              </button>
              <button
                type="button"
                onClick={() => setShowStudentRegister(false)}
                className="btn-outline w-full"
              >
                Back to Login
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default AuthSection
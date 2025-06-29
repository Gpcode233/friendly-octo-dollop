import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Book, Users, Calendar, LogOut, Download, Key } from 'lucide-react'
import { ref, onValue, set, get } from 'firebase/database'
import { database } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'

const StudentDashboard = ({ showNotification }) => {
  const { user, logout } = useAuth()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadStudentClasses()
    }
  }, [user])

  const loadStudentClasses = () => {
    const studentClassesRef = ref(database, `users/${user.uid}/enrolledClasses`)
    onValue(studentClassesRef, (snapshot) => {
      const enrolledClasses = snapshot.val()
      if (enrolledClasses) {
        const classPromises = Object.keys(enrolledClasses).map(async (classCode) => {
          const classRef = ref(database, `classes/${classCode}`)
          const classSnapshot = await get(classRef)
          const classData = classSnapshot.val()
          
          if (classData) {
            const assignmentsRef = ref(database, `classes/${classCode}/assignments`)
            const assignmentsSnapshot = await get(assignmentsRef)
            const assignmentCount = assignmentsSnapshot.exists() ? Object.keys(assignmentsSnapshot.val()).length : 0
            
            return {
              ...classData,
              assignmentCount
            }
          }
          return null
        })
        
        Promise.all(classPromises).then(resolvedClasses => {
          setClasses(resolvedClasses.filter(Boolean))
        })
      } else {
        setClasses([])
      }
    })
  }

  const joinClass = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const classCode = formData.get('classCode').trim().toUpperCase()

    if (!classCode) {
      showNotification('Please enter a class code', 'error')
      return
    }

    setLoading(true)
    try {
      const classRef = ref(database, `classes/${classCode}`)
      const classSnapshot = await get(classRef)
      
      if (!classSnapshot.exists()) {
        showNotification('Invalid class code. Please check and try again.', 'error')
        setLoading(false)
        return
      }

      const classData = classSnapshot.val()

      // Add student to class
      await set(ref(database, `classes/${classCode}/students/${user.uid}`), {
        joinedAt: Date.now(),
        studentEmail: user.email
      })

      // Add class to student's enrolled classes
      await set(ref(database, `users/${user.uid}/enrolledClasses/${classCode}`), true)

      showNotification(`Successfully joined ${classData.name}! 🎉`)
      e.target.reset()
      loadStudentClasses()
    } catch (error) {
      showNotification(`Failed to join class: ${error.message}`, 'error')
    }
    setLoading(false)
  }

  const downloadAssignment = async (downloadURL, fileName) => {
    try {
      const response = await fetch(downloadURL)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showNotification(`Downloaded "${fileName}" successfully! 📥`)
    } catch (error) {
      showNotification('Failed to download assignment', 'error')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      showNotification('Logged out successfully. See you soon! 👋')
    } catch (error) {
      showNotification('Logout failed', 'error')
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-secondary-500 to-secondary-600">
              <Book size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">Student Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="btn-outline flex items-center gap-2">
            <LogOut size={20} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-8">
        {/* Join Class Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Key size={24} className="text-secondary-400" />
            <h2 className="text-2xl font-bold text-white">Join a Class</h2>
          </div>
          <form onSubmit={joinClass} className="flex gap-4">
            <input
              type="text"
              name="classCode"
              placeholder="Enter Class Code"
              className="input-field flex-1"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <Key size={20} />
              {loading ? 'Joining...' : 'Join Class'}
            </button>
          </form>
        </motion.div>

        {/* Classes Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <Book size={24} className="text-secondary-400" />
            <h2 className="text-2xl font-bold text-white">Your Classes</h2>
          </div>
          
          {classes.length === 0 ? (
            <div className="text-center py-12">
              <Book size={48} className="text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white/60 mb-2">No Classes Yet</h3>
              <p className="text-white/40">Ask your teacher for a class code to get started!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((classItem, index) => (
                <motion.div
                  key={classItem.classCode}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-secondary-500 to-secondary-600 group-hover:scale-110 transition-transform">
                      <Book size={20} className="text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{classItem.name}</h3>
                  <p className="text-white/60 mb-2">{classItem.subject}</p>
                  <p className="text-sm text-white/50 mb-4">Teacher: {classItem.teacherEmail}</p>
                  <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                    <span className="flex items-center gap-1">
                      <Book size={14} />
                      {classItem.assignmentCount} assignments
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(classItem.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* Show assignments if any */}
                  {classItem.assignmentCount > 0 && (
                    <ClassAssignments 
                      classCode={classItem.classCode} 
                      downloadAssignment={downloadAssignment}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

// Component to show assignments for a class
const ClassAssignments = ({ classCode, downloadAssignment }) => {
  const [assignments, setAssignments] = useState([])
  const [showAssignments, setShowAssignments] = useState(false)

  useEffect(() => {
    const assignmentsRef = ref(database, `classes/${classCode}/assignments`)
    onValue(assignmentsRef, (snapshot) => {
      const assignmentsData = snapshot.val()
      if (assignmentsData) {
        const assignmentsList = Object.entries(assignmentsData).map(([id, assignment]) => ({
          id,
          ...assignment
        }))
        setAssignments(assignmentsList)
      } else {
        setAssignments([])
      }
    })
  }, [classCode])

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <button
        onClick={() => setShowAssignments(!showAssignments)}
        className="text-secondary-400 hover:text-secondary-300 text-sm font-medium mb-3 transition-colors"
      >
        {showAssignments ? 'Hide' : 'Show'} Assignments ({assignments.length})
      </button>
      
      {showAssignments && (
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5"
            >
              <div>
                <p className="text-sm font-medium text-white">{assignment.fileName}</p>
                <p className="text-xs text-white/50">
                  {new Date(assignment.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => downloadAssignment(assignment.downloadURL, assignment.fileName)}
                className="text-secondary-400 hover:text-secondary-300 p-1 rounded transition-colors"
              >
                <Download size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StudentDashboard
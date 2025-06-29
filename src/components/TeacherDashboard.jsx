import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Book, Users, Calendar, LogOut, Eye, Upload, Download, ArrowLeft } from 'lucide-react'
import { ref, set, push, onValue, get } from 'firebase/database'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { database, storage } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'

const TeacherDashboard = ({ showNotification }) => {
  const { user, logout } = useAuth()
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    if (user) {
      loadTeacherClasses()
    }
  }, [user])

  const loadTeacherClasses = () => {
    const teacherClassesRef = ref(database, `users/${user.uid}/classes`)
    onValue(teacherClassesRef, (snapshot) => {
      const classesData = snapshot.val()
      if (classesData) {
        const classPromises = Object.keys(classesData).map(async (classCode) => {
          const classRef = ref(database, `classes/${classCode}`)
          const classSnapshot = await get(classRef)
          const classData = classSnapshot.val()
          
          if (classData) {
            const studentsRef = ref(database, `classes/${classCode}/students`)
            const studentsSnapshot = await get(studentsRef)
            const studentCount = studentsSnapshot.exists() ? Object.keys(studentsSnapshot.val()).length : 0
            
            return {
              ...classData,
              studentCount
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

  const generateClassCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const createClass = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const className = formData.get('className').trim()
    const subject = formData.get('subject').trim()

    if (!className || !subject) {
      showNotification('Please fill in all fields', 'error')
      return
    }

    setLoading(true)
    try {
      const classCode = generateClassCode()
      const classData = {
        name: className,
        subject: subject,
        teacherId: user.uid,
        teacherEmail: user.email,
        createdAt: Date.now(),
        classCode: classCode,
        studentCount: 0
      }

      await set(ref(database, `classes/${classCode}`), classData)
      await set(ref(database, `users/${user.uid}/classes/${classCode}`), true)

      showNotification(`Class "${className}" created successfully! 🎉`)
      e.target.reset()
      loadTeacherClasses()
    } catch (error) {
      showNotification(`Failed to create class: ${error.message}`, 'error')
    }
    setLoading(false)
  }

  const viewClass = async (classData) => {
    setSelectedClass(classData)
    const assignmentsRef = ref(database, `classes/${classData.classCode}/assignments`)
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
  }

  const uploadAssignment = async () => {
    if (!selectedFile || !selectedClass) {
      showNotification('Please select a file first', 'error')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      showNotification('File size must be less than 10MB', 'error')
      return
    }

    setLoading(true)
    try {
      const timestamp = Date.now()
      const fileName = `${timestamp}_${selectedFile.name}`
      const fileStorageRef = storageRef(storage, `assignments/${selectedClass.classCode}/${fileName}`)
      
      const snapshot = await uploadBytes(fileStorageRef, selectedFile)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      const assignmentRef = ref(database, `classes/${selectedClass.classCode}/assignments`)
      const newAssignmentRef = push(assignmentRef)
      
      await set(newAssignmentRef, {
        fileName: selectedFile.name,
        downloadURL: downloadURL,
        uploadedAt: Date.now(),
        uploadedBy: user.uid,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      })

      showNotification(`Assignment "${selectedFile.name}" uploaded successfully! 🎉`)
      setSelectedFile(null)
      document.getElementById('file-input').value = ''
    } catch (error) {
      showNotification('Failed to upload assignment: ' + error.message, 'error')
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

  if (selectedClass) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedClass(null)}
              className="btn-outline flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Back to Classes
            </button>
            <button onClick={handleLogout} className="btn-outline flex items-center gap-2">
              <LogOut size={20} />
              Logout
            </button>
          </div>

          {/* Class Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600">
                <Book size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{selectedClass.name}</h1>
                <p className="text-white/60">{selectedClass.subject}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/60">
              <span className="flex items-center gap-2">
                <Users size={16} />
                {selectedClass.studentCount} Students
              </span>
              <span className="flex items-center gap-2 px-3 py-1 bg-primary-500/20 rounded-lg text-primary-400 font-mono">
                Code: {selectedClass.classCode}
              </span>
            </div>
          </motion.div>

          {/* Upload Assignment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card mb-8"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Upload size={20} />
              Upload Assignment
            </h2>
            <div className="flex items-center gap-4">
              <input
                id="file-input"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
                className="hidden"
              />
              <button
                onClick={() => document.getElementById('file-input').click()}
                className="btn-outline"
              >
                Choose File
              </button>
              <span className="text-white/60 flex-1">
                {selectedFile ? selectedFile.name : 'No file chosen'}
              </span>
              <button
                onClick={uploadAssignment}
                disabled={!selectedFile || loading}
                className="btn-primary flex items-center gap-2"
              >
                <Upload size={16} />
                {loading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </motion.div>

          {/* Assignments List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h2 className="text-xl font-bold text-white mb-6">Assignments</h2>
            {assignments.length === 0 ? (
              <div className="text-center py-12">
                <Book size={48} className="text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white/60 mb-2">No Assignments Yet</h3>
                <p className="text-white/40">Upload your first assignment to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary-500/20">
                        <Book size={16} className="text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{assignment.fileName}</p>
                        <p className="text-sm text-white/60">
                          Uploaded {new Date(assignment.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadAssignment(assignment.downloadURL, assignment.fileName)}
                      className="btn-outline flex items-center gap-2 text-sm"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600">
              <Book size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">Teacher Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="btn-outline flex items-center gap-2">
            <LogOut size={20} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-8">
        {/* Create Class Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Plus size={24} className="text-primary-400" />
            <h2 className="text-2xl font-bold text-white">Create New Class</h2>
          </div>
          <form onSubmit={createClass} className="grid md:grid-cols-3 gap-4">
            <input
              type="text"
              name="className"
              placeholder="Class Name"
              className="input-field"
              required
            />
            <input
              type="text"
              name="subject"
              placeholder="Subject"
              className="input-field"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              {loading ? 'Creating...' : 'Create Class'}
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
            <Book size={24} className="text-primary-400" />
            <h2 className="text-2xl font-bold text-white">Your Classes</h2>
          </div>
          
          {classes.length === 0 ? (
            <div className="text-center py-12">
              <Book size={48} className="text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white/60 mb-2">No Classes Yet</h3>
              <p className="text-white/40">Create your first class to get started with teaching!</p>
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
                    <div className="p-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 group-hover:scale-110 transition-transform">
                      <Book size={20} className="text-white" />
                    </div>
                    <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-lg text-sm font-mono">
                      {classItem.classCode}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{classItem.name}</h3>
                  <p className="text-white/60 mb-4">{classItem.subject}</p>
                  <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {classItem.studentCount} students
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(classItem.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => viewClass(classItem)}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    View Class
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default TeacherDashboard
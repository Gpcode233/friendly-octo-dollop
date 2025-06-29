import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const Notification = ({ message, type = 'success', onClose }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  }

  const colors = {
    success: 'from-green-500 to-green-600',
    error: 'from-red-500 to-red-600',
    warning: 'from-yellow-500 to-yellow-600',
    info: 'from-blue-500 to-blue-600'
  }

  const Icon = icons[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className="fixed top-6 right-6 z-50 max-w-md"
    >
      <div className={`bg-gradient-to-r ${colors[type]} text-white p-4 rounded-xl shadow-2xl backdrop-blur-sm border border-white/20`}>
        <div className="flex items-center gap-3">
          <Icon size={20} className="flex-shrink-0" />
          <p className="flex-1 font-medium">{message}</p>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default Notification
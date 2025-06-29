import React from 'react'
import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'

const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 bg-dark-900 flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="inline-block p-4 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 mb-4"
        >
          <GraduationCap size={48} className="text-white" />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <h3 className="text-xl font-semibold text-white mb-2">Loading...</h3>
          <p className="text-white/60">Please wait while we set things up</p>
        </motion.div>
      </div>
    </div>
  )
}

export default LoadingSpinner
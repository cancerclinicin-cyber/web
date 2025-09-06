"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

interface SuccessMessageProps {
  message: string;
  description: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function SuccessMessage({ 
  message, 
  description, 
  isVisible, 
  onClose 
}: SuccessMessageProps) {
  // Auto-hide after 5 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-start">
              <motion.div 
                className="flex-shrink-0 w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                >
                  <motion.div
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <Check className="h-6 w-6 text-emerald-600" strokeWidth={3} />
                  </motion.div>
                </motion.div>
              </motion.div>
              
              <div className="ml-5">
                <motion.h3 
                  className="text-xl font-semibold text-gray-900"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {message}
                </motion.h3>
                <motion.p 
                  className="text-gray-600 mt-2 text-base"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {description}
                </motion.p>
              </div>
            </div>
            
            <motion.button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <X className="h-5 w-5" />
            </motion.button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-6 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
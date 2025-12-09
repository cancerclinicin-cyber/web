"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Sparkles } from "lucide-react";

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
  // Auto-hide after 6 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-900/40 via-teal-900/30 to-cyan-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-md">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: 0
            }}
            animate={{
              y: [null, -100],
              scale: [0, 1, 0],
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            duration: 0.6
          }}
          className="relative bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/30 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-emerald-200/50 backdrop-blur-xl"
        >
          {/* Success icon with enhanced animation */}
          <div className="flex justify-center mb-6">
            <motion.div
              className="relative"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.2
              }}
            >
              {/* Outer ring */}
              <motion.div
                className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              >
                {/* Inner circle */}
                <motion.div
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                >
                  {/* Check icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 400 }}
                  >
                    <Check className="h-8 w-8 text-white drop-shadow-sm" strokeWidth={3} />
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Sparkle effects */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 2,
                    delay: 0.6 + i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  style={{
                    top: `${20 + Math.sin(i * 60 * Math.PI / 180) * 35}px`,
                    left: `${20 + Math.cos(i * 60 * Math.PI / 180) * 35}px`,
                  }}
                >
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Content */}
          <div className="text-center">
            <motion.h3
              className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {message}
            </motion.h3>

            <motion.p
              className="text-gray-600 text-lg leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              {description}
            </motion.p>
          </div>

          {/* Close button */}
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100/50 backdrop-blur-sm"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
          >
            <X className="h-5 w-5" />
          </motion.button>

          {/* Enhanced progress bar */}
          <div className="mt-8 w-full h-2 bg-gray-100/50 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full shadow-sm"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 6, ease: "easeInOut" }}
            />
          </div>

          {/* Subtle glow effect */}
          <motion.div
            className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-400/10 to-teal-400/10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
"use client"

import { motion } from "framer-motion"

export function LoadingDots() {
  return (
    <div className="flex space-x-1 justify-center items-center">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-primary rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 0.8,
            repeat: Number.POSITIVE_INFINITY,
            delay: index * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

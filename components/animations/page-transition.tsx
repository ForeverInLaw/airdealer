"use client"

import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94], // iOS-like easing
          },
        }}
        exit={{
          opacity: 0,
          y: -20,
          scale: 0.95,
          transition: {
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

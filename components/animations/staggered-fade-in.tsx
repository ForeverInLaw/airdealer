"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface StaggeredFadeInProps {
  children: ReactNode[]
  delay?: number
  duration?: number
}

export function StaggeredFadeIn({ children, delay = 0.1, duration = 0.5 }: StaggeredFadeInProps) {
  return (
    <>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              delay: index * delay,
              duration,
              ease: [0.25, 0.46, 0.45, 0.94],
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </>
  )
}

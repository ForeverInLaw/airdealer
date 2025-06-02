"use client"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"
import { motion, AnimatePresence } from "framer-motion"

const languages = [
  { code: "ru", flag: "🇷🇺", name: "Русский" },
  { code: "en", flag: "🇺🇸", name: "English" },
  { code: "pl", flag: "🇵🇱", name: "Polski" },
]

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n()

  const buttonVariants = {
    initial: { scale: 1, opacity: 0.7 },
    animate: { scale: 1, opacity: 1 },
    hover: { scale: 1.1, opacity: 1 },
    tap: { scale: 0.95 },
    exit: { scale: 0.9, opacity: 0.5 },
  }

  const containerVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  return (
    <motion.div className="flex flex-col gap-1" variants={containerVariants} initial="initial" animate="animate">
      <AnimatePresence mode="wait">
        {languages.map((lang) => (
          <motion.div
            key={lang.code}
            variants={buttonVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            exit="exit"
            layout
          >
            <Button
              variant={language === lang.code ? "default" : "ghost"}
              size="sm"
              onClick={() => setLanguage(lang.code as "ru" | "en" | "pl")}
              className={`h-8 w-8 p-0 text-xs transition-all duration-200 ${
                language === lang.code
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
              title={lang.name}
            >
              <motion.span
                className="text-sm"
                animate={{
                  scale: language === lang.code ? 1.1 : 1,
                  rotate: language === lang.code ? [0, -5, 5, 0] : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                {lang.flag}
              </motion.span>
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

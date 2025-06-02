"use client"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"
import { motion } from "framer-motion"

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n()

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ru" : "en")
  }

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleLanguage}
        className="h-9 w-9 md:h-8 md:w-8 text-muted-foreground hover:text-foreground"
        title="Switch Language"
      >
        <span className="text-xs font-medium">{language.toUpperCase()}</span>
      </Button>
    </motion.div>
  )
}

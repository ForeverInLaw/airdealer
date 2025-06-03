"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileNav } from "./mobile-nav"
import { useI18n } from "@/lib/i18n/context"
import { useMobile } from "@/hooks/use-mobile"

export function MobileHeader() {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const { t } = useI18n()
  const isMobile = useMobile()

  if (!isMobile) return null

  return (
    <>
      <header
        className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden"
        suppressHydrationWarning
      >
        <Button variant="outline" size="sm" onClick={() => setIsNavOpen(true)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Открыть меню</span>
        </Button>
        <h1 className="text-lg font-semibold">Админ панель</h1>
      </header>

      <MobileNav isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
    </>
  )
}

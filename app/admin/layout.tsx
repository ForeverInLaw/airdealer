"use client"

import type React from "react"
import { useState } from "react"
import SidebarNav from "@/components/admin/sidebar-nav"
import { MobileHeader } from "@/components/admin/mobile-header"
import { MobileNav } from "@/components/admin/mobile-nav"
import { Toaster } from "@/components/ui/toaster"
import { I18nProvider } from "@/lib/i18n/context"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <I18nProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </I18nProvider>
  )
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const isMobile = useMobile()

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40" suppressHydrationWarning>
      {/* Desktop Sidebar */}
      <SidebarNav />

      {/* Mobile Header */}
      {isMobile && <MobileHeader onMenuClick={() => setMobileNavOpen(true)} />}

      {/* Mobile Navigation */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Content */}
      <div className={cn("flex flex-col", isMobile ? "pt-16" : "sm:gap-4 sm:py-4 sm:pl-14")}>
        <main className={cn("grid flex-1 items-start gap-4 p-4", !isMobile && "sm:px-6 sm:py-0")}>{children}</main>
      </div>

      <Toaster />
    </div>
  )
}

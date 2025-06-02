import type React from "react"
import SidebarNav from "@/components/admin/sidebar-nav"
import { Toaster } from "@/components/ui/toaster"
import { I18nProvider } from "@/lib/i18n/context"
import { PageTransition } from "@/components/animations/page-transition"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <I18nProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <SidebarNav />
        <div className="flex flex-col flex-1 sm:py-4 sm:pl-14">
          <main className="flex-1 p-4 sm:px-6 sm:py-0 gap-4">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
        <Toaster />
      </div>
    </I18nProvider>
  )
}

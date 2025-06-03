"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  MapPin,
  Building,
  LayoutGrid,
  ShieldCheck,
  Settings,
  Warehouse,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { LanguageSwitcher } from "./language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase-client"

export default function SidebarNav() {
  const pathname = usePathname()
  const { t, isLoaded } = useI18n()

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/product-stock", label: "Product Stock", icon: Warehouse },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/locations", label: "Locations", icon: MapPin },
    { href: "/admin/manufacturers", label: "Manufacturers", icon: Building },
    { href: "/admin/categories", label: "Categories", icon: LayoutGrid },
    { href: "/admin/admins", label: "Admins", icon: ShieldCheck },
  ]

  // Use fallback labels initially, then update with translations
  const translatedNavItems = navItems.map((item) => ({
    ...item,
    label: isLoaded ? t(`nav.${item.href.split("/").pop() || "dashboard"}`) : item.label,
  }))

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Link
              href="/admin"
              className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base transition-all duration-200 hover:shadow-lg"
            >
              <Package className="h-4 w-4 transition-all group-hover:scale-110" />
              <span className="sr-only">Admin Panel</span>
            </Link>
          </motion.div>

          {translatedNavItems.map((item) => (
            <motion.div
              key={item.href}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-accent/50 md:h-8 md:w-8",
                      pathname === item.href && "bg-accent text-accent-foreground shadow-sm",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="glass-effect">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            </motion.div>
          ))}
        </nav>

        <nav className="mt-auto flex flex-col items-center gap-3 px-2 sm:py-5">
          <div className="flex flex-col items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Link
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-accent/50 md:h-8 md:w-8"
                  >
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">{isLoaded ? t("nav.settings") : "Settings"}</span>
                  </Link>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="right" className="glass-effect">
                {isLoaded ? t("nav.settings") : "Settings"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <button
                    onClick={async () => {
                      const supabase = createClient()
                      await supabase.auth.signOut()
                      window.location.href = "/"
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-accent/50 md:h-8 md:w-8"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">{isLoaded ? t("nav.logout") : "Logout"}</span>
                  </button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="right" className="glass-effect">
                {isLoaded ? t("nav.logout") : "Logout"}
              </TooltipContent>
            </Tooltip>
          </div>
        </nav>
      </TooltipProvider>
    </aside>
  )
}

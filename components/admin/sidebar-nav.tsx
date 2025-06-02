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
  Languages,
  ShieldCheck,
  Settings,
  Warehouse,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { LanguageSwitcher } from "./language-switcher"
import { motion } from "framer-motion"

export default function SidebarNav() {
  const pathname = usePathname()
  const { t, isLoaded } = useI18n()

  // Don't render until translations are loaded
  if (!isLoaded) {
    return (
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <div className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </aside>
    )
  }

  const navItems = [
    { href: "/admin", label: t("nav.dashboard"), icon: Home },
    { href: "/admin/products", label: t("nav.products"), icon: Package },
    { href: "/admin/product-stock", label: t("nav.productStock"), icon: Warehouse },
    { href: "/admin/orders", label: t("nav.orders"), icon: ShoppingCart },
    { href: "/admin/users", label: t("nav.users"), icon: Users },
    { href: "/admin/locations", label: t("nav.locations"), icon: MapPin },
    { href: "/admin/manufacturers", label: t("nav.manufacturers"), icon: Building },
    { href: "/admin/categories", label: t("nav.categories"), icon: LayoutGrid },
    { href: "/admin/interface-texts", label: t("nav.interfaceTexts"), icon: Languages },
    { href: "/admin/admins", label: t("nav.admins"), icon: ShieldCheck },
  ]

  const sidebarVariants = {
    hidden: { x: -56, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  return (
    <motion.aside
      className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      <TooltipProvider>
        <motion.nav className="flex flex-col items-center gap-4 px-2 sm:py-5" variants={itemVariants}>
          <motion.div variants={itemVariants}>
            <Link
              href="/admin"
              className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base transition-transform hover:scale-110"
            >
              <Package className="h-4 w-4 transition-all group-hover:scale-110" />
              <span className="sr-only">Admin Panel</span>
            </Link>
          </motion.div>

          {navItems.map((item, index) => (
            <motion.div key={item.href} variants={itemVariants} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:text-foreground md:h-8 md:w-8",
                      pathname === item.href && "bg-accent text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            </motion.div>
          ))}
        </motion.nav>

        <motion.nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5" variants={itemVariants}>
          <motion.div className="flex flex-col items-center gap-2" variants={itemVariants}>
            <LanguageSwitcher />
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">{t("nav.settings")}</span>
                  </Link>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="right">{t("nav.settings")}</TooltipContent>
            </Tooltip>
          </motion.div>
        </motion.nav>
      </TooltipProvider>
    </motion.aside>
  )
}

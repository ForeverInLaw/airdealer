"use client"

import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Package, Users, ShoppingCart, DollarSign } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { PageWrapper } from "@/components/animations/page-wrapper"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { getDashboardStats, type DashboardStats } from "@/lib/dashboard-stats"
import { LoadingSkeleton } from "@/components/animations/loading-skeleton"
import { useMobile } from "@/hooks/use-mobile"

export default function AdminDashboardPage() {
  const { t } = useI18n()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isMobile = useMobile()

  useEffect(() => {
    async function loadStats() {
      try {
        const dashboardStats = await getDashboardStats()
        setStats(dashboardStats)
      } catch (error) {
        console.error("Failed to load dashboard stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
    }).format(amount)
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="space-y-4">
          <LoadingSkeleton />
        </div>
      </PageWrapper>
    )
  }

  const statsData = [
    {
      title: t("dashboard.totalProducts"),
      value: stats?.totalProducts.toLocaleString() || "0",
      change: `+${stats?.productsChange || "0"} ${t("dashboard.sinceLastMonth")}`,
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: t("dashboard.activeUsers"),
      value: stats?.activeUsers.toLocaleString() || "0",
      change: `+${stats?.usersChange || "0"} ${t("dashboard.sinceLastWeek")}`,
      icon: Users,
      color: "text-green-600",
    },
    {
      title: t("dashboard.pendingOrders"),
      value: stats?.pendingOrders.toLocaleString() || "0",
      change: stats?.ordersChange || t("dashboard.needsAttention"),
      icon: ShoppingCart,
      color: "text-orange-600",
    },
    {
      title: t("dashboard.totalRevenue"),
      value: formatCurrency(stats?.totalRevenue || 0),
      change: `${stats?.revenueChange || "0%"} ${t("dashboard.fromLastMonth")}`,
      icon: DollarSign,
      color: "text-emerald-600",
    },
  ]

  return (
    <PageWrapper>
      <div className="space-y-4 md:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="hidden md:block"
        >
          <h1 className="text-2xl md:text-3xl font-bold">{t("dashboard.title")}</h1>
        </motion.div>

        <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-4")}>
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              whileHover={{
                y: -4,
                transition: { duration: 0.2, ease: "easeOut" },
              }}
            >
              <Card className="surface-elevated hover:surface-elevated-high transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </motion.div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <motion.div
                    className="text-xl md:text-2xl font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: index * 0.1 + 0.3,
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                    }}
                  >
                    {stat.value}
                  </motion.div>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">{t("dashboard.recentActivity")}</CardTitle>
              <CardDescription className="text-sm">Последние действия в системе</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-24 md:h-32">
                <p className="text-sm md:text-base text-muted-foreground text-center">
                  {stats?.pendingOrders && stats.pendingOrders > 0
                    ? `${stats.pendingOrders} заказов ожидают подтверждения`
                    : t("dashboard.noActivity")}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageWrapper>
  )
}

"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Package, Users, ShoppingCart, DollarSign } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export default function AdminDashboardPage() {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.totalProducts")}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+50 {t("dashboard.sinceLastMonth")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.activeUsers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">567</div>
            <p className="text-xs text-muted-foreground">+20 {t("dashboard.sinceLastWeek")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.pendingOrders")}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.needsAttention")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.totalRevenue")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$15,231.89</div>
            <p className="text-xs text-muted-foreground">+10.1% {t("dashboard.fromLastMonth")}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
          <CardDescription>{t("dashboard.noActivity")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("dashboard.noActivity")}</p>
          {/* Placeholder for activity feed */}
        </CardContent>
      </Card>
    </div>
  )
}

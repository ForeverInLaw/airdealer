"use client"

import * as React from "react"
import { PlusCircle, Users, Ban, CheckCircle, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserDataTable } from "@/components/admin/user-data-table"
import { UserSheet } from "@/components/admin/user-sheet"
import type { User, Location } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase-client"
import { useI18n } from "@/lib/i18n/context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TableSkeleton, StatCardsSkeleton, PageHeaderSkeleton } from "@/components/animations/loading-skeleton"
import { StaggeredFadeIn } from "@/components/animations/staggered-fade-in"
import { motion } from "framer-motion"

export default function UsersPage() {
  const supabase = createClient()
  const { t } = useI18n()
  const [users, setUsers] = React.useState<User[]>([])
  const [locations, setLocations] = React.useState<Location[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      // Добавляем искусственную задержку для демонстрации анимации загрузки
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Fetch users and locations in parallel
      const [usersResponse, locationsResponse] = await Promise.all([
        supabase.from("users").select("*").order("created_at", { ascending: false }),
        supabase.from("locations").select("*").order("name", { ascending: true }),
      ])

      if (usersResponse.error) throw usersResponse.error
      if (locationsResponse.error) throw locationsResponse.error

      setUsers(usersResponse.data || [])
      setLocations(locationsResponse.data || [])
    } catch (error: any) {
      console.error("Error fetching data:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to load data from Supabase.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast, t])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddUser = () => {
    setEditingUser(null)
    setIsSheetOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsSheetOpen(true)
  }

  const handleBlockUser = async (telegramId: number, isBlocked: boolean) => {
    const action = isBlocked ? "unblock" : "block"
    if (!confirm(t(`users.${action}Confirm`))) {
      return
    }

    try {
      const { error } = await supabase.from("users").update({ is_blocked: !isBlocked }).eq("telegram_id", telegramId)

      if (error) throw error

      toast({
        title: t("common.success"),
        description: t(`users.${action}Success`),
      })
      fetchData() // Refresh data
    } catch (error: any) {
      console.error(`Error ${action}ing user:`, error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || `Failed to ${action} user.`,
      })
    }
  }

  const handleDeleteUser = async (telegramId: number) => {
    if (!confirm(t("users.deleteConfirm"))) {
      return
    }

    try {
      const { error } = await supabase.from("users").delete().eq("telegram_id", telegramId)

      if (error) throw error

      toast({ title: t("common.success"), description: t("users.deleteSuccess") })
      fetchData() // Refresh data
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to delete user.",
      })
    }
  }

  const handleSheetSave = () => {
    setIsSheetOpen(false)
    fetchData() // Refresh data after save
  }

  // Calculate statistics
  const totalUsers = users.length
  const blockedUsers = users.filter((u) => u.is_blocked).length
  const activeUsers = totalUsers - blockedUsers
  const newUsersThisMonth = users.filter((u) => {
    const userDate = new Date(u.created_at)
    const now = new Date()
    return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <>
          <PageHeaderSkeleton />
          <StatCardsSkeleton />
          <div className="space-y-4">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <TableSkeleton />
          </div>
        </>
      ) : (
        <>
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              <h1 className="text-2xl font-semibold">{t("users.title")}</h1>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={handleAddUser} size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                {t("users.addUser")}
              </Button>
            </motion.div>
          </motion.div>

          {/* User Statistics with staggered animation */}
          <div className="grid gap-4 md:grid-cols-4">
            <StaggeredFadeIn delay={0.1}>
              {[
                <Card key="total">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("users.totalUsers")}</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="text-2xl font-bold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    >
                      {totalUsers}
                    </motion.div>
                  </CardContent>
                </Card>,
                <Card key="active">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("users.activeUsers")}</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="text-2xl font-bold text-green-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                    >
                      {activeUsers}
                    </motion.div>
                  </CardContent>
                </Card>,
                <Card key="blocked">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("users.blockedUsers")}</CardTitle>
                    <Ban className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="text-2xl font-bold text-red-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                    >
                      {blockedUsers}
                    </motion.div>
                  </CardContent>
                </Card>,
                <Card key="new">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("users.newThisMonth")}</CardTitle>
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="text-2xl font-bold text-blue-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                    >
                      {newUsersThisMonth}
                    </motion.div>
                  </CardContent>
                </Card>,
              ]}
            </StaggeredFadeIn>
          </div>

          {/* Alert for blocked users */}
          {blockedUsers > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0, duration: 0.3 }}
            >
              <Alert>
                <Ban className="h-4 w-4" />
                <AlertDescription>
                  {t("users.blockedUsersAlert").replace("{count}", blockedUsers.toString())}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t("users.manage")}</CardTitle>
                <CardDescription>{t("users.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <UserDataTable
                  data={users}
                  locations={locations}
                  onEdit={handleEditUser}
                  onBlock={handleBlockUser}
                  onDelete={handleDeleteUser}
                />
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      <UserSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        user={editingUser}
        locations={locations}
        onSave={handleSheetSave}
        supabaseClient={supabase}
      />
    </div>
  )
}

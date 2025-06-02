"use client"

import * as React from "react"
import { ShieldCheck, UserCheck, UserX, Clock, Mail, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase-client"
import { useI18n } from "@/lib/i18n/context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TableSkeleton, StatCardsSkeleton, PageHeaderSkeleton } from "@/components/animations/loading-skeleton"
import { StaggeredFadeIn } from "@/components/animations/staggered-fade-in"
import { motion } from "framer-motion"
import { format } from "date-fns"

interface Admin {
  id: number
  user_id: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_approved: boolean
  created_at: string
  updated_at?: string
}

export default function AdminsPage() {
  const supabase = createClient()
  const { t } = useI18n()
  const [admins, setAdmins] = React.useState<Admin[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      // Получаем текущего пользователя
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      const { data, error } = await supabase.from("admins").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setAdmins(data || [])
    } catch (error: any) {
      console.error("Error fetching admins:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to load admins from Supabase.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast, t])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApproveAdmin = async (adminId: number, approve: boolean) => {
    try {
      const { error } = await supabase
        .from("admins")
        .update({
          is_approved: approve,
          updated_at: new Date().toISOString(),
        })
        .eq("id", adminId)

      if (error) throw error

      toast({
        title: t("common.success"),
        description: approve ? "Администратор одобрен" : "Одобрение отозвано",
      })

      fetchData() // Обновляем данные
    } catch (error: any) {
      console.error("Error updating admin:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to update admin status.",
      })
    }
  }

  const handleDeleteAdmin = async (adminId: number, userId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этого администратора?")) {
      return
    }

    try {
      // Сначала удаляем запись администратора
      const { error: adminError } = await supabase.from("admins").delete().eq("id", adminId)

      if (adminError) throw adminError

      // Затем удаляем пользователя из auth
      const { error: userError } = await supabase.auth.admin.deleteUser(userId)

      if (userError) {
        console.warn("Could not delete user from auth:", userError)
        // Не прерываем выполнение, так как запись администратора уже удалена
      }

      toast({
        title: t("common.success"),
        description: "Администратор удален",
      })

      fetchData() // Обновляем данные
    } catch (error: any) {
      console.error("Error deleting admin:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to delete admin.",
      })
    }
  }

  // Статистика
  const totalAdmins = admins.length
  const approvedAdmins = admins.filter((admin) => admin.is_approved).length
  const pendingAdmins = admins.filter((admin) => !admin.is_approved).length

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
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ShieldCheck className="h-6 w-6" />
            <h1 className="text-2xl font-semibold">{t("nav.admins")}</h1>
          </motion.div>

          {/* Статистика администраторов */}
          <div className="grid gap-4 md:grid-cols-3">
            <StaggeredFadeIn delay={0.1}>
              {[
                <Card key="total">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Всего администраторов</CardTitle>
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="text-2xl font-bold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    >
                      {totalAdmins}
                    </motion.div>
                  </CardContent>
                </Card>,
                <Card key="approved">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Одобренные</CardTitle>
                    <UserCheck className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="text-2xl font-bold text-green-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    >
                      {approvedAdmins}
                    </motion.div>
                  </CardContent>
                </Card>,
                <Card key="pending">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ожидают одобрения</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="text-2xl font-bold text-yellow-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                    >
                      {pendingAdmins}
                    </motion.div>
                  </CardContent>
                </Card>,
              ]}
            </StaggeredFadeIn>
          </div>

          {/* Предупреждение о ожидающих одобрения */}
          {pendingAdmins > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
            >
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>У вас {pendingAdmins} администратор(ов) ожидают одобрения.</AlertDescription>
              </Alert>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t("admins.manage")}</CardTitle>
                <CardDescription>
                  Управление администраторами системы. Одобряйте новых администраторов и управляйте доступом.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {admins.map((admin, index) => (
                    <motion.div
                      key={admin.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">
                              {admin.first_name} {admin.last_name}
                            </h3>
                            {admin.user_id === currentUserId && (
                              <Badge variant="outline" className="text-xs">
                                Вы
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {admin.email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Зарегистрирован: {format(new Date(admin.created_at), "dd.MM.yyyy HH:mm")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={admin.is_approved ? "default" : "secondary"}>
                          {admin.is_approved ? "Одобрен" : "Ожидает"}
                        </Badge>

                        {admin.user_id !== currentUserId && (
                          <div className="flex gap-1">
                            {admin.is_approved ? (
                              <Button size="sm" variant="outline" onClick={() => handleApproveAdmin(admin.id, false)}>
                                <UserX className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button size="sm" onClick={() => handleApproveAdmin(admin.id, true)}>
                                <UserCheck className="w-4 h-4" />
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteAdmin(admin.id, admin.user_id)}
                            >
                              Удалить
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {admins.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">Администраторы не найдены.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  )
}

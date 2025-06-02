"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle, LogOut, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AccessDeniedPage() {
  const [userStatus, setUserStatus] = useState<"loading" | "not-admin" | "pending" | "denied">("loading")
  const [userInfo, setUserInfo] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUserStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/")
        return
      }

      // Проверяем статус администратора
      const { data: adminData, error } = await supabase.from("admins").select("*").eq("user_id", user.id).single()

      if (error || !adminData) {
        setUserStatus("not-admin")
      } else if (!adminData.is_approved) {
        setUserStatus("pending")
        setUserInfo(adminData)
      } else {
        // Если пользователь одобрен, перенаправляем в админку
        router.push("/admin")
      }
    }

    checkUserStatus()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const getStatusContent = () => {
    switch (userStatus) {
      case "loading":
        return {
          icon: Clock,
          title: "Проверка доступа...",
          description: "Пожалуйста, подождите",
          variant: "default" as const,
        }
      case "not-admin":
        return {
          icon: AlertTriangle,
          title: "Доступ запрещен",
          description:
            "Вы не зарегистрированы как администратор. Пожалуйста, зарегистрируйтесь через форму регистрации.",
          variant: "destructive" as const,
        }
      case "pending":
        return {
          icon: Clock,
          title: "Ожидание одобрения",
          description: "Ваш аккаунт администратора ожидает одобрения. Пожалуйста, свяжитесь с главным администратором.",
          variant: "default" as const,
        }
      default:
        return {
          icon: AlertTriangle,
          title: "Доступ запрещен",
          description: "У вас нет прав доступа к админ-панели.",
          variant: "destructive" as const,
        }
    }
  }

  const statusContent = getStatusContent()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                statusContent.variant === "destructive"
                  ? "bg-gradient-to-br from-red-500 to-orange-600"
                  : "bg-gradient-to-br from-yellow-500 to-orange-600"
              }`}
            >
              <statusContent.icon className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">{statusContent.title}</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">AirDealer Admin Panel</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert variant={statusContent.variant}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{statusContent.description}</AlertDescription>
            </Alert>

            {userStatus === "pending" && userInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <strong>Email:</strong> {userInfo.email}
                  </p>
                  <p>
                    <strong>Имя:</strong> {userInfo.first_name} {userInfo.last_name}
                  </p>
                  <p>
                    <strong>Дата регистрации:</strong> {new Date(userInfo.created_at).toLocaleDateString("ru-RU")}
                  </p>
                </div>
              </motion.div>
            )}

            <div className="flex flex-col gap-3">
              <Button onClick={handleLogout} variant="outline" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </Button>

              <Button onClick={() => router.push("/")} className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Вернуться к входу
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

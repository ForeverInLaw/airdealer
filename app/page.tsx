"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Shield, UserPlus, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("login")
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Проверяем, аутентифицирован ли пользователь
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        // Проверяем, является ли пользователь одобренным администратором
        const { data: adminData } = await supabase.from("admins").select("is_approved").eq("user_id", user.id).single()

        if (adminData?.is_approved) {
          router.push("/admin")
        }
      }
    }

    checkAuth()
  }, [router, supabase])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Проверяем статус администратора
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("role, is_approved")
          .eq("user_id", data.user.id)
          .single()

        if (adminError || !adminData) {
          setMessage("Вы не зарегистрированы как администратор. Пожалуйста, зарегистрируйтесь.")
          await supabase.auth.signOut()
          return
        }

        if (!adminData.is_approved) {
          setMessage("Ваш аккаунт ожидает одобрения администратора.")
          await supabase.auth.signOut()
          return
        }

        toast({
          title: "Успешный вход",
          description: "Добро пожаловать в админ-панель!",
        })

        router.push("/admin")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      toast({
        variant: "destructive",
        title: "Ошибка входа",
        description: error.message || "Произошла ошибка при входе в систему.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        // Создаем запись администратора (неодобренную)
        const { error: adminError } = await supabase.from("admins").insert([
          {
            user_id: data.user.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            role: "admin",
            is_approved: false,
            created_at: new Date().toISOString(),
          },
        ])

        if (adminError) {
          console.error("Admin creation error:", adminError)
          // Удаляем пользователя, если не удалось создать запись администратора
          await supabase.auth.admin.deleteUser(data.user.id)
          throw new Error("Ошибка при создании записи администратора")
        }

        setMessage("Регистрация успешна! Ваш аккаунт ожидает одобрения администратора.")

        toast({
          title: "Регистрация успешна",
          description: "Ваш аккаунт создан и ожидает одобрения.",
        })

        // Переключаемся на вкладку входа
        setActiveTab("login")
        setEmail("")
        setPassword("")
        setFirstName("")
        setLastName("")
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      toast({
        variant: "destructive",
        title: "Ошибка регистрации",
        description: error.message || "Произошла ошибка при регистрации.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
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
              className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AirDealer Admin
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Панель управления платформой
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Вход
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Регистрация
                </TabsTrigger>
              </TabsList>

              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-4"
                >
                  <Alert>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Пароль</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Вход...
                      </>
                    ) : (
                      "Войти"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">Имя</Label>
                      <Input
                        id="first-name"
                        placeholder="Иван"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Фамилия</Label>
                      <Input
                        id="last-name"
                        placeholder="Иванов"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Пароль</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Регистрация...
                      </>
                    ) : (
                      "Зарегистрироваться"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>Доступ предоставляется только одобренным администраторам</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

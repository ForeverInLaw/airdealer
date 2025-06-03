"use client"

import * as React from "react"
import { ShoppingCart, Clock, CheckCircle, Truck, Package, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OrderDataTable } from "@/components/admin/order-data-table"
import { OrderSheet } from "@/components/admin/order-sheet"
import type { Order } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase-client"
import { useI18n } from "@/lib/i18n/context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TableSkeleton, StatCardsSkeleton, PageHeaderSkeleton } from "@/components/animations/loading-skeleton"
import { StaggeredFadeIn } from "@/components/animations/staggered-fade-in"
import { motion } from "framer-motion"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

// Мемоизированный компонент для предотвращения ненужных перерендеров
const MemoizedOrderDataTable = React.memo(OrderDataTable)

export default function OrdersPage() {
  const supabase = createClient()
  const { t } = useI18n()
  const isMobile = useMobile()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [editingOrder, setEditingOrder] = React.useState<Order | null>(null)
  const [activeTab, setActiveTab] = React.useState("all")
  const { toast } = useToast()

  // Ref для отслеживания позиции прокрутки
  const scrollPositionRef = React.useRef<number>(0)
  const tabContentRef = React.useRef<HTMLDivElement>(null)

  // Устанавливаем CSS для предотвращения прокрутки
  React.useEffect(() => {
    // Отключаем плавную прокрутку глобально
    document.documentElement.style.scrollBehavior = "auto"
    document.body.style.scrollBehavior = "auto"

    return () => {
      document.documentElement.style.scrollBehavior = ""
      document.body.style.scrollBehavior = ""
    }
  }, [])

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          users!inner(telegram_id, language_code),
          order_items(
            id, quantity, price_at_order,
            products(id, name, image_url),
            locations(name)
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error: any) {
      console.error("Error fetching orders:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to load orders from Supabase.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast, t])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleEditOrder = React.useCallback((order: Order) => {
    setEditingOrder(order)
    setIsSheetOpen(true)
  }, [])

  const handleUpdateOrderStatus = React.useCallback(
    async (orderId: number, newStatus: string, adminNotes?: string) => {
      try {
        const updateData: any = { status: newStatus }
        if (adminNotes) {
          updateData.admin_notes = adminNotes
        }

        const { error } = await supabase.from("orders").update(updateData).eq("id", orderId)

        if (error) throw error

        toast({
          title: t("common.success"),
          description: t("orders.statusUpdated"),
        })
        fetchData() // Refresh data
      } catch (error: any) {
        console.error("Error updating order status:", error)
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: error.message || "Failed to update order status.",
        })
      }
    },
    [supabase, toast, t, fetchData],
  )

  const handleSheetSave = React.useCallback(() => {
    setIsSheetOpen(false)
    fetchData() // Refresh data after save
  }, [fetchData])

  // Calculate statistics
  const totalOrders = orders.length
  const pendingOrders = orders.filter((o) => o.status === "pending_admin_approval").length
  const processingOrders = orders.filter((o) =>
    ["admin_approved_pending_payment", "payment_received_processing"].includes(o.status),
  ).length
  const shippedOrders = orders.filter((o) => o.status === "shipped").length
  const completedOrders = orders.filter((o) => o.status === "completed").length
  const cancelledOrders = orders.filter((o) => ["cancelled_by_user", "rejected_by_admin"].includes(o.status)).length

  const totalRevenue = orders
    .filter((o) => ["completed", "delivered"].includes(o.status))
    .reduce((sum, order) => sum + Number.parseFloat(order.total_amount), 0)

  // Мемоизированные отфильтрованные данные
  const filteredData = React.useMemo(() => {
    const filterOrdersByStatus = (status: string[]) => {
      return orders.filter((order) => status.includes(order.status))
    }

    return {
      all: orders,
      pending: filterOrdersByStatus(["pending_admin_approval"]),
      processing: filterOrdersByStatus(["admin_approved_pending_payment", "payment_received_processing"]),
      shipped: filterOrdersByStatus(["shipped"]),
      completed: filterOrdersByStatus(["completed", "delivered"]),
      cancelled: filterOrdersByStatus(["cancelled_by_user", "rejected_by_admin"]),
    }
  }, [orders])

  // Простая функция переключения вкладок без сохранения позиции
  const handleTabChange = React.useCallback((value: string) => {
    setActiveTab(value)
  }, [])

  // Определяем вкладки
  const tabs = React.useMemo(
    () => [
      { id: "all", label: t("orders.all"), count: totalOrders },
      { id: "pending", label: t("orders.pending"), count: pendingOrders },
      { id: "processing", label: t("orders.processing"), count: processingOrders },
      { id: "shipped", label: t("orders.shipped"), count: shippedOrders },
      { id: "completed", label: t("orders.completed"), count: completedOrders },
      { id: "cancelled", label: t("orders.cancelled"), count: cancelledOrders },
    ],
    [t, totalOrders, pendingOrders, processingOrders, shippedOrders, completedOrders, cancelledOrders],
  )

  return (
    <div className="flex flex-col gap-4" style={{ scrollBehavior: "auto" }}>
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
            <ShoppingCart className="h-6 w-6" />
            <h1 className="text-2xl font-semibold">{t("orders.title")}</h1>
          </motion.div>

          {/* Order Statistics with staggered animation */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StaggeredFadeIn delay={0.1}>
              {[
                <Card key="total">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("orders.totalOrders")}</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="text-2xl font-bold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    >
                      {totalOrders}
                    </motion.div>
                  </CardContent>
                </Card>,
                <Card key="pending">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("orders.pending")}</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="text-2xl font-bold text-yellow-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                    >
                      {pendingOrders}
                    </motion.div>
                  </CardContent>
                </Card>,
                <Card key="processing">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("orders.processing")}</CardTitle>
                    <Package className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="text-2xl font-bold text-blue-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                    >
                      {processingOrders}
                    </motion.div>
                  </CardContent>
                </Card>,
                <Card key="shipped">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("orders.shipped")}</CardTitle>
                    <Truck className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="text-2xl font-bold text-purple-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                    >
                      {shippedOrders}
                    </motion.div>
                  </CardContent>
                </Card>,
                <Card key="completed">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("orders.completed")}</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="text-2xl font-bold text-green-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                    >
                      {completedOrders}
                    </motion.div>
                  </CardContent>
                </Card>,
                <Card key="revenue">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("orders.revenue")}</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="text-xl font-bold text-green-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
                    >
                      ${totalRevenue.toFixed(2)}
                    </motion.div>
                  </CardContent>
                </Card>,
              ]}
            </StaggeredFadeIn>
          </div>

          {/* Alert for pending orders */}
          {pendingOrders > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.3 }}
            >
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t("orders.pendingAlert").replace("{count}", pendingOrders.toString())}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t("orders.manage")}</CardTitle>
                <CardDescription>{t("orders.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full">
                  {/* Первый ряд вкладок */}
                  <div
                    className={`grid w-full ${isMobile ? "grid-cols-3" : "grid-cols-6"} gap-2 rounded-lg bg-muted p-1`}
                    style={{ scrollBehavior: "auto" }}
                  >
                    {tabs.slice(0, isMobile ? 3 : 6).map((tab) => (
                      <span
                        key={tab.id}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            handleTabChange(tab.id)
                          }
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          handleTabChange(tab.id)
                        }}
                        className={cn(
                          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all cursor-pointer",
                          "focus:outline-none",
                          activeTab === tab.id
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        style={{
                          touchAction: "manipulation",
                          WebkitTapHighlightColor: "transparent",
                          scrollBehavior: "auto",
                        }}
                      >
                        {isMobile ? tab.label : `${tab.label} (${tab.count})`}
                      </span>
                    ))}
                  </div>

                  {/* Второй ряд вкладок для мобильных */}
                  {isMobile && (
                    <div
                      className="grid w-full grid-cols-3 gap-2 rounded-lg bg-muted p-1 mt-2"
                      style={{ scrollBehavior: "auto" }}
                    >
                      {tabs.slice(3, 6).map((tab) => (
                        <span
                          key={tab.id}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              handleTabChange(tab.id)
                            }
                          }}
                          onClick={(e) => {
                            e.preventDefault()
                            handleTabChange(tab.id)
                          }}
                          className={cn(
                            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all cursor-pointer",
                            "focus:outline-none",
                            activeTab === tab.id
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                          style={{
                            touchAction: "manipulation",
                            WebkitTapHighlightColor: "transparent",
                            scrollBehavior: "auto",
                          }}
                        >
                          {tab.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Содержимое вкладок без анимации */}
                  <div className="mt-4" ref={tabContentRef} style={{ scrollBehavior: "auto" }}>
                    {activeTab === "all" && (
                      <MemoizedOrderDataTable
                        data={filteredData.all}
                        onEdit={handleEditOrder}
                        onUpdateStatus={handleUpdateOrderStatus}
                      />
                    )}
                    {activeTab === "pending" && (
                      <MemoizedOrderDataTable
                        data={filteredData.pending}
                        onEdit={handleEditOrder}
                        onUpdateStatus={handleUpdateOrderStatus}
                      />
                    )}
                    {activeTab === "processing" && (
                      <MemoizedOrderDataTable
                        data={filteredData.processing}
                        onEdit={handleEditOrder}
                        onUpdateStatus={handleUpdateOrderStatus}
                      />
                    )}
                    {activeTab === "shipped" && (
                      <MemoizedOrderDataTable
                        data={filteredData.shipped}
                        onEdit={handleEditOrder}
                        onUpdateStatus={handleUpdateOrderStatus}
                      />
                    )}
                    {activeTab === "completed" && (
                      <MemoizedOrderDataTable
                        data={filteredData.completed}
                        onEdit={handleEditOrder}
                        onUpdateStatus={handleUpdateOrderStatus}
                      />
                    )}
                    {activeTab === "cancelled" && (
                      <MemoizedOrderDataTable
                        data={filteredData.cancelled}
                        onEdit={handleEditOrder}
                        onUpdateStatus={handleUpdateOrderStatus}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      <OrderSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        order={editingOrder}
        onSave={handleSheetSave}
        onUpdateStatus={handleUpdateOrderStatus}
        supabaseClient={supabase}
      />
    </div>
  )
}

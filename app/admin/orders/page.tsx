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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TableSkeleton, StatCardsSkeleton, PageHeaderSkeleton } from "@/components/animations/loading-skeleton"
import { StaggeredFadeIn } from "@/components/animations/staggered-fade-in"
import { motion } from "framer-motion"

export default function OrdersPage() {
  const supabase = createClient()
  const { t } = useI18n()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [editingOrder, setEditingOrder] = React.useState<Order | null>(null)
  const { toast } = useToast()

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

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order)
    setIsSheetOpen(true)
  }

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string, adminNotes?: string) => {
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
  }

  const handleSheetSave = () => {
    setIsSheetOpen(false)
    fetchData() // Refresh data after save
  }

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

  // Filter orders by status for tabs
  const filterOrdersByStatus = (status: string[]) => {
    return orders.filter((order) => status.includes(order.status))
  }

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
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="all">
                      {t("orders.all")} ({totalOrders})
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                      {t("orders.pending")} ({pendingOrders})
                    </TabsTrigger>
                    <TabsTrigger value="processing">
                      {t("orders.processing")} ({processingOrders})
                    </TabsTrigger>
                    <TabsTrigger value="shipped">
                      {t("orders.shipped")} ({shippedOrders})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                      {t("orders.completed")} ({completedOrders})
                    </TabsTrigger>
                    <TabsTrigger value="cancelled">
                      {t("orders.cancelled")} ({cancelledOrders})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    <OrderDataTable data={orders} onEdit={handleEditOrder} onUpdateStatus={handleUpdateOrderStatus} />
                  </TabsContent>

                  <TabsContent value="pending">
                    <OrderDataTable
                      data={filterOrdersByStatus(["pending_admin_approval"])}
                      onEdit={handleEditOrder}
                      onUpdateStatus={handleUpdateOrderStatus}
                    />
                  </TabsContent>

                  <TabsContent value="processing">
                    <OrderDataTable
                      data={filterOrdersByStatus(["admin_approved_pending_payment", "payment_received_processing"])}
                      onEdit={handleEditOrder}
                      onUpdateStatus={handleUpdateOrderStatus}
                    />
                  </TabsContent>

                  <TabsContent value="shipped">
                    <OrderDataTable
                      data={filterOrdersByStatus(["shipped"])}
                      onEdit={handleEditOrder}
                      onUpdateStatus={handleUpdateOrderStatus}
                    />
                  </TabsContent>

                  <TabsContent value="completed">
                    <OrderDataTable
                      data={filterOrdersByStatus(["completed", "delivered"])}
                      onEdit={handleEditOrder}
                      onUpdateStatus={handleUpdateOrderStatus}
                    />
                  </TabsContent>

                  <TabsContent value="cancelled">
                    <OrderDataTable
                      data={filterOrdersByStatus(["cancelled_by_user", "rejected_by_admin"])}
                      onEdit={handleEditOrder}
                      onUpdateStatus={handleUpdateOrderStatus}
                    />
                  </TabsContent>
                </Tabs>
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

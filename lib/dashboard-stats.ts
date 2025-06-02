import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface DashboardStats {
  totalProducts: number
  activeUsers: number
  pendingOrders: number
  totalRevenue: number
  productsChange: string
  usersChange: string
  ordersChange: string
  revenueChange: string
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get total products
    const { count: totalProducts } = await supabase.from("products").select("*", { count: "exact", head: true })

    // Get active users (not blocked)
    const { count: activeUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_blocked", false)

    // Get pending orders
    const { count: pendingOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_admin_approval")

    // Get total revenue from completed orders
    const { data: revenueData } = await supabase
      .from("orders")
      .select("final_total_amount, total_amount")
      .in("status", ["completed", "delivered"])

    const totalRevenue =
      revenueData?.reduce((sum, order) => {
        const amount = Number.parseFloat(order.final_total_amount || order.total_amount || "0")
        return sum + amount
      }, 0) || 0

    // Calculate changes (mock for now - would need historical data)
    const productsChange = "+12"
    const usersChange = "+8"
    const ordersChange = pendingOrders > 5 ? "Требует внимания" : "Стабильно"
    const revenueChange = "+15.2%"

    return {
      totalProducts: totalProducts || 0,
      activeUsers: activeUsers || 0,
      pendingOrders: pendingOrders || 0,
      totalRevenue,
      productsChange,
      usersChange,
      ordersChange,
      revenueChange,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    // Return fallback data
    return {
      totalProducts: 0,
      activeUsers: 0,
      pendingOrders: 0,
      totalRevenue: 0,
      productsChange: "0",
      usersChange: "0",
      ordersChange: "0",
      revenueChange: "0%",
    }
  }
}

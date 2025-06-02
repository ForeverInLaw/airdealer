"use client"

import * as React from "react"
import { PlusCircle, Warehouse, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductStockDataTable } from "@/components/admin/product-stock-data-table"
import { ProductStockSheet } from "@/components/admin/product-stock-sheet"
import type { ProductStock, Product, Location, ProductLocalization } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase-client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useI18n } from "@/lib/i18n/context"
import { TableSkeleton, StatCardsSkeleton, PageHeaderSkeleton } from "@/components/animations/loading-skeleton"
import { StaggeredFadeIn } from "@/components/animations/staggered-fade-in"
import { motion } from "framer-motion"

export default function ProductStockPage() {
  const supabase = createClient()
  const { t } = useI18n()
  const [stocks, setStocks] = React.useState<ProductStock[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [locations, setLocations] = React.useState<Location[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [editingStock, setEditingStock] = React.useState<ProductStock | null>(null)
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      // Добавляем искусственную задержку для демонстрации анимации загрузки
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Fetch stock data with separate queries to avoid relationship conflicts
      const { data: stockData, error: stockError } = await supabase
        .from("product_stock")
        .select("product_id, location_id, quantity, updated_at")
        .order("updated_at", { ascending: false })

      if (stockError) throw stockError

      // Fetch products separately
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          product_localization (
            language_code,
            name,
            description
          )
        `)
        .order("name", { ascending: true })
      if (productsError) throw productsError

      // Fetch locations separately
      const { data: locationsData, error: locationsError } = await supabase
        .from("locations")
        .select("id, name, address")
        .order("name", { ascending: true })
      if (locationsError) throw locationsError

      // Create lookup maps
      const productsMap = new Map()
      productsData?.forEach((p: any) => {
        const enLocalization = p.product_localization?.find((loc: ProductLocalization) => loc.language_code === "en")
        productsMap.set(p.id, {
          ...p,
          display_name: enLocalization?.name || p.name,
          localizations: p.product_localization || [],
        })
      })

      const locationsMap = new Map()
      locationsData?.forEach((l: any) => {
        locationsMap.set(l.id, l)
      })

      // Format stock data for display
      const formattedStocks =
        stockData?.map((s: any) => {
          const product = productsMap.get(s.product_id)
          const location = locationsMap.get(s.location_id)

          return {
            product_id: s.product_id,
            location_id: s.location_id,
            quantity: s.quantity,
            updated_at: s.updated_at,
            product_name: product?.name || "Unknown Product",
            product_display_name: product?.display_name || product?.name || "Unknown Product",
            location_name: location?.name || "Unknown Location",
          }
        }) || []

      // Format products for dropdown
      const formattedProducts = Array.from(productsMap.values())

      setStocks(formattedStocks)
      setProducts(formattedProducts)
      setLocations(locationsData || [])
    } catch (error: any) {
      console.error("Error fetching stock data:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to load stock data from Supabase.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast, t])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddStock = () => {
    setEditingStock(null)
    setIsSheetOpen(true)
  }

  const handleEditStock = (stock: ProductStock) => {
    setEditingStock(stock)
    setIsSheetOpen(true)
  }

  const handleDeleteStock = async (productId: number, locationId: number) => {
    if (!confirm(t("stock.removeConfirm"))) {
      return
    }
    try {
      const { error } = await supabase
        .from("product_stock")
        .delete()
        .match({ product_id: productId, location_id: locationId })
      if (error) throw error
      toast({ title: t("common.success"), description: t("stock.removeSuccess") })
      fetchData() // Refresh data
    } catch (error: any) {
      console.error("Error deleting stock:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to remove stock record.",
      })
    }
  }

  const handleSheetSave = () => {
    setIsSheetOpen(false)
    fetchData() // Refresh data after save
  }

  // Calculate some statistics
  const lowStockItems = stocks.filter((s) => s.quantity > 0 && s.quantity < 10).length
  const outOfStockItems = stocks.filter((s) => s.quantity === 0).length
  const totalStockRecords = stocks.length

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
              <Warehouse className="h-6 w-6" />
              <h1 className="text-2xl font-semibold">{t("stock.title")}</h1>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={handleAddStock} size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                {t("stock.addRecord")}
              </Button>
            </motion.div>
          </motion.div>

          {/* Stock Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
            <StaggeredFadeIn delay={0.1}>
              {[
                <Card key="total">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("stock.totalRecords")}</CardTitle>
                    <Warehouse className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="text-2xl font-bold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    >
                      {totalStockRecords}
                    </motion.div>
                  </CardContent>
                </Card>,
                <Card key="low">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("stock.lowStock")}</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="text-2xl font-bold text-yellow-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    >
                      {lowStockItems}
                    </motion.div>
                    <p className="text-xs text-muted-foreground">{t("stock.quantityLessThan10")}</p>
                  </CardContent>
                </Card>,
                <Card key="out">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("stock.outOfStock")}</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="text-2xl font-bold text-red-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                    >
                      {outOfStockItems}
                    </motion.div>
                    <p className="text-xs text-muted-foreground">{t("stock.quantityEquals0")}</p>
                  </CardContent>
                </Card>,
              ]}
            </StaggeredFadeIn>
          </div>

          {/* Alerts for stock issues */}
          {(lowStockItems > 0 || outOfStockItems > 0) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
            >
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t("stock.alertDescription")
                    .replace("{outOfStock}", outOfStockItems.toString())
                    .replace("{lowStock}", lowStockItems.toString())}
                </AlertDescription>
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
                <CardTitle>{t("stock.manage")}</CardTitle>
                <CardDescription>{t("stock.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductStockDataTable data={stocks} onEdit={handleEditStock} onDelete={handleDeleteStock} />
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      <ProductStockSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        stock={editingStock}
        products={products}
        locations={locations}
        onSave={handleSheetSave}
        supabaseClient={supabase}
      />
    </div>
  )
}

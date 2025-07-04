"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { PlusCircle, Warehouse, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductStockDataTable } from "@/components/admin/product-stock-data-table"
import { ProductStockSheet } from "@/components/admin/product-stock-sheet"
import type { ProductStock, Product, Location, Manufacturer, ProductLocalization } from "@/lib/types"
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
  const router = useRouter()
  const searchParams = useSearchParams()

  const [stocks, setStocks] = React.useState<ProductStock[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [locations, setLocations] = React.useState<Location[]>([])
  const [manufacturers, setManufacturers] = React.useState<Manufacturer[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isInitialLoad, setIsInitialLoad] = React.useState(true)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [editingStock, setEditingStock] = React.useState<ProductStock | null>(null)
  const { toast } = useToast()

  const fetchData = React.useCallback(
    async (filters: { manufacturerId: string | null; locationId: string | null }) => {
      setIsLoading(true)
      try {
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Fetch all reference data for filters and sheets
        const { data: productsData, error: productsError } = await supabase.from("products").select(`id, name, product_localization(language_code, name)`)
        if (productsError) throw productsError

        const { data: locationsData, error: locationsError } = await supabase.from("locations").select("*").order("name")
        if (locationsError) throw locationsError

        const { data: manufacturersData, error: manufacturersError } = await supabase.from("manufacturers").select("*").order("name")
        if (manufacturersError) throw manufacturersError
        
        setLocations(locationsData || [])
        setManufacturers(manufacturersData || [])

        // Create lookup maps for combining data later
        const productsMap = new Map(productsData.map((p: any) => {
            const enLocalization = p.product_localization?.find((loc: ProductLocalization) => loc.language_code === "en")
            return [p.id, { ...p, display_name: enLocalization?.name || p.name }]
        }))
        setProducts(Array.from(productsMap.values()))

        const locationsMap = new Map(locationsData.map((l: any) => [l.id, l]))

        // Build the product_stock query with filters
        let stockQuery = supabase.from("product_stock").select("product_id, location_id, quantity, updated_at")

        if (filters.locationId) {
          stockQuery = stockQuery.eq("location_id", filters.locationId)
        }
        
        // If filtering by manufacturer, we need to get product IDs first
        if (filters.manufacturerId) {
            const { data: manufacturerProducts, error: manProdError } = await supabase
                .from("products")
                .select("id")
                .eq("manufacturer_id", filters.manufacturerId)
            
            if (manProdError) throw manProdError
            
            const productIds = manufacturerProducts.map(p => p.id)
            if (productIds.length > 0) {
                stockQuery = stockQuery.in("product_id", productIds)
            } else {
                // If no products for this manufacturer, no stock records will be found
                setStocks([])
                setIsLoading(false)
                setIsInitialLoad(false)
                return
            }
        }

        const { data: stockData, error: stockError } = await stockQuery.order("updated_at", { ascending: false })
        if (stockError) throw stockError

        // Format stock data for display
        const formattedStocks = stockData?.map((s: any) => {
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

        setStocks(formattedStocks)
      } catch (error: any) {
        console.error("Error fetching stock data:", error)
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: error.message || "Failed to load stock data from Supabase.",
        })
      } finally {
        setIsLoading(false)
        setIsInitialLoad((prev) => prev ? false : prev)
      }
    },
    [supabase, toast, t]
  )

  React.useEffect(() => {
    const manufacturerId = searchParams.get("manufacturer")
    const locationId = searchParams.get("location")
    fetchData({ manufacturerId, locationId })
  }, [searchParams, fetchData])

  const handleAddStock = () => {
    setEditingStock(null)
    setIsSheetOpen(true)
  }

  const handleEditStock = (stock: ProductStock) => {
    setEditingStock(stock)
    setIsSheetOpen(true)
  }

  const handleDeleteStock = async (productId: number, locationId: number) => {
    if (!confirm(t("stock.removeConfirm"))) return
    try {
      const { error } = await supabase.from("product_stock").delete().match({ product_id: productId, location_id: locationId })
      if (error) throw error
      toast({ title: t("common.success"), description: t("stock.removeSuccess") })
      fetchData({ manufacturerId: searchParams.get("manufacturer"), locationId: searchParams.get("location") })
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
    fetchData({ manufacturerId: searchParams.get("manufacturer"), locationId: searchParams.get("location") })
  }

  const handleFilterChange = (type: "manufacturer" | "location", value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete(type)
    } else {
      params.set(type, value)
    }
    router.push(`/admin/product-stock?${params.toString()}`)
  }

  const lowStockItems = stocks.filter((s) => s.quantity > 0 && s.quantity < 10).length
  const outOfStockItems = stocks.filter((s) => s.quantity === 0).length
  const totalStockRecords = stocks.length

  return (
    <div className="flex flex-col gap-4">
      {isInitialLoad ? (
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
                <div className="flex flex-wrap gap-4 pt-4">
                  <Select
                    onValueChange={(value) => handleFilterChange("manufacturer", value)}
                    value={searchParams.get("manufacturer") || "all"}
                  >
                    <SelectTrigger className="w-full sm:w-[240px]">
                      <SelectValue placeholder={t("stock.filter_by_manufacturer")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("stock.all_manufacturers")}</SelectItem>
                      {manufacturers.map((m) => (
                        <SelectItem key={m.id} value={m.id.toString()}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    onValueChange={(value) => handleFilterChange("location", value)}
                    value={searchParams.get("location") || "all"}
                  >
                    <SelectTrigger className="w-full sm:w-[240px]">
                      <SelectValue placeholder={t("stock.filter_by_location")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("stock.all_locations")}</SelectItem>
                      {locations.map((l) => (
                        <SelectItem key={l.id} value={l.id.toString()}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className={isLoading ? "opacity-50 transition-opacity" : ""}>
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

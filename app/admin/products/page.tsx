"use client"

import * as React from "react"
import { PlusCircle, Package } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductDataTable } from "@/components/admin/product-data-table"
import { ProductSheet } from "@/components/admin/product-sheet"
import type { Product, Manufacturer, Category, ProductLocalization } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase-client"
import { useI18n } from "@/lib/i18n/context"
import { TableSkeleton, PageHeaderSkeleton } from "@/components/animations/loading-skeleton"
import { motion } from "framer-motion"

export default function ProductsPage() {
  const supabase = createClient()
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = React.useState<Product[]>([])
  const [manufacturers, setManufacturers] = React.useState<Manufacturer[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isInitialLoad, setIsInitialLoad] = React.useState(true)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null)
  const { toast } = useToast()

  const fetchData = React.useCallback(
    async (manufacturerId: string | null) => {
      setIsLoading(true)
      try {
        // Добавляем искусственную задержку для демонстрации анимации загрузки
        await new Promise((resolve) => setTimeout(resolve, 1000))

        let productsQuery = supabase
          .from("products")
          .select(
            `
          *,
          manufacturers (id, name),
          categories (id, name),
          product_localization (*)
        `
          )
          .order("name", { ascending: true })

        if (manufacturerId) {
          productsQuery = productsQuery.eq("manufacturer_id", manufacturerId)
        }

        const { data: productsData, error: productsError } = await productsQuery

        if (productsError) throw productsError

        const { data: manufacturersData, error: manufacturersError } = await supabase
          .from("manufacturers")
          .select("*")
          .order("name", { ascending: true })
        if (manufacturersError) throw manufacturersError

        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true })
        if (categoriesError) throw categoriesError

        const formattedProducts =
          productsData?.map((p: any) => {
            // Find English localization for table display, or use product's own name
            const enLocalization = p.product_localization?.find((loc: ProductLocalization) => loc.language_code === "en")
            return {
              ...p,
              price: p.price?.toString(),
              cost: p.cost?.toString(),
              manufacturer_name: p.manufacturers?.name || "N/A",
              category_name: p.categories?.name || "N/A",
              manufacturer_id: p.manufacturers?.id,
              category_id: p.categories?.id,
              // Use localized name for display if available, otherwise product.name
              display_name: enLocalization?.name || p.name,
              // Pass all localizations to the sheet
              localizations: p.product_localization || [],
            }
          }) || []

        setProducts(formattedProducts)
        setManufacturers(manufacturersData || [])
        setCategories(categoriesData || [])
      } catch (error: any) {
        console.error("Error fetching data:", error)
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: error.message || "Failed to load data from Supabase.",
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
    fetchData(manufacturerId)
  }, [searchParams, fetchData])

  const handleAddProduct = () => {
    setEditingProduct(null)
    setIsSheetOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setIsSheetOpen(true)
  }

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm(t("products.deleteConfirm"))) return
    try {
      // Deleting from 'products' should cascade to 'product_localization' and 'product_stock'
      // if ON DELETE CASCADE is set up in the database for foreign keys.
      // If not, you might need to delete them manually first or in a transaction.
      const { error } = await supabase.from("products").delete().match({ id: productId })
      if (error) throw error
      toast({ title: t("common.success"), description: t("products.deleteSuccess") })
      fetchData(searchParams.get("manufacturer")) // Refresh data
    } catch (error: any) {
      console.error("Error deleting product:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to delete product.",
      })
    }
  }

  const handleSheetSave = () => {
    setIsSheetOpen(false)
    fetchData(searchParams.get("manufacturer")) // Refresh data after save
  }

  const handleManufacturerChange = (manufacturerId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (manufacturerId === "all") {
      params.delete("manufacturer")
    } else {
      params.set("manufacturer", manufacturerId)
    }
    router.push(`/admin/products?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4">
      {isInitialLoad ? (
        <>
          <PageHeaderSkeleton />
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
              <Package className="h-6 w-6" />
              <h1 className="text-2xl font-semibold">{t("products.title")}</h1>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={handleAddProduct} size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                {t("products.addProduct")}
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t("products.manage")}</CardTitle>
                <CardDescription>{t("products.description")}</CardDescription>
                <div className="pt-2">
                  <Select
                    onValueChange={handleManufacturerChange}
                    value={searchParams.get("manufacturer") || "all"}
                  >
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder={t("products.filter_by_manufacturer")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("products.all_manufacturers")}</SelectItem>
                      {manufacturers.map((manufacturer) => (
                        <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                          {manufacturer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className={isLoading ? "opacity-50 transition-opacity" : ""}>
                <ProductDataTable data={products} onEdit={handleEditProduct} onDelete={handleDeleteProduct} />
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      <ProductSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        product={editingProduct}
        manufacturers={manufacturers}
        categories={categories}
        onSave={handleSheetSave}
        supabaseClient={supabase}
      />
    </div>
  )
}

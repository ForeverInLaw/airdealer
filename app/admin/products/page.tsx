"use client"

import * as React from "react"
import { PlusCircle, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  const [products, setProducts] = React.useState<Product[]>([])
  const [manufacturers, setManufacturers] = React.useState<Manufacturer[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null)
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      // Добавляем искусственную задержку для демонстрации анимации загрузки
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          *,
          manufacturers (id, name),
          categories (id, name),
          product_localization (*)
        `)
        .order("name", { ascending: true })

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
    }
  }, [supabase, toast, t])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

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
      fetchData() // Refresh data
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
    fetchData() // Refresh data after save
  }

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
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
              </CardHeader>
              <CardContent>
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

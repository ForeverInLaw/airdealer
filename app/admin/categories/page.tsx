"use client"

import * as React from "react"
import { PlusCircle, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryDataTable } from "@/components/admin/category-data-table"
import { CategorySheet } from "@/components/admin/category-sheet"
import type { Category } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase-client"
import { useI18n } from "@/lib/i18n/context"
import { TableSkeleton, PageHeaderSkeleton } from "@/components/animations/loading-skeleton"
import { motion } from "framer-motion"

export default function CategoriesPage() {
  const supabase = createClient()
  const { t } = useI18n()
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      // Добавляем искусственную задержку для демонстрации анимации загрузки
      await new Promise((resolve) => setTimeout(resolve, 400))

      const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error: any) {
      console.error("Error fetching categories:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to load categories from Supabase.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast, t])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddCategory = () => {
    setEditingCategory(null)
    setIsSheetOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setIsSheetOpen(true)
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm(t("categories.deleteConfirm"))) {
      return
    }
    try {
      const { error } = await supabase.from("categories").delete().match({ id: categoryId })
      if (error) throw error
      toast({ title: t("common.success"), description: t("categories.deleteSuccess") })
      fetchData() // Refresh data
    } catch (error: any) {
      console.error("Error deleting category:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to delete category.",
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
              <LayoutGrid className="h-6 w-6" />
              <h1 className="text-2xl font-semibold">{t("categories.title")}</h1>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={handleAddCategory} size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                {t("categories.addCategory")}
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
                <CardTitle>{t("categories.manage")}</CardTitle>
                <CardDescription>{t("categories.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryDataTable data={categories} onEdit={handleEditCategory} onDelete={handleDeleteCategory} />
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      <CategorySheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        category={editingCategory}
        onSave={handleSheetSave}
        supabaseClient={supabase}
      />
    </div>
  )
}

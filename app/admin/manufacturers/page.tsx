"use client"

import * as React from "react"
import { PlusCircle, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ManufacturerDataTable } from "@/components/admin/manufacturer-data-table"
import { ManufacturerSheet } from "@/components/admin/manufacturer-sheet"
import type { Manufacturer } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase-client"
import { useI18n } from "@/lib/i18n/context"
import { TableSkeleton, PageHeaderSkeleton } from "@/components/animations/loading-skeleton"
import { motion } from "framer-motion"

export default function ManufacturersPage() {
  const supabase = createClient()
  const { t } = useI18n()
  const [manufacturers, setManufacturers] = React.useState<Manufacturer[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [editingManufacturer, setEditingManufacturer] = React.useState<Manufacturer | null>(null)
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      // Добавляем искусственную задержку для демонстрации анимации загрузки
      await new Promise((resolve) => setTimeout(resolve, 500))

      const { data, error } = await supabase.from("manufacturers").select("*").order("name", { ascending: true })

      if (error) throw error
      setManufacturers(data || [])
    } catch (error: any) {
      console.error("Error fetching manufacturers:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to load manufacturers from Supabase.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast, t])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddManufacturer = () => {
    setEditingManufacturer(null)
    setIsSheetOpen(true)
  }

  const handleEditManufacturer = (manufacturer: Manufacturer) => {
    setEditingManufacturer(manufacturer)
    setIsSheetOpen(true)
  }

  const handleDeleteManufacturer = async (manufacturerId: number) => {
    if (!confirm(t("manufacturers.deleteConfirm"))) {
      return
    }
    try {
      const { error } = await supabase.from("manufacturers").delete().match({ id: manufacturerId })
      if (error) throw error
      toast({ title: t("common.success"), description: t("manufacturers.deleteSuccess") })
      fetchData() // Refresh data
    } catch (error: any) {
      console.error("Error deleting manufacturer:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to delete manufacturer.",
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
              <Building className="h-6 w-6" />
              <h1 className="text-2xl font-semibold">{t("manufacturers.title")}</h1>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={handleAddManufacturer} size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                {t("manufacturers.addManufacturer")}
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
                <CardTitle>{t("manufacturers.manage")}</CardTitle>
                <CardDescription>{t("manufacturers.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ManufacturerDataTable
                  data={manufacturers}
                  onEdit={handleEditManufacturer}
                  onDelete={handleDeleteManufacturer}
                />
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      <ManufacturerSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        manufacturer={editingManufacturer}
        onSave={handleSheetSave}
        supabaseClient={supabase}
      />
    </div>
  )
}

"use client"

import * as React from "react"
import { PlusCircle, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LocationDataTable } from "@/components/admin/location-data-table"
import { LocationSheet } from "@/components/admin/location-sheet"
import type { Location } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase-client"
import { useI18n } from "@/lib/i18n/context"
import { TableSkeleton, PageHeaderSkeleton } from "@/components/animations/loading-skeleton"
import { motion } from "framer-motion"

export default function LocationsPage() {
  const supabase = createClient()
  const { t } = useI18n()
  const [locations, setLocations] = React.useState<Location[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [editingLocation, setEditingLocation] = React.useState<Location | null>(null)
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      // Добавляем искусственную задержку для демонстрации анимации загрузки
      await new Promise((resolve) => setTimeout(resolve, 600))

      const { data, error } = await supabase.from("locations").select("*").order("name", { ascending: true })

      if (error) throw error
      setLocations(data || [])
    } catch (error: any) {
      console.error("Error fetching locations:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to load locations from Supabase.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast, t])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddLocation = () => {
    setEditingLocation(null)
    setIsSheetOpen(true)
  }

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location)
    setIsSheetOpen(true)
  }

  const handleDeleteLocation = async (locationId: number) => {
    if (!confirm(t("locations.deleteConfirm"))) {
      return
    }
    try {
      const { error } = await supabase.from("locations").delete().match({ id: locationId })
      if (error) throw error
      toast({ title: t("common.success"), description: t("locations.deleteSuccess") })
      fetchData() // Refresh data
    } catch (error: any) {
      console.error("Error deleting location:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to delete location.",
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
              <MapPin className="h-6 w-6" />
              <h1 className="text-2xl font-semibold">{t("locations.title")}</h1>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={handleAddLocation} size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                {t("locations.addLocation")}
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
                <CardTitle>{t("locations.manage")}</CardTitle>
                <CardDescription>{t("locations.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <LocationDataTable data={locations} onEdit={handleEditLocation} onDelete={handleDeleteLocation} />
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      <LocationSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        location={editingLocation}
        onSave={handleSheetSave}
        supabaseClient={supabase}
      />
    </div>
  )
}

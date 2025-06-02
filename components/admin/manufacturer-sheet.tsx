"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Manufacturer } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import type { SupabaseClient } from "@supabase/supabase-js"
import { useI18n } from "@/lib/i18n/context"

interface ManufacturerSheetProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  manufacturer: Manufacturer | null
  onSave: () => void
  supabaseClient: SupabaseClient
}

export function ManufacturerSheet({
  isOpen,
  onOpenChange,
  manufacturer,
  onSave,
  supabaseClient,
}: ManufacturerSheetProps) {
  const { toast } = useToast()
  const [formData, setFormData] = React.useState<Partial<Manufacturer>>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const { t } = useI18n()

  React.useEffect(() => {
    if (manufacturer) {
      setFormData({ ...manufacturer })
    } else {
      setFormData({ name: "" })
    }
  }, [manufacturer, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!formData.name) {
      toast({ variant: "destructive", title: t("error"), description: t("manufacturers.name_required") })
      setIsLoading(false)
      return
    }

    const manufacturerDataToSave = {
      name: formData.name,
      // Supabase handles created_at and updated_at automatically
    }

    try {
      let error: any
      if (manufacturer && manufacturer.id) {
        // Update existing manufacturer
        const { error: updateError } = await supabaseClient
          .from("manufacturers")
          .update(manufacturerDataToSave)
          .match({ id: manufacturer.id })
        error = updateError
      } else {
        // Create new manufacturer
        const { error: insertError } = await supabaseClient.from("manufacturers").insert([manufacturerDataToSave])
        error = insertError
      }

      if (error) throw error

      toast({
        title: t("success"),
        description: t(manufacturer ? "manufacturers.updated_successfully" : "manufacturers.created_successfully"),
      })
      onSave()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving manufacturer:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message || t("manufacturers.failed_to_save"),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-[90vw]">
        <SheetHeader>
          <SheetTitle>
            {manufacturer ? t("manufacturers.edit_manufacturer") : t("manufacturers.add_new_manufacturer")}
          </SheetTitle>
          <SheetDescription>
            {manufacturer
              ? t("manufacturers.update_manufacturer_details")
              : t("manufacturers.fill_manufacturer_details")}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right col-span-1">
              {t("name")}
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                {t("cancel")}
              </Button>
            </SheetClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? manufacturer
                  ? t("saving") + "..."
                  : t("creating") + "..."
                : manufacturer
                  ? t("save_changes")
                  : t("create_manufacturer")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

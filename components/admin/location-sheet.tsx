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
import { Textarea } from "@/components/ui/textarea"
import type { Location } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import type { SupabaseClient } from "@supabase/supabase-js"
import { useI18n } from "@/lib/i18n/context"

interface LocationSheetProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  location: Location | null
  onSave: () => void
  supabaseClient: SupabaseClient
}

export function LocationSheet({ isOpen, onOpenChange, location, onSave, supabaseClient }: LocationSheetProps) {
  const { toast } = useToast()
  const [formData, setFormData] = React.useState<Partial<Location>>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const { t } = useI18n()

  React.useEffect(() => {
    if (location) {
      setFormData({ ...location })
    } else {
      setFormData({ name: "", address: "" })
    }
  }, [location, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!formData.name) {
      toast({ variant: "destructive", title: t("error"), description: t("locations.name_required") })
      setIsLoading(false)
      return
    }

    const locationDataToSave = {
      name: formData.name,
      address: formData.address || null, // Address is optional
    }

    try {
      let error: any
      if (location && location.id) {
        // Update existing location
        const { error: updateError } = await supabaseClient
          .from("locations")
          .update(locationDataToSave)
          .match({ id: location.id })
        error = updateError
      } else {
        // Create new location
        const { error: insertError } = await supabaseClient.from("locations").insert([locationDataToSave])
        error = insertError
      }

      if (error) throw error

      toast({
        title: t("success"),
        description: t(location ? "locations.updated_successfully" : "locations.created_successfully"),
      })
      onSave()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving location:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message || t("locations.failed_to_save"),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-[90vw]">
        <SheetHeader>
          <SheetTitle>{location ? t("locations.edit_location") : t("locations.add_new_location")}</SheetTitle>
          <SheetDescription>{location ? t("locations.update_details") : t("locations.fill_details")}</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right col-span-1">
              {t("locations.name")}
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
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="address" className="text-right col-span-1 pt-2">
              {t("locations.address")}
            </Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              className="col-span-3 min-h-[100px]"
              placeholder={t("locations.enter_full_address")}
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
                ? location
                  ? t("saving")
                  : t("creating")
                : location
                  ? t("save_changes")
                  : t("create_location")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

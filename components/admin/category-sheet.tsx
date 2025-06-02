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
import type { Category } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import type { SupabaseClient } from "@supabase/supabase-js"
import { useI18n } from "@/lib/i18n/context"

interface CategorySheetProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  category: Category | null
  onSave: () => void
  supabaseClient: SupabaseClient
}

export function CategorySheet({ isOpen, onOpenChange, category, onSave, supabaseClient }: CategorySheetProps) {
  const { toast } = useToast()
  const [formData, setFormData] = React.useState<Partial<Category>>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const { t } = useI18n()

  React.useEffect(() => {
    if (category) {
      setFormData({ ...category })
    } else {
      setFormData({ name: "" })
    }
  }, [category, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!formData.name) {
      toast({ variant: "destructive", title: t("common.error"), description: t("categories.nameRequired") })
      setIsLoading(false)
      return
    }

    const categoryDataToSave = {
      name: formData.name,
      // Supabase handles created_at and updated_at automatically
    }

    try {
      let error: any
      if (category && category.id) {
        // Update existing category
        const { error: updateError } = await supabaseClient
          .from("categories")
          .update(categoryDataToSave)
          .match({ id: category.id })
        error = updateError
      } else {
        // Create new category
        const { error: insertError } = await supabaseClient.from("categories").insert([categoryDataToSave])
        error = insertError
      }

      if (error) throw error

      toast({
        title: t("common.success"),
        description: `Category ${category ? "updated" : "created"} successfully.`,
      })
      onSave()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving category:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to save category.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-[90vw]">
        <SheetHeader>
          <SheetTitle>{t("categories.editCategory")}</SheetTitle>
          <SheetDescription>{t("categories.updateDetails")}</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right col-span-1">
              {t("categories.name")}
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
                {t("action.cancel")}
              </Button>
            </SheetClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? category
                  ? t("categories.saving")
                  : t("categories.creating")
                : category
                  ? t("action.saveChanges")
                  : t("categories.createCategory")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

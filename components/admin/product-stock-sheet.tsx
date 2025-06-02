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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProductStock, Product, Location } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import type { SupabaseClient } from "@supabase/supabase-js"
import { useI18n } from "@/lib/i18n/context"

interface ProductStockSheetProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  stock: ProductStock | null
  products: Product[]
  locations: Location[]
  onSave: () => void
  supabaseClient: SupabaseClient
}

export function ProductStockSheet({
  isOpen,
  onOpenChange,
  stock,
  products,
  locations,
  onSave,
  supabaseClient,
}: ProductStockSheetProps) {
  const { toast } = useToast()
  const [formData, setFormData] = React.useState<Partial<ProductStock>>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const { t } = useI18n()

  React.useEffect(() => {
    if (stock) {
      setFormData({ ...stock })
    } else {
      setFormData({
        product_id: undefined,
        location_id: undefined,
        quantity: 0,
      })
    }
  }, [stock, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: name === "quantity" ? Number.parseInt(value) || 0 : value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: Number.parseInt(value) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!formData.product_id || !formData.location_id || formData.quantity === undefined) {
      toast({ variant: "destructive", title: t("common.error"), description: t("stock.fillRequired") })
      setIsLoading(false)
      return
    }

    if (formData.quantity < 0) {
      toast({ variant: "destructive", title: t("common.error"), description: t("stock.quantityNegative") })
      setIsLoading(false)
      return
    }

    const stockDataToSave = {
      product_id: formData.product_id,
      location_id: formData.location_id,
      quantity: formData.quantity,
    }

    try {
      let error: any
      if (stock) {
        // Update existing stock record
        const { error: updateError } = await supabaseClient
          .from("product_stock")
          .update({ quantity: stockDataToSave.quantity })
          .match({ product_id: stock.product_id, location_id: stock.location_id })
        error = updateError
      } else {
        // Create new stock record (upsert to handle duplicates)
        const { error: upsertError } = await supabaseClient
          .from("product_stock")
          .upsert([stockDataToSave], { onConflict: "product_id, location_id" })
        error = upsertError
      }

      if (error) throw error

      toast({
        title: t("common.success"),
        description: `Stock ${stock ? "updated" : "created"} successfully.`,
      })
      onSave()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving stock:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to save stock record.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-[90vw]">
        <SheetHeader>
          <SheetTitle>{stock ? t("stock.editQuantity") : t("stock.addNew")}</SheetTitle>
          <SheetDescription>{stock ? t("stock.updateQuantity") : t("stock.addInfo")}</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product_id" className="text-right col-span-1">
              {t("stock.product")}
            </Label>
            <Select
              name="product_id"
              value={formData.product_id?.toString()}
              onValueChange={(value) => handleSelectChange("product_id", value)}
              required
              disabled={!!stock} // Disable when editing existing stock
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t("stock.selectProduct")} />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location_id" className="text-right col-span-1">
              {t("stock.location")}
            </Label>
            <Select
              name="location_id"
              value={formData.location_id?.toString()}
              onValueChange={(value) => handleSelectChange("location_id", value)}
              required
              disabled={!!stock} // Disable when editing existing stock
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t("stock.selectLocation")} />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id.toString()}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right col-span-1">
              {t("stock.quantity")}
            </Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              value={formData.quantity || 0}
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
                ? stock
                  ? t("stock.updating")
                  : t("stock.creating")
                : stock
                  ? t("stock.updateQuantityBtn")
                  : t("stock.addRecordBtn")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

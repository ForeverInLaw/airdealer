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
import type { Product, Manufacturer, Category, ProductLocalization } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Textarea } from "@/components/ui/textarea"
import { useI18n } from "@/lib/i18n/context"

interface ProductSheetProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  product: Product | null
  manufacturers: Manufacturer[]
  categories: Category[]
  onSave: () => void
  supabaseClient: SupabaseClient
}

type LocalizationFormData = {
  name: string
  description: string
}

export function ProductSheet({
  isOpen,
  onOpenChange,
  product,
  manufacturers,
  categories,
  onSave,
  supabaseClient,
}: ProductSheetProps) {
  const { toast } = useToast()
  const { t } = useI18n()
  const [formData, setFormData] = React.useState<Partial<Product>>({})
  const [isLoading, setIsLoading] = React.useState(false)

  // State for localizations
  const [enLocalization, setEnLocalization] = React.useState<LocalizationFormData>({ name: "", description: "" })
  const [ruLocalization, setRuLocalization] = React.useState<LocalizationFormData>({ name: "", description: "" })
  const [plLocalization, setPlLocalization] = React.useState<LocalizationFormData>({ name: "", description: "" })

  React.useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        price: product.price?.toString(),
        cost: product.cost?.toString(),
      })
      // Populate localization fields from product.localizations
      const findLoc = (langCode: string) => product.localizations?.find((loc) => loc.language_code === langCode)
      setEnLocalization({
        name: findLoc("en")?.name || product.name || "",
        description: findLoc("en")?.description || "",
      })
      setRuLocalization({ name: findLoc("ru")?.name || "", description: findLoc("ru")?.description || "" })
      setPlLocalization({ name: findLoc("pl")?.name || "", description: findLoc("pl")?.description || "" })
    } else {
      // New product
      setFormData({
        name: "",
        manufacturer_id: undefined,
        category_id: undefined,
        image_url: "",
        variation: "",
        price: "0.00",
        cost: "0.00",
      })
      setEnLocalization({ name: "", description: "" })
      setRuLocalization({ name: "", description: "" })
      setPlLocalization({ name: "", description: "" })
    }
  }, [product, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value ? Number.parseInt(value) : undefined })
  }

  const handleLocalizationChange = (lang: "en" | "ru" | "pl", field: "name" | "description", value: string) => {
    const setter = lang === "en" ? setEnLocalization : lang === "ru" ? setRuLocalization : setPlLocalization
    setter((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!formData.name?.trim()) {
      toast({ variant: "destructive", title: t("error"), description: t("products.name_required") })
      setIsLoading(false)
      return
    }
    if (!enLocalization.name.trim() && !ruLocalization.name.trim() && !plLocalization.name.trim()) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("localization.at_least_one_name_required"),
      })
      setIsLoading(false)
      return
    }

    const priceAsNumber = Number.parseFloat(formData.price as string)
    const costAsNumber = Number.parseFloat(formData.cost as string)

    if (isNaN(priceAsNumber) || isNaN(costAsNumber)) {
      toast({ variant: "destructive", title: t("error"), description: t("products.price_cost_valid_numbers") })
      setIsLoading(false)
      return
    }

    const productDataToSave = {
      name: formData.name, // This is the products.name field
      manufacturer_id: formData.manufacturer_id,
      category_id: formData.category_id,
      price: priceAsNumber,
      cost: costAsNumber,
      image_url: formData.image_url || null,
      variation: formData.variation || null,
    }

    try {
      let productIdToUse: number
      let mainProductError: any = null

      if (product && product.id) {
        // Editing existing product
        productIdToUse = product.id
        const { error } = await supabaseClient.from("products").update(productDataToSave).match({ id: productIdToUse })
        mainProductError = error
      } else {
        // Creating new product
        const { data: newProductData, error } = await supabaseClient
          .from("products")
          .insert([productDataToSave])
          .select()
          .single()
        if (error || !newProductData) {
          mainProductError = error || new Error("Failed to create product or retrieve its ID.")
        } else {
          productIdToUse = newProductData.id
        }
      }

      if (mainProductError) throw mainProductError

      // Prepare localization data
      const localizationsToUpsert: Omit<ProductLocalization, "product_id">[] = []
      if (enLocalization.name.trim()) localizationsToUpsert.push({ language_code: "en", ...enLocalization })
      if (ruLocalization.name.trim()) localizationsToUpsert.push({ language_code: "ru", ...ruLocalization })
      if (plLocalization.name.trim()) localizationsToUpsert.push({ language_code: "pl", ...plLocalization })

      const finalLocalizationPayload = localizationsToUpsert.map((loc) => ({
        product_id: productIdToUse,
        language_code: loc.language_code,
        name: loc.name,
        description: loc.description.trim() ? loc.description.trim() : null,
      }))

      if (finalLocalizationPayload.length > 0) {
        const { error: localizationError } = await supabaseClient
          .from("product_localization")
          .upsert(finalLocalizationPayload, { onConflict: "product_id, language_code" })

        if (localizationError) {
          throw new Error(
            `${t("products.product")} ${product ? t("products.updated") : t("products.created")}, ${t(
              "localization.failed_to_save",
            )}: ${localizationError.message}`,
          )
        }
      }

      toast({
        title: t("success"),
        description: `${t("products.product")} ${product ? t("products.updated") : t("products.created")} ${t(
          "products.successfully_with_localizations",
        )}.`,
      })
      onSave()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving product and localizations:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message || t("products.failed_to_save_product_and_localizations"),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderLocalizationFields = (
    langCode: "en" | "ru" | "pl",
    langName: string,
    data: LocalizationFormData,
    setter: (field: "name" | "description", value: string) => void,
  ) => (
    <div className="col-span-4 border-t pt-4 mt-4">
      <h4 className="text-md font-medium mb-3">
        {t("localization.localization")} ({langName})
      </h4>
      <div className="grid grid-cols-4 items-center gap-x-4 gap-y-3">
        <Label htmlFor={`${langCode}Name`} className="text-right col-span-4 sm:col-span-1">
          {t("localization.name")} ({langName})
        </Label>
        <Input
          id={`${langCode}Name`}
          name={`${langCode}Name`}
          value={data.name}
          onChange={(e) => setter("name", e.target.value)}
          className="col-span-4 sm:col-span-3"
          placeholder={`${t("localization.product_name_in")} ${langName}`}
        />
        <Label htmlFor={`${langCode}Description`} className="text-right col-span-4 sm:col-span-1 pt-2">
          {t("localization.description")} ({langName})
        </Label>
        <Textarea
          id={`${langCode}Description`}
          name={`${langCode}Description`}
          value={data.description}
          onChange={(e) => setter("description", e.target.value)}
          className="col-span-4 sm:col-span-3 min-h-[80px]"
          placeholder={`${t("localization.product_description_in")} ${langName} (${t("optional")})`}
        />
      </div>
    </div>
  )

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-[95vw] md:w-[80vw] lg:w-[60vw] xl:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{product ? t("products.edit_product") : t("products.add_new_product")}</SheetTitle>
          <SheetDescription>
            {product
              ? t("products.update_product_details_and_localizations")
              : t("products.fill_in_product_details_and_localizations")}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="grid gap-y-3 py-4">
          {/* Main Product Fields */}
          <div className="grid grid-cols-4 items-center gap-x-4 gap-y-3">
            <Label htmlFor="name" className="text-right col-span-4 sm:col-span-1">
              {t("products.internal_fallback_name")}
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              className="col-span-4 sm:col-span-3"
              required
              placeholder={t("products.sku_or_primary_name")}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-x-4 gap-y-3">
            <Label htmlFor="manufacturer_id" className="text-right col-span-4 sm:col-span-1">
              {t("products.manufacturer")}
            </Label>
            <Select
              name="manufacturer_id"
              value={formData.manufacturer_id?.toString()}
              onValueChange={(value) => handleSelectChange("manufacturer_id", value)}
              required
            >
              <SelectTrigger className="col-span-4 sm:col-span-3">
                <SelectValue placeholder={t("products.select_manufacturer")} />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map((m) => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-x-4 gap-y-3">
            <Label htmlFor="category_id" className="text-right col-span-4 sm:col-span-1">
              {t("products.category")}
            </Label>
            <Select
              name="category_id"
              value={formData.category_id?.toString()}
              onValueChange={(value) => handleSelectChange("category_id", value)}
              required
            >
              <SelectTrigger className="col-span-4 sm:col-span-3">
                <SelectValue placeholder={t("products.select_category")} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-x-4 gap-y-3">
            <Label htmlFor="price" className="text-right col-span-4 sm:col-span-1">
              {t("products.price")}
            </Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price || ""}
              onChange={handleChange}
              className="col-span-4 sm:col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-x-4 gap-y-3">
            <Label htmlFor="cost" className="text-right col-span-4 sm:col-span-1">
              {t("products.cost")}
            </Label>
            <Input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              value={formData.cost || ""}
              onChange={handleChange}
              className="col-span-4 sm:col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-x-4 gap-y-3">
            <Label htmlFor="image_url" className="text-right col-span-4 sm:col-span-1">
              {t("products.image_url")}
            </Label>
            <Input
              id="image_url"
              name="image_url"
              value={formData.image_url || ""}
              onChange={handleChange}
              className="col-span-4 sm:col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-x-4 gap-y-3">
            <Label htmlFor="variation" className="text-right col-span-4 sm:col-span-1">
              {t("products.variation")}
            </Label>
            <Input
              id="variation"
              name="variation"
              value={formData.variation || ""}
              onChange={handleChange}
              className="col-span-4 sm:col-span-3"
            />
          </div>

          {/* Localization Fields */}
          {renderLocalizationFields("en", "English", enLocalization, (field, value) =>
            handleLocalizationChange("en", field, value),
          )}
          {renderLocalizationFields("ru", "Russian", ruLocalization, (field, value) =>
            handleLocalizationChange("ru", field, value),
          )}
          {renderLocalizationFields("pl", "Polish", plLocalization, (field, value) =>
            handleLocalizationChange("pl", field, value),
          )}

          <SheetFooter className="mt-6 col-span-4">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                {t("cancel")}
              </Button>
            </SheetClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? product
                  ? t("saving") + "..."
                  : t("creating") + "..."
                : product
                  ? t("save_changes")
                  : t("create_product")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

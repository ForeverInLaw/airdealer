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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { User, Location } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import type { SupabaseClient } from "@supabase/supabase-js"
import { useI18n } from "@/lib/i18n/context"

interface UserSheetProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  user: User | null
  onSave: () => void
  supabaseClient: SupabaseClient
  locations: Location[]
}

export function UserSheet({ isOpen, onOpenChange, user, onSave, supabaseClient, locations }: UserSheetProps) {
  const { toast } = useToast()
  const { t } = useI18n()
  const [formData, setFormData] = React.useState<Partial<User>>({})
  const [message, setMessage] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (user) {
      setFormData({ ...user })
    } else {
      setFormData({
        telegram_id: undefined,
        language_code: "en",
        is_blocked: false,
        selected_location_id: null,
        first_name: "",
        last_name: "",
        username: "",
      })
    }
    setMessage("")
  }, [user, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: name === "telegram_id" ? Number(value) : value })
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === "selected_location_id") {
      setFormData({ ...formData, [name]: value ? Number(value) : null })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked })
  }

  const handleSendMessage = async () => {
    if (!user || !message.trim()) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("users.messageRequired"),
      })
      return
    }

    setIsLoading(true)
    try {
      // Here you would integrate with your Telegram bot API to send message
      // For now, we'll just simulate the action
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: t("common.success"),
        description: t("users.messageSent"),
      })
      setMessage("")
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to send message.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!formData.telegram_id) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("users.telegramIdRequired"),
      })
      setIsLoading(false)
      return
    }

    const userDataToSave = {
      telegram_id: formData.telegram_id,
      language_code: formData.language_code || "en",
      is_blocked: formData.is_blocked || false,
      selected_location_id: formData.selected_location_id,
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      username: formData.username || null,
    }

    try {
      let error: any
      if (user) {
        // Update existing user
        const { error: updateError } = await supabaseClient
          .from("users")
          .update({
            language_code: userDataToSave.language_code,
            is_blocked: userDataToSave.is_blocked,
            selected_location_id: userDataToSave.selected_location_id,
            first_name: userDataToSave.first_name,
            last_name: userDataToSave.last_name,
            username: userDataToSave.username,
          })
          .eq("telegram_id", user.telegram_id)
        error = updateError
      } else {
        // Create new user
        const { error: insertError } = await supabaseClient.from("users").insert([userDataToSave])
        error = insertError
      }

      if (error) throw error

      toast({
        title: t("common.success"),
        description: t(user ? "users.updateSuccess" : "users.createSuccess"),
      })
      onSave()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving user:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Failed to save user.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getLocationName = (locationId: number | null) => {
    if (!locationId) return t("users.noLocationSelected")
    const location = locations.find((l) => l.id === locationId)
    return location?.name || t("users.unknownLocation")
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-[90vw] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{user ? t("users.editUser") : t("users.addUser")}</SheetTitle>
          <SheetDescription>{user ? t("users.editUserDescription") : t("users.addUserDescription")}</SheetDescription>
        </SheetHeader>

        {user ? (
          // User details and message sending form for existing user
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right col-span-1">{t("users.telegramId")}</Label>
              <div className="col-span-3 font-mono text-sm">{user.telegram_id}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right col-span-1">{t("users.fullName")}</Label>
              <div className="col-span-3">
                {user.first_name || user.last_name
                  ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                  : t("users.noName")}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right col-span-1">{t("users.username")}</Label>
              <div className="col-span-3">{user.username ? `@${user.username}` : t("users.noUsername")}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right col-span-1">{t("users.language")}</Label>
              <div className="col-span-3">{user.language_code}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right col-span-1">{t("users.selectedLocation")}</Label>
              <div className="col-span-3">{getLocationName(user.selected_location_id)}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right col-span-1">{t("users.status")}</Label>
              <div className="col-span-3">{user.is_blocked ? t("users.blocked") : t("users.active")}</div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="message" className="text-right col-span-1 pt-2">
                {t("users.message")}
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="col-span-3 min-h-[100px]"
                placeholder={t("users.messagePlaceholder")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  {t("action.cancel")}
                </Button>
              </SheetClose>
              <Button onClick={handleSendMessage} disabled={isLoading || !message.trim()}>
                {isLoading ? t("users.sending") : t("users.sendMessage")}
              </Button>
            </div>
          </div>
        ) : (
          // User creation/editing form
          <form onSubmit={handleSubmit} className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telegram_id" className="text-right col-span-1">
                {t("users.telegramId")}
              </Label>
              <Input
                id="telegram_id"
                name="telegram_id"
                type="number"
                value={formData.telegram_id || ""}
                onChange={handleChange}
                className="col-span-3"
                required
                disabled={!!user}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="first_name" className="text-right col-span-1">
                {t("users.firstName")}
              </Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name || ""}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="last_name" className="text-right col-span-1">
                {t("users.lastName")}
              </Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name || ""}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right col-span-1">
                {t("users.username")}
              </Label>
              <Input
                id="username"
                name="username"
                value={formData.username || ""}
                onChange={handleChange}
                className="col-span-3"
                placeholder={t("users.usernamePlaceholder")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="language_code" className="text-right col-span-1">
                {t("users.language")}
              </Label>
              <Select
                name="language_code"
                value={formData.language_code}
                onValueChange={(value) => handleSelectChange("language_code", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t("users.selectLanguage")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="pl">Polski</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="selected_location_id" className="text-right col-span-1">
                {t("users.selectedLocation")}
              </Label>
              <Select
                name="selected_location_id"
                value={formData.selected_location_id?.toString() || ""}
                onValueChange={(value) => handleSelectChange("selected_location_id", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t("users.selectLocation")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("users.noLocationSelected")}</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_blocked" className="text-right col-span-1">
                {t("users.blocked")}
              </Label>
              <Switch
                id="is_blocked"
                checked={formData.is_blocked || false}
                onCheckedChange={(checked) => handleSwitchChange("is_blocked", checked)}
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
                  ? user
                    ? t("users.updating")
                    : t("users.creating")
                  : user
                    ? t("action.saveChanges")
                    : t("users.createUser")}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}

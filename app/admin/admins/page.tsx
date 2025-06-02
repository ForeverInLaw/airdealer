"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ShieldCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export default function AdminsPage() {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6" />
        <h1 className="text-2xl font-semibold">{t("nav.admins")}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("admins.manage")}</CardTitle>
          <CardDescription>{t("admins.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("admins.interfaceWillBeHere")}</p>
        </CardContent>
      </Card>
    </div>
  )
}

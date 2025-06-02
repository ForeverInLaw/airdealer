"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Languages } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export default function InterfaceTextsPage() {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Languages className="h-6 w-6" />
        <h1 className="text-2xl font-semibold">{t("nav.interfaceTexts")}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("interfaceTexts.manage")}</CardTitle>
          <CardDescription>{t("interfaceTexts.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("interfaceTexts.interfaceWillBeHere")}</p>
        </CardContent>
      </Card>
    </div>
  )
}

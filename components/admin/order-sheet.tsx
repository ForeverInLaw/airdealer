"use client"

import * as React from "react"
import Image from "next/image"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Order } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import type { SupabaseClient } from "@supabase/supabase-js"
import { useI18n } from "@/lib/i18n/context"
import { format } from "date-fns"

interface OrderSheetProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  order: Order | null
  onSave: () => void
  onUpdateStatus: (orderId: number, newStatus: string, adminNotes?: string) => void
  supabaseClient: SupabaseClient
}

export function OrderSheet({ isOpen, onOpenChange, order, onSave, onUpdateStatus, supabaseClient }: OrderSheetProps) {
  const { toast } = useToast()
  const { t } = useI18n()
  const [adminNotes, setAdminNotes] = React.useState("")
  const [newStatus, setNewStatus] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (order) {
      setAdminNotes(order.admin_notes || "")
      setNewStatus(order.status)
    } else {
      setAdminNotes("")
      setNewStatus("")
    }
  }, [order, isOpen])

  const getAvailableStatusTransitions = (currentStatus: string) => {
    const transitions: Record<string, { value: string; label: string }[]> = {
      pending_admin_approval: [
        { value: "admin_approved_pending_payment", label: t("orders.statusPendingPayment") },
        { value: "rejected_by_admin", label: t("orders.statusRejectedByAdmin") },
      ],
      admin_approved_pending_payment: [
        { value: "payment_received_processing", label: t("orders.statusProcessing") },
        { value: "cancelled_by_user", label: t("orders.statusCancelledByUser") },
      ],
      payment_received_processing: [
        { value: "shipped", label: t("orders.statusShipped") },
        { value: "cancelled_by_user", label: t("orders.statusCancelledByUser") },
      ],
      shipped: [{ value: "delivered", label: t("orders.statusDelivered") }],
      delivered: [{ value: "completed", label: t("orders.statusCompleted") }],
    }

    return transitions[currentStatus] || []
  }

  const handleUpdateStatus = async () => {
    if (!order || newStatus === order.status) return

    setIsLoading(true)
    try {
      await onUpdateStatus(order.id, newStatus, adminNotes)
      onSave()
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_admin_approval: { variant: "secondary" as const, label: t("orders.statusPendingApproval") },
      admin_approved_pending_payment: { variant: "outline" as const, label: t("orders.statusPendingPayment") },
      payment_received_processing: { variant: "default" as const, label: t("orders.statusProcessing") },
      shipped: { variant: "secondary" as const, label: t("orders.statusShipped") },
      delivered: { variant: "default" as const, label: t("orders.statusDelivered") },
      cancelled_by_user: { variant: "destructive" as const, label: t("orders.statusCancelledByUser") },
      rejected_by_admin: { variant: "destructive" as const, label: t("orders.statusRejectedByAdmin") },
      completed: { variant: "default" as const, label: t("orders.statusCompleted") },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "outline" as const,
      label: status,
    }

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (!order) return null

  const availableTransitions = getAvailableStatusTransitions(order.status)
  const canUpdateStatus = availableTransitions.length > 0
  const totalItems = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0

  // Calculate totals
  const subtotal = Number.parseFloat(order.total_amount)
  const deliveryCost = order.delivery_cost ? Number.parseFloat(order.delivery_cost) : 0
  const finalTotal = order.final_total_amount ? Number.parseFloat(order.final_total_amount) : subtotal + deliveryCost

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-[95vw] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {t("orders.orderDetails")} #{order.id}
          </SheetTitle>
          <SheetDescription>{t("orders.orderDetailsDescription")}</SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 py-4">
          {/* Order Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">{t("orders.orderId")}</Label>
              <div className="font-mono">#{order.id}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">{t("orders.status")}</Label>
              <div className="mt-1">{getStatusBadge(order.status)}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">{t("orders.customer")}</Label>
              <div className="font-mono">{order.users?.telegram_id}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">{t("orders.paymentMethod")}</Label>
              <div>
                <Badge variant="outline">{order.payment_method}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">{t("orders.itemsCount")}</Label>
              <div>
                {totalItems} {t("orders.items")}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">{t("orders.createdAt")}</Label>
              <div>{format(new Date(order.created_at), "PPP p")}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">{t("orders.updatedAt")}</Label>
              <div>{format(new Date(order.updated_at), "PPP p")}</div>
            </div>
          </div>

          {/* Delivery Information */}
          {(order.delivery_method || order.delivery_address) && (
            <>
              <Separator />
              <div>
                <Label className="text-lg font-medium">{t("orders.deliveryInformation")}</Label>
                <div className="mt-3 grid grid-cols-1 gap-3">
                  {order.delivery_method && (
                    <div>
                      <Label className="text-sm font-medium">{t("orders.deliveryMethod")}</Label>
                      <div className="mt-1">
                        <Badge variant="outline">{order.delivery_method}</Badge>
                      </div>
                    </div>
                  )}
                  {order.delivery_address && (
                    <div>
                      <Label className="text-sm font-medium">{t("orders.deliveryAddress")}</Label>
                      <div className="mt-1 p-3 bg-muted rounded-lg">
                        <p className="text-sm">{order.delivery_address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Order Items */}
          <div>
            <Label className="text-lg font-medium">{t("orders.orderItems")}</Label>
            <div className="mt-3 space-y-3">
              {order.order_items?.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                  <Image
                    src={item.products?.image_url || "/placeholder.svg?width=60&height=60"}
                    alt={item.products?.name || "Product"}
                    width={60}
                    height={60}
                    className="rounded-md object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{item.products?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {t("orders.location")}: {item.locations?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("orders.quantity")}: {item.quantity} × ${item.price_at_order}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ${(item.quantity * Number.parseFloat(item.price_at_order)).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Order Totals */}
          <div>
            <Label className="text-lg font-medium">{t("orders.orderTotals")}</Label>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between">
                <span>{t("orders.subtotal")}:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {deliveryCost > 0 && (
                <div className="flex justify-between">
                  <span>{t("orders.deliveryCost")}:</span>
                  <span className="font-medium">${deliveryCost.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>{t("orders.finalTotal")}:</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status Update Section */}
          {canUpdateStatus && (
            <div className="space-y-4">
              <Label className="text-lg font-medium">{t("orders.updateStatus")}</Label>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right col-span-1">
                  {t("orders.newStatus")}
                </Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t("orders.selectStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={order.status}>{getStatusBadge(order.status)}</SelectItem>
                    {availableTransitions.map((transition) => (
                      <SelectItem key={transition.value} value={transition.value}>
                        {transition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="admin_notes" className="text-right col-span-1 pt-2">
                  {t("orders.adminNotes")}
                </Label>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="col-span-3 min-h-[100px]"
                  placeholder={t("orders.adminNotesPlaceholder")}
                />
              </div>
            </div>
          )}

          {/* Existing Admin Notes */}
          {order.admin_notes && (
            <div className="space-y-2">
              <Label className="text-lg font-medium">{t("orders.existingAdminNotes")}</Label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{order.admin_notes}</p>
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="gap-2">
          <SheetClose asChild>
            <Button type="button" variant="outline">
              {t("action.cancel")}
            </Button>
          </SheetClose>
          {canUpdateStatus && newStatus !== order.status && (
            <Button onClick={handleUpdateStatus} disabled={isLoading}>
              {isLoading ? t("orders.updating") : t("orders.updateStatus")}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

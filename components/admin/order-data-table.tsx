"use client"

import * as React from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type ColumnFiltersState,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, Search, Eye, Edit, CheckCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { Order } from "@/lib/types"
import { format } from "date-fns"
import { useI18n } from "@/lib/i18n/context"
import { motion, AnimatePresence } from "framer-motion"

interface OrderDataTableProps {
  data: Order[]
  onEdit: (order: Order) => void
  onUpdateStatus: (orderId: number, newStatus: string) => void
}

export function OrderDataTable({ data, onEdit, onUpdateStatus }: OrderDataTableProps) {
  const { t } = useI18n()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_admin_approval: {
        variant: "secondary" as const,
        color: "text-yellow-600",
        label: t("orders.statusPendingApproval"),
      },
      admin_approved_pending_payment: {
        variant: "outline" as const,
        color: "text-blue-600",
        label: t("orders.statusPendingPayment"),
      },
      payment_received_processing: {
        variant: "default" as const,
        color: "text-blue-600",
        label: t("orders.statusProcessing"),
      },
      shipped: { variant: "secondary" as const, color: "text-purple-600", label: t("orders.statusShipped") },
      delivered: { variant: "default" as const, color: "text-green-600", label: t("orders.statusDelivered") },
      cancelled_by_user: {
        variant: "destructive" as const,
        color: "text-red-600",
        label: t("orders.statusCancelledByUser"),
      },
      rejected_by_admin: {
        variant: "destructive" as const,
        color: "text-red-600",
        label: t("orders.statusRejectedByAdmin"),
      },
      completed: { variant: "default" as const, color: "text-green-600", label: t("orders.statusCompleted") },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "outline" as const,
      color: "text-gray-600",
      label: status,
    }

    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getAvailableStatusTransitions = (currentStatus: string) => {
    const transitions: Record<string, string[]> = {
      pending_admin_approval: ["admin_approved_pending_payment", "rejected_by_admin"],
      admin_approved_pending_payment: ["payment_received_processing", "cancelled_by_user"],
      payment_received_processing: ["shipped", "cancelled_by_user"],
      shipped: ["delivered"],
      delivered: ["completed"],
    }

    return transitions[currentStatus] || []
  }

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("orders.orderId")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-mono">#{row.getValue("id")}</div>,
    },
    {
      accessorKey: "users.telegram_id",
      header: t("orders.customer"),
      cell: ({ row }) => {
        const telegramId = row.original.users?.telegram_id
        return <div className="font-mono">{telegramId}</div>
      },
    },
    {
      accessorKey: "status",
      header: t("orders.status"),
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "total_amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-right w-full justify-end"
        >
          {t("orders.totalAmount")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = Number.parseFloat(row.getValue("total_amount"))
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: "payment_method",
      header: t("orders.paymentMethod"),
      cell: ({ row }) => {
        const method = row.getValue("payment_method") as string
        return <Badge variant="outline">{method}</Badge>
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("orders.createdAt")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => format(new Date(row.getValue("created_at")), "PPP p"),
    },
    {
      id: "items_count",
      header: t("orders.itemsCount"),
      cell: ({ row }) => {
        const items = row.original.order_items || []
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
        return <div className="text-center">{totalItems}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const order = row.original
        const availableTransitions = getAvailableStatusTransitions(order.status)

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("common.openMenu")}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(order)}>
                <Eye className="mr-2 h-4 w-4" />
                {t("orders.viewDetails")}
              </DropdownMenuItem>

              {availableTransitions.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Edit className="mr-2 h-4 w-4" />
                      {t("orders.changeStatus")}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {availableTransitions.map((status) => (
                        <DropdownMenuItem key={status} onClick={() => onUpdateStatus(order.id, status)}>
                          {status === "admin_approved_pending_payment" && (
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                          )}
                          {status === "rejected_by_admin" && <XCircle className="mr-2 h-4 w-4 text-red-600" />}
                          {getStatusBadge(status)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("orders.searchPlaceholder")}
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(String(event.target.value))}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: {
                        delay: index * 0.05,
                        duration: 0.3,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      },
                    }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{
                      backgroundColor: "rgba(0, 0, 0, 0.02)",
                      transition: { duration: 0.2 },
                    }}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {t("orders.noOrders")}
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} {t("common.of")} {table.getCoreRowModel().rows.length}{" "}
          {t("orders.orders")}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t("action.previous")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            {t("action.next")}
          </Button>
        </div>
      </div>
    </div>
  )
}

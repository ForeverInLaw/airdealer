"use client"

import * as React from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, ShoppingCart } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Order } from "@/lib/types"
import { format } from "date-fns"
import { useI18n } from "@/lib/i18n/context"
import { useMobile } from "@/hooks/use-mobile"

interface OrderDataTableProps {
  data: Order[]
  onEdit?: (order: Order) => void
  onView?: (order: Order) => void
  onDelete?: (orderId: number) => void
}

export function OrderDataTable({ data, onEdit, onView, onDelete }: OrderDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const { t } = useI18n()
  const isMobile = useMobile()

  console.log("OrderDataTable - isMobile:", isMobile, "data length:", data.length)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "default"
      case "processing":
        return "secondary"
      case "completed":
        return "default"
      case "cancelled":
        return "destructive"
      default:
        return "default"
    }
  }

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("orders.id")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "customer_name",
      header: () => t("orders.customer"),
    },
    {
      accessorKey: "status",
      header: () => t("orders.status"),
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return <Badge variant={getStatusColor(status)}>{t(`orders.status.${status}`) || status}</Badge>
      },
    },
    {
      accessorKey: "total_amount",
      header: () => t("orders.total"),
      cell: ({ row }) => {
        const amount = Number.parseFloat(row.getValue("total_amount"))
        return new Intl.NumberFormat("ru-RU", {
          style: "currency",
          currency: "RUB",
        }).format(amount)
      },
    },
    {
      accessorKey: "created_at",
      header: () => t("orders.created_at"),
      cell: ({ row }) => format(new Date(row.getValue("created_at")), "PPP p"),
    },
    {
      id: "actions",
      header: () => t("orders.actions"),
      cell: ({ row }) => {
        const order = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("orders.open_menu")}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("orders.actions")}</DropdownMenuLabel>
              {onView && <DropdownMenuItem onClick={() => onView(order)}>{t("orders.view")}</DropdownMenuItem>}
              {onEdit && <DropdownMenuItem onClick={() => onEdit(order)}>{t("orders.edit")}</DropdownMenuItem>}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(order.id)} className="text-red-600">
                    {t("orders.delete")}
                  </DropdownMenuItem>
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
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: isMobile ? 5 : 10,
      },
    },
  })

  // Mobile card view
  if (isMobile) {
    console.log("Rendering mobile cards for orders")
    return (
      <div className="space-y-4">
        <AnimatePresence>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, index) => {
              const order = row.original
              return (
                <motion.div
                  key={order.id}
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
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-medium text-sm">Заказ #{order.id}</h3>
                            <Badge variant={getStatusColor(order.status)} className="text-xs">
                              {t(`orders.status.${order.status}`) || order.status}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium mb-1">{order.customer_name}</p>
                          <p className="text-sm text-green-600 font-medium mb-2">
                            {new Intl.NumberFormat("ru-RU", {
                              style: "currency",
                              currency: "RUB",
                            }).format(Number.parseFloat(order.total_amount))}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{format(new Date(order.created_at), "dd.MM.yyyy HH:mm")}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onView && (
                              <DropdownMenuItem onClick={() => onView(order)}>{t("orders.view")}</DropdownMenuItem>
                            )}
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(order)}>{t("orders.edit")}</DropdownMenuItem>
                            )}
                            {onDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onDelete(order.id)} className="text-red-600">
                                  {t("orders.delete")}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">{t("orders.no_results")}</div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t("orders.previous")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            {t("orders.next")}
          </Button>
        </div>
      </div>
    )
  }

  // Desktop table view
  return (
    <div>
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("orders.no_results")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          {t("orders.previous")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          {t("orders.next")}
        </Button>
      </div>
    </div>
  )
}

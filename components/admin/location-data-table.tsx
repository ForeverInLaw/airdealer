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
import { MoreHorizontal, ArrowUpDown, MapPin } from "lucide-react"
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
import type { Location } from "@/lib/types"
import { format } from "date-fns"
import { useI18n } from "@/lib/i18n/context"
import { useMobile } from "@/hooks/use-mobile"

interface LocationDataTableProps {
  data: Location[]
  onEdit: (location: Location) => void
  onDelete: (locationId: number) => void
}

export function LocationDataTable({ data, onEdit, onDelete }: LocationDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const { t } = useI18n()
  const isMobile = useMobile()

  const columns: ColumnDef<Location>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("locations.id")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "name",
      header: () => t("locations.name"),
    },
    {
      accessorKey: "address",
      header: () => t("locations.address"),
      cell: ({ row }) => <div className="truncate max-w-xs">{row.getValue("address") || "N/A"}</div>,
    },
    {
      accessorKey: "created_at",
      header: () => t("locations.created_at"),
      cell: ({ row }) => format(new Date(row.getValue("created_at")), "PPP p"),
    },
    {
      accessorKey: "updated_at",
      header: () => t("locations.updated_at"),
      cell: ({ row }) => format(new Date(row.getValue("updated_at")), "PPP p"),
    },
    {
      id: "actions",
      header: () => t("locations.actions"),
      cell: ({ row }) => {
        const location = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("locations.open_menu")}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("locations.actions")}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(location)}>{t("locations.edit")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(location.id)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                {t("locations.delete")}
              </DropdownMenuItem>
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
    return (
      <div className="space-y-4">
        <AnimatePresence>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, index) => {
              const location = row.original
              return (
                <motion.div
                  key={location.id}
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
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-medium text-sm truncate">{location.name}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {location.address || "Адрес не указан"}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>ID: {location.id}</span>
                            <span>{format(new Date(location.created_at), "dd.MM.yyyy")}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(location)}>{t("locations.edit")}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(location.id)} className="text-red-600">
                              {t("locations.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">{t("locations.no_results")}</div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t("locations.previous")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            {t("locations.next")}
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
                  {t("locations.no_results")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          {t("locations.previous")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          {t("locations.next")}
        </Button>
      </div>
    </div>
  )
}

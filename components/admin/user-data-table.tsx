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
import { MoreHorizontal, ArrowUpDown, Search, Ban, CheckCircle, MessageSquare, MapPin } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { User, Location } from "@/lib/types"
import { format } from "date-fns"
import { useI18n } from "@/lib/i18n/context"

interface UserDataTableProps {
  data: User[]
  locations: Location[]
  onEdit: (user: User) => void
  onBlock: (telegramId: number, isBlocked: boolean) => void
  onDelete: (telegramId: number) => void
}

export function UserDataTable({ data, locations, onEdit, onBlock, onDelete }: UserDataTableProps) {
  const { t } = useI18n()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  const getLocationName = (locationId: number | null) => {
    if (!locationId) return t("users.noLocationSelected")
    const location = locations.find((l) => l.id === locationId)
    return location?.name || t("users.unknownLocation")
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "telegram_id",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("users.telegramId")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-mono">{row.getValue("telegram_id")}</div>,
    },
    {
      accessorKey: "full_name",
      header: t("users.fullName"),
      cell: ({ row }) => {
        const user = row.original
        const fullName =
          user.first_name || user.last_name
            ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
            : t("users.noName")
        return <div>{fullName}</div>
      },
    },
    {
      accessorKey: "username",
      header: t("users.username"),
      cell: ({ row }) => {
        const username = row.getValue("username") as string
        return <div className="font-mono">{username ? `@${username}` : t("users.noUsername")}</div>
      },
    },
    {
      accessorKey: "language_code",
      header: t("users.language"),
      cell: ({ row }) => {
        const language = row.getValue("language_code") as string
        const languageNames = {
          en: "English",
          ru: "Русский",
          pl: "Polski",
        }
        return <Badge variant="outline">{languageNames[language as keyof typeof languageNames] || language}</Badge>
      },
    },
    {
      accessorKey: "selected_location_id",
      header: t("users.selectedLocation"),
      cell: ({ row }) => {
        const locationId = row.getValue("selected_location_id") as number | null
        return (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{getLocationName(locationId)}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "is_blocked",
      header: t("users.status"),
      cell: ({ row }) => {
        const isBlocked = row.getValue("is_blocked") as boolean
        return (
          <Badge variant={isBlocked ? "destructive" : "default"} className="gap-1">
            {isBlocked ? (
              <>
                <Ban className="h-3 w-3" />
                {t("users.blocked")}
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3" />
                {t("users.active")}
              </>
            )}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("users.registeredAt")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => format(new Date(row.getValue("created_at")), "PPP p"),
    },
    {
      accessorKey: "updated_at",
      header: t("users.lastActivity"),
      cell: ({ row }) => format(new Date(row.getValue("updated_at")), "PPP p"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original
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
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                {t("users.viewDetails")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onBlock(user.telegram_id, user.is_blocked)}
                className={
                  user.is_blocked ? "text-green-600 focus:text-green-600" : "text-yellow-600 focus:text-yellow-600"
                }
              >
                {user.is_blocked ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t("users.unblock")}
                  </>
                ) : (
                  <>
                    <Ban className="mr-2 h-4 w-4" />
                    {t("users.block")}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(user.telegram_id)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                {t("action.delete")}
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
          placeholder={t("users.searchPlaceholder")}
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
                    {t("users.noUsers")}
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
          {t("users.users")}
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

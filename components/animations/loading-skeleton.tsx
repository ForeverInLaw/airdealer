"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function TableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search skeleton */}
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-10 w-80" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-md border">
        <div className="p-4">
          {/* Header */}
          <div className="flex space-x-4 mb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6 flex-1" />
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex space-x-4 mb-3">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-8 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  )
}

export function StatCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-9 w-28" />
    </div>
  )
}

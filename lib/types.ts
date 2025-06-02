// Based on updated SQLAlchemy models provided by the user

export interface User {
  telegram_id: number // BigInteger
  language_code: string
  is_blocked: boolean
  created_at: string // DateTime
  updated_at: string // DateTime
  selected_location_id?: number | null
  first_name?: string | null
  last_name?: string | null
  username?: string | null
}

export interface UserAddress {
  id: number
  user_id: number
  address_text: string
  is_default: boolean
  created_at: string
}

export interface Location {
  id: number
  name: string
  address?: string | null
  created_at: string
  updated_at: string
}

export interface Manufacturer {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface ProductLocalization {
  product_id: number
  language_code: string
  name: string
  description?: string | null
}

export interface Product {
  id: number
  name: string // Main/fallback name for the product entity itself
  manufacturer_id: number
  category_id: number
  image_url?: string | null
  variation?: string | null
  price: string // Numeric(10, 2)
  cost: string // Numeric(10, 2)
  created_at: string
  updated_at: string
  // Optional: for display purposes after joining in tables
  manufacturer_name?: string
  category_name?: string
  display_name?: string
  // For carrying all localizations to the edit form
  localizations?: ProductLocalization[]
}

export interface ProductStock {
  product_id: number
  location_id: number
  quantity: number
  updated_at: string
  // Optional: for display purposes after joining
  product_name?: string
  location_name?: string
  product_display_name?: string
}

export enum OrderStatusEnum {
  PENDING_ADMIN_APPROVAL = "pending_admin_approval",
  ADMIN_APPROVED_PENDING_PAYMENT = "admin_approved_pending_payment",
  PAYMENT_RECEIVED_PROCESSING = "payment_received_processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED_BY_USER = "cancelled_by_user",
  REJECTED_BY_ADMIN = "rejected_by_admin",
  COMPLETED = "completed",
}

export interface Order {
  id: number
  user_id: number // BigInteger
  status: OrderStatusEnum | string // String(50) or Enum
  payment_method: string
  total_amount: string // Numeric(10, 2)
  created_at: string
  updated_at: string
  admin_notes?: string | null
  delivery_method?: string | null
  delivery_address?: string | null
  delivery_cost?: string | null // Numeric(10, 2)
  final_total_amount?: string | null // Numeric(10, 2)
  // Optional: for display purposes after joining
  users?: User
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  location_id: number
  quantity: number
  reserved_quantity: number
  price_at_order: string // Numeric(10, 2)
  // Optional: for display purposes after joining
  products?: Product
  locations?: Location
}

export interface UserCart {
  user_id: number // BigInteger
  product_id: number
  location_id: number
  quantity: number
}

export interface InterfaceText {
  key: string
  text_ru?: string | null
  text_en?: string | null
  text_pl?: string | null
}

export interface Admin {
  telegram_id: number // BigInteger, ForeignKey to User
  role: string // e.g., "admin", "super_admin"
}

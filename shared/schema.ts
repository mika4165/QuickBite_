import { sql, relations } from "drizzle-orm";
import {
  index,
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for connect-pg-simple
export const sessions = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Users table with role support (student/staff)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("student"), // 'student' or 'staff'
  storeId: integer("store_id"), // For staff, links to their store
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Stores table (canteen stores)
export const stores = pgTable("stores", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category"),
  bannerImageUrl: varchar("banner_image_url"),
  logoUrl: varchar("logo_url"),
  gcashQrUrl: varchar("gcash_qr_url"),
  isActive: boolean("is_active").default(true),
  ownerId: varchar("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Meals table
export const meals = pgTable("meals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("image_url"),
  isAvailable: boolean("is_available").default(true),
  category: varchar("category"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Orders table
export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  status: varchar("status").default("pending_payment"), // pending_payment, payment_submitted, confirmed, ready, claimed, cancelled
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  pickupTime: varchar("pickup_time").notNull(),
  notes: text("notes"),
  paymentProofUrl: varchar("payment_proof_url"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Order items (individual meals in an order)
export const orderItems = pgTable("order_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  mealId: integer("meal_id").references(() => meals.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
});

// Ratings/Reviews
export const ratings = pgTable("ratings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  orderId: integer("order_id").references(() => orders.id), // Optional: links review to specific order
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Messages (communication between student and staff per order)
export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Approved staff credentials (salted+hashed)
export const approvedStaff = pgTable("approved_staff", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email").unique().notNull(),
  passwordSalt: varchar("password_salt").notNull(),
  passwordHash: varchar("password_hash").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Merchant applications (optional; used to bootstrap staff stores)
export const merchantApplications = pgTable("merchant_applications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id"),
  email: varchar("email").notNull(),
  storeName: varchar("store_name").notNull(),
  category: varchar("category"),
  description: text("description"),
  phone: varchar("phone"),
  status: varchar("status").default("pending"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Rejected staff/merchant applications (tracks rejected applications)
export const rejectedStaff = pgTable("rejected_staff", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email").notNull(),
  storeName: varchar("store_name").notNull(),
  description: text("description"),
  phone: varchar("phone"),
  category: varchar("category"),
  reason: text("reason"),
  rejectedAt: timestamp("rejected_at").default(sql`CURRENT_TIMESTAMP`),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  originalApplicationId: integer("original_application_id").references(() => merchantApplications.id),
});

// Types
export type User = typeof users.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Meal = typeof meals.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type ApprovedStaff = typeof approvedStaff.$inferSelect;
export type MerchantApplication = typeof merchantApplications.$inferSelect;
export type RejectedStaff = typeof rejectedStaff.$inferSelect;

// Insert schemas are not required for current client-side usage

// Complex types
export type StoreWithRating = Store & { averageRating: number; ratingCount: number };
export type OrderWithDetails = Order & { items: OrderItem[]; store: Store | null; student: User | null };
export type MessageWithSender = Message & { sender?: User };

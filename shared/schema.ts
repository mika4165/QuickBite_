import { sql, relations } from "drizzle-orm";
import {
  index,
  json,
  mysqlTable,
  timestamp,
  varchar,
  text,
  int,
  boolean,
  decimal,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for express-mysql-session
export const sessions = mysqlTable(
  "sessions",
  {
    session_id: varchar("session_id", { length: 128 }).primaryKey(),
    expires: int("expires").notNull(),
    data: text("data").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expires)],
);

// Users table with role support (student/staff)
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 512 }),
  role: varchar("role", { length: 20 }).default("student"), // 'student' or 'staff'
  storeId: int("store_id"), // For staff, links to their store
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
});

// Stores table (canteen stores)
export const stores = mysqlTable("stores", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  bannerImageUrl: varchar("banner_image_url", { length: 512 }),
  logoUrl: varchar("logo_url", { length: 512 }),
  gcashQrUrl: varchar("gcash_qr_url", { length: 512 }),
  isActive: boolean("is_active").default(true),
  ownerId: varchar("owner_id", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
});

// Meals table
export const meals = mysqlTable("meals", {
  id: int("id").primaryKey().autoincrement(),
  storeId: int("store_id").references(() => stores.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("image_url", { length: 512 }),
  isAvailable: boolean("is_available").default(true),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
});

// Orders table
export const orders = mysqlTable("orders", {
  id: int("id").primaryKey().autoincrement(),
  studentId: varchar("student_id", { length: 36 }).references(() => users.id).notNull(),
  storeId: int("store_id").references(() => stores.id).notNull(),
  status: varchar("status", { length: 50 }).default("pending_payment"), // pending_payment, payment_submitted, confirmed, ready, claimed, cancelled
  pickupTime: varchar("pickup_time", { length: 50 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentProofUrl: varchar("payment_proof_url", { length: 512 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
});

// Order items table
export const orderItems = mysqlTable("order_items", {
  id: int("id").primaryKey().autoincrement(),
  orderId: int("order_id").references(() => orders.id).notNull(),
  mealId: int("meal_id").references(() => meals.id).notNull(),
  quantity: int("quantity").notNull().default(1),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

// Ratings table for store reviews
export const ratings = mysqlTable("ratings", {
  id: int("id").primaryKey().autoincrement(),
  storeId: int("store_id").references(() => stores.id).notNull(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Messages table for store-customer communication
export const messages = mysqlTable("messages", {
  id: int("id").primaryKey().autoincrement(),
  orderId: int("order_id").references(() => orders.id).notNull(),
  senderId: varchar("sender_id", { length: 36 }).references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  store: one(stores, {
    fields: [users.storeId],
    references: [stores.id],
  }),
  orders: many(orders),
  ratings: many(ratings),
  messages: many(messages),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  owner: one(users, {
    fields: [stores.ownerId],
    references: [users.id],
  }),
  meals: many(meals),
  orders: many(orders),
  ratings: many(ratings),
}));

export const mealsRelations = relations(meals, ({ one, many }) => ({
  store: one(stores, {
    fields: [meals.storeId],
    references: [stores.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  student: one(users, {
    fields: [orders.studentId],
    references: [users.id],
  }),
  store: one(stores, {
    fields: [orders.storeId],
    references: [stores.id],
  }),
  items: many(orderItems),
  messages: many(messages),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  meal: one(meals, {
    fields: [orderItems.mealId],
    references: [meals.id],
  }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  store: one(stores, {
    fields: [ratings.storeId],
    references: [stores.id],
  }),
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  order: one(orders, {
    fields: [messages.orderId],
    references: [orders.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table with role support (student/staff)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }).default("student"), // 'student' or 'staff'
  storeId: integer("store_id"), // For staff, links to their store
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stores table (canteen stores)
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  bannerImageUrl: varchar("banner_image_url"),
  logoUrl: varchar("logo_url"),
  gcashQrUrl: varchar("gcash_qr_url"),
  isActive: boolean("is_active").default(true),
  ownerId: varchar("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meals table
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("image_url"),
  isAvailable: boolean("is_available").default(true),
  category: varchar("category", { length: 100 }),
  quantity: integer("quantity").default(999), // inventory stock
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meal ratings table for individual meal reviews
export const mealRatings = pgTable("meal_ratings", {
  id: serial("id").primaryKey(),
  mealId: integer("meal_id").references(() => meals.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  photoUrl: varchar("photo_url"), // photo of the meal
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  status: varchar("status", { length: 50 }).default("pending_payment"), // pending_payment, payment_submitted, confirmed, ready, claimed, cancelled
  pickupTime: varchar("pickup_time", { length: 50 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentProofUrl: varchar("payment_proof_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  mealId: integer("meal_id").references(() => meals.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

// Ratings table for store reviews
export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table for store-customer communication
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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
  ratings: many(mealRatings),
}));

export const mealRatingsRelations = relations(mealRatings, ({ one }) => ({
  meal: one(meals, {
    fields: [mealRatings.mealId],
    references: [meals.id],
  }),
  user: one(users, {
    fields: [mealRatings.userId],
    references: [users.id],
  }),
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

export const insertMealRatingSchema = createInsertSchema(mealRatings).omit({
  id: true,
  createdAt: true,
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
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Meal = typeof meals.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMealRating = z.infer<typeof insertMealRatingSchema>;
export type MealRating = typeof mealRatings.$inferSelect;

// Extended types for frontend
export type StoreWithRating = Store & {
  averageRating: number;
  ratingCount: number;
};

export type MealWithRating = Meal & {
  averageRating: number;
  ratingCount: number;
};

export type OrderWithDetails = Order & {
  store: Store;
  items: (OrderItem & { meal: Meal })[];
  student: User;
};

export type MessageWithSender = Message & {
  sender: User;
};

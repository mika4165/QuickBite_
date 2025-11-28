import {
  users,
  stores,
  meals,
  orders,
  orderItems,
  ratings,
  messages,
  type User,
  type Store,
  type InsertStore,
  type Meal,
  type InsertMeal,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Rating,
  type InsertRating,
  type Message,
  type InsertMessage,
  type StoreWithRating,
  type OrderWithDetails,
  type MessageWithSender,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(email: string, password: string, role?: string): Promise<User>;
  upsertUser(user: User): Promise<User>;
  
  // Store operations
  getStores(): Promise<StoreWithRating[]>;
  getStore(id: number): Promise<StoreWithRating | undefined>;
  getStoreByOwner(ownerId: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, store: Partial<InsertStore>): Promise<Store | undefined>;
  
  // Meal operations
  getMealsByStore(storeId: number): Promise<Meal[]>;
  getMeal(id: number): Promise<Meal | undefined>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  updateMeal(id: number, meal: Partial<InsertMeal>): Promise<Meal | undefined>;
  
  // Staff operations
  applyAsStaff(userId: string, storeId: number): Promise<User>;
  
  // Order operations
  getOrdersByStudent(studentId: string): Promise<OrderWithDetails[]>;
  getOrdersByStore(storeId: number): Promise<OrderWithDetails[]>;
  getOrder(id: number): Promise<OrderWithDetails | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updateOrderPaymentProof(id: number, paymentProofUrl: string): Promise<Order | undefined>;
  
  // Rating operations
  getRatingsByStore(storeId: number): Promise<(Rating & { user?: User })[]>;
  createRating(rating: InsertRating): Promise<Rating>;
  
  // Message operations
  getMessagesByOrder(orderId: number): Promise<MessageWithSender[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(email: string, password: string, role: string = "student"): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email,
        password,
        role,
      })
      .returning();
    return user;
  }

  async upsertUser(user: User): Promise<User> {
    const [updated] = await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: user,
      })
      .returning();
    return updated;
  }

  // Store operations
  async getStores(): Promise<StoreWithRating[]> {
    const storeList = await db.select().from(stores);
    
    return Promise.all(
      storeList.map(async (store) => {
        const ratingList = await db
          .select({ 
            rating: ratings.rating 
          })
          .from(ratings)
          .where(eq(ratings.storeId, store.id));
        
        const averageRating = ratingList.length > 0
          ? ratingList.reduce((sum, r) => sum + parseInt(r.rating), 0) / ratingList.length
          : 0;

        return {
          ...store,
          averageRating,
          ratingCount: ratingList.length,
        };
      })
    );
  }

  async getStore(id: number): Promise<StoreWithRating | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    if (!store) return undefined;

    const ratingList = await db
      .select({ rating: ratings.rating })
      .from(ratings)
      .where(eq(ratings.storeId, id));
    
    const averageRating = ratingList.length > 0
      ? ratingList.reduce((sum, r) => sum + parseInt(r.rating), 0) / ratingList.length
      : 0;

    return {
      ...store,
      averageRating,
      ratingCount: ratingList.length,
    };
  }

  async getStoreByOwner(ownerId: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.ownerId, ownerId));
    return store;
  }

  async createStore(store: InsertStore): Promise<Store> {
    const [newStore] = await db.insert(stores).values(store).returning();
    return newStore;
  }

  async updateStore(id: number, store: Partial<InsertStore>): Promise<Store | undefined> {
    const [updated] = await db
      .update(stores)
      .set(store)
      .where(eq(stores.id, id))
      .returning();
    return updated;
  }

  // Meal operations
  async getMealsByStore(storeId: number): Promise<Meal[]> {
    return await db.select().from(meals).where(eq(meals.storeId, storeId));
  }

  async getMeal(id: number): Promise<Meal | undefined> {
    const [meal] = await db.select().from(meals).where(eq(meals.id, id));
    return meal;
  }

  async createMeal(meal: InsertMeal): Promise<Meal> {
    const [newMeal] = await db.insert(meals).values(meal).returning();
    return newMeal;
  }

  async updateMeal(id: number, meal: Partial<InsertMeal>): Promise<Meal | undefined> {
    const [updated] = await db
      .update(meals)
      .set(meal)
      .where(eq(meals.id, id))
      .returning();
    return updated;
  }

  // Order operations
  async getOrdersByStudent(studentId: string): Promise<OrderWithDetails[]> {
    const orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.studentId, studentId));
    
    return Promise.all(
      orderList.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));
        
        const [storeData] = await db
          .select()
          .from(stores)
          .where(eq(stores.id, order.storeId));
        
        const [student] = await db
          .select()
          .from(users)
          .where(eq(users.id, order.studentId));

        return { ...order, items, store: storeData, student };
      })
    );
  }

  async getOrdersByStore(storeId: number): Promise<OrderWithDetails[]> {
    const orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.storeId, storeId));
    
    return Promise.all(
      orderList.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));
        
        const [storeData] = await db
          .select()
          .from(stores)
          .where(eq(stores.id, order.storeId));
        
        const [student] = await db
          .select()
          .from(users)
          .where(eq(users.id, order.studentId));

        return { ...order, items, store: storeData, student };
      })
    );
  }

  async getOrder(id: number): Promise<OrderWithDetails | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));
    
    const [storeData] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, order.storeId));
    
    const [student] = await db
      .select()
      .from(users)
      .where(eq(users.id, order.studentId));

    return { ...order, items, store: storeData, student };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    if (items.length > 0) {
      const itemsWithOrderId = items.map(item => ({
        ...item,
        orderId: newOrder.id,
      }));
      await db.insert(orderItems).values(itemsWithOrderId);
    }

    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async updateOrderPaymentProof(id: number, paymentProofUrl: string): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ paymentProofUrl, status: "payment_submitted" })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  // Rating operations
  async getRatingsByStore(storeId: number): Promise<(Rating & { user?: User })[]> {
    const ratingList = await db
      .select()
      .from(ratings)
      .where(eq(ratings.storeId, storeId))
      .orderBy(desc(ratings.createdAt));
    
    return Promise.all(
      ratingList.map(async (rating) => {
        const [user] = await db.select().from(users).where(eq(users.id, rating.userId));
        return { ...rating, user };
      })
    );
  }

  async createRating(rating: InsertRating): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    return newRating;
  }

  // Message operations
  async getMessagesByOrder(orderId: number): Promise<MessageWithSender[]> {
    const messageList = await db
      .select()
      .from(messages)
      .where(eq(messages.orderId, orderId))
      .orderBy(messages.createdAt);
    
    return Promise.all(
      messageList.map(async (message) => {
        const [sender] = await db.select().from(users).where(eq(users.id, message.senderId));
        return { ...message, sender };
      })
    );
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  // Staff operations
  async applyAsStaff(userId: string, storeId: number): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ role: "staff", storeId: storeId })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();

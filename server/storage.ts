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

// In-memory storage for temporary use (while MySQL is being set up)
export class MemoryStorage implements IStorage {
  private usersData: Map<string, User> = new Map();
  private storesData: Map<number, Store> = new Map();
  private mealsData: Map<number, Meal> = new Map();
  private ordersData: Map<number, Order> = new Map();
  private orderItemsData: Map<number, OrderItem> = new Map();
  private ratingsData: Map<number, Rating> = new Map();
  private messagesData: Map<number, Message> = new Map();
  private nextStoreId = 3;
  private nextMealId = 7;
  private nextOrderId = 1;
  private nextOrderItemId = 1;
  private nextRatingId = 4;
  private nextMessageId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize stores
    this.storesData.set(1, {
      id: 1,
      name: "Mang Juan's Kitchen",
      description: "Home-cooked Filipino favorites prepared fresh daily. Known for our delicious adobo and sinigang!",
      category: "Filipino",
      bannerImageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop",
      gcashQrUrl: null,
      isActive: true,
      ownerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.storesData.set(2, {
      id: 2,
      name: "Fresh Bites Cafe",
      description: "Healthy and tasty options for the health-conscious student. Salads, wraps, and smoothie bowls!",
      category: "Healthy",
      bannerImageUrl: "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=800&h=400&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&h=100&fit=crop",
      gcashQrUrl: null,
      isActive: true,
      ownerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Initialize meals for store 1
    const mealsList: Meal[] = [
      {
        id: 1,
        storeId: 1,
        name: "Chicken Adobo",
        description: "Classic Filipino chicken adobo with rice",
        price: "85.00",
        imageUrl: "https://images.unsplash.com/photo-1624726175512-19b9baf9fbd1?w=400&h=400&fit=crop",
        isAvailable: true,
        category: "Main Dish",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        storeId: 1,
        name: "Pork Sinigang",
        description: "Sour tamarind soup with tender pork",
        price: "95.00",
        imageUrl: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400&h=400&fit=crop",
        isAvailable: true,
        category: "Main Dish",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        storeId: 1,
        name: "Beef Kare-Kare",
        description: "Oxtail stew in peanut sauce",
        price: "120.00",
        imageUrl: "https://images.unsplash.com/photo-1547928578-bca3e9c5a477?w=400&h=400&fit=crop",
        isAvailable: true,
        category: "Main Dish",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        storeId: 1,
        name: "Lumpiang Shanghai",
        description: "Crispy spring rolls (8 pcs)",
        price: "50.00",
        imageUrl: "https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=400&h=400&fit=crop",
        isAvailable: true,
        category: "Sides",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        storeId: 1,
        name: "Halo-Halo",
        description: "Classic Filipino shaved ice dessert",
        price: "65.00",
        imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop",
        isAvailable: true,
        category: "Dessert",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 6,
        storeId: 1,
        name: "Iced Tea",
        description: "Refreshing house-blend iced tea",
        price: "25.00",
        imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop",
        isAvailable: true,
        category: "Drinks",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mealsList.forEach(meal => this.mealsData.set(meal.id, meal));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(u => u.email === email);
  }

  async createUser(email: string, password: string, role: string = "student"): Promise<User> {
    const id = crypto.randomUUID();
    const user: User = {
      id,
      email,
      password,
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      role,
      storeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.usersData.set(id, user);
    return user;
  }

  async upsertUser(user: User): Promise<User> {
    this.usersData.set(user.id, user);
    return user;
  }

  // Store operations
  async getStores(): Promise<StoreWithRating[]> {
    const stores = Array.from(this.storesData.values());
    return stores.map(store => ({
      ...store,
      averageRating: 4,
      ratingCount: 0,
    }));
  }

  async getStore(id: number): Promise<StoreWithRating | undefined> {
    const store = this.storesData.get(id);
    return store ? { ...store, averageRating: 4, ratingCount: 0 } : undefined;
  }

  async getStoreByOwner(ownerId: string): Promise<Store | undefined> {
    return Array.from(this.storesData.values()).find(s => s.ownerId === ownerId);
  }

  async createStore(store: InsertStore): Promise<Store> {
    const id = this.nextStoreId++;
    const newStore: Store = {
      id,
      ...store,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.storesData.set(id, newStore);
    return newStore;
  }

  async updateStore(id: number, store: Partial<InsertStore>): Promise<Store | undefined> {
    const existing = this.storesData.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...store, updatedAt: new Date() };
    this.storesData.set(id, updated);
    return updated;
  }

  // Meal operations
  async getMealsByStore(storeId: number): Promise<Meal[]> {
    return Array.from(this.mealsData.values()).filter(m => m.storeId === storeId);
  }

  async getMeal(id: number): Promise<Meal | undefined> {
    return this.mealsData.get(id);
  }

  async createMeal(meal: InsertMeal): Promise<Meal> {
    const id = this.nextMealId++;
    const newMeal: Meal = {
      id,
      ...meal,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.mealsData.set(id, newMeal);
    return newMeal;
  }

  async updateMeal(id: number, meal: Partial<InsertMeal>): Promise<Meal | undefined> {
    const existing = this.mealsData.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...meal, updatedAt: new Date() };
    this.mealsData.set(id, updated);
    return updated;
  }

  // Staff operations
  async applyAsStaff(userId: string, storeId: number): Promise<User> {
    const user = this.usersData.get(userId);
    if (!user) throw new Error("User not found");
    const updated = { ...user, role: "staff", storeId };
    this.usersData.set(userId, updated);
    return updated;
  }

  // Order operations
  async getOrdersByStudent(studentId: string): Promise<OrderWithDetails[]> {
    return Array.from(this.ordersData.values())
      .filter(o => o.studentId === studentId)
      .map(o => ({ ...o, items: [], store: null, student: null }));
  }

  async getOrdersByStore(storeId: number): Promise<OrderWithDetails[]> {
    return Array.from(this.ordersData.values())
      .filter(o => o.storeId === storeId)
      .map(o => ({ ...o, items: [], store: null, student: null }));
  }

  async getOrder(id: number): Promise<OrderWithDetails | undefined> {
    const order = this.ordersData.get(id);
    return order ? { ...order, items: [], store: null, student: null } : undefined;
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const id = this.nextOrderId++;
    const newOrder: Order = {
      id,
      ...order,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.ordersData.set(id, newOrder);
    items.forEach(item => {
      this.orderItemsData.set(this.nextOrderItemId++, { id: this.nextOrderItemId - 1, ...item, orderId: id });
    });
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const existing = this.ordersData.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, status, updatedAt: new Date() };
    this.ordersData.set(id, updated);
    return updated;
  }

  async updateOrderPaymentProof(id: number, paymentProofUrl: string): Promise<Order | undefined> {
    const existing = this.ordersData.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, paymentProofUrl, status: "payment_submitted", updatedAt: new Date() };
    this.ordersData.set(id, updated);
    return updated;
  }

  // Rating operations
  async getRatingsByStore(storeId: number): Promise<(Rating & { user?: User })[]> {
    return Array.from(this.ratingsData.values())
      .filter(r => r.storeId === storeId)
      .map(r => ({ ...r, user: this.usersData.get(r.userId) }));
  }

  async createRating(rating: InsertRating): Promise<Rating> {
    const id = this.nextRatingId++;
    const newRating: Rating = {
      id,
      ...rating,
      createdAt: new Date(),
    };
    this.ratingsData.set(id, newRating);
    return newRating;
  }

  // Message operations
  async getMessagesByOrder(orderId: number): Promise<MessageWithSender[]> {
    return Array.from(this.messagesData.values())
      .filter(m => m.orderId === orderId)
      .map(m => ({ ...m, sender: this.usersData.get(m.senderId) }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.nextMessageId++;
    const newMessage: Message = {
      id,
      ...message,
      createdAt: new Date(),
    };
    this.messagesData.set(id, newMessage);
    return newMessage;
  }
}

export const storage = new MemoryStorage();

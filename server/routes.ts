import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword } from "./replitAuth";
import { insertOrderSchema, insertRatingSchema, insertMessageSchema, insertMealSchema } from "@shared/schema";
import { z } from "zod";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  // Auth routes
  app.post("/api/login", passport.authenticate("local"), (req: any, res) => {
    res.json({ message: "Login successful" });
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }
      const hashedPassword = hashPassword(password);
      const user = await storage.createUser(email, hashedPassword, "student");
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        res.json({ message: "Account created successfully" });
      });
    } catch (error) {
      console.error("Error registering:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  // File upload endpoint
  app.post("/api/upload", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      const type = req.body.type;
      const storeId = req.body.storeId;

      // If updating store's GCash QR code
      if (type === "gcash_qr" && storeId) {
        const userId = req.user.claims.sub;
        const store = await storage.getStoreByOwner(userId);
        if (store && store.id === parseInt(storeId)) {
          await storage.updateStore(store.id, { gcashQrUrl: fileUrl });
        }
      }

      res.json({ url: fileUrl });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Store routes
  app.get("/api/stores", async (_req, res) => {
    try {
      const stores = await storage.getStores();
      res.json(stores);
    } catch (error) {
      console.error("Error fetching stores:", error);
      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  app.get("/api/stores/:id", async (req, res) => {
    try {
      const store = await storage.getStore(parseInt(req.params.id));
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      res.json(store);
    } catch (error) {
      console.error("Error fetching store:", error);
      res.status(500).json({ message: "Failed to fetch store" });
    }
  });

  app.get("/api/stores/:id/meals", async (req, res) => {
    try {
      const meals = await storage.getMealsByStore(parseInt(req.params.id));
      res.json(meals);
    } catch (error) {
      console.error("Error fetching meals:", error);
      res.status(500).json({ message: "Failed to fetch meals" });
    }
  });

  app.get("/api/stores/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getRatingsByStore(parseInt(req.params.id));
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/stores/:id/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const storeId = parseInt(req.params.id);
      
      const validatedData = insertRatingSchema.parse({
        storeId,
        userId,
        rating: req.body.rating,
        comment: req.body.comment,
      });

      const review = await storage.createRating(validatedData);
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Order routes
  app.get("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getOrdersByStudent(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if user is authorized to view this order
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const isStudent = order.studentId === userId;
      const isStaff = user?.role === "staff" && user?.storeId === order.storeId;
      
      if (!isStudent && !isStaff) {
        return res.status(403).json({ message: "Not authorized to view this order" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const orderData = {
        studentId: userId,
        storeId: req.body.storeId,
        pickupTime: req.body.pickupTime,
        totalAmount: req.body.totalAmount,
        notes: req.body.notes,
        paymentProofUrl: req.body.paymentProofUrl,
        status: req.body.paymentProofUrl ? "payment_submitted" : "pending_payment",
      };

      const items = req.body.items.map((item: any) => ({
        mealId: item.mealId,
        quantity: item.quantity,
        price: item.price,
      }));

      const order = await storage.createOrder(orderData, items);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Order messages
  app.get("/api/orders/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const messages = await storage.getMessagesByOrder(orderId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/orders/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orderId = parseInt(req.params.id);
      
      const validatedData = insertMessageSchema.parse({
        orderId,
        senderId: userId,
        content: req.body.content,
      });

      const message = await storage.createMessage(validatedData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Staff routes
  app.get("/api/staff/store", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "staff") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      if (!user.storeId) {
        return res.status(404).json({ message: "No store assigned" });
      }
      
      const store = await storage.getStore(user.storeId);
      res.json(store);
    } catch (error) {
      console.error("Error fetching staff store:", error);
      res.status(500).json({ message: "Failed to fetch store" });
    }
  });

  app.get("/api/staff/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "staff" || !user.storeId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const orders = await storage.getOrdersByStore(user.storeId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching staff orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/staff/meals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "staff" || !user.storeId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const meals = await storage.getMealsByStore(user.storeId);
      res.json(meals);
    } catch (error) {
      console.error("Error fetching staff meals:", error);
      res.status(500).json({ message: "Failed to fetch meals" });
    }
  });

  app.patch("/api/staff/orders/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "staff" || !user.storeId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order || order.storeId !== user.storeId) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const updated = await storage.updateOrderStatus(orderId, req.body.status);
      res.json(updated);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  app.post("/api/staff/meals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "staff" || !user.storeId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const validatedData = insertMealSchema.parse({
        ...req.body,
        storeId: user.storeId,
      });

      const meal = await storage.createMeal(validatedData);
      res.json(meal);
    } catch (error) {
      console.error("Error creating meal:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid meal data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create meal" });
    }
  });

  app.patch("/api/staff/meals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "staff" || !user.storeId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const mealId = parseInt(req.params.id);
      const meal = await storage.getMeal(mealId);
      
      if (!meal || meal.storeId !== user.storeId) {
        return res.status(404).json({ message: "Meal not found" });
      }
      
      const updated = await storage.updateMeal(mealId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating meal:", error);
      res.status(500).json({ message: "Failed to update meal" });
    }
  });

  // Staff application
  app.post("/api/staff/apply", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const storeId = parseInt(req.body.storeId);

      if (!storeId) {
        return res.status(400).json({ message: "Store ID required" });
      }

      const user = await storage.applyAsStaff(userId, storeId);
      res.json(user);
    } catch (error) {
      console.error("Error applying as staff:", error);
      res.status(500).json({ message: "Failed to apply as staff" });
    }
  });

  return httpServer;
}

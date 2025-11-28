import { db } from "./db";
import { stores, meals, users } from "@shared/schema";
import { sql } from "drizzle-orm";

const sampleStores = [
  {
    name: "Mang Juan's Kitchen",
    description: "Home-cooked Filipino favorites prepared fresh daily. Known for our delicious adobo and sinigang!",
    category: "Filipino",
    bannerImageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop",
    isActive: true,
  },
  {
    name: "Fresh Bites Cafe",
    description: "Healthy and tasty options for the health-conscious student. Salads, wraps, and smoothie bowls!",
    category: "Healthy",
    bannerImageUrl: "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=800&h=400&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&h=100&fit=crop",
    isActive: true,
  },
  {
    name: "Burger Station",
    description: "Juicy burgers, crispy fries, and ice-cold drinks. The ultimate comfort food spot!",
    category: "Fast Food",
    bannerImageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=400&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop",
    isActive: true,
  },
  {
    name: "Noodle House",
    description: "Authentic Asian noodles from ramen to pad thai. Hot, slurpy, and satisfying!",
    category: "Asian",
    bannerImageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=400&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1552611052-33e04de081de?w=100&h=100&fit=crop",
    isActive: true,
  },
];

const sampleMeals: Record<string, { name: string; description: string; price: string; category: string; imageUrl: string }[]> = {
  "Mang Juan's Kitchen": [
    { name: "Chicken Adobo", description: "Classic Filipino chicken adobo with rice", price: "85.00", category: "Main Dish", imageUrl: "https://images.unsplash.com/photo-1624726175512-19b9baf9fbd1?w=400&h=400&fit=crop" },
    { name: "Pork Sinigang", description: "Sour tamarind soup with tender pork", price: "95.00", category: "Main Dish", imageUrl: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400&h=400&fit=crop" },
    { name: "Beef Kare-Kare", description: "Oxtail stew in peanut sauce", price: "120.00", category: "Main Dish", imageUrl: "https://images.unsplash.com/photo-1547928578-bca3e9c5a477?w=400&h=400&fit=crop" },
    { name: "Lumpiang Shanghai", description: "Crispy spring rolls (8 pcs)", price: "50.00", category: "Sides", imageUrl: "https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=400&h=400&fit=crop" },
    { name: "Halo-Halo", description: "Classic Filipino shaved ice dessert", price: "65.00", category: "Dessert", imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop" },
    { name: "Iced Tea", description: "Refreshing house-blend iced tea", price: "25.00", category: "Drinks", imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  ],
  "Fresh Bites Cafe": [
    { name: "Garden Salad Bowl", description: "Fresh greens with grilled chicken", price: "95.00", category: "Salads", imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop" },
    { name: "Chicken Wrap", description: "Grilled chicken in whole wheat wrap", price: "85.00", category: "Wraps", imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop" },
    { name: "Smoothie Bowl", description: "Acai berry bowl with fresh fruits", price: "110.00", category: "Bowls", imageUrl: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=400&fit=crop" },
    { name: "Avocado Toast", description: "Toasted sourdough with fresh avocado", price: "80.00", category: "Toast", imageUrl: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&h=400&fit=crop" },
    { name: "Green Smoothie", description: "Spinach, banana, and apple blend", price: "75.00", category: "Drinks", imageUrl: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=400&fit=crop" },
  ],
  "Burger Station": [
    { name: "Classic Cheeseburger", description: "Beef patty with cheddar cheese", price: "95.00", category: "Burgers", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop" },
    { name: "Bacon Double", description: "Double patty with crispy bacon", price: "135.00", category: "Burgers", imageUrl: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=400&fit=crop" },
    { name: "Chicken Burger", description: "Crispy fried chicken breast", price: "90.00", category: "Burgers", imageUrl: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop" },
    { name: "Crispy Fries", description: "Golden crispy potato fries", price: "45.00", category: "Sides", imageUrl: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400&h=400&fit=crop" },
    { name: "Onion Rings", description: "Crispy battered onion rings", price: "55.00", category: "Sides", imageUrl: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=400&fit=crop" },
    { name: "Vanilla Milkshake", description: "Creamy vanilla shake", price: "65.00", category: "Drinks", imageUrl: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&h=400&fit=crop" },
  ],
  "Noodle House": [
    { name: "Tonkotsu Ramen", description: "Rich pork bone broth with chashu", price: "145.00", category: "Ramen", imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop" },
    { name: "Miso Ramen", description: "Miso-based broth with egg", price: "130.00", category: "Ramen", imageUrl: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400&h=400&fit=crop" },
    { name: "Pad Thai", description: "Stir-fried rice noodles Thai style", price: "110.00", category: "Thai", imageUrl: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=400&fit=crop" },
    { name: "Beef Pho", description: "Vietnamese rice noodle soup", price: "120.00", category: "Vietnamese", imageUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=400&fit=crop" },
    { name: "Gyoza", description: "Japanese dumplings (6 pcs)", price: "65.00", category: "Sides", imageUrl: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=400&fit=crop" },
    { name: "Green Tea", description: "Hot Japanese green tea", price: "35.00", category: "Drinks", imageUrl: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=400&h=400&fit=crop" },
  ],
};

async function seed() {
  console.log("Seeding database...");

  try {
    // Check if we already have stores
    const existingStores = await db.select().from(stores);
    if (existingStores.length > 0) {
      console.log("Database already has stores. Skipping seed.");
      return;
    }

    // Insert stores
    for (const storeData of sampleStores) {
      const [newStore] = await db.insert(stores).values(storeData).returning();
      console.log(`Created store: ${newStore.name}`);

      // Insert meals for this store
      const storeMeals = sampleMeals[storeData.name];
      if (storeMeals) {
        for (const mealData of storeMeals) {
          await db.insert(meals).values({
            ...mealData,
            storeId: newStore.id,
            isAvailable: true,
          });
        }
        console.log(`  Added ${storeMeals.length} meals`);
      }
    }

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();

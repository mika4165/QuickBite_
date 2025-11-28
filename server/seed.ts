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

export interface FoodItem {
  name: string;
  unit: string; // "pc", "cup", "plate", "g", "slice", "glass", "bowl", "serving", "tbsp", "tsp", "scoop", "egg"
  defaultQty: number;
  caloriesPer: number; // per defaultQty
  proteinPer: number;
  carbsPer: number;
  fatPer: number;
  category: string;
}

export const FOOD_DATABASE: FoodItem[] = [
  // ==================== South Indian Breakfast (14) ====================
  { name: "Idli", unit: "pc", defaultQty: 1, caloriesPer: 65, proteinPer: 2, carbsPer: 13, fatPer: 0.5, category: "South Indian Breakfast" },
  { name: "Medu Vada", unit: "pc", defaultQty: 1, caloriesPer: 140, proteinPer: 5, carbsPer: 15, fatPer: 7, category: "South Indian Breakfast" },
  { name: "Plain Dosa", unit: "pc", defaultQty: 1, caloriesPer: 120, proteinPer: 3, carbsPer: 18, fatPer: 4, category: "South Indian Breakfast" },
  { name: "Masala Dosa", unit: "pc", defaultQty: 1, caloriesPer: 210, proteinPer: 5, carbsPer: 28, fatPer: 9, category: "South Indian Breakfast" },
  { name: "Rava Dosa", unit: "pc", defaultQty: 1, caloriesPer: 175, proteinPer: 3, carbsPer: 22, fatPer: 8, category: "South Indian Breakfast" },
  { name: "Set Dosa", unit: "pc", defaultQty: 1, caloriesPer: 95, proteinPer: 2, carbsPer: 16, fatPer: 3, category: "South Indian Breakfast" },
  { name: "Uttapam", unit: "pc", defaultQty: 1, caloriesPer: 160, proteinPer: 4, carbsPer: 22, fatPer: 6, category: "South Indian Breakfast" },
  { name: "Appam", unit: "pc", defaultQty: 1, caloriesPer: 115, proteinPer: 2, carbsPer: 18, fatPer: 4, category: "South Indian Breakfast" },
  { name: "Upma", unit: "cup", defaultQty: 1, caloriesPer: 210, proteinPer: 5, carbsPer: 32, fatPer: 7, category: "South Indian Breakfast" },
  { name: "Poha", unit: "cup", defaultQty: 1, caloriesPer: 180, proteinPer: 4, carbsPer: 34, fatPer: 4, category: "South Indian Breakfast" },
  { name: "Pongal", unit: "cup", defaultQty: 1, caloriesPer: 200, proteinPer: 5, carbsPer: 30, fatPer: 7, category: "South Indian Breakfast" },
  { name: "Sambar", unit: "cup", defaultQty: 1, caloriesPer: 130, proteinPer: 6, carbsPer: 18, fatPer: 3, category: "South Indian Breakfast" },
  { name: "Rasam", unit: "cup", defaultQty: 1, caloriesPer: 55, proteinPer: 2, carbsPer: 10, fatPer: 1, category: "South Indian Breakfast" },
  { name: "Coconut Chutney", unit: "tbsp", defaultQty: 2, caloriesPer: 50, proteinPer: 1, carbsPer: 3, fatPer: 4, category: "South Indian Breakfast" },

  // ==================== Breads (18) ====================
  { name: "Roti/Chapati", unit: "pc", defaultQty: 1, caloriesPer: 100, proteinPer: 3, carbsPer: 18, fatPer: 2, category: "Breads" },
  { name: "Phulka", unit: "pc", defaultQty: 1, caloriesPer: 80, proteinPer: 3, carbsPer: 16, fatPer: 1, category: "Breads" },
  { name: "Paratha plain", unit: "pc", defaultQty: 1, caloriesPer: 260, proteinPer: 5, carbsPer: 36, fatPer: 10, category: "Breads" },
  { name: "Aloo Paratha", unit: "pc", defaultQty: 1, caloriesPer: 320, proteinPer: 6, carbsPer: 42, fatPer: 14, category: "Breads" },
  { name: "Gobi Paratha", unit: "pc", defaultQty: 1, caloriesPer: 290, proteinPer: 6, carbsPer: 38, fatPer: 12, category: "Breads" },
  { name: "Paneer Paratha", unit: "pc", defaultQty: 1, caloriesPer: 340, proteinPer: 10, carbsPer: 36, fatPer: 16, category: "Breads" },
  { name: "Naan", unit: "pc", defaultQty: 1, caloriesPer: 260, proteinPer: 7, carbsPer: 40, fatPer: 8, category: "Breads" },
  { name: "Butter Naan", unit: "pc", defaultQty: 1, caloriesPer: 310, proteinPer: 7, carbsPer: 40, fatPer: 14, category: "Breads" },
  { name: "Garlic Naan", unit: "pc", defaultQty: 1, caloriesPer: 300, proteinPer: 8, carbsPer: 42, fatPer: 12, category: "Breads" },
  { name: "Kulcha", unit: "pc", defaultQty: 1, caloriesPer: 280, proteinPer: 7, carbsPer: 38, fatPer: 10, category: "Breads" },
  { name: "Puri", unit: "pc", defaultQty: 1, caloriesPer: 125, proteinPer: 2, carbsPer: 14, fatPer: 7, category: "Breads" },
  { name: "Bhatura", unit: "pc", defaultQty: 1, caloriesPer: 310, proteinPer: 5, carbsPer: 38, fatPer: 15, category: "Breads" },
  { name: "White Bread", unit: "slice", defaultQty: 1, caloriesPer: 70, proteinPer: 2, carbsPer: 13, fatPer: 1, category: "Breads" },
  { name: "Brown Bread", unit: "slice", defaultQty: 1, caloriesPer: 75, proteinPer: 3, carbsPer: 13, fatPer: 1, category: "Breads" },
  { name: "Multigrain Bread", unit: "slice", defaultQty: 1, caloriesPer: 80, proteinPer: 4, carbsPer: 14, fatPer: 1.5, category: "Breads" },
  { name: "Sourdough", unit: "slice", defaultQty: 1, caloriesPer: 90, proteinPer: 3, carbsPer: 16, fatPer: 1, category: "Breads" },
  { name: "Toast with butter", unit: "slice", defaultQty: 1, caloriesPer: 110, proteinPer: 2, carbsPer: 13, fatPer: 5, category: "Breads" },
  { name: "Bread Sandwich veg", unit: "pc", defaultQty: 1, caloriesPer: 280, proteinPer: 8, carbsPer: 32, fatPer: 14, category: "Breads" },

  // ==================== Rice (10) ====================
  { name: "White Rice steamed", unit: "cup", defaultQty: 1, caloriesPer: 200, proteinPer: 4, carbsPer: 44, fatPer: 1, category: "Rice" },
  { name: "Brown Rice", unit: "cup", defaultQty: 1, caloriesPer: 215, proteinPer: 5, carbsPer: 44, fatPer: 2, category: "Rice" },
  { name: "Jeera Rice", unit: "cup", defaultQty: 1, caloriesPer: 230, proteinPer: 4, carbsPer: 42, fatPer: 6, category: "Rice" },
  { name: "Lemon Rice", unit: "cup", defaultQty: 1, caloriesPer: 250, proteinPer: 4, carbsPer: 44, fatPer: 7, category: "Rice" },
  { name: "Curd Rice", unit: "cup", defaultQty: 1, caloriesPer: 220, proteinPer: 6, carbsPer: 36, fatPer: 5, category: "Rice" },
  { name: "Biryani chicken", unit: "plate", defaultQty: 1, caloriesPer: 490, proteinPer: 22, carbsPer: 56, fatPer: 18, category: "Rice" },
  { name: "Biryani veg", unit: "plate", defaultQty: 1, caloriesPer: 400, proteinPer: 10, carbsPer: 56, fatPer: 14, category: "Rice" },
  { name: "Biryani mutton", unit: "plate", defaultQty: 1, caloriesPer: 550, proteinPer: 24, carbsPer: 52, fatPer: 24, category: "Rice" },
  { name: "Pulao veg", unit: "plate", defaultQty: 1, caloriesPer: 350, proteinPer: 8, carbsPer: 52, fatPer: 12, category: "Rice" },
  { name: "Fried Rice", unit: "plate", defaultQty: 1, caloriesPer: 380, proteinPer: 8, carbsPer: 50, fatPer: 16, category: "Rice" },

  // ==================== Dal & Legumes (10) ====================
  { name: "Toor Dal", unit: "cup", defaultQty: 1, caloriesPer: 180, proteinPer: 12, carbsPer: 28, fatPer: 2, category: "Dal & Legumes" },
  { name: "Moong Dal", unit: "cup", defaultQty: 1, caloriesPer: 160, proteinPer: 11, carbsPer: 26, fatPer: 1, category: "Dal & Legumes" },
  { name: "Masoor Dal", unit: "cup", defaultQty: 1, caloriesPer: 170, proteinPer: 12, carbsPer: 27, fatPer: 1, category: "Dal & Legumes" },
  { name: "Dal Tadka", unit: "cup", defaultQty: 1, caloriesPer: 200, proteinPer: 12, carbsPer: 26, fatPer: 5, category: "Dal & Legumes" },
  { name: "Dal Makhani", unit: "cup", defaultQty: 1, caloriesPer: 280, proteinPer: 12, carbsPer: 28, fatPer: 14, category: "Dal & Legumes" },
  { name: "Rajma", unit: "cup", defaultQty: 1, caloriesPer: 210, proteinPer: 13, carbsPer: 36, fatPer: 2, category: "Dal & Legumes" },
  { name: "Chole", unit: "cup", defaultQty: 1, caloriesPer: 240, proteinPer: 12, carbsPer: 34, fatPer: 6, category: "Dal & Legumes" },
  { name: "Kadhi", unit: "cup", defaultQty: 1, caloriesPer: 160, proteinPer: 6, carbsPer: 14, fatPer: 8, category: "Dal & Legumes" },
  { name: "Sprouts boiled", unit: "cup", defaultQty: 1, caloriesPer: 100, proteinPer: 8, carbsPer: 14, fatPer: 1, category: "Dal & Legumes" },
  { name: "Sprouts salad", unit: "cup", defaultQty: 1, caloriesPer: 110, proteinPer: 8, carbsPer: 14, fatPer: 2, category: "Dal & Legumes" },

  // ==================== Eggs (9) ====================
  { name: "Whole Egg boiled", unit: "pc", defaultQty: 1, caloriesPer: 72, proteinPer: 6, carbsPer: 0.5, fatPer: 5, category: "Eggs" },
  { name: "Egg White boiled", unit: "pc", defaultQty: 1, caloriesPer: 17, proteinPer: 3.6, carbsPer: 0.2, fatPer: 0, category: "Eggs" },
  { name: "Whole Egg Omelette", unit: "pc", defaultQty: 1, caloriesPer: 90, proteinPer: 6, carbsPer: 0.5, fatPer: 7, category: "Eggs" },
  { name: "Egg White Omelette", unit: "pc", defaultQty: 1, caloriesPer: 28, proteinPer: 4, carbsPer: 0.3, fatPer: 1, category: "Eggs" },
  { name: "Whole Egg Bhurji", unit: "pc", defaultQty: 1, caloriesPer: 95, proteinPer: 6, carbsPer: 1, fatPer: 7, category: "Eggs" },
  { name: "Egg White Bhurji", unit: "pc", defaultQty: 1, caloriesPer: 30, proteinPer: 4, carbsPer: 0.5, fatPer: 1, category: "Eggs" },
  { name: "Fried Egg", unit: "pc", defaultQty: 1, caloriesPer: 110, proteinPer: 6, carbsPer: 0.5, fatPer: 9, category: "Eggs" },
  { name: "Egg Curry", unit: "egg", defaultQty: 2, caloriesPer: 120, proteinPer: 7, carbsPer: 4, fatPer: 8, category: "Eggs" },
  { name: "Egg Fried Rice", unit: "plate", defaultQty: 1, caloriesPer: 420, proteinPer: 14, carbsPer: 52, fatPer: 18, category: "Eggs" },

  // ==================== Meat & Fish (12) ====================
  { name: "Chicken Breast grilled", unit: "g", defaultQty: 100, caloriesPer: 165, proteinPer: 31, carbsPer: 0, fatPer: 4, category: "Meat & Fish" },
  { name: "Chicken Thigh cooked", unit: "g", defaultQty: 100, caloriesPer: 210, proteinPer: 26, carbsPer: 0, fatPer: 11, category: "Meat & Fish" },
  { name: "Chicken Curry", unit: "cup", defaultQty: 1, caloriesPer: 280, proteinPer: 22, carbsPer: 10, fatPer: 18, category: "Meat & Fish" },
  { name: "Butter Chicken", unit: "cup", defaultQty: 1, caloriesPer: 340, proteinPer: 24, carbsPer: 12, fatPer: 22, category: "Meat & Fish" },
  { name: "Chicken Tikka", unit: "pc", defaultQty: 3, caloriesPer: 60, proteinPer: 8, carbsPer: 1, fatPer: 3, category: "Meat & Fish" },
  { name: "Tandoori Chicken", unit: "pc", defaultQty: 1, caloriesPer: 220, proteinPer: 28, carbsPer: 4, fatPer: 10, category: "Meat & Fish" },
  { name: "Chicken 65", unit: "serving", defaultQty: 1, caloriesPer: 320, proteinPer: 20, carbsPer: 18, fatPer: 18, category: "Meat & Fish" },
  { name: "Keema mutton", unit: "cup", defaultQty: 1, caloriesPer: 340, proteinPer: 22, carbsPer: 8, fatPer: 24, category: "Meat & Fish" },
  { name: "Mutton Curry", unit: "cup", defaultQty: 1, caloriesPer: 360, proteinPer: 24, carbsPer: 10, fatPer: 26, category: "Meat & Fish" },
  { name: "Fish Curry", unit: "cup", defaultQty: 1, caloriesPer: 220, proteinPer: 24, carbsPer: 8, fatPer: 10, category: "Meat & Fish" },
  { name: "Fish Fry", unit: "pc", defaultQty: 1, caloriesPer: 180, proteinPer: 18, carbsPer: 8, fatPer: 9, category: "Meat & Fish" },
  { name: "Prawn Masala", unit: "cup", defaultQty: 1, caloriesPer: 200, proteinPer: 20, carbsPer: 8, fatPer: 10, category: "Meat & Fish" },

  // ==================== Paneer & Veg (12) ====================
  { name: "Paneer raw", unit: "g", defaultQty: 100, caloriesPer: 260, proteinPer: 18, carbsPer: 4, fatPer: 20, category: "Paneer & Veg" },
  { name: "Paneer Tikka", unit: "pc", defaultQty: 1, caloriesPer: 60, proteinPer: 4, carbsPer: 1, fatPer: 5, category: "Paneer & Veg" },
  { name: "Palak Paneer", unit: "cup", defaultQty: 1, caloriesPer: 240, proteinPer: 14, carbsPer: 10, fatPer: 16, category: "Paneer & Veg" },
  { name: "Paneer Butter Masala", unit: "cup", defaultQty: 1, caloriesPer: 320, proteinPer: 14, carbsPer: 12, fatPer: 24, category: "Paneer & Veg" },
  { name: "Kadai Paneer", unit: "cup", defaultQty: 1, caloriesPer: 290, proteinPer: 14, carbsPer: 10, fatPer: 20, category: "Paneer & Veg" },
  { name: "Aloo Gobi", unit: "cup", defaultQty: 1, caloriesPer: 180, proteinPer: 4, carbsPer: 22, fatPer: 8, category: "Paneer & Veg" },
  { name: "Bhindi Masala", unit: "cup", defaultQty: 1, caloriesPer: 140, proteinPer: 3, carbsPer: 12, fatPer: 9, category: "Paneer & Veg" },
  { name: "Baingan Bharta", unit: "cup", defaultQty: 1, caloriesPer: 160, proteinPer: 3, carbsPer: 14, fatPer: 10, category: "Paneer & Veg" },
  { name: "Mixed Veg Curry", unit: "cup", defaultQty: 1, caloriesPer: 150, proteinPer: 4, carbsPer: 16, fatPer: 7, category: "Paneer & Veg" },
  { name: "Palak/Saag", unit: "cup", defaultQty: 1, caloriesPer: 120, proteinPer: 4, carbsPer: 8, fatPer: 8, category: "Paneer & Veg" },
  { name: "Malai Kofta", unit: "cup", defaultQty: 1, caloriesPer: 380, proteinPer: 10, carbsPer: 22, fatPer: 28, category: "Paneer & Veg" },
  { name: "Dal Palak", unit: "cup", defaultQty: 1, caloriesPer: 170, proteinPer: 10, carbsPer: 22, fatPer: 4, category: "Paneer & Veg" },

  // ==================== Street Food (12) ====================
  { name: "Samosa", unit: "pc", defaultQty: 1, caloriesPer: 240, proteinPer: 4, carbsPer: 26, fatPer: 14, category: "Street Food" },
  { name: "Vada Pav", unit: "pc", defaultQty: 1, caloriesPer: 290, proteinPer: 5, carbsPer: 38, fatPer: 13, category: "Street Food" },
  { name: "Pav Bhaji", unit: "plate", defaultQty: 1, caloriesPer: 420, proteinPer: 10, carbsPer: 52, fatPer: 20, category: "Street Food" },
  { name: "Pani Puri 6pcs", unit: "plate", defaultQty: 1, caloriesPer: 180, proteinPer: 3, carbsPer: 30, fatPer: 6, category: "Street Food" },
  { name: "Bhel Puri", unit: "plate", defaultQty: 1, caloriesPer: 220, proteinPer: 5, carbsPer: 34, fatPer: 8, category: "Street Food" },
  { name: "Sev Puri", unit: "plate", defaultQty: 1, caloriesPer: 240, proteinPer: 4, carbsPer: 30, fatPer: 12, category: "Street Food" },
  { name: "Kachori", unit: "pc", defaultQty: 1, caloriesPer: 220, proteinPer: 4, carbsPer: 24, fatPer: 12, category: "Street Food" },
  { name: "Aloo Tikki", unit: "pc", defaultQty: 1, caloriesPer: 160, proteinPer: 3, carbsPer: 20, fatPer: 8, category: "Street Food" },
  { name: "Dabeli", unit: "pc", defaultQty: 1, caloriesPer: 250, proteinPer: 5, carbsPer: 34, fatPer: 10, category: "Street Food" },
  { name: "Frankie/Wrap", unit: "pc", defaultQty: 1, caloriesPer: 340, proteinPer: 12, carbsPer: 38, fatPer: 16, category: "Street Food" },
  { name: "Momos steamed 6pcs", unit: "plate", defaultQty: 1, caloriesPer: 240, proteinPer: 10, carbsPer: 30, fatPer: 8, category: "Street Food" },
  { name: "Momos fried 6pcs", unit: "plate", defaultQty: 1, caloriesPer: 360, proteinPer: 10, carbsPer: 30, fatPer: 20, category: "Street Food" },

  // ==================== Dairy (12) ====================
  { name: "Curd/Yogurt", unit: "cup", defaultQty: 1, caloriesPer: 100, proteinPer: 8, carbsPer: 8, fatPer: 4, category: "Dairy" },
  { name: "Greek Yogurt", unit: "cup", defaultQty: 1, caloriesPer: 130, proteinPer: 15, carbsPer: 6, fatPer: 4, category: "Dairy" },
  { name: "Raita", unit: "cup", defaultQty: 1, caloriesPer: 80, proteinPer: 4, carbsPer: 6, fatPer: 4, category: "Dairy" },
  { name: "Lassi sweet", unit: "glass", defaultQty: 1, caloriesPer: 180, proteinPer: 6, carbsPer: 28, fatPer: 4, category: "Dairy" },
  { name: "Lassi salted", unit: "glass", defaultQty: 1, caloriesPer: 90, proteinPer: 6, carbsPer: 8, fatPer: 3, category: "Dairy" },
  { name: "Buttermilk/Chaas", unit: "glass", defaultQty: 1, caloriesPer: 40, proteinPer: 3, carbsPer: 4, fatPer: 1, category: "Dairy" },
  { name: "Milk full cream", unit: "glass", defaultQty: 1, caloriesPer: 150, proteinPer: 8, carbsPer: 12, fatPer: 8, category: "Dairy" },
  { name: "Milk toned", unit: "glass", defaultQty: 1, caloriesPer: 110, proteinPer: 8, carbsPer: 12, fatPer: 3, category: "Dairy" },
  { name: "Milk skimmed", unit: "glass", defaultQty: 1, caloriesPer: 80, proteinPer: 8, carbsPer: 12, fatPer: 0.5, category: "Dairy" },
  { name: "Ghee", unit: "tsp", defaultQty: 1, caloriesPer: 45, proteinPer: 0, carbsPer: 0, fatPer: 5, category: "Dairy" },
  { name: "Butter", unit: "tsp", defaultQty: 1, caloriesPer: 36, proteinPer: 0, carbsPer: 0, fatPer: 4, category: "Dairy" },
  { name: "Cheese slice", unit: "pc", defaultQty: 1, caloriesPer: 70, proteinPer: 4, carbsPer: 1, fatPer: 5, category: "Dairy" },

  // ==================== Beverages (12) ====================
  { name: "Chai with sugar", unit: "cup", defaultQty: 1, caloriesPer: 80, proteinPer: 2, carbsPer: 12, fatPer: 3, category: "Beverages" },
  { name: "Chai no sugar", unit: "cup", defaultQty: 1, caloriesPer: 40, proteinPer: 2, carbsPer: 4, fatPer: 2, category: "Beverages" },
  { name: "Green Tea", unit: "cup", defaultQty: 1, caloriesPer: 2, proteinPer: 0, carbsPer: 0, fatPer: 0, category: "Beverages" },
  { name: "Black Coffee", unit: "cup", defaultQty: 1, caloriesPer: 5, proteinPer: 0, carbsPer: 1, fatPer: 0, category: "Beverages" },
  { name: "Coffee with Milk", unit: "cup", defaultQty: 1, caloriesPer: 60, proteinPer: 2, carbsPer: 6, fatPer: 3, category: "Beverages" },
  { name: "Filter Coffee", unit: "cup", defaultQty: 1, caloriesPer: 90, proteinPer: 2, carbsPer: 10, fatPer: 4, category: "Beverages" },
  { name: "Cappuccino", unit: "cup", defaultQty: 1, caloriesPer: 120, proteinPer: 4, carbsPer: 12, fatPer: 5, category: "Beverages" },
  { name: "Latte", unit: "cup", defaultQty: 1, caloriesPer: 150, proteinPer: 5, carbsPer: 14, fatPer: 6, category: "Beverages" },
  { name: "Coconut Water", unit: "glass", defaultQty: 1, caloriesPer: 45, proteinPer: 0, carbsPer: 10, fatPer: 0, category: "Beverages" },
  { name: "Lime Soda", unit: "glass", defaultQty: 1, caloriesPer: 80, proteinPer: 0, carbsPer: 20, fatPer: 0, category: "Beverages" },
  { name: "Mango Lassi", unit: "glass", defaultQty: 1, caloriesPer: 240, proteinPer: 6, carbsPer: 38, fatPer: 6, category: "Beverages" },
  { name: "Protein Shake whey", unit: "glass", defaultQty: 1, caloriesPer: 150, proteinPer: 25, carbsPer: 8, fatPer: 2, category: "Beverages" },

  // ==================== Fruits (10) ====================
  { name: "Banana", unit: "pc", defaultQty: 1, caloriesPer: 105, proteinPer: 1, carbsPer: 27, fatPer: 0.4, category: "Fruits" },
  { name: "Apple", unit: "pc", defaultQty: 1, caloriesPer: 95, proteinPer: 0.5, carbsPer: 25, fatPer: 0.3, category: "Fruits" },
  { name: "Mango", unit: "cup", defaultQty: 1, caloriesPer: 100, proteinPer: 1, carbsPer: 25, fatPer: 0.5, category: "Fruits" },
  { name: "Papaya", unit: "cup", defaultQty: 1, caloriesPer: 55, proteinPer: 1, carbsPer: 14, fatPer: 0.3, category: "Fruits" },
  { name: "Watermelon", unit: "cup", defaultQty: 1, caloriesPer: 46, proteinPer: 1, carbsPer: 12, fatPer: 0.2, category: "Fruits" },
  { name: "Orange", unit: "pc", defaultQty: 1, caloriesPer: 65, proteinPer: 1, carbsPer: 16, fatPer: 0.3, category: "Fruits" },
  { name: "Pomegranate", unit: "cup", defaultQty: 1, caloriesPer: 80, proteinPer: 1.5, carbsPer: 18, fatPer: 1, category: "Fruits" },
  { name: "Guava", unit: "pc", defaultQty: 1, caloriesPer: 55, proteinPer: 2, carbsPer: 12, fatPer: 1, category: "Fruits" },
  { name: "Grapes", unit: "cup", defaultQty: 1, caloriesPer: 62, proteinPer: 0.6, carbsPer: 16, fatPer: 0.3, category: "Fruits" },
  { name: "Chikoo/Sapota", unit: "pc", defaultQty: 1, caloriesPer: 100, proteinPer: 0.5, carbsPer: 24, fatPer: 1, category: "Fruits" },

  // ==================== Nuts & Seeds (8) ====================
  { name: "Almonds", unit: "pc", defaultQty: 1, caloriesPer: 7, proteinPer: 0.3, carbsPer: 0.2, fatPer: 0.6, category: "Nuts & Seeds" },
  { name: "Cashews", unit: "pc", defaultQty: 1, caloriesPer: 9, proteinPer: 0.3, carbsPer: 0.5, fatPer: 0.7, category: "Nuts & Seeds" },
  { name: "Walnuts half", unit: "pc", defaultQty: 1, caloriesPer: 13, proteinPer: 0.3, carbsPer: 0.3, fatPer: 1.3, category: "Nuts & Seeds" },
  { name: "Peanuts roasted", unit: "g", defaultQty: 30, caloriesPer: 170, proteinPer: 7, carbsPer: 5, fatPer: 14, category: "Nuts & Seeds" },
  { name: "Peanut Butter", unit: "tbsp", defaultQty: 1, caloriesPer: 95, proteinPer: 4, carbsPer: 3, fatPer: 8, category: "Nuts & Seeds" },
  { name: "Mixed Dry Fruits", unit: "g", defaultQty: 30, caloriesPer: 160, proteinPer: 4, carbsPer: 10, fatPer: 12, category: "Nuts & Seeds" },
  { name: "Chia Seeds", unit: "tbsp", defaultQty: 1, caloriesPer: 58, proteinPer: 2, carbsPer: 5, fatPer: 4, category: "Nuts & Seeds" },
  { name: "Flax Seeds", unit: "tbsp", defaultQty: 1, caloriesPer: 55, proteinPer: 2, carbsPer: 3, fatPer: 4, category: "Nuts & Seeds" },

  // ==================== Oats & Cereal (4) ====================
  { name: "Oats cooked", unit: "cup", defaultQty: 1, caloriesPer: 150, proteinPer: 5, carbsPer: 27, fatPer: 3, category: "Oats & Cereal" },
  { name: "Muesli + Milk", unit: "bowl", defaultQty: 1, caloriesPer: 280, proteinPer: 8, carbsPer: 42, fatPer: 8, category: "Oats & Cereal" },
  { name: "Cornflakes + Milk", unit: "bowl", defaultQty: 1, caloriesPer: 220, proteinPer: 6, carbsPer: 40, fatPer: 4, category: "Oats & Cereal" },
  { name: "Granola", unit: "cup", defaultQty: 0.5, caloriesPer: 200, proteinPer: 4, carbsPer: 28, fatPer: 8, category: "Oats & Cereal" },

  // ==================== Sweets (6) ====================
  { name: "Gulab Jamun", unit: "pc", defaultQty: 1, caloriesPer: 150, proteinPer: 2, carbsPer: 22, fatPer: 6, category: "Sweets" },
  { name: "Rasgulla", unit: "pc", defaultQty: 1, caloriesPer: 120, proteinPer: 2, carbsPer: 24, fatPer: 2, category: "Sweets" },
  { name: "Jalebi", unit: "pc", defaultQty: 1, caloriesPer: 150, proteinPer: 1, carbsPer: 26, fatPer: 5, category: "Sweets" },
  { name: "Ladoo besan", unit: "pc", defaultQty: 1, caloriesPer: 180, proteinPer: 3, carbsPer: 20, fatPer: 10, category: "Sweets" },
  { name: "Kheer", unit: "cup", defaultQty: 1, caloriesPer: 250, proteinPer: 6, carbsPer: 36, fatPer: 8, category: "Sweets" },
  { name: "Ice Cream", unit: "scoop", defaultQty: 1, caloriesPer: 140, proteinPer: 2, carbsPer: 16, fatPer: 7, category: "Sweets" },

  // ==================== Chinese/Indo-Chinese (6) ====================
  { name: "Hakka Noodles", unit: "plate", defaultQty: 1, caloriesPer: 400, proteinPer: 10, carbsPer: 52, fatPer: 16, category: "Chinese/Indo-Chinese" },
  { name: "Manchurian dry", unit: "serving", defaultQty: 1, caloriesPer: 280, proteinPer: 8, carbsPer: 28, fatPer: 14, category: "Chinese/Indo-Chinese" },
  { name: "Chilli Chicken", unit: "serving", defaultQty: 1, caloriesPer: 320, proteinPer: 20, carbsPer: 18, fatPer: 18, category: "Chinese/Indo-Chinese" },
  { name: "Spring Roll", unit: "pc", defaultQty: 1, caloriesPer: 110, proteinPer: 3, carbsPer: 12, fatPer: 6, category: "Chinese/Indo-Chinese" },
  { name: "Fried Rice veg", unit: "plate", defaultQty: 1, caloriesPer: 380, proteinPer: 8, carbsPer: 50, fatPer: 16, category: "Chinese/Indo-Chinese" },
  { name: "Schezwan Noodles", unit: "plate", defaultQty: 1, caloriesPer: 420, proteinPer: 10, carbsPer: 54, fatPer: 18, category: "Chinese/Indo-Chinese" },

  // ==================== Supplements (3) ====================
  { name: "Whey Protein scoop", unit: "scoop", defaultQty: 1, caloriesPer: 120, proteinPer: 24, carbsPer: 3, fatPer: 1, category: "Supplements" },
  { name: "Casein Protein", unit: "scoop", defaultQty: 1, caloriesPer: 110, proteinPer: 22, carbsPer: 4, fatPer: 1, category: "Supplements" },
  { name: "BCAA", unit: "serving", defaultQty: 1, caloriesPer: 10, proteinPer: 2, carbsPer: 0, fatPer: 0, category: "Supplements" },
];

export function searchFoods(query: string, limit: number = 8): FoodItem[] {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();
  const startsWithMatches: FoodItem[] = [];
  const substringMatches: FoodItem[] = [];

  for (const food of FOOD_DATABASE) {
    const name = food.name.toLowerCase();
    if (name.startsWith(q)) {
      startsWithMatches.push(food);
    } else if (name.includes(q)) {
      substringMatches.push(food);
    }
  }

  return [...startsWithMatches, ...substringMatches].slice(0, limit);
}

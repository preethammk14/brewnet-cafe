export type Size = 'Small' | 'Medium' | 'Large';
export type Temperature = 'Hot' | 'Iced' | 'Blended';
export type MilkType = 'Whole' | 'Oat' | 'Almond' | 'Skim' | 'Coconut' | 'None';
export type SyrupType = 'Vanilla' | 'Caramel' | 'Hazelnut' | 'Sugar-Free Vanilla' | 'Chai' | 'Mocha';

export interface CustomizationSelection {
  size: Size;
  temperature?: Temperature;
  milk?: MilkType;
  shots?: number;
  syrups?: SyrupType[];
  sweetness?: '0%' | '50%' | '100%' | '120%';
  extraWhippedCream?: boolean;
  notes?: string;
}

export type Category = 
  | 'All'
  | 'Espresso & Coffee'
  | 'Cold Brew & Refreshers'
  | 'Artisanal Teas'
  | 'Bakery & Pastries'
  | 'Breakfast & Savory'
  | 'Desserts';

export type DietaryTag = 'Vegan' | 'Gluten-Free' | 'Nut-Free' | 'Dairy-Free' | 'Organic';

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  description: string;
  price: number;
  imageUrl: string;
  isPopular?: boolean;
  dietary?: DietaryTag[];
  allowTemperature?: boolean;
  allowMilk?: boolean;
  allowShots?: boolean;
  allowSyrups?: boolean;
  available: boolean;
  calories?: number;
}

export interface CartItem {
  cartItemId: string;
  menuItem: MenuItem;
  customization: CustomizationSelection;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderType = 'Dine-In' | 'Takeout' | 'Curbside';

export type OrderStatus = 'Received' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail?: string;
  orderType: OrderType;
  tableNumber?: string;
  items: {
    cartItemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    customizationSummary: string;
  }[];
  subtotal: number;
  tax: number;
  tip: number;
  totalPrice: number;
  status: OrderStatus;
  paymentMethod: 'Credit Card' | 'Apple Pay' | 'Google Pay' | 'Cash at Counter';
  qrCodeData: string;
  createdAt: string; // ISO date string
  estimatedMinutes?: number;
  notes?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  rewardPoints: number;
  role?: 'customer' | 'staff';
  createdAt: string;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, getDocs, doc, setDoc, updateDoc, increment, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import {
  MenuItem,
  Category,
  DietaryTag,
  CartItem,
  CustomizationSelection,
  Order,
  OrderType,
  OrderStatus,
  UserProfile,
} from './types';
import { INITIAL_MENU_ITEMS } from './data/initialMenu';

import { Header } from './components/Header';
import { BannerQR } from './components/BannerQR';
import { CategoryNav } from './components/CategoryNav';
import { MenuItemCard } from './components/MenuItemCard';
import { ItemCustomizationModal } from './components/ItemCustomizationModal';
import { CartDrawer } from './components/CartDrawer';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { QRGeneratorModal } from './components/QRGeneratorModal';
import { KitchenDashboard } from './components/KitchenDashboard';
import { AuthModal } from './components/AuthModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { Sparkles, Coffee, Flame, Heart, ChevronRight, Clock } from 'lucide-react';

const CATEGORIES: Category[] = [
  'All',
  'Espresso & Coffee',
  'Cold Brew & Refreshers',
  'Artisanal Teas',
  'Bakery & Pastries',
  'Breakfast & Savory',
  'Desserts',
];

export default function App() {
  // Menu State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDietary, setSelectedDietary] = useState<DietaryTag[]>([]);
  const [showPopularOnly, setShowPopularOnly] = useState<boolean>(false);

  // Customization & Cart State
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItem | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Table QR State
  const [selectedTable, setSelectedTableState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tableParam = params.get('table') || params.get('qr');
      if (tableParam) return tableParam;
      return localStorage.getItem('brewnet_selected_table') || null;
    }
    return null;
  });

  const setSelectedTable = (table: string | null) => {
    setSelectedTableState(table);
    if (table) {
      localStorage.setItem('brewnet_selected_table', table);
    } else {
      localStorage.removeItem('brewnet_selected_table');
    }
  };

  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);

  // Active Submitted Order State
  const [activeConfirmedOrder, setActiveConfirmedOrder] = useState<Order | null>(null);
  const [latestOrderId, setLatestOrderId] = useState<string | null>(() => {
    return localStorage.getItem('brewnet_latest_order_id') || null;
  });
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState<boolean>(false);
  const [noOrderToast, setNoOrderToast] = useState<boolean>(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);

  // Auth & User Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // Barista / Kitchen Board Mode
  const [isKitchenMode, setIsKitchenMode] = useState<boolean>(false);

  // Parse URL query parameter for QR Table ordering (e.g. ?table=05)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table') || params.get('qr');
    if (tableParam) {
      setSelectedTable(tableParam);
    }
  }, []);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch or listen to user document in Firestore
        const userRef = doc(db, 'users', user.uid);
        onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setCurrentUser({
              ...(data as UserProfile),
              role: data.role || 'customer',
            });
          } else {
            const newProf: UserProfile = {
              uid: user.uid,
              email: user.email || null,
              displayName: user.displayName || 'Coffee Enthusiast',
              rewardPoints: 50,
              role: 'customer',
              createdAt: new Date().toISOString(),
            };
            setDoc(userRef, newProf).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
            setCurrentUser(newProf);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Firestore Menu Sync & Auto-Seed
  useEffect(() => {
    const menuColRef = collection(db, 'menu_items');

    const syncMenu = async () => {
      try {
        for (const item of INITIAL_MENU_ITEMS) {
          await setDoc(doc(db, 'menu_items', item.id), item, { merge: true });
        }
      } catch (e) {
        console.warn('Firestore menu seed check fallback:', e);
      }
    };

    syncMenu();

    // Live listener for menu items from Firestore
    const unsubscribe = onSnapshot(menuColRef, (snapshot) => {
      if (!snapshot.empty) {
        const items: MenuItem[] = [];
        snapshot.forEach((d) => items.push(d.data() as MenuItem));
        setMenuItems(items);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'menu_items'));

    return () => unsubscribe();
  }, []);

  // Real-time listener for latest active order status updates from Firestore
  useEffect(() => {
    if (!latestOrderId) return;

    const orderRef = doc(db, 'orders', latestOrderId);
    const unsubscribe = onSnapshot(
      orderRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setActiveConfirmedOrder({ id: snapshot.id, ...(snapshot.data() as Omit<Order, 'id'>) });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `orders/${latestOrderId}`)
    );

    return () => unsubscribe();
  }, [latestOrderId]);

  // Open Order Tracker or fetch user's latest active order
  const handleOpenTrackOrder = async () => {
    if (activeConfirmedOrder || latestOrderId) {
      setIsOrderTrackerOpen(true);
      return;
    }

    const effectiveUid = currentUser?.uid || auth.currentUser?.uid;

    if (effectiveUid) {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', effectiveUid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list: Order[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const ord = list[0];
          setLatestOrderId(ord.id);
          localStorage.setItem('brewnet_latest_order_id', ord.id);
          setActiveConfirmedOrder(ord);
          setIsOrderTrackerOpen(true);
          return;
        }
      } catch (e) {
        console.error('Error fetching user order:', e);
      }
    }

    setNoOrderToast(true);
    setTimeout(() => setNoOrderToast(false), 4000);
  };

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (showPopularOnly && !item.isPopular) return false;
      if (selectedDietary.length > 0) {
        const hasAllTags = selectedDietary.every((tag) => item.dietary?.includes(tag));
        if (!hasAllTags) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(q);
        const descMatch = item.description.toLowerCase().includes(q);
        const catMatch = item.category.toLowerCase().includes(q);
        return nameMatch || descMatch || catMatch;
      }
      return true;
    });
  }, [menuItems, selectedCategory, showPopularOnly, selectedDietary, searchQuery]);

  // Cart Operations
  const handleAddToCart = (
    item: MenuItem,
    customization: CustomizationSelection,
    quantity: number,
    calculatedUnitPrice: number
  ) => {
    const cartItemId = `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newCartItem: CartItem = {
      cartItemId,
      menuItem: item,
      customization,
      quantity,
      unitPrice: calculatedUnitPrice,
      totalPrice: calculatedUnitPrice * quantity,
    };

    setCartItems((prev) => [...prev, newCartItem]);
  };

  const handleQuickAdd = (item: MenuItem) => {
    const defaultCust: CustomizationSelection = {
      size: 'Medium',
      temperature: item.allowTemperature ? 'Hot' : undefined,
      milk: item.allowMilk ? 'Oat' : undefined,
      sweetness: item.allowMilk || item.allowSyrups ? '100%' : undefined,
    };
    handleAddToCart(item, defaultCust, 1, item.price);
  };

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((it) =>
        it.cartItemId === cartItemId
          ? { ...it, quantity: newQty, totalPrice: it.unitPrice * newQty }
          : it
      )
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((it) => it.cartItemId !== cartItemId));
  };

  const handleToggleDietary = (tag: DietaryTag) => {
    setSelectedDietary((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Submit Order to Firestore
  const handlePlaceOrder = async (orderData: {
    customerName: string;
    orderType: OrderType;
    tableNumber?: string;
    paymentMethod: 'Credit Card' | 'Apple Pay' | 'Google Pay' | 'Cash at Counter';
    tip: number;
    notes?: string;
  }) => {
    setIsSubmittingOrder(true);

    try {
      const subtotal = cartItems.reduce((acc, i) => acc + i.totalPrice, 0);
      const tax = subtotal * 0.08;
      const totalPrice = subtotal + tax + orderData.tip;

      const effectiveTableNumber = orderData.orderType === 'Dine-In'
        ? (orderData.tableNumber || selectedTable || '05')
        : null;

      if (effectiveTableNumber) {
        setSelectedTable(effectiveTableNumber);
      }

      // Construct clean payload ensuring NO undefined fields are passed to Firestore
      const rawPayload = {
        userId: currentUser?.uid || auth.currentUser?.uid || 'guest-user',
        customerName: orderData.customerName.trim(),
        customerEmail: currentUser?.email || auth.currentUser?.email || null,
        orderType: orderData.orderType,
        tableNumber: effectiveTableNumber,
        items: cartItems.map((ci) => {
          const cust = ci.customization;
          const tags: string[] = [];
          if (cust.size) tags.push(cust.size);
          if (cust.temperature) tags.push(cust.temperature);
          if (cust.milk && cust.milk !== 'None') tags.push(`${cust.milk} Milk`);
          if (cust.shots) tags.push(`+${cust.shots} Shot${cust.shots > 1 ? 's' : ''}`);
          if (cust.syrups && cust.syrups.length > 0) tags.push(cust.syrups.join(', '));
          return {
            cartItemId: ci.cartItemId,
            itemName: ci.menuItem.name,
            quantity: ci.quantity,
            unitPrice: ci.unitPrice,
            totalPrice: ci.totalPrice,
            customizationSummary: tags.join(' • '),
          };
        }),
        subtotal,
        tax,
        tip: orderData.tip,
        totalPrice,
        status: 'Received' as OrderStatus,
        paymentMethod: orderData.paymentMethod,
        qrCodeData: `BREWNET-TABLE-${effectiveTableNumber || '05'}-${Date.now()}`,
        createdAt: new Date().toISOString(),
        estimatedMinutes: Math.floor(Math.random() * 4) + 5,
        notes: orderData.notes ? orderData.notes.trim() : null,
      };

      // Strip any undefined keys as an extra layer of protection
      const orderPayload = Object.fromEntries(
        Object.entries(rawPayload).filter(([_, v]) => v !== undefined)
      );

      // Add order to Firestore orders collection
      const docRef = await addDoc(collection(db, 'orders'), orderPayload);

      // Award +10 reward points to authenticated user!
      if (currentUser?.uid) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          rewardPoints: increment(10),
        }).catch((e) => console.error('Points increment error:', e));
      }

      const fullOrder: Order = { id: docRef.id, ...(orderPayload as unknown as Omit<Order, 'id'>) };
      setLatestOrderId(docRef.id);
      localStorage.setItem('brewnet_latest_order_id', docRef.id);
      setActiveConfirmedOrder(fullOrder);
      setIsOrderTrackerOpen(true);
      setCartItems([]);
      setIsCartOpen(false);
    } catch (err) {
      console.error('Order submission error:', err);
      handleFirestoreError(err, OperationType.WRITE, 'orders');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleReorder = (pastOrder: Order) => {
    pastOrder.items.forEach((item) => {
      const foundMenuItem = menuItems.find((m) => m.name === item.itemName) || menuItems[0];
      handleAddToCart(
        foundMenuItem,
        { size: 'Medium', temperature: 'Hot', milk: 'Oat' },
        item.quantity,
        item.unitPrice
      );
    });
    setIsCartOpen(true);
  };

  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-amber-700 selection:text-white">
      
      {/* Header Bar */}
      <Header
        cartItemCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenQRGenerator={() => setIsQRModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenTrackOrder={handleOpenTrackOrder}
        hasActiveOrder={Boolean(activeConfirmedOrder && activeConfirmedOrder.status !== 'Completed')}
        onToggleKitchenMode={() => setIsKitchenMode(!isKitchenMode)}
        isKitchenMode={isKitchenMode}
        currentUser={currentUser}
        selectedTable={selectedTable}
      />

      {/* Banner for Active Table / QR Order */}
      {!isKitchenMode && (
        <BannerQR
          tableNumber={selectedTable}
          onClearTable={() => setSelectedTable(null)}
          onOpenQRGenerator={() => setIsQRModalOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {isKitchenMode ? (
          /* Kitchen Barista Board View */
          <KitchenDashboard
            currentUser={currentUser}
            onSwitchToCustomer={() => setIsKitchenMode(false)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        ) : (
          /* Customer Menu & Ordering View */
          <div className="space-y-6">

            {/* Active Order Live Status Banner */}
            {activeConfirmedOrder && activeConfirmedOrder.status !== 'Completed' && (
              <div className="bg-amber-500/10 border border-amber-300 rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center space-x-3.5">
                  <div className="relative flex h-3.5 w-3.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-600"></span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                        Live Order Status:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-700 text-white shadow-2xs">
                        {activeConfirmedOrder.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 font-medium mt-0.5">
                      Order #{activeConfirmedOrder.id.slice(-6).toUpperCase()} • {activeConfirmedOrder.items.length} item(s) • Total: ₹{activeConfirmedOrder.totalPrice.toFixed(2)}
                      {activeConfirmedOrder.tableNumber ? ` • Table #${activeConfirmedOrder.tableNumber}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  id="open-tracker-banner-btn"
                  onClick={() => setIsOrderTrackerOpen(true)}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 font-extrabold text-xs shadow-xs transition-all active:scale-95 flex items-center space-x-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Open Tracker</span>
                </button>
              </div>
            )}
            
            {/* Hero Welcome Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-stone-900 p-6 sm:p-8 border border-stone-200 shadow-sm text-stone-50">
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-stone-800 border border-stone-700 text-amber-400 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Artisanal Roast & Fresh Daily Pastries</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-stone-50 tracking-tight leading-tight">
                  Savor handcrafted coffees, brewed fresh to order.
                </h1>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  Order directly from your table or pick up at the bar. Customized to your exact taste with non-dairy milks, extra shots, and flavor infusions.
                </p>
              </div>

              {/* Decorative Accent */}
              <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500 via-amber-800 to-transparent" />
            </div>

            {/* Category Navigation & Search */}
            <CategoryNav
              categories={CATEGORIES}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedDietary={selectedDietary}
              onToggleDietary={handleToggleDietary}
              showPopularOnly={showPopularOnly}
              onTogglePopularOnly={() => setShowPopularOnly(!showPopularOnly)}
            />

            {/* Menu Items Grid */}
            {filteredMenuItems.length === 0 ? (
              <div className="text-center py-20 bg-white border border-stone-200 rounded-3xl space-y-3 shadow-xs">
                <Coffee className="w-12 h-12 mx-auto text-stone-400" />
                <h3 className="text-base font-semibold text-stone-800">No items match your filter</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Try clearing your search query or adjusting dietary filters to explore our full menu.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                    setSelectedDietary([]);
                    setShowPopularOnly(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-stone-50 hover:bg-stone-800 font-bold text-xs transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredMenuItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onSelect={(selected) => setSelectedItemForCustomization(selected)}
                    onQuickAdd={handleQuickAdd}
                  />
                ))}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Item Customization Modal */}
      <ItemCustomizationModal
        item={selectedItemForCustomization}
        onClose={() => setSelectedItemForCustomization(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Slide-Over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCartItems([])}
        selectedTable={selectedTable}
        onTableChange={setSelectedTable}
        currentUser={currentUser}
        onPlaceOrder={handlePlaceOrder}
        isSubmitting={isSubmittingOrder}
      />

      {/* Live Order Confirmation & Tracker Modal */}
      <OrderConfirmationModal
        order={isOrderTrackerOpen ? activeConfirmedOrder : null}
        onClose={() => setIsOrderTrackerOpen(false)}
      />

      {/* No Active Order Toast */}
      {noOrderToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-amber-400 border border-amber-500/40 px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-bold animate-bounce">
          <Coffee className="w-5 h-5 text-amber-400 shrink-0" />
          <span>No active order found. Place an order to track it live!</span>
        </div>
      )}

      {/* Table QR Code Generator & Simulator Modal */}
      <QRGeneratorModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        activeTable={selectedTable}
        onSelectTable={(table) => {
          setSelectedTable(table);
          setIsQRModalOpen(false);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />

      {/* Past Orders History Modal */}
      <OrderHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        currentUser={currentUser}
        onReorder={handleReorder}
      />

    </div>
  );
}

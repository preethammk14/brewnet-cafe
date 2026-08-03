import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, MapPin, CreditCard, Sparkles, AlertCircle } from 'lucide-react';
import { CartItem, OrderType, UserProfile } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  selectedTable: string | null;
  onTableChange: (table: string) => void;
  currentUser: UserProfile | null;
  onPlaceOrder: (orderData: {
    customerName: string;
    orderType: OrderType;
    tableNumber?: string;
    paymentMethod: 'Credit Card' | 'Apple Pay' | 'Google Pay' | 'Cash at Counter';
    tip: number;
    notes?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  selectedTable,
  onTableChange,
  currentUser,
  onPlaceOrder,
  isSubmitting,
}) => {
  const [orderType, setOrderType] = useState<OrderType>('Dine-In');
  const [tableInput, setTableInput] = useState<string>(selectedTable || '05');
  const [customerName, setCustomerName] = useState<string>(
    currentUser?.displayName || 'Coffee Enthusiast'
  );
  const [paymentMethod, setPaymentMethod] = useState<'Credit Card' | 'Apple Pay' | 'Google Pay' | 'Cash at Counter'>('Credit Card');
  const [tipPercentage, setTipPercentage] = useState<number>(15);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (selectedTable) {
      setTableInput(selectedTable);
    }
  }, [selectedTable, isOpen]);

  if (!isOpen) return null;

  // Cost calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const tax = subtotal * 0.08;
  const tip = subtotal * (tipPercentage / 100);
  const total = subtotal + tax + tip;

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (!customerName.trim()) {
      setErrorMsg('Please enter your name for the order.');
      return;
    }
    if (orderType === 'Dine-In' && !tableInput.trim()) {
      setErrorMsg('Please enter a table number for Dine-In.');
      return;
    }

    const finalTableNumber = orderType === 'Dine-In' ? (tableInput.trim() || selectedTable || '05') : undefined;
    if (finalTableNumber && finalTableNumber !== selectedTable) {
      onTableChange(finalTableNumber);
    }

    try {
      setErrorMsg('');
      await onPlaceOrder({
        customerName: customerName.trim(),
        orderType,
        tableNumber: finalTableNumber,
        paymentMethod,
        tip,
        notes: orderNotes.trim() || undefined,
      });
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg(err?.message || 'Failed to submit order. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-stone-200 text-stone-900 flex flex-col shadow-2xl">
          
          {/* Cart Header */}
          <div className="p-5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-stone-900 text-amber-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900">Your Order</h2>
                <p className="text-xs text-stone-500">
                  {cartItems.length} item{cartItems.length === 1 ? '' : 's'} in cart
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-stone-800">Your cart is empty</h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Browse our handcrafted coffees, matcha, and fresh artisanal bakery treats!
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-stone-500 pb-1 border-b border-stone-200">
                  <span>Selected Items</span>
                  <button
                    onClick={onClearCart}
                    className="text-stone-400 hover:text-amber-800 transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-3">
                  {cartItems.map((item) => {
                    const cust = item.customization;
                    const custTags: string[] = [];
                    if (cust.size) custTags.push(cust.size);
                    if (cust.temperature) custTags.push(cust.temperature);
                    if (cust.milk && cust.milk !== 'None') custTags.push(`${cust.milk} Milk`);
                    if (cust.shots) custTags.push(`+${cust.shots} Shot${cust.shots > 1 ? 's' : ''}`);
                    if (cust.syrups && cust.syrups.length > 0) custTags.push(cust.syrups.join(', '));
                    if (cust.sweetness && cust.sweetness !== '100%') custTags.push(`${cust.sweetness} Sweet`);
                    if (cust.notes) custTags.push(`"${cust.notes}"`);

                    return (
                      <div
                        key={item.cartItemId}
                        className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl flex gap-3 text-xs"
                      >
                        <img
                          src={item.menuItem.imageUrl}
                          alt={item.menuItem.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0"
                        />

                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between">
                            <h4 className="font-bold text-stone-900 text-sm">
                              {item.menuItem.name}
                            </h4>
                            <span className="font-extrabold text-amber-800">
                              ₹{item.totalPrice.toFixed(2)}
                            </span>
                          </div>

                          {custTags.length > 0 && (
                            <p className="text-[11px] text-amber-800 font-medium line-clamp-2">
                              {custTags.join(' • ')}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-lg border border-stone-200 shadow-2xs">
                              <button
                                onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                                className="text-stone-500 hover:text-stone-900"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-bold text-stone-900 px-1">{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                                className="text-stone-500 hover:text-stone-900"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => onRemoveItem(item.cartItemId)}
                              className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Options Section */}
                <div className="pt-4 space-y-4 border-t border-stone-200">
                  
                  {/* Dine In vs Takeout Toggle */}
                  <div>
                    <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1.5">
                      Fulfillment Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrderType('Dine-In')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 ${
                          orderType === 'Dine-In'
                            ? 'bg-stone-900 text-stone-50 border-stone-900 font-bold'
                            : 'bg-stone-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Dine-In Table</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrderType('Takeout')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 ${
                          orderType === 'Takeout'
                            ? 'bg-stone-900 text-stone-50 border-stone-900 font-bold'
                            : 'bg-stone-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Takeout Pickup</span>
                      </button>
                    </div>
                  </div>

                  {/* Table Number Input if Dine-In */}
                  {orderType === 'Dine-In' && (
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-900">
                          Table Number
                        </label>
                        <span className="text-[10px] text-amber-800">Check QR code on table</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. 05 or Bar 2"
                        value={tableInput}
                        onChange={(e) => {
                          setTableInput(e.target.value);
                          onTableChange(e.target.value);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  )}

                  {/* Customer Name */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      placeholder="Your name for the order"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1.5">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {(['Credit Card', 'Apple Pay', 'Google Pay', 'Cash at Counter'] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`p-2 rounded-xl border font-medium text-left flex items-center justify-between ${
                            paymentMethod === method
                              ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                              : 'bg-stone-50 text-stone-700 border-stone-200'
                          }`}
                        >
                          <span>{method}</span>
                          <CreditCard className="w-3.5 h-3.5 opacity-60" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tip Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-stone-700">
                        Add Barista Tip
                      </label>
                      <span className="text-xs text-amber-800 font-bold">₹{tip.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 10, 15, 20].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTipPercentage(p)}
                          className={`py-1.5 rounded-lg border text-xs font-semibold ${
                            tipPercentage === p
                              ? 'bg-stone-900 text-stone-50 border-stone-900 font-bold'
                              : 'bg-stone-50 text-stone-700 border-stone-200'
                          }`}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>

          {/* Cart Footer Summary & Place Order */}
          {cartItems.length > 0 && (
            <div className="p-5 bg-stone-50 border-t border-stone-200 space-y-3">
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-stone-900 font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span className="text-stone-900 font-medium">₹{tax.toFixed(2)}</span>
                </div>
                {tip > 0 && (
                  <div className="flex justify-between">
                    <span>Barista Tip</span>
                    <span className="text-stone-900 font-medium">₹{tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-stone-900 pt-2 border-t border-stone-200">
                  <span>Total Amount</span>
                  <span className="text-amber-800">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-amber-400 font-extrabold text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{isSubmitting ? 'Submitting Order...' : `Place Order • ₹${total.toFixed(2)}`}</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

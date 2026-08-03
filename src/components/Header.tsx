import React from 'react';
import { ShoppingBag, QrCode, User, Coffee, LayoutDashboard, History, Sparkles, Clock } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  cartItemCount: number;
  onOpenCart: () => void;
  onOpenQRGenerator: () => void;
  onOpenAuth: () => void;
  onOpenHistory: () => void;
  onOpenTrackOrder: () => void;
  hasActiveOrder?: boolean;
  onToggleKitchenMode: () => void;
  isKitchenMode: boolean;
  currentUser: UserProfile | null;
  selectedTable: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  cartItemCount,
  onOpenCart,
  onOpenQRGenerator,
  onOpenAuth,
  onOpenHistory,
  onOpenTrackOrder,
  hasActiveOrder = false,
  onToggleKitchenMode,
  isKitchenMode,
  currentUser,
  selectedTable,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200 text-stone-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center shadow-sm text-amber-400">
            <Coffee className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-stone-900">
                Brewnet Cafe
              </span>
              {selectedTable && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                  <QrCode className="w-3 h-3 mr-1 text-amber-700" />
                  Table #{selectedTable}
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500 hidden sm:block">Artisanal Coffee & QR Ordering</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          
          {/* QR Table Generator / Scanner */}
          <button
            id="qr-tables-btn"
            onClick={onOpenQRGenerator}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl text-xs sm:text-sm font-semibold bg-amber-50/90 hover:bg-amber-100/90 text-amber-900 border border-amber-200/80 hover:border-amber-300 transition-all active:scale-95 shadow-2xs"
            title="Generate or scan Table QR code"
          >
            <QrCode className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="hidden md:inline">Table QR</span>
          </button>

          {/* Barista / Kitchen View Toggle */}
          <button
            id="kitchen-mode-toggle"
            onClick={onToggleKitchenMode}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl text-xs sm:text-sm font-bold transition-all border active:scale-95 shadow-2xs ${
              isKitchenMode
                ? 'bg-orange-700 text-white border-orange-800 shadow-sm ring-2 ring-orange-600/20'
                : 'bg-orange-50/90 hover:bg-orange-100 text-orange-950 border-orange-200/80 hover:border-orange-300'
            }`}
            title={currentUser?.role === 'staff' ? 'Barista Board (Staff Verified)' : 'Barista Board (Requires Staff Role)'}
          >
            <LayoutDashboard className={`w-4 h-4 shrink-0 ${isKitchenMode ? 'text-white' : 'text-orange-700'}`} />
            <span className="hidden sm:inline">{isKitchenMode ? 'Customer View' : 'Barista Board'}</span>
            {currentUser?.role === 'staff' && (
              <span className="hidden lg:inline-block px-1.5 py-0.5 rounded-full text-[10px] font-black bg-orange-200 text-orange-900 ml-0.5">
                Staff
              </span>
            )}
          </button>

          {/* User Rewards / Order History / Auth */}
          {currentUser ? (
            <div className="flex items-center space-x-2">
              <button
                id="order-history-btn"
                onClick={onOpenHistory}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-2xl text-xs sm:text-sm bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 transition-all active:scale-95 font-semibold"
                title="View order history"
              >
                <History className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="hidden lg:inline">Past Orders</span>
              </button>

              <button
                id="user-profile-btn"
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl text-xs sm:text-sm bg-stone-100/90 hover:bg-stone-200 text-stone-800 border border-stone-200/90 transition-all active:scale-95"
              >
                <div className="w-5 h-5 rounded-full bg-amber-950 text-amber-50 font-bold text-[10px] flex items-center justify-center">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                </div>
                <span className="max-w-[80px] truncate text-xs font-semibold hidden sm:inline">
                  {currentUser.displayName || 'Account'}
                </span>
                <div className="flex items-center text-[11px] text-amber-700 font-bold ml-1">
                  <Sparkles className="w-3 h-3 mr-0.5" />
                  {currentUser.rewardPoints}p
                </div>
              </button>
            </div>
          ) : (
            <button
              id="signin-btn"
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl text-xs sm:text-sm font-semibold bg-stone-100/90 hover:bg-stone-200/90 text-stone-800 border border-stone-200/90 hover:border-stone-300 transition-all active:scale-95 shadow-2xs"
            >
              <User className="w-4 h-4 text-stone-700 shrink-0" />
              <span>Sign In</span>
            </button>
          )}

          {/* Track Order Button */}
          {!isKitchenMode && (
            <button
              id="track-order-btn"
              onClick={onOpenTrackOrder}
              className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl text-xs sm:text-sm font-bold transition-all border active:scale-95 shadow-2xs ${
                hasActiveOrder
                  ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-700 shadow-sm ring-2 ring-orange-500/20'
                  : 'bg-orange-50/90 hover:bg-orange-100 text-orange-950 border-orange-200/80 hover:border-orange-300'
              }`}
              title="Track your active order real-time status"
            >
              <Clock className={`w-4 h-4 shrink-0 ${hasActiveOrder ? 'text-orange-100 animate-spin' : 'text-orange-700'}`} />
              <span className="inline">Track Order</span>
              {hasActiveOrder && (
                <span className="relative flex h-2 w-2 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </button>
          )}

          {/* Cart Trigger Button */}
          {!isKitchenMode && (
            <button
              id="cart-drawer-trigger"
              onClick={onOpenCart}
              className="relative flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-amber-950 hover:bg-stone-900 text-amber-50 font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 border border-amber-900"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.2] shrink-0 text-amber-200" />
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-black bg-amber-500 text-amber-950">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}

        </div>
      </div>
    </header>
  );
};

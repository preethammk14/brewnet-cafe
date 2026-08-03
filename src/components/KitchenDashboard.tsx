import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, OrderStatus, UserProfile } from '../types';
import { Clock, CheckCircle2, Coffee, AlertCircle, RefreshCw, Filter, Search, MapPin, Sparkles, ShieldAlert, Lock, UserCheck, ArrowLeft } from 'lucide-react';

interface KitchenDashboardProps {
  currentUser?: UserProfile | null;
  onSwitchToCustomer?: () => void;
  onOpenAuth?: () => void;
}

export const KitchenDashboard: React.FC<KitchenDashboardProps> = ({
  currentUser,
  onSwitchToCustomer,
  onOpenAuth,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updateError, setUpdateError] = useState<string | null>(null);

  const isStaff = currentUser?.role === 'staff';

  // Subscribe to real-time Firestore orders collection if user is staff
  useEffect(() => {
    if (!isStaff) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const orderList: Order[] = [];
      snapshot.forEach((docSnap) => {
        orderList.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as Order);
      });
      setOrders(orderList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching orders for kitchen:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isStaff]);

  // If not staff, render Staff Authorization Guard
  if (!isStaff) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl p-8 border border-stone-200/90 shadow-md text-stone-900 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
            <Lock className="w-8 h-8 text-amber-800" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-950 text-xs font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-700" />
              <span>Role-Based Access Control Active</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-stone-900">
              Staff Authorization Required
            </h2>
            <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
              The Barista Board is restricted exclusively to verified café staff members to manage live orders and kitchen operations.
            </p>
          </div>

          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-left text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-stone-500 font-medium">Current Auth State:</span>
              <span className="font-bold text-stone-800">
                {currentUser ? currentUser.email || currentUser.displayName || 'Signed In' : 'Guest / Not Signed In'}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-stone-200/70 pt-2">
              <span className="text-stone-500 font-medium">Current Assigned Role:</span>
              <span className={`font-extrabold px-2 py-0.5 rounded-full text-[11px] ${currentUser?.role === 'customer' ? 'bg-amber-100 text-amber-900' : 'bg-stone-200 text-stone-700'}`}>
                {currentUser?.role || 'guest'}
              </span>
            </div>
          </div>

          <div className="text-xs text-stone-500 bg-amber-50/70 rounded-xl p-3 border border-amber-200/60 text-left space-y-1">
            <p className="font-semibold text-amber-950">How to get Staff access:</p>
            <p>
              In Firebase Console, go to <strong>Firestore Database &gt; users &gt; {currentUser ? currentUser.uid : '[YOUR_UID]'}</strong> and add or edit the string field <code className="bg-amber-100 text-amber-950 px-1 py-0.5 rounded font-mono">role</code> = <code className="bg-amber-100 text-amber-950 px-1 py-0.5 rounded font-mono">"staff"</code>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {!currentUser && onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center space-x-2"
              >
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>Sign In as Staff</span>
              </button>
            )}
            {onSwitchToCustomer && (
              <button
                onClick={onSwitchToCustomer}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-xs font-bold transition-all active:scale-95 flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4 text-amber-800" />
                <span>Return to Customer Menu</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Update order status in Firestore
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'All' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = o.customerName.toLowerCase().includes(q);
      const matchTable = o.tableNumber?.toLowerCase().includes(q);
      const matchId = o.id.toLowerCase().includes(q);
      return matchName || matchTable || matchId;
    }
    return true;
  });

  const activeOrdersCount = orders.filter(o => o.status === 'Received' || o.status === 'Preparing').length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Banner & Metrics */}
      <div className="bg-stone-900 p-6 rounded-3xl border border-stone-200 text-stone-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-amber-600 text-white font-black shadow-xs">
            <Coffee className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-stone-50">Barista Live Order Board</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-800 text-amber-400 border border-stone-700">
                Realtime Firestore
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Manage incoming customer table & pickup orders in real-time
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-stone-800 px-4 py-2.5 rounded-2xl border border-stone-700">
          <div className="text-right">
            <span className="text-[10px] text-stone-400 block uppercase font-semibold">Active Orders</span>
            <span className="text-lg font-black text-amber-400">{activeOrdersCount} Pending</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 overflow-x-auto no-scrollbar w-full sm:w-auto py-1">
          {['All', 'Received', 'Preparing', 'Ready', 'Completed'].map((st) => {
            const isSelected = statusFilter === st;
            const count = st === 'All' ? orders.length : orders.filter((o) => o.status === st).length;

            let tabStyles = '';
            let badgeStyles = '';

            switch (st) {
              case 'All':
                tabStyles = isSelected
                  ? 'bg-stone-900 text-stone-50 border-stone-900 shadow-sm ring-2 ring-stone-900/15'
                  : 'bg-stone-100/90 text-stone-700 border-stone-200/80 hover:bg-stone-200/80 hover:text-stone-900 hover:border-stone-300';
                badgeStyles = isSelected ? 'bg-white/20 text-stone-50' : 'bg-stone-200/80 text-stone-700';
                break;
              case 'Received':
                tabStyles = isSelected
                  ? 'bg-orange-600 text-white border-orange-600 shadow-sm ring-2 ring-orange-500/20'
                  : 'bg-orange-50 text-orange-800 border-orange-200/80 hover:bg-orange-100 hover:border-orange-300 hover:text-orange-950';
                badgeStyles = isSelected ? 'bg-white/25 text-white' : 'bg-orange-200/60 text-orange-800';
                break;
              case 'Preparing':
                tabStyles = isSelected
                  ? 'bg-amber-500 text-amber-950 font-black border-amber-500 shadow-sm ring-2 ring-amber-400/25'
                  : 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100 hover:border-amber-300 hover:text-amber-950';
                badgeStyles = isSelected ? 'bg-amber-950/20 text-amber-950' : 'bg-amber-200/60 text-amber-800';
                break;
              case 'Ready':
                tabStyles = isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300 hover:text-emerald-950';
                badgeStyles = isSelected ? 'bg-white/25 text-white' : 'bg-emerald-200/60 text-emerald-800';
                break;
              case 'Completed':
                tabStyles = isSelected
                  ? 'bg-slate-600 text-white border-slate-600 shadow-sm ring-2 ring-slate-500/20'
                  : 'bg-slate-100 text-slate-700 border-slate-200/80 hover:bg-slate-200/80 hover:border-slate-300 hover:text-slate-900';
                badgeStyles = isSelected ? 'bg-white/25 text-white' : 'bg-slate-200/70 text-slate-700';
                break;
            }

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all duration-200 border shrink-0 flex items-center space-x-2 active:scale-95 ${tabStyles}`}
              >
                <span>{st}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors ${badgeStyles}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name or table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 shadow-xs"
          />
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="text-center py-20 space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto text-amber-700 animate-spin" />
          <p className="text-xs text-stone-500">Connecting to Firestore realtime stream...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-stone-200 rounded-3xl space-y-2 shadow-2xs">
          <Coffee className="w-10 h-10 mx-auto text-stone-400" />
          <h3 className="text-sm font-semibold text-stone-800">No orders found</h3>
          <p className="text-xs text-stone-500">
            {statusFilter !== 'All' ? `No orders with status "${statusFilter}"` : 'New customer orders will appear here automatically'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isReceived = order.status === 'Received';
            const isPreparing = order.status === 'Preparing';
            const isReady = order.status === 'Ready';
            const isCompleted = order.status === 'Completed';

            return (
              <div
                key={order.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  isReceived
                    ? 'bg-white border-2 border-amber-600 shadow-md'
                    : isPreparing
                    ? 'bg-amber-50/80 border border-amber-300'
                    : isReady
                    ? 'bg-emerald-50/80 border border-emerald-300'
                    : 'bg-stone-50 border border-stone-200 opacity-75'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-stone-200 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-stone-900 text-base">
                        {order.customerName}
                      </span>
                      <span className="text-[10px] font-mono text-amber-800 font-bold">
                        #{order.id.slice(-5).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs mt-0.5">
                      <span className="font-semibold text-amber-900 inline-flex items-center">
                        <MapPin className="w-3 h-3 mr-1 text-amber-700" />
                        {order.orderType} {order.tableNumber ? `(Table #${order.tableNumber})` : ''}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                      isReceived
                        ? 'bg-amber-600 text-white border-amber-700'
                        : isPreparing
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : isReady
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-stone-200 text-stone-700 border-stone-300'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-2 text-xs">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-0.5"
                    >
                      <div className="flex justify-between font-bold text-stone-900">
                        <span>{item.quantity}x {item.itemName}</span>
                        <span className="text-amber-800">₹{item.totalPrice.toFixed(2)}</span>
                      </div>
                      {item.customizationSummary && (
                        <p className="text-[11px] text-amber-800 font-medium">
                          {item.customizationSummary}
                        </p>
                      )}
                    </div>
                  ))}
                  {order.notes && (
                    <p className="text-[11px] text-amber-900 italic p-2 bg-amber-50 rounded-lg border border-amber-200 font-medium">
                      Note: "{order.notes}"
                    </p>
                  )}
                </div>

                {/* Status Transition Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-200">
                  <span className="text-xs font-extrabold text-amber-800">
                    Total: ₹{order.totalPrice.toFixed(2)}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {isReceived && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                        className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-400 font-extrabold text-xs shadow-xs transition-all active:scale-95"
                      >
                        Start Preparing
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'Ready')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-xs transition-all active:scale-95"
                      >
                        Mark Ready
                      </button>
                    )}

                    {isReady && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'Completed')}
                        className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs border border-stone-200 transition-all"
                      >
                        Complete Order
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

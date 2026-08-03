import React, { useEffect, useState } from 'react';
import { X, History, Coffee, Sparkles, RefreshCw } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Order, UserProfile } from '../types';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onReorder: (order: Order) => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onReorder,
}) => {
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const activeUid = currentUser?.uid || auth.currentUser?.uid;

    if (!isOpen || !activeUid) {
      setHistoryOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', activeUid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: Order[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Order);
        });
        // Sort in memory by createdAt descending
        list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setHistoryOrders(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching order history:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-2xl my-8 text-stone-900 p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-stone-900 text-amber-400 font-bold shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Past Orders History</h2>
              <p className="text-xs text-stone-500">Re-order your favorite coffee in seconds</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 space-y-2">
            <RefreshCw className="w-6 h-6 mx-auto text-amber-700 animate-spin" />
            <p className="text-xs text-stone-500">Loading your past orders...</p>
          </div>
        ) : historyOrders.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Coffee className="w-8 h-8 mx-auto text-stone-400" />
            <p className="text-sm text-stone-800 font-semibold">No past orders yet</p>
            <p className="text-xs text-stone-500">Orders placed while signed in will appear here.</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-3 pr-1 text-xs">
            {historyOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <div>
                    <span className="font-mono font-bold text-amber-900">
                      Order #{ord.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-stone-500 block">
                      {new Date(ord.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                    {ord.status}
                  </span>
                </div>

                <div className="space-y-1">
                  {ord.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-stone-800 font-medium">
                      <span>{it.quantity}x {it.itemName}</span>
                      <span className="text-stone-500">₹{it.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                  <span className="font-extrabold text-amber-900 text-sm">
                    Total: ₹{ord.totalPrice.toFixed(2)}
                  </span>

                  <button
                    onClick={() => {
                      onReorder(ord);
                      onClose();
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold text-xs shadow-xs transition-all active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Re-Order Items</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

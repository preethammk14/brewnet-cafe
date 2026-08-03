import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Clock, Coffee, QrCode, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, OrderStatus } from '../types';

interface OrderConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
}

const STATUS_STEPS: OrderStatus[] = ['Received', 'Preparing', 'Ready', 'Completed'];

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order: initialOrder,
  onClose,
}) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(initialOrder);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    setCurrentOrder(initialOrder);
  }, [initialOrder]);

  // Generate QR Code data URL for order identification
  useEffect(() => {
    if (currentOrder?.id) {
      QRCode.toDataURL(currentOrder.qrCodeData || `BREWNET-ORDER-${currentOrder.id}`, {
        width: 180,
        margin: 1,
        color: {
          dark: '#1c1917', // stone-900
          light: '#f59e0b', // amber-500 background accent or white
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [currentOrder?.id, currentOrder?.qrCodeData]);

  // Real-time Firestore document listener for live status updates!
  useEffect(() => {
    if (!currentOrder?.id) return;

    const orderRef = doc(db, 'orders', currentOrder.id);
    const unsubscribe = onSnapshot(orderRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Order;
        setCurrentOrder(prev => prev ? ({ ...prev, ...data }) : null);
      }
    });

    return () => unsubscribe();
  }, [currentOrder?.id]);

  if (!initialOrder || !currentOrder) return null;

  const currentStepIndex = STATUS_STEPS.indexOf(currentOrder.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-2xl my-8 text-stone-900 p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-stone-900 text-amber-400 font-bold shadow-xs">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Order Placed Successfully!
              </span>
              <h2 className="text-xl font-black text-stone-900">
                Order #{currentOrder.id.slice(-6).toUpperCase()}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Order Progress Bar */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-stone-900">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-amber-700 animate-spin" />
              <span>Status: <strong className="text-amber-800">{currentOrder.status}</strong></span>
            </span>
            <span className="text-stone-500">Est. Wait: ~{currentOrder.estimatedMinutes || 6} mins</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-2">
            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step} className="space-y-1 text-center">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isCompleted
                        ? isCurrent
                          ? 'bg-amber-600 shadow-xs'
                          : 'bg-stone-900'
                        : 'bg-stone-200'
                    }`}
                  />
                  <span
                    className={`text-[10px] block font-semibold truncate ${
                      isCompleted ? 'text-stone-900' : 'text-stone-400'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details & QR Code Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-stone-50 p-4 rounded-2xl border border-stone-200">
          
          {/* QR Code Display */}
          <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-stone-200 space-y-2 shadow-2xs">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Order QR Code"
                className="w-32 h-32 rounded-lg bg-white p-1 border border-stone-100"
              />
            ) : (
              <div className="w-32 h-32 bg-stone-100 rounded-lg flex items-center justify-center">
                <QrCode className="w-8 h-8 text-stone-400" />
              </div>
            )}
            <span className="text-[10px] text-stone-500 text-center font-mono font-medium">
              Show QR at Counter
            </span>
          </div>

          {/* Fulfillment Info */}
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Customer</span>
              <strong className="text-stone-900 text-sm">{currentOrder.customerName}</strong>
            </div>

            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Fulfillment</span>
              <div className="flex items-center space-x-1 text-amber-800 font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {currentOrder.orderType}
                  {currentOrder.tableNumber ? ` (Table #${currentOrder.tableNumber})` : ''}
                </span>
              </div>
            </div>

            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Total Paid</span>
              <span className="text-base font-extrabold text-amber-800">
                ₹{currentOrder.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Item Summary */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
            Ordered Items ({currentOrder.items.length})
          </h4>
          <div className="max-h-36 overflow-y-auto space-y-2 text-xs pr-1">
            {currentOrder.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200"
              >
                <div>
                  <span className="font-bold text-stone-900">
                    {item.quantity}x {item.itemName}
                  </span>
                  {item.customizationSummary && (
                    <p className="text-[10px] text-amber-800 font-medium">{item.customizationSummary}</p>
                  )}
                </div>
                <span className="font-extrabold text-amber-800">₹{item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 font-bold text-sm shadow-md transition-all active:scale-[0.98]"
        >
          Got It, Back to Menu
        </button>

      </div>
    </div>
  );
};

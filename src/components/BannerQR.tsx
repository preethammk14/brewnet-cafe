import React from 'react';
import { QrCode, X, MapPin, Sparkles } from 'lucide-react';

interface BannerQRProps {
  tableNumber: string | null;
  onClearTable: () => void;
  onOpenQRGenerator: () => void;
}

export const BannerQR: React.FC<BannerQRProps> = ({
  tableNumber,
  onClearTable,
  onOpenQRGenerator,
}) => {
  if (!tableNumber) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-950 py-2.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center space-x-2.5">
          <div className="p-1 rounded-full bg-amber-200/80 text-amber-800">
            <QrCode className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-amber-950">
              Dine-In Mode Activated
            </span>
            <span className="mx-1.5 text-amber-300">•</span>
            <span className="text-amber-900 inline-flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-amber-700" />
              Ordering for <strong className="ml-1 text-amber-950 font-extrabold">Table #{tableNumber}</strong>
            </span>
            <span className="hidden md:inline-block ml-2 text-amber-800/80 text-xs">
              (Your items will be brought directly to your table)
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenQRGenerator}
            className="hidden sm:inline-flex items-center text-xs text-amber-800 hover:text-amber-950 underline font-semibold"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Switch Table
          </button>

          <button
            onClick={onClearTable}
            className="p-1 text-amber-800 hover:text-amber-950 rounded-lg hover:bg-amber-200/60 transition-colors"
            title="Switch to Takeout mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

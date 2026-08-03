import React, { useState, useMemo } from 'react';
import { X, Coffee, Check, Plus, Minus, Sparkles } from 'lucide-react';
import { MenuItem, CustomizationSelection, Size, Temperature, MilkType, SyrupType } from '../types';

interface ItemCustomizationModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, customization: CustomizationSelection, quantity: number, calculatedUnitPrice: number) => void;
}

export const ItemCustomizationModal: React.FC<ItemCustomizationModalProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  // Customization States
  const [size, setSize] = useState<Size>('Medium');
  const [temperature, setTemperature] = useState<Temperature>('Hot');
  const [milk, setMilk] = useState<MilkType>('Oat');
  const [shots, setShots] = useState<number>(0);
  const [selectedSyrups, setSelectedSyrups] = useState<SyrupType[]>([]);
  const [sweetness, setSweetness] = useState<'0%' | '50%' | '100%' | '120%'>('100%');
  const [notes, setNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Price Calculation Logic
  const unitPrice = useMemo(() => {
    if (!item) return 0;
    let base = item.price;
    
    // Size adjustment
    if (size === 'Small') base -= 20;
    if (size === 'Large') base += 30;

    // Milk upgrade
    if (milk === 'Oat' || milk === 'Almond' || milk === 'Coconut') base += 30;

    // Extra Shots
    base += shots * 40;

    // Syrups
    base += selectedSyrups.length * 20;

    return Math.max(10, base);
  }, [item, size, milk, shots, selectedSyrups]);

  if (!item) return null;

  const totalPrice = unitPrice * quantity;

  const toggleSyrup = (syrup: SyrupType) => {
    setSelectedSyrups(prev =>
      prev.includes(syrup) ? prev.filter(s => s !== syrup) : [...prev, syrup]
    );
  };

  const handleAdd = () => {
    const customization: CustomizationSelection = {
      size,
      temperature: item.allowTemperature ? temperature : undefined,
      milk: item.allowMilk ? milk : undefined,
      shots: item.allowShots ? shots : undefined,
      syrups: item.allowSyrups && selectedSyrups.length > 0 ? selectedSyrups : undefined,
      sweetness: item.allowSyrups || item.allowMilk ? sweetness : undefined,
      notes: notes.trim() || undefined,
    };

    onAddToCart(item, customization, quantity, unitPrice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-2xl my-8 text-stone-900 flex flex-col max-h-[90vh]">
        
        {/* Header Image & Close */}
        <div className="relative h-44 w-full shrink-0 bg-stone-100">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/30 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-stone-950/60 hover:bg-stone-950 text-stone-200 transition-colors border border-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-5 right-5">
            <h2 className="text-xl font-bold text-white">{item.name}</h2>
            <p className="text-xs text-stone-200 line-clamp-1">{item.description}</p>
          </div>
        </div>

        {/* Scrollable Customization Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
          
          {/* Size Selection */}
          <div>
            <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
              Select Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Small', 'Medium', 'Large'] as Size[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center justify-center space-y-0.5 ${
                    size === s
                      ? 'bg-stone-900 text-stone-50 border-stone-900 shadow-xs font-bold'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span>{s}</span>
                  <span className="text-[10px] opacity-80">
                    {s === 'Small' ? '-₹20' : s === 'Large' ? '+₹30' : 'Standard'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Temperature (if allowed) */}
          {item.allowTemperature && (
            <div>
              <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
                Temperature
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Hot', 'Iced', 'Blended'] as Temperature[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTemperature(t)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      temperature === t
                        ? 'bg-stone-900 text-stone-50 border-stone-900 font-bold'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Milk Options (if allowed) */}
          {item.allowMilk && (
            <div>
              <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
                Milk Choice
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Oat', 'Almond', 'Whole', 'Skim', 'Coconut', 'None'] as MilkType[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMilk(m)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                      milk === m
                        ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span>{m}</span>
                    <span className="text-[10px] text-amber-800/80">
                      {(m === 'Oat' || m === 'Almond' || m === 'Coconut') ? '+₹30' : ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extra Shots (if allowed) */}
          {item.allowShots && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Extra Espresso Shots
                </label>
                <span className="text-xs text-stone-500">+₹40 per shot</span>
              </div>
              <div className="flex items-center space-x-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <span className="text-xs text-stone-800 font-medium flex-1">
                  {shots === 0 ? 'Standard Shots' : `+${shots} Extra Shot${shots > 1 ? 's' : ''}`}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShots(Math.max(0, shots - 1))}
                    disabled={shots === 0}
                    className="p-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 disabled:opacity-40 text-stone-800"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-bold text-stone-900">{shots}</span>
                  <button
                    type="button"
                    onClick={() => setShots(Math.min(4, shots + 1))}
                    className="p-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Syrups (if allowed) */}
          {item.allowSyrups && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Flavor Syrups
                </label>
                <span className="text-xs text-stone-500">+₹20 each</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['Vanilla', 'Caramel', 'Hazelnut', 'Sugar-Free Vanilla'] as SyrupType[]).map((syrup) => {
                  const isChecked = selectedSyrups.includes(syrup);
                  return (
                    <button
                      key={syrup}
                      type="button"
                      onClick={() => toggleSyrup(syrup)}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <span>{syrup}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-amber-800" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sweetness Level */}
          {(item.allowMilk || item.allowSyrups) && (
            <div>
              <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
                Sweetness Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['0%', '50%', '100%', '120%'] as const).map((sw) => (
                  <button
                    key={sw}
                    type="button"
                    onClick={() => setSweetness(sw)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      sweetness === sw
                        ? 'bg-stone-900 text-stone-50 border-stone-900 font-bold'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {sw}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions Note */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Special Instructions (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Extra hot, light ice, toasted twice..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600"
            />
          </div>

        </div>

        {/* Modal Footer with Quantity and Add Button */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-4">
          
          {/* Quantity Controls */}
          <div className="flex items-center space-x-3 bg-white px-3 py-1.5 rounded-2xl border border-stone-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity === 1}
              className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-800"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center font-bold text-stone-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add Button with Total Price */}
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 flex items-center justify-between px-5 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-50 font-bold text-sm shadow-md transition-all active:scale-[0.98]"
          >
            <span>Add to Order</span>
            <span className="text-base font-extrabold text-amber-400">₹{totalPrice.toFixed(2)}</span>
          </button>

        </div>

      </div>
    </div>
  );
};

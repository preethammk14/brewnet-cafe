import React from 'react';
import { Plus, Flame, Sparkles, Coffee } from 'lucide-react';
import { MenuItem } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onSelect,
  onQuickAdd,
}) => {
  return (
    <div
      id={`menu-card-${item.id}`}
      className="group relative bg-white border border-stone-200 hover:border-amber-600/60 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col justify-between"
    >
      <div>
        {/* Item Image & Badges */}
        <div className="relative h-48 w-full overflow-hidden bg-stone-100">
          <img
            src={item.imageUrl}
            alt={item.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-stone-950/10 to-transparent opacity-80" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[85%]">
            {item.isPopular && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-stone-900 text-amber-400 shadow-xs">
                <Flame className="w-3 h-3 mr-0.5 fill-amber-400" />
                Popular
              </span>
            )}
            {item.dietary?.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 backdrop-blur-md text-stone-800 border border-stone-200 shadow-2xs"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Calories Pill */}
          {item.calories && (
            <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-xs text-[10px] text-stone-200 border border-stone-700">
              {item.calories} kcal
            </div>
          )}
        </div>

        {/* Content Info */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3
              onClick={() => onSelect(item)}
              className="text-base font-bold text-stone-900 group-hover:text-amber-800 transition-colors cursor-pointer leading-snug"
            >
              {item.name}
            </h3>
            <span className="text-base font-extrabold text-amber-800 shrink-0">
              ₹{item.price}
            </span>
          </div>

          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>
      </div>

      {/* Card Footer / Action Buttons */}
      <div className="p-4 pt-0 mt-2 flex items-center justify-between gap-2">
        <button
          onClick={() => onSelect(item)}
          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Customize</span>
        </button>

        <button
          onClick={() => onQuickAdd(item)}
          className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 transition-colors active:scale-95 shadow-xs"
          title="Quick add to cart"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

    </div>
  );
};

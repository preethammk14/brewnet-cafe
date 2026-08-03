import React from 'react';
import { Search, Flame, Filter, Check } from 'lucide-react';
import { Category, DietaryTag } from '../types';

interface CategoryNavProps {
  categories: Category[];
  selectedCategory: Category;
  onSelectCategory: (cat: Category) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedDietary: DietaryTag[];
  onToggleDietary: (tag: DietaryTag) => void;
  showPopularOnly: boolean;
  onTogglePopularOnly: () => void;
}

const DIETARY_OPTIONS: DietaryTag[] = ['Vegan', 'Gluten-Free', 'Dairy-Free', 'Organic'];

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  selectedDietary,
  onToggleDietary,
  showPopularOnly,
  onTogglePopularOnly,
}) => {
  return (
    <div className="space-y-4 mb-6">
      
      {/* Search Bar & Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            id="menu-search-input"
            type="text"
            placeholder="Search espresso, matcha, pastries..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Popular & Dietary Toggles */}
        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <button
            id="filter-popular-btn"
            onClick={onTogglePopularOnly}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              showPopularOnly
                ? 'bg-stone-900 text-stone-50 border-stone-900 font-bold shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${showPopularOnly ? 'text-amber-400 fill-amber-400' : 'text-amber-600'}`} />
            <span>Popular Hits</span>
          </button>

          {DIETARY_OPTIONS.map((tag) => {
            const isSelected = selectedDietary.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => onToggleDietary(tag)}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:text-stone-900'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-amber-700" />}
                <span>{tag}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Pills Navigation */}
      <div className="overflow-x-auto no-scrollbar py-1">
        <div className="flex space-x-2 min-w-max">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-stone-900 text-stone-50 font-bold shadow-xs'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

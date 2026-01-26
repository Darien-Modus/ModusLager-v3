import React, { useState } from 'react';
import { Item, Booking } from '../types';
import { calcAvailable, formatDate } from '../utils/helpers';
import { ItemIcon } from './ItemIcon';

interface OverviewPageProps {
  items: Item[];
  bookings: Booking[];
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ items, bookings }) => {
  const [sel, setSel] = useState<string[]>([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  
  const disp = sel.length > 0 ? items.filter(i => sel.includes(i.id)) : items;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Live Inventory Overview</h2>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Availability Checker</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Items</label>
          <div className="flex flex-wrap gap-2">
            {items.map(i => (
              <button 
                key={i.id} 
                onClick={() => setSel(sel.includes(i.id) ? sel.filter(x => x !== i.id) : [...sel, i.id])} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  sel.includes(i.id) 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                <ItemIcon item={i} />
                {i.name}
              </button>
            ))}
            {sel.length > 0 && (
              <button 
                onClick={() => setSel([])} 
                className="px-4 py-2 rounded-lg border border-red-300 text-red-600"
              >
                Clear
              </button>
            )}
          </div>
          {sel.length === 0 && <p className="text-sm text-gray-500 mt-2">Showing all items</p>}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start</label>
            <input 
              type="date" 
              value={start} 
              onChange={e => setStart(e.target.value)} 
              className="w-full px-4 py-2 border rounded-lg" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End</label>
            <input 
              type="date" 
              value={end} 
              onChange={e => setEnd(e.target.value)} 
              className="w-full px-4 py-2 border rounded-lg" 
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        {disp.map(i => {
          const s = start || new Date().toISOString().split('T')[0];
          const e = end || s;
          const avail = calcAvailable(i.id, s, e, bookings, items);
          const pct = (avail / i.totalQuantity) * 100;
          
          return (
            <div key={i.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{i.name}</h3>
                <ItemIcon item={i} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total:</span>
                  <span className="font-medium">{i.totalQuantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Available:</span>
                  <span className={`font-medium ${avail < i.totalQuantity * 0.2 ? 'text-red-600' : 'text-green-600'}`}>
                    {avail}
                  </span>
                </div>
                {start && end && (
                  <div className="text-xs text-gray-500">
                    {formatDate(start)} - {formatDate(end)}
                  </div>
                )}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    style={{ width: `${pct}%` }} 
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
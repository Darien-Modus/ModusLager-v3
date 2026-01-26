import React, { useState } from 'react';
import { Booking, Item, Project } from '../types';
import { formatDate, formatDateShort } from '../utils/helpers';
import { ItemIcon } from './ItemIcon';

interface CalendarPageProps {
  bookings: Booking[];
  items: Item[];
  projects: Project[];
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ bookings, items, projects }) => {
  const [d, setD] = useState(new Date());
  const [sel, setSel] = useState<string[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  
  const y = d.getFullYear();
  const m = d.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  
  const getB = (day: number) => {
    const ds = new Date(y, m, day).toISOString().split('T')[0];
    let filtered = bookings.filter(b => ds >= b.startDate && ds <= b.endDate);
    if (sel.length > 0) {
      filtered = filtered.filter(b => b.items.some(bi => sel.includes(bi.itemId)));
    }
    return filtered;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Booking Calendar</h2>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <label className="block text-sm font-medium mb-2">Filter by Items</label>
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
              Clear Filter
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => setD(new Date(y, m - 1))} 
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Previous
          </button>
          <h3 className="text-xl font-semibold">
            {d.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            onClick={() => setD(new Date(y, m + 1))} 
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Next
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(x => (
            <div key={x} className="text-center font-semibold py-2">{x}</div>
          ))}
          
          {Array.from({ length: first }).map((_, i) => <div key={`e${i}`} />)}
          
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const bs = getB(day);
            const dateStr = new Date(y, m, day).toISOString().split('T')[0];
            
            return (
              <div 
                key={day} 
                className="border p-2 min-h-24 relative"
                onMouseEnter={() => setHover(dateStr)}
                onMouseLeave={() => setHover(null)}
              >
                <div className="font-semibold mb-1">{formatDateShort(dateStr)}</div>
                
                {bs.slice(0, 2).map(b => {
                  const proj = projects.find(p => p.id === b.projectId);
                  return (
                    <div key={b.id} className="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 mb-1 truncate">
                      {proj?.name}
                    </div>
                  );
                })}
                
                {bs.length > 2 && <div className="text-xs text-gray-500">+{bs.length - 2}</div>}
                
                {hover === dateStr && bs.length > 0 && (
                  <div className="absolute z-10 bg-white border-2 border-blue-500 shadow-xl rounded-lg p-4 w-64 top-full left-0 mt-1">
                    <div className="font-semibold mb-2 text-blue-600">{formatDate(dateStr)}</div>
                    {bs.map(b => {
                      const proj = projects.find(p => p.id === b.projectId);
                      return (
                        <div key={b.id} className="mb-3 pb-3 border-b last:border-b-0">
                          <div className="font-medium text-sm mb-1">{proj?.name}</div>
                          <div className="space-y-1">
                            {b.items.map((bi, idx) => {
                              const it = items.find(item => item.id === bi.itemId);
                              return (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  {it && <ItemIcon item={it} />}
                                  <span>{it?.name} x{bi.quantity}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
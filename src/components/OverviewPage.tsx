import { useState } from 'react';
import { Search } from 'lucide-react';
import { Item, Booking, Group } from '../types';
import { calcAvailable, formatDate } from '../utils/helpers';
import { ItemIcon } from './ItemIcon';

interface OverviewPageProps {
  items: Item[];
  bookings: Booking[];
  groups: Group[];
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ items, bookings, groups }) => {
  const [sel, setSel] = useState<string[]>([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  
  const toggleGroupFilter = (groupId: string) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter(g => g !== groupId));
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  const filterItems = () => {
    let filtered = items;
    
    if (selectedGroups.length > 0) {
      filtered = filtered.filter(item => {
        if (selectedGroups.includes('ungrouped')) {
          return !item.groupId || selectedGroups.includes(item.groupId);
        }
        return selectedGroups.includes(item.groupId || '');
      });
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (sel.length > 0) {
      filtered = filtered.filter(item => sel.includes(item.id));
    }
    
    return filtered;
  };

  const disp = filterItems();

  return (
    <div style={{ fontFamily: 'Raleway, sans-serif' }}>
      <h2 className="text-base font-semibold mb-3" style={{ color: '#1F1F1F' }}>Live Inventory</h2>
      
      {/* Search and Filters */}
      <div className="mb-3 p-2 border" style={{ backgroundColor: '#F5F5F5', borderColor: '#575F60' }}>
        <div className="mb-2">
          <label className="block text-xs font-medium mb-1" style={{ color: '#575F60' }}>Search & Filter</label>
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1.5 w-3 h-3" style={{ color: '#575F60' }} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 border text-xs"
              style={{ borderColor: '#575F60' }}
            />
          </div>
          
          <div className="flex flex-wrap gap-1 mb-2">
            <span className="text-xs" style={{ color: '#575F60' }}>Groups:</span>
            {[{ id: 'ungrouped', name: 'Ungrouped' }, ...groups.filter(g => g.id !== '00000000-0000-0000-0000-000000000000')].map(g => (
              <button
                key={g.id}
                onClick={() => toggleGroupFilter(g.id)}
                className="px-2 py-0.5 text-xs border"
                style={{
                  backgroundColor: selectedGroups.includes(g.id) ? '#FFED00' : 'white',
                  borderColor: '#575F60',
                  color: '#1F1F1F'
                }}
              >
                {g.name}
              </button>
            ))}
            {selectedGroups.length > 0 && (
              <button
                onClick={() => setSelectedGroups([])}
                className="px-2 py-0.5 text-xs"
                style={{ color: '#dc2626' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#575F60' }}>Start</label>
            <input 
              type="date" 
              value={start} 
              onChange={e => setStart(e.target.value)} 
              className="w-full px-2 py-1 border text-xs"
              style={{ borderColor: '#575F60' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#575F60' }}>End</label>
            <input 
              type="date" 
              value={end} 
              onChange={e => setEnd(e.target.value)} 
              className="w-full px-2 py-1 border text-xs"
              style={{ borderColor: '#575F60' }}
            />
          </div>
        </div>
      </div>
      
      {/* Items Grid */}
      <div className="grid grid-cols-3 gap-2">
        {disp.map(i => {
          const s = start || new Date().toISOString().split('T')[0];
          const e = end || s;
          const avail = calcAvailable(i.id, s, e, bookings, items);
          const pct = (avail / i.totalQuantity) * 100;
          
          return (
            <div key={i.id} className="p-2 border" style={{ borderColor: '#575F60', backgroundColor: 'white' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: '#1F1F1F' }}>{i.name}</span>
                <ItemIcon item={i} size="sm" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#575F60' }}>Total:</span>
                  <span className="font-medium" style={{ color: '#1F1F1F' }}>{i.totalQuantity}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#575F60' }}>Available:</span>
                  <span className={`font-medium ${avail < i.totalQuantity * 0.2 ? 'text-red-600' : 'text-green-600'}`}>
                    {avail}
                  </span>
                </div>
                {start && end && (
                  <div className="text-xs" style={{ color: '#575F60' }}>
                    {formatDate(start)} → {formatDate(end)}
                  </div>
                )}
                <div className="w-full bg-gray-200 h-1.5">
                  <div 
                    className="h-1.5"
                    style={{ 
                      width: `${pct}%`,
                      backgroundColor: pct > 50 ? '#22c55e' : pct > 20 ? '#eab308' : '#ef4444'
                    }} 
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

import { useState } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff, Plus } from 'lucide-react';
import { Booking, Item, Project, Group } from '../types';
import { formatDate, formatDateShort } from '../utils/helpers';
import { ItemIcon } from './ItemIcon';

interface CalendarPageProps {
  bookings: Booking[];
  items: Item[];
  projects: Project[];
  groups: Group[];
  onNavigateToBookings?: () => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ bookings, items, projects, groups, onNavigateToBookings }) => {
  const [d, setD] = useState(new Date());
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  
  const y = d.getFullYear();
  const m = d.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  
  const toggleGroupFilter = (groupId: string) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter(g => g !== groupId));
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  const toggleItemFilter = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(i => i !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const getBookingShade = (index: number) => {
    const shades = ['#FFED00', '#FFE8A8', '#FFD966', '#FFF4CC', '#FFFAEB'];
    return shades[index % shades.length];
  };
  
  const getB = (day: number) => {
    const ds = new Date(y, m, day).toISOString().split('T')[0];
    let filtered = bookings.filter(b => ds >= b.startDate && ds <= b.endDate);
    
    if (selectedGroups.length > 0) {
      filtered = filtered.filter(b => 
        b.items.some(bi => {
          const item = items.find(i => i.id === bi.itemId);
          if (!item) return false;
          if (selectedGroups.includes('ungrouped')) {
            return !item.groupId || selectedGroups.includes(item.groupId);
          }
          return selectedGroups.includes(item.groupId || '');
        })
      );
    }
    
    if (selectedItems.length > 0) {
      filtered = filtered.filter(b => b.items.some(bi => selectedItems.includes(bi.itemId)));
    }
    
    return filtered;
  };

  return (
    <div style={{ fontFamily: 'Raleway, sans-serif' }}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold" style={{ color: '#1F1F1F' }}>Calendar</h2>
        <button 
          onClick={onNavigateToBookings}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs border"
          style={{ backgroundColor: '#FFED00', borderColor: '#1F1F1F', color: '#1F1F1F' }}
        >
          <Plus className="w-3 h-3" /> Add Booking
        </button>
      </div>
      
      <div className="mb-3 p-2 border" style={{ backgroundColor: '#F5F5F5', borderColor: '#575F60' }}>
        <div className="mb-2">
          <span className="text-xs font-medium" style={{ color: '#575F60' }}>Filter by Groups:</span>
          <div className="flex flex-wrap gap-1 mt-1">
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
              <button onClick={() => setSelectedGroups([])} className="px-2 py-0.5 text-xs" style={{ color: '#dc2626' }}>
                Clear
              </button>
            )}
          </div>
        </div>
        
        <div>
          <span className="text-xs font-medium" style={{ color: '#575F60' }}>Filter by Items:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {items.map(i => (
              <button
                key={i.id}
                onClick={() => toggleItemFilter(i.id)}
                className="px-2 py-0.5 text-xs border flex items-center gap-1"
                style={{
                  backgroundColor: selectedItems.includes(i.id) ? '#FFED00' : 'white',
                  borderColor: '#575F60',
                  color: '#1F1F1F'
                }}
              >
                <ItemIcon item={i} size="sm" />
                {i.name}
              </button>
            ))}
            {selectedItems.length > 0 && (
              <button onClick={() => setSelectedItems([])} className="px-2 py-0.5 text-xs" style={{ color: '#dc2626' }}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="border" style={{ backgroundColor: 'white', borderColor: '#575F60' }}>
        <div className="flex justify-between items-center p-2 border-b" style={{ borderColor: '#575F60' }}>
          <button 
            onClick={() => setD(new Date(y, m - 1))} 
            className="px-2 py-1 border text-xs"
            style={{ borderColor: '#575F60' }}
          >
            Previous
          </button>
          <h3 className="text-sm font-semibold" style={{ color: '#1F1F1F' }}>
            {d.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            onClick={() => setD(new Date(y, m + 1))} 
            className="px-2 py-1 border text-xs"
            style={{ borderColor: '#575F60' }}
          >
            Next
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-px" style={{ backgroundColor: '#575F60' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(x => (
            <div key={x} className="text-center font-medium py-1 text-xs" style={{ backgroundColor: '#F5F5F5', color: '#1F1F1F' }}>
              {x}
            </div>
          ))}
          
          {Array.from({ length: first }).map((_, i) => (
            <div key={`e${i}`} style={{ backgroundColor: '#F5F5F5', minHeight: '120px' }} />
          ))}
          
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const bs = getB(day);
            const dateStr = new Date(y, m, day).toISOString().split('T')[0];
            
            return (
              <div 
                key={day} 
                className="p-1 relative"
                style={{ backgroundColor: 'white', minHeight: '120px' }}
                onMouseEnter={() => setHover(dateStr)}
                onMouseLeave={() => setHover(null)}
              >
                <div className="font-semibold text-xs mb-1" style={{ color: '#1F1F1F' }}>
                  {day}
                </div>
                
                {bs.slice(0, 5).map((b, idx) => {
                  const proj = projects.find(p => p.id === b.projectId);
                  return (
                    <div 
                      key={b.id} 
                      className="text-xs px-1 py-0.5 mb-0.5 truncate"
                      style={{ 
                        backgroundColor: getBookingShade(idx),
                        color: '#1F1F1F'
                      }}
                    >
                      {proj?.name}
                    </div>
                  );
                })}
                
                {bs.length > 5 && (
                  <div className="text-xs" style={{ color: '#575F60' }}>
                    +{bs.length - 5} more
                  </div>
                )}
                
                {hover === dateStr && bs.length > 0 && (
                  <div 
                    className="absolute z-10 border-2 p-2 w-64 top-full left-0 mt-1"
                    style={{ 
                      backgroundColor: 'white', 
                      borderColor: '#FFED00',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div className="font-semibold mb-2 text-xs" style={{ color: '#1F1F1F' }}>
                      {formatDate(dateStr)}
                    </div>
                    {bs.map(b => {
                      const proj = projects.find(p => p.id === b.projectId);
                      // Find BeMatrix Frames group
                      const beMatrixGroup = groups.find(g => g.name === 'BeMatrix Frames');
                      // Filter items to only show BeMatrix Frames items
                      const beMatrixItems = b.items.filter(bi => {
                        const item = items.find(i => i.id === bi.itemId);
                        return item && item.groupId === beMatrixGroup?.id;
                      });
                      
                      // Only show booking if it has BeMatrix Frames items
                      if (beMatrixItems.length === 0) return null;
                      
                      return (
                        <div key={b.id} className="mb-2 pb-2 border-b last:border-b-0" style={{ borderColor: '#e5e7eb' }}>
                          <div className="font-medium text-xs mb-1" style={{ color: '#1F1F1F' }}>
                            {proj?.name}
                          </div>
                          <div className="space-y-1">
                            {beMatrixItems.map((bi, idx) => {
                              const it = items.find(item => item.id === bi.itemId);
                              return (
                                <div key={idx} className="flex items-center gap-1 text-xs">
                                  {it && <ItemIcon item={it} size="sm" />}
                                  <span style={{ color: '#575F60' }}>
                                    {it?.name} <span className="font-medium">x{bi.quantity}</span>
                                  </span>
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

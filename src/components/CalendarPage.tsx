import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { Booking, Item, Project, Group } from '../types';
import { formatDate } from '../utils/helpers';

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
  const calendarRef = useRef<HTMLDivElement>(null);
  
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
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
    <div style={{ fontFamily: "Raleway, sans-serif" }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-medium" style={{ color: '#191A23' }}>Calendar</h2>
        <button 
          onClick={onNavigateToBookings}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border"
          style={{ backgroundColor: '#FFED00', borderColor: '#191A23', color: '#191A23' }}
        >
          <Plus className="w-4 h-4" /> Add Booking
        </button>
      </div>
      
      <div className="mb-6 p-4 border" style={{ backgroundColor: '#F3F3F3', borderColor: '#575F60' }}>
        <div className="mb-3">
          <span className="text-sm font-medium" style={{ color: '#575F60' }}>Filter by Groups:</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {[{ id: 'ungrouped', name: 'Ungrouped' }, ...groups.filter(g => g.id !== '00000000-0000-0000-0000-000000000000')].map(g => (
              <button
                key={g.id}
                onClick={() => toggleGroupFilter(g.id)}
                className="px-3 py-1 text-sm border"
                style={{
                  backgroundColor: selectedGroups.includes(g.id) ? '#FFED00' : 'white',
                  borderColor: selectedGroups.includes(g.id) ? '#191A23' : '#575F60',
                  color: '#191A23'
                }}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <span className="text-sm font-medium" style={{ color: '#575F60' }}>Filter by Items:</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {items.map(i => {
              const isRainbow = i.color && !i.color.startsWith('#');
              return (
                <button
                  key={i.id}
                  onClick={() => toggleItemFilter(i.id)}
                  className="px-3 py-1 text-sm border flex items-center gap-2"
                  style={{
                    backgroundColor: selectedItems.includes(i.id) ? '#FFED00' : 'white',
                    borderColor: selectedItems.includes(i.id) ? '#191A23' : '#575F60',
                    color: '#191A23'
                  }}
                >
                  <div 
                    className="w-4 h-4 border"
                    style={{ 
                      borderColor: '#575F60',
                      ...(isRainbow
                        ? { background: 'linear-gradient(135deg, red, orange, yellow, green, blue, indigo, violet)' }
                        : { backgroundColor: i.color || '#9CA3AF' }
                      )
                    }}
                  />
                  {i.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      <div ref={calendarRef} className="border relative" style={{ backgroundColor: 'white', borderColor: '#191A23' }}>
        <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: '#F3F3F3' }}>
          <button onClick={() => setD(new Date(y, m - 1))} className="px-4 py-2 border text-sm font-medium" style={{ borderColor: '#575F60' }}>Previous</button>
          <h3 className="text-xl font-medium" style={{ color: '#191A23' }}>
            {d.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={() => setD(new Date(y, m + 1))} className="px-4 py-2 border text-sm font-medium" style={{ borderColor: '#575F60' }}>Next</button>
        </div>
        
        <div className="grid grid-cols-7 gap-px" style={{ backgroundColor: '#575F60' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(x => (
            <div key={x} className="text-center font-medium py-2 text-sm" style={{ backgroundColor: '#F3F3F3', color: '#191A23' }}>{x}</div>
          ))}
          
          {Array.from({ length: first }).map((_, i) => (
            <div key={`e${i}`} style={{ backgroundColor: '#F3F3F3', minHeight: '120px' }} />
          ))}
          
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const bs = getB(day);
            const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isFarRight = (first + i) % 7 >= 5;
            
            return (
              <div 
                key={day} 
                className="p-2 relative" 
                style={{ backgroundColor: 'white', minHeight: '120px' }}
                onMouseEnter={() => setHover(dateStr)}
                onMouseLeave={() => setHover(null)}
              >
                <div className="font-semibold text-sm mb-1" style={{ color: '#191A23' }}>{day}</div>
                
                {bs.slice(0, 5).map((b, idx) => {
                  const proj = projects.find(p => p.id === b.projectId);
                  return (
                    <div key={b.id} className="text-xs px-1 py-0.5 mb-0.5 truncate" style={{ backgroundColor: getBookingShade(idx), color: '#191A23' }}>
                      {proj?.name}
                    </div>
                  );
                })}

                {hover === dateStr && bs.length > 0 && (
                  <div 
                    className="absolute z-50 border-2 p-3 w-64 bg-white"
                    style={{ 
                      top: '0',
                      left: isFarRight ? 'auto' : '100%',
                      right: isFarRight ? '100%' : 'auto',
                      borderColor: '#FFED00',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                      pointerEvents: 'none'
                    }}
                  >
                    <div className="font-bold mb-2 text-xs">{formatDate(dateStr)}</div>
                    {bs.map(b => (
                      <div key={b.id} className="mb-2 text-xs border-b last:border-0 pb-1">
                        {projects.find(p => p.id === b.projectId)?.name}
                      </div>
                    ))}
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
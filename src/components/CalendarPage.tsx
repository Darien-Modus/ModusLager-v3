import { useState, useRef, useEffect } from 'react';
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
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
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

  const handleMouseEnter = (dateStr: string, event: React.MouseEvent<HTMLDivElement>) => {
    setHover(dateStr);
    
    if (calendarRef.current) {
      const rect = calendarRef.current.getBoundingClientRect();
      const cellRect = event.currentTarget.getBoundingClientRect();
      
      // Calculate position relative to calendar
      const relativeX = cellRect.left - rect.left;
      const relativeY = cellRect.top - rect.top;
      
      // Determine if we're in the right half or left half, top half or bottom half
      const isRightHalf = relativeX > rect.width / 2;
      const isBottomHalf = relativeY > rect.height / 2;
      
      setTooltipPos({
        x: isRightHalf ? relativeX - 280 : relativeX + cellRect.width + 10,
        y: isBottomHalf ? relativeY - 200 : relativeY
      });
    }
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
            {selectedGroups.length > 0 && (
              <button onClick={() => setSelectedGroups([])} className="px-3 py-1 text-sm" style={{ color: '#dc2626' }}>
                Clear
              </button>
            )}
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
            {selectedItems.length > 0 && (
              <button onClick={() => setSelectedItems([])} className="px-3 py-1 text-sm" style={{ color: '#dc2626' }}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div ref={calendarRef} className="border relative" style={{ backgroundColor: 'white', borderColor: '#191A23' }}>
        <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: '#F3F3F3' }}>
          <button 
            onClick={() => setD(new Date(y, m - 1))} 
            className="px-4 py-2 border text-sm font-medium"
            style={{ borderColor: '#575F60' }}
          >
            Previous
          </button>
          <h3 className="text-xl font-medium" style={{ color: '#191A23' }}>
            {d.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            onClick={() => setD(new Date(y, m + 1))} 
            className="px-4 py-2 border text-sm font-medium"
            style={{ borderColor: '#575F60' }}
          >
            Next
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-px" style={{ backgroundColor: '#575F60' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(x => (
            <div key={x} className="text-center font-medium py-2 text-sm" style={{ backgroundColor: '#F3F3F3', color: '#191A23' }}>
              {x}
            </div>
          ))}
          
          {Array.from({ length: first }).map((_, i) => (
            <div key={`e${i}`} style={{ backgroundColor: '#F3F3F3', minHeight: '120px' }} />
          ))}
          
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const bs = getB(day);
            const dateStr = new Date(y, m, day).toISOString().split('T')[0];
            
            return (
              <div 
                key={day} 
                className="p-2 relative"
                style={{ backgroundColor: 'white', minHeight: '120px' }}
                onMouseEnter={(e) => handleMouseEnter(dateStr, e)}
                onMouseLeave={() => setHover(null)}
              >
                <div className="font-semibold text-sm mb-1" style={{ color: '#191A23' }}>
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
                        color: '#191A23'
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
              </div>
            );
          })}
        </div>
        
        {/* Smart positioned tooltip */}
        {hover && getB(parseInt(hover.split('-')[2])).length > 0 && (
          <div 
            className="absolute z-10 border-2 p-3 w-64"
            style={{ 
              backgroundColor: 'white', 
              borderColor: '#FFED00',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              top: `${tooltipPos.y}px`,
              left: `${tooltipPos.x}px`
            }}
          >
            <div className="font-semibold mb-2 text-sm" style={{ color: '#191A23' }}>
              {formatDate(hover)}
            </div>
            {getB(parseInt(hover.split('-')[2])).map(b => {
              const proj = projects.find(p => p.id === b.projectId);
              return (
                <div key={b.id} className="mb-3 pb-3 border-b last:border-b-0" style={{ borderColor: '#F3F3F3' }}>
                  <div className="font-medium text-sm mb-1" style={{ color: '#191A23' }}>
                    {proj?.name}
                  </div>
                  <div className="space-y-1">
                    {b.items.map((bi, idx) => {
                      const it = items.find(item => item.id === bi.itemId);
                      const isRainbow = it?.color && !it.color.startsWith('#');
                      return (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          {it && (
                            <div 
                              className="w-4 h-4 border flex-shrink-0"
                              style={{ 
                                borderColor: '#575F60',
                                ...(isRainbow
                                  ? { background: 'linear-gradient(135deg, red, orange, yellow, green, blue, indigo, violet)' }
                                  : { backgroundColor: it.color || '#9CA3AF' }
                                )
                              }}
                            />
                          )}
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
    </div>
  );
};

import { useState } from 'react';
import { Item, Booking, Project, Group } from '../types';
import { formatDate, formatDateShort } from '../utils/helpers';
import { ItemIcon } from './ItemIcon';

interface CalendarPageProps {
  bookings: Booking[];
  items: Item[];
  projects: Project[];
  groups: Group[];
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ bookings, items, projects, groups }) => {
  const [d, setD] = useState(new Date());
  const [sel, setSel] = useState<string[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  
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
  
  const getB = (day: number) => {
    const ds = new Date(y, m, day).toISOString().split('T')[0];
    let filtered = bookings.filter(b => ds >= b.startDate && ds <= b.endDate);
    
    if (selectedGroups.length > 0 || sel.length > 0) {
      filtered = filtered.filter(b => {
        return b.items.some(bi => {
          const item = items.find(i => i.id === bi.itemId);
          if (!item) return false;
          
          const matchesGroup = selectedGroups.length === 0 || (
            selectedGroups.includes('ungrouped') && !item.groupId
          ) || selectedGroups.includes(item.groupId || '');
          
          const matchesItem = sel.length === 0 || sel.includes(bi.itemId);
          
          return matchesGroup && matchesItem;
        });
      });
    }
    
    return filtered;
  };

  const allItems = items.filter(i => {
    if (selectedGroups.length === 0) return true;
    if (selectedGroups.includes('ungrouped') && !i.groupId) return true;
    return selectedGroups.includes(i.groupId || '');
  });

  return (
    <div style={{ fontFamily: 'Raleway, sans-serif' }}>
      <h2 className="text-base font-semibold mb-3" style={{ color: '#1F1F1F' }}>Calendar</h2>
      
      {/* Filters */}
      <div className="mb-3 p-2 border" style={{ backgroundColor: '#F5F5F5', borderColor: '#575F60' }}>
        <label className="block text-xs font-medium mb-1" style={{ color: '#575F60' }}>Filter</label>
        
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
        
        <div className="flex flex-wrap gap-1">
          <span className="text-xs" style={{ color: '#575F60' }}>Items:</span>
          {allItems.map(i => (
            <button 
              key={i.id} 
              onClick={() => setSel(sel.includes(i.id) ? sel.filter(x => x !== i.id) : [...sel, i.id])} 
              className="flex items-center gap-1 px-2 py-0.5 text-xs border"
              style={{
                backgroundColor: sel.includes(i.id) ? '#FFED00' : 'white',
                borderColor: '#575F60',
                color: '#1F1F1F'
              }}
            >
              <ItemIcon item={i} size="sm" />
              {i.name}
            </button>
          ))}
          {sel.length > 0 && (
            <button 
              onClick={() => setSel([])} 
              className="px-2 py-0.5 text-xs"
              style={{ color: '#dc2626' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      {/* Calendar */}
      <div className="p-2 border" style={{ borderColor: '#575F60', backgroundColor: 'white' }}>
        <div className="flex justify-between items-center mb-3 px-2">
          <button 
            onClick={() => setD(new Date(y, m - 1))} 
            className="px-2 py-1 border text-xs"
            style={{ borderColor: '#575F60', backgroundColor: '#F5F5F5' }}
          >
            Previous
          </button>
          <h3 className="text-sm font-semibold" style={{ color: '#1F1F1F' }}>
            {d.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            onClick={() => setD(new Date(y, m + 1))} 
            className="px-2 py-1 border text-xs"
            style={{ borderColor: '#575F60', backgroundColor: '#F5F5F5' }}
          >
            Next
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-px" style={{ backgroundColor: '#575F60' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(x => (
            <div key={x} className="text-center font-semibold py-1 text-xs" style={{ backgroundColor: '#F5F5F5', color: '#1F1F1F' }}>{x}</div>
          ))}
          
          {Array.from({ length: first }).map((_, i) => <div key={`e${i}`} style={{ backgroundColor: 'white' }} />)}
          
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const bs = getB(day);
            const dateStr = new Date(y, m, day).toISOString().split('T')[0];
            
            return (
              <div 
                key={day} 
                className="p-1 min-h-20 relative"
                style={{ backgroundColor: 'white' }}
                onMouseEnter={() => setHover(dateStr)}
                onMouseLeave={() => setHover(null)}
              >
                <div className="font-semibold mb-0.5 text-xs" style={{ color: '#1F1F1F' }}>{formatDateShort(dateStr)}</div>
                
                {bs.slice(0, 2).map(b => {
                  const proj = projects.find(p => p.id === b.projectId);
                  return (
                    <div key={b.id} className="text-xs px-1 py-0.5 mb-0.5 truncate" style={{ backgroundColor: '#FFED00', color: '#1F1F1F' }}>
                      {proj?.name}
                    </div>
                  );
                })}
                
                {bs.length > 2 && <div className="text-xs" style={{ color: '#575F60' }}>+{bs.length - 2}</div>}
                
                {hover === dateStr && bs.length > 0 && (
                  <div className="absolute z-10 bg-white border-2 shadow-lg p-2 w-56 top-full left-0 mt-1" style={{ borderColor: '#FFED00' }}>
                    <div className="font-semibold mb-1 text-xs" style={{ color: '#FFED00' }}>{formatDate(dateStr)}</div>
                    {bs.map(b => {
                      const proj = projects.find(p => p.id === b.projectId);
                      return (
                        <div key={b.id} className="mb-2 pb-2 border-b last:border-b-0" style={{ borderColor: '#e5e7eb' }}>
                          <div className="font-medium text-xs mb-0.5" style={{ color: '#1F1F1F' }}>{proj?.name}</div>
                          <div className="space-y-0.5">
                            {b.items.map((bi, idx) => {
                              const it = items.find(item => item.id === bi.itemId);
                              return (
                                <div key={idx} className="flex items-center gap-1 text-xs">
                                  {it && <ItemIcon item={it} size="sm" />}
                                  <span style={{ color: '#1F1F1F' }}>{it?.name} ×{bi.quantity}</span>
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

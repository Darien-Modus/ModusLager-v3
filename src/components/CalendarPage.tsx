import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { Booking, Item, Project, Group } from '../types';
import { formatDate } from '../utils/helpers';

interface CalendarPageProps {
  bookings: Booking[];
  items: Item[];
  projects: Project[];
  groups: Group[];
  onOpenBookingModal?: () => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ bookings, items, projects, groups, onOpenBookingModal }) => {
  const [d, setD] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'potential'>('all');
  const [hover, setHover] = useState<string | null>(null);
  const [hoverBookings, setHoverBookings] = useState<Booking[]>([]);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const calendarRef = useRef<HTMLDivElement>(null);
  
  const y = d.getFullYear();
  const m = d.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  
  const getB = (day: number) => {
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    let filtered = bookings.filter(b => ds >= b.startDate && ds <= b.endDate);
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }
    
    return filtered;
  };

  const handleMouseEnter = (dateStr: string, bookingsForDay: Booking[], event: React.MouseEvent<HTMLDivElement>) => {
    setHover(dateStr);
    setHoverBookings(bookingsForDay);
    
    if (calendarRef.current) {
      const rect = calendarRef.current.getBoundingClientRect();
      const cellRect = event.currentTarget.getBoundingClientRect();
      
      const relativeX = cellRect.left - rect.left;
      const relativeY = cellRect.top - rect.top;
      
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
      <h2 className="text-4xl font-medium mb-6" style={{ color: '#191A23' }}>Calendar</h2>

      <div className="mb-6 border-2" style={{ backgroundColor: '#191A23', borderColor: '#191A23', maxWidth: '1248px', margin: '0 auto 24px', height: '90px' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 24px', gap: '16px' }}>
          <span className="text-sm font-medium" style={{ color: '#FFED00', flexShrink: 0 }}>Show:</span>
          <button onClick={() => setStatusFilter('all')} className="px-4 py-2 text-sm border-2" style={{ backgroundColor: statusFilter === 'all' ? '#FFED00' : 'white', borderColor: statusFilter === 'all' ? '#191A23' : '#575F60', color: '#191A23', flexShrink: 0 }}>All Bookings</button>
          <button onClick={() => setStatusFilter('confirmed')} className="px-4 py-2 text-sm border-2" style={{ backgroundColor: statusFilter === 'confirmed' ? '#FFED00' : 'white', borderColor: statusFilter === 'confirmed' ? '#191A23' : '#575F60', color: '#191A23', flexShrink: 0 }}>Confirmed</button>
          <button onClick={() => setStatusFilter('potential')} className="px-4 py-2 text-sm border-2" style={{ backgroundColor: statusFilter === 'potential' ? '#e9e3d3' : 'white', borderColor: statusFilter === 'potential' ? '#191A23' : '#575F60', color: '#191A23', flexShrink: 0, borderStyle: statusFilter === 'potential' ? 'dashed' : 'solid', fontStyle: statusFilter === 'potential' ? 'italic' : 'normal' }}>Potential</button>
          <div style={{ flex: 1 }} />
          {/* UPDATED: px-2 instead of px-6, strict width: 160px */}
          <button onClick={onOpenBookingModal} className="flex items-center justify-center gap-2 px-2 py-2 text-sm font-medium border-2" style={{ backgroundColor: '#FFED00', borderColor: '#191A23', color: '#191A23', flexShrink: 0, width: '160px' }}>
            <Plus className="w-5 h-5" /> Add Booking
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1248px', margin: '0 auto' }}>
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setD(new Date(y, m - 1))} className="px-4 py-2 border-2 text-sm font-medium" style={{ borderColor: '#575F60', color: '#191A23' }}>Previous</button>
          <h3 className="text-2xl font-medium" style={{ color: '#191A23' }}>{new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(d)}</h3>
          <button onClick={() => setD(new Date(y, m + 1))} className="px-4 py-2 border-2 text-sm font-medium" style={{ borderColor: '#575F60', color: '#191A23' }}>Next</button>
        </div>

        <div ref={calendarRef} className="relative border-2" style={{ borderColor: '#191A23', backgroundColor: 'white' }}>
          <div className="grid grid-cols-7 border-b-2" style={{ borderColor: '#191A23' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium" style={{ color: '#575F60', backgroundColor: '#F3F3F3' }}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: first }, (_, i) => <div key={`empty-${i}`} className="border-r border-b" style={{ borderColor: '#F3F3F3', height: '200px' }} />)}
            {Array.from({ length: days }, (_, i) => {
              const day = i + 1;
              const bs = getB(day);
              const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              
              return (
                <div key={day} className="border-r border-b relative" style={{ borderColor: '#F3F3F3', height: '200px', backgroundColor: isToday ? '#fffcd0' : 'white' }} onMouseEnter={(e) => handleMouseEnter(dateStr, bs, e)} onMouseLeave={() => setHover(null)}>
                  <div className="p-2">
                    <span className="text-sm font-medium" style={{ color: isToday ? '#191A23' : '#575F60' }}>{day}</span>
                  </div>
                  {bs.length > 0 && (
                    <div className="px-2 pb-2 space-y-1">
                      {bs.slice(0, 5).map(b => {
                        const project = projects.find(p => p.id === b.projectId);
                        const isConfirmed = b.status === 'confirmed';
                        
                        return (
                          <div key={b.id} className="text-xs px-2 py-1 truncate border" style={{ 
                            backgroundColor: isConfirmed ? '#FFED00' : '#e9e3d3', 
                            color: '#191A23',
                            borderColor: '#191A23',
                            borderStyle: isConfirmed ? 'solid' : 'dashed',
                            fontStyle: isConfirmed ? 'normal' : 'italic'
                          }}>
                            {project?.name || 'Unknown'}
                          </div>
                        );
                      })}
                      {bs.length > 5 && <div className="text-xs px-2" style={{ color: '#575F60' }}>+{bs.length - 5} more</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {hover && hoverBookings.length > 0 && (
            <div className="absolute z-10 border-2 p-4 shadow-lg" style={{ backgroundColor: 'white', borderColor: '#191A23', left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px`, width: '320px', maxHeight: '400px', overflowY: 'auto' }}>
              <div className="text-sm font-medium mb-3" style={{ color: '#191A23' }}>{formatDate(hover)}</div>
              <div className="space-y-2">
                {hoverBookings.map(b => {
                  const project = projects.find(p => p.id === b.projectId);
                  const isConfirmed = b.status === 'confirmed';
                  
                  return (
                    <div key={b.id} className="border p-2" style={{ 
                      borderColor: '#191A23',
                      borderStyle: isConfirmed ? 'solid' : 'dashed',
                      fontStyle: isConfirmed ? 'normal' : 'italic'
                    }}>
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 pr-2">
                          <div className="text-sm font-medium" style={{ color: '#191A23' }}>{project?.name || 'Unknown'}</div>
                          {project && (
                            <div className="text-xs mt-1" style={{ color: '#575F60' }}>
                              #{project.number} • {project.client}
                            </div>
                          )}
                        </div>
                        <span className="px-2 py-0.5 text-xs" style={{ 
                          backgroundColor: isConfirmed ? '#FFED00' : '#e9e3d3', 
                          color: '#191A23',
                          borderRadius: '3px'
                        }}>{b.status}</span>
                      </div>
                      <div className="text-xs mt-2" style={{ color: '#575F60' }}>{formatDate(b.startDate)} - {formatDate(b.endDate)}</div>
                      <div className="text-xs mt-1" style={{ color: '#575F60' }}>{b.items.length} items</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
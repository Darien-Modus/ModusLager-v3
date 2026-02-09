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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-medium" style={{ color: '#191A23' }}>Calendar</h2>
        <button 
          onClick={onOpenBookingModal}
          className="flex items-center gap-2 px-6 py-3 text-sm font-medium border-2"
          style={{ backgroundColor: '#FFED00', borderColor: '#191A23', color: '#191A23' }}
        >
          <Plus className="w-5 h-5" /> Add Booking
        </button>
      </div>
      
      <div className="mb-6 p-6 border-2" style={{ backgroundColor: '#191A23', borderColor: '#191A23' }}>
        <span className="text-sm font-medium mr-3" style={{ color: '#FFED00' }}>Show:</span>
        <div className="inline-flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className="px-4 py-2 text-sm border-2"
            style={{
              backgroundColor: statusFilter === 'all' ? '#FFED00' : 'white',
              borderColor: statusFilter === 'all' ? '#191A23' : '#575F60',
              color: '#191A23'
            }}
          >
            All Bookings
          </button>
          <button
            onClick={() => setStatusFilter('confirmed')}
            className="px-4 py-2 text-sm border-2"
            style={{
              backgroundColor: statusFilter === 'confirmed' ? '#FFED00' : 'white',
              borderColor: statusFilter === 'confirmed' ? '#191A23' : '#575F60',
              color: '#191A23'
            }}
          >
            Confirmed Only
          </button>
          <button
            onClick={() => setStatusFilter('potential')}
            className="px-4 py-2 text-sm border-2"
            style={{
              backgroundColor: statusFilter === 'potential' ? '#FFF8DC' : 'white',
              borderColor: statusFilter === 'potential' ? '#191A23' : '#575F60',
              color: '#191A23'
            }}
          >
            Potential Only
          </button>
        </div>
      </div>
      
      <div ref={calendarRef} className="border-2 relative" style={{ backgroundColor: 'white', borderColor: '#191A23' }}>
        <div className="flex justify-between items-center p-4 border-b-2" style={{ borderColor: '#F3F3F3' }}>
          <button 
            onClick={() => setD(new Date(y, m - 1))} 
            className="px-4 py-2 border-2 text-sm font-medium"
            style={{ borderColor: '#575F60' }}
          >
            Previous
          </button>
          <h3 className="text-xl font-medium" style={{ color: '#191A23' }}>
            {d.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            onClick={() => setD(new Date(y, m + 1))} 
            className="px-4 py-2 border-2 text-sm font-medium"
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
            const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            return (
              <div 
                key={day} 
                className="p-2 relative"
                style={{ backgroundColor: 'white', minHeight: '120px' }}
                onMouseEnter={(e) => handleMouseEnter(dateStr, bs, e)}
                onMouseLeave={() => setHover(null)}
              >
                <div className="font-semibold text-sm mb-1" style={{ color: '#191A23' }}>
                  {day}
                </div>
                
                {bs.slice(0, 5).map((b) => {
                  const proj = projects.find(p => p.id === b.projectId);
                  const isPotential = b.status === 'potential';
                  return (
                    <div 
                      key={b.id} 
                      className="text-xs px-1 py-0.5 mb-0.5 truncate border"
                      style={{ 
                        backgroundColor: isPotential ? '#FFF8DC' : '#FFED00',
                        color: '#191A23',
                        borderColor: '#191A23',
                        borderStyle: isPotential ? 'dashed' : 'solid',
                        opacity: isPotential ? 0.7 : 1,
                        fontStyle: isPotential ? 'italic' : 'normal'
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
        
        {hover && hoverBookings.length > 0 && (
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
            {hoverBookings.map(b => {
              const proj = projects.find(p => p.id === b.projectId);
              const isPotential = b.status === 'potential';
              return (
                <div key={b.id} className="mb-3 pb-3 border-b last:border-b-0" style={{ borderColor: '#F3F3F3' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium text-sm" style={{ color: '#191A23', fontStyle: isPotential ? 'italic' : 'normal' }}>
                      {proj?.name}
                    </div>
                    <span 
                      className="px-1 py-0.5 text-xs border"
                      style={{
                        backgroundColor: isPotential ? '#FFF8DC' : '#FFED00',
                        borderColor: '#191A23',
                        borderStyle: isPotential ? 'dashed' : 'solid',
                        color: '#191A23'
                      }}
                    >
                      {isPotential ? 'P' : 'C'}
                    </span>
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

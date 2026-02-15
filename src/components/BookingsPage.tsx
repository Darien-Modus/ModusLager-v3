import { useState, useRef, useEffect } from 'react';
import { Edit2, Trash2, Plus, X, Search, Calendar } from 'lucide-react';
import { Booking, BookingItem, Item, Project, Group, BookingStatus } from '../types';
import { calcAvailable, formatDate } from '../utils/helpers';
import { supabase } from '../utils/supabase';

interface BookingsPageProps {
  bookings: Booking[];
  items: Item[];
  projects: Project[];
  groups: Group[];
  refreshData: () => void;
  shouldOpenModal?: boolean;
  onModalClose?: () => void;
}

export const BookingsPage: React.FC<BookingsPageProps> = ({ bookings, items, projects, groups, refreshData, shouldOpenModal, onModalClose }) => {
  const beMatrixGroup = groups.find(g => g.name === 'BeMatrix Frames');
  
  const [bis, setBis] = useState<BookingItem[]>([{ itemId: '', quantity: 0 }]);
  const [pid, setPid] = useState('');
  const [start, setStart] = useState(''); // Always YYYY-MM-DD
  const [end, setEnd] = useState('');     // Always YYYY-MM-DD
  const [status, setStatus] = useState<BookingStatus>('confirmed');
  const [edit, setEdit] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>(beMatrixGroup ? [beMatrixGroup.id] : []);
  const [projectSearch, setProjectSearch] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(shouldOpenModal || false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'potential'>('all');
  
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const itemDropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Hidden date input refs to trigger picker programmatically
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setShowProjectDropdown(false);
      }
      if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target as Node)) {
        setActiveItemIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (shouldOpenModal) setShowModal(true);
  }, [shouldOpenModal]);

  const toggleGroup = (groupId: string) => {
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
          return !item.groupId || selectedGroups.includes(item.groupId || '');
        }
        return selectedGroups.includes(item.groupId || '');
      });
    }
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  const filteredProjects = (projects || []).filter(p => {
    if (!p) return false;
    const searchLower = projectSearch.toLowerCase();
    const name = String(p.name || '').toLowerCase();
    const number = String(p.number || '').toLowerCase();
    return name.includes(searchLower) || number.includes(searchLower);
  });

  const selectProject = (project: Project) => {
    setPid(project.id);
    setProjectSearch(project.name);
    setShowProjectDropdown(false);
  };

  const openModal = () => {
    setShowModal(true);
    setBis([{ itemId: '', quantity: 0 }]);
    setPid(''); setStart(''); setEnd(''); setStatus('confirmed');
    setProjectSearch(''); setEdit(null); setErr('');
  };

  const closeModal = () => {
    setShowModal(false);
    if (onModalClose) onModalClose();
  };

  const editBooking = (booking: Booking) => {
    setEdit(booking.id);
    setBis(booking.items);
    setPid(booking.projectId);
    const project = projects.find(p => p.id === booking.projectId);
    setProjectSearch(project ? project.name : '');
    setStart(booking.startDate);
    setEnd(booking.endDate);
    setStatus(booking.status || 'confirmed');
    setShowModal(true);
  };

  const addItem = () => setBis([...bis, { itemId: '', quantity: 0 }]);

  const removeItem = (idx: number) => {
    if (bis.length === 1) return;
    setBis(bis.filter((_, i) => i !== idx));
  };

  const hasQuantityError = bis.some(bi => {
    if (!bi.itemId || !start || !end) return false;
    const avail = calcAvailable(bi.itemId, start, end, bookings.filter(b => b.id !== edit), items);
    return bi.quantity > avail;
  });

  const save = async () => {
    if (!pid || !start || !end || bis.some(bi => !bi.itemId || bi.quantity <= 0)) {
      setErr('Fill all fields');
      return;
    }
    if (hasQuantityError) return;

    setSaving(true);
    try {
      if (edit) {
        await supabase.from('booking_items').delete().eq('booking_id', edit);
        await supabase.from('bookings').update({ project_id: pid, start_date: start, end_date: end, status }).eq('id', edit);
        for (const bi of bis) {
          await supabase.from('booking_items').insert([{ booking_id: edit, item_id: bi.itemId, quantity: bi.quantity }]);
        }
      } else {
        const { data: bData } = await supabase.from('bookings').insert([{ project_id: pid, start_date: start, end_date: end, status }]).select();
        const bookingId = bData![0].id;
        for (const bi of bis) {
          await supabase.from('booking_items').insert([{ booking_id: bookingId, item_id: bi.itemId, quantity: bi.quantity }]);
        }
      }
      await refreshData();
      closeModal();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete booking?')) return;
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // --- Date Logic ---
  // Converts YYYY-MM-DD to DD/MM/YYYY for display
  const toEuro = (isoDate: string) => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  // Handles manual typing in the text field
  const handleManualDate = (val: string, setter: (s: string) => void) => {
    // 1. Remove non-digits
    let raw = val.replace(/\D/g, '').slice(0, 8);
    
    // 2. Add slashes for display
    // Note: We don't update the state 'setter' until we have a valid date, 
    // but we can't easily decouple display from state in this simple setup 
    // without a separate state for the input string.
    // Instead, we will try to parse valid dates immediately.
    
    if (raw.length === 8) {
      const d = raw.slice(0, 2);
      const m = raw.slice(2, 4);
      const y = raw.slice(4, 8);
      setter(`${y}-${m}-${d}`); // Set ISO format (YYYY-MM-DD)
    } else {
        // If incomplete, we temporarily set it to empty or invalid in state
        // This is a trade-off. To keep it perfect we'd need separate state variables for "inputValue".
        // For now, let's just let the user use the picker if they struggle, 
        // or ensure we only trigger the setter on valid length.
        if(val === '') setter('');
    }
  };

  // Since we are binding the input value directly to 'start' (ISO), 
  // we actually need a small separate state or a transformer to allow typing slashes.
  // A cleaner way for this specific "Force" request without extra state overhead:
  // use <input type="date"> hidden + <input type="text"> visible.
  // The Text Input needs to handle the formatting.

  // Let's create a small sub-component or just render logic for the inputs to keep it clean.
  const DateInputGroup = ({ 
    label, 
    value, 
    onChange, 
    pickerRef 
  }: { 
    label: string, 
    value: string, 
    onChange: (v: string) => void,
    pickerRef: React.RefObject<HTMLInputElement>
  }) => {
    const [textVal, setTextVal] = useState(toEuro(value));

    // Sync text if external value changes (e.g. from picker)
    useEffect(() => {
        setTextVal(toEuro(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(/[^0-9]/g, '');
        if (v.length > 8) v = v.slice(0, 8);
        
        // Masking logic
        let formatted = v;
        if (v.length > 2) formatted = `${v.slice(0, 2)}/${v.slice(2)}`;
        if (v.length > 4) formatted = `${formatted.slice(0, 5)}/${v.slice(4)}`;
        
        setTextVal(formatted);

        // If complete, update parent state
        if (v.length === 8) {
            const d = v.slice(0, 2);
            const m = v.slice(2, 4);
            const y = v.slice(4, 8);
            onChange(`${y}-${m}-${d}`);
        } else if (v.length === 0) {
            onChange('');
        }
    };

    const triggerPicker = () => {
        if(pickerRef.current && 'showPicker' in HTMLInputElement.prototype) {
            try {
                pickerRef.current.showPicker();
            } catch (e) {
                // Fallback for older browsers: focus the hidden input
                pickerRef.current.focus(); 
            }
        }
    }

    return (
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>{label}</label>
        <div className="relative">
            <input 
                type="text" 
                value={textVal}
                onChange={handleChange}
                placeholder="DD/MM/YYYY" 
                className="w-full px-3 py-2 border text-sm" 
                style={{ borderColor: '#575F60' }} 
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer" onClick={triggerPicker}>
                <Calendar className="w-4 h-4 text-gray-500 hover:text-black" />
            </div>
            {/* Hidden Native Picker */}
            <input 
                type="date" 
                ref={pickerRef}
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none" 
                style={{visibility: 'hidden'}}
            />
        </div>
      </div>
    );
  };

  const renderItemIcon = (item: Item) => {
    const hasImages = item.images && item.images.length > 0;
    const iconIndex = item.iconIndex !== undefined ? item.iconIndex : -1;
    if (iconIndex === -1 || !hasImages) {
      return <div className="w-5 h-5 rounded-full" style={{ backgroundColor: item.color || '#9CA3AF' }} />;
    }
    return <img src={item.images![iconIndex]} alt={item.name} className="w-5 h-5 rounded-full object-cover" />;
  };

  return (
    <div style={{ fontFamily: "Raleway, sans-serif" }}>
      <h2 className="text-4xl font-medium mb-6" style={{ color: '#191A23' }}>Bookings</h2>

      {/* TBS - Top Black Section (Synced with Calendar) */}
      <div className="mb-6 border-2" style={{ backgroundColor: '#191A23', borderColor: '#191A23', maxWidth: '1248px', margin: '0 auto 24px', height: '90px' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 24px', gap: '16px' }}>
          <span className="text-sm font-medium" style={{ color: '#FFED00', flexShrink: 0 }}>Show:</span>
          <button onClick={() => setStatusFilter('all')} className="px-4 py-2 text-sm border-2" style={{ backgroundColor: statusFilter === 'all' ? '#FFED00' : 'white', borderColor: statusFilter === 'all' ? '#191A23' : '#575F60', color: '#191A23', flexShrink: 0 }}>All Bookings</button>
          <button onClick={() => setStatusFilter('confirmed')} className="px-4 py-2 text-sm border-2" style={{ backgroundColor: statusFilter === 'confirmed' ? '#FFED00' : 'white', borderColor: statusFilter === 'confirmed' ? '#191A23' : '#575F60', color: '#191A23', flexShrink: 0 }}>Confirmed</button>
          <button onClick={() => setStatusFilter('potential')} className="px-4 py-2 text-sm border-2" style={{ backgroundColor: statusFilter === 'potential' ? '#e9e3d3' : 'white', borderColor: statusFilter === 'potential' ? '#191A23' : '#575F60', color: '#191A23', flexShrink: 0, borderStyle: statusFilter === 'potential' ? 'dashed' : 'solid', fontStyle: statusFilter === 'potential' ? 'italic' : 'normal' }}>Potential</button>
          <div style={{ flex: 1 }} />
          {/* UPDATED: px-2 instead of px-6, strict width: 160px */}
          <button onClick={openModal} className="flex items-center justify-center gap-2 px-2 py-2 text-sm font-medium border-2" style={{ backgroundColor: '#FFED00', borderColor: '#191A23', color: '#191A23', flexShrink: 0, width: '160px' }}>
            <Plus className="w-5 h-5" /> Add Booking
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1248px', margin: '0 auto' }}>
        {bookings.length === 0 ? (
          <div className="text-center py-16 border-2" style={{ backgroundColor: 'white', borderColor: '#575F60', borderStyle: 'dashed' }}>
            <p style={{ color: '#575F60' }}>No bookings found</p>
          </div>
        ) : (
          <div className="border-2" style={{ backgroundColor: 'white', borderColor: '#191A23' }}>
            <table className="w-full">
              <thead style={{ backgroundColor: '#F3F3F3' }}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60', width: '10px' }}></th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60', width: '100px' }}>Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60' }}>Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60', width: '180px' }}>Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60', width: '140px' }}>Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60', width: '100px' }}>Start</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60', width: '100px' }}>End</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60', width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.filter(b => statusFilter === 'all' || b.status === statusFilter).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(booking => {
                  const project = projects.find(p => p.id === booking.projectId);
                  const isConfirmed = booking.status === 'confirmed';
                  return (
                    <tr key={booking.id} className="border-t-2" style={{ 
                      borderColor: '#F3F3F3', backgroundColor: isConfirmed ? '#FFFEF5' : '#F5F5F0',
                      fontStyle: isConfirmed ? 'normal' : 'italic', borderLeft: `4px ${isConfirmed ? 'solid' : 'dashed'} ${isConfirmed ? '#FFED00' : '#e9e3d3'}`
                    }}>
                      <td className="px-0 py-3"><div style={{ width: '4px' }} /></td>
                      <td className="px-4 py-3">
                        <span className="px-3 py-1 text-xs" style={{ backgroundColor: isConfirmed ? '#FFED00' : '#e9e3d3', color: '#191A23', borderRadius: '4px' }}>{booking.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {booking.items.slice(0, 3).map(bi => {
                            const item = items.find(i => i.id === bi.itemId);
                            return item ? (
                              <div key={bi.itemId} className="flex items-center gap-1 px-2 py-1 text-xs border" style={{ borderColor: '#575F60', backgroundColor: 'white', borderRadius: '3px' }}>
                                {renderItemIcon(item)} <span style={{ color: '#191A23' }}>{item.name}</span> <span className="font-medium" style={{ color: '#575F60' }}>×{bi.quantity}</span>
                              </div>
                            ) : null;
                          })}
                          {booking.items.length > 3 && <span className="text-xs px-2" style={{ color: '#575F60' }}>+{booking.items.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#191A23' }}>{project?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#575F60' }}>{project?.client || '-'}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#191A23' }}>{formatDate(booking.startDate)}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#191A23' }}>{formatDate(booking.endDate)}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => editBooking(booking)} style={{ color: '#575F60' }}><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => del(booking.id)} style={{ color: '#dc2626' }}><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div ref={modalRef} className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2" style={{ borderColor: '#191A23', minHeight: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-medium" style={{ color: '#191A23' }}>{edit ? 'Edit Booking' : 'New Booking'}</h3>
              <button onClick={closeModal}><X className="w-6 h-6" style={{ color: '#575F60' }} /></button>
            </div>
            
            {err && <div className="mb-4 p-3 text-sm" style={{ backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>{err}</div>}
            
            <div className="space-y-4">
              {/* Project Search (Dropdown Style) */}
              <div ref={projectDropdownRef} className="relative">
                <label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Project</label>
                <input 
                  type="text" 
                  value={projectSearch} 
                  onChange={e => { setProjectSearch(e.target.value); setShowProjectDropdown(true); }} 
                  onFocus={() => setShowProjectDropdown(true)} 
                  placeholder="Search projects..." 
                  className="w-full px-3 py-2 border text-sm" 
                  style={{ borderColor: '#575F60' }} 
                />
                {showProjectDropdown && (
                  <div className="absolute z-10 w-full mt-1 border-2 max-h-60 overflow-y-auto bg-white" style={{ borderColor: '#575F60' }}>
                    {filteredProjects.length > 0 ? filteredProjects.map(p => (
                      <div key={p.id} onClick={() => selectProject(p)} className="px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm" style={{ color: '#191A23' }}>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs" style={{ color: '#575F60' }}>#{p.number} - {p.client}</div>
                      </div>
                    )) : (
                      <div className="px-3 py-2 text-sm text-gray-500">No projects found</div>
                    )}
                  </div>
                )}
              </div>

              {/* DATE PICKERS - Hybrid Input */}
              <div className="grid grid-cols-2 gap-4">
                <DateInputGroup label="Start Date" value={start} onChange={setStart} pickerRef={startDateRef} />
                <DateInputGroup label="End Date" value={end} onChange={setEnd} pickerRef={endDateRef} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Status</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setStatus('confirmed')} className="flex-1 px-4 py-2 border-2 text-sm font-medium" style={{ backgroundColor: status === 'confirmed' ? '#FFED00' : 'white', borderColor: status === 'confirmed' ? '#191A23' : '#575F60', color: '#191A23' }}>
                    Confirmed
                  </button>
                  <button type="button" onClick={() => setStatus('potential')} className="flex-1 px-4 py-2 border-2 text-sm font-medium" style={{ backgroundColor: status === 'potential' ? '#e9e3d3' : 'white', borderColor: status === 'potential' ? '#191A23' : '#575F60', color: '#191A23', borderStyle: status === 'potential' ? 'dashed' : 'solid', fontStyle: status === 'potential' ? 'italic' : 'normal' }}>
                    Potential
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Items</label>
                <div className="mb-3 flex gap-2 flex-wrap">
                  {groups.map(g => (
                    <button key={g.id} type="button" onClick={() => toggleGroup(g.id)} className="px-3 py-1.5 text-xs border-2" style={{ backgroundColor: selectedGroups.includes(g.id) ? '#FFED00' : 'white', borderColor: selectedGroups.includes(g.id) ? '#191A23' : '#575F60' }}>
                      {g.name}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {bis.map((bi, idx) => {
                    const currentItem = items.find(i => i.id === bi.itemId);
                    const avail = bi.itemId ? calcAvailable(bi.itemId, start, end, bookings.filter(b => b.id !== edit), items) : 0;
                    const isOver = bi.itemId && bi.quantity > avail;
                    
                    return (
                      <div key={idx} className="flex gap-4 items-start relative" style={{ zIndex: activeItemIndex === idx ? 50 : 10 }}>
                        <div className="flex-[3] relative" ref={idx === activeItemIndex ? itemDropdownRef : null}>
                          <input 
                            type="text" 
                            placeholder="Search items..." 
                            value={activeItemIndex === idx ? searchTerm : (currentItem?.name || '')} 
                            onFocus={() => { setActiveItemIndex(idx); setSearchTerm(''); }}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border text-sm" 
                            style={{ borderColor: '#575F60' }} 
                          />
                          {activeItemIndex === idx && (
                            <div className="absolute z-50 w-full mt-1 border-2 max-h-48 overflow-y-auto bg-white" style={{ borderColor: '#575F60' }}>
                              {filterItems().map(item => (
                                <div 
                                  key={item.id} 
                                  onClick={() => {
                                    setBis(bis.map((b, i) => i === idx ? { ...b, itemId: item.id } : b));
                                    setActiveItemIndex(null);
                                  }} 
                                  className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 border-b last:border-0"
                                >
                                  {renderItemIcon(item)}
                                  <div className="flex flex-col">
                                    <span style={{ color: '#191A23' }}>{item.name}</span>
                                    <span className="text-[10px]" style={{ color: '#575F60' }}>{calcAvailable(item.id, start, end, bookings.filter(b => b.id !== edit), items)} available</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="w-32">
                          <input 
                            type="number" 
                            min="1" 
                            value={bi.quantity || ''} 
                            onChange={e => setBis(bis.map((b, i) => i === idx ? { ...b, quantity: parseInt(e.target.value) || 0 } : b))} 
                            placeholder="Qty" 
                            className="w-full px-3 py-2 border text-sm" 
                            style={{ borderColor: isOver ? '#dc2626' : '#575F60' }} 
                          />
                          {isOver && <span className="text-[10px] text-red-600 block mt-1">Exceeds available stock</span>}
                        </div>
                        
                        <button type="button" onClick={() => removeItem(idx)} disabled={bis.length === 1} className="mt-2" style={{ color: '#575F60' }}>
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                  
                  <button type="button" onClick={addItem} className="w-full px-3 py-2 border-2 text-sm" style={{ borderColor: '#575F60', color: '#575F60' }}>
                    <Plus className="w-4 h-4 inline mr-2" />Add Item
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={closeModal} className="px-6 py-3 text-sm font-medium border-2" style={{ borderColor: '#575F60', color: '#575F60' }}>Cancel</button>
                <button onClick={save} disabled={saving || hasQuantityError} className="flex-1 px-6 py-3 text-sm font-medium border-2" style={{ backgroundColor: (saving || hasQuantityError) ? '#f3f4f6' : '#FFED00', borderColor: '#191A23', color: (saving || hasQuantityError) ? '#9ca3af' : '#191A23', cursor: (saving || hasQuantityError) ? 'not-allowed' : 'pointer', opacity: (saving || hasQuantityError) ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : edit ? 'Update Booking' : 'Add Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
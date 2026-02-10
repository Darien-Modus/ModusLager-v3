import { useState, useRef, useEffect } from 'react';
import { Edit2, Trash2, Plus, X, Search } from 'lucide-react';
import { Booking, BookingItem, Item, Project, Group, BookingStatus } from '../types';
import { calcAvailable, formatDate } from '../utils/helpers';
import { ItemIcon } from './ItemIcon';
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
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [status, setStatus] = useState<BookingStatus>('confirmed');
  const [edit, setEdit] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>(beMatrixGroup ? [beMatrixGroup.id] : []);
  const [projectSearch, setProjectSearch] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showModal, setShowModal] = useState(shouldOpenModal || false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'potential'>('all');
  
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setShowProjectDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (shouldOpenModal) {
      setShowModal(true);
    }
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
    const client = String(p.client || '').toLowerCase();
    return name.includes(searchLower) || number.includes(searchLower) || client.includes(searchLower);
  });

  const selectProject = (project: Project) => {
    setPid(project.id);
    setProjectSearch(project.name);
    setShowProjectDropdown(false);
  };

  const openModal = () => {
    setShowModal(true);
    setBis([{ itemId: '', quantity: 0 }]);
    setPid('');
    setStart('');
    setEnd('');
    setStatus('confirmed');
    setEdit(null);
    setErr('');
    setProjectSearch('');
  };

  const openEditModal = (booking: Booking) => {
    setEdit(booking.id);
    setBis(booking.items);
    setPid(booking.projectId);
    setStart(booking.startDate);
    setEnd(booking.endDate);
    setStatus(booking.status);
    const proj = projects.find(p => p.id === booking.projectId);
    if (proj) setProjectSearch(proj.name);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setBis([{ itemId: '', quantity: 0 }]);
    setPid('');
    setStart('');
    setEnd('');
    setStatus('confirmed');
    setEdit(null);
    setErr('');
    setProjectSearch('');
    if (onModalClose) onModalClose();
  };

  const save = async () => {
    if (!pid || !start || !end || bis.length === 0) { 
      setErr('All fields required'); 
      return; 
    }
    
    for (const bi of bis) {
      if (!bi.itemId || bi.quantity <= 0) { 
        setErr('All items need selection and quantity > 0'); 
        return; 
      }
      
      const item = items.find(i => i.id === bi.itemId);
      if (item && bi.quantity > item.totalQuantity) {
        setErr("Looks like you don't own so many! Check the Inventory page");
        return;
      }
      
      const avail = calcAvailable(bi.itemId, start, end, bookings, items, edit || undefined);
      if (bi.quantity > avail) {
        setErr("Oooops! Looks like someone beat you to it. One or more items are already booked for that period.");
        return;
      }
    }
    
    setSaving(true);
    try {
      if (edit) {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            project_id: pid,
            start_date: start,
            end_date: end,
            status: status
          })
          .eq('id', edit);
        
        if (bookingError) throw bookingError;
        
        const { error: deleteError } = await supabase
          .from('booking_items')
          .delete()
          .eq('booking_id', edit);
        
        if (deleteError) throw deleteError;
        
        const bookingItems = bis.filter(b => b.itemId && b.quantity > 0).map(bi => ({
          booking_id: edit,
          item_id: bi.itemId,
          quantity: bi.quantity
        }));
        
        const { error: itemsError } = await supabase
          .from('booking_items')
          .insert(bookingItems);
        
        if (itemsError) throw itemsError;
      } else {
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .insert([{
            project_id: pid,
            start_date: start,
            end_date: end,
            status: status
          }])
          .select()
          .single();
        
        if (bookingError) throw bookingError;
        
        const bookingItems = bis.filter(b => b.itemId && b.quantity > 0).map(bi => ({
          booking_id: bookingData.id,
          item_id: bi.itemId,
          quantity: bi.quantity
        }));
        
        const { error: itemsError } = await supabase
          .from('booking_items')
          .insert(bookingItems);
        
        if (itemsError) throw itemsError;
      }
      
      await refreshData();
      closeModal();
    } catch (error: any) {
      console.error('Error saving booking:', error);
      setErr(error.message || 'Error saving booking');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this booking?')) return;
    
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await refreshData();
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      alert('Error deleting booking. Check console for details.');
    }
  };

  const filteredItems = filterItems();
  
  const filteredBookings = bookings.filter(b => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });
  return (
    <div style={{ fontFamily: "Raleway, sans-serif" }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-medium" style={{ color: '#191A23' }}>Bookings</h2>
        <button 
          onClick={openModal}
          className="flex items-center gap-2 px-6 py-3 text-sm font-medium border-2"
          style={{ backgroundColor: '#FFED00', borderColor: '#191A23', color: '#191A23' }}
        >
          <Plus className="w-5 h-5" /> Add Booking
        </button>
      </div>

      {/* Status Filter */}
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
            Confirmed
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
            Potential
          </button>
        </div>
      </div>
      
      {/* Bookings Table */}
      <div className="border-2" style={{ backgroundColor: 'white', borderColor: '#191A23' }}>
        <table className="w-full">
          <thead style={{ backgroundColor: '#F3F3F3' }}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60' }}>Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60' }}>Items</th>
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60' }}>Project</th>
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60' }}>Start</th>
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60' }}>End</th>
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map(b => {
              const isPotential = b.status === 'potential';
              return (
                <tr 
                  key={b.id} 
                  className="border-t-2"
                  style={{ 
                    borderColor: '#F3F3F3',
                    backgroundColor: isPotential ? '#FFF8DC' : '#FFED00',
                    opacity: isPotential ? 0.7 : 1
                  }}
                >
                  <td className="px-4 py-3">
                    <span 
                      className="px-2 py-1 text-xs font-medium border"
                      style={{ 
                        backgroundColor: isPotential ? 'white' : '#191A23',
                        borderColor: '#191A23',
                        color: isPotential ? '#191A23' : 'white',
                        borderStyle: isPotential ? 'dashed' : 'solid'
                      }}
                    >
                      {isPotential ? 'Potential' : 'Confirmed'}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ fontStyle: isPotential ? 'italic' : 'normal' }}>
                    {b.items.map((bi, i) => {
                      const it = items.find(item => item.id === bi.itemId);
                      return (
                        <div key={i} className="flex items-center gap-2 mb-1">
                          {it && <ItemIcon item={it} size="sm" />}
                          <span className="text-sm" style={{ color: '#191A23' }}>
                            {it?.name} <span style={{ color: '#575F60' }}>x{bi.quantity}</span>
                          </span>
                        </div>
                      );
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#191A23', fontStyle: isPotential ? 'italic' : 'normal' }}>
                    {projects.find(p => p.id === b.projectId)?.name}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#191A23', fontStyle: isPotential ? 'italic' : 'normal' }}>
                    {formatDate(b.startDate)}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#191A23', fontStyle: isPotential ? 'italic' : 'normal' }}>
                    {formatDate(b.endDate)}
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => openEditModal(b)} 
                      className="mr-2"
                      style={{ color: '#575F60' }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(b.id)} 
                      style={{ color: '#dc2626' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Modal Overlay */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div 
            ref={modalRef}
            className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border-2"
            style={{ borderColor: '#191A23' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-medium" style={{ color: '#191A23' }}>
                {edit ? 'Edit Booking' : 'New Booking'}
              </h3>
              <button onClick={closeModal} style={{ color: '#575F60' }}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Project and Dates */}
              <div className="grid grid-cols-3 gap-4">
                <div ref={projectDropdownRef}>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Project</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 z-10" style={{ color: '#575F60' }} />
                    <input
                      type="text"
                      placeholder="Search or select project..."
                      value={projectSearch}
                      onFocus={() => setShowProjectDropdown(true)}
                      onChange={e => {
                        setProjectSearch(e.target.value);
                        setShowProjectDropdown(true);
                        if (!e.target.value) setPid('');
                      }}
                      className="w-full pl-10 pr-3 py-2 border-2 text-sm"
                      style={{ borderColor: '#575F60', backgroundColor: 'white' }}
                    />
                    
                    {showProjectDropdown && (
                      <div 
                        className="absolute z-20 w-full mt-1 border-2 max-h-60 overflow-y-auto shadow-lg"
                        style={{ backgroundColor: 'white', borderColor: '#575F60' }}
                      >
                        {filteredProjects.length === 0 ? (
                          <div className="px-3 py-2 text-sm" style={{ color: '#575F60' }}>
                            No projects found
                          </div>
                        ) : (
                          filteredProjects.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => selectProject(p)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b"
                              style={{ 
                                borderColor: '#F3F3F3',
                                backgroundColor: pid === p.id ? '#FFED00' : 'white'
                              }}
                            >
                              <div className="font-medium" style={{ color: '#191A23' }}>{p.name}</div>
                              <div className="text-xs" style={{ color: '#575F60' }}>
                                {p.number} • {p.client}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Start Date</label>
                  <input 
                    type="date" 
                    value={start} 
                    onChange={e => setStart(e.target.value)} 
                    className="w-full px-3 py-2 border-2 text-sm"
                    style={{ borderColor: '#575F60', backgroundColor: 'white' }}
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>End Date</label>
                  <input 
                    type="date" 
                    value={end} 
                    onChange={e => setEnd(e.target.value)} 
                    className="w-full px-3 py-2 border-2 text-sm"
                    style={{ borderColor: '#575F60', backgroundColor: 'white' }}
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Status Slider Switch */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Booking Status</label>
                <div className="relative inline-flex items-center border-2 rounded-full p-1" style={{ borderColor: '#191A23', backgroundColor: '#F3F3F3' }}>
                  <button
                    type="button"
                    onClick={() => setStatus('potential')}
                    className="px-6 py-2 rounded-full text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: status === 'potential' ? '#FFF8DC' : 'transparent',
                      color: '#191A23',
                      border: status === 'potential' ? '2px solid #191A23' : '2px solid transparent'
                    }}
                  >
                    Potential
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('confirmed')}
                    className="px-6 py-2 rounded-full text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: status === 'confirmed' ? '#FFED00' : 'transparent',
                      color: '#191A23',
                      border: status === 'confirmed' ? '2px solid #191A23' : '2px solid transparent'
                    }}
                  >
                    Confirmed
                  </button>
                </div>
              </div>
              
              {/* Items to Book */}
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-sm font-medium" style={{ color: '#575F60' }}>Items to Book</label>
                  <button 
                    onClick={() => setBis([...bis, { itemId: '', quantity: 0 }])} 
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium border-2"
                    style={{ backgroundColor: '#FFED00', borderColor: '#191A23', color: '#191A23' }}
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
                
                {bis.map((bi, i) => (
                  <div key={i} className="mb-4 p-4 border-2" style={{ backgroundColor: '#F3F3F3', borderColor: '#575F60' }}>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium" style={{ color: '#575F60' }}>Item {i + 1}</label>
                      <button 
                        onClick={() => setBis(bis.filter((_, idx) => idx !== i))} 
                        disabled={bis.length === 1 || saving} 
                        className="text-xs flex items-center gap-1 disabled:opacity-40"
                        style={{ color: '#dc2626' }}
                      >
                        <X className="w-4 h-4" /> Remove
                      </button>
                    </div>
                    
                    <div className="mb-3 space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4" style={{ color: '#575F60' }} />
                        <input
                          type="text"
                          placeholder="Search items..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border-2 text-sm"
                          style={{ borderColor: '#575F60', backgroundColor: 'white' }}
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs" style={{ color: '#575F60' }}>Filter:</span>
                        {[{ id: 'ungrouped', name: 'Ungrouped' }, ...groups.filter(g => g.id !== '00000000-0000-0000-0000-000000000000')].map(g => (
                          <button
                            key={g.id}
                            onClick={() => toggleGroup(g.id)}
                            className="px-2 py-1 text-xs border-2"
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

                    <div className="flex flex-wrap gap-2 mb-3">
                      {filteredItems.map(it => (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => { const n = [...bis]; n[i].itemId = it.id; setBis(n); }}
                          disabled={saving}
                          className="flex items-center gap-2 px-3 py-2 border-2 text-sm"
                          style={{
                            backgroundColor: bi.itemId === it.id ? '#FFED00' : 'white',
                            borderColor: bi.itemId === it.id ? '#191A23' : '#575F60',
                            color: '#191A23'
                          }}
                        >
                          <ItemIcon item={it} size="sm" />
                          <span>{it.name}</span>
                        </button>
                      ))}
                    </div>

                    <input 
                      type="number" 
                      placeholder="Quantity" 
                      value={bi.quantity || ''} 
                      onChange={e => { const n = [...bis]; n[i].quantity = +e.target.value || 0; setBis(n); }} 
                      className="w-full px-3 py-2 border-2 text-sm"
                      style={{ borderColor: '#575F60', backgroundColor: 'white' }}
                      disabled={saving}
                    />
                  </div>
                ))}
              </div>
              
              {err && <p className="text-sm font-medium" style={{ color: '#dc2626' }}>{err}</p>}
              
              <div className="flex gap-3">
                <button 
                  onClick={save} 
                  disabled={saving}
                  className="flex-1 px-6 py-3 text-sm font-medium border-2"
                  style={{ backgroundColor: '#FFED00', borderColor: '#191A23', color: '#191A23' }}
                >
                  {saving ? 'Saving...' : edit ? 'Update Booking' : 'Create Booking'}
                </button>
                <button 
                  onClick={closeModal}
                  className="px-6 py-3 text-sm font-medium border-2"
                  style={{ borderColor: '#575F60', color: '#575F60' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

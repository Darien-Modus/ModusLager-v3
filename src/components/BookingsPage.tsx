import { useState } from 'react';
import { Edit2, Trash2, Plus, X, Search } from 'lucide-react';
import { Booking, BookingItem, Item, Project, Group } from '../types';
import { calcAvailable, formatDate } from '../utils/helpers';
import { ItemIcon } from './ItemIcon';
import { supabase } from '../utils/supabase';

interface BookingsPageProps {
  bookings: Booking[];
  items: Item[];
  projects: Project[];
  groups: Group[];
  refreshData: () => void;
}

export const BookingsPage: React.FC<BookingsPageProps> = ({ bookings, items, projects, groups, refreshData }) => {
  const [bis, setBis] = useState<BookingItem[]>([{ itemId: '', quantity: 0 }]);
  const [pid, setPid] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [edit, setEdit] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [showQuickAddProject, setShowQuickAddProject] = useState(false);
  const [quickProjectForm, setQuickProjectForm] = useState({ name: '', number: '', client: '' });

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
            end_date: end
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
            end_date: end
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
      setBis([{ itemId: '', quantity: 0 }]);
      setPid('');
      setStart('');
      setEnd('');
      setEdit(null);
      setErr('');
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Error saving booking. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm('Delete this booking?')) return;
    
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await refreshData();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Error deleting booking.');
    }
  };

  const saveQuickProject = async () => {
    if (!quickProjectForm.name || !quickProjectForm.number || !quickProjectForm.client) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([quickProjectForm])
        .select()
        .single();
      
      if (error) throw error;
      
      await refreshData();
      setPid(data.id);
      setQuickProjectForm({ name: '', number: '', client: '' });
      setShowQuickAddProject(false);
      setProjectSearch('');
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project.');
    } finally {
      setSaving(false);
    }
  };

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
    
    return filtered;
  };

  const filterProjects = () => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.number.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.client.toLowerCase().includes(projectSearch.toLowerCase())
    );
  };

  const filteredItems = filterItems();
  const filteredProjects = filterProjects();

  return (
    <div style={{ fontFamily: 'Raleway, sans-serif' }}>
      <h2 className="text-base font-semibold mb-3" style={{ color: '#1F1F1F' }}>Bookings</h2>
      
      {/* Booking Form */}
      <div className="p-2 border mb-3" style={{ backgroundColor: '#F5F5F5', borderColor: '#575F60' }}>
        <div className="space-y-2">
          {/* Project Selection + Quick Add */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#575F60' }}>Project</label>
              <div className="space-y-1">
                <div className="relative">
                  <Search className="absolute left-2 top-1.5 w-3 h-3" style={{ color: '#575F60' }} />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={projectSearch}
                    onChange={e => setProjectSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 border text-xs"
                    style={{ borderColor: '#575F60' }}
                  />
                </div>
                <select 
                  value={pid} 
                  onChange={e => setPid(e.target.value)} 
                  className="w-full px-2 py-1 border text-xs"
                  style={{ borderColor: '#575F60' }}
                  disabled={saving}
                >
                  <option value="">Select</option>
                  {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.number})</option>)}
                </select>
                <button
                  onClick={() => setShowQuickAddProject(!showQuickAddProject)}
                  className="w-full px-2 py-1 border text-xs flex items-center justify-center gap-1"
                  style={{ borderColor: '#575F60', color: '#1F1F1F' }}
                >
                  <Plus className="w-3 h-3" /> Quick Add Project
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#575F60' }}>Start Date</label>
              <input 
                type="date" 
                value={start} 
                onChange={e => setStart(e.target.value)} 
                className="w-full px-2 py-1 border text-xs"
                style={{ borderColor: '#575F60' }}
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#575F60' }}>End Date</label>
              <input 
                type="date" 
                value={end} 
                onChange={e => setEnd(e.target.value)} 
                className="w-full px-2 py-1 border text-xs"
                style={{ borderColor: '#575F60' }}
                disabled={saving}
              />
            </div>
          </div>

          {/* Quick Add Project Form */}
          {showQuickAddProject && (
            <div className="p-2 border" style={{ backgroundColor: 'white', borderColor: '#575F60' }}>
              <div className="grid grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Project name"
                  value={quickProjectForm.name}
                  onChange={e => setQuickProjectForm({ ...quickProjectForm, name: e.target.value })}
                  className="px-2 py-1 border text-xs"
                  style={{ borderColor: '#575F60' }}
                />
                <input
                  type="text"
                  placeholder="Number"
                  value={quickProjectForm.number}
                  onChange={e => setQuickProjectForm({ ...quickProjectForm, number: e.target.value })}
                  className="px-2 py-1 border text-xs"
                  style={{ borderColor: '#575F60' }}
                />
                <input
                  type="text"
                  placeholder="Client"
                  value={quickProjectForm.client}
                  onChange={e => setQuickProjectForm({ ...quickProjectForm, client: e.target.value })}
                  className="px-2 py-1 border text-xs"
                  style={{ borderColor: '#575F60' }}
                />
                <div className="flex gap-1">
                  <button
                    onClick={saveQuickProject}
                    className="flex-1 px-2 py-1 text-xs"
                    style={{ backgroundColor: '#FFED00', color: '#1F1F1F' }}
                    disabled={saving}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setShowQuickAddProject(false); setQuickProjectForm({ name: '', number: '', client: '' }); }}
                    className="px-2 py-1 border text-xs"
                    style={{ borderColor: '#575F60' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Items Selection with Search and Group Filter */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium" style={{ color: '#575F60' }}>Items to Book</label>
              <button 
                onClick={() => setBis([...bis, { itemId: '', quantity: 0 }])} 
                disabled={saving}
                className="flex items-center gap-1 px-2 py-1 text-xs"
                style={{ backgroundColor: '#FFED00', color: '#1F1F1F' }}
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            
            {/* Search and Group Filters */}
            <div className="mb-2 p-1.5 border" style={{ backgroundColor: 'white', borderColor: '#575F60' }}>
              <div className="relative mb-1">
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
              <div className="flex flex-wrap gap-1">
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

            {/* Booking Items */}
            {bis.map((bi, i) => (
              <div key={i} className="mb-2 p-1.5 border" style={{ backgroundColor: 'white', borderColor: '#575F60' }}>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium" style={{ color: '#575F60' }}>Item {i + 1}</label>
                  <button 
                    onClick={() => setBis(bis.filter((_, idx) => idx !== i))} 
                    disabled={bis.length === 1 || saving} 
                    className="text-xs flex items-center gap-1 disabled:opacity-40"
                    style={{ color: '#dc2626' }}
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                </div>
                
                {/* Item Selection Grid */}
                <div className="flex flex-wrap gap-1 mb-1">
                  {filteredItems.map(it => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => { const n = [...bis]; n[i].itemId = it.id; setBis(n); }}
                      disabled={saving}
                      className="flex items-center gap-1 px-2 py-1 text-xs border"
                      style={{
                        backgroundColor: bi.itemId === it.id ? '#FFED00' : 'white',
                        borderColor: bi.itemId === it.id ? '#1F1F1F' : '#575F60',
                        color: '#1F1F1F'
                      }}
                    >
                      <ItemIcon item={it} size="sm" />
                      <span>{it.name}</span>
                    </button>
                  ))}
                </div>

                {/* Quantity Input */}
                <input 
                  type="number" 
                  placeholder="Quantity" 
                  value={bi.quantity || ''} 
                  onChange={e => { const n = [...bis]; n[i].quantity = +e.target.value || 0; setBis(n); }} 
                  className="w-full px-2 py-1 border text-xs"
                  style={{ borderColor: '#575F60' }}
                  disabled={saving}
                />
              </div>
            ))}
          </div>
          
          {err && <p className="text-xs font-medium" style={{ color: '#dc2626' }}>{err}</p>}
          
          <div className="flex gap-2">
            <button 
              onClick={save} 
              disabled={saving}
              className="px-3 py-1.5 text-xs"
              style={{ backgroundColor: '#FFED00', color: '#1F1F1F' }}
            >
              {saving ? 'Saving...' : edit ? 'Update' : 'Create'}
            </button>
            {edit && (
              <button
                onClick={() => { 
                  setEdit(null); 
                  setBis([{ itemId: '', quantity: 0 }]); 
                  setPid(''); 
                  setStart(''); 
                  setEnd(''); 
                  setErr(''); 
                }}
                className="px-3 py-1.5 text-xs border"
                style={{ borderColor: '#575F60' }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Bookings List */}
      <div className="border" style={{ borderColor: '#575F60', backgroundColor: 'white' }}>
        <div className="p-2" style={{ backgroundColor: '#F5F5F5', borderBottom: '1px solid #575F60' }}>
          <span className="text-xs font-medium" style={{ color: '#1F1F1F' }}>All Bookings</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#575F60' }}>
          {bookings.length === 0 ? (
            <p className="p-4 text-xs text-center" style={{ color: '#575F60' }}>No bookings yet</p>
          ) : (
            bookings.map(b => (
              <div key={b.id} className="p-2 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium" style={{ color: '#1F1F1F' }}>
                        {projects.find(p => p.id === b.projectId)?.name}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 border" style={{ borderColor: '#575F60', color: '#575F60' }}>
                        {formatDate(b.startDate)} → {formatDate(b.endDate)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {b.items.map((bi, idx) => {
                        const it = items.find(item => item.id === bi.itemId);
                        if (!it) return null;
                        return (
                          <div key={idx} className="flex items-center gap-1 px-1.5 py-0.5 border text-xs" style={{ borderColor: '#575F60' }}>
                            <ItemIcon item={it} size="sm" />
                            <span style={{ color: '#1F1F1F' }}>{it.name}</span>
                            <span style={{ color: '#575F60' }}>×{bi.quantity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => { 
                        setEdit(b.id); 
                        setBis(b.items); 
                        setPid(b.projectId); 
                        setStart(b.startDate); 
                        setEnd(b.endDate); 
                      }} 
                      style={{ color: '#575F60' }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => deleteBooking(b.id)} 
                      style={{ color: '#dc2626' }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

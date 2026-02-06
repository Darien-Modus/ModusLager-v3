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
  const beMatrixGroup = groups.find(g => g.name === 'BeMatrix Frames');
  
  const [bis, setBis] = useState<BookingItem[]>([{ itemId: '', quantity: 0 }]);
  const [pid, setPid] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [edit, setEdit] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>(beMatrixGroup ? [beMatrixGroup.id] : []);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', number: '', client: '' });

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
        String(item.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  // This filters the table at the bottom based on the search bar
  const displayBookings = bookings.filter(b => {
    const p = projects.find(proj => proj.id === b.projectId);
    const s = searchTerm.toLowerCase();
    const name = String(p?.name || '').toLowerCase();
    const num = String(p?.number || '').toLowerCase();
    const hasItem = b.items.some(bi => 
      String(items.find(i => i.id === bi.itemId)?.name || '').toLowerCase().includes(s)
    );
    return name.includes(s) || num.includes(s) || hasItem;
  });

  const saveProject = async () => {
    if (!projectForm.name || !projectForm.number || !projectForm.client) return;
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([projectForm])
        .select()
        .single();
      if (error) throw error;
      await refreshData();
      setPid(data.id);
      setProjectForm({ name: '', number: '', client: '' });
      setShowProjectForm(false);
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project.');
    }
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
        setErr("Looks like you don't own so many!");
        return;
      }
      const avail = calcAvailable(bi.itemId, start, end, bookings, items, edit || undefined);
      if (bi.quantity > avail) {
        setErr("Oooops! Items already booked for that period.");
        return;
      }
    }
    setSaving(true);
    try {
      if (edit) {
        await supabase.from('bookings').update({ project_id: pid, start_date: start, end_date: end }).eq('id', edit);
        await supabase.from('booking_items').delete().eq('booking_id', edit);
        const bItems = bis.map(bi => ({ booking_id: edit, item_id: bi.itemId, quantity: bi.quantity }));
        await supabase.from('booking_items').insert(bItems);
      } else {
        const { data: bData, error: bErr } = await supabase.from('bookings').insert([{ project_id: pid, start_date: start, end_date: end }]).select().single();
        if (bErr) throw bErr;
        const bItems = bis.map(bi => ({ booking_id: bData.id, item_id: bi.itemId, quantity: bi.quantity }));
        await supabase.from('booking_items').insert(bItems);
      }
      await refreshData();
      setBis([{ itemId: '', quantity: 0 }]);
      setPid('');
      setStart('');
      setEnd('');
      setEdit(null);
      setErr('');
    } catch (error) {
      console.error(error);
      alert('Error saving booking.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this booking?')) return;
    try {
      await supabase.from('bookings').delete().eq('id', id);
      await refreshData();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredItems = filterItems();

  return (
    <div style={{ fontFamily: "Raleway, sans-serif" }}>
      <h2 className="text-4xl font-medium mb-6" style={{ color: '#191A23' }}>Bookings</h2>
      
      {/* Create/Edit Form */}
      <div className="p-6 border mb-6" style={{ backgroundColor: '#191A23', borderColor: '#191A23' }}>
        <h3 className="text-lg font-medium mb-4" style={{ color: '#FFED00' }}>
          {edit ? 'Edit Booking' : 'Create New Booking'}
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Project</label>
              <div className="space-y-2">
                <select 
                  value={pid} 
                  onChange={e => setPid(e.target.value)} 
                  className="w-full px-3 py-2 border text-sm"
                  style={{ borderColor: '#575F60', backgroundColor: 'white', color: '#191A23' }}
                  disabled={saving}
                >
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.number})</option>)}
                </select>
                <button
                  onClick={() => setShowProjectForm(!showProjectForm)}
                  className="w-full px-3 py-2 border text-xs flex items-center justify-center gap-1"
                  style={{ borderColor: '#575F60', color: 'white', backgroundColor: 'transparent' }}
                >
                  <Plus className="w-3 h-3" /> Quick Add Project
                </button>
              </div>
            </div>
            <div>
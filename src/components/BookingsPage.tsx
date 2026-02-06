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
  const [projectSearch, setProjectSearch] = useState(''); 
  const [itemSearch, setItemSearch] = useState(''); 
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

  // FIXED SEARCH LOGIC: Filters the dropdown
  const filteredProjects = projects.filter(p => 
    String(p.name || '').toLowerCase().includes(projectSearch.toLowerCase()) ||
    String(p.number || '').toLowerCase().includes(projectSearch.toLowerCase())
  );

  // FIXED SEARCH LOGIC: Filters the table
  const displayBookings = bookings.filter(b => {
    const s = projectSearch.toLowerCase();
    if (!s) return true;
    const p = projects.find(proj => proj.id === b.projectId);
    const projectName = String(p?.name || '').toLowerCase();
    const projectNum = String(p?.number || '').toLowerCase();
    // Also checks if the booking contains an item matching the search
    const hasItem = b.items.some(bi => 
      String(items.find(i => i.id === bi.itemId)?.name || '').toLowerCase().includes(s)
    );
    return projectName.includes(s) || projectNum.includes(s) || hasItem;
  });

  const saveProject = async () => {
    if (!projectForm.name || !projectForm.number || !projectForm.client) return;
    try {
      const { data, error } = await supabase.from('projects').insert([projectForm]).select().single();
      if (error) throw error;
      await refreshData();
      setPid(data.id);
      setProjectForm({ name: '', number: '', client: '' });
      setShowProjectForm(false);
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const save = async () => {
    if (!pid || !start || !end || bis.length === 0) { setErr('All fields required'); return; }
    setSaving(true);
    try {
      const bookingData = { project_id: pid, start_date: start, end_date: end };
      if (edit) {
        await supabase.from('bookings').update(bookingData).eq('id', edit);
        await supabase.from('booking_items').delete().eq('booking_id', edit);
        await supabase.from('booking_items').insert(bis.map(bi => ({ booking_id: edit, item_id: bi.itemId, quantity: bi.quantity })));
      } else {
        const { data, error } = await supabase.from('bookings').insert([bookingData]).select().single();
        if (error) throw error;
        await supabase.from('booking_items').insert(bis.map(bi => ({ booking_id: data.id, item_id: bi.itemId, quantity: bi.quantity })));
      }
      await refreshData();
      setBis([{ itemId: '', quantity: 0 }]); setPid(''); setStart(''); setEnd(''); setEdit(null); setErr('');
    } catch (error) { 
      console.error('Error saving booking:', error); 
    } finally { 
      setSaving(false); 
    }
  };
  return (
    <div style={{ fontFamily: "Raleway, sans-serif" }}>
      <h2 className="text-4xl font-medium mb-6" style={{ color: '#191A23' }}>Bookings</h2>
      
      <div className="p-6 border mb-6" style={{ backgroundColor: '#191A23', borderColor: '#191A23' }}>
        <h3 className="text-lg font-medium mb-4" style={{ color: '#FFED00' }}>{edit ? 'Edit Booking' : 'Create New Booking'}</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Search & Select Project</label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Type project name or number..." 
                    value={projectSearch} 
                    onChange={e => setProjectSearch(e.target.value)} 
                    className="w-full pl-10 pr-3 py-2 border text-sm"
                  />
                </div>
                <select value={pid} onChange={e => setPid(e.target.value)} className="w-full px-3 py-2 border text-sm" style={{ backgroundColor: 'white' }}>
                  <option value="">Select Project</option>
                  {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.number})</option>)}
                </select>
                <button onClick={() => setShowProjectForm(!showProjectForm)} className="w-full mt-2 px-3 py-2 border text-xs text-white" style={{ borderColor: '#575F60' }}>
                  <Plus className="w-3 h-3 inline mr-1" /> Quick Add Project
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Start Date</label>
              <input type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full px-3 py-2 border text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>End Date</label>
              <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full px-3 py-2 border text-sm" />
            </div>
          </div>

          {showProjectForm && (
            <div className="p-4 border" style={{ backgroundColor: '#F3F3F3', borderColor: '#575F60' }}>
              <div className="grid grid-cols-4 gap-2">
                <input type="text" placeholder="Project name" value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} className="px-3 py-2 border text-sm" />
                <input type="text" placeholder="Number" value={projectForm.number} onChange={e => setProjectForm({ ...projectForm, number: e.target.value })} className="px-3 py-2 border text-sm" />
                <input type="text" placeholder="Client" value={projectForm.client} onChange={e => setProjectForm({ ...projectForm, client: e.target.value })} className="px-3 py-2 border text-sm" />
                <button onClick={saveProject} className="px-3 py-2 text-sm font-medium border" style={{ backgroundColor: '#FFED00', color: '#191A23' }}>Add Project</button>
              </div>
            </div>
          )}
          
          <div>
            <div className="flex justify-between mb-3">
              <label className="text-sm font-medium" style={{ color: '#575F60' }}>Items to Book</label>
              <button onClick={() => setBis([...bis, { itemId: '', quantity: 0 }])} className="bg-[#FFED00] px-3 py-2 text-sm font-medium border text-black">
                <Plus className="w-4 h-4 inline mr-1" /> Add Item
              </button>
            </div>
            
            {bis.map((bi, i) => (
              <div key={i} className="mb-4 p-4 border" style={{ backgroundColor: '#F3F3F3', borderColor: '#575F60' }}>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium">Item {i + 1}</label>
                  <button onClick={() => setBis(bis.filter((_, idx) => idx !== i))} className="text-xs text-red-600 font-medium">Remove</button>
                </div>
                <div className="relative mb-3">
                   <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                   <input type="text" placeholder="Filter item list..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 border text-sm" />
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {items.filter(it => String(it.name).toLowerCase().includes(itemSearch.toLowerCase())).slice(0, 20).map(it => (
                    <button key={it.id} onClick={() => { const n = [...bis]; n[i].itemId = it.id; setBis(n); }} className={`flex items-center gap-2 px-3 py-2 border text-sm ${bi.itemId === it.id ? 'bg-[#FFED00]' : 'bg-white'}`}>
                      <ItemIcon item={it} size="sm" /><span>{it.name}</span>
                    </button>
                  ))}
                </div>
                <input type="number" placeholder="Quantity" value={bi.quantity || ''} onChange={e => { const n = [...bis]; n[i].quantity = +e.target.value; setBis(n); }} className="w-full px-3 py-2 border text-sm" />
              </div>
            ))}
          </div>
          
          {err && <p className="text-sm text-red-600 font-medium">{err}</p>}
          <button onClick={save} disabled={saving} className="w-full py-3 bg-[#FFED00] font-bold border text-black" style={{ borderColor: '#191A23' }}>
            {saving ? 'SAVING...' : edit ? 'UPDATE BOOKING' : 'SAVE BOOKING'}
          </button>
        </div>
      </div>

      <div className="border bg-white" style={{ borderColor: '#191A23' }}>
        <table className="w-full">
          <thead style={{ backgroundColor: '#F3F3F3' }}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayBookings.map(b => (
              <tr key={b.id} className="border-t">
                <td className="px-4 py-3 text-sm">
                   {b.items.map((bi, idx) => (
                     <div key={idx} className="mb-1">{items.find(item => item.id === bi.itemId)?.name} x{bi.quantity}</div>
                   ))}
                </td>
                <td className="px-4 py-3 text-sm font-bold">{projects.find(p => p.id === b.projectId)?.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(b.startDate)} - {formatDate(b.endDate)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setEdit(b.id); setBis(b.items); setPid(b.projectId); setStart(b.startDate); setEnd(b.endDate); window.scrollTo(0,0); }} className="mr-3 text-gray-500"><Edit2 size={16}/></button>
                  <button onClick={async () => { if(confirm('Delete?')) { await supabase.from('bookings').delete().eq('id', b.id); refreshData(); } }} className="text-red-600"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

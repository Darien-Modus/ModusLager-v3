import { useState, useEffect } from 'react'; 
import { Edit2, Trash2, Search } from 'lucide-react'; 
import { Booking, BookingItem, Item, Project, Group } from '../types'; 
import { formatDate } from '../utils/helpers'; 
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
  const [projectForm, setProjectForm] = useState({ name: '', number: '', client: '' }); 
  const [projectSearch, setProjectSearch] = useState(''); 
  const [showProjectForm, setShowProjectForm] = useState(false); 

  const filteredProjects = projects.filter(p => {
    const s = projectSearch.toLowerCase();
    return (p?.name?.toLowerCase().includes(s) || p?.number?.toLowerCase().includes(s));
  });

  const displayBookings = bookings.filter(b => {
    const s = projectSearch.toLowerCase();
    if (!s) return true;
    const p = projects.find(proj => proj.id === b.projectId);
    return (p?.name?.toLowerCase().includes(s) || p?.number?.toLowerCase().includes(s));
  });

  const filterItems = () => items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const saveProject = async () => { 
    if (!projectForm.name || !projectForm.number) return; 
    try { 
      const { data, error } = await supabase.from('projects').insert([projectForm]).select().single(); 
      if (error) throw error; 
      await refreshData(); 
      if (data) { setPid(data.id); setProjectSearch(data.name); }
      setShowProjectForm(false); 
      setProjectForm({ name: '', number: '', client: '' }); 
    } catch (e: any) { setErr(e.message); } 
  }; 

  const save = async () => { 
    if (!pid || !start || !end) { setErr('Project and Dates required'); return; } 
    const validItems = bis.filter(bi => bi.itemId && bi.quantity > 0);
    if (validItems.length === 0) { setErr('Add items with quantity'); return; }

    setSaving(true); setErr('');
    try { 
      const bData = { project_id: pid, start_date: start, end_date: end };
      let bookingId = edit;

      if (edit) { 
        await supabase.from('bookings').update(bData).eq('id', edit); 
        await supabase.from('booking_items').delete().eq('booking_id', edit); 
      } else { 
        const { data, error } = await supabase.from('bookings').insert([bData]).select().single(); 
        if (error) throw error;
        if (!data) throw new Error("Insert succeeded but no data returned. Check RLS policies.");
        bookingId = data.id;
      } 

      if (bookingId) {
        const { error: itemErr } = await supabase.from('booking_items').insert(
          validItems.map(bi => ({ booking_id: bookingId, item_id: bi.itemId, quantity: bi.quantity }))
        );
        if (itemErr) throw itemErr;
      }

      await refreshData(); 
      setBis([{ itemId: '', quantity: 0 }]); setPid(''); setStart(''); setEnd(''); setEdit(null); setProjectSearch('');
    } catch (e: any) { setErr(e.message || 'Error saving'); } finally { setSaving(false); } 
  }; 

  const handleDelete = async (id: string) => { 
    if (confirm('Delete?')) { await supabase.from('bookings').delete().eq('id', id); await refreshData(); }
  };
  return ( 
    <div className="p-4" style={{ fontFamily: "Raleway, sans-serif" }}> 
      <h2 className="text-4xl font-medium mb-6">Bookings</h2> 
       
      <div className="p-6 border mb-6 bg-[#191A23]"> 
        <h3 className="text-lg font-medium mb-4 text-[#FFED00]">{edit ? 'Edit Booking' : 'New Booking'}</h3> 
        <div className="space-y-4"> 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
            <div> 
              <label className="block text-sm text-white mb-1">Project Search</label> 
              <input type="text" placeholder="Type to filter..." value={projectSearch} onChange={e => setProjectSearch(e.target.value)} className="w-full p-2 text-sm border mb-2" />
              <select value={pid} onChange={e => setPid(e.target.value)} className="w-full p-2 text-sm border"> 
                <option value="">-- Select Project --</option> 
                {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.number})</option>)} 
              </select> 
            </div> 
            <div><label className="block text-sm text-white mb-1">Start</label><input type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full p-2 text-sm border" /></div> 
            <div><label className="block text-sm text-white mb-1">End</label><input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full p-2 text-sm border" /></div> 
          </div> 

          <div className="bg-gray-800 p-4 border border-gray-600">
            <div className="flex justify-between items-center mb-2">
              <label className="text-white text-sm">Items</label>
              <button onClick={() => setBis([...bis, { itemId: '', quantity: 0 }])} className="text-xs bg-[#FFED00] px-2 py-1">+ Add</button>
            </div>
            {bis.map((bi, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select value={bi.itemId} onChange={e => { const n = [...bis]; n[i].itemId = e.target.value; setBis(n); }} className="flex-1 p-2 text-xs">
                  <option value="">Select Item</option>
                  {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                </select>
                <input type="number" placeholder="Qty" value={bi.quantity || ''} onChange={e => { const n = [...bis]; n[i].quantity = +e.target.value; setBis(n); }} className="w-20 p-2 text-xs" />
              </div>
            ))}
          </div>

          {err && <p className="text-red-400 text-sm font-bold">{err}</p>}
          <button onClick={save} disabled={saving} className="w-full py-3 bg-[#FFED00] font-bold border border-black uppercase tracking-widest hover:bg-yellow-400">
            {saving ? 'Processing...' : edit ? 'Update' : 'Confirm Booking'}
          </button> 
        </div> 
      </div> 

      <div className="overflow-x-auto border border-black"> 
        <table className="w-full text-sm"> 
          <thead className="bg-gray-100 border-b border-black"><tr><th className="p-3 text-left">Project</th><th className="p-3 text-left">Dates</th><th className="p-3 text-left">Actions</th></tr></thead> 
          <tbody> 
            {displayBookings.map(b => ( 
              <tr key={b.id} className="border-b"> 
                <td className="p-3 font-bold">{projects.find(p => p.id === b.projectId)?.name || 'Unknown'}</td> 
                <td className="p-3">{formatDate(b.startDate)} - {formatDate(b.endDate)}</td> 
                <td className="p-3 flex gap-2"> 
                  <button onClick={() => { setEdit(b.id); setPid(b.projectId); setStart(b.startDate); setEnd(b.endDate); setBis(b.items); }}><Edit2 size={16}/></button> 
                  <button onClick={() => handleDelete(b.id)} className="text-red-600"><Trash2 size={16}/></button> 
                </td> 
              </tr> 
            ))} 
          </tbody> 
        </table> 
      </div> 
    </div> 
  ); 
};
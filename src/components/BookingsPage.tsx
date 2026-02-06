import { useState, useEffect } from 'react'; 
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
  const [projectSearch, setProjectSearch] = useState(''); 

  const filteredProjects = projects.filter(p =>  
    String(p.name || '').toLowerCase().includes(projectSearch.toLowerCase()) || 
    String(p.number || '').toLowerCase().includes(projectSearch.toLowerCase()) 
  );

  useEffect(() => {
    if (filteredProjects.length === 1 && projectSearch !== '') {
      setPid(filteredProjects[0].id);
    }
  }, [projectSearch, filteredProjects]);

  const displayBookings = bookings.filter(b => {
    const s = projectSearch.toLowerCase();
    if (!s) return true;
    const p = projects.find(proj => proj.id === b.projectId);
    const matchesProject = String(p?.name || '').toLowerCase().includes(s);
    const matchesNumber = String(p?.number || '').toLowerCase().includes(s);
    const matchesClient = String(p?.client || '').toLowerCase().includes(s);
    const matchesItems = b.items.some(bi => {
      const it = items.find(i => i.id === bi.itemId);
      return String(it?.name || '').toLowerCase().includes(s);
    });
    return matchesProject || matchesNumber || matchesClient || matchesItems;
  });

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
      filtered = filtered.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())); 
    } 
    return filtered; 
  }; 

  const save = async () => { 
    if (!pid || !start || !end) { setErr('Project and Dates required'); return; } 
    const validItems = bis.filter(bi => bi.itemId && bi.quantity > 0);
    if (validItems.length === 0) { setErr('Add items with quantity'); return; }

    setSaving(true); 
    setErr('');
    try { 
      const bData = { project_id: pid, start_date: start, end_date: end };
      if (edit) { 
        await supabase.from('bookings').update(bData).eq('id', edit); 
        await supabase.from('booking_items').delete().eq('booking_id', edit); 
        await supabase.from('booking_items').insert(validItems.map(bi => ({ booking_id: edit, item_id: bi.itemId, quantity: bi.quantity }))); 
      } else { 
        const { data } = await supabase.from('bookings').insert([bData]).select().single(); 
        await supabase.from('booking_items').insert(validItems.map(bi => ({ booking_id: data.id, item_id: bi.itemId, quantity: bi.quantity }))); 
      } 
      await refreshData(); 
      setBis([{ itemId: '', quantity: 0 }]); setPid(''); setStart(''); setEnd(''); setEdit(null); setProjectSearch('');
    } catch (e: any) { setErr(e.message || 'Error saving'); } finally { setSaving(false); } 
  }; 

  const handleDelete = async (id: string) => { 
    if (confirm('Delete?')) { await supabase.from('bookings').delete().eq('id', id); await refreshData(); }
  }; 

  return ( 
    <div style={{ fontFamily: "Raleway, sans-serif" }}> 
      <h2 className="text-4xl font-medium mb-6" style={{ color: '#191A23' }}>Bookings</h2> 
      <div className="p-6 border mb-6" style={{ backgroundColor: '#191A23', borderColor: '#191A23' }}> 
        <h3 className="text-lg font-medium mb-4" style={{ color: '#FFED00' }}>{edit ? 'Edit Booking' : 'Create New Booking'}</h3> 
        <div className="space-y-4"> 
          <div className="grid grid-cols-3 gap-4"> 
            <div> 
              <label className="block text-sm font-medium mb-2 text-white">Project</label> 
              <div className="space-y-2"> 
                <div className="relative"> 
                  <Search className="absolute left-3 top-2.5 w-4 h-4" style={{ color: '#575F60' }} /> 
                  <input type="text" placeholder="Search..." value={projectSearch} onChange={e => setProjectSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 border text-sm" /> 
                </div> 
                <select value={pid} onChange={e => setPid(e.target.value)} className="w-full px-3 py-2 border text-sm" disabled={saving}> 
                  <option value="">Select</option> 
                  {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.number})</option>)} 
                </select> 
              </div> 
            </div> 
            <div><label className="block text-sm font-medium mb-2 text-white">Start</label><input type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full px-3 py-2 border text-sm" /></div> 
            <div><label className="block text-sm font-medium mb-2 text-white">End</label><input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full px-3 py-2 border text-sm" /></div> 
          </div> 
          <div> 
            {bis.map((bi, i) => ( 
              <div key={i} className="mb-4 p-4 border bg-[#F3F3F3]"> 
                <div className="flex justify-between mb-2"><span>Item {i+1}</span><button onClick={() => setBis(bis.filter((_, idx) => idx !== i))} className="text-red-600 text-xs">Remove</button></div> 
                <div className="flex flex-wrap gap-2 mb-2"> 
                  {filterItems().slice(0, 10).map(it => ( 
                    <button key={it.id} onClick={() => { const n = [...bis]; n[i].itemId = it.id; setBis(n); }} className={`p-2 border text-xs ${bi.itemId === it.id ? 'bg-[#FFED00]' : 'bg-white'}`}>{it.name}</button> 
                  ))} 
                </div> 
                <input type="number" placeholder="Qty" value={bi.quantity || ''} onChange={e => { const n = [...bis]; n[i].quantity = +e.target.value; setBis(n); }} className="w-full p-2 border text-sm" /> 
              </div> 
            ))} 
            <button onClick={() => setBis([...bis, { itemId: '', quantity: 0 }])} className="text-white text-xs">+ Add another item</button> 
          </div> 
          {err && <p className="text-red-500 text-sm">{err}</p>} 
          <button onClick={save} disabled={saving} className="bg-[#FFED00] px-6 py-2 font-bold">{saving ? '...' : edit ? 'UPDATE' : 'CREATE'}</button> 
        </div> 
      </div> 
      <div className="border bg-white"> 
        <table className="w-full"> 
          <thead><tr className="bg-gray-100 text-xs"><th>Items</th><th>Project</th><th>Dates</th><th>Actions</th></tr></thead> 
          <tbody> 
            {displayBookings.map(b => ( 
              <tr key={b.id} className="border-t text-sm"> 
                <td className="p-2">{b.items.map((bi, idx) => <div key={idx}>{items.find(it => it.id === bi.itemId)?.name} x{bi.quantity}</div>)}</td> 
                <td className="p-2">{projects.find(p => p.id === b.projectId)?.name}</td> 
                <td className="p-2">{formatDate(b.startDate)} - {formatDate(b.endDate)}</td> 
                <td className="p-2"><button onClick={() => { setEdit(b.id); setBis(b.items); setPid(b.projectId); setStart(b.startDate); setEnd(b.endDate); }}><Edit2 size={14}/></button> <button onClick={() => handleDelete(b.id)} className="text-red-600"><Trash2 size={14}/></button></td> 
              </tr> 
            ))} 
          </tbody> 
        </table> 
      </div> 
    </div> 
  ); 
};
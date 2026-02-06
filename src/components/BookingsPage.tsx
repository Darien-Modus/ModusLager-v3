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
    String(p?.name || '').toLowerCase().includes(projectSearch.toLowerCase()) || 
    String(p?.number || '').toLowerCase().includes(projectSearch.toLowerCase()) 
  );

  const displayBookings = bookings.filter(b => {
    const s = projectSearch.toLowerCase();
    if (!s) return true;
    const p = projects.find(proj => proj.id === b.projectId);
    return String(p?.name || '').toLowerCase().includes(s) || String(p?.number || '').toLowerCase().includes(s);
  });

  const filterItems = () => items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())); 

  const save = async () => { 
    if (!pid || !start || !end) { setErr('Project and Dates required'); return; } 
    const validItems = bis.filter(bi => bi.itemId && bi.quantity > 0);
    if (validItems.length === 0) { setErr('Add items with quantity'); return; }

    setSaving(true); setErr('');
    try { 
      const bData = { project_id: pid, start_date: start, end_date: end };
      let bId = edit;

      if (edit) { 
        const { error } = await supabase.from('bookings').update(bData).eq('id', edit); 
        if (error) throw error;
        await supabase.from('booking_items').delete().eq('booking_id', edit); 
      } else { 
        const { data, error } = await supabase.from('bookings').insert([bData]).select().single(); 
        if (error) throw error;
        bId = data.id;
      } 

      if (bId) {
        const { error: itemErr } = await supabase.from('booking_items').insert(
          validItems.map(bi => ({ booking_id: bId, item_id: bi.itemId, quantity: bi.quantity }))
        );
        if (itemErr) throw new Error(`Booking saved, but items failed: ${itemErr.message}`);
      }
      
      await refreshData(); 
      setBis([{ itemId: '', quantity: 0 }]); setPid(''); setStart(''); setEnd(''); setEdit(null); setProjectSearch('');
    } catch (e: any) { setErr(e.message); } finally { setSaving(false); } 
  };
  return ( 
    <div style={{ fontFamily: "Raleway, sans-serif" }}> 
      <h2 className="text-4xl font-medium mb-6" style={{ color: '#191A23' }}>Bookings</h2> 
       
      <div className="p-6 border mb-6" style={{ backgroundColor: '#191A23', borderColor: '#191A23' }}> 
        <h3 className="text-lg font-medium mb-4" style={{ color: '#FFED00' }}>{edit ? 'Edit Booking' : 'Create New Booking'}</h3> 
         
        <div className="space-y-4"> 
          <div className="grid grid-cols-3 gap-4"> 
            <div> 
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Project</label> 
              <div className="space-y-2"> 
                <div className="relative"> 
                  <Search className="absolute left-3 top-2.5 w-4 h-4" style={{ color: '#575F60' }} /> 
                  <input type="text" placeholder="Search..." value={projectSearch} onChange={e => setProjectSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 border text-sm" /> 
                </div> 
                <select value={pid} onChange={e => setPid(e.target.value)} className="w-full px-3 py-2 border text-sm"> 
                  <option value="">Select</option> 
                  {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)} 
                </select> 
              </div> 
            </div> 
            <div><label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Start Date</label><input type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full px-3 py-2 border text-sm" /></div> 
            <div><label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>End Date</label><input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full px-3 py-2 border text-sm" /></div> 
          </div> 
           
          <div> 
            <div className="flex justify-between mb-3"><label className="text-sm font-medium" style={{ color: '#575F60' }}>Items</label><button onClick={() => setBis([...bis, { itemId: '', quantity: 0 }])} className="bg-[#FFED00] px-3 py-2 text-sm border">+ Add Item</button></div> 
            {bis.map((bi, i) => ( 
              <div key={i} className="mb-4 p-4 border bg-[#F3F3F3]"> 
                <div className="flex justify-between items-center mb-3"><span className="text-sm font-medium">Item {i + 1}</span><button onClick={() => setBis(bis.filter((_, idx) => idx !== i))} className="text-red-600 text-xs">Remove</button></div> 
                <div className="flex flex-wrap gap-2 mb-3">{filterItems().slice(0, 15).map(it => (<button key={it.id} onClick={() => { const n = [...bis]; n[i].itemId = it.id; setBis(n); }} className={`flex items-center gap-2 px-3 py-2 border text-sm ${bi.itemId === it.id ? 'bg-[#FFED00]' : 'bg-white'}`}><ItemIcon item={it} size="sm" />{it.name}</button>))}</div> 
                <input type="number" placeholder="Qty" value={bi.quantity || ''} onChange={e => { const n = [...bis]; n[i].quantity = +e.target.value; setBis(n); }} className="w-full px-3 py-2 border text-sm" /> 
              </div> 
            ))} 
          </div> 
          {err && <p className="text-red-500 text-sm mb-4 font-bold">{err}</p>}
          <button onClick={save} className="px-6 py-3 text-sm font-medium border bg-[#FFED00] border-[#191A23]">{saving ? 'Saving...' : 'Confirm Booking'}</button> 
        </div> 
      </div> 
       
      <div className="border bg-white"> 
        <table className="w-full"> 
          <thead className="bg-[#F3F3F3]"><tr><th className="px-4 py-3 text-left text-xs font-medium">Items</th><th className="px-4 py-3 text-left text-xs font-medium">Project</th><th className="px-4 py-3 text-left text-xs font-medium">Dates</th><th className="px-4 py-3 text-left text-xs font-medium">Actions</th></tr></thead> 
          <tbody> 
            {displayBookings.map(b => ( 
              <tr key={b.id} className="border-t"> 
                <td className="px-4 py-3 text-sm">{b.items?.map((bi, i) => <div key={i}>{items.find(it => it.id === bi.itemId)?.name} x{bi.quantity}</div>)}</td> 
                <td className="px-4 py-3 text-sm font-medium">{projects.find(p => p.id === b.projectId)?.name}</td> 
                <td className="px-4 py-3 text-sm">{formatDate(b.startDate)} - {formatDate(b.endDate)}</td> 
                <td className="px-4 py-3"><button onClick={() => { setEdit(b.id); setBis(b.items); setPid(b.projectId); setStart(b.startDate); setEnd(b.endDate); }} className="mr-2"><Edit2 size={16}/></button></td> 
              </tr> 
            ))} 
          </tbody> 
        </table> 
      </div> 
    </div> 
  ); 
};
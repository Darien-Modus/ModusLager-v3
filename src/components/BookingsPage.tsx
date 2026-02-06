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

  const selectedProject = projects.find(p => p.id === pid);

  const filteredProjects = projects.filter(p => 
    String(p.name || '').toLowerCase().includes(projectSearch.toLowerCase()) ||
    String(p.number || '').toLowerCase().includes(projectSearch.toLowerCase())
  );

  const displayBookings = bookings.filter(b => {
    const s = projectSearch.toLowerCase();
    if (!s) return true;
    const p = projects.find(proj => proj.id === b.projectId);
    const hasItem = b.items.some(bi => 
      String(items.find(i => i.id === bi.itemId)?.name || '').toLowerCase().includes(s)
    );
    return String(p?.name || '').toLowerCase().includes(s) || 
           String(p?.number || '').toLowerCase().includes(s) || hasItem;
  });

  const saveProject = async () => {
    if (!projectForm.name || !projectForm.number || !projectForm.client) return;
    const { data, error } = await supabase.from('projects').insert([projectForm]).select().single();
    if (!error) {
      await refreshData();
      setPid(data.id);
      setProjectSearch(data.name);
      setShowProjectForm(false);
      setProjectForm({ name: '', number: '', client: '' });
    }
  };

  const save = async () => {
    if (!pid || !start || !end || bis.length === 0) { setErr('All fields required'); return; }
    setSaving(true);
    try {
      const bData = { project_id: pid, start_date: start, end_date: end };
      if (edit) {
        await supabase.from('bookings').update(bData).eq('id', edit);
        await supabase.from('booking_items').delete().eq('booking_id', edit);
        await supabase.from('booking_items').insert(bis.map(bi => ({ booking_id: edit, item_id: bi.itemId, quantity: bi.quantity })));
      } else {
        const { data } = await supabase.from('bookings').insert([bData]).select().single();
        await supabase.from('booking_items').insert(bis.map(bi => ({ booking_id: data.id, item_id: bi.itemId, quantity: bi.quantity })));
      }
      await refreshData();
      setBis([{ itemId: '', quantity: 0 }]); setPid(''); setStart(''); setEnd(''); setEdit(null); setProjectSearch('');
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };
  return (
    <div style={{ fontFamily: "Raleway, sans-serif" }}>
      <h2 className="text-4xl font-medium mb-6" style={{ color: '#191A23' }}>Bookings</h2>
      
      <div className="p-6 border-2 mb-6" style={{ backgroundColor: '#191A23', borderColor: '#191A23' }}>
        <h3 className="text-xl font-bold mb-6" style={{ color: '#FFED00' }}>{edit ? 'EDIT BOOKING' : 'CREATE NEW BOOKING'}</h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="relative">
              <label className="block text-sm font-bold mb-2" style={{ color: 'white' }}>PROJECT</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search and select project..." 
                  value={projectSearch} 
                  onChange={e => { setProjectSearch(e.target.value); if(!e.target.value) setPid(''); }} 
                  className="w-full pl-10 pr-3 py-2 border-2 text-sm font-medium"
                  style={{ borderColor: '#575F60' }}
                />
              </div>
              
              {projectSearch && !pid && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 max-h-48 overflow-y-auto" style={{ borderColor: '#575F60' }}>
                  {filteredProjects.map(p => (
                    <div key={p.id} onClick={() => { setPid(p.id); setProjectSearch(p.name); }} className="p-2 hover:bg-[#FFED00] cursor-pointer text-sm border-b">
                      {p.name} <span className="text-gray-500">({p.number})</span>
                    </div>
                  ))}
                </div>
              )}
              {selectedProject && <div className="mt-2 text-xs font-bold text-[#FFED00]">SELECTED: {selectedProject.name}</div>}
              <button onClick={() => setShowProjectForm(!showProjectForm)} className="mt-3 text-xs font-bold text-white flex items-center gap-1"><Plus size={14}/> QUICK ADD PROJECT</button>
            </div>
            <div><label className="block text-sm font-bold mb-2" style={{ color: 'white' }}>START DATE</label><input type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full px-3 py-2 border-2 text-sm font-medium" /></div>
            <div><label className="block text-sm font-bold mb-2" style={{ color: 'white' }}>END DATE</label><input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full px-3 py-2 border-2 text-sm font-medium" /></div>
          </div>

          {showProjectForm && (
            <div className="p-4 border-2 bg-[#F3F3F3]" style={{ borderColor: '#FFED00' }}>
              <div className="grid grid-cols-4 gap-2">
                <input type="text" placeholder="Name" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} className="p-2 border-2 text-sm" />
                <input type="text" placeholder="No." value={projectForm.number} onChange={e => setProjectForm({...projectForm, number: e.target.value})} className="p-2 border-2 text-sm" />
                <input type="text" placeholder="Client" value={projectForm.client} onChange={e => setProjectForm({...projectForm, client: e.target.value})} className="p-2 border-2 text-sm" />
                <button onClick={saveProject} className="bg-[#FFED00] font-bold text-sm border-2 border-[#191A23] py-2">ADD</button>
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold" style={{ color: '#575F60' }}>ITEMS TO BOOK</label>
              <button onClick={() => setBis([...bis, { itemId: '', quantity: 0 }])} className="bg-[#FFED00] px-4 py-2 text-sm font-bold border-2 border-[#191A23]">ADD ITEM</button>
            </div>
            {bis.map((bi, i) => (
              <div key={i} className="mb-4 p-4 border-2 bg-[#F3F3F3]" style={{ borderColor: '#575F60' }}>
                <div className="flex justify-between mb-2"><span className="font-bold text-xs">ITEM {i + 1}</span><button onClick={() => setBis(bis.filter((_, idx) => idx !== i))} className="text-red-600 font-bold text-xs">REMOVE</button></div>
                <input type="text" placeholder="Filter items..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} className="w-full p-2 border-2 text-sm mb-3" />
                <div className="flex flex-wrap gap-2 mb-3">
                  {items.filter(it => it.name.toLowerCase().includes(itemSearch.toLowerCase())).slice(0, 15).map(it => (
                    <button key={it.id} onClick={() => { const n = [...bis]; n[i].itemId = it.id; setBis(n); }} className={`flex items-center gap-2 p-2 border-2 text-xs font-bold ${bi.itemId === it.id ? 'bg-[#FFED00]' : 'bg-white'}`}><ItemIcon item={it} size="sm" />{it.name}</button>
                  ))}
                </div>
                <input type="number" placeholder="QTY" value={bi.quantity || ''} onChange={e => { const n = [...bis]; n[i].quantity = +e.target.value; setBis(n); }} className="w-full p-2 border-2 text-sm font-bold" />
              </div>
            ))}
          </div>
          <button onClick={save} disabled={saving} className="w-full py-4 bg-[#FFED00] font-black text-lg border-2 border-[#FFED00] hover:bg-black hover:text-[#FFED00] transition-colors">{saving ? 'SAVING...' : 'SAVE BOOKING'}</button>
        </div>
      </div>

      <div className="border-2 bg-white" style={{ borderColor: '#191A23' }}>
        <table className="w-full">
          <thead className="bg-[#F3F3F3] border-b-2" style={{ borderColor: '#191A23' }}>
            <tr><th className="px-4 py-4 text-left text-xs font-black uppercase">Items</th><th className="px-4 py-4 text-left text-xs font-black uppercase">Project</th><th className="px-4 py-4 text-left text-xs font-black uppercase">Dates</th><th className="px-4 py-4 text-right text-xs font-black uppercase">Actions</th></tr>
          </thead>
          <tbody>
            {displayBookings.map(b => (
              <tr key={b.id} className="border-b-2 last:border-0" style={{ borderColor: '#F3F3F3' }}>
                <td className="px-4 py-4 text-sm font-medium">{b.items.map((bi, idx) => <div key={idx}>{items.find(it => it.id === bi.itemId)?.name} x{bi.quantity}</div>)}</td>
                <td className="px-4 py-4 text-sm font-black">{projects.find(p => p.id === b.projectId)?.name}</td>
                <td className="px-4 py-4 text-sm font-medium">{formatDate(b.startDate)} - {formatDate(b.endDate)}</td>
                <td className="px-4 py-4 text-right">
                  <button onClick={() => { setEdit(b.id); setBis(b.items); setPid(b.projectId); setStart(b.startDate); setEnd(b.endDate); window.scrollTo(0,0); }} className="mr-4"><Edit2 size={18}/></button>
                  <button onClick={async () => { if(confirm('Delete?')) { await supabase.from('bookings').delete().eq('id', b.id); refreshData(); } }} className="text-red-600"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
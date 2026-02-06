import { useState } from 'react';
import { Edit2, Trash2, Plus, X, Search } from 'lucide-react';
import { Booking, BookingItem, Item, Project, Group } from '../types';
import { formatDate } from '../utils/helpers';
import { ItemIcon } from './ItemIcon';
import { supabase } from '../utils/supabase';

interface BookingsPageProps {
  bookings: Booking[]; items: Item[]; projects: Project[]; groups: Group[]; refreshData: () => void;
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

  const toggleGroup = (id: string) => setSelectedGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);

  const filteredProjects = projects.filter(p => 
    String(p.name || '').toLowerCase().includes(projectSearch.toLowerCase()) ||
    String(p.number || '').toLowerCase().includes(projectSearch.toLowerCase())
  );

  const displayBookings = bookings.filter(b => {
    const s = projectSearch.toLowerCase();
    if (!s) return true;
    const p = projects.find(proj => proj.id === b.projectId);
    const hasItem = b.items.some(bi => String(items.find(i => i.id === bi.itemId)?.name || '').toLowerCase().includes(s));
    return String(p?.name || '').toLowerCase().includes(s) || String(p?.number || '').toLowerCase().includes(s) || hasItem;
  });

  const save = async () => {
    if (!pid || !start || !end || bis.some(bi => !bi.itemId || bi.quantity <= 0)) { setErr('Check all fields'); return; }
    setSaving(true);
    try {
      const payload = { project_id: pid, start_date: start, end_date: end };
      if (edit) {
        await supabase.from('bookings').update(payload).eq('id', edit);
        await supabase.from('booking_items').delete().eq('booking_id', edit);
        await supabase.from('booking_items').insert(bis.map(bi => ({ booking_id: edit, item_id: bi.itemId, quantity: bi.quantity })));
      } else {
        const { data } = await supabase.from('bookings').insert([payload]).select().single();
        await supabase.from('booking_items').insert(bis.map(bi => ({ booking_id: data.id, item_id: bi.itemId, quantity: bi.quantity })));
      }
      await refreshData();
      setBis([{ itemId: '', quantity: 0 }]); setPid(''); setStart(''); setEnd(''); setEdit(null); setErr('');
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  return (
    <div style={{ fontFamily: "Raleway, sans-serif" }}>
      <h2 className="text-4xl font-medium mb-6">Bookings</h2>
      <div className="p-6 border mb-6 bg-[#191A23] text-white">
        <h3 className="text-lg font-medium mb-4 text-[#FFED00]">{edit ? 'Edit' : 'New'} Booking</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-2">Search & Select Project</label>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search..." value={projectSearch} onChange={e => setProjectSearch(e.target.value)} className="w-full pl-8 p-2 text-black text-sm" />
            </div>
            <select value={pid} onChange={e => setPid(e.target.value)} className="w-full p-2 text-black text-sm">
              <option value="">Select</option>
              {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.number})</option>)}
            </select>
          </div>
          <div><label className="block text-sm mb-2">Start</label><input type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full p-2 text-black text-sm" /></div>
          <div><label className="block text-sm mb-2">End</label><input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full p-2 text-black text-sm" /></div>
        </div>
        <div className="mb-4">
          <div className="flex justify-between mb-2"><span className="text-sm">Items</span><button onClick={() => setBis([...bis, { itemId: '', quantity: 0 }])} className="bg-[#FFED00] text-black px-3 py-1 text-sm">+ Add</button></div>
          {bis.map((bi, i) => (
            <div key={i} className="bg-gray-100 p-3 text-black mb-2 rounded">
              <input type="text" placeholder="Filter items..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} className="w-full p-2 mb-2 text-sm border" />
              <div className="flex flex-wrap gap-2 mb-2">
                {items.filter(it => String(it.name).toLowerCase().includes(itemSearch.toLowerCase())).slice(0, 10).map(it => (
                  <button key={it.id} onClick={() => { const n = [...bis]; n[i].itemId = it.id; setBis(n); }} className={`p-2 border text-xs flex items-center gap-1 ${bi.itemId === it.id ? 'bg-[#FFED00]' : 'bg-white'}`}><ItemIcon item={it} size="sm" /> {it.name}</button>
                ))}
              </div>
              <input type="number" value={bi.quantity || ''} onChange={e => { const n = [...bis]; n[i].quantity = +e.target.value; setBis(n); }} className="w-full p-2 text-sm" placeholder="Qty" />
            </div>
          ))}
        </div>
        <button onClick={save} disabled={saving} className="w-full bg-[#FFED00] text-black p-3 font-bold">{saving ? 'SAVING...' : 'SAVE'}</button>
      </div>
      <div className="bg-white border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr><th className="p-3 text-left">Items</th><th className="p-3 text-left">Project</th><th className="p-3 text-left">Dates</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {displayBookings.map(b => (
              <tr key={b.id} className="border-t">
                <td className="p-3">{b.items.map((bi, idx) => <div key={idx}>{items.find(item => item.id === bi.itemId)?.name} x{bi.quantity}</div>)}</td>
                <td className="p-3 font-bold">{projects.find(p => p.id === b.projectId)?.name}</td>
                <td className="p-3">{formatDate(b.startDate)} - {formatDate(b.endDate)}</td>
                <td className="p-3 text-right">
                  <button onClick={() => { setEdit(b.id); setBis(b.items); setPid(b.projectId); setStart(b.startDate); setEnd(b.endDate); window.scrollTo(0,0); }} className="mr-2"><Edit2 size={16}/></button>
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
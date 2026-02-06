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
  const [projectSearch, setProjectSearch] = useState(''); 

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

  // FIXED: Added null-checks and String conversion to prevent crashes
  const filteredProjects = projects.filter(p =>  
    String(p.name || '').toLowerCase().includes(projectSearch.toLowerCase()) || 
    String(p.number || '').toLowerCase().includes(projectSearch.toLowerCase()) 
  );

  // FIXED: Logic to filter the bookings table based on the search input
  const displayBookings = bookings.filter(b => {
    const s = projectSearch.toLowerCase();
    if (!s) return true;
    const p = projects.find(proj => proj.id === b.projectId);
    const projectName = String(p?.name || '').toLowerCase();
    const projectNum = String(p?.number || '').toLowerCase();
    return projectName.includes(s) || projectNum.includes(s);
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
      setProjectSearch(''); 
    } catch (error) { 
      console.error('Error saving project:', error); 
    } 
  }; 

  const save = async () => { 
    if (!pid || !start || !end || bis.length === 0) { setErr('All fields required'); return; } 
    for (const bi of bis) { 
      if (!bi.itemId || bi.quantity <= 0) { setErr('All items need selection and quantity > 0'); return; } 
      const item = items.find(i => i.id === bi.itemId); 
      if (item && bi.quantity > item.totalQuantity) { 
        setErr("Looks like you don't own so many!"); return; 
      } 
      const avail = calcAvailable(bi.itemId, start, end, bookings, items, edit || undefined); 
      if (bi.quantity > avail) { 
        setErr("One or more items are already booked for that period."); return; 
      } 
    } 
    setSaving(true); 
    try { 
      const bData = { project_id: pid, start_date: start, end_date: end };
      if (edit) { 
        await supabase.from('bookings').update(bData).eq('id', edit); 
        await supabase.from('booking_items').delete().eq('booking_id', edit); 
        const bItems = bis.map(bi => ({ booking_id: edit, item_id: bi.itemId, quantity: bi.quantity })); 
        await supabase.from('booking_items').insert(bItems); 
      } else { 
        const { data: bRes } = await supabase.from('bookings').insert([bData]).select().single(); 
        const bItems = bis.map(bi => ({ booking_id: bRes.id, item_id: bi.itemId, quantity: bi.quantity })); 
        await supabase.from('booking_items').insert(bItems); 
      } 
      await refreshData(); 
      setBis([{ itemId: '', quantity: 0 }]); setPid(''); setStart(''); setEnd(''); setEdit(null); setErr(''); 
    } catch (error) { console.error(error); } finally { setSaving(false); } 
  }; 

  const handleDelete = async (id: string) => { 
    if (!confirm('Delete this booking?')) return; 
    try { 
      await supabase.from('bookings').delete().eq('id', id); 
      await refreshData(); 
    } catch (error) { console.error(error); } 
  }; 

  const filteredItems = filterItems();
  return ( 
    <div style={{ fontFamily: "Raleway, sans-serif" }}> 
      <h2 className="text-4xl font-medium mb-6" style={{ color: '#191A23' }}>Bookings</h2> 
       
      <div className="p-6 border mb-6" style={{ backgroundColor: '#191A23', borderColor: '#191A23' }}> 
        <h3 className="text-lg font-medium mb-4" style={{ color: '#FFED00' }}> 
          {edit ? 'Edit Booking' : 'Create New Booking'} 
        </h3> 
         
        <div className="space-y-4"> 
          <div className="grid grid-cols-3 gap-4"> 
            <div> 
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Project</label> 
              <div className="space-y-2"> 
                <div className="relative"> 
                  <Search className="absolute left-3 top-2.5 w-4 h-4" style={{ color: '#575F60' }} /> 
                  <input 
                    type="text" 
                    placeholder="Search projects..." 
                    value={projectSearch} 
                    onChange={e => setProjectSearch(e.target.value)} 
                    className="w-full pl-10 pr-3 py-2 border text-sm" 
                    style={{ borderColor: '#575F60', backgroundColor: 'white', color: '#191A23' }} 
                  /> 
                </div> 
                <select  
                  value={pid}  
                  onChange={e => setPid(e.target.value)}  
                  className="w-full px-3 py-2 border text-sm" 
                  style={{ borderColor: '#575F60', backgroundColor: 'white', color: '#191A23' }} 
                  disabled={saving} 
                > 
                  <option value="">Select</option> 
                  {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.number})</option>)} 
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
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Start Date</label> 
              <input type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full px-3 py-2 border text-sm" style={{ borderColor: '#575F60', backgroundColor: 'white', color: '#191A23' }} disabled={saving} /> 
            </div> 
            <div> 
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>End Date</label> 
              <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full px-3 py-2 border text-sm" style={{ borderColor: '#575F60', backgroundColor: 'white', color: '#191A23' }} disabled={saving} /> 
            </div> 
          </div> 

          {showProjectForm && ( 
            <div className="p-4 border" style={{ backgroundColor: '#F3F3F3', borderColor: '#575F60' }}> 
              <div className="grid grid-cols-4 gap-2 mb-2"> 
                <input type="text" placeholder="Project name" value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} className="px-3 py-2 border text-sm" style={{ borderColor: '#575F60' }} /> 
                <input type="text" placeholder="Number" value={projectForm.number} onChange={e => setProjectForm({ ...projectForm, number: e.target.value })} className="px-3 py-2 border text-sm" style={{ borderColor: '#575F60' }} /> 
                <input type="text" placeholder="Client" value={projectForm.client} onChange={e => setProjectForm({ ...projectForm, client: e.target.value })} className="px-3 py-2 border text-sm" style={{ borderColor: '#575F60' }} /> 
                <div className="flex gap-2"> 
                  <button onClick={saveProject} className="flex-1 px-3 py-2 text-sm font-medium border" style={{ backgroundColor: '#FFED00', borderColor: '#191A23', color: '#191A23' }}>Add</button> 
                  <button onClick={() => { setShowProjectForm(false); setProjectForm({ name: '', number: '', client: '' }); }} className="px-3 py-2 border text-sm" style={{ borderColor: '#575F60', color: '#575F60' }}>Cancel</button> 
                </div> 
              </div> 
            </div> 
          )} 
           
          <div> 
            <div className="flex justify-between mb-3"> 
              <label className="text-sm font-medium" style={{ color: '#575F60' }}>Items to Book</label> 
              <button onClick={() => setBis([...bis, { itemId: '', quantity: 0 }])} disabled={saving} className="flex items-center gap-1 px-3 py-2 text-sm font-medium border" style={{ backgroundColor: '#FFED00', borderColor: '#191A23', color: '#191A23' }}><Plus className="w-4 h-4" /> Add Item</button> 
            </div> 
             
            {bis.map((bi, i) => ( 
              <div key={i} className="mb-4 p-4 border" style={{ backgroundColor: '#F3F3F3', borderColor: '#575F60' }}> 
                <div className="flex justify-between items-center mb-3"> 
                  <label className="text-sm font-medium" style={{ color: '#191A23' }}>Item {i + 1}</label> 
                  <button onClick={() => setBis(bis.filter((_, idx) => idx !== i))} disabled={bis.length === 1 || saving} className="text-xs flex items-center gap-1" style={{ color: '#dc2626' }}><X className="w-4 h-4" /> Remove</button> 
                </div> 
                 
                <div className="mb-3 space-y-2"> 
                  <div className="relative"> 
                    <Search className="absolute left-3 top-2.5 w-4 h-4" style={{ color: '#575F60' }} /> 
                    <input type="text" placeholder="Search items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border text-sm" style={{ borderColor: '#575F60', backgroundColor: 'white' }} /> 
                  </div> 
                  <div className="flex flex-wrap gap-1"> 
                    <span className="text-xs" style={{ color: '#575F60' }}>Filter:</span> 
                    {[{ id: 'ungrouped', name: 'Ungrouped' }, ...groups.filter(g => g.id !== '00000000-0000-0000-0000-000000000000')].map(g => ( 
                      <button key={g.id} onClick={() => toggleGroup(g.id)} className="px-2 py-1 text-xs border" style={{ backgroundColor: selectedGroups.includes(g.id) ? '#FFED00' : 'white', borderColor: selectedGroups.includes(g.id) ? '#191A23' : '#575F60', color: '#191A23' }}>{g.name}</button> 
                    ))} 
                  </div> 
                </div> 

                <div className="flex flex-wrap gap-2 mb-3"> 
                  {filteredItems.slice(0, 15).map(it => ( 
                    <button key={it.id} type="button" onClick={() => { const n = [...bis]; n[i].itemId = it.id; setBis(n); }} disabled={saving} className="flex items-center gap-2 px-3 py-2 border text-sm" style={{ backgroundColor: bi.itemId === it.id ? '#FFED00' : 'white', borderColor: bi.itemId === it.id ? '#191A23' : '#575F60', color: '#191A23' }}><ItemIcon item={it} size="sm" /><span>{it.name}</span></button> 
                  ))} 
                </div> 
                <input type="number" placeholder="Quantity" value={bi.quantity || ''} onChange={e => { const n = [...bis]; n[i].quantity = +e.target.value || 0; setBis(n); }} className="w-full px-3 py-2 border text-sm" style={{ borderColor: '#575F60', backgroundColor: 'white' }} disabled={saving} /> 
              </div> 
            ))} 
          </div> 
           
          {err && <p className="text-sm font-medium" style={{ color: '#dc2626' }}>{err}</p>} 
          <button onClick={save} disabled={saving} className="px-6 py-3 text-sm font-medium border" style={{ backgroundColor: '#FFED00', borderColor: '#191A23', color: '#191A23' }}> 
            {saving ? 'Saving...' : edit ? 'Update' : 'Create'} 
          </button> 
        </div> 
      </div> 
       
      <div className="border" style={{ backgroundColor: 'white', borderColor: '#191A23' }}> 
        <table className="w-full"> 
          <thead style={{ backgroundColor: '#F3F3F3' }}> 
            <tr> 
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60' }}>Items</th> 
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60' }}>Project</th> 
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60' }}>Start</th> 
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60' }}>End</th> 
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60' }}>Actions</th> 
            </tr> 
          </thead> 
          <tbody> 
            {displayBookings.map(b => ( 
              <tr key={b.id} className="border-t" style={{ borderColor: '#F3F3F3' }}> 
                <td className="px-4 py-3"> 
                  {b.items.map((bi, i) => { 
                    const it = items.find(item => item.id === bi.itemId); 
                    return ( 
                      <div key={i} className="flex items-center gap-2 mb-1"> 
                        {it && <ItemIcon item={it} size="sm" />} 
                        <span className="text-sm" style={{ color: '#191A23' }}>{it?.name} <span style={{ color: '#575F60' }}>x{bi.quantity}</span></span> 
                      </div> 
                    ); 
                  })} 
                </td> 
                <td className="px-4 py-3 text-sm" style={{ color: '#191A23' }}>{projects.find(p => p.id === b.projectId)?.name}</td> 
                <td className="px-4 py-3 text-sm" style={{ color: '#191A23' }}>{formatDate(b.startDate)}</td> 
                <td className="px-4 py-3 text-sm" style={{ color: '#191A23' }}>{formatDate(b.endDate)}</td> 
                <td className="px-4 py-3"> 
                  <button onClick={() => { setEdit(b.id); setBis(b.items); setPid(b.projectId); setStart(b.startDate); setEnd(b.endDate); }} className="mr-2" style={{ color: '#575F60' }}><Edit2 className="w-4 h-4" /></button> 
                  <button onClick={() => handleDelete(b.id)} style={{ color: '#dc2626' }}><Trash2 className="w-4 h-4" /></button> 
                </td> 
              </tr> 
            ))} 
          </tbody> 
        </table> 
      </div> 
    </div> 
  ); 
};
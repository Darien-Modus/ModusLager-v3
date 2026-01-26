import React, { useState } from 'react';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import { Booking, BookingItem, Item, Project } from '../types';
import { calcAvailable, formatDate } from '../utils/helpers';
import { ItemIcon } from './ItemIcon';
import { supabase } from '../utils/supabase';

interface BookingsPageProps {
  bookings: Booking[];
  setBookings: (bookings: Booking[]) => void;
  items: Item[];
  projects: Project[];
  refreshData: () => void;
}

export const BookingsPage: React.FC<BookingsPageProps> = ({ bookings, setBookings, items, projects, refreshData }) => {
  const [bis, setBis] = useState<BookingItem[]>([{ itemId: '', quantity: 0 }]);
  const [pid, setPid] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [edit, setEdit] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

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
        // Update existing booking
        // First update the booking itself
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            project_id: pid,
            start_date: start,
            end_date: end
          })
          .eq('id', edit);
        
        if (bookingError) throw bookingError;
        
        // Delete old booking_items
        const { error: deleteError } = await supabase
          .from('booking_items')
          .delete()
          .eq('booking_id', edit);
        
        if (deleteError) throw deleteError;
        
        // Insert new booking_items
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
        // Create new booking
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
        
        // Insert booking_items
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
      
      // Refresh data from database
      await refreshData();
      
      // Reset form
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

  const handleDelete = async (id: string) => {
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
      alert('Error deleting booking. Check console for details.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Bookings Management</h2>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project</label>
              <select 
                value={pid} 
                onChange={e => setPid(e.target.value)} 
                className="w-full px-4 py-2 border rounded-lg"
                disabled={saving}
              >
                <option value="">Select</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input 
                type="date" 
                value={start} 
                onChange={e => setStart(e.target.value)} 
                className="w-full px-4 py-2 border rounded-lg"
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input 
                type="date" 
                value={end} 
                onChange={e => setEnd(e.target.value)} 
                className="w-full px-4 py-2 border rounded-lg"
                disabled={saving}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-3">
              <label className="text-sm font-medium">Items to Book</label>
              <button 
                onClick={() => setBis([...bis, { itemId: '', quantity: 0 }])} 
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />+ Add Item
              </button>
            </div>
            
            {bis.map((bi, i) => (
              <div key={i} className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Item {i + 1}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {items.map(it => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => { const n = [...bis]; n[i].itemId = it.id; setBis(n); }}
                      disabled={saving}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                        bi.itemId === it.id 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      } disabled:opacity-50`}
                    >
                      <ItemIcon item={it} />
                      <span className="text-sm font-medium">{it.name}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    placeholder="Quantity" 
                    value={bi.quantity || ''} 
                    onChange={e => { const n = [...bis]; n[i].quantity = +e.target.value || 0; setBis(n); }} 
                    className="px-4 py-2 border rounded-lg"
                    disabled={saving}
                  />
                  <button 
                    onClick={() => setBis(bis.filter((_, idx) => idx !== i))} 
                    disabled={bis.length === 1 || saving} 
                    className="flex items-center justify-center gap-1 text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed border border-red-200 rounded-lg disabled:border-gray-200"
                  >
                    <X className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {err && <p className="text-red-600 font-medium">{err}</p>}
          <button 
            onClick={save} 
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : edit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id}>
                <td className="px-6 py-4">
                  {b.items.map((bi, i) => {
                    const it = items.find(item => item.id === bi.itemId);
                    return (
                      <div key={i} className="flex items-center gap-2 mb-1">
                        {it && <ItemIcon item={it} />}
                        <span className="text-sm">{it?.name} <span className="text-gray-500">x{bi.quantity}</span></span>
                      </div>
                    );
                  })}
                </td>
                <td className="px-6 py-4">{projects.find(p => p.id === b.projectId)?.name}</td>
                <td className="px-6 py-4">{formatDate(b.startDate)}</td>
                <td className="px-6 py-4">{formatDate(b.endDate)}</td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => { 
                      setEdit(b.id); 
                      setBis(b.items); 
                      setPid(b.projectId); 
                      setStart(b.startDate); 
                      setEnd(b.endDate); 
                    }} 
                    className="text-blue-600 mr-3"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(b.id)} 
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
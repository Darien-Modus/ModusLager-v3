import React, { useState } from 'react';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import { Booking, BookingItem, Item, Project } from '../types';
import { calcAvailable, formatDate } from '../utils/helpers';
import { ItemIcon } from './ItemIcon';
import { supabase } from '../utils/supabase';

interface BookingsPageProps {
  bookings: Booking[];
  items: Item[];
  projects: Project[];
  refreshData: () => void;
}

export const BookingsPage: React.FC<BookingsPageProps> = ({ bookings, items, projects, refreshData }) => {
  const [bis, setBis] = useState<BookingItem[]>([{ itemId: '', quantity: 0 }]);
  const [pid, setPid] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [edit, setEdit] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving) return;
    
    setSaving(true);
    setErr('');

    // Validation
    if (!pid) {
      setErr('Please select a project');
      setSaving(false);
      return;
    }

    if (!start || !end) {
      setErr('Please select start and end dates');
      setSaving(false);
      return;
    }

    if (bis.some(bi => !bi.itemId || bi.quantity <= 0)) {
      setErr('Please select items and quantities');
      setSaving(false);
      return;
    }

    try {
      if (edit) {
        // Update existing booking
        await supabase
          .from('bookings')
          .update({
            project_id: pid,
            start_date: start,
            end_date: end,
            updated_at: new Date().toISOString()
          })
          .eq('id', edit);

        // Update booking items
        await supabase
          .from('booking_items')
          .delete()
          .eq('booking_id', edit);

        // Add new booking items
        for (const bi of bis) {
          if (bi.itemId && bi.quantity > 0) {
            await supabase
              .from('booking_items')
              .insert({
                booking_id: edit,
                item_id: bi.itemId,
                quantity: bi.quantity
              });
          }
        }
      } else {
        // Create new booking
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            project_id: pid,
            start_date: start,
            end_date: end
          })
          .select()
          .single();

        if (bookingError) throw bookingError;

        // Add booking items
        for (const bi of bis) {
          if (bi.itemId && bi.quantity > bi.quantity) {
            await supabase
              .from('booking_items')
              .insert({
                booking_id: bookingData.id,
                item_id: bi.itemId,
                quantity: bi.quantity
              });
          }
        }
      }

      // Refresh data
      await refreshData();
      
      // Reset form
      setBis([{ itemId: '', quantity: 0 }]);
      setPid('');
      setStart('');
      setEnd('');
      setEdit(null);
    } catch (error) {
      console.error('Error saving booking:', error);
      setErr('Failed to save booking. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await supabase
          .from('booking_items')
          .delete()
          .eq('booking_id', id);

        await supabase
          .from('bookings')
          .delete()
          .eq('id', id);

        await refreshData();
      } catch (error) {
        console.error('Error deleting booking:', error);
        setErr('Failed to delete booking. Please try again.');
      }
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">{edit ? 'Edit Booking' : 'Create New Booking'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select
                value={pid}
                onChange={(e) => setPid(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Items</label>
              <button 
                onClick={() => setBis([...bis, { itemId: '', quantity: 0 }])} 
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />+ Add Item
              </button>
            </div>
            
            {bis.map((bi, i) => (
              <div key={i} className="mb-4 p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Item</label>
                    <select
                      value={bi.itemId}
                      onChange={(e) => { 
                        const n = [...bis]; 
                        n[i].itemId = e.target.value; 
                        setBis(n); 
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select an item</option>
                      {items.map(it => (
                        <option key={it.id} value={it.id}>{it.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={bi.quantity || ''}
                      onChange={(e) => { 
                        const n = [...bis]; 
                        n[i].quantity = +e.target.value || 0; 
                        setBis(n); 
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button 
                      onClick={() => setBis(bis.filter((_, idx) => idx !== i))} 
                      disabled={bis.length === 1 || saving} 
                      className="flex items-center justify-center gap-1 text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed border border-red-200 rounded-lg disabled:border-gray-200 w-full py-2"
                    >
                      <X className="w-4 h-4" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {err && <p className="text-red-600 font-medium mb-4">{err}</p>}
          
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
              <tr key={b.id} className="border-b">
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {b.items.map(item => (
                      <div key={item.id} className="text-sm">
                        {item.name} x {item.quantity}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {projects.find(p => p.id === b.project_id)?.name}
                </td>
                <td className="px-6 py-4">
                  {new Date(b.start_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {new Date(b.end_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setPid(b.project_id);
                        setStart(b.start_date);
                        setEnd(b.end_date);
                        setBis(b.items.map(item => ({
                          itemId: item.id,
                          quantity: item.quantity
                        })));
                        setEdit(b.id);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingForm;

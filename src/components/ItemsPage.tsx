import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Item, Booking } from '../types';
import { calcAvailable } from '../utils/helpers';
import { ItemIcon } from './ItemIcon';
import { supabase } from '../utils/supabase';

interface ItemsPageProps {
  items: Item[];
  setItems: (items: Item[]) => void;
  bookings: Booking[];
  refreshData: () => void;
}

export const ItemsPage: React.FC<ItemsPageProps> = ({ items, setItems, bookings, refreshData }) => {
  const [form, setForm] = useState({ name: '', qty: '', color: 'alu' });
  const [edit, setEdit] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const colorOptions = [
    { id: 'alu', name: 'Alu', color: '#9CA3AF' },
    { id: 'black', name: 'Black', color: '#000000' },
    { id: 'other', name: 'Other', color: 'rainbow' }
  ];

  const save = async () => {
    if (!form.name || !form.qty || !form.color) return;
    
    setSaving(true);
    try {
      const colorHex = colorOptions.find(c => c.id === form.color)?.color || '#9CA3AF';
      
      if (edit) {
        // Update existing item
        const { error } = await supabase
          .from('items')
          .update({
            name: form.name,
            total_quantity: parseInt(form.qty),
            color: colorHex
          })
          .eq('id', edit);
        
        if (error) throw error;
      } else {
        // Create new item
        const { error } = await supabase
          .from('items')
          .insert([{
            name: form.name,
            total_quantity: parseInt(form.qty),
            color: colorHex
          }]);
        
        if (error) throw error;
      }
      
      // Refresh data from database
      await refreshData();
      
      // Reset form
      setForm({ name: '', qty: '', color: 'alu' });
      setEdit(null);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item? This will also delete all associated bookings.')) return;
    
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await refreshData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item. Check console for details.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Items Management</h2>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input 
              type="text" 
              placeholder="Item name" 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              className="w-full px-4 py-2 border rounded-lg"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input 
              type="number" 
              placeholder="Quantity" 
              value={form.qty} 
              onChange={e => setForm({ ...form, qty: e.target.value })} 
              className="w-full px-4 py-2 border rounded-lg"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="flex gap-2">
              {colorOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setForm({ ...form, color: opt.id })}
                  disabled={saving}
                  className={`flex-1 px-4 py-2 border rounded-lg flex items-center justify-center gap-2 ${
                    form.color === opt.id ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  } disabled:opacity-50`}
                >
                  {opt.color === 'rainbow' ? (
                    <div className="w-6 h-6 rounded-full" style={{ background: 'linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)' }} />
                  ) : (
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: opt.color }} />
                  )}
                  <span className="text-sm">{opt.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <button 
          onClick={save} 
          disabled={saving}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : edit ? 'Update' : 'Add'}
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(i => {
              const today = new Date().toISOString().split('T')[0];
              const avail = calcAvailable(i.id, today, today, bookings, items);
              return (
                <tr key={i.id}>
                  <td className="px-6 py-4"><ItemIcon item={i} /></td>
                  <td className="px-6 py-4">{i.name}</td>
                  <td className="px-6 py-4">{i.totalQuantity}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-800 rounded">{avail}</span></td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => { 
                        setEdit(i.id); 
                        setForm({ 
                          name: i.name, 
                          qty: i.totalQuantity.toString(), 
                          color: i.color === '#9CA3AF' ? 'alu' : i.color === '#000000' ? 'black' : 'other' 
                        }); 
                      }} 
                      className="text-blue-600 mr-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(i.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
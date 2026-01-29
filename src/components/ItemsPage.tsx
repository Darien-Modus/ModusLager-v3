import { useState } from 'react';
import { Edit2, Trash2, ChevronDown, ChevronRight, FolderPlus, Plus } from 'lucide-react';
import { Item, Booking, Group } from '../types';
import { calcAvailable } from '../utils/helpers';
import { ItemIcon } from './ItemIcon';
import { supabase } from '../utils/supabase';

interface ItemsPageProps {
  items: Item[];
  bookings: Booking[];
  groups: Group[];
  refreshData: () => void;
}

export const ItemsPage: React.FC<ItemsPageProps> = ({ items, bookings, groups, refreshData }) => {
  const [form, setForm] = useState({ name: '', qty: '', color: 'alu', groupId: '' });
  const [edit, setEdit] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [groupForm, setGroupForm] = useState({ name: '', color: '#FFED00' });
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  
  const colorOptions = [
    { id: 'alu', name: 'Alu', color: '#9CA3AF' },
    { id: 'black', name: 'Black', color: '#1F1F1F' },
    { id: 'other', name: 'Other', color: 'rainbow' }
  ];

  const toggleGroup = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  const saveItem = async () => {
    if (!form.name || !form.qty || !form.color) {
      alert('Please fill in name, quantity, and color');
      return;
    }
    
    setSaving(true);
    try {
      const colorHex = colorOptions.find(c => c.id === form.color)?.color || '#9CA3AF';
      
      const itemData = {
        name: form.name,
        total_quantity: parseInt(form.qty),
        color: colorHex,
        group_id: form.groupId || null
      };

      if (edit) {
        const { error } = await supabase
          .from('items')
          .update(itemData)
          .eq('id', edit);
        
        if (error) {
          console.error('Supabase UPDATE error:', error);
          alert(`Cannot save: ${error.message}\n\nCheck console for details.`);
          return;
        }
      } else {
        const { error } = await supabase
          .from('items')
          .insert([itemData]);
        
        if (error) {
          console.error('Supabase INSERT error:', error);
          alert(`Cannot save: ${error.message}\n\nCheck console for details.`);
          return;
        }
      }
      
      await refreshData();
      setForm({ name: '', qty: '', color: 'alu', groupId: '' });
      setEdit(null);
    } catch (error: any) {
      console.error('Error saving item:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const moveItemToGroup = async (itemId: string, newGroupId: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ group_id: newGroupId === 'ungrouped' ? null : newGroupId })
        .eq('id', itemId);
      
      if (error) {
        console.error('Move error:', error);
        alert(`Cannot move item: ${error.message}`);
        return;
      }
      
      await refreshData();
    } catch (error: any) {
      console.error('Error moving item:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const saveGroup = async () => {
    if (!groupForm.name) {
      alert('Please enter group name');
      return;
    }
    
    setSaving(true);
    try {
      if (editingGroup) {
        const { error } = await supabase
          .from('groups')
          .update({
            name: groupForm.name,
            color: groupForm.color
          })
          .eq('id', editingGroup);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('groups')
          .insert([{
            name: groupForm.name,
            color: groupForm.color,
            sort_order: groups.length
          }]);
        
        if (error) throw error;
      }
      
      await refreshData();
      setGroupForm({ name: '', color: '#FFED00' });
      setShowGroupForm(false);
      setEditingGroup(null);
    } catch (error: any) {
      console.error('Error saving group:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    
    try {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const deleteGroup = async (id: string) => {
    if (!confirm('Delete this group? Items will be moved to Ungrouped.')) return;
    
    try {
      const { error } = await supabase.from('groups').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const groupedItems = groups.map(group => ({
    group,
    items: items.filter(item => 
      group.id === '00000000-0000-0000-0000-000000000000' 
        ? !item.groupId 
        : item.groupId === group.id
    )
  }));

  return (
    <div style={{ fontFamily: 'Raleway, sans-serif' }}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold" style={{ color: '#1F1F1F' }}>Items</h2>
      </div>

      {/* Add/Edit Item Form */}
      <div className="mb-3 p-2 border" style={{ backgroundColor: '#F5F5F5', borderColor: '#575F60' }}>
        <div className="grid grid-cols-5 gap-2 mb-2">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#575F60' }}>Name</label>
            <input 
              type="text" 
              placeholder="Item name" 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              className="w-full px-2 py-1 border text-xs"
              style={{ borderColor: '#575F60' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#575F60' }}>Quantity</label>
            <input 
              type="number" 
              placeholder="Quantity" 
              value={form.qty} 
              onChange={e => setForm({ ...form, qty: e.target.value })} 
              className="w-full px-2 py-1 border text-xs"
              style={{ borderColor: '#575F60' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#575F60' }}>Color</label>
            <div className="flex gap-1">
              {colorOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setForm({ ...form, color: opt.id })}
                  className={`flex-1 px-1 py-1 border text-xs ${
                    form.color === opt.id ? 'border-2' : ''
                  }`}
                  style={{ 
                    borderColor: form.color === opt.id ? '#FFED00' : '#575F60',
                    backgroundColor: 'white'
                  }}
                >
                  {opt.color === 'rainbow' ? (
                    <div className="w-full h-4 rounded" style={{ background: 'linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)' }} />
                  ) : (
                    <div className="w-full h-4 rounded" style={{ backgroundColor: opt.color }} />
                  )}
                  <div className="text-xs mt-0.5">{opt.name}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#575F60' }}>Group</label>
            <select
              value={form.groupId}
              onChange={e => setForm({ ...form, groupId: e.target.value })}
              className="w-full px-2 py-1 border text-xs"
              style={{ borderColor: '#575F60' }}
            >
              <option value="">Ungrouped</option>
              {groups.filter(g => g.id !== '00000000-0000-0000-0000-000000000000').map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={saveItem} 
            disabled={saving}
            className="px-2 py-1 text-xs mt-5"
            style={{ backgroundColor: '#FFED00', color: '#1F1F1F' }}
          >
            {saving ? 'Saving...' : edit ? 'Update' : <><Plus className="w-3 h-3 inline" /> Add</>}
          </button>
        </div>
        {edit && (
          <button 
            onClick={() => {
              setEdit(null);
              setForm({ name: '', qty: '', color: 'alu', groupId: '' });
            }}
            className="px-2 py-1 border text-xs"
            style={{ borderColor: '#575F60' }}
          >
            Cancel Edit
          </button>
        )}
      </div>

      {/* Groups Display with Add Group button in top right */}
      <div className="mb-2 flex justify-between items-center">
        <span className="text-xs font-medium" style={{ color: '#575F60' }}>Groups & Items</span>
        <button 
          onClick={() => setShowGroupForm(!showGroupForm)}
          className="flex items-center gap-1 px-2 py-1 border text-xs"
          style={{ 
            backgroundColor: '#FFED00',
            borderColor: '#1F1F1F',
            color: '#1F1F1F'
          }}
        >
          <FolderPlus className="w-3 h-3" /> Add Group
        </button>
      </div>

      {/* Group Form */}
      {showGroupForm && (
        <div className="mb-3 p-2 border" style={{ backgroundColor: '#F5F5F5', borderColor: '#575F60' }}>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Group name"
              value={groupForm.name}
              onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
              className="px-2 py-1 border text-xs"
              style={{ borderColor: '#575F60' }}
            />
            <input
              type="color"
              value={groupForm.color}
              onChange={e => setGroupForm({ ...groupForm, color: e.target.value })}
              className="h-7 border"
              style={{ borderColor: '#575F60' }}
            />
            <div className="flex gap-1">
              <button 
                onClick={saveGroup} 
                disabled={saving}
                className="flex-1 px-2 py-1 text-xs"
                style={{ backgroundColor: '#FFED00', color: '#1F1F1F' }}
              >
                {saving ? 'Saving...' : editingGroup ? 'Update' : 'Create'}
              </button>
              <button 
                onClick={() => { 
                  setShowGroupForm(false); 
                  setEditingGroup(null); 
                  setGroupForm({ name: '', color: '#FFED00' }); 
                }}
                className="px-2 py-1 border text-xs"
                style={{ borderColor: '#575F60' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="space-y-2">
        {groupedItems.map(({ group, items: groupItems }) => (
          <div key={group.id} className="border" style={{ borderColor: '#575F60', backgroundColor: 'white' }}>
            <div 
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-opacity-80"
              onClick={() => toggleGroup(group.id)}
              style={{ backgroundColor: '#F5F5F5' }}
            >
              <div className="flex items-center gap-2">
                {collapsedGroups.has(group.id) ? (
                  <ChevronRight className="w-4 h-4" style={{ color: '#575F60' }} />
                ) : (
                  <ChevronDown className="w-4 h-4" style={{ color: '#575F60' }} />
                )}
                <div className="w-3 h-3" style={{ backgroundColor: group.color }} />
                <span className="text-xs font-medium" style={{ color: '#1F1F1F' }}>
                  {group.name} ({groupItems.length})
                </span>
              </div>
              
              {group.id !== '00000000-0000-0000-0000-000000000000' && (
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => { 
                      setEditingGroup(group.id); 
                      setGroupForm({ name: group.name, color: group.color || '#FFED00' }); 
                      setShowGroupForm(true); 
                    }}
                    className="p-1"
                    style={{ color: '#575F60' }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => deleteGroup(group.id)}
                    style={{ color: '#dc2626' }}
                    className="p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            
            {!collapsedGroups.has(group.id) && (
              <div className="border-t" style={{ borderColor: '#575F60' }}>
                <table className="w-full">
                  <thead style={{ backgroundColor: 'rgba(87, 95, 96, 0.1)' }}>
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium" style={{ color: '#575F60' }}>Icon</th>
                      <th className="px-2 py-1 text-left text-xs font-medium" style={{ color: '#575F60' }}>Name</th>
                      <th className="px-2 py-1 text-left text-xs font-medium" style={{ color: '#575F60' }}>Total</th>
                      <th className="px-2 py-1 text-left text-xs font-medium" style={{ color: '#575F60' }}>Available</th>
                      <th className="px-2 py-1 text-left text-xs font-medium" style={{ color: '#575F60' }}>Move To Group</th>
                      <th className="px-2 py-1 text-left text-xs font-medium" style={{ color: '#575F60' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupItems.map(item => {
                      const today = new Date().toISOString().split('T')[0];
                      const avail = calcAvailable(item.id, today, today, bookings, items);
                      return (
                        <tr key={item.id} className="border-t" style={{ borderColor: '#e5e7eb' }}>
                          <td className="px-2 py-1"><ItemIcon item={item} size="sm" /></td>
                          <td className="px-2 py-1 text-xs" style={{ color: '#1F1F1F' }}>{item.name}</td>
                          <td className="px-2 py-1 text-xs" style={{ color: '#1F1F1F' }}>{item.totalQuantity}</td>
                          <td className="px-2 py-1">
                            <span className="px-1 py-0.5 text-xs" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                              {avail}
                            </span>
                          </td>
                          <td className="px-2 py-1">
                            <select
                              value={item.groupId || 'ungrouped'}
                              onChange={(e) => moveItemToGroup(item.id, e.target.value)}
                              className="px-1 py-0.5 border text-xs"
                              style={{ borderColor: '#575F60' }}
                            >
                              <option value="ungrouped">Ungrouped</option>
                              {groups.filter(g => g.id !== '00000000-0000-0000-0000-000000000000').map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1">
                            <button 
                              onClick={() => { 
                                setEdit(item.id); 
                                setForm({ 
                                  name: item.name, 
                                  qty: item.totalQuantity.toString(), 
                                  color: item.color === '#9CA3AF' ? 'alu' : item.color === '#1F1F1F' ? 'black' : 'other',
                                  groupId: item.groupId || ''
                                }); 
                              }} 
                              className="mr-1"
                              style={{ color: '#575F60' }}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => deleteItem(item.id)} 
                              style={{ color: '#dc2626' }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

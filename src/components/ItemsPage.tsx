import { useState } from 'react';
import { Edit2, Trash2, ChevronDown, ChevronRight, MoreVertical, Plus, Check, X, Upload, Image as ImageIcon, Search } from 'lucide-react';
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
  const [form, setForm] = useState({ name: '', qty: '', color: '#9CA3AF', image: '', groupId: '' });
  const [edit, setEdit] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [groupForm, setGroupForm] = useState({ name: '', color: '#FFED00' });
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [movingItems, setMovingItems] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [moveTargetGroup, setMoveTargetGroup] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showGroupColorPicker, setShowGroupColorPicker] = useState(false);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm({ ...form, image: reader.result as string, color: '' });
      reader.readAsDataURL(file);
    }
  };

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
    if (!form.name || !form.qty) return;
    
    setSaving(true);
    try {
      if (edit) {
        const { error } = await supabase
          .from('items')
          .update({
            name: form.name,
            total_quantity: parseInt(form.qty),
            color: form.color,
            image: form.image || null,
            group_id: form.groupId || null
          })
          .eq('id', edit);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('items')
          .insert([{
            name: form.name,
            total_quantity: parseInt(form.qty),
            color: form.color,
            image: form.image || null,
            group_id: form.groupId || null
          }]);
        
        if (error) throw error;
      }
      
      await refreshData();
      setForm({ name: '', qty: '', color: '#9CA3AF', image: '', groupId: '' });
      setEdit(null);
      setShowColorPicker(false);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Check console for details.');
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
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item.');
    }
  };

  const saveGroup = async () => {
    if (!groupForm.name) return;
    
    setSaving(true);
    try {
      if (editingGroup) {
        const { error } = await supabase
          .from('groups')
          .update({ name: groupForm.name, color: groupForm.color })
          .eq('id', editingGroup);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('groups')
          .insert([{ name: groupForm.name, color: groupForm.color, sort_order: groups.length }]);
        if (error) throw error;
      }
      
      await refreshData();
      setGroupForm({ name: '', color: '#FFED00' });
      setShowGroupForm(false);
      setEditingGroup(null);
      setShowGroupColorPicker(false);
    } catch (error) {
      console.error('Error saving group:', error);
      alert('Error saving group.');
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Delete this group? Items will be moved to Ungrouped.')) return;
    
    try {
      const { error } = await supabase.from('groups').delete().eq('id', groupId);
      if (error) throw error;
      await refreshData();
    } catch (error) {
      console.error('Error deleting group.');
    }
  };

  const startMoving = (groupId: string) => {
    setMovingItems(groupId);
    setSelectedItems(new Set());
    setMoveTargetGroup('');
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const executeMoveItems = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      setSaving(true);
      for (const itemId of selectedItems) {
        const { error } = await supabase
          .from('items')
          .update({ group_id: moveTargetGroup || null })
          .eq('id', itemId);
        if (error) throw error;
      }
      
      await refreshData();
      setMovingItems(null);
      setSelectedItems(new Set());
      setMoveTargetGroup('');
    } catch (error) {
      console.error('Error moving items:', error);
      alert('Error moving items.');
    } finally {
      setSaving(false);
    }
  };

  const toggleGroupFilter = (groupId: string) => {
    if (selectedGroupFilter.includes(groupId)) {
      setSelectedGroupFilter(selectedGroupFilter.filter(g => g !== groupId));
    } else {
      setSelectedGroupFilter([...selectedGroupFilter, groupId]);
    }
  };

  // Filter items by search and group
  const filterItems = (itemsList: Item[]) => {
    let filtered = itemsList;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const groupedItems = groups.reduce((acc, group) => {
    acc[group.id] = filterItems(items.filter(item => item.groupId === group.id));
    return acc;
  }, {} as Record<string, Item[]>);

  const ungroupedItems = filterItems(items.filter(item => !item.groupId || item.groupId === '00000000-0000-0000-0000-000000000000'));

  // Get visible groups based on filter
  const visibleGroups = selectedGroupFilter.length > 0 
    ? groups.filter(g => selectedGroupFilter.includes(g.id) || g.id === '00000000-0000-0000-0000-000000000000')
    : groups;

  return (
    <div style={{ fontFamily: 'Raleway, sans-serif' }}>
      <h2 className="text-base font-semibold mb-3" style={{ color: '#1F1F1F' }}>Items</h2>
      
      {/* Search and Filter */}
      <div className="mb-3 p-2 border" style={{ backgroundColor: '#F5F5F5', borderColor: '#575F60' }}>
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1.5 w-3 h-3" style={{ color: '#575F60' }} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 border text-xs"
              style={{ borderColor: '#575F60' }}
            />
          </div>
        </div>
        
        {/* Group filters */}
        <div className="flex flex-wrap gap-1">
          <span className="text-xs" style={{ color: '#575F60' }}>Groups:</span>
          {groups.filter(g => g.id !== '00000000-0000-0000-0000-000000000000').map(g => (
            <button
              key={g.id}
              onClick={() => toggleGroupFilter(g.id)}
              className="px-2 py-0.5 text-xs border"
              style={{
                backgroundColor: selectedGroupFilter.includes(g.id) ? '#FFED00' : 'white',
                borderColor: '#575F60',
                color: '#1F1F1F'
              }}
            >
              {g.name}
            </button>
          ))}
          {selectedGroupFilter.length > 0 && (
            <button
              onClick={() => setSelectedGroupFilter([])}
              className="px-2 py-0.5 text-xs"
              style={{ color: '#dc2626' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      {/* Add Item Form */}
      <div className="p-2 border mb-3" style={{ backgroundColor: '#F5F5F5', borderColor: '#575F60' }}>
        <div className="grid grid-cols-6 gap-2 mb-2">
          <input 
            type="text" 
            placeholder="Item name" 
            value={form.name} 
            onChange={e => setForm({ ...form, name: e.target.value })} 
            className="px-2 py-1 border text-xs"
            style={{ borderColor: '#575F60' }}
            disabled={saving}
          />
          <input 
            type="number" 
            placeholder="Qty" 
            value={form.qty} 
            onChange={e => setForm({ ...form, qty: e.target.value })} 
            className="px-2 py-1 border text-xs"
            style={{ borderColor: '#575F60' }}
            disabled={saving}
          />
          
          {/* Color/Image Selection */}
          <div className="flex gap-1 items-center">
            <button
              type="button"
              onClick={() => setForm({ ...form, color: '#9CA3AF', image: '' })}
              className={`w-5 h-5 border ${form.color === '#9CA3AF' && !form.image ? 'border-2' : ''}`}
              style={{ 
                backgroundColor: '#9CA3AF',
                borderColor: form.color === '#9CA3AF' && !form.image ? '#FFED00' : '#575F60'
              }}
              title="Alu"
            />
            <button
              type="button"
              onClick={() => setForm({ ...form, color: '#000000', image: '' })}
              className={`w-5 h-5 border ${form.color === '#000000' && !form.image ? 'border-2' : ''}`}
              style={{ 
                backgroundColor: '#000000',
                borderColor: form.color === '#000000' && !form.image ? '#FFED00' : '#575F60'
              }}
              title="Black"
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`w-5 h-5 border flex items-center justify-center ${form.color && form.color !== '#9CA3AF' && form.color !== '#000000' && !form.image ? 'border-2' : ''}`}
                style={{ 
                  background: form.color && form.color !== '#9CA3AF' && form.color !== '#000000' ? form.color : 'linear-gradient(to right, red, yellow, green, blue)',
                  borderColor: form.color && form.color !== '#9CA3AF' && form.color !== '#000000' && !form.image ? '#FFED00' : '#575F60'
                }}
                title="Custom color"
              />
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white border z-10" style={{ borderColor: '#575F60' }}>
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm({ ...form, color: e.target.value, image: '' })}
                    className="w-20 h-8"
                  />
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="w-full mt-1 px-2 py-1 text-xs border"
                    style={{ borderColor: '#575F60' }}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
            <label className={`w-5 h-5 border cursor-pointer flex items-center justify-center ${form.image ? 'border-2' : ''}`}
                   style={{ borderColor: form.image ? '#FFED00' : '#575F60' }}>
              {form.image ? <ImageIcon className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
          
          <select
            value={form.groupId}
            onChange={e => setForm({ ...form, groupId: e.target.value })}
            className="px-2 py-1 border text-xs"
            style={{ borderColor: '#575F60' }}
            disabled={saving}
          >
            <option value="">Ungrouped</option>
            {groups.filter(g => g.id !== '00000000-0000-0000-0000-000000000000').map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          
          <button 
            onClick={saveItem} 
            disabled={saving}
            className="px-2 py-1 text-xs flex items-center justify-center gap-1"
            style={{ backgroundColor: '#FFED00', color: '#1F1F1F' }}
          >
            <Plus className="w-3 h-3" /> {saving ? '...' : edit ? 'Update' : 'Add'}
          </button>
          
          {edit && (
            <button
              onClick={() => { setEdit(null); setForm({ name: '', qty: '', color: '#9CA3AF', image: '', groupId: '' }); }}
              className="px-2 py-1 text-xs border"
              style={{ borderColor: '#575F60', color: '#575F60' }}
            >
              Cancel
            </button>
          )}
        </div>
        {form.image && (
          <div className="flex items-center gap-2">
            <img src={form.image} alt="Preview" className="w-6 h-6 object-cover sharp" />
            <button onClick={() => setForm({ ...form, image: '', color: '#9CA3AF' })} className="text-xs" style={{ color: '#575F60' }}>Remove</button>
          </div>
        )}
      </div>

      {/* Add Group Button */}
      <div className="mb-2">
        {!showGroupForm ? (
          <button
            onClick={() => setShowGroupForm(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs border"
            style={{ backgroundColor: '#F5F5F5', borderColor: '#575F60', color: '#1F1F1F' }}
          >
            <Plus className="w-3 h-3" /> Add Group
          </button>
        ) : (
          <div className="p-2 border" style={{ backgroundColor: 'white', borderColor: '#575F60' }}>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Group name"
                value={groupForm.name}
                onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                className="flex-1 px-2 py-1 border text-xs"
                style={{ borderColor: '#575F60' }}
              />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowGroupColorPicker(!showGroupColorPicker)}
                  className="w-6 h-6 border"
                  style={{ backgroundColor: groupForm.color, borderColor: '#575F60' }}
                />
                {showGroupColorPicker && (
                  <div className="absolute top-full left-0 mt-1 p-2 bg-white border z-10" style={{ borderColor: '#575F60' }}>
                    <input
                      type="color"
                      value={groupForm.color}
                      onChange={e => setGroupForm({ ...groupForm, color: e.target.value })}
                      className="w-20 h-8"
                    />
                    <button
                      onClick={() => setShowGroupColorPicker(false)}
                      className="w-full mt-1 px-2 py-1 text-xs border"
                      style={{ borderColor: '#575F60' }}
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={saveGroup}
                disabled={saving}
                className="px-2 py-1 text-xs"
                style={{ backgroundColor: '#FFED00', color: '#1F1F1F' }}
              >
                {editingGroup ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => { setShowGroupForm(false); setEditingGroup(null); setGroupForm({ name: '', color: '#FFED00' }); setShowGroupColorPicker(false); }}
                className="px-2 py-1 text-xs"
                style={{ color: '#575F60' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Groups */}
      <div className="space-y-2">
        {visibleGroups.filter(g => g.id !== '00000000-0000-0000-0000-000000000000').map(group => {
          const groupItems = groupedItems[group.id] || [];
          if (groupItems.length === 0 && searchTerm) return null;
          const isCollapsed = collapsedGroups.has(group.id);
          const isMoving = movingItems === group.id;
          
          return (
            <div key={group.id} className="border" style={{ borderColor: '#575F60', backgroundColor: 'white' }}>
              <div className="flex items-center justify-between px-2 py-1" style={{ backgroundColor: '#F5F5F5' }}>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleGroup(group.id)}>
                    {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <div className="w-3 h-3" style={{ backgroundColor: group.color || '#FFED00' }} />
                  <span className="font-medium text-xs" style={{ color: '#1F1F1F' }}>
                    {group.name} ({groupItems.length})
                  </span>
                </div>
                
                <div className="relative group">
                  <button className="p-1">
                    <MoreVertical className="w-3 h-3" style={{ color: '#575F60' }} />
                  </button>
                  <div className="absolute right-0 mt-1 w-28 bg-white border shadow-lg hidden group-hover:block z-10" style={{ borderColor: '#575F60' }}>
                    <button onClick={() => { setEditingGroup(group.id); setGroupForm({ name: group.name, color: group.color || '#FFED00' }); setShowGroupForm(true); }} className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100">
                      Edit
                    </button>
                    <button onClick={() => startMoving(group.id)} className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100">
                      Move items
                    </button>
                    <button onClick={() => deleteGroup(group.id)} className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 text-red-600">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              
              {!isCollapsed && (
                <div className="p-1">
                  {isMoving && (
                    <div className="mb-1 p-1 bg-blue-50 border border-blue-200 flex items-center justify-between">
                      <span className="text-xs">Select items:</span>
                      <div className="flex items-center gap-1">
                        <select value={moveTargetGroup} onChange={e => setMoveTargetGroup(e.target.value)} className="px-2 py-0.5 border text-xs" style={{ borderColor: '#575F60' }}>
                          <option value="">Ungrouped</option>
                          {groups.filter(g => g.id !== group.id && g.id !== '00000000-0000-0000-0000-000000000000').map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                        <button onClick={executeMoveItems} disabled={selectedItems.size === 0} className="p-0.5" style={{ backgroundColor: '#FFED00' }}>
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => { setMovingItems(null); setSelectedItems(new Set()); }} className="p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {groupItems.length === 0 ? (
                    <p className="text-xs text-center py-2" style={{ color: '#575F60' }}>No items</p>
                  ) : (
                    <div className="space-y-1">
                      {groupItems.map(item => {
                        const today = new Date().toISOString().split('T')[0];
                        const avail = calcAvailable(item.id, today, today, bookings, items);
                        
                        return (
                          <div key={item.id} className="flex items-center justify-between px-2 py-1 border" style={{ borderColor: '#e5e7eb' }}>
                            <div className="flex items-center gap-2">
                              {isMoving && (
                                <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => toggleItemSelection(item.id)} className="w-3 h-3" />
                              )}
                              <ItemIcon item={item} size="sm" />
                              <span className="text-xs" style={{ color: '#1F1F1F' }}>{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs" style={{ color: '#575F60' }}>
                                {item.totalQuantity} | {avail}
                              </span>
                              {!isMoving && (
                                <>
                                  <button onClick={() => { setEdit(item.id); setForm({ name: item.name, qty: item.totalQuantity.toString(), color: item.color || '#9CA3AF', image: item.image || '', groupId: item.groupId || '' }); }} style={{ color: '#575F60' }}>
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => deleteItem(item.id)} style={{ color: '#dc2626' }}>
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {ungroupedItems.length > 0 && (selectedGroupFilter.length === 0 || selectedGroupFilter.includes('ungrouped')) && (
          <div className="border" style={{ borderColor: '#575F60', backgroundColor: 'white' }}>
            <div className="flex items-center gap-2 px-2 py-1" style={{ backgroundColor: '#F5F5F5' }}>
              <button onClick={() => toggleGroup('ungrouped')}>
                {collapsedGroups.has('ungrouped') ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <div className="w-3 h-3" style={{ backgroundColor: '#575F60' }} />
              <span className="font-medium text-xs" style={{ color: '#1F1F1F' }}>
                Ungrouped ({ungroupedItems.length})
              </span>
            </div>
            
            {!collapsedGroups.has('ungrouped') && (
              <div className="p-1 space-y-1">
                {ungroupedItems.map(item => {
                  const today = new Date().toISOString().split('T')[0];
                  const avail = calcAvailable(item.id, today, today, bookings, items);
                  
                  return (
                    <div key={item.id} className="flex items-center justify-between px-2 py-1 border" style={{ borderColor: '#e5e7eb' }}>
                      <div className="flex items-center gap-2">
                        <ItemIcon item={item} size="sm" />
                        <span className="text-xs" style={{ color: '#1F1F1F' }}>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: '#575F60' }}>
                          {item.totalQuantity} | {avail}
                        </span>
                        <button onClick={() => { setEdit(item.id); setForm({ name: item.name, qty: item.totalQuantity.toString(), color: item.color || '#9CA3AF', image: item.image || '', groupId: item.groupId || '' }); }} style={{ color: '#575F60' }}>
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => deleteItem(item.id)} style={{ color: '#dc2626' }}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

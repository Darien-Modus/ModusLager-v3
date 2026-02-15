import { useState, useRef } from 'react';
import { Edit2, Trash2, ChevronRight, Plus, X, FolderPlus, Search, Upload, ChevronUp, ChevronDown, Package } from 'lucide-react';
import { Item, Booking, Group } from '../types';
import { calcAvailable, formatDate } from '../utils/helpers';
import { supabase } from '../utils/supabase';
import { compressImage } from '../utils/imageUtils';

interface ItemsPageProps {
  items: Item[];
  bookings: Booking[];
  groups: Group[];
  refreshData: () => void;
}

export const ItemsPage: React.FC<ItemsPageProps> = ({ items, bookings, groups, refreshData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(groups.map(g => g.id)));
  
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ name: '', qty: '', color: 'alu', customColor: '#9CA3AF', groupId: '', dimensions: '', description: '', images: [] as string[], iconIndex: 0 });
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({ name: '', color: '#FFED00' });
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  
  const colorOptions = [
    { id: 'none', name: 'None', color: 'transparent' },
    { id: 'alu', name: 'Alu', color: '#9CA3AF' },
    { id: 'black', name: 'Black', color: '#191A23' },
    { id: 'other', name: 'Other', color: 'custom' }
  ];

  const toggleGroup = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    newCollapsed.has(groupId) ? newCollapsed.delete(groupId) : newCollapsed.add(groupId);
    setCollapsedGroups(newCollapsed);
  };

  const moveGroupUp = async (group: Group) => {
    const sortedGroups = groups.filter(g => g.id !== '00000000-0000-0000-0000-000000000000').sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const currentIndex = sortedGroups.findIndex(g => g.id === group.id);
    if (currentIndex <= 0) return;
    
    const prevGroup = sortedGroups[currentIndex - 1];
    const tempOrder = group.sortOrder || 0;
    
    try {
      await supabase.from('groups').update({ sort_order: prevGroup.sortOrder || 0 }).eq('id', group.id);
      await supabase.from('groups').update({ sort_order: tempOrder }).eq('id', prevGroup.id);
      await refreshData();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const moveGroupDown = async (group: Group) => {
    const sortedGroups = groups.filter(g => g.id !== '00000000-0000-0000-0000-000000000000').sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const currentIndex = sortedGroups.findIndex(g => g.id === group.id);
    if (currentIndex === -1 || currentIndex >= sortedGroups.length - 1) return;
    
    const nextGroup = sortedGroups[currentIndex + 1];
    const tempOrder = group.sortOrder || 0;
    
    try {
      await supabase.from('groups').update({ sort_order: nextGroup.sortOrder || 0 }).eq('id', group.id);
      await supabase.from('groups').update({ sort_order: tempOrder }).eq('id', nextGroup.id);
      await refreshData();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const openItemModal = () => {
    setItemForm({ name: '', qty: '', color: 'alu', customColor: '#9CA3AF', groupId: '', dimensions: '', description: '', images: [], iconIndex: -1 });
    setEditingItem(null);
    setShowItemModal(true);
  };

  const openEditItemModal = (item: Item) => {
    setEditingItem(item.id);
    
    let colorType = 'none';
    if (item.color) {
        if (item.color === '#9CA3AF') colorType = 'alu';
        else if (item.color === '#191A23') colorType = 'black';
        else colorType = 'other';
    }
    
    setItemForm({
      name: item.name,
      qty: item.totalQuantity.toString(),
      color: colorType,
      customColor: colorType === 'other' ? item.color! : '#9CA3AF',
      groupId: item.groupId || '',
      dimensions: item.dimensions || '',
      description: item.description || '',
      images: item.images || [],
      iconIndex: item.iconIndex !== undefined ? item.iconIndex : -1
    });
    setShowItemModal(true);
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setEditingItem(null);
  };

  const openGroupModal = () => {
    setGroupForm({ name: '', color: '#FFED00' });
    setEditingGroup(null);
    setShowGroupModal(true);
  };

  const openEditGroupModal = (group: Group) => {
    setEditingGroup(group.id);
    setGroupForm({ name: group.name, color: group.color || '#FFED00' });
    setShowGroupModal(true);
  };

  const closeGroupModal = () => {
    setShowGroupModal(false);
    setEditingGroup(null);
  };

  const openDetailModal = (item: Item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedItem(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = 5 - itemForm.images.length;
    if (remainingSlots === 0) {
      alert('Maximum 5 images allowed');
      return;
    }
    
    setUploadingImage(true);
    try {
      const newImages: string[] = [];
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      
      for (const file of filesToProcess) {
        const compressed = await compressImage(file);
        newImages.push(compressed);
      }
      
      setItemForm(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setItemForm(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
        iconIndex: prev.iconIndex >= newImages.length ? -1 : prev.iconIndex
      };
    });
  };

  const checkBookingConflicts = async (itemId: string, newQty: number): Promise<boolean> => {
    const affectedBookings = bookings.filter(b => 
      b.items.some(bi => bi.itemId === itemId)
    );
    
    for (const booking of affectedBookings) {
      const bookingItem = booking.items.find(bi => bi.itemId === itemId);
      if (!bookingItem) continue;
      
      const currentItem = items.find(i => i.id === itemId)!;
      const available = calcAvailable(itemId, booking.startDate, booking.endDate, bookings.filter(b2 => b2.id !== booking.id), items);
      const newAvailable = newQty - (currentItem.totalQuantity - available);
      
      if (newAvailable < bookingItem.quantity) {
        const project = await supabase.from('projects').select('name').eq('id', booking.projectId).single();
        const projectName = project.data?.name || 'Unknown project';
        return !confirm(`Warning: This quantity change will make booking for "${projectName}" (${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}) unavailable. The booking requires ${bookingItem.quantity} but only ${newAvailable} will be available. Continue anyway?`);
      }
    }
    
    return false;
  };

  const saveItem = async () => {
    if (!itemForm.name || !itemForm.qty) {
      alert('Name and quantity are required');
      return;
    }
    
    if (editingItem) {
      const currentItem = items.find(i => i.id === editingItem);
      if (currentItem && parseInt(itemForm.qty) !== currentItem.totalQuantity) {
        const hasConflict = await checkBookingConflicts(editingItem, parseInt(itemForm.qty));
        if (hasConflict) return;
      }
    }
    
    setSaving(true);
    try {
      let colorHex: string | null = null;
      if (itemForm.color === 'alu') colorHex = '#9CA3AF';
      else if (itemForm.color === 'black') colorHex = '#191A23';
      else if (itemForm.color === 'other') colorHex = itemForm.customColor;
      
      const itemData = {
        name: itemForm.name,
        total_quantity: parseInt(itemForm.qty),
        color: colorHex,
        group_id: itemForm.groupId || null,
        dimensions: itemForm.dimensions || null,
        description: itemForm.description || null,
        images: itemForm.images.length > 0 ? itemForm.images : null,
        icon_index: itemForm.iconIndex
      };

      if (editingItem) {
        const { error } = await supabase.from('items').update(itemData).eq('id', editingItem);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('items').insert([itemData]);
        if (error) throw error;
      }
      
      await refreshData();
      closeItemModal();
    } catch (error: any) {
      console.error('Database error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
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
        const { error } = await supabase.from('groups').update({ name: groupForm.name, color: groupForm.color }).eq('id', editingGroup);
        if (error) throw error;
      } else {
        const maxSortOrder = Math.max(...groups.map(g => g.sortOrder || 0), -1);
        const { error } = await supabase.from('groups').insert([{ name: groupForm.name, color: groupForm.color, sort_order: maxSortOrder + 1 }]);
        if (error) throw error;
      }
      
      await refreshData();
      closeGroupModal();
    } catch (error: any) {
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
      alert(`Error: ${error.message}`);
    }
  };

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const groupedItems = groups
    .filter(g => g.id !== '00000000-0000-0000-0000-000000000000')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map(group => ({
      group,
      items: filteredItems.filter(item => item.groupId === group.id)
    }));
  
  const ungroupedGroup = groups.find(g => g.id === '00000000-0000-0000-0000-000000000000');
  if (ungroupedGroup) {
    groupedItems.push({
      group: ungroupedGroup,
      items: filteredItems.filter(item => !item.groupId)
    });
  }

  const renderItemIcon = (item: Item) => {
    const hasImages = item.images && item.images.length > 0;
    const iconIndex = item.iconIndex !== undefined ? item.iconIndex : -1;
    
    if (iconIndex === -1 || !hasImages) {
      return <div className="h-full w-full" style={{ backgroundColor: item.color || '#9CA3AF' }} />;
    }
    
    return <img src={item.images![iconIndex]} alt={item.name} className="w-full h-full object-cover" />;
  };

  const renderListIcon = (item: Item) => {
    const hasImages = item.images && item.images.length > 0;
    const iconIndex = item.iconIndex !== undefined ? item.iconIndex : -1;
    
    if (iconIndex !== -1 && hasImages) {
      return <img src={item.images![iconIndex]} alt={item.name} className="w-full h-full object-cover" />;
    }
    
    if (item.color) {
      return <div className="w-full h-full" style={{ backgroundColor: item.color }} />;
    }

    return (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center border border-gray-200">
            <Package className="w-5 h-5 text-gray-400" />
        </div>
    );
  };

  return (
    <div style={{ fontFamily: "Raleway, sans-serif" }}>
      <h2 className="text-4xl font-medium mb-6" style={{ color: '#191A23' }}>Items</h2>

      <div className="mb-6 border-2" style={{ backgroundColor: '#191A23', borderColor: '#191A23', maxWidth: '1248px', margin: '0 auto 24px', height: '90px' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 24px', gap: '16px' }}>
          <span className="text-sm font-medium" style={{ color: '#FFED00', flexShrink: 0, minWidth: '150px' }}>Search Items:</span>
          <div className="relative" style={{ flex: 1 }}>
            <Search className="absolute w-4 h-4" style={{ color: '#575F60', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Search items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border text-sm" style={{ borderColor: '#575F60', backgroundColor: 'white', color: '#191A23' }} />
          </div>
          <button onClick={openGroupModal} className="flex items-center gap-2 px-4 py-2 text-sm font-medium border-2" style={{ backgroundColor: 'white', borderColor: '#575F60', color: '#191A23', flexShrink: 0 }}>
            <FolderPlus className="w-4 h-4" /> Add Group
          </button>
          <button onClick={openItemModal} className="flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium border-2" style={{ backgroundColor: '#FFED00', borderColor: '#191A23', color: '#191A23', flexShrink: 0, minWidth: '160px' }}>
            <Plus className="w-5 h-5" /> Add Item
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1248px', margin: '0 auto' }} className="space-y-4">
        {groupedItems.map(({ group, items: groupItems }) => {
          const sortedGroups = groups.filter(g => g.id !== '00000000-0000-0000-0000-000000000000').sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          const currentIndex = sortedGroups.findIndex(g => g.id === group.id);
          const isFirst = currentIndex === 0;
          const isLast = currentIndex === sortedGroups.length - 1;
          const isUngrouped = group.id === '00000000-0000-0000-0000-000000000000';
          
          return (
            <div key={group.id} className="border-2 flex" style={{ borderColor: '#191A23', backgroundColor: 'white' }}>
              <div style={{ 
                width: '32px', 
                minWidth: '32px', 
                flexShrink: 0, 
                backgroundColor: group.color || '#9CA3AF' 
              }} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => toggleGroup(group.id)} style={{ backgroundColor: '#F3F3F3' }}>
                  <div className="flex items-center gap-3">
                    <div style={{ transform: collapsedGroups.has(group.id) ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }}>
                      <ChevronRight className="w-5 h-5" style={{ color: '#191A23' }} />
                    </div>
                    <span className="text-base font-medium" style={{ color: '#191A23' }}>{group.name}</span>
                    <span className="px-3 py-1 text-xs font-medium" style={{ backgroundColor: '#F3F3F3', color: '#575F60' }}>{groupItems.length} items</span>
                  </div>
                  
                  <div className="flex gap-2 items-center" onClick={e => e.stopPropagation()}>
                    {!isUngrouped && (
                      <>
                        <button onClick={() => moveGroupUp(group)} disabled={isFirst} className="p-1" style={{ color: isFirst ? '#D1D5DB' : '#575F60' }}>
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button onClick={() => moveGroupDown(group)} disabled={isLast} className="p-1" style={{ color: isLast ? '#D1D5DB' : '#575F60' }}>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditGroupModal(group)} style={{ color: '#575F60' }}><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteGroup(group.id)} style={{ color: '#dc2626' }}><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </div>
                
                {!collapsedGroups.has(group.id) && (
                  <div className="border-t" style={{ borderColor: '#F3F3F3' }}>
                    <table className="w-full">
                      <thead style={{ backgroundColor: '#F3F3F3' }}>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60', width: '60px' }}>Icon</th>
                          <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60' }}>Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60', width: '80px' }}>Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60', width: '100px' }}>Available</th>
                          <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#575F60', width: '100px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupItems.map(item => {
                          const today = new Date().toISOString().split('T')[0];
                          const avail = calcAvailable(item.id, today, today, bookings, items);
                          
                          return (
                            <tr key={item.id} className="border-t cursor-pointer hover:bg-gray-50" style={{ borderColor: '#F3F3F3' }} onClick={() => openDetailModal(item)}>
                              <td className="pl-4 py-2 w-16">
                                <div className="flex h-10 w-10 shadow-sm">
                                  {item.color && (
                                    <div style={{ width: '8px', minWidth: '8px', height: '100%', backgroundColor: item.color }} />
                                  )}
                                  <div className="flex-1 h-full relative overflow-hidden">
                                    {renderListIcon(item)}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm" style={{ color: '#191A23' }}>{item.name}</td>
                              <td className="px-4 py-3 text-sm" style={{ color: '#191A23' }}>{item.totalQuantity}</td>
                              <td className="px-4 py-3"><span className="px-2 py-1 text-xs" style={{ backgroundColor: '#FFED00', color: '#191A23' }}>{avail}</span></td>
                              <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                <button onClick={() => openEditItemModal(item)} className="mr-2" style={{ color: '#575F60' }}><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => deleteItem(item.id)} style={{ color: '#dc2626' }}><Trash2 className="w-4 h-4" /></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeItemModal}>
          <div className="bg-white rounded-2xl p-8 border-2 max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ borderColor: '#191A23' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-medium" style={{ color: '#191A23' }}>{editingItem ? 'Edit Item' : 'New Item'}</h3>
              <button onClick={closeItemModal}><X className="w-6 h-6" style={{ color: '#575F60' }} /></button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Name</label><input type="text" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} className="w-full px-3 py-2 border text-sm" style={{ borderColor: '#575F60' }} /></div>
                <div><label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Quantity</label><input type="number" value={itemForm.qty} onChange={e => setItemForm({...itemForm, qty: e.target.value})} className="w-full px-3 py-2 border text-sm" style={{ borderColor: '#575F60' }} /></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Group</label><select value={itemForm.groupId} onChange={e => setItemForm({...itemForm, groupId: e.target.value})} className="w-full px-3 py-2 border text-sm" style={{ borderColor: '#575F60' }}><option value="">Ungrouped</option>{groups.filter(g => g.id !== '00000000-0000-0000-0000-000000000000').map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}</select></div>
                <div><label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Dimensions</label><input type="text" placeholder="100 x 50 x 30 cm" value={itemForm.dimensions} onChange={e => setItemForm({...itemForm, dimensions: e.target.value})} className="w-full px-3 py-2 border text-sm" style={{ borderColor: '#575F60' }} /></div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Color</label>
                <div className="flex gap-2">
                  {colorOptions.map(opt => {
                    const isSelected = itemForm.color === opt.id;
                    const isOther = opt.id === 'other';
                    const isNone = opt.id === 'none';
                    const isAlu = opt.id === 'alu';
                    const isBlack = opt.id === 'black';

                    let bg = 'transparent';
                    if (isAlu) bg = '#9CA3AF';
                    else if (isBlack) bg = '#191A23';
                    else if (isOther && isSelected) bg = itemForm.customColor;
                    
                    return (
                      <button key={opt.id} type="button" onClick={() => { setItemForm({...itemForm, color: opt.id}); if (isOther) colorPickerRef.current?.click(); }} 
                        className="flex-1 border-2 relative flex items-center justify-center" 
                        style={{ height: '42px', borderColor: isSelected ? '#FFED00' : '#575F60', backgroundColor: bg }}>
                          
                          {isNone && <span className="text-xs font-medium text-gray-500">None</span>}
                          {isAlu && <span className="text-xs font-medium text-black">Alu</span>}
                          {isBlack && <span className="text-xs font-medium text-white">Black</span>}
                          
                          {isOther && (
                             isSelected ? null : (
                               <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} />
                                  <span className="text-xs font-medium text-gray-500">Choose colour</span>
                               </div>
                             )
                          )}
                      </button>
                    );
                  })}
                  <input ref={colorPickerRef} type="color" value={itemForm.customColor} onChange={e => setItemForm({...itemForm, customColor: e.target.value, color: 'other'})} className="hidden" />
                </div>
              </div>

              <div><label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Description</label><textarea rows={3} placeholder="Additional details..." value={itemForm.description} onChange={e => setItemForm({...itemForm, description: e.target.value})} className="w-full px-3 py-2 border text-sm" style={{ borderColor: '#575F60' }} /></div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium" style={{ color: '#575F60' }}>Icon Selection & Images ({itemForm.images.length}/5)</label>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={itemForm.images.length >= 5 || uploadingImage} className="flex items-center gap-2 px-3 py-1.5 border-2 text-xs font-medium" style={{ borderColor: '#575F60', color: '#575F60' }}><Upload className="w-3 h-3" />{uploadingImage ? 'Uploading...' : `Upload ${5 - itemForm.images.length > 0 ? `(${5 - itemForm.images.length} left)` : ''}`}</button>
                </div>
                
                <div className="flex gap-2">
                  <div className="grid grid-cols-5 gap-2 flex-1">
                    {itemForm.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <button type="button" onClick={() => setItemForm({...itemForm, iconIndex: idx})} className="w-full aspect-square border-4 relative group" style={{ borderColor: itemForm.iconIndex === idx ? '#FFED00' : '#575F60' }}><img src={img} alt={`${idx + 1}`} className="w-full h-full object-cover" />{itemForm.iconIndex === idx && (<div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(255, 237, 0, 0.8)', color: '#191A23' }}>ICON</div>)}</button>
                        <button type="button" onClick={() => removeImage(idx)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dc2626', color: 'white' }}><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                  
                  <button type="button" onClick={() => setItemForm({...itemForm, iconIndex: -1})} className="border-4 flex items-center justify-center relative overflow-hidden" style={{ width: 'calc(20% - 8px)', aspectRatio: '1/1', borderColor: itemForm.iconIndex === -1 ? '#FFED00' : '#575F60', backgroundColor: itemForm.color === 'none' ? '#f3f4f6' : (itemForm.color === 'other' ? itemForm.customColor : colorOptions.find(c => c.id === itemForm.color)?.color || '#9CA3AF') }}>
                    {itemForm.color === 'none' ? <Package className="text-gray-400 w-6 h-6" /> : (
                        <div className="text-center"><div className="text-xs font-medium" style={{ color: itemForm.color === 'black' || (itemForm.color === 'other' && itemForm.customColor === '#191A23') ? 'white' : '#191A23' }}>{colorOptions.find(c => c.id === itemForm.color)?.name || 'Color'}</div></div>
                    )}
                    {itemForm.iconIndex === -1 && (<div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(255, 237, 0, 0.8)', color: '#191A23' }}>ICON</div>)}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-6 mt-6 border-t" style={{ borderColor: '#F3F3F3' }}>
              <button onClick={closeItemModal} className="px-6 py-3 text-sm font-medium border-2" style={{ borderColor: '#575F60', color: '#575F60' }}>Cancel</button>
              <button onClick={saveItem} disabled={saving} className="flex-1 px-6 py-3 text-sm font-medium border-2" style={{ backgroundColor: '#FFED00', borderColor: '#191A23', color: '#191A23' }}>{saving ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}</button>
            </div>
          </div>
        </div>
      )}

      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeGroupModal}>
          <div className="bg-white rounded-2xl p-8 max-w-xl w-full border-2" style={{ borderColor: '#191A23' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-medium" style={{ color: '#191A23' }}>{editingGroup ? 'Edit Group' : 'New Group'}</h3>
              <button onClick={closeGroupModal}><X className="w-6 h-6" style={{ color: '#575F60' }} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Group Name</label><input type="text" value={groupForm.name} onChange={e => setGroupForm({...groupForm, name: e.target.value})} className="w-full px-3 py-2 border text-sm" style={{ borderColor: '#575F60' }} /></div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Color</label><input type="color" value={groupForm.color} onChange={e => setGroupForm({...groupForm, color: e.target.value})} className="h-10 border w-full" style={{ borderColor: '#575F60' }} /></div>
              <div className="flex gap-3 pt-4">
                <button onClick={closeGroupModal} className="px-6 py-3 text-sm font-medium border-2" style={{ borderColor: '#575F60', color: '#575F60' }}>Cancel</button>
                <button onClick={saveGroup} disabled={saving} className="flex-1 px-6 py-3 text-sm font-medium border-2" style={{ backgroundColor: '#FFED00', borderColor: '#191A23', color: '#191A23' }}>{saving ? 'Saving...' : editingGroup ? 'Update' : 'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeDetailModal}>
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2" style={{ borderColor: '#191A23' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-medium" style={{ color: '#191A23' }}>{selectedItem.name}</h3>
              <div className="flex gap-2">
                <button onClick={() => { closeDetailModal(); openEditItemModal(selectedItem); }} className="px-4 py-2 border-2 text-sm font-medium" style={{ borderColor: '#575F60', color: '#575F60' }}><Edit2 className="w-4 h-4 inline mr-2" />Edit</button>
                <button onClick={closeDetailModal}><X className="w-6 h-6" style={{ color: '#575F60' }} /></button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Total Quantity</label><p className="text-lg font-medium" style={{ color: '#191A23' }}>{selectedItem.totalQuantity}</p></div>
                <div><label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Available Now</label><span className="inline-block px-4 py-2 text-sm font-medium" style={{ backgroundColor: '#FFED00', color: '#191A23' }}>{calcAvailable(selectedItem.id, new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0], bookings, items)}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Group</label><p className="text-base" style={{ color: '#191A23' }}>{selectedItem.groupId ? groups.find(g => g.id === selectedItem.groupId)?.name || 'Unknown' : 'Ungrouped'}</p></div>
                {selectedItem.dimensions && (<div><label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Dimensions</label><p className="text-base" style={{ color: '#191A23' }}>{selectedItem.dimensions}</p></div>)}
              </div>
              {selectedItem.description && (<div><label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Description</label><p className="text-base whitespace-pre-wrap" style={{ color: '#191A23' }}>{selectedItem.description}</p></div>)}
              
              {selectedItem.images && selectedItem.images.length > 0 ? (
                <div><label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Images</label><div className="flex gap-2"><div className="grid grid-cols-5 gap-2 flex-1">{selectedItem.images.map((img, idx) => (<div key={idx} className="aspect-square border-4 relative cursor-pointer hover:opacity-80" style={{ borderColor: idx === (selectedItem.iconIndex || -1) ? '#FFED00' : '#575F60' }} onClick={() => setFullSizeImage(img)}><img src={img} alt={`${idx + 1}`} className="w-full h-full object-cover" />{idx === (selectedItem.iconIndex || -1) && (<div className="absolute top-1 right-1 px-2 py-1 text-xs font-bold" style={{ backgroundColor: '#FFED00', color: '#191A23' }}>ICON</div>)}</div>))}</div>
                
                <div className="border-2 flex items-center justify-center relative overflow-hidden" style={{ width: 'calc(20% - 8px)', aspectRatio: '1/1', borderColor: (selectedItem.iconIndex || -1) === -1 ? '#FFED00' : '#575F60', backgroundColor: selectedItem.color || '#f3f4f6' }}>
                    {(!selectedItem.color) ? <Package className="text-gray-400 w-6 h-6" /> : (
                        <div className="text-center"><div className="text-xs font-medium" style={{ color: selectedItem.color === '#191A23' ? 'white' : '#191A23' }}>{selectedItem.color === '#9CA3AF' ? 'Alu' : selectedItem.color === '#191A23' ? 'Black' : 'Custom'}</div></div>
                    )}
                    {(selectedItem.iconIndex || -1) === -1 && (<div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(255, 237, 0, 0.8)', color: '#191A23' }}>ICON</div>)}
                </div></div></div>
              ) : (
                 <div><label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Icon</label>
                 <div className="w-20 h-20 border-2 flex items-center justify-center" style={{ borderColor: '#575F60', backgroundColor: selectedItem.color || '#f3f4f6' }}>
                    {(!selectedItem.color) ? <Package className="text-gray-400 w-8 h-8" /> : null}
                 </div>
                 </div>
              )}
            </div>
            <div className="flex gap-3 pt-6 mt-6 border-t" style={{ borderColor: '#F3F3F3' }}><button onClick={closeDetailModal} className="flex-1 px-6 py-3 text-sm font-medium border-2" style={{ borderColor: '#575F60', color: '#575F60' }}>Close</button></div>
          </div>
        </div>
      )}

      {fullSizeImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4" onClick={() => setFullSizeImage(null)}>
          <button onClick={() => setFullSizeImage(null)} className="absolute top-4 right-4"><X className="w-8 h-8" style={{ color: 'white' }} /></button>
          <img src={fullSizeImage} alt="Full size" className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};
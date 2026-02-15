import { useState, useRef, useEffect } from 'react';
import { ChevronRight, X, Edit2, Upload, Calendar, Package } from 'lucide-react';
import { Item, Booking, Group } from '../types';
import { calcAvailable, formatDate } from '../utils/helpers';
import { supabase } from '../utils/supabase';
import { compressImage } from '../utils/imageUtils';

interface OverviewPageProps {
  items: Item[];
  bookings: Booking[];
  groups: Group[];
  refreshData?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ items, bookings, groups, refreshData }) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(groups.map(g => g.id)));
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);
  
  const [itemForm, setItemForm] = useState({ name: '', qty: '', color: 'alu', customColor: '#9CA3AF', groupId: '', dimensions: '', description: '', images: [] as string[], iconIndex: 0 });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  
  // Refs for the hidden date pickers
  const startPickerRef = useRef<HTMLInputElement>(null);
  const endPickerRef = useRef<HTMLInputElement>(null);

  const colorOptions = [
    { id: 'none', name: 'None', color: 'transparent' },
    { id: 'alu', name: 'Alu', color: '#9CA3AF' },
    { id: 'black', name: 'Black', color: '#191A23' },
    { id: 'other', name: 'Other', color: 'custom' }
  ];

  const primaryGroup = groups.find(g => g.name === 'BeMatrix Frames');
  const otherGroups = groups.filter(g => 
    g.name !== 'BeMatrix Frames' && 
    g.id !== '00000000-0000-0000-0000-000000000000'
  ).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const ungroupedGroup = groups.find(g => g.id === '00000000-0000-0000-0000-000000000000');

  const toggleGroup = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    newCollapsed.has(groupId) ? newCollapsed.delete(groupId) : newCollapsed.add(groupId);
    setCollapsedGroups(newCollapsed);
  };

  const getGroupItems = (groupId: string) => {
    if (groupId === '00000000-0000-0000-0000-000000000000') {
      return items.filter(i => !i.groupId);
    }
    return items.filter(i => i.groupId === groupId);
  };

  const openItemModal = (item: Item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedItem(null);
  };

  const openEditModal = (item: Item) => {
    setSelectedItem(item);
    
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
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
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
      
      const available = calcAvailable(itemId, booking.startDate, booking.endDate, bookings.filter(b2 => b2.id !== booking.id), items);
      const newAvailable = newQty - (items.find(i => i.id === itemId)!.totalQuantity - available);
      
      if (newAvailable < bookingItem.quantity) {
        const project = await supabase.from('projects').select('name').eq('id', booking.projectId).single();
        const projectName = project.data?.name || 'Unknown project';
        return !confirm(`Warning: This quantity change will make booking for "${projectName}" (${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}) unavailable. The booking requires ${bookingItem.quantity} but only ${newAvailable} will be available. Continue anyway?`);
      }
    }
    
    return false;
  };

  const saveItem = async () => {
    if (!selectedItem || !refreshData) return;
    if (!itemForm.name || !itemForm.qty) {
      alert('Name and quantity are required');
      return;
    }
    
    if (parseInt(itemForm.qty) !== selectedItem.totalQuantity) {
      const hasConflict = await checkBookingConflicts(selectedItem.id, parseInt(itemForm.qty));
      if (hasConflict) return;
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

      const { error } = await supabase.from('items').update(itemData).eq('id', selectedItem.id);
      if (error) throw error;
      
      await refreshData();
      closeEditModal();
    } catch (error: any) {
      console.error('Database error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const renderCardIcon = (item: Item) => {
    const hasImages = item.images && item.images.length > 0;
    const iconIndex = item.iconIndex !== undefined ? item.iconIndex : -1;
    
    if (iconIndex !== -1 && hasImages) {
      return <img src={item.images![iconIndex]} alt={item.name} className="w-full h-full object-cover" />;
    }
    
    if (item.color) {
      return <div className="w-full h-full" style={{ backgroundColor: item.color }} />;
    }

    return (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center border-l border-gray-100">
            <Package className="w-8 h-8 text-gray-400" />
        </div>
    );
  };

  const renderItemCard = (item: Item) => {
    const s = start || new Date().toISOString().split('T')[0];
    const e = end || s;
    const avail = calcAvailable(item.id, s, e, bookings, items);
    
    return (
      <div key={item.id} className="border flex cursor-pointer hover:shadow-lg transition-shadow" style={{ backgroundColor: 'white', borderColor: '#191A23', height: '88px' }} onClick={() => openItemModal(item)}>
        
        <div style={{ width: '88px', minWidth: '88px', height: '100%', display: 'flex' }}>
            {item.color && (
                <div style={{ width: '16px', height: '100%', backgroundColor: item.color }} />
            )}
            
            <div className="flex-1 h-full overflow-hidden">
                {renderCardIcon(item)}
            </div>
        </div>
        
        <div className="flex-1 p-3 min-w-0 flex flex-col">
          <h3 className="text-sm font-medium mb-auto" style={{ 
            color: '#191A23',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.2em',
            maxHeight: '2.4em'
          }}>{item.name}</h3>
          
          <div className="flex justify-between items-center gap-2 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: '#575F60' }}>Total</span>
              <span className="px-2 py-1 text-xs font-medium" style={{ color: '#191A23', backgroundColor: 'white' }}>
                {item.totalQuantity}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: '#575F60' }}>Available</span>
              <span className="px-2 py-1 text-xs font-medium" style={{ color: '#191A23', backgroundColor: avail < item.totalQuantity * 0.2 ? '#FFE5E5' : '#FFED00' }}>
                {avail}
              </span>
            </div>
          </div>
          
          {start && end && (
            <div className="text-xs pt-1.5 mt-1" style={{ color: '#575F60', borderTop: '1px solid #F3F3F3' }}>
              {formatDate(start)} - {formatDate(end)}
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Hybrid Date Component (DD/MM/YYYY) ---
  const toEuro = (isoDate: string) => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  const DateInputGroup = ({ value, onChange, pickerRef }: { value: string, onChange: (v: string) => void, pickerRef: React.RefObject<HTMLInputElement> }) => {
    const [textVal, setTextVal] = useState(toEuro(value));

    useEffect(() => {
        setTextVal(toEuro(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(/[^0-9]/g, '');
        if (v.length > 8) v = v.slice(0, 8);
        
        let formatted = v;
        if (v.length > 2) formatted = `${v.slice(0, 2)}/${v.slice(2)}`;
        if (v.length > 4) formatted = `${formatted.slice(0, 5)}/${v.slice(4)}`;
        
        setTextVal(formatted);

        if (v.length === 8) {
            const d = v.slice(0, 2);
            const m = v.slice(2, 4);
            const y = v.slice(4, 8);
            onChange(`${y}-${m}-${d}`);
        } else if (v.length === 0) {
            onChange('');
        }
    };

    const triggerPicker = () => {
        if(pickerRef.current && 'showPicker' in HTMLInputElement.prototype) {
            try { pickerRef.current.showPicker(); } catch (e) { pickerRef.current.focus(); }
        }
    }

    return (
      <div className="relative" style={{ flex: 1 }}>
        <input 
            type="text" 
            value={textVal}
            onChange={handleChange}
            placeholder="DD/MM/YYYY" 
            className="w-full px-4 py-2 text-sm border" 
            style={{ backgroundColor: 'white', borderColor: '#575F60', color: '#191A23' }} 
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer" onClick={triggerPicker}>
            <Calendar className="w-4 h-4 text-gray-500 hover:text-black" />
        </div>
        <input 
            type="date" 
            ref={pickerRef}
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none" 
            style={{visibility: 'hidden'}}
        />
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "Raleway, sans-serif" }}>
      <h2 className="text-4xl font-medium mb-6" style={{ color: '#191A23' }}>Live Inventory Overview</h2>
      
      <div className="mb-6 border-2" style={{ backgroundColor: '#191A23', borderColor: '#191A23', maxWidth: '1248px', margin: '0 auto 24px', height: '90px' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 24px', gap: '16px' }}>
          {/* Fixed Width Label */}
          <span className="text-sm font-medium" style={{ color: '#FFED00', flexShrink: 0, minWidth: '150px' }}>Check Availability:</span>
          {/* Hybrid Date Inputs */}
          <DateInputGroup value={start} onChange={setStart} pickerRef={startPickerRef} />
          <DateInputGroup value={end} onChange={setEnd} pickerRef={endPickerRef} />
        </div>
      </div>

      <div style={{ maxWidth: '1248px', margin: '0 auto' }}>
        {primaryGroup && (
          <div className="mb-6">
            <div className="border-2 flex" style={{ backgroundColor: 'white', borderColor: '#191A23' }}>
              <div style={{ 
                width: '32px', 
                minWidth: '32px', 
                flexShrink: 0, 
                backgroundColor: primaryGroup.color || '#FFED00' 
              }} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between p-4 cursor-pointer" style={{ backgroundColor: '#F3F3F3' }} onClick={() => toggleGroup(primaryGroup.id)}>
                  <div className="flex items-center gap-3">
                    <div style={{ transform: collapsedGroups.has(primaryGroup.id) ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }}>
                      <ChevronRight className="w-5 h-5" style={{ color: '#191A23' }} />
                    </div>
                    <span className="text-base font-medium" style={{ color: '#191A23' }}>{primaryGroup.name}</span>
                    <span className="px-3 py-1 text-xs font-medium" style={{ backgroundColor: '#F3F3F3', color: '#575F60' }}>{getGroupItems(primaryGroup.id).length} items</span>
                  </div>
                </div>
                {!collapsedGroups.has(primaryGroup.id) && (
                  <div className="p-4 pt-0 border-t-2" style={{ borderColor: '#F3F3F3' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {getGroupItems(primaryGroup.id).map(item => renderItemCard(item))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {otherGroups.map(group => {
          const groupItems = getGroupItems(group.id);
          if (groupItems.length === 0) return null;
          
          return (
            <div key={group.id} className="border-2 mb-4 flex" style={{ backgroundColor: 'white', borderColor: '#191A23' }}>
              <div style={{ 
                width: '32px', 
                minWidth: '32px', 
                flexShrink: 0, 
                backgroundColor: group.color || '#FFED00' 
              }} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between p-4 cursor-pointer" style={{ backgroundColor: '#F3F3F3' }} onClick={() => toggleGroup(group.id)}>
                  <div className="flex items-center gap-3">
                    <div style={{ transform: collapsedGroups.has(group.id) ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }}>
                      <ChevronRight className="w-5 h-5" style={{ color: '#191A23' }} />
                    </div>
                    <span className="text-base font-medium" style={{ color: '#191A23' }}>{group.name}</span>
                    <span className="px-3 py-1 text-xs font-medium" style={{ backgroundColor: '#F3F3F3', color: '#575F60' }}>{groupItems.length} items</span>
                  </div>
                </div>
                {!collapsedGroups.has(group.id) && (
                  <div className="p-4 pt-0 border-t-2" style={{ borderColor: '#F3F3F3' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {groupItems.map(item => renderItemCard(item))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {ungroupedGroup && getGroupItems(ungroupedGroup.id).length > 0 && (
          <div className="border-2 flex" style={{ backgroundColor: 'white', borderColor: '#191A23' }}>
            <div style={{ 
              width: '32px', 
              minWidth: '32px', 
              flexShrink: 0, 
              backgroundColor: '#9CA3AF' 
            }} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between p-4 cursor-pointer" style={{ backgroundColor: '#F3F3F3' }} onClick={() => toggleGroup(ungroupedGroup.id)}>
                <div className="flex items-center gap-3">
                  <div style={{ transform: collapsedGroups.has(ungroupedGroup.id) ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }}>
                    <ChevronRight className="w-5 h-5" style={{ color: '#191A23' }} />
                  </div>
                  <span className="text-base font-medium" style={{ color: '#191A23' }}>Other Items</span>
                  <span className="px-3 py-1 text-xs" style={{ backgroundColor: '#F3F3F3', color: '#575F60' }}>{getGroupItems(ungroupedGroup.id).length} items</span>
                </div>
              </div>
              {!collapsedGroups.has(ungroupedGroup.id) && (
                <div className="p-4 pt-0 border-t-2" style={{ borderColor: '#F3F3F3' }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {getGroupItems(ungroupedGroup.id).map(item => renderItemCard(item))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeDetailModal}>
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2" style={{ borderColor: '#191A23' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-medium" style={{ color: '#191A23' }}>{selectedItem.name}</h3>
              <div className="flex gap-2">
                {refreshData && <button onClick={() => openEditModal(selectedItem)} className="px-4 py-2 border-2 text-sm font-medium" style={{ borderColor: '#575F60', color: '#575F60' }}><Edit2 className="w-4 h-4 inline mr-2" />Edit</button>}
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
                <div><label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Images</label><div className="flex gap-2"><div className="grid grid-cols-5 gap-2 flex-1">{selectedItem.images.map((img, idx) => (<div key={idx} className="aspect-square border-4 relative cursor-pointer hover:opacity-80" style={{ borderColor: idx === (selectedItem.iconIndex || -1) ? '#FFED00' : '#575F60' }} onClick={() => setFullSizeImage(img)}><img src={img} alt={`${idx + 1}`} className="w-full h-full object-cover" />{idx === (selectedItem.iconIndex || -1) && (<div className="absolute top-1 right-1 px-2 py-1 text-xs font-bold" style={{ backgroundColor: '#FFED00', color: '#191A23' }}>ICON</div>)}</div>))}</div><div className="border-2 flex items-center justify-center relative overflow-hidden" style={{ width: 'calc(20% - 8px)', aspectRatio: '1/1', borderColor: (selectedItem.iconIndex || -1) === -1 ? '#FFED00' : '#575F60', backgroundColor: selectedItem.color || '#f3f4f6' }}>{(!selectedItem.color) ? <Package className="text-gray-400 w-6 h-6" /> : (<div className="text-center"><div className="text-xs font-medium" style={{ color: selectedItem.color === '#191A23' ? 'white' : '#191A23' }}>{selectedItem.color === '#9CA3AF' ? 'Alu' : selectedItem.color === '#191A23' ? 'Black' : 'Custom'}</div></div>)}{(selectedItem.iconIndex || -1) === -1 && (<div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(255, 237, 0, 0.8)', color: '#191A23' }}>ICON</div>)}</div></div></div>
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

      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeEditModal}>
          <div className="bg-white rounded-2xl p-8 border-2 max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ borderColor: '#191A23' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-medium" style={{ color: '#191A23' }}>Edit Item</h3>
              <button onClick={closeEditModal}><X className="w-6 h-6" style={{ color: '#575F60' }} /></button>
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
                  {colorOptions.map(opt => (
                    <button key={opt.id} type="button" onClick={() => { setItemForm({...itemForm, color: opt.id}); if (opt.id === 'other') colorPickerRef.current?.click(); }} className="flex-1 border-2 relative" style={{ height: '42px', borderColor: itemForm.color === opt.id ? '#FFED00' : '#575F60', backgroundColor: opt.color === 'custom' ? itemForm.customColor : opt.color }}>
                        {opt.id === 'none' && <span className="text-xs font-medium text-gray-500">None</span>}
                    </button>
                  ))}
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
                  
                  {/* Edit Modal Icon Preview (with Package Placeholder logic) */}
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
              <button onClick={closeEditModal} className="px-6 py-3 text-sm font-medium border-2" style={{ borderColor: '#575F60', color: '#575F60' }}>Cancel</button>
              <button onClick={saveItem} disabled={saving} className="flex-1 px-6 py-3 text-sm font-medium border-2" style={{ backgroundColor: '#FFED00', borderColor: '#191A23', color: '#191A23' }}>{saving ? 'Update Item' : 'Update Item'}</button>
            </div>
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
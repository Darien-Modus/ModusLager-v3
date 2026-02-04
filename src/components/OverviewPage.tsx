import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Item, Booking, Group } from '../types';
import { calcAvailable, formatDate } from '../utils/helpers';
import { ItemIcon } from './ItemIcon';

interface OverviewPageProps {
  items: Item[];
  bookings: Booking[];
  groups: Group[];
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ items, bookings, groups }) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Find BeMatrix Frames group (primary)
  const primaryGroup = groups.find(g => g.name === 'BeMatrix Frames');
  const otherGroups = groups.filter(g => 
    g.name !== 'BeMatrix Frames' && 
    g.id !== '00000000-0000-0000-0000-000000000000'
  );
  
  // Get ungrouped if it exists
  const ungroupedGroup = groups.find(g => g.id === '00000000-0000-0000-0000-000000000000');

  const toggleGroup = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  const getGroupItems = (groupId: string) => {
    if (groupId === '00000000-0000-0000-0000-000000000000') {
      return items.filter(i => !i.groupId);
    }
    return items.filter(i => i.groupId === groupId);
  };

  const renderItemCard = (item: Item) => {
    const s = start || new Date().toISOString().split('T')[0];
    const e = end || s;
    const avail = calcAvailable(item.id, s, e, bookings, items);
    const pct = (avail / item.totalQuantity) * 100;
    
    return (
      <div key={item.id} className="border rounded p-4" style={{ backgroundColor: 'white', borderColor: '#575F60' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold" style={{ color: '#1F1F1F' }}>{item.name}</h3>
          <ItemIcon item={item} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span style={{ color: '#575F60' }}>Total:</span>
            <span className="font-medium" style={{ color: '#1F1F1F' }}>{item.totalQuantity}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: '#575F60' }}>Available:</span>
            <span 
              className="font-medium"
              style={{ color: avail < item.totalQuantity * 0.2 ? '#dc2626' : '#16a34a' }}
            >
              {avail}
            </span>
          </div>
          {start && end && (
            <div className="text-xs" style={{ color: '#575F60' }}>
              {formatDate(start)} - {formatDate(end)}
            </div>
          )}
          <div className="w-full rounded-full h-2" style={{ backgroundColor: '#e5e7eb' }}>
            <div 
              className="h-2 rounded-full"
              style={{ 
                width: `${pct}%`,
                backgroundColor: pct > 50 ? '#16a34a' : pct > 20 ? '#eab308' : '#dc2626'
              }} 
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: 'Raleway, sans-serif' }}>
      <h2 className="text-xl font-bold mb-4" style={{ color: '#1F1F1F' }}>Live Inventory Overview</h2>
      
      {/* Date Range Selector */}
      <div className="p-4 border rounded mb-4" style={{ backgroundColor: 'white', borderColor: '#575F60' }}>
        <h3 className="text-base font-semibold mb-3" style={{ color: '#1F1F1F' }}>Availability Checker</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#575F60' }}>Start Date</label>
            <input 
              type="date" 
              value={start} 
              onChange={e => setStart(e.target.value)} 
              className="w-full px-3 py-1.5 border rounded text-sm"
              style={{ borderColor: '#575F60' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#575F60' }}>End Date</label>
            <input 
              type="date" 
              value={end} 
              onChange={e => setEnd(e.target.value)} 
              className="w-full px-3 py-1.5 border rounded text-sm"
              style={{ borderColor: '#575F60' }}
            />
          </div>
        </div>
      </div>

      {/* Primary Group - BeMatrix Frames - Always Expanded */}
      {primaryGroup && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3 p-2 border-b" style={{ borderColor: '#575F60' }}>
            <h3 className="text-base font-semibold" style={{ color: '#1F1F1F' }}>
              {primaryGroup.name} ({getGroupItems(primaryGroup.id).length})
            </h3>
            <span className="text-xs px-2 py-0.5 rounded border" style={{ backgroundColor: '#FFED00', borderColor: '#1F1F1F', color: '#1F1F1F' }}>
              Primary
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {getGroupItems(primaryGroup.id).map(item => renderItemCard(item))}
          </div>
        </div>
      )}

      {/* Other Groups - Collapsible */}
      {otherGroups.length > 0 && (
        <div className="space-y-2 mb-4">
          {otherGroups.map(group => {
            const isCollapsed = collapsedGroups.has(group.id);
            const groupItems = getGroupItems(group.id);
            
            if (groupItems.length === 0) return null;
            
            return (
              <div key={group.id} className="border rounded" style={{ borderColor: '#575F60', backgroundColor: 'white' }}>
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-opacity-80"
                  onClick={() => toggleGroup(group.id)}
                  style={{ backgroundColor: '#F5F5F5' }}
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" style={{ color: '#575F60' }} />
                    ) : (
                      <ChevronDown className="w-4 h-4" style={{ color: '#575F60' }} />
                    )}
                    <span className="text-sm font-medium" style={{ color: '#1F1F1F' }}>
                      {group.name} ({groupItems.length})
                    </span>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="p-3 border-t" style={{ borderColor: '#575F60' }}>
                    <div className="grid grid-cols-3 gap-4">
                      {groupItems.map(item => renderItemCard(item))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ungrouped Items - Collapsible */}
      {ungroupedGroup && getGroupItems(ungroupedGroup.id).length > 0 && (
        <div className="border rounded" style={{ borderColor: '#575F60', backgroundColor: 'white' }}>
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-opacity-80"
            onClick={() => toggleGroup(ungroupedGroup.id)}
            style={{ backgroundColor: '#F5F5F5' }}
          >
            <div className="flex items-center gap-2">
              {collapsedGroups.has(ungroupedGroup.id) ? (
                <ChevronRight className="w-4 h-4" style={{ color: '#575F60' }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: '#575F60' }} />
              )}
              <span className="text-sm font-medium" style={{ color: '#1F1F1F' }}>
                {ungroupedGroup.name} ({getGroupItems(ungroupedGroup.id).length})
              </span>
            </div>
          </div>

          {!collapsedGroups.has(ungroupedGroup.id) && (
            <div className="p-3 border-t" style={{ borderColor: '#575F60' }}>
              <div className="grid grid-cols-3 gap-4">
                {getGroupItems(ungroupedGroup.id).map(item => renderItemCard(item))}
              </div>
            </div>
          )}
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-8" style={{ color: '#575F60' }}>
          <p className="text-sm">No items in inventory</p>
        </div>
      )}
    </div>
  );
};

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

  const primaryGroup = groups.find(g => g.name === 'BeMatrix Frames');
  const otherGroups = groups.filter(g => 
    g.name !== 'BeMatrix Frames' && 
    g.id !== '00000000-0000-0000-0000-000000000000'
  );
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
    
    const isRainbow = item.color && !item.color.startsWith('#');
    const colorName = item.color === '#9CA3AF' ? 'Alu' : item.color === '#191A23' ? 'Black' : 'Other';
    
    return (
      <div 
        key={item.id} 
        className="border flex"
        style={{ 
          backgroundColor: 'white',
          borderColor: '#191A23'
        }}
      >
        {/* Color strip on left */}
        <div 
          className="w-8 flex-shrink-0"
          style={{ 
            ...(isRainbow 
              ? { background: 'linear-gradient(180deg, red, orange, yellow, green, blue, indigo, violet)' }
              : { backgroundColor: item.color || '#9CA3AF' }
            )
          }}
          title={colorName}
        />
        
        {/* Content */}
        <div className="flex-1 p-4">
          <h3 className="text-sm font-medium mb-3" style={{ color: '#191A23' }}>
            {item.name}
          </h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: '#575F60' }}>Total</span>
              <span className="font-medium" style={{ color: '#191A23' }}>
                {item.totalQuantity}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: '#575F60' }}>Available</span>
              <span 
                className="font-medium px-2 py-1 text-xs"
                style={{ 
                  color: '#191A23',
                  backgroundColor: avail < item.totalQuantity * 0.2 ? '#FFE5E5' : '#FFED00'
                }}
              >
                {avail}
              </span>
            </div>
            
            {start && end && (
              <div className="text-xs pt-2" style={{ color: '#575F60', borderTop: '1px solid #F3F3F3' }}>
                {formatDate(start)} - {formatDate(end)}
              </div>
            )}
            
            <div className="pt-2">
              <div className="w-full h-2" style={{ backgroundColor: '#F3F3F3' }}>
                <div 
                  className="h-2 transition-all duration-300"
                  style={{ 
                    width: `${pct}%`,
                    backgroundColor: pct > 50 ? '#16a34a' : pct > 20 ? '#FFED00' : '#dc2626'
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "Raleway, sans-serif" }}>
      <div className="mb-6">
        <h1 className="text-4xl font-medium" style={{ color: '#191A23' }}>
          Live Inventory Overview
        </h1>
      </div>
      
      <div 
        className="p-6 mb-6 border"
        style={{ 
          backgroundColor: '#191A23',
          borderColor: '#191A23'
        }}
      >
        <h2 className="text-xl font-medium mb-4" style={{ color: '#FFED00' }}>
          Check Availability
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
              Start Date
            </label>
            <input 
              type="date" 
              value={start} 
              onChange={e => setStart(e.target.value)} 
              className="w-full px-4 py-2 text-sm border focus:outline-none"
              style={{ 
                backgroundColor: 'white',
                borderColor: '#575F60',
                color: '#191A23'
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
              End Date
            </label>
            <input 
              type="date" 
              value={end} 
              onChange={e => setEnd(e.target.value)} 
              className="w-full px-4 py-2 text-sm border focus:outline-none"
              style={{ 
                backgroundColor: 'white',
                borderColor: '#575F60',
                color: '#191A23'
              }}
            />
          </div>
        </div>
      </div>

      {primaryGroup && (
        <div className="mb-6">
          <div 
            className="border"
            style={{ 
              backgroundColor: 'white',
              borderColor: '#191A23'
            }}
          >
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              style={{ backgroundColor: '#F3F3F3' }}
              onClick={() => toggleGroup(primaryGroup.id)}
            >
              <div className="flex items-center gap-3">
                <div className="transition-transform duration-200" style={{ transform: collapsedGroups.has(primaryGroup.id) ? 'rotate(0deg)' : 'rotate(90deg)' }}>
                  <ChevronRight className="w-5 h-5" style={{ color: '#191A23' }} />
                </div>
                <h2 className="text-xl font-medium" style={{ color: '#191A23' }}>
                  {primaryGroup.name}
                </h2>
                <span 
                  className="px-3 py-1 text-xs font-medium"
                  style={{ 
                    backgroundColor: '#F3F3F3',
                    color: '#575F60'
                  }}
                >
                  {getGroupItems(primaryGroup.id).length} items
                </span>
              </div>
            </div>

            {!collapsedGroups.has(primaryGroup.id) && (
              <div className="p-4 pt-0 border-t" style={{ borderColor: '#F3F3F3' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {getGroupItems(primaryGroup.id).map(item => renderItemCard(item))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {otherGroups.length > 0 && (
        <div className="space-y-4 mb-6">
          {otherGroups.map(group => {
            const isCollapsed = collapsedGroups.has(group.id);
            const groupItems = getGroupItems(group.id);
            
            if (groupItems.length === 0) return null;
            
            return (
              <div 
                key={group.id} 
                className="border"
                style={{ 
                  backgroundColor: 'white',
                  borderColor: '#191A23'
                }}
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  style={{ backgroundColor: '#F3F3F3' }}
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="transition-transform duration-200" style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}>
                      <ChevronRight className="w-5 h-5" style={{ color: '#191A23' }} />
                    </div>
                    <h3 className="text-xl font-medium" style={{ color: '#191A23' }}>
                      {group.name}
                    </h3>
                    <span 
                      className="px-3 py-1 text-xs"
                      style={{ 
                        backgroundColor: '#F3F3F3',
                        color: '#575F60'
                      }}
                    >
                      {groupItems.length} items
                    </span>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="p-4 pt-0 border-t" style={{ borderColor: '#F3F3F3' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {groupItems.map(item => renderItemCard(item))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {ungroupedGroup && getGroupItems(ungroupedGroup.id).length > 0 && (
        <div 
          className="border"
          style={{ 
            backgroundColor: 'white',
            borderColor: '#191A23'
          }}
        >
          <div
            className="flex items-center justify-between p-4 cursor-pointer"
            style={{ backgroundColor: '#F3F3F3' }}
            onClick={() => toggleGroup(ungroupedGroup.id)}
          >
            <div className="flex items-center gap-3">
              <div className="transition-transform duration-200" style={{ transform: collapsedGroups.has(ungroupedGroup.id) ? 'rotate(0deg)' : 'rotate(90deg)' }}>
                <ChevronRight className="w-5 h-5" style={{ color: '#191A23' }} />
              </div>
              <h3 className="text-xl font-medium" style={{ color: '#191A23' }}>
                Other Items
              </h3>
              <span 
                className="px-3 py-1 text-xs"
                style={{ 
                  backgroundColor: '#F3F3F3',
                  color: '#575F60'
                }}
              >
                {getGroupItems(ungroupedGroup.id).length} items
              </span>
            </div>
          </div>

          {!collapsedGroups.has(ungroupedGroup.id) && (
            <div className="p-4 pt-0 border-t" style={{ borderColor: '#F3F3F3' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {getGroupItems(ungroupedGroup.id).map(item => renderItemCard(item))}
              </div>
            </div>
          )}
        </div>
      )}

      {items.length === 0 && (
        <div 
          className="text-center py-16 border"
          style={{ 
            backgroundColor: 'white',
            borderColor: '#575F60',
            borderStyle: 'dashed'
          }}
        >
          <p className="text-lg" style={{ color: '#575F60' }}>
            No items in inventory yet
          </p>
        </div>
      )}
    </div>
  );
};

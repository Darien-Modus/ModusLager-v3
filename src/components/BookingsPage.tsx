import React, { useState } from 'react';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import { Booking, BookingItem, Item, Project } from '../types';
import { calcAvailable, formatDate } from '../utils/helpers';
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
        const { error } = await supabase
          .from('bookings')
          .update({
            project_id: pid,
            start_date: start,
            end_date: end
          })
          .eq('id', edit);

        if (error) throw error;

        // Delete existing booking items
        await supabase
          .from('booking_items')
          .delete()
          .eq('booking_id', edit);

        // Insert new booking items
        const bookingItems = bis.map(bi => ({
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
        const { data, error } = await supabase
          .from('bookings')
          .insert([
            {
              project_id: pid,
              start_date: start,
              end_date: end
            }
          ])
          .select();

        if (error) throw error;
        if (!data || data.length === 0) throw new Error('No data returned');

        const newBookingId = data[0].id;

        // Insert booking items
        const bookingItems = bis.map(bi => ({
          booking_id: newBookingId,
          item_id: bi.itemId,
          quantity: bi.quantity
        }));

        const { error: itemsError } = await supabase
          .from('booking_items')
          .insert(bookingItems);

        if (itemsError) throw itemsError;
      }

      // Refresh data
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
      setErr('Error saving booking');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await refreshData();
      } catch (error) {
        console.error('Error deleting booking:', error);
        setErr('Error deleting booking');
      }
    }
  };

  const handleEdit = (booking: Booking) => {
    setPid(booking.project_id);
    setStart(booking.start_date);
    setEnd(booking.end_date);
    
    // You'll need to populate bis with booking items
    // This is a simplified version - you'll need to implement properly
    setBis([{ itemId: '', quantity: 0 }]);
    setEdit(booking.id);
  };

  const addItem = () => {
    setBis([...bis, { itemId: '', quantity: 0 }]);
  };

  const removeItem = (index: number) => {
    const newBis = [...bis];
    newBis.splice(index, 1);
    setBis(newBis);
  };

  const updateItem = (index: number, field: keyof BookingItem, value: string) => {
    const newBis = [...bis];
    newBis[index] = { ...newBis[index], [field]: value };
    setBis(newBis);
  };

  // Find item name by ID
  const getItemName = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return item ? item.name : '';
  };

  // Find project name by ID
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : '';
  };

  return (
    <div className="bookings-page">
      <h2>Bookings</h2>
      
      {/* Booking Form */}
      <div className="booking-form">
        <h3>{edit ? 'Edit Booking' : 'New Booking'}</h3>
        
        {err && <div className="error">{err}</div>}
        
        <div className="form-group">
          <label>Project:</label>
          <select 
            value={pid} 
            onChange={(e) => setPid(e.target.value)}
            required
          >
            <option value="">Select a project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Start Date:</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>End Date:</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>
        </div>
        
        <h4>Booking Items</h4>
        {bis.map((item, index) => (
          <div key={index} className="booking-item-row">
            <div className="form-group">
              <label>Item:</label>
              <select
                value={item.itemId}
                onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                required
              >
                <option value="">Select an item</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Quantity:</label>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                min="1"
                required
              />
            </div>
            
            {bis.length > 1 && (
              <button 
                type="button" 
                onClick={() => removeItem(index)}
                className="remove-item-btn"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        
        <button 
          type="button" 
          onClick={addItem}
          className="add-item-btn"
        >
          <Plus size={16} /> Add Item
        </button>
        
        <div className="form-actions">
          <button 
            type="button" 
            onClick={save}
            disabled={saving}
            className="save-btn"
          >
            {saving ? 'Saving...' : edit ? 'Update Booking' : 'Create Booking'}
          </button>
          
          {edit && (
            <button 
              type="button" 
              onClick={() => {
                setEdit(null);
                setBis([{ itemId: '', quantity: 0 }]);
                setPid('');
                setStart('');
                setEnd('');
              }}
              className="cancel-btn"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      
      {/* Booking List */}
      <div className="booking-list">
        <h3>Existing Bookings</h3>
        {bookings.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          <div className="bookings-grid">
            {bookings.map(booking => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <h4>{getProjectName(booking.project_id)}</h4>
                  <div className="booking-actions">
                    <button 
                      onClick={() => handleEdit(booking)}
                      className="edit-btn"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(booking.id)}
                      className="delete-btn"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="booking-details">
                  <p><strong>Start:</strong> {formatDate(booking.start_date)}</p>
                  <p><strong>End:</strong> {formatDate(booking.end_date)}</p>
                  
                  <div className="booking-items">
                    <h5>Items:</h5>
                    {booking.items && booking.items.map((item, idx) => (
                      <p key={idx}>
                        {getItemName(item.item_id)}: {item.quantity}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;

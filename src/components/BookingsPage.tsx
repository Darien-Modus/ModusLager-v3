import React, { useState } from 'react';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface Booking {
  id: string;
  project_id: string;
  start_date: string;
  end_date: string;
  items?: any[];
}

interface Item {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface BookingItem {
  id: string;
  booking_id: string;
  item_id: string;
  quantity: number;
}

interface BookingsPageProps {
  bookings: Booking[];
  items: Item[];
  projects: Project[];
  refreshData: () => void;
}

export const BookingsPage: React.FC<BookingsPageProps> = ({ bookings, items, projects, refreshData }) => {
  const [bis, setBis] = useState<BookingItem[]>([{ item_id: '', quantity: 0 }]);
  const [pid, setPid] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [edit, setEdit] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const saveBooking = async () => {
    if (!pid || !start || !end) {
      setErr('Please fill all required fields');
      return;
    }

    setSaving(true);
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
      } else {
        // Create new booking
        const { error } = await supabase
          .from('bookings')
          .insert({
            project_id: pid,
            start_date: start,
            end_date: end
          });

        if (error) throw error;
      }

      await refreshData();
      setBis([{ item_id: '', quantity: 0 }]);
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
    setEdit(booking.id);
  };

  const addItem = () => {
    setBis([...bis, { item_id: '', quantity: 0 }]);
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
        
        <div className="form-group">
          <label>Items:</label>
          {bis.map((item, index) => (
            <div key={index} className="item-row">
              <select
                value={item.item_id}
                onChange={(e) => updateItem(index, 'item_id', e.target.value)}
                required
              >
                <option value="">Select Item</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                placeholder="Quantity"
                min="1"
                required
              />
              {bis.length > 1 && (
                <button
                  type="button"
                  className="remove-item-btn"
                  onClick={() => removeItem(index)}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="add-item-btn"
            onClick={addItem}
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
        
        <button
          type="button"
          className="save-btn"
          onClick={saveBooking}
          disabled={saving}
        >
          {saving ? 'Saving...' : edit ? 'Update Booking' : 'Create Booking'}
        </button>
        
        {edit && (
          <button
            type="button"
            className="cancel-btn"
            onClick={() => {
              setEdit(null);
              setPid('');
              setStart('');
              setEnd('');
              setBis([{ item_id: '', quantity: 0 }]);
            }}
          >
            Cancel
          </button>
        )}
      </div>
      
      {/* Booking List */}
      <div className="booking-list">
        <h3>Bookings</h3>
        {bookings.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          bookings.map(booking => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <h4>{getProjectName(booking.project_id)}</h4>
                <div className="booking-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(booking)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(booking.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="booking-details">
                <p><strong>Start Date:</strong> {booking.start_date}</p>
                <p><strong>End Date:</strong> {booking.end_date}</p>
                {booking.items && booking.items.length > 0 && (
                  <div className="booking-items">
                    <p><strong>Items:</strong></p>
                    {booking.items.map((item, index) => (
                      <p key={index}>
                        {getItemName(item.item_id)}: {item.quantity}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BookingsPage;

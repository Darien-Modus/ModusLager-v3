import React, { useState } from 'react';

interface Booking {
  id: string;
  project_id: string;
  item_id: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface Item {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface BookingsPageProps {
  bookings: Booking[];
  items: Item[];
  projects: Project[];
  refreshData: () => Promise<void>;
}

const BookingsPage: React.FC<BookingsPageProps> = ({ 
  bookings, 
  items, 
  projects, 
  refreshData 
}) => {
  const [formData, setFormData] = useState({
    project_id: '',
    item_id: '',
    start_date: '',
    end_date: '',
    status: 'pending'
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    project_id: '',
    item_id: '',
    start_date: '',
    end_date: '',
    status: 'pending'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([formData]);
      
      if (error) throw error;
      
      await refreshData();
      setFormData({
        project_id: '',
        item_id: '',
        start_date: '',
        end_date: '',
        status: 'pending'
      });
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const handleEdit = (booking: Booking) => {
    setEditingId(booking.id);
    setEditForm({
      project_id: booking.project_id,
      item_id: booking.item_id,
      start_date: booking.start_date,
      end_date: booking.end_date,
      status: booking.status
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(editForm)
        .eq('id', editingId);
      
      if (error) throw error;
      
      await refreshData();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await refreshData();
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  return (
    <div className="bookings-page">
      <h2>Booking Management</h2>
      
      {/* Booking Form */}
      <div className="booking-form">
        <h3>Create New Booking</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project:</label>
            <select 
              name="project_id" 
              value={formData.project_id} 
              onChange={handleInputChange}
              required
            >
              <option value="">Select Project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Item:</label>
            <select 
              name="item_id" 
              value={formData.item_id} 
              onChange={handleInputChange}
              required
            >
              <option value="">Select Item</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Start Date:</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>End Date:</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Status:</label>
            <select 
              name="status" 
              value={formData.status} 
              onChange={handleInputChange}
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <button type="submit" className="save-btn">Create Booking</button>
        </form>
      </div>

      {/* Bookings List */}
      <div className="booking-list">
        <h3>Bookings</h3>
        {bookings.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          <div className="bookings-grid">
            {bookings.map(booking => {
              const project = projects.find(p => p.id === booking.project_id);
              const item = items.find(i => i.id === booking.item_id);
              
              return (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <h4>{project?.name || 'Unknown Project'}</h4>
                    <div className="booking-actions">
                      <button 
                        onClick={() => handleEdit(booking)}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(booking.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="booking-details">
                    <p><strong>Item:</strong> {item?.name || 'Unknown Item'}</p>
                    <p><strong>Start Date:</strong> {booking.start_date}</p>
                    <p><strong>End Date:</strong> {booking.end_date}</p>
                    <p><strong>Status:</strong> {booking.status}</p>
                  </div>
                  
                  {editingId === booking.id && (
                    <div className="edit-form">
                      <h4>Edit Booking</h4>
                      <div className="form-group">
                        <label>Project:</label>
                        <select 
                          name="project_id" 
                          value={editForm.project_id} 
                          onChange={handleEditInputChange}
                        >
                          {projects.map(project => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Item:</label>
                        <select 
                          name="item_id" 
                          value={editForm.item_id} 
                          onChange={handleEditInputChange}
                        >
                          {items.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>Start Date:</label>
                          <input
                            type="date"
                            name="start_date"
                            value={editForm.start_date}
                            onChange={handleEditInputChange}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>End Date:</label>
                          <input
                            type="date"
                            name="end_date"
                            value={editForm.end_date}
                            onChange={handleEditInputChange}
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Status:</label>
                        <select 
                          name="status" 
                          value={editForm.status} 
                          onChange={handleEditInputChange}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      
                      <button onClick={handleUpdate} className="save-btn">Update</button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;

import React, { useState } from 'react';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import { Booking, BookingItem, Item, Project } from '../types';
import { calcAvailable, formatDate } from '../utils/helpers';
import { ItemIcon } from './ItemIcon';
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
          .insert([{
            project_id: pid,
            start_date: start,
            end_date: end
          }])
          .select();

        if (error) throw error;

        const bookingId = data[0].id;

        // Insert booking items
        const bookingItems = bis.map(bi => ({
          booking_id: bookingId,
          item_id: bi.itemId,
          quantity: bi.quantity
        }));

        const { error: itemsError } = await supabase
          .from('booking_items')
          .insert(bookingItems);

        if (itemsError) throw itemsError;
      }

      // Reset form and refresh data
      setBis([{ itemId: '', quantity: 0 }]);
      setPid('');
      setStart('');
      setEnd('');
      setEdit(null); // Added this line
      refreshData();
      
    } catch (error) {
      console.error('Error saving booking:', error);
      setErr('Failed to save booking. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        // Delete booking items first
        await supabase
          .from('booking_items')
          .delete()
          .eq('booking_id', id);

        // Delete booking
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', id);

        if (error) throw error;

        refreshData();
      } catch (error) {
        console.error('Error deleting booking:', error);
        setErr('Failed to delete booking. Please try again.');
      }
    }
  };

  const handleEdit = (booking: Booking) => {
    // Populate form with booking data
    setPid(booking.project_id);
    setStart(booking.start_date);
    setEnd(booking.end_date);
    
    // Get booking items
    const bookingItems = bookings
      .filter(b => b.id === booking.id)
      .flatMap(b => b.items || []);
    
    setBis(bookingItems.map(item => ({
      itemId: item.item_id,
      quantity: item.quantity
    })));
    
    setEdit(booking.id);
  };

  const addItem = () => {
    setBis([...bis, { itemId: '', quantity: 0 }]);
  };

  const removeItem = (index: number) => {
    if (bis.length > 1) {
      const newBis = [...bis];
      newBis.splice(index, 1);
      setBis(newBis);
    }
  };

  const updateItem = (index: number, field: keyof BookingItem, value: string | number) => {
    const newBis = [...bis];
    newBis[index] = { ...newBis[index], [field]: value };
    setBis(newBis);
  };

  // Rest of your JSX content would go here
  // (I'm showing the structure but not the full JSX since it wasn't in your original code)

  return (
    <div>
      {/* Your existing JSX content would go here */}
      <h2>Bookings</h2>
      {/* Form and booking list would be here */}
    </div>
  );
};

export default BookingsPage; // Fixed: was exporting BookingForm, now correctly exports BookingsPage

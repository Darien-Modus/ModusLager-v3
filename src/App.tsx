import React, { useState, useEffect } from 'react';
import BookingsPage from './components/BookingsPage';
import { supabase } from './utils/supabase';

// Define types inline since we don't have a separate types.ts file
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

function App() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    try {
      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*');
      
      if (bookingsError) throw bookingsError;
      
      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*');
      
      if (itemsError) throw itemsError;
      
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');
      
      if (projectsError) throw projectsError;
      
      setBookings(bookingsData || []);
      setItems(itemsData || []);
      setProjects(projectsData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  if (loading) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Booking System</h1>
        </header>
        <main>
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Booking System</h1>
      </header>
      <main>
        <BookingsPage 
          bookings={bookings} 
          items={items} 
          projects={projects} 
          refreshData={refreshData} 
        />
      </main>
    </div>
  );
}

export default App;

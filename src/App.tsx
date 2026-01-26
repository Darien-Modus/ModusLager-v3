import { useState, useEffect } from 'react';
import { Calendar, Package, BookOpen, BarChart3, LogOut } from 'lucide-react';
import { Item, Project, Booking } from './types';
import { supabase } from './utils/supabase';
import { ItemsPage } from './components/ItemsPage';
import { ProjectsPage } from './components/ProjectsPage';
import { BookingsPage } from './components/BookingsPage';
import { OverviewPage } from './components/OverviewPage';
import { CalendarPage } from './components/CalendarPage';

export default function App() {
  const [page, setPage] = useState<'items' | 'projects' | 'bookings' | 'overview' | 'calendar'>('overview');
  const [items, setItems] = useState<Item[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [auth, setAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch all data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (itemsError) throw itemsError;
      
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (projectsError) throw projectsError;
      
      // Fetch bookings with booking_items
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_items (
            item_id,
            quantity
          )
        `)
        .order('created_at', { ascending: true });
      
      if (bookingsError) throw bookingsError;
      
      // Transform data to match app format
      const transformedItems: Item[] = itemsData?.map(item => ({
        id: item.id,
        name: item.name,
        totalQuantity: item.total_quantity,
        color: item.color
      })) || [];
      
      const transformedProjects: Project[] = projectsData?.map(project => ({
        id: project.id,
        name: project.name,
        number: project.number,
        client: project.client
      })) || [];
      
      const transformedBookings: Booking[] = bookingsData?.map(booking => ({
        id: booking.id,
        items: booking.booking_items.map((bi: any) => ({
          itemId: bi.item_id,
          quantity: bi.quantity
        })),
        projectId: booking.project_id,
        startDate: booking.start_date,
        endDate: booking.end_date
      })) || [];
      
      setItems(transformedItems);
      setProjects(transformedProjects);
      setBookings(transformedBookings);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data from database. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth) {
      fetchData();
    }
  }, [auth]);

  if (!auth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <Package className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-center mb-6">Inventory Booking</h1>
          <button onClick={() => setAuth(true)} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Login</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Inventory Booking</h1>
          <div className="flex gap-4">
            <button onClick={() => setPage('overview')} className={`px-4 py-2 rounded ${page === 'overview' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}><BarChart3 className="w-5 h-5" /></button>
            <button onClick={() => setPage('items')} className={`px-4 py-2 rounded ${page === 'items' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}><Package className="w-5 h-5" /></button>
            <button onClick={() => setPage('projects')} className={`px-4 py-2 rounded ${page === 'projects' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}><BookOpen className="w-5 h-5" /></button>
            <button onClick={() => setPage('bookings')} className={`px-4 py-2 rounded ${page === 'bookings' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>Bookings</button>
            <button onClick={() => setPage('calendar')} className={`px-4 py-2 rounded ${page === 'calendar' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}><Calendar className="w-5 h-5" /></button>
            <button onClick={() => setAuth(false)} className="hover:text-red-600"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {page === 'items' && <ItemsPage items={items} setItems={setItems} bookings={bookings} refreshData={fetchData} />}
        {page === 'projects' && <ProjectsPage projects={projects} setProjects={setProjects} refreshData={fetchData} />}
        {page === 'bookings' && <BookingsPage bookings={bookings} setBookings={setBookings} items={items} projects={projects} refreshData={fetchData} />}
        {page === 'overview' && <OverviewPage items={items} bookings={bookings} />}
        {page === 'calendar' && <CalendarPage bookings={bookings} items={items} projects={projects} />}
      </main>
    </div>
  );
}
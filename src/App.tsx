import { useState, useEffect } from 'react';
import { Calendar, Package, BookOpen, BarChart3, LogOut } from 'lucide-react';
import { Item, Project, Booking, Group } from './types';
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [auth, setAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (groupsError) throw groupsError;
      
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
      
      // Transform groups
      const transformedGroups: Group[] = groupsData?.map(group => ({
        id: group.id,
        name: group.name,
        color: group.color,
        sortOrder: group.sort_order
      })) || [];
      
      // Transform items
      const transformedItems: Item[] = itemsData?.map(item => ({
        id: item.id,
        name: item.name,
        totalQuantity: item.total_quantity,
        color: item.color,
        image: item.image,
        groupId: item.group_id
      })) || [];
      
      // Transform projects
      const transformedProjects: Project[] = projectsData?.map(project => ({
        id: project.id,
        name: project.name,
        number: project.number,
        client: project.client
      })) || [];
      
      // Transform bookings
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
      
      setGroups(transformedGroups);
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
        <div className="bg-white p-6 w-full max-w-md">
          <Package className="w-12 h-12 mx-auto mb-4" style={{ color: '#1F1F1F' }} />
          <h1 className="text-2xl font-bold text-center mb-4" style={{ fontFamily: 'Raleway, sans-serif', color: '#1F1F1F' }}>
            Inventory Booking
          </h1>
          <button 
            onClick={() => setAuth(true)} 
            className="w-full py-2 text-sm"
            style={{ backgroundColor: '#FFED00', color: '#1F1F1F', fontFamily: 'Raleway, sans-serif' }}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center">
          <div className="inline-block animate-spin w-10 h-10 border-b-2" style={{ borderColor: '#FFED00' }} />
          <p className="mt-3 text-xs" style={{ fontFamily: 'Raleway, sans-serif', color: '#575F60' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5', fontFamily: 'Raleway, sans-serif' }}>
      {/* Header */}
      <nav className="border-b" style={{ backgroundColor: 'white', borderColor: '#575F60' }}>
        <div className="max-w-7xl mx-auto px-3 py-2 flex justify-between items-center">
          <h1 className="text-base font-bold" style={{ color: '#1F1F1F' }}>Inventory Booking</h1>
          <div className="flex gap-1">
            <button 
              onClick={() => setPage('overview')} 
              className={`px-2 py-1 text-xs flex items-center gap-1 ${page === 'overview' ? '' : 'border'}`}
              style={{ 
                backgroundColor: page === 'overview' ? '#FFED00' : 'white',
                color: page === 'overview' ? '#1F1F1F' : '#575F60',
                borderColor: '#575F60'
              }}
            >
              <BarChart3 className="w-3 h-3" /> Overview
            </button>
            <button 
              onClick={() => setPage('items')} 
              className={`px-2 py-1 text-xs flex items-center gap-1 ${page === 'items' ? '' : 'border'}`}
              style={{ 
                backgroundColor: page === 'items' ? '#FFED00' : 'white',
                color: page === 'items' ? '#1F1F1F' : '#575F60',
                borderColor: '#575F60'
              }}
            >
              <Package className="w-3 h-3" /> Items
            </button>
            <button 
              onClick={() => setPage('projects')} 
              className={`px-2 py-1 text-xs flex items-center gap-1 ${page === 'projects' ? '' : 'border'}`}
              style={{ 
                backgroundColor: page === 'projects' ? '#FFED00' : 'white',
                color: page === 'projects' ? '#1F1F1F' : '#575F60',
                borderColor: '#575F60'
              }}
            >
              <BookOpen className="w-3 h-3" /> Projects
            </button>
            <button 
              onClick={() => setPage('bookings')} 
              className={`px-2 py-1 text-xs flex items-center gap-1 ${page === 'bookings' ? '' : 'border'}`}
              style={{ 
                backgroundColor: page === 'bookings' ? '#FFED00' : 'white',
                color: page === 'bookings' ? '#1F1F1F' : '#575F60',
                borderColor: '#575F60'
              }}
            >
              Bookings
            </button>
            <button 
              onClick={() => setPage('calendar')} 
              className={`px-2 py-1 text-xs flex items-center gap-1 ${page === 'calendar' ? '' : 'border'}`}
              style={{ 
                backgroundColor: page === 'calendar' ? '#FFED00' : 'white',
                color: page === 'calendar' ? '#1F1F1F' : '#575F60',
                borderColor: '#575F60'
              }}
            >
              <Calendar className="w-3 h-3" /> Calendar
            </button>
            <button 
              onClick={() => setAuth(false)} 
              className="px-2 py-1 text-xs flex items-center gap-1 border"
              style={{ color: '#dc2626', borderColor: '#575F60' }}
            >
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 py-4">
        {page === 'items' && <ItemsPage items={items} bookings={bookings} groups={groups} refreshData={fetchData} />}
        {page === 'projects' && <ProjectsPage projects={projects} bookings={bookings} items={items} refreshData={fetchData} />}
        {page === 'bookings' && <BookingsPage bookings={bookings} items={items} projects={projects} groups={groups} refreshData={fetchData} />}
        {page === 'overview' && <OverviewPage items={items} bookings={bookings} groups={groups} />}
        {page === 'calendar' && <CalendarPage bookings={bookings} items={items} projects={projects} groups={groups} />}
      </main>
    </div>
  );
}

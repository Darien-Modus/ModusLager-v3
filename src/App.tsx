import { useState, useEffect } from 'react';
import { Calendar, Package, BookOpen, BarChart3, ClipboardList } from 'lucide-react';
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
  const [openBookingModal, setOpenBookingModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (itemsError) throw itemsError;
      
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (projectsError) throw projectsError;
      
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (groupsError) throw groupsError;
      
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
      
      const transformedItems: Item[] = itemsData?.map(item => ({
        id: item.id,
        name: item.name,
        totalQuantity: item.total_quantity,
        color: item.color,
        groupId: item.group_id,
        images: item.images,           // Array of images
        iconIndex: item.icon_index,     // Selected icon index
        dimensions: item.dimensions,
        description: item.description
      })) || [];
      
      const transformedProjects: Project[] = projectsData?.map(project => ({
        id: project.id,
        name: project.name,
        number: project.number,
        client: project.client
      })) || [];
      
      const transformedGroups: Group[] = groupsData?.map(group => ({
        id: group.id,
        name: group.name,
        color: group.color,
        sortOrder: group.sort_order,
        displayMode: group.display_mode
      })) || [];
      
      const transformedBookings: Booking[] = bookingsData?.map(booking => ({
        id: booking.id,
        items: booking.booking_items.map((bi: any) => ({
          itemId: bi.item_id,
          quantity: bi.quantity
        })),
        projectId: booking.project_id,
        startDate: booking.start_date,
        endDate: booking.end_date,
        status: booking.status || 'confirmed'
      })) || [];
      
      setItems(transformedItems);
      setProjects(transformedProjects);
      setGroups(transformedGroups);
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

  const handleOpenBookingModal = () => {
    setPage('bookings');
    setOpenBookingModal(true);
  };

  if (!auth) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ 
          fontFamily: 'Raleway, sans-serif',
          backgroundColor: '#F5F5F5'
        }}
      >
        <div className="w-full max-w-md">
          <img src="/ModusLager_Logo_Square.svg" alt="ModusLager" className="w-full mx-auto" style={{ marginBottom: '120px' }} />
          <button 
            onClick={() => setAuth(true)} 
            className="w-full py-2 rounded-lg text-base font-medium"
            style={{ 
              backgroundColor: '#FFED00',
              color: '#1F1F1F'
            }}
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ 
          fontFamily: 'Raleway, sans-serif',
          backgroundColor: '#F5F5F5'
        }}
      >
        <div className="text-center">
          <div 
            className="inline-block animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: '#FFED00' }}
          />
          <p className="mt-4" style={{ color: '#575F60' }}>Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        fontFamily: 'Raleway, sans-serif',
        backgroundColor: '#F5F5F5'
      }}
    >
      <nav 
        className="border-b"
        style={{ 
          backgroundColor: 'white',
          borderColor: '#575F60'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <img src="/ModusLager_Logo_Long.svg" alt="ModusLager" className="h-8" />
          <div className="flex gap-2">
            <button 
              onClick={() => setPage('overview')} 
              className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 border`}
              style={{
                backgroundColor: page === 'overview' ? '#FFED00' : 'transparent',
                borderColor: '#575F60',
                color: '#1F1F1F'
              }}
            >
              <BarChart3 className="w-4 h-4" /> Overview
            </button>
            <button 
              onClick={() => setPage('items')} 
              className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 border`}
              style={{
                backgroundColor: page === 'items' ? '#FFED00' : 'transparent',
                borderColor: '#575F60',
                color: '#1F1F1F'
              }}
            >
              <Package className="w-4 h-4" /> Items
            </button>
            <button 
              onClick={() => setPage('projects')} 
              className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 border`}
              style={{
                backgroundColor: page === 'projects' ? '#FFED00' : 'transparent',
                borderColor: '#575F60',
                color: '#1F1F1F'
              }}
            >
              <BookOpen className="w-4 h-4" /> Projects
            </button>
            <button 
              onClick={() => setPage('bookings')} 
              className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 border`}
              style={{
                backgroundColor: page === 'bookings' ? '#FFED00' : 'transparent',
                borderColor: '#575F60',
                color: '#1F1F1F'
              }}
            >
              <ClipboardList className="w-4 h-4" /> Bookings
            </button>
            <button 
              onClick={() => setPage('calendar')} 
              className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 border`}
              style={{
                backgroundColor: page === 'calendar' ? '#FFED00' : 'transparent',
                borderColor: '#575F60',
                color: '#1F1F1F'
              }}
            >
              <Calendar className="w-4 h-4" /> Calendar
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {page === 'items' && <ItemsPage items={items} bookings={bookings} groups={groups} refreshData={fetchData} />}
        {page === 'projects' && <ProjectsPage projects={projects} bookings={bookings} items={items} refreshData={fetchData} />}
        {page === 'bookings' && <BookingsPage bookings={bookings} items={items} projects={projects} groups={groups} refreshData={fetchData} shouldOpenModal={openBookingModal} onModalClose={() => setOpenBookingModal(false)} />}
        {page === 'overview' && <OverviewPage items={items} bookings={bookings} groups={groups} />}
        {page === 'calendar' && <CalendarPage bookings={bookings} items={items} projects={projects} groups={groups} onOpenBookingModal={handleOpenBookingModal} />}
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
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
        image: item.image
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
        sortOrder: group.sort_order
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

  if (!auth) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6"
        style={{ 
          fontFamily: "Raleway, sans-serif",
          backgroundColor: '#F3F3F3'
        }}
      >
        <div className="flex flex-col items-center gap-24">
          <img 
            src="/ModusLager_Logo_Square.svg"
            alt="ModusLager"
            style={{ width: '400px' }}
          />
          
          <button 
            onClick={() => setAuth(true)} 
            className="py-4 text-lg font-medium border"
            style={{ 
              backgroundColor: '#FFED00',
              color: '#191A23',
              borderColor: '#191A23',
              width: '400px'
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
          fontFamily: "Raleway, sans-serif",
          backgroundColor: '#F3F3F3'
        }}
      >
        <div className="text-center">
          <div 
            className="inline-block animate-spin h-16 w-16 border-b-4"
            style={{ borderColor: '#FFED00', borderRadius: '50%' }}
          />
          <p className="mt-6 text-lg" style={{ color: '#191A23' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        fontFamily: "Raleway, sans-serif",
        backgroundColor: '#F3F3F3'
      }}
    >
      {/* Navigation */}
      <nav 
        style={{ 
          backgroundColor: 'white',
          borderBottom: '1px solid #191A23'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <img 
              src="/ModusLager_Logo_Long.svg"
              alt="ModusLager"
              className="h-10"
            />
            
            {/* Navigation Links */}
            <div className="flex gap-2">
              <button 
                onClick={() => setPage('overview')} 
                className="px-5 py-2 text-sm font-medium border"
                style={{
                  backgroundColor: page === 'overview' ? '#FFED00' : 'transparent',
                  borderColor: page === 'overview' ? '#191A23' : 'transparent',
                  color: '#191A23'
                }}
              >
                Overview
              </button>
              <button 
                onClick={() => setPage('items')} 
                className="px-5 py-2 text-sm font-medium border"
                style={{
                  backgroundColor: page === 'items' ? '#FFED00' : 'transparent',
                  borderColor: page === 'items' ? '#191A23' : 'transparent',
                  color: '#191A23'
                }}
              >
                Items
              </button>
              <button 
                onClick={() => setPage('projects')} 
                className="px-5 py-2 text-sm font-medium border"
                style={{
                  backgroundColor: page === 'projects' ? '#FFED00' : 'transparent',
                  borderColor: page === 'projects' ? '#191A23' : 'transparent',
                  color: '#191A23'
                }}
              >
                Projects
              </button>
              <button 
                onClick={() => setPage('bookings')} 
                className="px-5 py-2 text-sm font-medium border"
                style={{
                  backgroundColor: page === 'bookings' ? '#FFED00' : 'transparent',
                  borderColor: page === 'bookings' ? '#191A23' : 'transparent',
                  color: '#191A23'
                }}
              >
                Bookings
              </button>
              <button 
                onClick={() => setPage('calendar')} 
                className="px-5 py-2 text-sm font-medium border"
                style={{
                  backgroundColor: page === 'calendar' ? '#FFED00' : 'transparent',
                  borderColor: page === 'calendar' ? '#191A23' : 'transparent',
                  color: '#191A23'
                }}
              >
                Calendar
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {page === 'items' && <ItemsPage items={items} bookings={bookings} groups={groups} refreshData={fetchData} />}
        {page === 'projects' && <ProjectsPage projects={projects} bookings={bookings} items={items} refreshData={fetchData} />}
        {page === 'bookings' && <BookingsPage bookings={bookings} items={items} projects={projects} groups={groups} refreshData={fetchData} />}
        {page === 'overview' && <OverviewPage items={items} bookings={bookings} groups={groups} />}
        {page === 'calendar' && <CalendarPage bookings={bookings} items={items} projects={projects} groups={groups} onNavigateToBookings={() => setPage('bookings')} />}
      </main>
    </div>
  );
}

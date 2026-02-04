import { useState } from 'react';
import { Edit2, Trash2, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Project, Booking, Item } from '../types';
import { formatDate } from '../utils/helpers';
import { ItemIcon } from './ItemIcon';
import { supabase } from '../utils/supabase';

interface ProjectsPageProps {
  projects: Project[];
  bookings: Booking[];
  items: Item[];
  refreshData: () => void;
}

// Isolated search component to prevent parent re-renders
const ProjectSearch = ({ onSearch }: { onSearch: (term: string) => void }) => {
  const [localSearch, setLocalSearch] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    onSearch(value);
  };
  
  return (
    <div className="relative mb-3">
      <Search className="absolute left-2 top-2 w-3 h-3" style={{ color: '#575F60' }} />
      <input
        type="text"
        placeholder="Search projects..."
        value={localSearch}
        onChange={handleChange}
        className="w-full pl-7 pr-2 py-1 border text-xs"
        style={{ borderColor: '#575F60' }}
      />
    </div>
  );
};

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ projects, bookings, items, refreshData }) => {
  const [form, setForm] = useState({ name: '', num: '', client: '' });
  const [edit, setEdit] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  
  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };
  
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.client.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getProjectBookings = (projectId: string) => {
    return bookings.filter(b => b.projectId === projectId);
  };
  
  const save = async () => {
    if (!form.name || !form.num || !form.client) {
      alert('Please fill all fields');
      return;
    }
    
    setSaving(true);
    try {
      if (edit) {
        const { error } = await supabase
          .from('projects')
          .update({
            name: form.name,
            number: form.num,
            client: form.client
          })
          .eq('id', edit);
        
        if (error) {
          console.error('Supabase UPDATE error:', error);
          alert(`Cannot update: ${error.message}`);
          return;
        }
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([{
            name: form.name,
            number: form.num,
            client: form.client
          }]);
        
        if (error) {
          console.error('Supabase INSERT error:', error);
          alert(`Cannot save: ${error.message}`);
          return;
        }
      }
      
      await refreshData();
      setForm({ name: '', num: '', client: '' });
      setEdit(null);
    } catch (error: any) {
      console.error('Error saving project:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? This will also delete all associated bookings.')) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase DELETE error:', error);
        alert(`Cannot delete: ${error.message}`);
        return;
      }
      
      await refreshData();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ fontFamily: 'Raleway, sans-serif' }}>
      <h2 className="text-base font-semibold mb-3" style={{ color: '#1F1F1F' }}>Projects</h2>
      
      {/* Add/Edit Form */}
      <div className="mb-3 p-2 border" style={{ backgroundColor: '#F5F5F5', borderColor: '#575F60' }}>
        <div className="grid grid-cols-4 gap-2">
          <input 
            type="text" 
            placeholder="Project name" 
            value={form.name} 
            onChange={e => setForm({ ...form, name: e.target.value })} 
            className="px-2 py-1 border text-xs"
            style={{ borderColor: '#575F60' }}
            disabled={saving}
          />
          <input 
            type="text" 
            placeholder="Number (e.g. PRJ-001)" 
            value={form.num} 
            onChange={e => setForm({ ...form, num: e.target.value })} 
            className="px-2 py-1 border text-xs"
            style={{ borderColor: '#575F60' }}
            disabled={saving}
          />
          <input 
            type="text" 
            placeholder="Client name" 
            value={form.client} 
            onChange={e => setForm({ ...form, client: e.target.value })} 
            className="px-2 py-1 border text-xs"
            style={{ borderColor: '#575F60' }}
            disabled={saving}
          />
          <button 
            onClick={save} 
            disabled={saving}
            className="px-2 py-1 text-xs border"
            style={{ backgroundColor: '#FFED00', borderColor: '#1F1F1F', color: '#1F1F1F' }}
          >
            {saving ? 'Saving...' : edit ? 'Update' : 'Add Project'}
          </button>
        </div>
        {edit && (
          <button 
            onClick={() => {
              setEdit(null);
              setForm({ name: '', num: '', client: '' });
            }}
            className="mt-2 px-2 py-1 border text-xs"
            style={{ borderColor: '#575F60' }}
          >
            Cancel Edit
          </button>
        )}
      </div>
      
      {/* Search - using isolated component */}
      <ProjectSearch onSearch={setSearchTerm} />
      
      {/* Projects List with Collapsible Cards */}
      <div className="space-y-2">
        {filteredProjects.map(project => {
          const projectBookings = getProjectBookings(project.id);
          const isExpanded = expandedProjects.has(project.id);
          
          return (
            <div key={project.id} className="border" style={{ borderColor: '#575F60', backgroundColor: 'white' }}>
              {/* Project Header */}
              <div 
                className="flex items-center justify-between p-2 cursor-pointer hover:bg-opacity-80"
                onClick={() => toggleProject(project.id)}
                style={{ backgroundColor: '#F5F5F5' }}
              >
                <div className="flex items-center gap-2 flex-1">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" style={{ color: '#575F60' }} />
                  ) : (
                    <ChevronRight className="w-4 h-4" style={{ color: '#575F60' }} />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: '#1F1F1F' }}>{project.name}</span>
                      <span className="text-xs" style={{ color: '#575F60' }}>({project.number})</span>
                    </div>
                    <div className="text-xs" style={{ color: '#575F60' }}>{project.client}</div>
                  </div>
                  <span className="text-xs" style={{ color: '#575F60' }}>
                    {projectBookings.length} booking{projectBookings.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => { 
                      setEdit(project.id); 
                      setForm({ name: project.name, num: project.number, client: project.client }); 
                    }} 
                    className="p-1"
                    style={{ color: '#575F60' }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleDelete(project.id)} 
                    className="p-1"
                    style={{ color: '#dc2626' }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              {/* Expanded: Show Bookings */}
              {isExpanded && (
                <div className="p-2 border-t" style={{ borderColor: '#575F60' }}>
                  {projectBookings.length === 0 ? (
                    <p className="text-xs" style={{ color: '#575F60' }}>No bookings for this project</p>
                  ) : (
                    <div className="space-y-2">
                      {projectBookings.map(booking => (
                        <div key={booking.id} className="p-2 border" style={{ borderColor: '#e5e7eb', backgroundColor: 'white' }}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-medium" style={{ color: '#1F1F1F' }}>
                              {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {booking.items.map((bi, idx) => {
                              const item = items.find(i => i.id === bi.itemId);
                              return (
                                <div key={idx} className="flex items-center gap-1">
                                  {item && <ItemIcon item={item} size="sm" />}
                                  <span className="text-xs" style={{ color: '#1F1F1F' }}>
                                    {item?.name || 'Unknown item'} 
                                    <span style={{ color: '#575F60' }}> x{bi.quantity}</span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {filteredProjects.length === 0 && (
          <div className="text-center py-8" style={{ color: '#575F60' }}>
            <p className="text-xs">No projects found</p>
          </div>
        )}
      </div>
    </div>
  );
};

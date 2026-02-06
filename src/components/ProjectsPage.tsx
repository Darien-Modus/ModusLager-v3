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

const ProjectSearch = ({ onSearch }: { onSearch: (term: string) => void }) => {
  const [localSearch, setLocalSearch] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    onSearch(value);
  };
  
  return (
    <div className="relative mb-6">
      <Search className="absolute left-3 top-3 w-4 h-4" style={{ color: '#575F60' }} />
      <input
        type="text"
        placeholder="Search projects..."
        value={localSearch}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-2 border text-sm"
        style={{ borderColor: '#575F60', backgroundColor: 'white' }}
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
    <div style={{ fontFamily: "Raleway, sans-serif" }}>
      <h2 className="text-4xl font-medium mb-6" style={{ color: '#191A23' }}>Projects</h2>
      
      {/* Add/Edit Form - Dark Background */}
      <div className="mb-6 p-6 border" style={{ backgroundColor: '#191A23', borderColor: '#191A23' }}>
        <h3 className="text-lg font-medium mb-4" style={{ color: '#FFED00' }}>
          {edit ? 'Edit Project' : 'Add New Project'}
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <input 
            type="text" 
            placeholder="Project name" 
            value={form.name} 
            onChange={e => setForm({ ...form, name: e.target.value })} 
            className="px-3 py-2 border text-sm"
            style={{ borderColor: '#575F60', backgroundColor: 'white', color: '#191A23' }}
            disabled={saving}
          />
          <input 
            type="text" 
            placeholder="Number (e.g. PRJ-001)" 
            value={form.num} 
            onChange={e => setForm({ ...form, num: e.target.value })} 
            className="px-3 py-2 border text-sm"
            style={{ borderColor: '#575F60', backgroundColor: 'white', color: '#191A23' }}
            disabled={saving}
          />
          <input 
            type="text" 
            placeholder="Client name" 
            value={form.client} 
            onChange={e => setForm({ ...form, client: e.target.value })} 
            className="px-3 py-2 border text-sm"
            style={{ borderColor: '#575F60', backgroundColor: 'white', color: '#191A23' }}
            disabled={saving}
          />
          <button 
            onClick={save} 
            disabled={saving}
            className="px-4 py-2 text-sm font-medium border"
            style={{ backgroundColor: '#FFED00', borderColor: '#191A23', color: '#191A23' }}
          >
            {saving ? 'Saving...' : edit ? 'Update' : 'Add'}
          </button>
        </div>
        {edit && (
          <button 
            onClick={() => {
              setEdit(null);
              setForm({ name: '', num: '', client: '' });
            }}
            className="mt-4 px-4 py-2 border text-sm"
            style={{ borderColor: '#575F60', color: 'white' }}
          >
            Cancel Edit
          </button>
        )}
      </div>
      
      {/* Search */}
      <ProjectSearch onSearch={setSearchTerm} />
      
      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.map(project => {
          const projectBookings = getProjectBookings(project.id);
          const isExpanded = expandedProjects.has(project.id);
          
          return (
            <div key={project.id} className="border" style={{ borderColor: '#191A23', backgroundColor: 'white' }}>
              <div 
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => toggleProject(project.id)}
                style={{ backgroundColor: '#F3F3F3' }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    <ChevronRight className="w-5 h-5" style={{ color: '#191A23' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-medium" style={{ color: '#191A23' }}>{project.name}</span>
                      <span className="text-sm" style={{ color: '#575F60' }}>({project.number})</span>
                    </div>
                    <div className="text-sm" style={{ color: '#575F60' }}>{project.client}</div>
                  </div>
                  <span className="text-sm" style={{ color: '#575F60' }}>
                    {projectBookings.length} booking{projectBookings.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => { 
                      setEdit(project.id); 
                      setForm({ name: project.name, num: project.number, client: project.client }); 
                    }} 
                    style={{ color: '#575F60' }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(project.id)} 
                    style={{ color: '#dc2626' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {isExpanded && (
                <div className="p-4 border-t" style={{ borderColor: '#F3F3F3' }}>
                  {projectBookings.length === 0 ? (
                    <p className="text-sm" style={{ color: '#575F60' }}>No bookings for this project</p>
                  ) : (
                    <div className="space-y-3">
                      {projectBookings.map(booking => (
                        <div key={booking.id} className="p-3 border" style={{ borderColor: '#F3F3F3', backgroundColor: 'white' }}>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium" style={{ color: '#191A23' }}>
                              {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {booking.items.map((bi, idx) => {
                              const item = items.find(i => i.id === bi.itemId);
                              const isRainbow = item?.color && !item.color.startsWith('#');
                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  {item && (
                                    <div 
                                      className="w-6 h-6 border-2 flex-shrink-0"
                                      style={{ 
                                        borderColor: '#575F60',
                                        ...(isRainbow
                                          ? { background: 'linear-gradient(135deg, red, orange, yellow, green, blue, indigo, violet)' }
                                          : { backgroundColor: item.color || '#9CA3AF' }
                                        )
                                      }}
                                      title={item.color === '#9CA3AF' ? 'Alu' : item.color === '#191A23' ? 'Black' : 'Other'}
                                    />
                                  )}
                                  <span className="text-sm" style={{ color: '#191A23' }}>
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
          <div className="text-center py-12" style={{ color: '#575F60' }}>
            <p className="text-sm">No projects found</p>
          </div>
        )}
      </div>
    </div>
  );
};

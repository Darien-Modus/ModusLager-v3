import { useState } from 'react';
import { Edit2, Trash2, Plus, ChevronDown, ChevronRight, Search } from 'lucide-react';
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

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ projects, bookings, items, refreshData }) => {
  const [form, setForm] = useState({ name: '', number: '', client: '' });
  const [edit, setEdit] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  
  const save = async () => {
    if (!form.name || !form.number || !form.client) return;
    
    setSaving(true);
    try {
      if (edit) {
        const { error } = await supabase
          .from('projects')
          .update({ name: form.name, number: form.number, client: form.client })
          .eq('id', edit);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([{ name: form.name, number: form.number, client: form.client }]);
        if (error) throw error;
      }
      
      await refreshData();
      setForm({ name: '', number: '', client: '' });
      setEdit(null);
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project.');
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this project? All associated bookings will also be deleted.')) return;
    
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project.');
    }
  };

  const toggleExpand = (projectId: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpanded(newExpanded);
  };

  const getProjectBookings = (projectId: string) => {
    return bookings.filter(b => b.projectId === projectId);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ fontFamily: 'Raleway, sans-serif' }}>
      <h2 className="text-base font-semibold mb-3" style={{ color: '#1F1F1F' }}>Projects</h2>
      
      {/* Search */}
      <div className="mb-3 p-2 border" style={{ backgroundColor: '#F5F5F5', borderColor: '#575F60' }}>
        <div className="relative">
          <Search className="absolute left-2 top-1.5 w-3 h-3" style={{ color: '#575F60' }} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1 border text-xs"
            style={{ borderColor: '#575F60' }}
          />
        </div>
      </div>
      
      {/* Add/Edit Form */}
      <div className="p-2 border mb-3" style={{ backgroundColor: '#F5F5F5', borderColor: '#575F60' }}>
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
            placeholder="Number" 
            value={form.number} 
            onChange={e => setForm({ ...form, number: e.target.value })} 
            className="px-2 py-1 border text-xs"
            style={{ borderColor: '#575F60' }}
            disabled={saving}
          />
          <input 
            type="text" 
            placeholder="Client" 
            value={form.client} 
            onChange={e => setForm({ ...form, client: e.target.value })} 
            className="px-2 py-1 border text-xs"
            style={{ borderColor: '#575F60' }}
            disabled={saving}
          />
          <div className="flex gap-1">
            <button 
              onClick={save} 
              disabled={saving}
              className="flex-1 px-2 py-1 text-xs"
              style={{ backgroundColor: '#FFED00', color: '#1F1F1F' }}
            >
              {saving ? '...' : edit ? 'Update' : 'Add'}
            </button>
            {edit && (
              <button
                onClick={() => { setEdit(null); setForm({ name: '', number: '', client: '' }); }}
                className="px-2 py-1 text-xs border"
                style={{ borderColor: '#575F60' }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-2">
        {filteredProjects.map(project => {
          const projectBookings = getProjectBookings(project.id);
          const isExpanded = expanded.has(project.id);
          
          return (
            <div key={project.id} className="border" style={{ borderColor: '#575F60', backgroundColor: 'white' }}>
              <div 
                className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-gray-50"
                onClick={() => projectBookings.length > 0 && toggleExpand(project.id)}
                style={{ backgroundColor: '#F5F5F5' }}
              >
                <div className="flex items-center gap-2 flex-1">
                  {projectBookings.length > 0 ? (
                    <button>
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                  ) : (
                    <div className="w-3" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs" style={{ color: '#1F1F1F' }}>{project.name}</span>
                      <span className="text-xs px-1.5 py-0.5 border" style={{ borderColor: '#575F60', color: '#575F60' }}>
                        {project.number}
                      </span>
                      <span className="text-xs" style={{ color: '#575F60' }}>{project.client}</span>
                      {projectBookings.length > 0 && (
                        <span className="text-xs px-1.5 py-0.5" style={{ backgroundColor: '#FFED00', color: '#1F1F1F' }}>
                          {projectBookings.length} booking{projectBookings.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEdit(project.id); setForm({ name: project.name, number: project.number, client: project.client }); }}
                    style={{ color: '#575F60' }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                    style={{ color: '#dc2626' }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              {isExpanded && projectBookings.length > 0 && (
                <div className="p-2 space-y-1 border-t" style={{ borderColor: '#575F60' }}>
                  {projectBookings.map(booking => (
                    <div key={booking.id} className="px-2 py-1 border" style={{ borderColor: '#e5e7eb', backgroundColor: '#F5F5F5' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: '#1F1F1F' }}>
                          {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {booking.items.map((bi, idx) => {
                          const item = items.find(i => i.id === bi.itemId);
                          if (!item) return null;
                          return (
                            <div key={idx} className="flex items-center gap-1 px-1.5 py-0.5 border text-xs" style={{ borderColor: '#575F60' }}>
                              <ItemIcon item={item} size="sm" />
                              <span style={{ color: '#1F1F1F' }}>{item.name}</span>
                              <span style={{ color: '#575F60' }}>×{bi.quantity}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Edit2, Trash2, Search, ChevronRight, Plus, X } from 'lucide-react';
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
  const [form, setForm] = useState({ name: '', num: '', client: '' });
  const [edit, setEdit] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  
  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    newExpanded.has(projectId) ? newExpanded.delete(projectId) : newExpanded.add(projectId);
    setExpandedProjects(newExpanded);
  };
  
  const filteredProjects = (projects || []).filter(p => {
    if (!p) return false;
    return (
      String(p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.client || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  const getProjectBookings = (projectId: string) => {
    return bookings.filter(b => b.projectId === projectId);
  };

  const openModal = () => {
    setForm({ name: '', num: '', client: '' });
    setEdit(null);
    setShowModal(true);
  };

  const openEditModal = (project: Project) => {
    setForm({ name: project.name, num: project.number, client: project.client });
    setEdit(project.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEdit(null);
    setForm({ name: '', num: '', client: '' });
  };
  
  const save = async () => {
    if (!form.name || !form.num || !form.client) {
      alert('Please fill all fields');
      return;
    }
    
    setSaving(true);
    try {
      if (edit) {
        const { error } = await supabase.from('projects').update({ name: form.name, number: form.num, client: form.client }).eq('id', edit);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('projects').insert([{ name: form.name, number: form.num, client: form.client }]);
        if (error) throw error;
      }
      
      await refreshData();
      closeModal();
    } catch (error: any) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  const del = async (id: string) => {
    if (!confirm('Delete project?')) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };
  
  return (
    <div style={{ fontFamily: "Raleway, sans-serif" }}>
      <h2 className="text-4xl font-medium mb-6" style={{ color: '#191A23' }}>Projects</h2>
      
      <div className="mb-6 border-2" style={{ backgroundColor: '#191A23', borderColor: '#191A23', maxWidth: '1248px', margin: '0 auto 24px', height: '90px' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 24px', gap: '16px' }}>
          {/* Label Fixed Width */}
          <span className="text-sm font-medium" style={{ color: '#FFED00', flexShrink: 0, minWidth: '150px' }}>Search Projects:</span>
          
          <div className="relative" style={{ flex: 1 }}>
            <Search className="absolute w-4 h-4" style={{ color: '#575F60', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Search projects..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border text-sm" style={{ borderColor: '#575F60', backgroundColor: 'white', color: '#191A23' }} />
          </div>
          
          {/* Button Fixed Width */}
          <button onClick={openModal} className="flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium border-2" style={{ backgroundColor: '#FFED00', borderColor: '#191A23', color: '#191A23', flexShrink: 0, minWidth: '160px' }}>
            <Plus className="w-5 h-5" /> Add Project
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1248px', margin: '0 auto' }}>
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 border-2" style={{ backgroundColor: 'white', borderColor: '#575F60', borderStyle: 'dashed' }}>
            <p style={{ color: '#575F60' }}>No projects found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map(project => {
              const projectBookings = getProjectBookings(project.id);
              const isExpanded = expandedProjects.has(project.id);
              
              return (
                <div key={project.id} className="border-2" style={{ backgroundColor: 'white', borderColor: '#191A23' }}>
                  <div className="flex items-center justify-between p-4 cursor-pointer" style={{ backgroundColor: '#F3F3F3' }} onClick={() => toggleProject(project.id)}>
                    <div className="flex items-center gap-3 flex-1">
                      <div style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <ChevronRight className="w-5 h-5" style={{ color: '#191A23' }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-base" style={{ color: '#191A23' }}>{project.name}</span>
                          <span className="text-xs px-2 py-1" style={{ backgroundColor: '#F3F3F3', color: '#575F60' }}>#{project.number}</span>
                          <span className="text-xs" style={{ color: '#575F60' }}>{project.client}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium" style={{ backgroundColor: '#F3F3F3', color: '#575F60' }}>{projectBookings.length} bookings</span>
                    </div>
                    <div className="flex gap-2 ml-4" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEditModal(project)} style={{ color: '#575F60' }}><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => del(project.id)} style={{ color: '#dc2626' }}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  {isExpanded && projectBookings.length > 0 && (
                    <div className="border-t" style={{ borderColor: '#F3F3F3' }}>
                      <div className="p-4 space-y-3">
                        {projectBookings.map(booking => {
                          const isConfirmed = booking.status === 'confirmed';
                          
                          return (
                            <div key={booking.id} className="border p-3" style={{ 
                              borderColor: '#191A23', 
                              backgroundColor: '#F9F9F9',
                              borderStyle: isConfirmed ? 'solid' : 'dashed',
                              fontStyle: isConfirmed ? 'normal' : 'italic'
                            }}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium" style={{ color: '#191A23' }}>
                                  {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                                </span>
                                <span className="px-3 py-1 text-xs font-medium" style={{ 
                                  backgroundColor: isConfirmed ? '#FFED00' : '#e9e3d3', 
                                  color: '#191A23' 
                                }}>
                                  {booking.status}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {booking.items.map(bi => {
                                  const item = items.find(i => i.id === bi.itemId);
                                  if (!item) return null;
                                  return (
                                    <div key={bi.itemId} className="flex items-center gap-2 px-2 py-1 text-xs border" style={{ borderColor: '#575F60', backgroundColor: 'white' }}>
                                      <ItemIcon item={item} size={16} />
                                      <span style={{ color: '#191A23' }}>{item.name}</span>
                                      <span className="font-medium" style={{ color: '#575F60' }}>×{bi.quantity}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl p-8 max-w-xl w-full border-2" style={{ borderColor: '#191A23' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-medium" style={{ color: '#191A23' }}>{edit ? 'Edit Project' : 'New Project'}</h3>
              <button onClick={closeModal}><X className="w-6 h-6" style={{ color: '#575F60' }} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Project Name</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border text-sm" style={{ borderColor: '#575F60' }} placeholder="Project name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Project Number</label>
                <input type="text" value={form.num} onChange={e => setForm({...form, num: e.target.value})} className="w-full px-3 py-2 border text-sm" style={{ borderColor: '#575F60' }} placeholder="e.g. 2024-001" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#575F60' }}>Client</label>
                <input type="text" value={form.client} onChange={e => setForm({...form, client: e.target.value})} className="w-full px-3 py-2 border text-sm" style={{ borderColor: '#575F60' }} placeholder="Client name" />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={closeModal} className="px-6 py-3 text-sm font-medium border-2" style={{ borderColor: '#575F60', color: '#575F60' }}>Cancel</button>
                <button onClick={save} disabled={saving} className="flex-1 px-6 py-3 text-sm font-medium border-2" style={{ backgroundColor: '#FFED00', borderColor: '#191A23', color: '#191A23' }}>
                  {saving ? 'Saving...' : edit ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
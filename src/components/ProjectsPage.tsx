import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Project } from '../types';
import { supabase } from '../utils/supabase';

interface ProjectsPageProps {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  refreshData: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ projects, refreshData }) => {
  const [form, setForm] = useState({ name: '', num: '', client: '' });
  const [edit, setEdit] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const save = async () => {
    if (!form.name || !form.num || !form.client) return;
    
    setSaving(true);
    try {
      if (edit) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({
            name: form.name,
            number: form.num,
            client: form.client
          })
          .eq('id', edit);
        
        if (error) throw error;
      } else {
        // Create new project
        const { error } = await supabase
          .from('projects')
          .insert([{
            name: form.name,
            number: form.num,
            client: form.client
          }]);
        
        if (error) throw error;
      }
      
      // Refresh data from database
      await refreshData();
      
      // Reset form
      setForm({ name: '', num: '', client: '' });
      setEdit(null);
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project. Check console for details.');
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
      
      if (error) throw error;
      
      await refreshData();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project. Check console for details.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Projects Management</h2>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-4 gap-4">
          <input 
            type="text" 
            placeholder="Name" 
            value={form.name} 
            onChange={e => setForm({ ...form, name: e.target.value })} 
            className="px-4 py-2 border rounded-lg"
            disabled={saving}
          />
          <input 
            type="text" 
            placeholder="Number" 
            value={form.num} 
            onChange={e => setForm({ ...form, num: e.target.value })} 
            className="px-4 py-2 border rounded-lg"
            disabled={saving}
          />
          <input 
            type="text" 
            placeholder="Client" 
            value={form.client} 
            onChange={e => setForm({ ...form, client: e.target.value })} 
            className="px-4 py-2 border rounded-lg"
            disabled={saving}
          />
          <button 
            onClick={save} 
            disabled={saving}
            className="bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : edit ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id}>
                <td className="px-6 py-4">{p.name}</td>
                <td className="px-6 py-4">{p.number}</td>
                <td className="px-6 py-4">{p.client}</td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => { 
                      setEdit(p.id); 
                      setForm({ name: p.name, num: p.number, client: p.client }); 
                    }} 
                    className="text-blue-600 mr-3"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
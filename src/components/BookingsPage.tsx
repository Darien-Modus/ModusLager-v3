const save = async () => { 
    // Simplified validation: just check if project and dates exist
    if (!pid || !start || !end) { 
      setErr('Project and Dates are required'); 
      return; 
    } 
    
    // Filter out any empty rows before saving
    const validItems = bis.filter(bi => bi.itemId && bi.quantity > 0);
    if (validItems.length === 0) {
      setErr('Add at least one item with a quantity');
      return;
    }

    setSaving(true); 
    setErr('');

    try { 
      const bData = { 
        project_id: pid, 
        start_date: start, 
        end_date: end 
      };

      if (edit) { 
        // Update existing
        const { error: bErr } = await supabase.from('bookings').update(bData).eq('id', edit); 
        if (bErr) throw bErr;

        const { error: dErr } = await supabase.from('booking_items').delete().eq('booking_id', edit); 
        if (dErr) throw dErr;

        const { error: iErr } = await supabase.from('booking_items').insert(
          validItems.map(bi => ({ booking_id: edit, item_id: bi.itemId, quantity: bi.quantity }))
        ); 
        if (iErr) throw iErr;
      } else { 
        // Create new
        const { data, error: bErr } = await supabase.from('bookings').insert([bData]).select().single(); 
        if (bErr) throw bErr;

        const { error: iErr } = await supabase.from('booking_items').insert(
          validItems.map(bi => ({ booking_id: data.id, item_id: bi.itemId, quantity: bi.quantity }))
        ); 
        if (iErr) throw iErr;
      } 

      await refreshData(); 
      // Reset form
      setBis([{ itemId: '', quantity: 0 }]); 
      setPid(''); 
      setStart(''); 
      setEnd(''); 
      setEdit(null); 
      setProjectSearch(''); 
    } catch (e: any) { 
      console.error('Full Error:', e); 
      setErr(e.message || 'Database error occurred'); 
    } finally { 
      setSaving(false); 
    } 
  };
  return ( 
    <div style={{ fontFamily: "Raleway, sans-serif" }}> 
      <h2 className="text-4xl font-medium mb-6" style={{ color: '#191A23' }}>Bookings</h2> 
       
      <div className="p-6 border mb-6" style={{ backgroundColor: '#191A23', borderColor: '#191A23' }}> 
        <h3 className="text-lg font-medium mb-4" style={{ color: '#FFED00' }}>
          {edit ? 'Edit Booking' : 'Create New Booking'}
        </h3> 
         
        <div className="space-y-4"> 
          <div className="grid grid-cols-3 gap-4"> 
            <div> 
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Project</label> 
              <div className="space-y-2"> 
                <div className="relative"> 
                  <Search className="absolute left-3 top-2.5 w-4 h-4" style={{ color: '#575F60' }} /> 
                  <input 
                    type="text" 
                    placeholder="Search projects..." 
                    value={projectSearch} 
                    onChange={e => setProjectSearch(e.target.value)} 
                    className="w-full pl-10 pr-3 py-2 border text-sm" 
                    style={{ borderColor: '#575F60', backgroundColor: 'white', color: '#191A23' }} 
                  /> 
                </div> 
                <select  
                  value={pid}  
                  onChange={e => setPid(e.target.value)}  
                  className="w-full px-3 py-2 border text-sm" 
                  style={{ borderColor: '#575F60', backgroundColor: 'white', color: '#191A23' }} 
                  disabled={saving} 
                > 
                  <option value="">Select</option> 
                  {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.number})</option>)} 
                </select> 
                <button 
                  onClick={() => setShowProjectForm(!showProjectForm)} 
                  className="w-full px-3 py-2 border text-xs flex items-center justify-center gap-1" 
                  style={{ borderColor: '#575F60', color: 'white', backgroundColor: 'transparent' }} 
                > 
                  <Plus className="w-3 h-3" /> Quick Add Project 
                </button> 
              </div> 
            </div> 
            <div> 
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Start Date</label> 
              <input type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full px-3 py-2 border text-sm" style={{ borderColor: '#575F60', backgroundColor: 'white', color: '#191A23' }} disabled={saving} /> 
            </div> 
            <div> 
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>End Date</label> 
              <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full px-3 py-2 border text-sm" style={{ borderColor: '#575F60', backgroundColor: 'white', color: '#191A23' }} disabled={saving} /> 
            </div> 
          </div> 

          {showProjectForm && ( 
            <div className="p-4 border" style={{ backgroundColor: '#F3F3F3', borderColor: '#575F60' }}> 
              <div className="grid grid-cols-4 gap-2 mb-2"> 
                <input type="text" placeholder="Name" value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} className="px-3 py-2 border text-sm" /> 
                <input type="text" placeholder

import React, { useState, useMemo, useRef } from 'react';
import { BudgetItem, SubItem, EventBudget } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

const BudgetView: React.FC = () => {
  const [budgets, setBudgets] = useState<EventBudget[]>([
    {
      id: '1',
      eventName: 'Casamento Marina & João',
      date: '2025-06-15',
      items: [
        { 
          id: '1a', 
          category: 'Espaço', 
          name: 'Salão de Festas', 
          amount: 5000,
          deadline: '2025-03-20',
          subItems: [
            { id: 's1', name: 'Aluguel do Salão', amount: 4500, deadline: '2025-03-15' },
            { id: 's2', name: 'Taxa de Limpeza', amount: 500, deadline: '2025-06-10' }
          ]
        },
        { id: '1b', category: 'Comida', name: 'Buffet Completo', amount: 8500, deadline: '2025-04-01' },
        { id: '1c', category: 'Decoração', name: 'Arranjos Florais', amount: 2000, deadline: '2025-05-10' },
        { id: '1d', category: 'Som', name: 'DJ e Iluminação', amount: 1500, deadline: '2025-05-20' },
      ]
    }
  ]);

  const [activeEventId, setActiveEventId] = useState<string>('1');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isPdfOptionsOpen, setIsPdfOptionsOpen] = useState(false);
  const [addingSubItemTo, setAddingSubItemTo] = useState<string | null>(null);
  
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [editingSubItem, setEditingSubItem] = useState<{itemId: string, sub: SubItem} | null>(null);
  
  const [newItem, setNewItem] = useState({ category: 'Geral', name: '', amount: 0, deadline: '' });
  const [newSubItem, setNewSubItem] = useState({ name: '', amount: 0, deadline: '' });
  const [newEvent, setNewEvent] = useState({ eventName: '', date: '' });
  
  const [customNotes, setCustomNotes] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const activeBudget = useMemo(() => budgets.find(b => b.id === activeEventId), [budgets, activeEventId]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') alert('Notificações ativadas!');
    }
  };

  const getDeadlineStatus = (dateStr?: string) => {
    if (!dateStr) return { label: 'Sem prazo', color: 'text-slate-300', bg: 'bg-slate-50', hex: '#94a3b8' };
    const deadline = new Date(dateStr);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Atrasado', color: 'text-red-600', bg: 'bg-red-50', hex: '#dc2626' };
    if (diffDays <= 7) return { label: `Faltam ${diffDays}d`, color: 'text-amber-600', bg: 'bg-amber-50', hex: '#d97706' };
    return { label: deadline.toLocaleDateString('pt-BR'), color: 'text-indigo-600', bg: 'bg-indigo-50', hex: '#4f46e5' };
  };

  const allTasks = useMemo(() => {
    if (!activeBudget) return [];
    const tasks: { id: string; name: string; deadline: string; parent?: string; type: 'item' | 'sub' }[] = [];
    activeBudget.items.forEach(item => {
      if (item.deadline) tasks.push({ id: item.id, name: item.name, deadline: item.deadline, type: 'item' });
      item.subItems?.forEach(sub => {
        if (sub.deadline) tasks.push({ id: sub.id, name: sub.name, deadline: sub.deadline, parent: item.name, type: 'sub' });
      });
    });
    return tasks;
  }, [activeBudget]);

  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for start of month
    for (let i = 0; i < firstDay; i++) days.push(null);
    // Real days
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentCalendarDate]);

  const getItemAmount = (item: BudgetItem): number => {
    return item.subItems && item.subItems.length > 0 
      ? item.subItems.reduce((sum, sub) => sum + sub.amount, 0) 
      : item.amount;
  };

  const groupedItems = useMemo(() => {
    if (!activeBudget) return {};
    return activeBudget.items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, BudgetItem[]>);
  }, [activeBudget]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(groupedItems).forEach(([category, items]) => {
      totals[category] = items.reduce((sum, item) => sum + getItemAmount(item), 0);
    });
    return totals;
  }, [groupedItems]);

  const totalAmount = useMemo(() => {
    return activeBudget?.items.reduce((sum, item) => sum + getItemAmount(item), 0) || 0;
  }, [activeBudget]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + offset, 1);
    setCurrentCalendarDate(newDate);
  };

  // Fixed: Added createEvent function
  const createEvent = () => {
    if (!newEvent.eventName || !newEvent.date) return;
    const newId = Math.random().toString(36).substr(2, 9);
    setBudgets(prev => [...prev, { id: newId, eventName: newEvent.eventName, date: newEvent.date, items: [] }]);
    setActiveEventId(newId);
    setIsAddingEvent(false);
    setNewEvent({ eventName: '', date: '' });
  };

  const addItem = () => {
    if (!newItem.name || newItem.amount <= 0) return;
    setBudgets(prev => prev.map(b => b.id === activeEventId ? { ...b, items: [...b.items, { ...newItem, id: Math.random().toString(36).substr(2, 9), subItems: [] }] } : b));
    setIsAddingItem(false);
    setNewItem({ category: 'Geral', name: '', amount: 0, deadline: '' });
  };

  const updateItem = () => {
    if (!editingItem) return;
    setBudgets(prev => prev.map(b => b.id === activeEventId ? { ...b, items: b.items.map(i => i.id === editingItem.id ? editingItem : i) } : b));
    setEditingItem(null);
  };

  const addSubItem = () => {
    if (!newSubItem.name || !addingSubItemTo) return;
    setBudgets(prev => prev.map(b => b.id === activeEventId ? { ...b, items: b.items.map(item => item.id === addingSubItemTo ? { ...item, subItems: [...(item.subItems || []), { ...newSubItem, id: Math.random().toString(36).substr(2, 9) }] } : item) } : b));
    setAddingSubItemTo(null);
    setNewSubItem({ name: '', amount: 0, deadline: '' });
  };

  const updateSubItem = () => {
    if (!editingSubItem) return;
    setBudgets(prev => prev.map(b => b.id === activeEventId ? { ...b, items: b.items.map(item => item.id === editingSubItem.itemId ? { ...item, subItems: (item.subItems || []).map(s => s.id === editingSubItem.sub.id ? editingSubItem.sub : s) } : item) } : b));
    setEditingSubItem(null);
  };

  const removeItem = (id: string) => setBudgets(prev => prev.map(b => b.id === activeEventId ? { ...b, items: b.items.filter(i => i.id !== id) } : b));
  const removeSubItem = (itemId: string, subId: string) => setBudgets(prev => prev.map(b => b.id === activeEventId ? { ...b, items: b.items.map(item => item.id === itemId ? { ...item, subItems: (item.subItems || []).filter(s => s.id !== subId) } : item) } : b));

  // Fixed: Added handleLogoUpload function
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCompanyLogo(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fixed: Added handleExportPDF function
  const handleExportPDF = () => {
    setIsPdfOptionsOpen(false);
    // Give time for modal to close before printing
    setTimeout(() => {
      window.print();
    }, 300);
  };

  if (!activeBudget) return <div>Carregando...</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="print-only mb-8 border-b-2 border-slate-200 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {companyLogo ? <img src={companyLogo} className="h-16 w-auto" /> : <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl">E</div>}
          <div><h1 className="text-2xl font-bold">Relatório de Evento</h1><p className="text-slate-500 text-sm">EventPro Management</p></div>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p>Data: {new Date().toLocaleDateString('pt-BR')}</p>
          <p>ID: #{activeBudget.id}</p>
        </div>
      </div>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
             <select value={activeEventId} onChange={(e) => setActiveEventId(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold shadow-sm">
               {budgets.map(b => <option key={b.id} value={b.id}>{b.eventName}</option>)}
             </select>
             <button onClick={() => setIsAddingEvent(true)} className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-100 transition shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
             </button>
          </div>
          <p className="text-slate-500 text-sm font-medium">Evento: <span className="text-slate-800">{activeBudget.eventName}</span></p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="bg-slate-100 p-1 rounded-xl flex gap-1 mr-4">
             <button onClick={() => setViewMode('list')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Lista</button>
             <button onClick={() => setViewMode('calendar')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${viewMode === 'calendar' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Calendário</button>
           </div>
           <button onClick={() => setIsPdfOptionsOpen(true)} className="px-4 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center gap-2 shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>Exportar PDF</button>
           <button onClick={() => setIsAddingItem(true)} className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100">Novo Gasto</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Finanças</h3>
            <span className="text-2xl font-black text-indigo-600 block">R$ {totalAmount.toLocaleString('pt-BR')}</span>
            <div className="mt-4 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={Object.entries(categoryTotals).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={30} outerRadius={45} paddingAngle={4} dataKey="value" isAnimationActive={false}>
                  {Object.keys(categoryTotals).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie></PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 no-print">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex justify-between">Próximos Prazos <button onClick={requestNotificationPermission} className="text-indigo-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg></button></h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {allTasks.sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).slice(0, 5).map((task, i) => (
                <div key={i} className={`p-3 rounded-xl border-l-4 ${getDeadlineStatus(task.deadline).bg} ${getDeadlineStatus(task.deadline).hex.replace('#', 'border-[#')}`}>
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{task.name}</p>
                  <p className={`text-[10px] font-black uppercase ${getDeadlineStatus(task.deadline).color}`}>{getDeadlineStatus(task.deadline).label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {viewMode === 'list' ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <div className="bg-slate-50/50 px-6 py-2 text-[10px] font-black text-slate-400 uppercase">{category}</div>
                    {items.map(item => (
                      <div key={item.id} className="group px-6 py-4 flex flex-col gap-1 hover:bg-slate-50 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-indigo-600 border border-slate-100 ${getDeadlineStatus(item.deadline).bg}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></div>
                            <span className="font-bold text-slate-900">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-black text-slate-900">R$ {getItemAmount(item).toLocaleString('pt-BR')}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button onClick={() => setAddingSubItemTo(item.id)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg></button>
                              <button onClick={() => setEditingItem(item)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                              <button onClick={() => removeItem(item.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                            </div>
                          </div>
                        </div>
                        {item.subItems?.map(sub => (
                          <div key={sub.id} className="ml-11 flex items-center justify-between text-xs py-1.5 text-slate-500 border-l-2 border-indigo-100 pl-4">
                            <span>{sub.name} <span className={`ml-2 text-[9px] font-black uppercase ${getDeadlineStatus(sub.deadline).color}`}>{getDeadlineStatus(sub.deadline).label}</span></span>
                            <div className="flex items-center gap-3">
                              <span>R$ {sub.amount.toLocaleString('pt-BR')}</span>
                              <button onClick={() => setEditingSubItem({itemId: item.id, sub})} className="hover:text-amber-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
              <div className="p-6 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg uppercase tracking-widest">{currentCalendarDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                <div className="flex gap-2">
                  <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-xl shadow-sm transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg></button>
                  <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-xl shadow-sm transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg></button>
                </div>
              </div>
              <div className="grid grid-cols-7 text-center py-4 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/20">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 auto-rows-[120px]">
                {calendarDays.map((day, i) => {
                  if (day === null) return <div key={i} className="bg-slate-50/30 border border-slate-50"></div>;
                  
                  const dateStr = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth()+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const tasksForDay = allTasks.filter(t => t.deadline === dateStr);
                  
                  return (
                    <div key={i} className="border border-slate-50 p-2 overflow-y-auto custom-scrollbar group hover:bg-indigo-50/30 transition">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-bold ${tasksForDay.length > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>{day}</span>
                      </div>
                      <div className="space-y-1">
                        {tasksForDay.map((task, ti) => {
                          const status = getDeadlineStatus(task.deadline);
                          return (
                            <div key={ti} className={`px-1.5 py-0.5 rounded text-[8px] font-bold leading-tight ${status.bg} ${status.color} border border-white/50 truncate cursor-default`} title={`${task.name} (${status.label})`}>
                              {task.name}
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
      </div>

      {/* Modal Reutilizável: Add/Edit Item */}
      {(isAddingItem || editingItem) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">{editingItem ? 'Editar Gasto' : 'Novo Gasto'}</h3>
            <div className="space-y-6">
              <input type="text" placeholder="Descrição" value={editingItem ? editingItem.name : newItem.name} onChange={e => editingItem ? setEditingItem({...editingItem, name: e.target.value}) : setNewItem({...newItem, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
              <div className="grid grid-cols-2 gap-4">
                <select value={editingItem ? editingItem.category : newItem.category} onChange={e => editingItem ? setEditingItem({...editingItem, category: e.target.value}) : setNewItem({...newItem, category: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold">
                  {['Espaço', 'Comida', 'Decoração', 'Som/Luz', 'Geral'].map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="date" value={editingItem ? (editingItem.deadline || '') : newItem.deadline} onChange={e => editingItem ? setEditingItem({...editingItem, deadline: e.target.value}) : setNewItem({...newItem, deadline: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
              </div>
              <input type="number" placeholder="Valor" disabled={!!(editingItem?.subItems?.length)} value={editingItem ? editingItem.amount : newItem.amount} onChange={e => editingItem ? setEditingItem({...editingItem, amount: Number(e.target.value)}) : setNewItem({...newItem, amount: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold disabled:opacity-50" />
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => { setIsAddingItem(false); setEditingItem(null); }} className="flex-1 px-4 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">Cancelar</button>
              <button onClick={editingItem ? updateItem : addItem} className="flex-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Add SubItem Modal */}
      {(addingSubItemTo || editingSubItem) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl border-t-8 border-indigo-600">
            <h3 className="text-2xl font-black text-slate-900 mb-8">{editingSubItem ? 'Editar Componente' : 'Novo Componente'}</h3>
            <div className="space-y-6">
              <input type="text" value={editingSubItem ? editingSubItem.sub.name : newSubItem.name} onChange={e => editingSubItem ? setEditingSubItem({...editingSubItem, sub: {...editingSubItem.sub, name: e.target.value}}) : setNewSubItem({...newSubItem, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={editingSubItem ? editingSubItem.sub.amount : newSubItem.amount} onChange={e => editingSubItem ? setEditingSubItem({...editingSubItem, sub: {...editingSubItem.sub, amount: Number(e.target.value)}}) : setNewSubItem({...newSubItem, amount: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                <input type="date" value={editingSubItem ? (editingSubItem.sub.deadline || '') : newSubItem.deadline} onChange={e => editingSubItem ? setEditingSubItem({...editingSubItem, sub: {...editingSubItem.sub, deadline: e.target.value}}) : setNewSubItem({...newSubItem, deadline: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => { setAddingSubItemTo(null); setEditingSubItem(null); }} className="flex-1 px-4 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">Voltar</button>
              <button onClick={editingSubItem ? updateSubItem : addSubItem} className="flex-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* New Event Modal */}
      {isAddingEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl border border-slate-100">
            <h3 className="text-2xl font-black text-slate-900 mb-8">Novo Evento</h3>
            <div className="space-y-6">
              <input type="text" placeholder="Nome do Evento" value={newEvent.eventName} onChange={e => setNewEvent({...newEvent, eventName: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
              <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsAddingEvent(false)} className="flex-1 px-4 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">Voltar</button>
              <button onClick={createEvent} className="flex-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black">Criar</button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Options Modal */}
      {isPdfOptionsOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-2xl shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Personalizar PDF</h3>
              <button onClick={() => setIsPdfOptionsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div onClick={() => logoInputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 cursor-pointer flex flex-col items-center justify-center min-h-[160px]">
                {companyLogo ? <img src={companyLogo} className="h-24 object-contain" /> : <p className="text-xs text-slate-400 font-bold uppercase">Carregar Logo</p>}
              </div>
              <textarea value={customNotes} onChange={e => setCustomNotes(e.target.value)} placeholder="Notas do orçamento..." className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl h-[160px] font-medium resize-none" />
              <input ref={logoInputRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </div>
            <div className="flex gap-4 mt-10 pt-8 border-t border-slate-100">
              <button onClick={() => setIsPdfOptionsOpen(false)} className="flex-1 px-4 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">Voltar</button>
              <button onClick={handleExportPDF} className="flex-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100">Gerar PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetView;

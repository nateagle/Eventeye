
import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Bem-vindo, Planejador</h2>
        <p className="text-slate-500 text-lg mt-1">Aqui está o resumo dos seus eventos e criações AI.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Eventos Ativos', value: '4', icon: '📅', color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Orçado', value: 'R$ 42k', icon: '💰', color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Edições AI', value: '12', icon: '✨', color: 'bg-purple-50 text-purple-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className="text-4xl font-black text-slate-800">{stat.value}</h4>
            </div>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${stat.color}`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xl">Eventos Recentes</h3>
            <button className="text-indigo-600 font-semibold text-sm">Ver todos</button>
          </div>
          <div className="p-4 space-y-4">
            {[
              { name: 'Festa de 15 Anos - Clara', date: '22 Set 2025', status: 'Em progresso' },
              { name: 'Lançamento TechHub', date: '05 Out 2025', status: 'Pendente' },
              { name: 'Boda de Ouro - Familia Silva', date: '12 Dez 2025', status: 'Concluído' },
            ].map((event, i) => (
              <div key={i} className="p-4 rounded-2xl hover:bg-slate-50 transition flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition">🎈</div>
                  <div>
                    <p className="font-bold text-slate-800">{event.name}</p>
                    <p className="text-sm text-slate-400">{event.date}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  event.status === 'Concluído' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-indigo-900 rounded-3xl p-10 text-white relative overflow-hidden flex flex-col justify-between group">
          <div className="relative z-10">
            <h3 className="text-3xl font-black mb-4">Novo Editor Gemini</h3>
            <p className="text-indigo-200 text-lg max-w-sm leading-relaxed">
              Agora você pode usar comandos de voz ou texto para editar fotos de buffet e decoração em tempo real.
            </p>
          </div>
          <button className="relative z-10 w-fit px-8 py-4 bg-white text-indigo-900 rounded-2xl font-bold mt-8 group-hover:bg-indigo-50 transition shadow-xl">
            Experimentar agora
          </button>
          
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute right-10 top-10 w-40 h-40 border-8 border-white/10 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

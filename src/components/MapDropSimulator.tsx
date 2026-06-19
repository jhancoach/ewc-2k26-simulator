import React, { useState } from 'react';
import { Team } from '../types';

const MAPS = [
  { id: 'bermuda', name: 'Bermuda', url: 'https://i.ibb.co/fYjGM01F/BERMUDA.jpg' },
  { id: 'purgatorio', name: 'Purgatório', url: 'https://i.ibb.co/JR6RxXdZ/PURGAT-RIO.jpg' },
  { id: 'kalahari', name: 'Kalahari', url: 'https://i.ibb.co/Mxtfgvm0/KALAHARI.jpg' },
  { id: 'nova_terra', name: 'Nova Terra', url: 'https://i.ibb.co/bgrHzY8R/NOVA-TERRA.jpg' },
  { id: 'solara', name: 'Solara', url: 'https://i.ibb.co/nMzg9Qbs/SOLARA.jpg' },
];

export function MapDropSimulator({ loudGroupTeams }: { loudGroupTeams: Team[] }) {
  const [activeMap, setActiveMap] = useState(MAPS[0].id);
  // mapId -> teamId -> {x,y}
  const [positions, setPositions] = useState<Record<string, Record<string, {x: number, y: number}>>>({});

  const currentMap = MAPS.find(m => m.id === activeMap)!;
  const currentPositions = positions[activeMap] || {};

  const handleDragStart = (e: React.DragEvent, teamId: string) => {
    e.dataTransfer.setData('mapTeamId', teamId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const teamId = e.dataTransfer.getData('mapTeamId');
    if (!teamId) return;

    // Only allow teams that exist in loudGroupTeams
    if (!loudGroupTeams.some(t => t.id === teamId)) return;

    const rect = e.currentTarget.getBoundingClientRect();
    // Offset slightly so cursor is at center of a 32x32/40x40 icon
    // Using 20 as an approximation for center
    const xPx = e.clientX - rect.left - 20;
    const yPx = e.clientY - rect.top - 20;

    const x = Math.max(0, Math.min(100, (xPx / rect.width) * 100));
    const y = Math.max(0, Math.min(100, (yPx / rect.height) * 100));

    setPositions(prev => ({
      ...prev,
      [activeMap]: {
        ...(prev[activeMap] || {}),
        [teamId]: { x, y }
      }
    }));
  };

  const handleRemoveFromMap = (teamId: string) => {
    setPositions(prev => {
      const mapPos = { ...(prev[activeMap] || {}) };
      delete mapPos[teamId];
      return { ...prev, [activeMap]: mapPos };
    });
  };

  const unplacedTeams = loudGroupTeams.filter(t => !currentPositions[t.id]);

  return (
    <div className="mt-16 border border-neutral-800/80 bg-neutral-900/40 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
      <h2 className="text-xl sm:text-2xl font-black tracking-widest text-white mb-6 uppercase text-center sm:text-left flex items-center justify-center sm:justify-start gap-3">
        Simulador de Quedas - Grupo da LOUD
      </h2>

      {/* Map selector */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center sm:justify-start">
        {MAPS.map(m => (
          <button
            key={m.id}
            onClick={() => setActiveMap(m.id)}
            className={`px-4 py-2 rounded-full font-bold text-sm tracking-widest uppercase transition-colors ${
              activeMap === m.id ? 'bg-lime-500 text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white border border-neutral-700'
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Map Area */}
        <div 
          className="relative w-full lg:w-3/4 aspect-[16/9] sm:aspect-video bg-neutral-950 rounded-xl overflow-hidden border-2 border-neutral-800 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onDrop={handleDrop}
        >
          <img src={currentMap.url} alt={currentMap.name} className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80" />
          
          {/* Placed Teams */}
          {loudGroupTeams.map(team => {
            const pos = currentPositions[team.id];
            if (!pos) return null;

            return (
              <div 
                key={team.id}
                draggable
                onDragStart={(e) => handleDragStart(e, team.id)}
                className="absolute w-10 h-10 sm:w-12 sm:h-12 cursor-grab active:cursor-grabbing z-10 transition-transform hover:scale-125 hover:z-30 group"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onDoubleClick={() => handleRemoveFromMap(team.id)}
                title={team.name}
              >
                {/* Visual marker */}
                <div className={`w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-sm font-bold border-2 ${team.name === 'LOUD' ? 'border-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.8)] z-20 bg-lime-950/80 text-lime-400' : 'border-neutral-500 bg-neutral-900/80'} overflow-hidden relative drop-shadow-xl backdrop-blur-sm`}>
                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt={team.name} referrerPolicy="no-referrer" className="w-full h-full object-contain p-1 z-10 relative drop-shadow-[0_0_8px_rgba(0,0,0,0.5)] bg-black/60" draggable={false} />
                  ) : (
                    <span className="z-10 relative text-xs">{team.initials}</span>
                  )}
                </div>
                
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-white bg-black/80 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                   {team.name}
                </div>
              </div>
            )
          })}
        </div>

        {/* Unplaced Teams Pool */}
        <div className="w-full lg:w-1/4 flex flex-col bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/50">
           <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-800 pb-2 mb-4">Equipes do Grupo</h3>
           <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
             Arraste os times para o mapa. <br/>Dê duplo-clique no mapa para removê-los.
           </p>
           
           <div className="flex flex-wrap gap-2 lg:gap-3 max-h-[300px] lg:max-h-[500px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
             {unplacedTeams.map(team => (
               <div
                  key={team.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, team.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border border-neutral-800 bg-neutral-900 cursor-grab active:cursor-grabbing hover:border-lime-500/50 transition-colors flex-1 min-w-[70px] sm:min-w-[80px] max-w-[100px] ${team.name === 'LOUD' ? 'ring-2 ring-lime-500 bg-lime-950/20' : ''}`}
               >
                 <div className={`w-10 h-10 rounded-full bg-black flex items-center justify-center overflow-hidden border border-neutral-700 p-1 ${team.name === 'LOUD' ? 'border-lime-500' : ''}`}>
                   {team.logoUrl ? (
                     <img src={team.logoUrl} alt={team.name} referrerPolicy="no-referrer" className="w-full h-full object-contain drop-shadow-md" draggable={false} />
                   ) : (
                     <span className="text-sm font-bold">{team.flag}</span>
                   )}
                 </div>
                 <span className={`text-[10px] font-bold text-center uppercase truncate w-full ${team.name === 'LOUD' ? 'text-lime-400' : 'text-neutral-300'}`} title={team.name}>{team.initials}</span>
               </div>
             ))}
             {unplacedTeams.length === 0 && (
               <div className="w-full h-24 flex items-center justify-center text-xs font-bold text-neutral-600 uppercase tracking-widest border border-dashed border-neutral-800 rounded-xl">
                 Todos posicionados
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Team } from '../types';

const MAPS = [
  { id: 'bermuda', name: 'Bermuda', url: 'https://i.ibb.co/fYjGM01F/BERMUDA.jpg' },
  { id: 'purgatorio', name: 'Purgatório', url: 'https://i.ibb.co/JR6RxXdZ/PURGAT-RIO.jpg' },
  { id: 'kalahari', name: 'Kalahari', url: 'https://i.ibb.co/Mxtfgvm0/KALAHARI.jpg' },
  { id: 'nova_terra', name: 'Nova Terra', url: 'https://i.ibb.co/bgrHzY8R/NOVA-TERRA.jpg' },
  { id: 'solara', name: 'Solara', url: 'https://i.ibb.co/nMzg9Qbs/SOLARA.jpg' },
];

interface PlacedTeam {
  id: string; // Unique instance ID
  teamId: string;
  x: number;
  y: number;
}

export function MapDropSimulator({ loudGroupTeams }: { loudGroupTeams: Team[] }) {
  const [activeMap, setActiveMap] = useState(MAPS[0].id);
  // mapId -> list of placed instances
  const [positions, setPositions] = useState<Record<string, PlacedTeam[]>>({});

  const currentMap = MAPS.find(m => m.id === activeMap)!;
  const currentPositions = positions[activeMap] || [];

  const handleDragStartFromPool = (e: React.DragEvent, teamId: string) => {
    e.dataTransfer.setData('dragType', 'pool');
    e.dataTransfer.setData('teamId', teamId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragStartFromMap = (e: React.DragEvent, instanceId: string, teamId: string) => {
    e.dataTransfer.setData('dragType', 'placed');
    e.dataTransfer.setData('instanceId', instanceId);
    e.dataTransfer.setData('teamId', teamId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dragType = e.dataTransfer.getData('dragType');
    const teamId = e.dataTransfer.getData('teamId');
    if (!teamId) return;

    // Only allow teams that exist in the pool
    if (!loudGroupTeams.some(t => t.id === teamId)) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;

    const x = Math.max(0, Math.min(100, (xPx / rect.width) * 100));
    const y = Math.max(0, Math.min(100, (yPx / rect.height) * 100));

    if (dragType === 'placed') {
      const instanceId = e.dataTransfer.getData('instanceId');
      setPositions(prev => {
        const list = prev[activeMap] || [];
        return {
          ...prev,
          [activeMap]: list.map(item => item.id === instanceId ? { ...item, x, y } : item)
        };
      });
    } else {
      // New instance (duplication allowed!)
      const newInstance: PlacedTeam = {
        id: `inst-${Date.now()}-${Math.random()}`,
        teamId,
        x,
        y
      };
      setPositions(prev => {
        const list = prev[activeMap] || [];
        return {
          ...prev,
          [activeMap]: [...list, newInstance]
        };
      });
    }
  };

  const handleRemoveFromMap = (instanceId: string) => {
    setPositions(prev => {
      const list = prev[activeMap] || [];
      return {
        ...prev,
        [activeMap]: list.filter(item => item.id !== instanceId)
      };
    });
  };

  const handleClearMap = () => {
    setPositions(prev => ({
      ...prev,
      [activeMap]: []
    }));
  };

  return (
    <div id="simulador-quedas" className="mt-16 border border-neutral-800/80 bg-neutral-900/40 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-black tracking-widest text-white uppercase flex items-center gap-3">
          Simulador de Quedas - Grupo da LOUD
        </h2>

        {currentPositions.length > 0 && (
          <button
            id="btn-limpar-mapa"
            onClick={handleClearMap}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs tracking-widest uppercase bg-red-950/40 border border-red-900/60 text-red-400 hover:bg-red-900/60 hover:text-white transition-all shadow-lg cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Limpar Mapa
          </button>
        )}
      </div>

      {/* Map selector */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center sm:justify-start">
        {MAPS.map(m => (
          <button
            id={`btn-map-${m.id}`}
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
          id="mapa-drag-area"
          className="relative w-full lg:w-3/4 aspect-[16/9] sm:aspect-video bg-neutral-950 rounded-xl overflow-hidden border-2 border-neutral-800 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onDrop={handleDrop}
        >
          <img src={currentMap.url} alt={currentMap.name} className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80" />
          
          {/* Placed Teams */}
          {currentPositions.map(placedItem => {
            const team = loudGroupTeams.find(t => t.id === placedItem.teamId);
            if (!team) return null;

            return (
              <div 
                id={`placed-${placedItem.id}`}
                key={placedItem.id}
                draggable
                onDragStart={(e) => handleDragStartFromMap(e, placedItem.id, team.id)}
                className="absolute w-10 h-10 sm:w-12 sm:h-12 cursor-grab active:cursor-grabbing z-10 transition-transform hover:scale-125 hover:z-30 group"
                style={{ left: `${placedItem.x}%`, top: `${placedItem.y}%`, transform: 'translate(-50%, -50%)' }}
                onDoubleClick={() => handleRemoveFromMap(placedItem.id)}
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

        {/* Teams Pool */}
        <div id="pool-times-container" className="w-full lg:w-1/4 flex flex-col bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/50">
           <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-800 pb-2 mb-4">Equipes do Grupo</h3>
           <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
             Arraste os logos dos times para o mapa quantas vezes desejar para simular estratégias de quedas contra a LOUD!
             <br/><br/>
             💡 <strong>Dica:</strong> Dê duplo-clique em qualquer logo no mapa para removê-lo.
           </p>
           
           <div className="flex flex-wrap gap-2 lg:gap-3 max-h-[300px] lg:max-h-[500px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
             {loudGroupTeams.map(team => {
               const placedCount = currentPositions.filter(p => p.teamId === team.id).length;
               
               return (
                 <div
                    id={`pool-item-${team.id}`}
                    key={team.id}
                    draggable
                    onDragStart={(e) => handleDragStartFromPool(e, team.id)}
                    className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border border-neutral-800 bg-neutral-900 cursor-grab active:cursor-grabbing hover:border-lime-500/50 transition-colors flex-1 min-w-[70px] sm:min-w-[80px] max-w-[100px] ${team.name === 'LOUD' ? 'ring-2 ring-lime-500 bg-lime-950/20' : ''}`}
                 >
                   {/* Placed quantity indicator badge */}
                   {placedCount > 0 && (
                     <span className="absolute -top-1.5 -right-1.5 bg-lime-500 text-black text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center border border-black shadow z-20 animate-scaleIn">
                       {placedCount}
                     </span>
                   )}

                   <div className={`w-10 h-10 rounded-full bg-black flex items-center justify-center overflow-hidden border border-neutral-700 p-1 ${team.name === 'LOUD' ? 'border-lime-500' : ''}`}>
                     {team.logoUrl ? (
                       <img src={team.logoUrl} alt={team.name} referrerPolicy="no-referrer" className="w-full h-full object-contain drop-shadow-md" draggable={false} />
                     ) : (
                       <span className="text-sm font-bold">{team.flag}</span>
                     )}
                   </div>
                   <span className={`text-[10px] font-bold text-center uppercase truncate w-full ${team.name === 'LOUD' ? 'text-lime-400' : 'text-neutral-300'}`} title={team.name}>{team.initials}</span>
                 </div>
               );
             })}
           </div>
        </div>
      </div>
    </div>
  );
}

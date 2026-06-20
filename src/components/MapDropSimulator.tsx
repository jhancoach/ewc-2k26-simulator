import React, { useState } from 'react';
import { Trash2, HelpCircle, CornerDownRight, RotateCcw } from 'lucide-react';
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
    <div 
      id="simulador-quedas" 
      className="mt-16 border border-neutral-800/80 bg-[#0E0B0A] rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-[0_0_60px_rgba(255,80,0,0.06)] relative overflow-hidden"
    >
      {/* Decorative premium accents matching Esports World Cup Free Fire branding */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#FF5000] to-transparent opacity-80" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FFD000]/10 via-[#FF5000]/5 to-transparent pointer-events-none rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-44 h-44 bg-gradient-to-tr from-[#FF5000]/5 to-transparent pointer-events-none rounded-tr-full" />

      {/* Header section with tournament flair */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 relative z-10">
        <div className="flex items-center gap-4 text-center md:text-left self-stretch md:self-auto">
          {/* Futuristic glowing mark */}
          <div className="hidden sm:flex w-16 h-16 items-center justify-center filter drop-shadow-[0_0_15px_rgba(255,80,0,0.3)] shrink-0">
            <img 
              src="https://i.ibb.co/Xrsj11wz/LOGO-EWC.png" 
              alt="EWC Logo Mini" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain pointer-events-none" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className="text-[10px] bg-gradient-to-r from-[#FF5000] to-[#FFD000] text-black px-2 py-0.5 rounded font-black uppercase tracking-widest">MAP DROPS</span>
              <span className="text-[10px] text-[#FFD000] font-mono tracking-widest font-black uppercase">LIVE SECTOR</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase mt-1">
              Simulador de Quedas <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5000] via-[#FF9000] to-[#FFD000] filter drop-shadow-[0_2px_10px_rgba(255,80,0,0.2)]">Free Fire EWC</span>
            </h2>
          </div>
        </div>

        {currentPositions.length > 0 && (
          <button
            id="btn-limpar-mapa"
            onClick={handleClearMap}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-black text-xs tracking-widest uppercase bg-gradient-to-r from-[#FF5000]/10 to-[#FFD000]/5 border border-[#FF5000]/40 text-[#FF5000] hover:text-white hover:bg-gradient-to-r hover:from-[#FF5000] hover:to-[#FFD000] transition-all hover:border-transparent hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,80,0,0.1)] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar Quedas
          </button>
        )}
      </div>

      {/* Map selector with EWC skewed tab elements */}
      <div className="flex flex-wrap gap-3 mb-8 justify-center sm:justify-start relative z-10">
        {MAPS.map(m => {
          const isActive = activeMap === m.id;
          return (
            <button
              id={`btn-map-${m.id}`}
              key={m.id}
              onClick={() => setActiveMap(m.id)}
              className="relative cursor-pointer transition-all duration-300 transform active:scale-95 focus:outline-none"
            >
              {/* Outer skewed container */}
              <div className={`skew-x-[-12deg] px-5 py-2.5 border transition-all duration-300 font-extrabold ${
                isActive 
                  ? 'bg-gradient-to-r from-[#FF5000] to-[#FFD000] border-transparent shadow-[0_0_25px_rgba(255,80,0,0.35)] scale-105' 
                  : 'bg-[#120F0E] text-neutral-400 hover:text-white hover:border-[#FF5000]/60 border-neutral-800'
              }`}>
                {/* Desewed text inside to prevent text distortion */}
                <span className="block skew-x-[12deg] text-xs font-black tracking-widest uppercase">
                  {m.name}
                </span>
              </div>
              {isActive && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#FFD000] rounded-full blur-[1px] animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 relative z-10">
        {/* Map Area */}
        <div 
          id="mapa-drag-area"
          className="relative w-full lg:w-[72%] aspect-[16/10] bg-[#070505] rounded-2xl overflow-hidden border-2 border-[#1E1B1A] shadow-[0_15px_40px_rgba(0,0,0,0.8)] cursor-crosshair group/map"
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onDrop={handleDrop}
        >
          <img 
            src={currentMap.url} 
            alt={currentMap.name} 
            className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85 transition-all duration-500 group-hover/map:scale-[1.01]" 
          />
          
          {/* Subtle overlay grid lines & sci-fi scanning effect to mimic EWC game hubs */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-[60px] bg-gradient-to-b from-[#FF5000]/5 to-transparent pointer-events-none" />

          {/* Placed Teams */}
          {currentPositions.map(placedItem => {
            const team = loudGroupTeams.find(t => t.id === placedItem.teamId);
            if (!team) return null;

            const isLoud = team.name === 'LOUD';

            return (
              <div 
                id={`placed-${placedItem.id}`}
                key={placedItem.id}
                draggable
                onDragStart={(e) => handleDragStartFromMap(e, placedItem.id, team.id)}
                className="absolute w-10 h-10 sm:w-12 sm:h-12 cursor-grab active:cursor-grabbing z-20 transition-transform duration-200 hover:scale-130 hover:z-40 group/m_item"
                style={{ left: `${placedItem.x}%`, top: `${placedItem.y}%`, transform: 'translate(-50%, -50%)' }}
                onDoubleClick={() => handleRemoveFromMap(placedItem.id)}
                title={`${team.name} (Dois cliques para remover)`}
              >
                {/* Visual marker: Green glow for LOUD vs Orange glow for others with premium EWC styling */}
                <div className={`w-full h-full rounded-full flex items-center justify-center text-sm font-bold border-2 transition-transform duration-300 ${
                  isLoud 
                    ? 'border-[#22c55e] bg-lime-950/95 text-lime-400 shadow-[0_0_20px_rgba(34,197,94,0.9)] scale-110' 
                    : 'border-[#FF5000] bg-[#120F0E]/95 hover:border-[#FFD000] shadow-[0_0_15px_rgba(255,80,0,0.7)]'
                } overflow-hidden relative backdrop-blur-sm`}>
                  
                  {team.logoUrl ? (
                    <img 
                      src={team.logoUrl} 
                      alt={team.name} 
                      referrerPolicy="no-referrer" 
                      className="w-full h-full object-contain p-1 z-10 relative drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-black/40" 
                      draggable={false} 
                    />
                  ) : (
                    <span className="z-10 relative text-xs text-white font-mono">{team.initials}</span>
                  )}

                  {/* Corner Sci-fi Reticles inside LOUD logo */}
                  {isLoud && (
                    <span className="absolute inset-x-0 bottom-0.5 text-[8px] text-center font-black text-[#22c55e] z-20 font-mono tracking-widest scale-90 select-none">
                      LOUD
                    </span>
                  )}
                </div>

                {/* Ping wave animation for placement realism */}
                <span className={`absolute -inset-1 rounded-full animate-ping opacity-45 pointer-events-none duration-1000 ${
                  isLoud ? 'bg-[#22c55e]/20' : 'bg-[#FF5000]/20'
                }`} />
                
                {/* Custom glowing tag below marker */}
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-widest text-white bg-[#0E0B0A] border border-[#1E1B1A]/80 px-2 py-0.5 rounded opacity-0 group-hover/m_item:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center gap-1">
                   <span className={isLoud ? 'text-[#22c55e]' : 'text-[#FFD000]'}>{team.name}</span>
                   <span className="text-red-500 text-[10px] font-bold">×2 Click</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* EWC Theme Teams Pool Panel */}
        <div id="pool-times-container" className="w-full lg:w-[28%] flex flex-col bg-[#110E0E] p-5 rounded-2xl border border-[#1D1817]">
           <h3 className="text-sm font-black text-[#FFD000] uppercase tracking-widest border-b border-neutral-800 pb-3.5 mb-4 flex items-center gap-2">
             <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#FF5000] to-[#FFD000] animate-pulse" />
             Equipes Disponíveis
           </h3>
           <p className="text-xs text-neutral-400 mb-4 leading-relaxed font-semibold">
             Monte táticas de queda! Arraste os times para marcar múltiplas posições no mapa.
           </p>

           <div className="bg-[#191514] p-3 rounded-xl border border-[#2E2421]/60 mb-5 text-[11px] text-neutral-300 leading-relaxed flex items-start gap-2.5">
             <HelpCircle className="w-4 h-4 text-[#FF5000] shrink-0 mt-0.5" />
             <div className="font-medium">
               <strong className="text-white block mb-0.5">Duplicação de Logos:</strong>
               Você pode arrastar o mesmo time várias vezes no mapa para simular diferentes rotas e cruzamentos de jogo.
             </div>
           </div>
           
           <div className="flex flex-wrap gap-2.5 max-h-[300px] lg:max-h-[440px] overflow-y-auto pr-1 pb-2 custom-scrollbar">
             {loudGroupTeams.map(team => {
               const placedCount = currentPositions.filter(p => p.teamId === team.id).length;
               const isLoud = team.name === 'LOUD';
               
               return (
                 <div
                    id={`pool-item-${team.id}`}
                    key={team.id}
                    draggable
                    onDragStart={(e) => handleDragStartFromPool(e, team.id)}
                    className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border cursor-grab active:cursor-grabbing hover:shadow-[0_0_15px_rgba(255,80,0,0.15)] transition-all flex-1 min-w-[70px] sm:min-w-[80px] max-w-[100px] select-none ${
                      isLoud 
                        ? 'border-[#22c55e] bg-lime-950/15 shadow-[0_0_12px_rgba(34,197,94,0.05)] hover:border-[#42f572]' 
                        : 'border-[#1E1B1A] bg-[#151211] hover:border-[#FF5000]'
                    }`}
                 >
                   {/* Placed indicator badge utilizing Free Fire red/amber warning styling */}
                   {placedCount > 0 && (
                     <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-[#FF5000] to-[#FFD000] text-black text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center border border-[#0E0B0A] shadow-[0_2px_8px_rgba(255,80,0,0.5)] z-20 animate-scaleIn">
                       {placedCount}
                     </span>
                   )}

                   <div className={`w-10 h-10 rounded-full bg-black flex items-center justify-center overflow-hidden border p-1 ${
                     isLoud ? 'border-[#22c55e]' : 'border-neutral-800'
                   }`}>
                     {team.logoUrl ? (
                       <img src={team.logoUrl} alt={team.name} referrerPolicy="no-referrer" className="w-full h-full object-contain drop-shadow-md" draggable={false} />
                     ) : (
                       <span className="text-xs font-mono font-black text-white">{team.initials}</span>
                     )}
                   </div>
                   <span className={`text-[10px] font-black text-center uppercase tracking-wider truncate w-full ${
                     isLoud ? 'text-[#22c55e]' : 'text-neutral-400'
                   }`} title={team.name}>
                     {team.initials}
                   </span>
                 </div>
               );
             })}
           </div>
        </div>
      </div>

      {/* Elegant informative tutorial footer */}
      <div className="mt-6 pt-5 border-t border-[#1C1817] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-medium">
         <div className="flex items-center gap-2">
            <CornerDownRight className="w-4 h-4 text-[#FF5000] shrink-0" />
            <span>As quedas salvas são salvas e persistidas de forma independente para cada mapa do simulador.</span>
         </div>
         <span className="font-mono text-[10px] text-[#FFD000]/60 uppercase tracking-widest">FF ESPORTS WORLD CUP SECTOR</span>
      </div>
    </div>
  );
}

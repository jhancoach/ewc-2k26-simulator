import { useState, useCallback, useMemo, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCw, Play, Shuffle, GripVertical } from 'lucide-react';
import { DEFAULT_POOLS } from './data/mockTeams';
import { PROTOTYPE_POOLS } from './data/protoTeams';
import { Group, Team, Pool } from './types';
import { MapDropSimulator } from './components/MapDropSimulator';

// Backtracking solver
const solveDraw = (teamsToPlace: Team[], currentGroups: Group[], teamToPoolId: Record<string, string>): Group[] | null => {
  const groupsState = currentGroups.map(g => ({ ...g, teams: [...g.teams] }));

  // Pre-calculate pool sizes from the current setup
  const poolSizes: Record<string, number> = {};
  Object.values(teamToPoolId).forEach(pId => {
    poolSizes[pId] = (poolSizes[pId] || 0) + 1;
  });

  const solve = (teamIndex: number): boolean => {
    if (teamIndex === teamsToPlace.length) return true;

    const team = teamsToPlace[teamIndex];
    const poolId = teamToPoolId[team.id];
    const maxAllowed = Math.ceil((poolSizes[poolId] || 0) / 2);

    const groupIndices = [0, 1].sort(() => Math.random() - 0.5);
    for (const gIdx of groupIndices) {
      const g = groupsState[gIdx];
      if (g.teams.length < 12) {
        const countFromThisPool = g.teams.filter(t => teamToPoolId[t.id] === poolId).length;
        if (countFromThisPool < maxAllowed) {
          g.teams.push(team);
          if (solve(teamIndex + 1)) {
            return true;
          }
          g.teams.pop();
        }
      }
    }
    return false;
  };

  if (solve(0)) {
    return groupsState;
  }
  return null;
};

const TeamCard = ({ team, sourceType, sourceId, onDragStart, badge }: { team: Team, sourceType: 'pool' | 'group', sourceId: string, onDragStart: (e: DragEvent, team: Team, sourceId: string, sourceType: 'pool' | 'group') => void, key?: string, badge?: string }) => {
  return (
    <motion.div
      layoutId={team.id}
      draggable
      onDragStart={(e: any) => onDragStart(e, team, sourceId, sourceType)}
      className="group relative flex items-center bg-black border border-neutral-800 rounded-xl p-2 cursor-grab active:cursor-grabbing hover:border-[#FF5000]/50 hover:shadow-[0_0_15px_rgba(255,80,0,0.15)] transition-all overflow-hidden bg-opacity-90 backdrop-blur-sm z-10"
    >
      <div className={`absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b ${team.logoBg}`} />

      {badge && (
        <div className="absolute top-0 right-0 bg-neutral-900 border-l border-b border-neutral-800 text-[#FFD000] font-mono font-black text-[9px] px-2 py-0.5 rounded-bl shadow-sm z-20">
          {badge}
        </div>
      )}

      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-neutral-900 flex items-center justify-center text-sm sm:text-lg font-bold ml-2 border border-neutral-800 overflow-hidden relative shadow-inner">
        <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${team.logoBg}`} />
        {team.logoUrl ? (
          <img src={team.logoUrl} alt={team.name} referrerPolicy="no-referrer" className="w-full h-full object-contain p-1.5 z-10 relative drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
        ) : (
          <span className="z-10 relative">{team.flag}</span>
        )}
      </div>

      <div className="ml-3 flex-1 overflow-hidden">
        <div className="font-bold text-sm sm:text-base text-neutral-200 truncate leading-tight">{team.name}</div>
        <div className="text-[10px] sm:text-xs text-neutral-500 font-medium truncate uppercase mt-0.5">{team.region}</div>
      </div>

      <div className="hidden sm:flex px-2 py-1 bg-neutral-950 rounded-md text-[10px] font-mono font-bold text-neutral-400 border border-neutral-800 group-hover:border-[#FF5000]/40 group-hover:text-[#FFD000] transition-colors mr-2">
        {team.initials}
      </div>
      <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-700 mr-1 opacity-50 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

export default function App() {
  const [activeMode, setActiveMode] = useState<'official' | 'prototype'>('official');

  const initialPoolsForMode = useCallback((mode: 'official' | 'prototype') => {
    const source = mode === 'official' ? DEFAULT_POOLS : PROTOTYPE_POOLS;
    return source.filter(p => p.isActive).map(p => ({ ...p, teams: [...p.teams] }));
  }, []);

  const [pools, setPools] = useState<Pool[]>(() => initialPoolsForMode('official'));
  const [groups, setGroups] = useState<Group[]>([
    { id: 'A', name: 'GROUP A', teams: [] },
    { id: 'B', name: 'GROUP B', teams: [] },
  ]);

  const [isEditingPots, setIsEditingPots] = useState(false);

  const getOriginalTeamToPoolMap = useCallback((mode: 'official' | 'prototype') => {
    const map: Record<string, string> = {};
    const source = mode === 'official' ? DEFAULT_POOLS : PROTOTYPE_POOLS;
    source.forEach(p => {
      p.teams.forEach(t => {
        map[t.id] = p.id;
      });
    });
    return map;
  }, []);

  const [customTeamToPoolId, setCustomTeamToPoolId] = useState<Record<string, string>>(() => 
    getOriginalTeamToPoolMap('official')
  );

  const handleModeChange = (mode: 'official' | 'prototype') => {
    setActiveMode(mode);
    setIsEditingPots(false);
    setGroups([
      { id: 'A', name: 'GROUP A', teams: [] },
      { id: 'B', name: 'GROUP B', teams: [] },
    ]);
    setPools(initialPoolsForMode(mode));
    setCustomTeamToPoolId(getOriginalTeamToPoolMap(mode));
  };

  const resetDraw = () => {
    setGroups([
      { id: 'A', name: 'GROUP A', teams: [] },
      { id: 'B', name: 'GROUP B', teams: [] },
    ]);
    setPools(initialPoolsForMode(activeMode));
    setCustomTeamToPoolId(getOriginalTeamToPoolMap(activeMode));
  };

  const drawNextPool = () => {
    const nextPoolIndex = pools.findIndex(p => p.teams.length > 0);
    if (nextPoolIndex === -1) return;

    const unplacedTeams = pools.flatMap(p => p.teams);
    const result = solveDraw(unplacedTeams, groups, customTeamToPoolId);
    
    if (!result) {
      if (activeMode === 'official') {
        alert("Não é possível completar o sorteio com a configuração atual. Se você editou os potes, certifique-se de que cada um tenha exatamente 2 equipes!");
      } else {
        alert("Não é possível completar o sorteio com a configuração atual nessa distribuição de potes. Ajuste as equipes e tente novamente!");
      }
      return;
    }

    const poolToDraw = pools[nextPoolIndex];
    const nextGroups = [...groups.map(g => ({ ...g, teams: [...g.teams] }))];
    const nextPools = [...pools.map(p => ({ ...p, teams: [...p.teams] }))];

    for (const teamToPlace of poolToDraw.teams) {
      const targetGroupIndex = result.findIndex(g => g.teams.some(t => t.id === teamToPlace.id));
      if (targetGroupIndex !== -1) {
        nextGroups[targetGroupIndex].teams.push(teamToPlace);
      }
      const pIdx = nextPools.findIndex(p => p.id === poolToDraw.id);
      nextPools[pIdx].teams = nextPools[pIdx].teams.filter(t => t.id !== teamToPlace.id);
    }

    setGroups(nextGroups);
    setPools(nextPools);
  };

  const drawSingleTeam = () => {
    const nextPoolIndex = pools.findIndex(p => p.teams.length > 0);
    if (nextPoolIndex === -1) return;

    const unplacedTeams = pools.flatMap(p => p.teams);
    const result = solveDraw(unplacedTeams, groups, customTeamToPoolId);
    
    if (!result) {
      if (activeMode === 'official') {
        alert("Não é possível completar o sorteio com a configuração atual. Se você editou os potes, certifique-se de que cada um tenha exatamente 2 equipes!");
      } else {
        alert("Não é possível completar o sorteio com a configuração atual nessa distribuição de potes. Ajuste as equipes e tente novamente!");
      }
      return;
    }

    const poolToDraw = pools[nextPoolIndex];
    const teamToPlace = poolToDraw.teams[0];
    if (!teamToPlace) return;

    const nextGroups = [...groups.map(g => ({ ...g, teams: [...g.teams] }))];
    const nextPools = [...pools.map(p => ({ ...p, teams: [...p.teams] }))];

    const targetGroupIndex = result.findIndex(g => g.teams.some(t => t.id === teamToPlace.id));
    if (targetGroupIndex !== -1) {
      nextGroups[targetGroupIndex].teams.push(teamToPlace);
    }

    const pIdx = nextPools.findIndex(p => p.id === poolToDraw.id);
    nextPools[pIdx].teams = nextPools[pIdx].teams.filter(t => t.id !== teamToPlace.id);

    setGroups(nextGroups);
    setPools(nextPools);
  };

  const drawAll = () => {
    const unplacedTeams = pools.flatMap(p => p.teams);
    if (unplacedTeams.length === 0) return;

    const result = solveDraw(unplacedTeams, groups, customTeamToPoolId);
    if (!result) {
      if (activeMode === 'official') {
        alert("Não é possível completar o sorteio com a configuração atual. Se você editou os potes, certifique-se de que cada um tenha exatamente 2 equipes!");
      } else {
        alert("Não é possível completar o sorteio com a configuração atual nessa distribuição de potes. Ajuste as equipes e tente novamente!");
      }
      return;
    }

    setGroups(result);
    setPools(pools.map(p => ({ ...p, teams: [] })));
  };

  const handleSwapPoolTeams = (poolId: string) => {
    setPools(prev => prev.map(p => {
      if (p.id !== poolId) return p;
      if (p.teams.length < 2) return p;
      const [first, second] = p.teams;
      return {
        ...p,
        teams: [second, first]
      };
    }));
  };

  const allPlaced = pools.every(p => p.teams.length === 0);
  const nextPoolIndexToDraw = pools.findIndex(p => p.teams.length > 0);

  // Drag and Drop Logic
  const handleDragStart = (e: DragEvent, team: Team, sourceId: string, sourceType: 'pool' | 'group') => {
    e.dataTransfer.setData('teamId', team.id);
    e.dataTransfer.setData('sourceId', sourceId);
    e.dataTransfer.setData('sourceType', sourceType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropToGroup = (e: DragEvent, targetGroupId: string) => {
    e.preventDefault();
    const teamId = e.dataTransfer.getData('teamId');
    const sourceId = e.dataTransfer.getData('sourceId');
    const sourceType = e.dataTransfer.getData('sourceType') as 'pool' | 'group';

    let team: Team | undefined;
    if (sourceType === 'pool') {
      const p = pools.find(p => p.id === sourceId);
      team = p?.teams.find(t => t.id === teamId);
    } else {
      const g = groups.find(g => g.id === sourceId);
      team = g?.teams.find(t => t.id === teamId);
    }

    if (!team) return;

    const targetGroup = groups.find(g => g.id === targetGroupId)!;
    if (sourceType === 'group' && sourceId === targetGroupId) return;
    
    if (targetGroup.teams.length >= 12) {
      alert('Grupo cheio!');
      return;
    }

    const poolId = customTeamToPoolId[team.id];

    // Precalculate total size of this pool in customTeamToPoolId mapping
    let poolSize = 0;
    Object.values(customTeamToPoolId).forEach(pId => {
      if (pId === poolId) poolSize++;
    });

    const maxAllowed = Math.ceil(poolSize / 2);
    const countInTargetGroup = targetGroup.teams.filter(t => t.id !== teamId && customTeamToPoolId[t.id] === poolId).length;

    if (countInTargetGroup >= maxAllowed) {
      if (maxAllowed === 1) {
        alert('Não é permitido colocar dois times do mesmo pote no mesmo grupo!');
      } else {
        alert(`Não é permitido colocar mais do que ${maxAllowed} times das equipes do pote "${poolId}" no mesmo grupo!`);
      }
      return;
    }

    moveTeam(team, sourceType, sourceId, 'group', targetGroupId);
  };

  const handleDropToPool = (e: DragEvent, targetPoolId: string) => {
    e.preventDefault();
    const teamId = e.dataTransfer.getData('teamId');
    const sourceId = e.dataTransfer.getData('sourceId');
    const sourceType = e.dataTransfer.getData('sourceType') as 'pool' | 'group';

    let team: Team | undefined;
    if (sourceType === 'pool') {
      const p = pools.find(p => p.id === sourceId);
      team = p?.teams.find(t => t.id === teamId);
    } else {
      const g = groups.find(g => g.id === sourceId);
      team = g?.teams.find(t => t.id === teamId);
    }

    if (!team) return;

    if (isEditingPots) {
      // In edit mode: we allow moving any team to any pool!
      setCustomTeamToPoolId(prev => ({ ...prev, [team.id]: targetPoolId }));
      moveTeam(team, sourceType, sourceId, 'pool', targetPoolId);
    } else {
      // Normal mode: only return to original designated pool
      if (customTeamToPoolId[team.id] !== targetPoolId) {
         alert('Você só pode retornar o time para o seu pote original! Ative o "Modo Editar Potes" se quiser trocar o pote oficial das equipes.');
         return;
      }
      moveTeam(team, sourceType, sourceId, 'pool', targetPoolId);
    }
  };

  const moveTeam = (team: Team, sourceType: 'pool' | 'group', sourceId: string, destType: 'pool' | 'group', destId: string) => {
    if (sourceType === destType && sourceId === destId) return;

    if (sourceType === 'pool') {
      setPools(prev => prev.map(p => p.id === sourceId ? { ...p, teams: p.teams.filter(t => t.id !== team.id) } : p));
    } else {
      setGroups(prev => prev.map(g => g.id === sourceId ? { ...g, teams: g.teams.filter(t => t.id !== team.id) } : g));
    }

    if (destType === 'pool') {
      setPools(prev => prev.map(p => p.id === destId ? { ...p, teams: [...p.teams, team] } : p));
    } else {
      setGroups(prev => prev.map(g => g.id === destId ? { ...g, teams: [...g.teams, team] } : g));
    }
  };

  const loudGroup = groups.find(g => g.teams.some(t => t.name === 'LOUD'));
  const loudGroupTeams = loudGroup ? loudGroup.teams : [];

  return (
    <div className="min-h-screen bg-[#070505] text-white font-sans selection:bg-[#FF5000]/30 pb-20 relative overflow-hidden">
      {/* Dynamic atmospheric ambient background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#FF5000]/5 via-[#FFD000]/2 to-transparent pointer-events-none blur-[100px] rounded-full z-0" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[#139BE9]/5 via-transparent to-transparent pointer-events-none blur-[150px] rounded-full z-0" />

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col relative z-10">

        {/* Header */}
        <header className="flex flex-col items-center justify-center mb-6 space-y-4">
          <div className="flex items-center justify-center mb-2 filter drop-shadow-[0_0_30px_rgba(255,80,0,0.25)]">
            <img 
              src="https://i.ibb.co/Xrsj11wz/LOGO-EWC.png" 
              alt="EWC Logo" 
              referrerPolicy="no-referrer" 
              className="w-28 h-28 sm:w-36 sm:h-36 object-contain hover:scale-105 transition-transform duration-300 pointer-events-none" 
            />
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl sm:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#FAFAFA] via-[#FFD000] to-[#FF5000] uppercase font-mono filter drop-shadow-[0_4px_12px_rgba(255,80,0,0.15)] leading-none">
              EWC 2026 Simulator
            </h1>
            <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-[#FF5000] to-transparent mx-auto mt-3" />
          </div>

          <p className="text-xs sm:text-sm text-neutral-400 font-semibold max-w-lg text-center tracking-wide leading-relaxed pt-1">
            {activeMode === 'official' 
              ? 'Simulador do Sorteio Oficial de Grupos • Regra Oficial: Equipes do mesmo pote não podem cair no mesmo grupo. Arraste ou use o sorteador automático.'
              : 'Simulação Protótipo • Regra Especial: Equipes de potes variados balanceados de forma equivalente e sem conflito de sementes entre grupos.'}
          </p>
        </header>

        {/* Tab Selector Pages */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-[#0C0908] border border-[#1E1512] p-1.5 rounded-2xl gap-2 backdrop-blur-md shadow-lg relative">
            <button
              onClick={() => handleModeChange('official')}
              className={`group relative cursor-pointer font-black text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 px-5 sm:px-6 py-2.5 rounded-xl flex items-center gap-1.5 focus:outline-none ${
                activeMode === 'official'
                  ? 'bg-gradient-to-r from-[#FF5000] to-[#FF8000] text-black font-extrabold shadow-[0_0_20px_rgba(255,80,0,0.25)] scale-[1.02]'
                  : 'text-neutral-400 hover:text-white hover:bg-[#150F0D]'
              }`}
            >
              <span>🏁 Sorteio Oficial (EWC)</span>
            </button>
            <button
              onClick={() => handleModeChange('prototype')}
              className={`group relative cursor-pointer font-black text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 px-5 sm:px-6 py-2.5 rounded-xl flex items-center gap-1.5 focus:outline-none ${
                activeMode === 'prototype'
                  ? 'bg-gradient-to-r from-[#FFD000] to-[#FFA000] text-black font-extrabold shadow-[0_0_20px_rgba(255,208,0,0.25)] scale-[1.02]'
                  : 'text-neutral-400 hover:text-white hover:bg-[#150F0D]'
              }`}
            >
              <span>🧪 Simulação Protótipo</span>
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-4">
          {!allPlaced ? (
            <>
              {/* PRIMARY ACTION: DRAW A SINGLE TEAM ONE-BY-ONE */}
              <button
                onClick={drawSingleTeam}
                title="Sortear um time de cada vez para os grupos"
                className="group relative cursor-pointer focus:outline-none transition-transform active:scale-95 duration-200 animate-pulse hover:animate-none"
              >
                <div className="skew-x-[-10deg] bg-gradient-to-r from-[#FF5000] via-[#FF8000] to-[#FFD000] text-black font-black text-xs sm:text-sm tracking-widest uppercase px-5 sm:px-6 py-3.5 flex items-center gap-2.5 shadow-[0_0_25px_rgba(255,80,0,0.35)] hover:shadow-[0_0_35px_rgba(255,80,0,0.6)] transition-all">
                  <Play className="w-4 h-4 fill-black skew-x-[10deg]" />
                  <span className="skew-x-[10deg]">🎯 Sortear 1 Equipe</span>
                </div>
              </button>

              {/* SECONDARY ACTION: DRAW THE REST OF THE POT AT ONCE */}
              <button
                onClick={drawNextPool}
                title="Sortear todas as equipes do pote atual de uma vez só"
                className="group relative cursor-pointer focus:outline-none transition-transform active:scale-95 duration-200"
              >
                <div className="skew-x-[-10deg] bg-[#110E0D] hover:bg-[#1E1715] text-[#FAFAFA] border border-[#FF5000]/40 hover:border-[#FF5000] font-bold text-xs sm:text-sm tracking-widest uppercase px-5 sm:px-6 py-3.5 flex items-center gap-2 transition-all">
                  <span className="skew-x-[10deg]">🗳️ Sortear Pote {nextPoolIndexToDraw !== -1 ? `${nextPoolIndexToDraw + 1}/${pools.length}` : ''}</span>
                </div>
              </button>

              {/* TERTIARY ACTION: DRAW ALL REMAINING TEAMS */}
              <button
                onClick={drawAll}
                title="Completar todo o sorteio automaticamente"
                className="group relative cursor-pointer focus:outline-none transition-transform active:scale-95 duration-200"
              >
                <div className="skew-x-[-10deg] bg-[#110E0D] hover:bg-[#1C1715] text-[#FFD000] border border-[#FFD000]/30 hover:border-[#FFD000] font-bold text-xs sm:text-sm tracking-widest uppercase px-5 sm:px-6 py-3.5 flex items-center gap-2 transition-all">
                  <Shuffle className="w-4 h-4 skew-x-[10deg] text-[#FFD000]" />
                  <span className="skew-x-[10deg]">Sorteio Direto</span>
                </div>
              </button>
            </>
          ) : (
            <div className="skew-x-[-10deg] bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] px-6 py-3.5 rounded text-xs tracking-wider font-extrabold uppercase bg-neutral-950/80">
              <span className="block skew-x-[10deg]">🎉 Sorteio Concluído com Sucesso!</span>
            </div>
          )}
          
          <button
            onClick={resetDraw}
            className="group relative cursor-pointer focus:outline-none transition-transform active:scale-95 duration-200 ml-auto"
          >
            <div className="skew-x-[-10deg] bg-gradient-to-r from-red-950/60 to-red-900/40 border border-red-800/60 hover:from-red-900/80 hover:to-red-800/60 text-red-100 hover:text-white font-black text-xs sm:text-sm tracking-widest uppercase px-5 py-3.5 flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(220,38,38,0.1)]">
              <RefreshCw className="w-4 h-4 skew-x-[10deg]" />
              <span className="skew-x-[10deg] hidden sm:inline">Reiniciar Sorteio</span>
            </div>
          </button>
        </div>
        
        {/* Main Columns Container */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-16 items-start">
          
          {/* Groups Box (col-span-8 on desktop) */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {groups.map((group) => (
                <div key={group.id} className="flex flex-col">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="text-lg sm:text-xl font-black tracking-widest text-[#FAFAFA] flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-[#FF5000] to-[#FFD000] rotate-45" />
                      {group.name}
                    </h2>
                    <div className="text-xs font-mono font-black text-[#FFD000] tracking-wider bg-[#130E0D] px-3.5 py-1.5 rounded-lg border border-[#3E2B24]">
                      {group.teams.length} / 12 EQUIPES
                    </div>
                  </div>

                  <div 
                    className={`flex-1 bg-[#100C0B]/90 backdrop-blur-md border border-[#1C1613] rounded-3xl p-5 flex flex-col gap-3 min-h-[500px] shadow-[0_0_30px_rgba(255,80,0,0.015)] transition-all duration-300 ${group.teams.length < 12 ? 'hover:border-[#FF5000]/30 hover:shadow-[0_0_20px_rgba(255,80,0,0.04)]' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                    onDrop={(e) => handleDropToGroup(e, group.id)}
                  >
                    {group.teams.map((team) => (
                       <TeamCard 
                         key={team.id} 
                         team={team} 
                         sourceType="group" 
                         sourceId={group.id} 
                         onDragStart={handleDragStart} 
                       />
                    ))}
                    
                    {group.teams.length === 0 && (
                      <div className="flex-1 flex items-center justify-center p-4">
                        <span className="text-neutral-600 font-black text-xs tracking-widest uppercase text-center border-2 border-dashed border-[#241A16] p-8 rounded-2xl w-full h-full flex items-center justify-center min-h-[200px]">
                          Arraste e solte as equipes aqui
                        </span>
                      </div>
                    )}
                    
                    {group.teams.length > 0 && Array.from({ length: Math.max(0, 12 - group.teams.length) }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="h-[60px] sm:h-[68px] border border-dashed border-[#1E1613] rounded-xl flex items-center justify-center bg-[#0C0908]/20"
                      >
                         <div className="text-[#382C27] text-xs font-mono font-black uppercase tracking-widest opacity-40">SLOT DISPONÍVEL</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pools Area (col-span-4 on desktop, nested in sticky sidebar wrapper) */}
          <div className="xl:col-span-4 xl:sticky xl:top-6 flex flex-col bg-[#100C0B]/90 border border-[#1C1613] p-5 sm:p-6 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)] w-full">
            <div className="flex items-center justify-between mb-4 px-1 gap-4">
              <h2 className="text-md sm:text-lg font-black tracking-widest text-[#FFD000] uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF5000] animate-pulse" />
                Potes de Semente
              </h2>
              
              <div className="text-xs font-black text-neutral-400 tracking-wider font-mono bg-[#0D0A09]/50 border border-[#241A16] px-3 py-1.5 rounded-lg shrink-0">
                 RESTANTES: <span className="text-[#FF5000]">{pools.reduce((acc, p) => acc + p.teams.length, 0)}</span>
              </div>
            </div>

            <div className="mb-4">
              <button
                onClick={() => setIsEditingPots(!isEditingPots)}
                className="group w-full relative cursor-pointer focus:outline-none transition-transform active:scale-95 duration-200"
              >
                <div className={`skew-x-[-10deg] border border-[#FF5000]/40 font-black text-xs tracking-widest uppercase py-2.5 flex items-center justify-center gap-1.5 transition-all ${
                  isEditingPots 
                    ? 'bg-[#FF5000] border-[#FF5000] text-black shadow-[0_0_20px_rgba(255,80,0,0.35)] font-black' 
                    : 'bg-[#110E0D] hover:bg-[#1C1715] text-[#FFD000] hover:text-[#FAFAFA]'
                }`}>
                  <span className="skew-x-[10deg] flex items-center gap-1">
                    {isEditingPots ? '⚙️ Salvar Configuração' : '✏️ Personalizar Potes'}
                  </span>
                </div>
              </button>
            </div>

            {isEditingPots && (
              <div className="mb-4 p-3.5 rounded-xl bg-[#1C120E]/40 border border-[#FF5000]/30 text-xs text-neutral-300 leading-relaxed font-semibold transition-all">
                <p className="flex items-center gap-1.5 text-[#FFD000] font-black uppercase tracking-wider mb-1">
                  <span>⚠️</span> Edição Ativa
                </p>
                Configure os potes. {activeMode === 'official' ? (
                  <>Mantenha <strong className="text-[#FAFAFA]">2 equipes por pote</strong>.</>
                ) : (
                  <>Distribuição livre das 24 equipes.</>
                )}
              </div>
            )}
            
            {/* Scrollable list of Pots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3 max-h-[64vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-800">
              {pools.map((pool, idx) => {
                const isCurrentDraw = idx === nextPoolIndexToDraw;
                const isEmpty = pool.teams.length === 0;
                
                return (
                  <div 
                    key={pool.id} 
                    className={`bg-[#0C0908]/90 border rounded-2xl p-3 flex flex-col gap-2.5 min-h-[100px] transition-all duration-300 ${
                      isCurrentDraw && !allPlaced 
                        ? 'border-[#FF5000]/70 bg-[#140E0C]/95 shadow-[0_0_15px_rgba(255,80,0,0.15)] scale-[1.01]' 
                        : 'border-[#1C1613] hover:border-neutral-700'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                    onDrop={(e) => handleDropToPool(e, pool.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`text-[10px] sm:text-xs font-black tracking-widest uppercase select-none pointer-events-none ${isCurrentDraw && !allPlaced ? 'text-[#FFD000]' : isEmpty ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        {pool.name}
                      </div>
                      {pool.teams.length >= 2 && (
                        <button
                          onClick={() => handleSwapPoolTeams(pool.id)}
                          title="Inverter ordem dos dois primeiros times"
                          className="py-1 px-1.5 rounded bg-[#1C1613] border border-[#2D211C] hover:border-[#FF5000] hover:text-[#FFD000] text-neutral-400 text-[9px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          <span>⇅ Inverter</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-1.5 flex-1 relative min-h-[40px]">
                      {pool.teams.map((team, tIdx) => (
                        <TeamCard 
                          key={team.id} 
                          team={team} 
                          sourceType="pool" 
                          sourceId={pool.id} 
                          onDragStart={handleDragStart} 
                          badge={`${tIdx + 1}º`}
                        />
                      ))}
                      
                      {isEmpty && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl">
                          <span className="text-neutral-600 font-mono font-black uppercase text-[9px] tracking-widest">Sorteado</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {loudGroupTeams.length > 0 && (
          <div className="mt-8 w-full">
            <MapDropSimulator loudGroupTeams={loudGroupTeams} />
          </div>
        )}

        {/* Tournament Format Info */}
        <div className="mt-16 border border-[#1C1613] bg-[#100C0B]/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FF5000]/5 to-transparent pointer-events-none" />
          
          <h2 className="text-xl sm:text-2xl font-black tracking-widest text-[#FAFAFA] mb-6 uppercase flex items-center gap-2 font-mono">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#FF5000]" />
            Formato do Torneio
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-neutral-400 text-sm leading-relaxed relative z-10">
            <div>
              <h3 className="text-[#FF5000] font-black uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5000]" />
                Fase de Grupos
              </h3>
              <p className="mb-3">
                A Fase de Grupos contará com um total de 24 equipes. Essas equipes serão divididas em dois (2) grupos.
              </p>
              <p className="mb-3">
                A Fase de Grupos terá duração de dois dias, com cada dia composto por 12 partidas. Isso totaliza 24 partidas na Fase de Grupos (12 partidas por Grupo). Os pontos de todas as 24 equipes serão tabulados em 2 tabelas (1 tabela por Grupo).
              </p>
              <p>
                As <strong>4 melhores equipes</strong> de cada Grupo na Fase de Grupos avançarão para a <span className="text-[#139BE9] font-bold">Fase Final</span>, as equipes que ficarem entre o <strong>5º e o 10º lugar</strong> em cada Grupo avançarão para a <span className="text-[#FFD000] font-bold">Fase de Sobrevivência</span>, enquanto as <strong>2 últimas equipes</strong> de cada Grupo serão <span className="text-red-500 font-bold">eliminadas</span>.
              </p>
            </div>
            
            <div>
              <h3 className="text-[#FFD000] font-black uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD000]" />
                Fase de Sobrevivência
              </h3>
              <p className="mb-3">
                As equipes da Fase de Sobrevivência são compostas pelas equipes que ficaram entre o 5º e o 10º lugar em cada um dos Grupos da Fase de Grupos.
              </p>
              <p className="mb-3">
                A Fase de Sobrevivência terá duração de um dia e será composta por 10 partidas. As <strong>4 melhores equipes</strong> da Fase de Sobrevivência avançarão para a <span className="text-[#139BE9] font-bold">Final</span>, enquanto as demais serão <span className="text-red-500 font-bold">eliminadas</span>.
              </p>
            </div>

            <div>
              <h3 className="text-[#139BE9] font-black uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#139BE9]" />
                Fase Final (Ponto de Partida)
              </h3>
              <ul className="list-disc pl-4 space-y-2 mb-3">
                <li>As equipes são compostas pelas <strong>4 melhores de cada Grupo</strong> + as <strong>4 melhores da Fase de Sobrevivência</strong>.</li>
                <li>Mecânica de <strong>"Ponto de Partida"</strong>: As equipes devem atingir um limite de <strong>90 pontos</strong> para serem elegíveis para se tornarem Campeãs. Assim que uma equipe atingir o limite e conseguir um Booyah! em seguida, ela será declarada vencedora.</li>
                <li>As equipes <strong>DEVEM</strong> atingir o limite primeiro para serem elegíveis.</li>
              </ul>
              <div className="bg-[#151211] p-3 rounded-xl border border-[#2E2421]/60 my-3 text-xs leading-relaxed">
                <strong className="text-white block mb-0.5">Exemplo:</strong> Se uma equipe conseguir um Booyah! e atingir o limite na mesma partida, isso não a tornará Campeã. Portanto, ela precisa conseguir outro Booyah!.
              </div>
              <p className="mb-2">
                A equipe que venceu o Ponto de Partida será coroada <span className="text-[#FFD000] font-black">Campeã</span> e as demais serão classificadas com base na Tabela de Líderes.
              </p>
              <p className="text-neutral-500 italic text-xs">
                * Não haverá limite máximo para o número de partidas que podem ser jogadas.
              </p>
            </div>
          </div>
        </div>

        {/* Tournament Schedule Info */}
        <div className="mt-8 border border-[#1C1613] bg-[#100C0B]/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FFD000]/3 to-transparent pointer-events-none" />

          <h2 className="text-xl sm:text-2xl font-black tracking-widest text-white mb-6 uppercase flex items-center gap-2 font-mono">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#FFD000]" />
            Calendário do Torneio
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-neutral-400 text-sm leading-relaxed relative z-10">
            <div className="bg-[#0A0707] p-5 rounded-2xl border border-neutral-900">
              <h3 className="text-[#FF5000] font-black uppercase tracking-wider mb-4 border-b border-neutral-900 pb-2 flex items-center gap-1.5">
                Fase de Grupos
              </h3>
              <div className="mb-4">
                <span className="text-white font-bold block mb-1">15 de julho</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Grupo A - Jogos 1 a 6</li>
                  <li>Grupo B - Jogos 1 a 6</li>
                </ul>
              </div>
              <div>
                <span className="text-white font-bold block mb-1">16 de julho</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Grupo A - Jogos 7 a 12</li>
                  <li>Grupo B - Jogos 7 a 12</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-[#0A0707] p-5 rounded-2xl border border-neutral-900">
              <h3 className="text-[#FFD000] font-black uppercase tracking-wider mb-4 border-b border-neutral-900 pb-2">
                Fase de Sobrevivência
              </h3>
              <div>
                <span className="text-white font-bold block mb-1">17 de julho</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Fase de Sobrevivência - Jogos 1 a 10</li>
                </ul>
              </div>
            </div>

            <div className="bg-[#0A0707] p-5 rounded-2xl border border-neutral-900">
              <h3 className="text-[#139BE9] font-black uppercase tracking-wider mb-4 border-b border-neutral-900 pb-2">
                Finais
              </h3>
              <div>
                <span className="text-white font-bold block mb-1">18 de julho</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Finais por Pontos de Partida - Jogo 1 até o Fim</li>
                </ul>
              </div>
            </div>
          </div>
          <p className="text-neutral-500 italic text-xs mt-6 text-center">
            Uma análise mais detalhada da programação será compartilhada com as equipes separadamente.
          </p>
        </div>

      </div>
    </div>
  );
}



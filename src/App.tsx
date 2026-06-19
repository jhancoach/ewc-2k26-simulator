import { useState, useCallback, useMemo, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCw, Play, Shuffle, GripVertical } from 'lucide-react';
import { DEFAULT_POOLS } from './data/mockTeams';
import { Group, Team, Pool } from './types';
import { MapDropSimulator } from './components/MapDropSimulator';

// Backtracking solver
const solveDraw = (teamsToPlace: Team[], currentGroups: Group[], teamToPoolId: Record<string, string>): Group[] | null => {
  const groupsState = currentGroups.map(g => ({ ...g, teams: [...g.teams] }));

  const solve = (teamIndex: number): boolean => {
    if (teamIndex === teamsToPlace.length) return true;

    const team = teamsToPlace[teamIndex];
    const poolId = teamToPoolId[team.id];

    const groupIndices = [0, 1].sort(() => Math.random() - 0.5);
    for (const gIdx of groupIndices) {
      const g = groupsState[gIdx];
      if (g.teams.length < 12) {
        const hasConflict = g.teams.some(t => teamToPoolId[t.id] === poolId);
        if (!hasConflict) {
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

const TeamCard = ({ team, sourceType, sourceId, onDragStart }: { team: Team, sourceType: 'pool' | 'group', sourceId: string, onDragStart: (e: DragEvent, team: Team, sourceId: string, sourceType: 'pool' | 'group') => void }) => {
  return (
    <motion.div
      layoutId={team.id}
      draggable
      onDragStart={(e: any) => onDragStart(e, team, sourceId, sourceType)}
      className="group relative flex items-center bg-black border border-neutral-800 rounded-xl p-2 cursor-grab active:cursor-grabbing hover:border-lime-500/40 hover:shadow-[0_0_15px_rgba(132,204,22,0.1)] transition-all overflow-hidden bg-opacity-90 backdrop-blur-sm z-10"
    >
      <div className={`absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b ${team.logoBg}`} />

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

      <div className="hidden sm:flex px-2 py-1 bg-neutral-950 rounded-md text-[10px] font-mono font-bold text-neutral-400 border border-neutral-800 group-hover:border-lime-500/30 group-hover:text-lime-300 transition-colors mr-2">
        {team.initials}
      </div>
      <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-700 mr-1 opacity-50 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

export default function App() {
  const initialPools = useMemo(() => DEFAULT_POOLS.filter(p => p.isActive).map(p => ({ ...p, teams: [...p.teams] })), []);
  
  const [pools, setPools] = useState<Pool[]>(initialPools);
  const [groups, setGroups] = useState<Group[]>([
    { id: 'A', name: 'GROUP A', teams: [] },
    { id: 'B', name: 'GROUP B', teams: [] },
  ]);

  const teamToPoolId = useMemo(() => {
    const map: Record<string, string> = {};
    DEFAULT_POOLS.forEach(p => {
      p.teams.forEach(t => {
        map[t.id] = p.id;
      });
    });
    return map;
  }, []);

  const resetDraw = () => {
    setGroups([
      { id: 'A', name: 'GROUP A', teams: [] },
      { id: 'B', name: 'GROUP B', teams: [] },
    ]);
    setPools(initialPools);
  };

  const drawNextPool = () => {
    const nextPoolIndex = pools.findIndex(p => p.teams.length > 0);
    if (nextPoolIndex === -1) return;

    const unplacedTeams = pools.flatMap(p => p.teams);
    const result = solveDraw(unplacedTeams, groups, teamToPoolId);
    
    if (!result) {
      alert("Não é possível completar o sorteio com a configuração atual. Mova algumas equipes ou reinicie.");
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

  const drawAll = () => {
    const unplacedTeams = pools.flatMap(p => p.teams);
    if (unplacedTeams.length === 0) return;

    const result = solveDraw(unplacedTeams, groups, teamToPoolId);
    if (!result) {
      alert("Não é possível completar o sorteio com a configuração atual. Mova algumas equipes ou reinicie.");
      return;
    }

    setGroups(result);
    setPools(pools.map(p => ({ ...p, teams: [] })));
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

    const poolId = teamToPoolId[team.id];
    const hasConflict = targetGroup.teams.some(t => t.id !== teamId && teamToPoolId[t.id] === poolId);
    if (hasConflict) {
      alert('Não é permitido colocar dois times do mesmo pote no mesmo grupo!');
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

    // Check if team belongs to this pool
    if (teamToPoolId[team.id] !== targetPoolId) {
       alert('Você só pode retornar o time para o seu pote original!');
       return;
    }

    moveTeam(team, sourceType, sourceId, 'pool', targetPoolId);
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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-lime-500/30 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col">

        {/* Header */}
        <header className="flex flex-col items-center justify-center mb-10 space-y-4">
          <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-lime-950/40 to-green-900/30 border border-lime-800/50 shadow-2xl shadow-lime-900/20 mb-2">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-lime-400" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-lime-400 to-green-500 text-center uppercase">
            EWC 2K26 Simulator
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 font-medium max-w-lg text-center tracking-wide">
            Sorteio Oficial de Grupos • Os times do mesmo pote não podem cair no mesmo grupo. Arraste e solte para configurar manualmente.
          </p>
        </header>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
          {!allPlaced ? (
            <>
              <button
                onClick={drawNextPool}
                className="group relative inline-flex items-center gap-2 px-6 py-3 font-black text-black bg-gradient-to-r from-lime-400 to-lime-500 rounded-full hover:from-lime-300 hover:to-lime-400 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-lime-400 shadow-lg shadow-lime-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5 fill-black" />
                <span>Sortear Próximo Pote {nextPoolIndexToDraw !== -1 ? `(${nextPoolIndexToDraw + 1}/${pools.length})` : ''}</span>
              </button>

              <button
                onClick={drawAll}
                className="group relative inline-flex items-center gap-2 px-6 py-3 font-bold text-lime-100 bg-neutral-900 rounded-full hover:bg-neutral-800 active:scale-95 transition-all border border-neutral-800 hover:border-lime-800/50 outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
              >
                <Shuffle className="w-5 h-5" />
                <span>Sortear Tudo</span>
              </button>
            </>
          ) : null}
          
          <button
              onClick={resetDraw}
              className="group relative inline-flex items-center gap-2 px-6 py-3 font-bold text-white bg-neutral-900 rounded-full hover:bg-neutral-800 active:scale-95 transition-all border border-neutral-800 hover:border-red-500/50 outline-none focus-visible:ring-2 focus-visible:ring-red-400 ml-auto"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="hidden sm:inline">Reiniciar</span>
          </button>
        </div>
        
        <div className="mb-10 text-center flex flex-col md:flex-row justify-center items-center gap-4">
          <div className="bg-lime-500/10 border border-lime-500/30 text-lime-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hidden sm:inline-block">
             1º ao 4º avançam para a Fase Final
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hidden sm:inline-block">
             5º ao 10º Fase de Sobrevivência
          </div>
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hidden sm:inline-block">
             11º e 12º Eliminados
          </div>
        </div>

        {/* Groups Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-16">
          {groups.map((group) => (
            <div key={group.id} className="flex flex-col">
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-xl font-black tracking-widest text-white">
                  {group.name}
                </h2>
                <div className="text-xs font-bold text-neutral-500 tracking-wider bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
                  {group.teams.length} / 12
                </div>
              </div>

              <div 
                className={`flex-1 bg-neutral-950/50 backdrop-blur-sm border border-neutral-800/60 rounded-3xl p-4 flex flex-col gap-3 min-h-[500px] shadow-[0_0_20px_rgba(132,204,22,0.02)] transition-colors ${group.teams.length < 12 ? 'hover:border-lime-500/20' : ''}`}
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
                    <span className="text-neutral-700 font-bold text-sm tracking-widest uppercase text-center border-2 border-dashed border-neutral-800/50 p-6 rounded-2xl w-full h-full flex items-center justify-center">Solte os times aqui</span>
                  </div>
                )}
                
                {group.teams.length > 0 && Array.from({ length: Math.max(0, 12 - group.teams.length) }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="h-[60px] sm:h-[68px] border border-dashed border-neutral-800/50 rounded-xl flex items-center justify-center bg-neutral-900/10"
                  >
                     <div className="text-neutral-800 text-xs font-bold uppercase tracking-widest opacity-50">Vazio</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pools Area */}
        <div className="border-t border-neutral-800/60 pt-10">
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-2xl font-black tracking-widest text-white">POTES</h2>
            <div className="text-sm font-bold text-neutral-500 tracking-wider">
               Equipes Restantes: {pools.reduce((acc, p) => acc + p.teams.length, 0)}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pools.map((pool, idx) => {
              const isCurrentDraw = idx === nextPoolIndexToDraw;
              const isEmpty = pool.teams.length === 0;
              
              return (
                <div 
                  key={pool.id} 
                  className={`bg-neutral-950/80 backdrop-blur-sm border rounded-2xl p-4 flex flex-col gap-3 min-h-[140px] transition-colors ${
                    isCurrentDraw && !allPlaced ? 'border-lime-500/50 shadow-[0_0_20px_rgba(132,204,22,0.1)]' : 'border-neutral-800/80 hover:border-neutral-700'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                  onDrop={(e) => handleDropToPool(e, pool.id)}
                >
                  <div className="flex items-center justify-between pointer-events-none">
                    <div className={`text-sm font-black tracking-widest ${isCurrentDraw && !allPlaced ? 'text-lime-400' : isEmpty ? 'text-neutral-600' : 'text-neutral-400'}`}>
                      {pool.name}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 flex-1 relative">
                    {pool.teams.map((team) => (
                      <TeamCard 
                        key={team.id} 
                        team={team} 
                        sourceType="pool" 
                        sourceId={pool.id} 
                        onDragStart={handleDragStart} 
                      />
                    ))}
                    
                    {isEmpty && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-neutral-800 font-bold uppercase text-xs tracking-widest">Sorteado</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {loudGroupTeams.length > 0 && (
          <MapDropSimulator loudGroupTeams={loudGroupTeams} />
        )}

        {/* Tournament Format Info */}
        <div className="mt-16 border border-neutral-800/80 bg-neutral-900/40 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
          <h2 className="text-xl sm:text-2xl font-black tracking-widest text-white mb-6 uppercase">
            Formato do Torneio
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-neutral-400 text-sm leading-relaxed">
            <div>
              <h3 className="text-lime-400 font-bold uppercase tracking-wider mb-3">Fase de Grupos</h3>
              <p className="mb-3">
                A Fase de Grupos contará com um total de 24 equipes. Essas equipes serão divididas em dois (2) grupos.
              </p>
              <p className="mb-3">
                A Fase de Grupos terá duração de dois dias, com cada dia composto por 12 partidas. Isso totaliza 24 partidas na Fase de Grupos (12 partidas por Grupo). Os pontos de todas as 24 equipes serão tabulados em 2 tabelas (1 tabela por Grupo).
              </p>
              <p>
                As <strong>4 melhores equipes</strong> de cada Grupo na Fase de Grupos avançarão para a <span className="text-cyan-400">Fase Final</span>, as equipes que ficarem entre o <strong>5º e o 10º lugar</strong> em cada Grupo avançarão para a <span className="text-yellow-300">Fase de Sobrevivência</span>, enquanto as <strong>2 últimas equipes</strong> de cada Grupo serão <span className="text-red-400">eliminadas</span>.
              </p>
            </div>
            
            <div>
              <h3 className="text-yellow-400 font-bold uppercase tracking-wider mb-3">Fase de Sobrevivência</h3>
              <p className="mb-3">
                As equipes da Fase de Sobrevivência são compostas pelas equipes que ficaram entre o 5º e o 10º lugar em cada um dos Grupos da Fase de Grupos.
              </p>
              <p className="mb-3">
                A Fase de Sobrevivência terá duração de um dia e será composta por 10 partidas. As <strong>4 melhores equipes</strong> da Fase de Sobrevivência avançarão para a <span className="text-cyan-400">Final</span>, enquanto as demais serão <span className="text-red-400">eliminadas</span>.
              </p>
            </div>

            <div>
              <h3 className="text-cyan-400 font-bold uppercase tracking-wider mb-3">Fase Final (Ponto de Partida)</h3>
              <ul className="list-disc pl-4 space-y-2 mb-3">
                <li>As equipes são compostas pelas <strong>4 melhores de cada Grupo</strong> + as <strong>4 melhores da Fase de Sobrevivência</strong>.</li>
                <li>Mecânica de <strong>"Ponto de Partida"</strong>: As equipes devem atingir um limite de <strong>90 pontos</strong> para serem elegíveis para se tornarem Campeãs. Assim que uma equipe atingir o limite e conseguir um Booyah! em seguida, ela será declarada vencedora.</li>
                <li>As equipes <strong>DEVEM</strong> atingir o limite primeiro para serem elegíveis.</li>
              </ul>
              <div className="bg-neutral-800/50 p-3 rounded-xl border border-neutral-700/50 my-3 text-xs">
                <strong>Exemplo:</strong> Se uma equipe conseguir um Booyah! e atingir o limite na mesma partida, isso não a tornará Campeã. Portanto, ela precisa conseguir outro Booyah!.
              </div>
              <p className="mb-2">
                A equipe que venceu o Ponto de Partida será coroada <span className="text-lime-300 font-bold">Campeã</span> e as demais serão classificadas com base na Tabela de Líderes.
              </p>
              <p className="text-neutral-500 italic text-xs">
                * Não haverá limite máximo para o número de partidas que podem ser jogadas.
              </p>
            </div>
          </div>
        </div>

        {/* Tournament Schedule Info */}
        <div className="mt-8 border border-neutral-800/80 bg-neutral-900/40 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
          <h2 className="text-xl sm:text-2xl font-black tracking-widest text-white mb-6 uppercase">
            Calendário do Torneio
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-neutral-400 text-sm leading-relaxed">
            <div className="bg-neutral-950/50 p-5 rounded-2xl border border-neutral-800/50">
              <h3 className="text-lime-400 font-bold uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2">Fase de Grupos</h3>
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
            
            <div className="bg-neutral-950/50 p-5 rounded-2xl border border-neutral-800/50">
              <h3 className="text-yellow-400 font-bold uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2">Fase de Sobrevivência</h3>
              <div>
                <span className="text-white font-bold block mb-1">17 de julho</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Fase de Sobrevivência - Jogos 1 a 10</li>
                </ul>
              </div>
            </div>

            <div className="bg-neutral-950/50 p-5 rounded-2xl border border-neutral-800/50">
              <h3 className="text-cyan-400 font-bold uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2">Finais</h3>
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



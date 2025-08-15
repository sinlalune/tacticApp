// Ce fichier définit le composant principal App de l'application React.
// Il gère l'état global, le panneau de contrôle, et le rendu de la scène 3D.

// ===============================
// Import des modules et définitions de types
// ===============================

// On importe React et ses hooks principaux :
// - useState : pour gérer l'état local (valeurs qui changent au fil du temps)
// - useMemo : pour optimiser les calculs et éviter les recalculs inutiles
// - useCallback : pour optimiser les fonctions et éviter de les recréer à chaque rendu
import React, { useState, useMemo, useCallback } from 'react';

// On importe le type Vector3 depuis la librairie three.js.
// TypeScript permet d'importer uniquement le type (mot-clé 'type') pour le typage des données 3D.
import type { Vector3 } from 'three';

// On importe le composant principal qui gère la scène 3D (terrain, joueurs, interactions).
import { SoccerScene } from './components/SoccerScene';

// On importe les données initiales des joueurs et la liste des rôles possibles.
import { INITIAL_PLAYERS, PLAYER_ROLES } from './constants';

// On importe les types pour le typage TypeScript :
// - Player : structure d'un joueur
// - TeamOptions : options d'affichage et de visualisation pour une équipe
// - PlayerRole : type pour le rôle d'un joueur
import type { Player, TeamOptions, PlayerRole } from './types';

// --- Composant d'icône d'information réutilisable ---
// Ce composant retourne du SVG (graphique vectoriel) pour afficher une icône d'information.
// Il est utilisé dans le panneau de contrôle pour illustrer les instructions.
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

// --- Composant de sélection de joueurs réutilisable ---
// Ce composant affiche une liste de cases à cocher pour sélectionner des joueurs.
// Il reçoit en props :
// - players : la liste des joueurs à afficher
// - selectedIds : les identifiants des joueurs sélectionnés
// - onTogglePlayer : fonction appelée quand on coche/décoche un joueur
interface PlayerSelectionListProps {
  players: Player[];
  selectedIds: string[];
  onTogglePlayer: (id: string) => void;
  /*
  ============================================================
    Introduction pédagogique : React et TypeScript dans ce projet
  ============================================================
  (Voir le bloc de commentaire dans le code pour une explication générale)
  */
}

// Définition du composant PlayerSelectionList avec les props typées.
// React.FC indique que c'est un composant fonctionnel React.
const PlayerSelectionList: React.FC<PlayerSelectionListProps> = ({ players, selectedIds, onTogglePlayer }) => (
  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto p-2 bg-gray-700 rounded-md border border-gray-600">
    {/* On affiche une liste de cases à cocher pour chaque joueur */}
    {players.map(player => (
      <div key={player.id} className="flex items-center">
        {/* Case à cocher pour sélectionner le joueur */}
        <input
          type="checkbox"
          id={`player-select-${player.id}`}
          checked={selectedIds.includes(player.id)}
          onChange={() => onTogglePlayer(player.id)}
          className="form-checkbox h-4 w-4 text-indigo-500 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500"
        />
        {/* Label affichant le numéro, le nom et le rôle du joueur */}
        <label htmlFor={`player-select-${player.id}`} className="ml-2 text-sm text-gray-300 select-none">
          {player.number} - {player.name} ({player.role})
        </label>
      </div>
    ))}
  </div>
);

// --- Composant du panneau de contrôle (ControlPanel) ---
// Ce composant affiche le panneau latéral pour modifier les options d'équipe, les joueurs, et les visualisations tactiques.
// Il reçoit en props :
// - players : liste des joueurs
// - selectedPlayerId : id du joueur sélectionné
// - teamAOptions / teamBOptions : options d'affichage pour chaque équipe
// - isNavLocked : état du verrouillage navigation
// - onPlayerUpdate : fonction pour modifier un joueur
// - onTeamOptionChange : fonction pour modifier les options d'une équipe
// - onTogglePlayerSelection : fonction pour sélectionner/désélectionner un joueur dans une visualisation
// - onSetNavLock : fonction pour changer le verrouillage navigation
interface ControlPanelProps {
  players: Player[];
  selectedPlayerId: string | null;
  teamAOptions: TeamOptions;
  teamBOptions: TeamOptions;
  isNavLocked: boolean;
  onPlayerUpdate: (id: string, updates: Partial<Player>) => void;
  onTeamOptionChange: (team: 'A' | 'B', updates: Partial<TeamOptions>) => void;
  onTogglePlayerSelection: (team: 'A' | 'B', feature: 'passingNet' | 'coveredArea', playerId: string) => void;
  onSetNavLock: (isLocked: boolean) => void;
}

// Définition du composant ControlPanel avec les props typées.
const ControlPanel: React.FC<ControlPanelProps> = ({
  players,
  selectedPlayerId,
  teamAOptions,
  teamBOptions,
  isNavLocked,
  onPlayerUpdate,
  onTeamOptionChange,
  onTogglePlayerSelection,
  onSetNavLock,
}) => {
  // On récupère le joueur sélectionné pour l'édition.
  // useMemo optimise le calcul : il ne recalcule que si players ou selectedPlayerId change.
  const selectedPlayer = useMemo(() => 
    players.find(p => p.id === selectedPlayerId), 
    [players, selectedPlayerId]
  );
  // On sépare les joueurs par équipe pour les contrôles spécifiques.
  const teamAPlayers = useMemo(() => players.filter(p => p.teamId === 'A'), [players]);
  const teamBPlayers = useMemo(() => players.filter(p => p.teamId === 'B'), [players]);

  // Gestion des changements sur les champs du joueur sélectionné (nom, numéro, rôle)
  // Cette fonction est appelée à chaque modification d'un champ du formulaire d'édition.
  const handlePlayerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!selectedPlayer) return; // Sécurité : si aucun joueur sélectionné, on ne fait rien.
    const { name, value } = e.target; // On récupère le nom du champ et sa valeur.
    // Si le champ est 'number', on convertit la valeur en nombre entier.
    const updateValue = name === 'number' ? parseInt(value, 10) || 0 : value;
    // On appelle la fonction de mise à jour du joueur avec la nouvelle valeur.
    onPlayerUpdate(selectedPlayer.id, { [name]: updateValue });
  };

  // Gestion des changements sur les options d'équipe (couleur, affichage, etc.)
  // Cette fonction est appelée à chaque modification d'un champ d'option d'équipe.
  const handleTeamChange = (team: 'A' | 'B', e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    // Si le champ est une case à cocher, on utilise checked, sinon value.
    onTeamOptionChange(team, { [name]: type === 'checkbox' ? checked : value });
  };

  // Le panneau de contrôle affiche :
  // - Les instructions d'utilisation
  // - Les options d'équipe (couleur, visualisations)
  // - L'édition du joueur sélectionné
  return (
    <div className="control-panel absolute top-0 right-0 h-full w-full max-w-sm bg-gray-900 bg-opacity-80 backdrop-blur-sm text-white p-4 overflow-y-auto shadow-2xl font-sans" style={{ isolation: 'isolate', zIndex: 100 }}>
      {/* Titre du panneau */}
      <h1 className="text-2xl font-bold text-center mb-4 border-b border-gray-600 pb-2">Tactic Board</h1>
      {/* Instructions et contrôles globaux */}
      <div className="bg-gray-800 rounded-lg p-3 mb-4">
        <h3 className="font-semibold mb-2">Controls</h3>
        {/* Liste des instructions d'utilisation */}
        <p className="text-sm text-gray-400 flex items-center"><InfoIcon /> Mouse: Left-click to rotate, Right-click to pan, Scroll to zoom.</p>
        <p className="text-sm text-gray-400 flex items-center"><InfoIcon /> Drag players on the field to move them.</p>
        <p className="text-sm text-gray-400 flex items-center"><InfoIcon /> Press Space to toggle navigation lock.</p>
        {/* Contrôle du verrouillage navigation */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
          <label htmlFor="lockNav" className="text-sm font-medium text-gray-300">Lock Navigation <span className="text-xs text-gray-500">(Space)</span></label>
          <input type="checkbox" id="lockNav" checked={isNavLocked} onChange={(e) => onSetNavLock(e.target.checked)} className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"/>
        </div>
      </div>
      {/* Contrôles d'équipe et édition de joueur suivent... */}
      {/* On affiche les contrôles pour chaque équipe (A et B) */}
      {[
        { id: 'A', name: 'Team A', options: teamAOptions, players: teamAPlayers, theme: 'blue' },
        { id: 'B', name: 'Team B', options: teamBOptions, players: teamBPlayers, theme: 'red' }
      ].map(team => (
        <div key={team.id} className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">{team.name}</h2>
          {/* Color Picker : permet de choisir la couleur de l'équipe */}
          <div className="flex items-center justify-between mb-3">
            <label htmlFor={`team${team.id}Color`} className="text-sm font-medium text-gray-300">Color</label>
            <input type="color" id={`team${team.id}Color`} name="color" value={team.options.color} onChange={(e) => handleTeamChange(team.id as 'A' | 'B', e)} className="w-8 h-8 p-0 border-none rounded bg-transparent" />
          </div>
          {/* Passing Net : affichage du réseau de passes */}
          <div className="flex items-center justify-between">
            <label htmlFor={`team${team.id}PassingNet`} className="text-sm font-medium text-gray-300">Show Passing Net</label>
            <input type="checkbox" id={`team${team.id}PassingNet`} name="showPassingNet" checked={team.options.showPassingNet} onChange={(e) => handleTeamChange(team.id as 'A' | 'B', e)} className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500" />
          </div>
          {/* Si le réseau de passes est activé, on affiche la sélection des joueurs */}
          {team.options.showPassingNet && (
            <PlayerSelectionList players={team.players} selectedIds={team.options.passingNetPlayerIds} onTogglePlayer={(pid) => onTogglePlayerSelection(team.id as 'A' | 'B', 'passingNet', pid)} />
          )}
          {/* Covered Area : affichage de la zone de couverture */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
            <label htmlFor={`team${team.id}CoveredArea`} className="text-sm font-medium text-gray-300">Show Covered Area</label>
            <input type="checkbox" id={`team${team.id}CoveredArea`} name="showCoveredArea" checked={team.options.showCoveredArea} onChange={(e) => handleTeamChange(team.id as 'A' | 'B', e)} className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500" />
          </div>
          {/* Si la zone de couverture est activée, on affiche la sélection des joueurs */}
          {team.options.showCoveredArea && (
            <PlayerSelectionList players={team.players} selectedIds={team.options.coveredAreaPlayerIds} onTogglePlayer={(pid) => onTogglePlayerSelection(team.id as 'A' | 'B', 'coveredArea', pid)} />
          )}
          {/* Player Label Settings : options d'affichage des noms et numéros */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Player Labels</h3>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor={`team${team.id}Names`} className="text-sm font-medium text-gray-300">Show Names & Roles</label>
              <input type="checkbox" id={`team${team.id}Names`} name="showPlayerNames" checked={team.options.showPlayerNames} onChange={(e) => handleTeamChange(team.id as 'A' | 'B', e)} className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500" />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor={`team${team.id}Numbers`} className="text-sm font-medium text-gray-300">Show Numbers</label>
              <input type="checkbox" id={`team${team.id}Numbers`} name="showPlayerNumbers" checked={team.options.showPlayerNumbers} onChange={(e) => handleTeamChange(team.id as 'A' | 'B', e)} className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500" />
            </div>
          </div>
        </div>
      ))}
      {/* Selected Player Controls : édition du joueur sélectionné */}
      {selectedPlayer ? (
        <div className="p-4 bg-gray-800 rounded-lg animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">Edit Player</h2>
          <div className="space-y-4">
            {/* Champ de saisie du nom */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input type="text" id="name" name="name" value={selectedPlayer.name} onChange={handlePlayerChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            {/* Champ de saisie du numéro */}
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-300 mb-1">Number</label>
              <input type="number" id="number" name="number" value={selectedPlayer.number} onChange={handlePlayerChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            {/* Sélecteur du rôle */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">Role</label>
              <select id="role" name="role" value={selectedPlayer.role} onChange={handlePlayerChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                {PLAYER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
          </div>
        </div>
      ) : (
        // Si aucun joueur n'est sélectionné, on affiche une instruction.
        <div className="p-4 bg-gray-800 rounded-lg text-center text-gray-400">
          <p>Select a player on the field to edit their details.</p>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---
// Ce composant gère l'état global de l'application et orchestre l'affichage de la scène et du panneau de contrôle.
export default function App() {
  // players : liste des joueurs présents sur le terrain (état local)
  // useState crée une variable d'état et une fonction pour la modifier.
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);

  // selectedPlayerId : identifiant du joueur sélectionné pour édition
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // isNavLocked : indique si la navigation 3D est verrouillée (pour éviter les déplacements involontaires)
  const [isNavLocked, setNavLock] = useState<boolean>(false);

  // Ajout d'un écouteur clavier pour la touche espace (verrouillage navigation)
  // useEffect permet d'exécuter du code lors du montage/démontage du composant.
  React.useEffect(() => {
    // Fonction appelée à chaque pression d'une touche
    const handleKeyPress = (event: KeyboardEvent) => {
      // Si la touche pressée est espace et qu'aucun champ de saisie n'est actif
      if (event.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        event.preventDefault(); // Empêche le scroll de la page
        setNavLock(prev => !prev); // Bascule le verrouillage
      }
    };
    // On ajoute l'écouteur d'événement au montage
    window.addEventListener('keydown', handleKeyPress);
    // On retire l'écouteur au démontage pour éviter les fuites mémoire
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // teamAOptions et teamBOptions : options d'affichage et de visualisation pour chaque équipe
  // Chaque équipe a sa couleur, ses visualisations activées, et les joueurs inclus dans chaque visualisation.
  const [teamAOptions, setTeamAOptions] = useState<TeamOptions>({ 
    color: '#3b82f6', // Couleur par défaut équipe A
    showPassingNet: false, // Affichage du réseau de passes
    passingNetPlayerIds: [], // Joueurs inclus dans le réseau de passes
    showCoveredArea: false, // Affichage de la zone de couverture
    coveredAreaPlayerIds: [], // Joueurs inclus dans la zone
    showPlayerNames: true, // Affichage des noms
    showPlayerNumbers: true // Affichage des numéros
  });
  const [teamBOptions, setTeamBOptions] = useState<TeamOptions>({ 
    color: '#ef4444', // Couleur par défaut équipe B
    showPassingNet: false,
    passingNetPlayerIds: [],
    showCoveredArea: false,
    coveredAreaPlayerIds: [],
    showPlayerNames: true,
    showPlayerNumbers: true
  });

  // handlePlayerUpdate : met à jour les infos d'un joueur (nom, numéro, rôle)
  // useCallback optimise la fonction pour éviter de la recréer à chaque rendu.
  const handlePlayerUpdate = useCallback((id: string, updates: Partial<Player>) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  // handlePlayerPositionUpdate : met à jour la position d'un joueur (drag & drop)
  const handlePlayerPositionUpdate = useCallback((id: string, position: Vector3) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(p => (p.id === id ? { ...p, position } : p))
    );
  }, []);

  // handleTeamOptionChange : met à jour les options d'une équipe (couleur, affichage, etc.)
  const handleTeamOptionChange = useCallback((team: 'A' | 'B', updates: Partial<TeamOptions>) => {
    const setter = team === 'A' ? setTeamAOptions : setTeamBOptions;
    setter(prev => ({...prev, ...updates}));
  }, []);

  // handleTogglePlayerSelection : ajoute ou retire un joueur d'une visualisation (réseau ou zone)
  const handleTogglePlayerSelection = useCallback((team: 'A' | 'B', feature: 'passingNet' | 'coveredArea', playerId: string) => {
    const setter = team === 'A' ? setTeamAOptions : setTeamBOptions;
    const key = feature === 'passingNet' ? 'passingNetPlayerIds' : 'coveredAreaPlayerIds';
    setter(prev => {
      const currentIds = prev[key];
      const newIds = currentIds.includes(playerId)
        ? currentIds.filter(id => id !== playerId)
        : [...currentIds, playerId];
      return { ...prev, [key]: newIds };
    });
  }, []);

  // Rendu principal de l'application :
  // On retourne du JSX (syntaxe proche du HTML) qui décrit l'interface.
  // - <SoccerScene> affiche la scène 3D et gère l'interaction terrain
  // - <ControlPanel> affiche le panneau de contrôle et d'édition
  return (
    <main className="w-screen h-screen bg-gray-900">
      {/* Composant de la scène 3D */}
      <SoccerScene
        players={players}
        teamAOptions={teamAOptions}
        teamBOptions={teamBOptions}
        selectedPlayerId={selectedPlayerId}
        isNavLocked={isNavLocked}
        onSelectPlayer={setSelectedPlayerId}
        onPlayerPositionUpdate={handlePlayerPositionUpdate}
        onSetNavLock={setNavLock}
      />
      {/* Composant du panneau de contrôle */}
      <ControlPanel
        players={players}
        selectedPlayerId={selectedPlayerId}
        teamAOptions={teamAOptions}
        teamBOptions={teamBOptions}
        isNavLocked={isNavLocked}
        onPlayerUpdate={handlePlayerUpdate}
        onTeamOptionChange={handleTeamOptionChange}
        onTogglePlayerSelection={handleTogglePlayerSelection}
        onSetNavLock={setNavLock}
      />
    </main>
  );
}
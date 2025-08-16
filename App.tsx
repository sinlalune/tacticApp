// Ce fichier définit le composant principal App de l'application React.
// Il gère l'état global, le panneau de contrôle, et le rendu de la scène 3D.

// ===============================
// Import des modules et définitions de types
// ===============================

// On importe React et ses hooks principaux :
// - useState : pour gérer l'état local (valeurs qui changent au fil du temps)
// - useMemo : pour optimiser les calculs et éviter les recalculs inutiles
// - useCallback : pour optimiser les fonctions et éviter de les recréer à chaque rendu
import React, { useState, useCallback } from 'react';

// On importe le type Vector3 depuis la librairie three.js.
// TypeScript permet d'importer uniquement le type (mot-clé 'type') pour le typage des données 3D.
import type { Vector3 } from 'three';

// On importe le composant principal qui gère la scène 3D (terrain, joueurs, interactions).
import { SoccerScene } from './components/three/SoccerScene';

// On importe les données initiales des joueurs et la liste des rôles possibles.
import { INITIAL_PLAYERS } from './constants';
import ControlPanel from './components/ControlPanel';

// On importe les types pour le typage TypeScript :
// - Player : structure d'un joueur
// - TeamOptions : options d'affichage et de visualisation pour une équipe
// - PlayerRole : type pour le rôle d'un joueur
import type { Player, TeamOptions, Annotation, DrawingTool } from './types';

// InfoIcon et PlayerSelectionList sont désormais importés depuis components/

// --- Composant de sélection de joueurs réutilisable ---
// Ce composant affiche une liste de cases à cocher pour sélectionner des joueurs.
// Il reçoit en props :
// - players : la liste des joueurs à afficher
// - selectedIds : les identifiants des joueurs sélectionnés
// - onTogglePlayer : fonction appelée quand on coche/décoche un joueur
// PlayerSelectionList a été extrait dans components/PlayerSelectionList

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
// ControlPanel now imported from components/ControlPanel

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

  // Drawing annotations state
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState<DrawingTool | null>(null);
  const [drawColor, setDrawColor] = useState<string>('#f59e0b');
  const [drawLineWidth, setDrawLineWidth] = useState<number>(2);
  const [drawFilled, setDrawFilled] = useState<boolean>(false);
  const [drawStrokeStyle, setDrawStrokeStyle] = useState<'solid'|'dashed'|'dotted'>('solid');

  // Note: nav-lock while drawing is managed inside SoccerScene during the gesture (start/end)

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
  showPlayerRoles: true, // Affichage des rôles
    showPlayerNumbers: true // Affichage des numéros
  });
  const [teamBOptions, setTeamBOptions] = useState<TeamOptions>({ 
    color: '#ef4444', // Couleur par défaut équipe B
    showPassingNet: false,
    passingNetPlayerIds: [],
    showCoveredArea: false,
    coveredAreaPlayerIds: [],
  showPlayerNames: true,
  showPlayerRoles: true,
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

  // Drawing API
  const addAnnotation = useCallback((ann: Annotation) => {
    setAnnotations(prev => [...prev, ann]);
  }, []);
  const updateAnnotation = useCallback((id: string, patch: Partial<Annotation>) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...patch } as Annotation : a));
  }, []);
  const removeAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  }, []);
  const clearAnnotations = useCallback(() => setAnnotations([]), []);

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
  // drawing props
  annotations={annotations}
  activeTool={activeTool}
  setActiveTool={setActiveTool}
  drawColor={drawColor}
  drawLineWidth={drawLineWidth}
  drawFilled={drawFilled}
  drawStrokeStyle={drawStrokeStyle}
  addAnnotation={addAnnotation}
  updateAnnotation={updateAnnotation}
  removeAnnotation={removeAnnotation}
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
  // drawing props
  activeTool={activeTool}
  setActiveTool={setActiveTool}
  drawColor={drawColor}
  setDrawColor={setDrawColor}
  drawLineWidth={drawLineWidth}
  setDrawLineWidth={setDrawLineWidth}
  drawFilled={drawFilled}
  setDrawFilled={setDrawFilled}
  drawStrokeStyle={drawStrokeStyle}
  setDrawStrokeStyle={setDrawStrokeStyle}
  clearAnnotations={clearAnnotations}
      />
    </main>
  );
}
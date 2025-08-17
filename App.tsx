// Ce fichier définit le composant principal App de l'application React.
// Il gère l'état global, le panneau de contrôle, et le rendu de la scène 3D.

// ===============================
// Import des modules et définitions de types
// ===============================

// On importe React et ses hooks principaux :
// - useState : pour gérer l'état local (valeurs qui changent au fil du temps)
// - useMemo : pour optimiser les calculs et éviter les recalculs inutiles
// - useCallback : pour optimiser les fonctions et éviter de les recréer à chaque rendu
import React from 'react';

// On importe le type Vector3 depuis la librairie three.js.
// TypeScript permet d'importer uniquement le type (mot-clé 'type') pour le typage des données 3D.
// import type { Vector3 } from 'three';

// On importe le composant principal qui gère la scène 3D (terrain, joueurs, interactions).
import { SoccerScene } from './components/three/SoccerScene';

// On importe les données initiales des joueurs et la liste des rôles possibles.
// import { INITIAL_PLAYERS } from './constants';
import ControlPanel from './components/ControlPanel';
import { NavLockProvider } from './state/NavLockContext';
import { DrawingProvider } from './state/DrawingContext';
import { TeamOptionsProvider } from './state/TeamOptionsContext';
import { PlayersProvider } from './state/PlayersContext';

// On importe les types pour le typage TypeScript :
// - Player : structure d'un joueur
// - TeamOptions : options d'affichage et de visualisation pour une équipe
// - PlayerRole : type pour le rôle d'un joueur
// import type { Player, TeamOptions } from './types';

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

  // Note: Nav lock and drawing state now provided by context providers

  // Players state is now provided by PlayersProvider

  // Team options moved to TeamOptionsProvider

  // Drawing state moved to DrawingProvider

  // Rendu principal de l'application :
  // On retourne du JSX (syntaxe proche du HTML) qui décrit l'interface.
  // - <SoccerScene> affiche la scène 3D et gère l'interaction terrain
  // - <ControlPanel> affiche le panneau de contrôle et d'édition
  return (
    <main className="w-screen h-screen bg-gray-900">
      <NavLockProvider>
        <DrawingProvider>
          <TeamOptionsProvider>
            <PlayersProvider>
              {/* Composant de la scène 3D */}
              <SoccerScene />
              {/* Composant du panneau de contrôle */}
              <ControlPanel />
            </PlayersProvider>
          </TeamOptionsProvider>
        </DrawingProvider>
      </NavLockProvider>
    </main>
  );
}
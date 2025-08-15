
// Ce fichier définit le composant PassingNet, qui affiche le réseau de passes entre les joueurs sélectionnés.
// Il utilise React pour la structure, et Three.js (via @react-three/fiber et @react-three/drei) pour le rendu 3D.

import React, { useMemo } from 'react'; // React pour la structure, useMemo pour optimiser les calculs.
import { Line } from '@react-three/drei'; // Line permet de dessiner des lignes dans la scène 3D.
import type { Player } from '../types'; // Import du type Player pour le typage TypeScript.

// Définition des props attendues par le composant PassingNet.
interface PassingNetProps {
  players: Player[]; // Liste de tous les joueurs
  playerIds: string[]; // Identifiants des joueurs à inclure dans le réseau de passes
  color: string; // Couleur des lignes du réseau
}

// Définition du composant principal PassingNet.
const PassingNet: React.FC<PassingNetProps> = ({ players, playerIds, color }) => {
  // On filtre les joueurs actifs (ceux dont l'id est dans playerIds)
  // useMemo optimise le calcul pour éviter de recalculer à chaque rendu.
  const activePlayers = useMemo(() => players.filter(p => playerIds.includes(p.id)), [players, playerIds]);

  // Si moins de 2 joueurs sont sélectionnés, on n'affiche rien (pas de réseau possible)
  if (activePlayers.length < 2) return null;

  // On récupère les positions des joueurs actifs
  const points = activePlayers.map(p => p.position);

  // On génère toutes les paires possibles de joueurs pour dessiner une ligne entre chaque paire
  const lines = [];
  for(let i=0; i < points.length; i++) {
    for(let j=i+1; j < points.length; j++) {
      lines.push([points[i], points[j]]);
    }
  }

  // Le composant retourne un <group> contenant toutes les lignes du réseau de passes
  return (
    <group>
      {lines.map((line, index) => (
         <Line 
           key={index} 
           points={line} // Les deux points à relier
           color={color} // Couleur de la ligne
           dashed // Style en pointillés
           dashSize={1} // Taille des tirets
           gapSize={0.5} // Taille des espaces
           linewidth={1.5} // Épaisseur de la ligne
           transparent // La ligne est semi-transparente
           opacity={0.7} // Opacité
         />
      ))}
    </group>
  );
};

// On exporte le composant pour qu'il puisse être utilisé ailleurs dans l'application.
export default PassingNet;

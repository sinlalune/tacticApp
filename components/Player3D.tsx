
// Ce fichier définit le composant Player3D, qui représente un joueur de football en 3D sur le terrain.
// Il utilise React pour la structure, et Three.js (via @react-three/fiber et @react-three/drei) pour le rendu 3D.

import React, { useRef } from 'react'; // React pour la structure, useRef pour manipuler des références d'objets 3D.
import { Html, Text } from '@react-three/drei'; // Html et Text sont des utilitaires pour afficher du texte dans la scène 3D.
import { Group } from 'three'; // Group permet de regrouper plusieurs objets 3D.
import type { Player } from '../types'; // Import du type Player pour le typage TypeScript.
import { PLAYER_ROLE_ABBREVIATIONS } from '../constants'; // Import des abréviations de rôles de joueurs.

// Définition des props attendues par le composant Player3D.
interface PlayerProps {
  player: Player; // Les données du joueur (position, nom, numéro, etc.)
  color: string; // Couleur du joueur (par équipe)
  isSelected: boolean; // Indique si le joueur est sélectionné
  showPlayerNames: boolean; // Affiche le nom du joueur
  showPlayerNumbers: boolean; // Affiche le numéro du joueur
  onPointerDown: (event: any, playerId: string) => void; // Fonction appelée lors d'un clic sur le joueur
}

// Définition du composant principal Player3D.
const Player3D: React.FC<PlayerProps> = ({ player, color, isSelected, showPlayerNames, showPlayerNumbers, onPointerDown }) => {
  // Création d'une référence pour le groupe 3D du joueur (utile pour manipuler l'objet dans la scène)
  const playerRef = useRef<Group>(null);
  // Hauteur du joueur (en mètres, pour l'échelle visuelle)
  const playerHeight = 1.8;

  // Le composant retourne un <group> qui regroupe tous les éléments du joueur (corps, labels, numéro)
  // La position du joueur est définie par player.position (Vector3)
  // onPointerDown permet de rendre le joueur interactif (drag & drop, sélection)
  return (
    <group 
      ref={playerRef} 
      position={player.position}
      onPointerDown={(e) => onPointerDown(e, player.id)}
    >
      {/* Corps du joueur : un cylindre vertical pour représenter le joueur */}
      <mesh castShadow>
        {/* cylinderGeometry crée un cylindre (rayon haut/bas, hauteur, nombre de faces) */}
        <cylinderGeometry args={[0.5, 0.5, playerHeight, 16]} />
        {/* meshStandardMaterial définit la couleur et l'effet lumineux du joueur */}
        <meshStandardMaterial 
          color={color} // Couleur de l'équipe
          emissive={isSelected ? color : 'black'} // Si sélectionné, le joueur brille
          emissiveIntensity={isSelected ? 0.8 : 0} // Intensité de la brillance
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      {/* Affichage du nom et du rôle du joueur au-dessus de sa tête */}
      {showPlayerNames && (
        <Html 
          position={[0, playerHeight + 0.8, 0]} // Position du label au-dessus du joueur
          center 
          occlude={true} // Le label disparaît si caché par un autre objet
          wrapperClass="player-label-wrapper" 
          style={{
            pointerEvents: 'none', // Le label n'est pas interactif
            userSelect: 'none', // On ne peut pas sélectionner le texte
            zIndex: 0,
            transform: 'translateZ(0)',
            isolation: 'auto'
          }}
          distanceFactor={10} // Facteur d'échelle pour la lisibilité
        >
          <div className="bg-black bg-opacity-60 text-white text-xs font-bold p-1 rounded" style={{ transform: 'translateZ(0)' }}>
            {/* Affiche le nom et le rôle abrégé du joueur */}
            {player.name} ({PLAYER_ROLE_ABBREVIATIONS[player.role] || 'N/A'})
          </div>
        </Html>
      )}
      {/* Affichage du numéro du joueur juste au-dessus du cylindre */}
      {showPlayerNumbers && (
        <Text
          position={[0, playerHeight + 0.1, 0]}
          fontSize={0.8}
          color="white"
          anchorX="center"
          anchorY="middle"
          renderOrder={-1}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {player.number}
        </Text>
      )}
    </group>
  );
};

// On exporte le composant pour qu'il puisse être utilisé ailleurs dans l'application.
export default Player3D;

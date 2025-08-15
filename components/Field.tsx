
// Ce fichier définit le composant Field, qui représente le terrain de football en 3D.
// Il utilise React pour la structure, et Three.js (via @react-three/fiber et @react-three/drei) pour le rendu 3D.

import React from 'react'; // React est la bibliothèque principale pour créer des interfaces utilisateur.
import { Line } from '@react-three/drei'; // Line est un composant utilitaire pour dessiner des lignes dans une scène 3D.
import { Vector3 } from 'three'; // Vector3 est une classe de Three.js pour manipuler des points/vecteurs 3D.
import { FIELD_WIDTH, FIELD_LENGTH } from '../constants'; // Import des constantes de dimensions du terrain.

// Définition du composant principal Field.
// Il reçoit une prop onPointerMissed, qui est une fonction appelée quand l'utilisateur clique à côté d'un élément interactif.
const Field: React.FC<{ onPointerMissed: (event: MouseEvent) => void }> = ({ onPointerMissed }) => {
  // Définition du style des lignes blanches du terrain.
  const lineMaterial = { color: 'white', linewidth: 2 };

  // Dimensions des différents éléments du terrain (cercle central, surface de réparation, etc.)
  const centerCircleRadius = 9.15; // Rayon du cercle central (en mètres)
  const penaltyBoxLength = 16.5; // Longueur de la surface de réparation
  const penaltyBoxWidth = 40.3; // Largeur de la surface de réparation
  const goalAreaLength = 5.5; // Longueur de la surface de but
  const goalAreaWidth = 18.32; // Largeur de la surface de but
  const goalWidth = 7.32; // Largeur des cages
  const goalHeight = 2.44; // Hauteur des cages

  // Calcul des points du cercle central, pour dessiner une courbe lisse.
  // useMemo permet de ne recalculer ce tableau que si le rayon change.
  const centerCirclePoints = React.useMemo(() => {
    const points = [];
    for (let i = 0; i <= 64; i++) {
      // On parcourt 64 points pour faire le tour du cercle.
      const angle = (i / 64) * Math.PI * 2; // Angle en radians
      // On calcule la position x/z de chaque point sur le cercle.
      points.push(new Vector3(Math.cos(angle) * centerCircleRadius, 0.01, Math.sin(angle) * centerCircleRadius));
    }
    return points;
  }, [centerCircleRadius]);

  // Le composant retourne une balise <group> qui regroupe tous les éléments du terrain.
  // Tous les éléments enfants sont positionnés et dessinés dans la scène 3D.
  return (
    <group onPointerMissed={onPointerMissed}>
      {/* Dessin du gazon (un simple plan vert) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        {/* planeGeometry crée une surface plane de la taille du terrain */}
        <planeGeometry args={[FIELD_LENGTH, FIELD_WIDTH]} />
        {/* meshStandardMaterial définit la couleur et le style du gazon */}
        <meshStandardMaterial color="#228B22" />
      </mesh>

      {/* Lignes de délimitation du terrain (rectangle blanc) */}
      <Line points={[[-FIELD_LENGTH/2, 0.01, -FIELD_WIDTH/2], [FIELD_LENGTH/2, 0.01, -FIELD_WIDTH/2], [FIELD_LENGTH/2, 0.01, FIELD_WIDTH/2], [-FIELD_LENGTH/2, 0.01, FIELD_WIDTH/2], [-FIELD_LENGTH/2, 0.01, -FIELD_WIDTH/2]]} {...lineMaterial} />
      {/* Ligne médiane */}
      <Line points={[[0, 0.01, -FIELD_WIDTH/2], [0, 0.01, FIELD_WIDTH/2]]} {...lineMaterial} />
      {/* Cercle central */}
      <Line points={centerCirclePoints} {...lineMaterial} />
      {/* Point central */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 32]}/>
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Surfaces de réparation et de but côté équipe A (gauche) */}
      <Line points={[[-FIELD_LENGTH/2, 0.01, -penaltyBoxWidth/2], [-FIELD_LENGTH/2 + penaltyBoxLength, 0.01, -penaltyBoxWidth/2], [-FIELD_LENGTH/2 + penaltyBoxLength, 0.01, penaltyBoxWidth/2], [-FIELD_LENGTH/2, 0.01, penaltyBoxWidth/2]]} {...lineMaterial} />
      <Line points={[[-FIELD_LENGTH/2, 0.01, -goalAreaWidth/2], [-FIELD_LENGTH/2 + goalAreaLength, 0.01, -goalAreaWidth/2], [-FIELD_LENGTH/2 + goalAreaLength, 0.01, goalAreaWidth/2], [-FIELD_LENGTH/2, 0.01, goalAreaWidth/2]]} {...lineMaterial} />
      {/* Point de penalty côté équipe A */}
      <mesh position={[-FIELD_LENGTH/2 + 11, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 32]}/>
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Surfaces de réparation et de but côté équipe B (droite) */}
      <Line points={[[FIELD_LENGTH/2, 0.01, -penaltyBoxWidth/2], [FIELD_LENGTH/2 - penaltyBoxLength, 0.01, -penaltyBoxWidth/2], [FIELD_LENGTH/2 - penaltyBoxLength, 0.01, penaltyBoxWidth/2], [FIELD_LENGTH/2, 0.01, penaltyBoxWidth/2]]} {...lineMaterial} />
      <Line points={[[FIELD_LENGTH/2, 0.01, -goalAreaWidth/2], [FIELD_LENGTH/2 - goalAreaLength, 0.01, -goalAreaWidth/2], [FIELD_LENGTH/2 - goalAreaLength, 0.01, goalAreaWidth/2], [FIELD_LENGTH/2, 0.01, goalAreaWidth/2]]} {...lineMaterial} />
      {/* Point de penalty côté équipe B */}
      <mesh position={[FIELD_LENGTH/2 - 11, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 32]}/>
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Cages de but (gauche et droite) */}
      <mesh position={[-FIELD_LENGTH / 2, goalHeight / 2, 0]}>
        <boxGeometry args={[1, goalHeight, goalWidth]} />
        <meshStandardMaterial color="#cccccc" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[FIELD_LENGTH / 2, goalHeight / 2, 0]}>
        <boxGeometry args={[1, goalHeight, goalWidth]} />
        <meshStandardMaterial color="#cccccc" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
};

// On exporte le composant pour qu'il puisse être utilisé ailleurs dans l'application.
export default Field;

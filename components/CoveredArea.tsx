
// Ce fichier définit le composant CoveredArea, qui affiche la zone couverte par un groupe de joueurs.
// Il utilise React pour la structure, et Three.js (via @react-three/fiber et @react-three/drei) pour le rendu 3D.

import React, { useMemo } from 'react'; // React pour la structure, useMemo pour optimiser les calculs.
import { Shape, Vector3, DoubleSide } from 'three'; // Shape pour dessiner des polygones, Vector3 pour manipuler des points 3D, DoubleSide pour rendre visible des deux côtés.
import { Player } from '../types'; // Import du type Player pour le typage TypeScript.

// Définition des props attendues par le composant CoveredArea.
interface CoveredAreaProps {
  players: Player[]; // Liste de tous les joueurs
  playerIds: string[]; // Identifiants des joueurs à inclure dans la zone
  color: string; // Couleur de la zone
}

// Fonction utilitaire pour calculer l'enveloppe convexe (convex hull) des positions des joueurs
// Cela permet de dessiner un polygone qui englobe tous les joueurs sélectionnés
const getConvexHull = (players: Player[]): Vector3[] => {
  const points = players.map(p => p.position); // On récupère les positions des joueurs
  if (points.length <= 2) return points; // Si 2 joueurs ou moins, on retourne les points
  if (points.length === 3) return points; // Si 3 joueurs, le triangle est déjà l'enveloppe

  // Calcul du centre de masse (centroid) pour trier les points par angle
  const centroid = points.reduce((acc, p) => acc.add(p), new Vector3()).divideScalar(points.length);
  // On trie les points par angle autour du centre pour former un polygone non croisé
  const sortedPoints = [...points].sort((a, b) => {
    const angleA = Math.atan2(a.z - centroid.z, a.x - centroid.x);
    const angleB = Math.atan2(b.z - centroid.z, b.x - centroid.x);
    return angleA - angleB;
  });
  // On ferme le polygone en ajoutant le premier point à la fin
  sortedPoints.push(sortedPoints[0]);

  // On lisse le polygone pour éviter les angles trop vifs
  const smoothedPoints: Vector3[] = [];
  const smoothingFactor = 0.15; // Plus la valeur est grande, plus le polygone est lissé
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const current = sortedPoints[i];
    const next = sortedPoints[i + 1];
    smoothedPoints.push(current);
    // On ajoute un point interpolé entre chaque paire pour le lissage
    if (i < sortedPoints.length - 1) {
      const interpolated = new Vector3()
        .addVectors(current, next)
        .multiplyScalar(smoothingFactor);
      smoothedPoints.push(interpolated);
    }
  }
  return smoothedPoints;
};

// Définition du composant principal CoveredArea.
const CoveredArea: React.FC<CoveredAreaProps> = ({ players, playerIds, color }) => {
  // On filtre les joueurs actifs (ceux dont l'id est dans playerIds)
  // useMemo optimise le calcul pour éviter de recalculer à chaque rendu.
  const activePlayers = useMemo(() => players.filter(p => playerIds.includes(p.id)), [players, playerIds]);
  // On calcule les points de l'enveloppe convexe
  const hullPoints = useMemo(() => getConvexHull(activePlayers), [activePlayers]);
  // On crée une forme (Shape) à partir des points pour dessiner le polygone
  const shape = useMemo(() => {
    if (hullPoints.length < 3) return null; // Il faut au moins 3 points pour un polygone
    const shape = new Shape();
    shape.moveTo(hullPoints[0].x, hullPoints[0].z); // On commence au premier point
    for (let i = 1; i < hullPoints.length; i++) {
      shape.lineTo(hullPoints[i].x, hullPoints[i].z); // On trace une ligne vers chaque point suivant
    }
    shape.closePath(); // On ferme le polygone
    return shape;
  }, [hullPoints]);
  // Si la forme n'est pas valide, on n'affiche rien
  if (!shape) return null;

  // Le composant retourne un <mesh> qui dessine la zone couverte
  // La zone est légèrement surélevée (y=0.02) pour éviter les artefacts visuels
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
      {/* shapeGeometry crée la géométrie du polygone à partir de la forme calculée */}
      <shapeGeometry args={[shape]} />
      {/* meshStandardMaterial définit la couleur, la transparence et le côté visible */}
      <meshStandardMaterial color={color} transparent opacity={0.3} side={DoubleSide} />
    </mesh>
  );
};

// On exporte le composant pour qu'il puisse être utilisé ailleurs dans l'application.
export default CoveredArea;

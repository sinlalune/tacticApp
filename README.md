# Soccer Tactics Board

## Overview
Ce projet est un tableau tactique de football en 3D interactif développé avec React, Three.js et TypeScript. Il permet de visualiser et manipuler des formations de joueurs en temps réel, avec des fonctionnalités avancées comme les réseaux de passes et les zones de couverture.

## Technologies Utilisées

### Core
- **React**: Framework UI principal
- **TypeScript**: Pour le typage statique
- **Three.js**: Moteur de rendu 3D
- **@react-three/fiber**: Wrapper React pour Three.js
- **@react-three/drei**: Collection d'utilitaires pour React Three Fiber
- **TailwindCSS**: Framework CSS pour le styling

## Structure du Projet

### Composants Principaux

#### `App.tsx`
Composant racine qui gère :
- L'état global de l'application
- Les joueurs et leurs positions
- Les options des équipes
- La navigation et le contrôle de la caméra

#### `SoccerScene.tsx`
Composant 3D principal qui :
- Gère le rendu de la scène Three.js
- Implémente les contrôles de caméra
- Gère le drag & drop des joueurs
- Affiche les joueurs, leurs labels et les effets visuels

### Types et Interfaces

#### `Player`
```typescript
interface Player {
  id: string;
  name: string;
  number: number;
  role: PlayerRole;
  teamId: 'A' | 'B';
  position: Vector3;
}
```

#### `TeamOptions`
```typescript
interface TeamOptions {
  color: string;
  showPassingNet: boolean;
  passingNetPlayerIds: string[];
  showCoveredArea: boolean;
  coveredAreaPlayerIds: string[];
  showPlayerNames: boolean;
  showPlayerNumbers: boolean;
}
```

### Hooks Personnalisés

Le projet utilise plusieurs hooks React pour la gestion d'état :
- `useState`: Gestion des états locaux et globaux
- `useCallback`: Optimisation des fonctions de callback
- `useEffect`: Effets de bord (ex: listeners clavier)
- `useMemo`: Mémorisation des calculs coûteux
- `useThree`: Hook de react-three-fiber pour accéder au contexte Three.js

## Fonctionnalités Détaillées

### 1. Système de Navigation 3D
- Rotation: Clic gauche + drag
- Pan: Clic droit + drag
- Zoom: Molette de souris
- Verrouillage de navigation: Touche espace ou bouton dans le panneau de contrôle

### 2. Gestion des Joueurs
- Déplacement par drag & drop
- Edition des informations (nom, numéro, rôle)
- Labels personnalisables (noms, numéros)
- Sélection pour les fonctionnalités avancées

### 3. Visualisations Tactiques
- **Réseau de passes**: Visualisation des connexions entre joueurs sélectionnés
- **Zones de couverture**: Représentation des zones d'influence des joueurs

### 4. Interface de Contrôle
Panel latéral permettant de :
- Gérer les options par équipe
- Éditer les informations des joueurs
- Contrôler les visualisations tactiques
- Verrouiller la navigation

## Objets Three.js Principaux

### 1. Scene
- Contient tous les éléments 3D
- Gère la lumière ambiante et directionnelle

### 2. Player Mesh
- Cylindre pour représenter le corps du joueur
- Text3D pour les labels (noms et numéros)
- Matériaux personnalisés pour les couleurs d'équipe

### 3. Terrain
- Plane geometry avec texture
- Matériau personnalisé pour les lignes du terrain

### 4. Visualisations
- LineSegments pour le réseau de passes
- Meshes personnalisés pour les zones de couverture

## Installation et Démarrage

1. Installer les dépendances :
   ```bash
   npm install
   ```

2. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```

## Propositions d'Optimisation

### 1. Réorganisation du Projet
```
src/
  ├── components/
  │   ├── scene/
  │   │   ├── SoccerScene.tsx
  │   │   ├── PlayerMesh.tsx
  │   │   ├── Field.tsx
  │   │   └── Visualizations/
  │   │       ├── PassingNet.tsx
  │   │       └── CoverageArea.tsx
  │   ├── ui/
  │   │   ├── ControlPanel/
  │   │   ├── PlayerEditor/
  │   │   └── TeamOptions/
  │   └── shared/
  ├── hooks/
  │   ├── usePlayerDrag.ts
  │   ├── useNavigation.ts
  │   └── useTeamOptions.ts
  ├── store/
  │   ├── playerSlice.ts
  │   └── teamSlice.ts
  ├── types/
  └── utils/
```

### 2. Améliorations Suggérées

#### Performance
1. Implémenter React.memo pour les composants qui ne nécessitent pas de re-renders fréquents
2. Utiliser InstancedMesh pour les joueurs
3. Optimiser les calculs de zones de couverture avec des workers

#### Architecture
1. Migrer vers une gestion d'état plus robuste (Redux Toolkit ou Zustand)
2. Séparer la logique métier des composants UI
3. Implémenter le pattern Container/Presenter

#### Fonctionnalités
1. Ajouter un système d'undo/redo
2. Implémenter la sauvegarde/chargement de formations
3. Ajouter des animations de transition
4. Supporter le multi-touch pour mobile

#### DX (Developer Experience)
1. Ajouter des tests unitaires et d'intégration
2. Implémenter Storybook pour les composants UI
3. Ajouter une documentation API avec TypeDoc
4. Mettre en place un système de validation des props avec Zod

### 3. Patterns à Implémenter

1. **Command Pattern** pour les actions des joueurs
2. **Observer Pattern** pour les mises à jour de visualisation
3. **Strategy Pattern** pour les différents modes de visualisation
4. **Factory Pattern** pour la création des objets 3D

Ces améliorations permettraient une meilleure maintenabilité, scalabilité et performance du projet.


// Ce fichier est le point d'entrée principal de l'application React.
// Il monte le composant racine <App /> dans le DOM HTML.

import React from 'react'; // Import de la bibliothèque React pour créer des composants.
import ReactDOM from 'react-dom/client'; // Import de ReactDOM pour manipuler le DOM (Document Object Model).
import App from './App'; // Import du composant principal de l'application.

// On récupère l'élément HTML avec l'id 'root' (défini dans index.html).
const rootElement = document.getElementById('root');
if (!rootElement) {
  // Si l'élément n'existe pas, on lance une erreur explicite.
  throw new Error("Could not find root element to mount to");
}

// On crée une racine React à partir de l'élément HTML.
const root = ReactDOM.createRoot(rootElement);
// On utilise React.StrictMode pour activer des vérifications supplémentaires en développement.
// Cela aide à détecter les problèmes potentiels dans l'application.
root.render(
  <React.StrictMode>
    {/* On monte le composant principal App dans le DOM. Toute l'application démarre ici. */}
    <App />
  </React.StrictMode>
);

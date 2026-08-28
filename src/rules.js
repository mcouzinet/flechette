/* ============================================================
   Regles des jeux — source unique, partagee par les ecrans locaux et par le
   mode a distance.

   Elles vivaient en dur dans le `<template #rules-content>` de chaque
   composant local. Le mode a distance n'y avait pas acces : sa coquille
   retombait sur le texte generique « Regles du jeu. », le meme pour les dix
   jeux. Recopier les regles cote distant aurait garanti la derive ; elles
   sont donc sorties ici, et les deux cotes lisent le meme objet.

   Clef = identifiant du moteur distant (`x01`, `shanghai`...), qui est le jeu
   de clefs canonique. Les composants locaux nomment la leur explicitement.

   Forme : { label, text? }. Sans `text`, la ligne entiere s'affiche en craie
   claire (« 3 flechettes par tour. »).
   ============================================================ */
export const RULES = {
  cricket: [
    { label: 'But du jeu :', text: 'Fermer les 7 zones (20, 19, 18, 17, 16, 15 et Bulle) avant les adversaires, avec le moins de points possible.' },
    { label: 'Fermer une zone :', text: 'Toucher 3 fois la zone. Les marques s\'affichent : / (1 touche), ✕ (2 touches), ⊘ (fermé).' },
    { label: 'Marquer des points :', text: 'Quand ta zone est fermée mais pas celle d\'un adversaire, chaque touche supplémentaire lui ajoute des points.' },
    { label: 'Victoire :', text: 'Le premier à fermer toutes les zones ET avoir le score le plus bas gagne.' },
    { label: 'Astuce :', text: 'Tape sur une case dans la grille pour noter une touche. Le bouton « Annuler » (ou Backspace au clavier) retire le dernier coup.' },
  ],
  x01: [
    { label: 'But du jeu :', text: 'Partir d\'un score (301, 501...) et atteindre exactement zéro.' },
    { label: 'Tour de jeu :', text: 'Chaque joueur lance 3 fléchettes par tour. Le score touché est soustrait du total.' },
    { label: 'Multiplicateurs :', text: 'Simple = valeur, Double = x2, Triple = x3. La bulle vaut 25 (simple) ou 50 (double).' },
    { label: 'Score invalide :', text: 'Si le score dépasse le restant, le round est annulé et les 3 fléchettes comptent comme manquées.' },
    { label: 'Victoire :', text: 'Le premier joueur à atteindre exactement 0 gagne.' },
  ],
  shanghai: [
    { label: 'But du jeu :', text: 'Marquer le plus de points en 20 rounds, ou réaliser un Shanghai pour gagner instantanément.' },
    { label: 'Déroulement :', text: 'Chaque round, on vise le numéro du round (round 1 = cible 1, round 2 = cible 2, etc.).' },
    { label: 'Scoring :', text: 'Simple = valeur du numéro, Double = x2, Triple = x3. Manqué = 0 point.' },
    { label: 'Shanghai :', text: 'Toucher le simple + double + triple du même numéro dans un même round = victoire immédiate !' },
    { label: 'Fin de partie :', text: 'Après 20 rounds, le joueur avec le plus de points gagne (sauf Shanghai).' },
  ],
  horloge: [
    { label: 'But du jeu :', text: 'Toucher les numéros de 1 à 20 dans l\'ordre, puis la Bulle (25). Le plus rapide gagne.' },
    { label: 'Tour de jeu :', text: 'Chaque joueur lance 3 fléchettes par tour.' },
    { label: 'Progression :', text: 'Il faut toucher sa cible actuelle pour avancer. Simple, double ou triple comptent tous.' },
    { label: 'Manqué :', text: 'Si la fléchette ne touche pas la cible, elle ne compte pas.' },
    { label: 'Victoire :', text: 'Le premier joueur à toucher tous les numéros de 1 à 20 puis la Bulle gagne.' },
  ],
  killer: [
    { label: 'But du jeu :', text: 'Être le dernier joueur en vie. Chaque joueur a 3 vies.' },
    { label: 'Phase 1 - Attribution :', text: 'Chaque joueur lance une fléchette pour obtenir son numéro cible.' },
    { label: 'Phase 2 - Devenir Killer :', text: 'Touche le double de ton numéro pour devenir "Killer".' },
    { label: 'Phase 3 - Élimination :', text: 'Une fois Killer, touche le double des autres joueurs pour leur retirer une vie.' },
    { label: 'Victoire :', text: 'Le dernier joueur avec des vies restantes gagne.' },
    { label: '3 fléchettes par tour.' },
  ],
  morpion: [
    { label: 'But du jeu :', text: 'Aligner 3 cases (horizontale, verticale ou diagonale) sur la grille 3x3.' },
    { label: 'Grille :', text: 'Chaque case correspond à un numéro sur la cible (20, 18, 13, 12, 14, 16, 19, 15, 17).' },
    { label: 'Tour de jeu :', text: 'Les joueurs alternent. Joueur 1 = X, Joueur 2 = O.' },
    { label: 'Prendre une case :', text: 'Touche le numéro correspondant à la case souhaitée.' },
    { label: 'Match nul :', text: 'Si toutes les cases sont remplies sans alignement, c\'est un match nul.' },
    { label: 'Le score global est conservé entre les manches.' },
  ],
  halveit: [
    { label: 'But du jeu :', text: 'Avoir le meilleur score après 9 rounds de cibles imposées.' },
    { label: 'Déroulement :', text: 'Chaque round a une cible spécifique (numéro, double ou triple).' },
    { label: 'Scoring :', text: '3 fléchettes par round. Chaque touche ajoute la valeur au score.' },
    { label: 'Halve-It :', text: 'Si tu ne touches aucune cible valide dans un round, ton score est divisé par 2 !' },
    { label: 'Victoire :', text: 'Après 9 rounds, le joueur avec le plus de points gagne.' },
    { label: 'Stratégie :', text: 'Mieux vaut toucher au moins une fois pour éviter la division.' },
  ],
  bobs27: [
    { label: 'But du jeu :', text: 'Survivre aux 21 rounds en visant les doubles, en partant de 27 points.' },
    { label: 'Cibles :', text: 'Round 1 = Double 1, Round 2 = Double 2... jusqu\'au Round 20 = Double 20, puis Double Bulle.' },
    { label: 'Touche :', text: 'Si tu touches le double, tu gagnes sa valeur (double 5 = +10 points).' },
    { label: 'Manque :', text: 'Si tu manques, tu perds la valeur du double (double 5 = -10 points).' },
    { label: 'Elimination :', text: 'Si ton score tombe a 0 ou en dessous, tu es elimine.' },
    { label: 'Victoire :', text: 'Le dernier survivant ou le meilleur score apres 21 rounds gagne.' },
  ],
  baseball: [
    { label: 'Le principe :', text: '9 manches, 3 fléchettes par manche. A chaque manche, tu vises le numéro correspondant : manche 1 = tu vises le 1, manche 2 = tu vises le 2, etc.' },
    { label: 'Comment marquer :', text: 'Seul le numéro de la manche compte. Si tu touches la zone simple, tu marques 1 run. La zone double = 2 runs. La zone triple = 3 runs. Tout le reste = 0.' },
    { label: 'Exemple :', text: 'Manche 5, tu lances 3 fléchettes sur le 5. Tu touches un simple et un triple = 4 runs pour cette manche.' },
    { label: 'Le gagnant :', text: 'Après 9 manches, celui qui a le plus de runs au total gagne.' },
  ],
  countup: [
    { label: 'But du jeu :', text: 'Marquer le plus de points possible en 8 rounds.' },
    { label: 'Tour de jeu :', text: 'Chaque joueur lance 3 fléchettes par round. Tous les points touchés s\'additionnent.' },
    { label: 'Multiplicateurs :', text: 'Simple = valeur, Double = x2, Triple = x3. La bulle vaut 25 (simple) ou 50 (double).' },
    { label: 'Victoire :', text: 'Après 8 rounds, le joueur avec le plus haut score total gagne.' },
    { label: 'Idéal pour :', text: 'Les débutants et l\'échauffement !' },
  ],
}

export function rulesFor(id) {
  return RULES[id] || []
}

export default RULES

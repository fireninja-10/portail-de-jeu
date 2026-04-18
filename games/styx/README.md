# Styx

Petit jeu abstrait en HTML, CSS et JavaScript, inspire de `Qix` et du `Styx` de 1983.

La version actuelle propose une campagne de `20 niveaux`.

## Regles

- le bord et les zones bleues sont sures
- quand tu quittes une zone bleue, tu poses une trace orange
- si tu reviens sur une zone bleue, la region fermee sans serpent est capturee
- si le serpent touche ton trace avant fermeture, tu perds une vie
- chaque niveau a son propre objectif de capture
- le score et les vies continuent d'un niveau a l'autre
- tous les 5 niveaux, une vie bonus est accordee
- la victoire arrive quand les `20 niveaux` sont termines

## Lancer le jeu

Le projet est statique. Tu peux ouvrir [index.html](/Users/isaac/Documents/codex/styx/index.html).

Si tu preferes le servir localement :

```bash
python3 -m http.server 8000
```

Puis ouvre `http://localhost:8000`.

## Commandes

- `WASD` ou fleches : change la direction en continu
- `P` ou `Echap` : pause
- `Entree` : lancer la campagne, relancer ou passer au niveau suivant
- mobile : boutons directionnels a l'ecran

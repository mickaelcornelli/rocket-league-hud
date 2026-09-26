# Rocket League HUD

Application de HUD temps réel pour **Rocket League**, inspirée des outils de type Overwolf.

Le projet récupère directement les données du jeu via la **Stats API de Rocket League**, les traite côté backend et les transmet au frontend via WebSockets afin d'afficher les informations du match en temps réel.

## 🎯 Objectif

L'objectif est de construire un HUD moderne permettant d'afficher pendant une partie :

* les informations du match ;
* les scores des équipes ;
* les statistiques des joueurs ;
* le boost et la vitesse des joueurs ;
* les événements importants du match ;
* les informations de profil et de classement des joueurs ;
* les statistiques de saison et les derniers matchs ;
* une interface interactive accessible directement depuis le jeu.

À terme, le projet évoluera vers un **véritable overlay desktop transparent**, utilisable directement au-dessus de Rocket League.

---

## 🏗️ Architecture

```text
Rocket League
     │
     │ Stats API / WebSocket
     ▼
┌─────────────────────────┐
│ RocketLeagueClient      │
│                         │
│ ws://127.0.0.1:49124    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ MatchStateManager       │
│                         │
│ MatchGuid               │
│ Players                 │
│ Teams                   │
│ Game                    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Browser WebSocket       │
│                         │
│ ws://127.0.0.1:3000/rl  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Next.js / React HUD     │
└─────────────────────────┘
```

---

## 🛠️ Technologies

* **Next.js**
* **React**
* **TypeScript**
* **Node.js**
* **WebSocket (`ws`)**
* **Rocket League Stats API**

---

## 📁 Structure du projet

```text
rocket-league-hud/
│
├── app/
│   └── page.tsx
│
├── components/
│
├── lib/
│   └── rocket-league/
│       ├── types.ts
│       ├── client.ts
│       ├── state.ts
│       └── events.ts
│
├── server/
│   └── rocket-league.ts
│
├── server.ts
│
├── public/
│
├── package.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

---

## 🎮 Connexion à Rocket League

Rocket League expose les statistiques du match via son système `Stats API`.

Le fichier de configuration utilisé est :

```text
<Ton installation Rocket League>\TAGame\Config\TAStatsAPI.ini
```

Exemple :

```ini
[TAGame.MatchStatsExporter_TA]
PacketSendRate=30.0
Port=0
WebPort=49124
```

### Paramètres

| Paramètre        |  Valeur | Description                         |
| ---------------- | ------: | ----------------------------------- |
| `PacketSendRate` |  `30.0` | Fréquence d'envoi des données       |
| `Port`           |     `0` | API TCP désactivée                  |
| `WebPort`        | `49124` | WebSocket utilisé par l'application |

Après modification du fichier, **Rocket League doit être redémarré**.

---

## 📡 WebSockets

Deux connexions WebSocket sont utilisées.

### Rocket League → Backend

```text
ws://127.0.0.1:49124
```

Le backend reçoit les événements directement depuis Rocket League.

Exemple :

```json
{
  "Event": "UpdateState",
  "Data": "..."
}
```

Rocket League peut envoyer `Data` sous forme de chaîne JSON. Le client prend donc en charge le parsing du payload :

```text
JSON message
     ↓
Data string
     ↓
JSON.parse(Data)
     ↓
UpdateState
```

### Backend → HUD

Le frontend se connecte à :

```text
ws://127.0.0.1:3000/rl
```

Le serveur transmet l'état courant sous la forme :

```json
{
  "type": "state",
  "data": {}
}
```

---

## 📊 Données disponibles

Le projet utilise des types TypeScript centralisés dans :

```text
lib/rocket-league/types.ts
```

### Joueurs

Les données actuellement exploitées comprennent notamment :

```text
Name
PrimaryId
Shortcut
TeamNum
Score
Goals
Shots
Assists
Saves
Touches
CarTouches
Demos
Boost
Speed
bHasCar
bBoosting
bOnGround
bOnWall
bPowersliding
bDemolished
bSupersonic
PickupClass
```

### Équipes

```text
Name
TeamNum
Score
ColorPrimary
ColorSecondary
```

### Match

```text
MatchGuid
PlaylistId
TimeSeconds
bOvertime
Arena
Ball
Teams
Winner
bReplay
Target
```

---

## 🔑 MatchGuid

Le `MatchGuid` permet d'identifier un match.

Il est utilisé pour distinguer :

```text
Même MatchGuid
      ↓
Mise à jour du match existant
      ↓
Pas de nouveau chargement des données externes
```

et :

```text
Nouveau MatchGuid
      ↓
Nouveau match
      ↓
Identification des joueurs
      ↓
Enrichissement des profils
```

Cette logique permettra notamment d'éviter de faire des requêtes externes à chaque `UpdateState`.

---

## 👤 Identification des joueurs

Les joueurs sont identifiés principalement avec :

```text
PrimaryId
```

Exemples :

```text
Steam|76561198056861280|0
Epic|0cce602819314701bfb553660e104ca9|0
```

Le champ `Shortcut` permet également d'identifier de manière unique un joueur au sein d'un match.

Les bots peuvent cependant utiliser :

```text
Unknown|0|0
```

plusieurs fois. Le frontend utilise donc une clé combinant plusieurs informations :

```tsx
key={`${player.PrimaryId}-${player.Shortcut}-${player.Name}`}
```

Les joueurs dont le `PrimaryId` est `Unknown|0|0` ne devront pas être envoyés vers le futur service de recherche de profils externes.

---

## 🖥️ HUD

Le HUD actuel est une première version permettant de valider le pipeline complet :

```text
Rocket League
      ↓
Stats API
      ↓
Node.js
      ↓
MatchStateManager
      ↓
WebSocket
      ↓
Next.js
      ↓
React HUD
```

L'objectif est ensuite de transformer cette interface de développement en HUD complet.

Structure prévue :

```text
components/
└── hud/
    ├── Hud.tsx
    ├── MatchHeader.tsx
    ├── Scoreboard.tsx
    ├── PlayerCard.tsx
    ├── PlayerProfile.tsx
    └── BoostBar.tsx
```

---

## 🔮 Roadmap

### Phase 1 — Connexion Rocket League

* [x] Connexion à la Stats API
* [x] WebSocket Rocket League
* [x] Parsing des événements
* [x] Gestion de reconnexion
* [x] Réception de `UpdateState`
* [x] Détection des nouveaux matchs avec `MatchGuid`

### Phase 2 — HUD

* [x] Affichage du match
* [x] Affichage des équipes
* [x] Affichage du score
* [x] Affichage des joueurs
* [x] Statistiques individuelles
* [x] Boost
* [x] Vitesse
* [ ] HUD visuel complet
* [ ] Cartes joueurs interactives
* [ ] Affichage des événements en temps réel

### Phase 3 — Données joueurs

* [ ] `PlayerService`
* [ ] Recherche par `PrimaryId`
* [ ] Cache des profils
* [ ] Rang actuel
* [ ] MMR
* [ ] Statistiques de saison
* [ ] Historique des matchs
* [ ] Win/Loss streak
* [ ] Rangs par playlist

### Phase 4 — Profils

* [ ] Cliquer sur un joueur
* [ ] Ouvrir son profil
* [ ] Afficher son rang
* [ ] Afficher sa forme récente
* [ ] Afficher ses statistiques
* [ ] Afficher son historique

### Phase 5 — Overlay

* [ ] Fenêtre transparente
* [ ] Overlay desktop
* [ ] Positionnement au-dessus de Rocket League
* [ ] Mode interactif
* [ ] Mode non-interactif
* [ ] Gestion de la transparence
* [ ] Optimisation des performances

---

## 🚀 Installation

### Prérequis

* Node.js
* Rocket League
* Rocket League installé sur le PC
* Stats API activée

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
```

L'application sera disponible sur :

```text
http://127.0.0.1:3000
```

Le WebSocket du HUD sera disponible sur :

```text
ws://127.0.0.1:3000/rl
```

---

## 🧪 Développement

Le backend utilise un serveur Node.js personnalisé afin de pouvoir gérer simultanément :

* Next.js ;
* HTTP ;
* WebSocket du HUD ;
* WebSocket de Rocket League.

Le service Rocket League est conservé comme singleton côté serveur afin d'éviter de créer plusieurs connexions au client du jeu lors des différents cycles de développement de Next.js.

---

## 📝 Git

Les commits suivent une convention proche de **Conventional Commits**.

Exemples :

```text
feat: add Rocket League Stats API client
feat: add real-time match state management
feat: expose Rocket League state to browser
feat: add real-time match HUD
fix: handle duplicate player keys for bots
refactor: centralize Rocket League domain types
```

Les changements importants doivent être séparés en commits cohérents afin de conserver un historique facilement compréhensible.

---

## 📌 État actuel

Le pipeline principal est fonctionnel :

```text
Rocket League
      ✓
      │
      ▼
Stats API WebSocket
      ✓
      │
      ▼
RocketLeagueClient
      ✓
      │
      ▼
MatchStateManager
      ✓
      │
      ▼
Browser WebSocket
      ✓
      │
      ▼
React HUD
      ✓
```

L'étape suivante consiste à **transformer le HUD de debug actuel en composants React réutilisables et à construire l'interface visuelle définitive**, avant d'ajouter le système de profils et les données externes.
